import { NextResponse } from "next/server";
import { authenticateAdmin, consumeLoginRateLimit, createAdminSession, isAuthConfigured } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin || origin === new URL(process.env.NEXT_PUBLIC_SITE_URL ?? request.url).origin;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ message: "Origem não autorizada." }, { status: 403 });
  if (!isDatabaseConfigured() || !isAuthConfigured()) return NextResponse.json({ message: "O acesso administrativo ainda não foi configurado." }, { status: 503 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ message: "Dados inválidos." }, { status: 400 }); }
  const password = typeof body === "object" && body !== null && "password" in body && typeof body.password === "string" ? body.password : "";
  if (password.length < 8) return NextResponse.json({ message: "Informe a senha do administrador." }, { status: 422 });
  const remoteIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  if (!(await consumeLoginRateLimit(remoteIp))) return NextResponse.json({ message: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
  const result = await authenticateAdmin(password);
  if (!result.ok) {
    const status = result.reason === "locked" ? 429 : result.reason === "not_configured" ? 503 : 401;
    return NextResponse.json({ message: result.reason === "locked" ? "Muitas tentativas. Aguarde alguns minutos." : "Senha inválida." }, { status });
  }
  await createAdminSession(result.user.id);
  return NextResponse.json({ ok: true, mfaRequired: true, setupRequired: !result.user.totpEnabled });
}
