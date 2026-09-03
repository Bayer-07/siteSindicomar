import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { schema } from "@/lib/db/schema";

const { Pool } = pg;

export type Database = ReturnType<typeof drizzle>;

declare global {
  var __sindicomarPostgresPool: pg.Pool | undefined;
}

function getPool() {
  if (!process.env.DATABASE_URL) return null;
  if (!globalThis.__sindicomarPostgresPool) {
    globalThis.__sindicomarPostgresPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.DB_CONNECTION_LIMIT ?? 5),
      idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS ?? 60_000),
      connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS ?? 10_000),
      keepAlive: true,
      ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false" } : undefined,
    });
    globalThis.__sindicomarPostgresPool.on("error", (error) => {
      console.error("Erro em conexão ociosa do PostgreSQL", error);
    });
  }
  return globalThis.__sindicomarPostgresPool;
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDatabase() {
  const pool = getPool();
  return pool ? drizzle({ client: pool, schema }) : null;
}

export async function closeDatabase() {
  if (globalThis.__sindicomarPostgresPool) {
    await globalThis.__sindicomarPostgresPool.end();
    globalThis.__sindicomarPostgresPool = undefined;
  }
}
