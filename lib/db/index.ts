import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { schema } from "@/lib/db/schema";

export type Database = ReturnType<typeof drizzle>;

declare global {
  var __sindicomarMysqlPool: mysql.Pool | undefined;
}

function getPool() {
  if (!process.env.DATABASE_URL) return null;
  if (!globalThis.__sindicomarMysqlPool) {
    const parsed = new URL(process.env.DATABASE_URL);
    globalThis.__sindicomarMysqlPool = mysql.createPool({
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : 3306,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, ""),
      connectionLimit: Number(process.env.DB_CONNECTION_LIMIT ?? 5),
      waitForConnections: true,
      maxIdle: Number(process.env.DB_MAX_IDLE ?? 5),
      idleTimeout: 60_000,
      enableKeepAlive: true,
      timezone: "Z",
      decimalNumbers: true,
    });
  }
  return globalThis.__sindicomarMysqlPool;
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDatabase() {
  const pool = getPool();
  return pool ? drizzle(pool, { schema, mode: "default" }) : null;
}

export async function closeDatabase() {
  if (globalThis.__sindicomarMysqlPool) {
    await globalThis.__sindicomarMysqlPool.end();
    globalThis.__sindicomarMysqlPool = undefined;
  }
}
