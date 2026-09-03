import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

async function loadEnv() {
  for (const filename of [".env.production.local", ".env.development.local", ".env.local", ".env"]) {
    try {
      const source = await fs.readFile(filename, "utf8");
      for (const line of source.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
        const separator = trimmed.indexOf("=");
        process.env[trimmed.slice(0, separator)] ??= trimmed.slice(separator + 1).replace(/^['"]|['"]$/g, "");
      }
    } catch {}
  }
}

await loadEnv();
const connectionString = process.env.POSTGRES_ADMIN_URL || process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL;
if (!connectionString?.startsWith("postgres")) throw new Error("DATABASE_URL PostgreSQL não configurada.");
const parsed = new URL(connectionString);
const backupDir = path.resolve(process.env.POSTGRES_BACKUP_DIR || "backups");
await fs.mkdir(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const output = path.join(backupDir, "sindicomar-" + stamp + ".dump");
const args = [
  "--format=custom",
  "--no-owner",
  "--no-privileges",
  "--file=" + output,
  "--host=" + parsed.hostname,
  "--port=" + (parsed.port || "5432"),
  "--username=" + decodeURIComponent(parsed.username),
  "--dbname=" + decodeURIComponent(parsed.pathname.replace(/^\//, "")),
];
await new Promise((resolve, reject) => {
  const child = spawn(process.env.PG_DUMP_BIN || "pg_dump", args, {
    env: { ...process.env, PGPASSWORD: decodeURIComponent(parsed.password), PGSSLMODE: process.env.DATABASE_SSL === "true" ? "require" : "disable" },
    stdio: ["ignore", "inherit", "inherit"],
  });
  child.on("error", reject);
  child.on("exit", (code) => code === 0 ? resolve() : reject(new Error("pg_dump terminou com código " + code)));
});
console.log("Backup PostgreSQL criado:", output);
