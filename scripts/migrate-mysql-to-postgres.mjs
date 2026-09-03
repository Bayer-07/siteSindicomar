import { createHash } from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import mysql from "mysql2/promise";
import pg from "pg";

const { Pool } = pg;
const TABLE_ORDER = [
  "site_settings",
  "territories",
  "categories",
  "pages",
  "directors",
  "services",
  "partners",
  "collective_documents",
  "document_relations",
  "agenda_items",
  "posts",
  "submissions",
  "submission_events",
  "content_revisions",
  "audit_log",
  "media_files",
  "admin_users",
  "admin_sessions",
  "admin_recovery_codes",
  "rate_limit_buckets",
];
const JSON_COLUMNS = new Set(["value", "content", "cnaes", "details", "snapshot", "before_data", "after_data"]);
const TIMESTAMP_COLUMNS = new Set(["created_at", "updated_at", "published_at", "confirmed_at", "last_reviewed_at", "starts_at", "ends_at", "consent_at", "deleted_at", "locked_until", "mfa_verified_at", "expires_at", "last_seen_at", "used_at", "window_started_at"]);
const BOOLEAN_COLUMNS = new Set(["is_exclusive", "totp_enabled"]);
const UUID_COLUMNS = new Set([
  "site_settings.id", "territories.id", "categories.id", "pages.id", "directors.id", "services.id", "partners.id",
  "collective_documents.id", "collective_documents.category_id", "document_relations.id", "document_relations.source_document_id",
  "document_relations.related_document_id", "agenda_items.id", "agenda_items.related_document_id", "posts.id", "submissions.id",
  "submission_events.id", "submission_events.submission_id", "content_revisions.id", "content_revisions.entity_id", "audit_log.id",
  "media_files.id", "admin_users.id", "admin_sessions.id", "admin_sessions.admin_user_id", "admin_recovery_codes.id",
  "admin_recovery_codes.admin_user_id", "rate_limit_buckets.id",
]);

function loadEnv() {
  for (const filename of [".env.production.local", ".env.development.local", ".env.local", ".env"]) {
    try {
      const source = fs.readFileSync(path.join(process.cwd(), filename), "utf8");
      for (const line of source.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
        const separator = trimmed.indexOf("=");
        const key = trimmed.slice(0, separator);
        process.env[key] ??= trimmed.slice(separator + 1).replace(/^['"]|['"]$/g, "");
      }
    } catch {
      // Configuração pode vir exclusivamente do ambiente do servidor.
    }
  }
}

function quoteIdentifier(value) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) throw new Error("Identificador SQL inválido: " + value);
  return "\"" + value + "\"";
}

function normalizeValue(table, column, value) {
  if (value === undefined || value === null) return null;
  const key = table + "." + column;
  if (UUID_COLUMNS.has(key)) {
    const text = String(value).trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)) {
      throw new Error("UUID inválido em " + key + ": " + text);
    }
    return text;
  }
  if (JSON_COLUMNS.has(column)) {
    if (typeof value === "object") return value;
    try { return JSON.parse(String(value)); } catch {
      if (table === "site_settings" && column === "value") return JSON.stringify(String(value));
      throw new Error("JSON inválido em " + key);
    }
  }
  if (BOOLEAN_COLUMNS.has(column)) return value === true || value === 1 || value === "1";
  if (TIMESTAMP_COLUMNS.has(column)) {
    const raw = String(value);
    const date = value instanceof Date ? value : new Date(raw.endsWith("Z") ? raw : raw + "Z");
    if (Number.isNaN(date.getTime())) throw new Error("Data inválida em " + key);
    return date.toISOString();
  }
  return value;
}

async function listFiles(root) {
  const files = [];
  async function visit(current, relative = "") {
    const entries = await fsp.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const nextRelative = path.join(relative, entry.name);
      const next = path.join(current, entry.name);
      if (entry.isDirectory()) await visit(next, nextRelative);
      else if (entry.isFile()) files.push({ absolute: next, relative: nextRelative });
    }
  }
  await visit(root);
  return files;
}

async function sha256(file) {
  const hash = createHash("sha256");
  hash.update(await fsp.readFile(file));
  return hash.digest("hex");
}

async function copyUploads(sourceRoot, destinationRoot) {
  if (!sourceRoot || !fs.existsSync(sourceRoot)) {
    console.log("Uploads: origem não informada ou inexistente; cópia ignorada.");
    return;
  }
  if (path.resolve(sourceRoot) === path.resolve(destinationRoot)) {
    console.log("Uploads: origem e destino são iguais; cópia ignorada.");
    return;
  }
  await fsp.mkdir(destinationRoot, { recursive: true });
  const files = await listFiles(sourceRoot);
  let copied = 0;
  for (const file of files) {
    const destination = path.join(destinationRoot, file.relative);
    await fsp.mkdir(path.dirname(destination), { recursive: true });
    if (!fs.existsSync(destination)) {
      await fsp.copyFile(file.absolute, destination);
      copied += 1;
    }
    const [sourceHash, destinationHash] = await Promise.all([sha256(file.absolute), sha256(destination)]);
    if (sourceHash !== destinationHash) throw new Error("Hash divergente no upload " + file.relative);
  }
  console.log("Uploads: " + files.length + " arquivo(s) verificado(s), " + copied + " copiado(s).");
}

