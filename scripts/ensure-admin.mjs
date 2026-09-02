import fs from "node:fs";
import process from "node:process";
import readline from "node:readline/promises";
import { randomUUID } from "node:crypto";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

function loadEnv() {
  if (process.env.DATABASE_URL) return;
  for (const filename of [".env.production.local", ".env.development.local", ".env.local", ".env"]) {
    try {
      const source = fs.readFileSync(filename, "utf8");
      for (const line of source.split(/\r?\n/)) {
        const value = line.trim();
        if (!value || value.startsWith("#") || !value.includes("=")) continue;
        const separator = value.indexOf("=");
        process.env[value.slice(0, separator)] ??= value.slice(separator + 1).replace(/^['\"]|['\"]$/g, "");
      }
    } catch {
      // Na hospedagem, as variáveis são fornecidas pelo painel.
    }
  }
}

loadEnv();
const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
if (!email) throw new Error("Informe ADMIN_EMAIL.");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada.");

const connection = await mysql.createConnection({ uri: process.env.DATABASE_URL, timezone: "Z" });
try {
  const [rows] = await connection.execute("SELECT id FROM admin_users WHERE email = ? LIMIT 1", [email]);
  if (Array.isArray(rows) && rows.length) {
    console.log(`Administrador ${email} já existe; senha preservada.`);
  } else {
    let password = process.env.ADMIN_INITIAL_PASSWORD || "";
    if (!password && process.stdin.isTTY) {
      const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
      password = await prompt.question("Senha inicial (mínimo 12 caracteres): ");
      prompt.close();
    }
    if (password.length < 12) throw new Error("ADMIN_INITIAL_PASSWORD deve ter pelo menos 12 caracteres para criar o administrador.");

    const passwordHash = await bcrypt.hash(password, 12);
    await connection.execute("INSERT INTO admin_users (id, email, password_hash, totp_enabled) VALUES (?, ?, ?, 0)", [randomUUID(), email, passwordHash]);
    console.log(`Administrador ${email} criado. Faça o primeiro login para cadastrar o TOTP/MFA.`);
  }
} finally {
  await connection.end();
}
