import { NextResponse } from "next/server";
import { destroyAdminSession } from "@/lib/auth";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin && origin !== new URL(process.env.NEXT_PUBLIC_SITE_URL ?? request.url).origin) return NextResponse.json({ message: "Origem não autorizada." }, { status: 403 });
  await destroyAdminSession();
  return NextResponse.json({ ok: true });
}
