import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import process from "node:process";
import mysql from "mysql2/promise";

function loadLocalEnv() {
  if (process.env.DATABASE_URL) return;
  for (const filename of [".env.development.local", ".env.local"]) {
    try {
      const source = requireEnvFile(path.join(process.cwd(), filename));
      for (const [key, value] of Object.entries(source)) process.env[key] ??= value;
    } catch {
      // In the hosted environment variables are supplied by the control panel.
    }
  }
}

function requireEnvFile(file) {
  const source = fsSync.readFileSync(file, "utf8");
  return Object.fromEntries(source.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#") && line.includes("=")).map((line) => {
    const separator = line.indexOf("=");
    return [line.slice(0, separator), line.slice(separator + 1).replace(/^['\"]|['\"]$/g, "")];
  }));
}

loadLocalEnv();
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada.");

const sql = await fs.readFile(path.join(process.cwd(), "drizzle", "0000_hostinger_mysql.sql"), "utf8");
const statements = sql.split(/;\s*(?:\r?\n|$)/).map((statement) => statement.trim()).filter(Boolean);
const connection = await mysql.createConnection({ uri: process.env.DATABASE_URL, timezone: "Z", multipleStatements: false });
try {
  for (const statement of statements) await connection.query(statement);
  console.log(`Migração MySQL concluída: ${statements.length} instruções.`);
} finally {
  await connection.end();
}
