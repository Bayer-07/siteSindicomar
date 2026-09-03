import fs from "node:fs";
import process from "node:process";
import readline from "node:readline/promises";
import { randomUUID } from "node:crypto";
import pg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pg;

function loadEnv() {
  for (const filename of [".env.production.local", ".env.development.local", ".env.local", ".env"]) {
    try {
      const source = fs.readFileSync(filename, "utf8");
      for (const line of source.split(/\r?\n/)) {
        const value = line.trim(); if (!value || value.startsWith("#") || !value.includes("=")) continue;
        const separator = value.indexOf("="); process.env[value.slice(0, separator)] ??= value.slice(separator + 1).replace(/^['\"]|['\"]$/g, "");
      }
    } catch {
      // Variáveis podem vir do ambiente da hospedagem.
    }
  }
}

loadEnv();
const email = (process.env.ADMIN_EMAIL || process.argv[2] || "").trim().toLowerCase();
if (!email) throw new Error("Informe ADMIN_EMAIL.");
const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
const password = process.env.ADMIN_INITIAL_PASSWORD || await prompt.question("Senha inicial (mínimo 12 caracteres): ");
prompt.close();
if (password.length < 12) throw new Error("A senha deve ter pelo menos 12 caracteres.");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada.");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 2,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false" } : undefined,
});
const connection = await pool.connect();
try {
  const passwordHash = await bcrypt.hash(password, 12);
  await connection.query("INSERT INTO admin_users (id, email, password_hash, totp_enabled) VALUES ($1, $2, $3, false) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, failed_login_count = 0, locked_until = NULL", [randomUUID(), email, passwordHash]);
  console.log(`Administrador ${email} configurado. Execute o primeiro login para cadastrar o TOTP.`);
} finally { connection.release(); await pool.end(); }
