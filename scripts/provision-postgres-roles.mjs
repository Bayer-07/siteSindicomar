import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Pool } = pg;
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
const adminUrl = process.env.POSTGRES_ADMIN_URL || process.env.DATABASE_URL;
const appUser = process.env.POSTGRES_APP_USER || "sindicomar_app";
const appPassword = process.env.POSTGRES_APP_PASSWORD;
const migrationUser = process.env.POSTGRES_MIGRATION_USER || "sindicomar_migration";
const migrationPassword = process.env.POSTGRES_MIGRATION_PASSWORD;
if (!adminUrl?.startsWith("postgres")) throw new Error("POSTGRES_ADMIN_URL/DATABASE_URL PostgreSQL não configurada.");
if (!appPassword || !migrationPassword) throw new Error("Defina POSTGRES_APP_PASSWORD e POSTGRES_MIGRATION_PASSWORD.");
function identifier(value) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) throw new Error("Nome de role inválido.");
  return "\"" + value + "\"";
}
function literal(value) { return "'" + String(value).replaceAll("'", "''") + "'"; }
const parsed = new URL(adminUrl);
const pool = new Pool({
  connectionString: adminUrl,
  max: 1,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false" } : undefined,
});
const client = await pool.connect();
try {
  const dbName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  // pgcrypto is required by the UUID defaults in the initial migration and
  // must be installed by the database administrator before the restricted
  // migration role runs Drizzle migrations.
  await client.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");
  for (const [role, password] of [[appUser, appPassword], [migrationUser, migrationPassword]]) {
    const exists = await client.query("SELECT 1 FROM pg_roles WHERE rolname = $1", [role]);
    if (!exists.rowCount) await client.query("CREATE ROLE " + identifier(role) + " LOGIN PASSWORD " + literal(password));
    else await client.query("ALTER ROLE " + identifier(role) + " LOGIN PASSWORD " + literal(password));
    await client.query("GRANT CONNECT ON DATABASE " + identifier(dbName) + " TO " + identifier(role));
  }
  // Existing databases may have been initialized with the application role.
  // Transfer ownership so the restricted migration role can apply structural
  // migrations without granting it superuser privileges.
  const publicTables = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
  for (const row of publicTables.rows) {
    const tableName = identifier(row.tablename);
    await client.query("ALTER TABLE public." + tableName + " OWNER TO " + identifier(migrationUser));
  }
  const publicSequences = await client.query("SELECT sequencename FROM pg_sequences WHERE schemaname = 'public'");
  for (const row of publicSequences.rows) {
    const sequenceName = identifier(row.sequencename);
    await client.query("ALTER SEQUENCE public." + sequenceName + " OWNER TO " + identifier(migrationUser));
  }
  await client.query("ALTER FUNCTION public.sindicomar_set_updated_at() OWNER TO " + identifier(migrationUser)).catch(() => {});
  await client.query("GRANT USAGE ON SCHEMA public TO " + identifier(appUser) + ", " + identifier(migrationUser));
  await client.query("REVOKE CREATE ON SCHEMA public FROM " + identifier(appUser));
  await client.query("GRANT CREATE ON SCHEMA public TO " + identifier(migrationUser));
  await client.query("GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO " + identifier(appUser));
  await client.query("GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO " + identifier(migrationUser));
  await client.query("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO " + identifier(appUser));
  await client.query("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO " + identifier(migrationUser));
  console.log("Roles PostgreSQL configuradas:", appUser, "e", migrationUser);
} finally {
  client.release();
  await pool.end();
}
