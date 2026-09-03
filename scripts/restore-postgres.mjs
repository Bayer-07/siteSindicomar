import { spawn } from "node:child_process";
import fs from "node:fs/promises";
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

const backupFile = process.env.BACKUP_FILE || process.argv[2];
const connectionString = process.env.RESTORE_DATABASE_URL || process.env.POSTGRES_ADMIN_URL || process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL;
if (!backupFile) throw new Error("Informe BACKUP_FILE ou passe o arquivo como primeiro argumento.");
if (!connectionString?.startsWith("postgres")) throw new Error("RESTORE_DATABASE_URL/DATABASE_URL PostgreSQL não configurada.");
if (process.env.CONFIRM_RESTORE !== "YES") throw new Error("Restauração destrutiva exige CONFIRM_RESTORE=YES.");
const parsed = new URL(connectionString);
const args = [
  "--clean",
  "--if-exists",
  "--no-owner",
  "--no-privileges",
  "--host=" + parsed.hostname,
  "--port=" + (parsed.port || "5432"),
  "--username=" + decodeURIComponent(parsed.username),
  "--dbname=" + decodeURIComponent(parsed.pathname.replace(/^\//, "")),
  backupFile,
];
await new Promise((resolve, reject) => {
  const child = spawn(process.env.PG_RESTORE_BIN || "pg_restore", args, {
    env: { ...process.env, PGPASSWORD: decodeURIComponent(parsed.password), PGSSLMODE: process.env.DATABASE_SSL === "true" ? "require" : "disable" },
    stdio: ["ignore", "inherit", "inherit"],
  });
  child.on("error", reject);
  child.on("exit", (code) => code === 0 ? resolve() : reject(new Error("pg_restore terminou com código " + code)));
});
console.log("Restauração PostgreSQL concluída.");
