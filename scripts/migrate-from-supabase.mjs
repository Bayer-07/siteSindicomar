import crypto from "node:crypto";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

function loadEnv() {
  const file = path.join(process.cwd(), ".env.local");
  if (!fsSync.existsSync(file)) return;
  for (const line of fsSync.readFileSync(file, "utf8").split(/\r?\n/)) {
    const value = line.trim(); if (!value || value.startsWith("#") || !value.includes("=")) continue;
    const separator = value.indexOf("="); process.env[value.slice(0, separator)] ??= value.slice(separator + 1).replace(/^['\"]|['\"]$/g, "");
  }
}

loadEnv();
for (const name of ["DATABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) if (!process.env[name]) throw new Error(`${name} não configurada.`);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const connection = await mysql.createConnection({ uri: process.env.DATABASE_URL, timezone: "Z" });
const uploadsRoot = path.resolve(process.env.UPLOADS_DIR || path.join(process.cwd(), "var", "uploads"));
const tableOrder = ["site_settings", "pages", "directors", "territories", "categories", "collective_documents", "document_relations", "agenda_items", "services", "partners", "posts", "submissions", "submission_events", "content_revisions", "audit_log"];
const storageFields = [{ table: "collective_documents", field: "storage_path", bucket: "public-documents", kind: "document" }, { table: "posts", field: "cover_image_path", bucket: "public-images", kind: "image" }, { table: "partners", field: "logo_path", bucket: "public-images", kind: "image" }, { table: "directors", field: "photo_path", bucket: "public-images", kind: "image" }];
const copied = new Map();
const dateTimeFields = new Set(["created_at", "updated_at", "published_at", "confirmed_at", "last_reviewed_at", "starts_at", "ends_at", "consent_at"]);
const dateFields = new Set(["valid_from", "valid_until", "mandate_start", "mandate_end"]);

async function supabaseRequest(endpoint, options = {}) {
  const response = await fetch(`${supabaseUrl}${endpoint}`, { ...options, headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, ...(options.headers || {}) } });
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${await response.text()}`);
  return response;
}

async function fetchRows(table) {
  const response = await supabaseRequest(`/rest/v1/${table}?select=*`);
  return response.json();
}

async function targetColumns(table) {
  const [rows] = await connection.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?", [table]);
  return new Set(rows.map((row) => row.COLUMN_NAME));
}

function sqlValue(column, value) {
  if (dateTimeFields.has(column) && value) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 23).replace("T", " ");
  }
  if (dateFields.has(column) && value) {
    const date = new Date(`${value}T00:00:00Z`);
    if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  }
  if (value && typeof value === "object") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? 1 : 0;
  return value ?? null;
}

async function insertRows(table, rows) {
  if (!rows.length) return;
  const columns = await targetColumns(table);
  for (const original of rows) {
    const row = Object.fromEntries(Object.entries(original).filter(([key]) => columns.has(key)));
    if (!row.id) row.id = crypto.randomUUID();
    const keys = Object.keys(row);
    const updates = keys.filter((key) => key !== "id").map((key) => `\`${key}\` = VALUES(\`${key}\`)`).join(", ");
    await connection.execute(`INSERT INTO \`${table}\` (${keys.map((key) => `\`${key}\``).join(", ")}) VALUES (${keys.map(() => "?").join(", ")}) ON DUPLICATE KEY UPDATE ${updates || "id = id"}`, keys.map((key) => sqlValue(key, row[key])));
  }
  console.log(`${table}: ${rows.length} registros importados`);
}

function safeStorageKey(bucket, originalPath) { return `${bucket}/${originalPath}`.replaceAll("\\", "/"); }
function safeFilePath(storageKey) {
  const normalized = storageKey.replaceAll("\\", "/");
  if (!normalized || normalized.split("/").some((part) => !part || part === "." || part === "..")) throw new Error(`Caminho de storage inválido: ${storageKey}`);
  const resolved = path.resolve(uploadsRoot, normalized);
  if (!resolved.startsWith(`${uploadsRoot}${path.sep}`)) throw new Error(`Caminho de storage inválido: ${storageKey}`);
  return resolved;
}

async function copyObject(bucket, originalPath, kind, visibility) {
  const key = safeStorageKey(bucket, originalPath);
  if (copied.has(key)) return copied.get(key);
  const response = await supabaseRequest(`/storage/v1/object/${bucket}/${originalPath.split("/").map(encodeURIComponent).join("/")}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const target = safeFilePath(key);
  await fs.mkdir(path.dirname(target), { recursive: true });
  try { await fs.writeFile(target, buffer, { flag: "wx" }); } catch (error) { if (error?.code !== "EEXIST") throw error; }
  const mimeType = response.headers.get("content-type") || (kind === "document" ? "application/pdf" : "application/octet-stream");
  const [rows] = await connection.query("SELECT id FROM media_files WHERE storage_key = ? LIMIT 1", [key]);
  if (!rows.length) await connection.execute("INSERT INTO media_files (id, storage_key, original_filename, mime_type, byte_size, sha256, kind, visibility) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [crypto.randomUUID(), key, path.basename(originalPath), mimeType, buffer.length, crypto.createHash("sha256").update(buffer).digest("hex"), kind, visibility]);
  copied.set(key, key);
  console.log(`arquivo: ${bucket}/${originalPath} -> ${key}`);
  return key;
}

for (const table of tableOrder) {
  const rows = await fetchRows(table);
  await insertRows(table, rows);
}

for (const spec of storageFields) {
  const rows = await fetchRows(spec.table);
  for (const row of rows) {
    if (!row[spec.field]) continue;
    try {
      const key = await copyObject(spec.bucket, row[spec.field], spec.kind, row.status === "published" ? "public" : "private");
      await connection.execute(`UPDATE \`${spec.table}\` SET \`${spec.field}\` = ? WHERE id = ?`, [key, row.id]);
    } catch (error) { console.warn(`arquivo não migrado (${spec.table}/${row.id}): ${error instanceof Error ? error.message : String(error)}`); }
  }
}

await connection.end();
console.log("Migração Supabase -> MySQL concluída. Mantenha o projeto de origem somente para rollback até a validação final.");
