import fs from "node:fs";
import process from "node:process";
import readline from "node:readline/promises";
import { randomUUID } from "node:crypto";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

function loadEnv() {
  if (process.env.DATABASE_URL) return;
  for (const filename of [".env.development.local", ".env.local"]) {
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
const connection = await mysql.createConnection({ uri: process.env.DATABASE_URL, timezone: "Z" });
try {
  const passwordHash = await bcrypt.hash(password, 12);
  await connection.execute("INSERT INTO admin_users (id, email, password_hash, totp_enabled) VALUES (?, ?, ?, 0) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), failed_login_count = 0, locked_until = NULL", [randomUUID(), email, passwordHash]);
  console.log(`Administrador ${email} configurado. Execute o primeiro login para cadastrar o TOTP.`);
} finally { await connection.end(); }
