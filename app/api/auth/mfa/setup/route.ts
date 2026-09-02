import { NextResponse } from "next/server";
import { getAdminSession, getMfaSetupState, isAuthConfigured, setupTotp } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin && origin !== new URL(process.env.NEXT_PUBLIC_SITE_URL ?? request.url).origin) return NextResponse.json({ message: "Origem não autorizada." }, { status: 403 });
  if (!isAuthConfigured()) return NextResponse.json({ message: "A autenticação ainda não foi configurada." }, { status: 503 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ message: "Sessão expirada." }, { status: 401 });
  const state = await getMfaSetupState();
  if (!state) return NextResponse.json({ message: "Não foi possível carregar o MFA." }, { status: 503 });
  if (state.enabled) return NextResponse.json({ enabled: true });
  const setup = await setupTotp();
  if (!setup) return NextResponse.json({ message: "Não foi possível iniciar o MFA." }, { status: 503 });
  return NextResponse.json({ enabled: false, qrCode: setup.qrCode, secret: setup.secret });
}