loadEnv();
const sourceUrl = process.env.MYSQL_SOURCE_URL || (process.env.DATABASE_URL?.startsWith("mysql") ? process.env.DATABASE_URL : "");
const destinationUrl = process.env.POSTGRES_DATABASE_URL || process.env.DATABASE_MIGRATION_URL || (process.env.DATABASE_URL?.startsWith("postgres") ? process.env.DATABASE_URL : "");
if (!sourceUrl) throw new Error("Defina MYSQL_SOURCE_URL com a conexão MySQL de origem.");
if (!destinationUrl) throw new Error("Defina POSTGRES_DATABASE_URL ou DATABASE_MIGRATION_URL com a conexão PostgreSQL de destino.");
const dryRun = process.argv.includes("--dry-run");
const skipFiles = process.argv.includes("--skip-files");

const source = await mysql.createConnection({ uri: sourceUrl, timezone: "Z", dateStrings: false });
const destinationPool = new Pool({
  connectionString: destinationUrl,
  max: 2,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false" } : undefined,
});
const destination = await destinationPool.connect();
const report = [];
try {
  await destination.query("SELECT pg_advisory_lock(hashtext('sindicomar:mysql-to-postgres'))");
  for (const table of TABLE_ORDER) {
    const [sourceColumnRows] = await source.query("SHOW COLUMNS FROM " + quoteIdentifier(table).replaceAll('"', "\`"));
    const sourceColumns = sourceColumnRows.map((row) => row.Field);
    const destinationColumnsResult = await destination.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1 ORDER BY ordinal_position",
      [table],
    );
    const destinationColumns = destinationColumnsResult.rows.map((row) => row.column_name);
    if (!destinationColumns.length) throw new Error("Tabela de destino inexistente: " + table);
    const missing = sourceColumns.filter((column) => !destinationColumns.includes(column));
    if (missing.length) throw new Error("Colunas ausentes em " + table + ": " + missing.join(", "));
    const columns = sourceColumns.filter((column) => destinationColumns.includes(column));
    const [rows] = await source.query("SELECT " + sourceColumns.map((column) => "\`" + column + "\`").join(", ") + " FROM \`" + table + "\`");
    if (!dryRun) await destination.query("BEGIN");
    try {
      for (const row of rows) {
        const values = columns.map((column) => normalizeValue(table, column, row[column]));
        const placeholders = values.map((_, index) => "$" + (index + 1)).join(", ");
        const quotedColumns = columns.map(quoteIdentifier).join(", ");
        const updates = columns.filter((column) => column !== "id").map((column) => quoteIdentifier(column) + " = EXCLUDED." + quoteIdentifier(column)).join(", ");
        if (!dryRun) {
          await destination.query(
            "INSERT INTO " + quoteIdentifier(table) + " (" + quotedColumns + ") VALUES (" + placeholders + ") ON CONFLICT (" + quoteIdentifier("id") + ") DO UPDATE SET " + updates,
            values,
          );
        }
      }
      if (!dryRun) await destination.query("COMMIT");
    } catch (error) {
      if (!dryRun) await destination.query("ROLLBACK");
      throw new Error("Falha importando " + table + ": " + (error instanceof Error ? error.message : String(error)));
    }
    const destinationCount = dryRun ? null : Number((await destination.query("SELECT count(*)::int AS count FROM " + quoteIdentifier(table))).rows[0].count);
    report.push({ table, source: rows.length, destination: destinationCount });
    console.log(table + ": origem=" + rows.length + (destinationCount === null ? "" : " destino=" + destinationCount));
  }
  if (!dryRun) {
    await destination.query("DELETE FROM admin_sessions");
    console.log("Sessões administrativas invalidadas no corte da migração.");
  }
  if (!dryRun && !skipFiles) await copyUploads(process.env.MYSQL_UPLOADS_DIR || process.env.SOURCE_UPLOADS_DIR || ".local-uploads", process.env.UPLOADS_DIR || ".local-uploads");
  if (!dryRun) {
    const orphanChecks = [
      ["document_relations", "source_document_id", "collective_documents"],
      ["document_relations", "related_document_id", "collective_documents"],
      ["submission_events", "submission_id", "submissions"],
      ["admin_sessions", "admin_user_id", "admin_users"],
      ["admin_recovery_codes", "admin_user_id", "admin_users"],
    ];
    for (const [table, column, parent] of orphanChecks) {
      const result = await destination.query(
        "SELECT count(*)::int AS count FROM " + quoteIdentifier(table) + " child LEFT JOIN " + quoteIdentifier(parent) + " parent ON parent.id = child." + quoteIdentifier(column) + " WHERE parent.id IS NULL",
      );
      if (Number(result.rows[0].count) !== 0) throw new Error("Registros órfãos encontrados em " + table + "." + column);
    }
  }
  console.log(dryRun ? "Dry-run concluído; nenhum dado foi escrito." : "Migração MySQL → PostgreSQL concluída com validações.");
  console.log(JSON.stringify(report, null, 2));
} finally {
  await destination.query("SELECT pg_advisory_unlock(hashtext('sindicomar:mysql-to-postgres'))").catch(() => {});
  destination.release();
  await destinationPool.end();
  await source.end();
}
