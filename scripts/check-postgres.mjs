import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Pool } = pg;
const TABLES = [
  "site_settings", "pages", "directors", "territories", "categories", "collective_documents",
  "document_relations", "agenda_items", "services", "partners", "posts", "submissions",
  "submission_events", "content_revisions", "audit_log", "media_files", "admin_users",
  "admin_sessions", "admin_recovery_codes", "rate_limit_buckets",
];

for (const filename of [".env.production.local", ".env.development.local", ".env.local", ".env"]) {
  try {
    const source = fs.readFileSync(path.join(process.cwd(), filename), "utf8");
    for (const line of source.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const separator = trimmed.indexOf("=");
      process.env[trimmed.slice(0, separator)] ??= trimmed.slice(separator + 1).replace(/^['"]|['"]$/g, "");
    }
  } catch {}
}

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada.");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 2,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false" } : undefined,
});
try {
  const connection = await pool.connect();
  try {
    const info = await connection.query("SELECT current_database() AS database, current_user AS user, version()");
    console.log("PostgreSQL conectado:", info.rows[0].database, "como", info.rows[0].user);
    const tables = await connection.query("SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = ANY($1::text[])", [TABLES]);
    const found = new Set(tables.rows.map((row) => row.table_name));
    const missing = TABLES.filter((table) => !found.has(table));
    if (missing.length) throw new Error("Tabelas ausentes: " + missing.join(", "));
    const extension = await connection.query("SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto'");
    if (!extension.rowCount) throw new Error("Extensão pgcrypto não instalada.");
    const migrations = await connection.query("SELECT count(*)::int AS count FROM __sindicomar_migrations");
    const alerts = await connection.query("SELECT to_regclass(current_schema() || '.alerts') AS table_name");
    if (alerts.rows[0].table_name) throw new Error("A tabela alerts não deveria existir.");
    console.log("Schema PostgreSQL válido:", TABLES.length, "tabelas,", migrations.rows[0].count, "migration(s).");
  } finally {
    connection.release();
  }
} finally {
  await pool.end();
}
