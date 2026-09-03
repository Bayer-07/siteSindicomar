import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Pool } = pg;

function loadLocalEnv() {
  for (const filename of [".env.production.local", ".env.development.local", ".env.local", ".env"]) {
    try {
      const source = fs.readFileSync(path.join(process.cwd(), filename), "utf8");
      for (const line of source.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
        const separator = trimmed.indexOf("=");
        const key = trimmed.slice(0, separator);
        const value = trimmed.slice(separator + 1).replace(/^['"]|['"]$/g, "");
        process.env[key] ??= value;
      }
    } catch {
      // No ambiente hospedado, as variáveis vêm do painel/serviço.
    }
  }
}

function connectionOptions() {
  return {
    connectionString: process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL,
    max: Number(process.env.DB_MIGRATION_CONNECTION_LIMIT ?? 2),
    connectionTimeoutMillis: 10_000,
    ssl: process.env.DATABASE_SSL === "true"
      ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false" }
      : undefined,
  };
}

loadLocalEnv();
if (!process.env.DATABASE_MIGRATION_URL && !process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL ou DATABASE_MIGRATION_URL não configurada.");
}

const migrationsDir = path.join(process.cwd(), "drizzle");
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter((file) => /^\d+_.+\.sql$/.test(file))
  .sort();
if (!migrationFiles.length) throw new Error("Nenhuma migration PostgreSQL encontrada em drizzle/.");

const pool = new Pool(connectionOptions());
const client = await pool.connect();
try {
  await client.query("SELECT pg_advisory_lock(hashtext('sindicomar:drizzle-migrations'))");
  await client.query(
    "CREATE TABLE IF NOT EXISTS __sindicomar_migrations (" +
      "id varchar(190) PRIMARY KEY, " +
      "applied_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP" +
    ")",
  );
  if (process.env.POSTGRES_APP_USER && /^[A-Za-z_][A-Za-z0-9_]*$/.test(process.env.POSTGRES_APP_USER)) {
    try {
      await client.query("GRANT SELECT ON __sindicomar_migrations TO \"" + process.env.POSTGRES_APP_USER + "\"");
      await client.query("GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO \"" + process.env.POSTGRES_APP_USER + "\"");
      await client.query("GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO \"" + process.env.POSTGRES_APP_USER + "\"");
    } catch (error) {
      console.warn("Aviso: não foi possível atualizar privilégios da aplicação:", error instanceof Error ? error.message : String(error));
    }
  }
  const appliedResult = await client.query("SELECT id FROM __sindicomar_migrations");
  const applied = new Set(appliedResult.rows.map((row) => row.id));

  for (const filename of migrationFiles) {
    if (applied.has(filename)) continue;
    const source = fs.readFileSync(path.join(migrationsDir, filename), "utf8");
    const statements = source
      .split(/-->\s*statement-breakpoint/)
      .map((statement) => statement.trim())
      .filter(Boolean);
    await client.query("BEGIN");
    try {
      for (const statement of statements) await client.query(statement);
      await client.query("INSERT INTO __sindicomar_migrations (id) VALUES ($1)", [filename]);
      await client.query("COMMIT");
      console.log("Migration aplicada: " + filename + " (" + statements.length + " instruções).");
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error("Falha na migration " + filename + ": " + (error instanceof Error ? error.message : String(error)));
    }
  }
  console.log("PostgreSQL pronto. " + migrationFiles.length + " migration(s) verificadas.");
} finally {
  await client.query("SELECT pg_advisory_unlock(hashtext('sindicomar:drizzle-migrations'))").catch(() => {});
  client.release();
  await pool.end();
}
