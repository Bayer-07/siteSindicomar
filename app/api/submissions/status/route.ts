import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { formatProtocol } from "@/lib/masks";
import { getDatabase, isDatabaseConfigured } from "@/lib/db";
import { submissions } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
const protocolPattern = /^SIN-\d{8}-[A-F0-9]{6}$/i;

export async function GET(request: Request) {
  const protocol = formatProtocol(new URL(request.url).searchParams.get("protocol") ?? "");
  if (!protocolPattern.test(protocol)) return NextResponse.json({ message: "Informe um protocolo válido." }, { status: 400 });
  if (!isDatabaseConfigured()) return NextResponse.json({ message: "A consulta está temporariamente indisponível." }, { status: 503 });
  const db = getDatabase(); if (!db) return NextResponse.json({ message: "A consulta está temporariamente indisponível." }, { status: 503 });
  const rows = await db.select({ protocol: submissions.protocol, kind: submissions.kind, status: submissions.status, createdAt: submissions.createdAt, updatedAt: submissions.updatedAt }).from(submissions).where(eq(submissions.protocol, protocol)).limit(1);
  const data = rows[0];
  if (!data) return NextResponse.json({ message: "Protocolo não encontrado. Confira os dados e tente novamente." }, { status: 404 });
  return NextResponse.json({ protocol: data.protocol, kind: data.kind, status: data.status, createdAt: data.createdAt, updatedAt: data.updatedAt }, { headers: { "Cache-Control": "no-store" } });
}
