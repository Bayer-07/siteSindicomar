import { NextResponse } from "next/server";
import { isAuthConfigured, verifyRecoveryCode, verifyTotp } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin && origin !== new URL(process.env.NEXT_PUBLIC_SITE_URL ?? request.url).origin) return NextResponse.json({ message: "Origem não autorizada." }, { status: 403 });
  if (!isAuthConfigured()) return NextResponse.json({ message: "A autenticação ainda não foi configurada." }, { status: 503 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ message: "Dados inválidos." }, { status: 400 }); }
  const code = typeof body === "object" && body !== null && "code" in body && typeof body.code === "string" ? body.code : "";
  if (!/^\d{6}$/.test(code) && !/^[A-F0-9]{8}-[A-F0-9]{8}$/i.test(code)) return NextResponse.json({ message: "Informe o código do autenticador ou um código de recuperação." }, { status: 422 });
  const result = /^\d{6}$/.test(code) ? await verifyTotp(code) : await verifyRecoveryCode(code);
  if (!result.ok) return NextResponse.json({ message: "Código inválido ou expirado." }, { status: 401 });
  return NextResponse.json({ ok: true, recoveryCodes: result.recoveryCodes });
}
