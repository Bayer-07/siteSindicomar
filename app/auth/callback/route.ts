import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next")?.startsWith("/") ? request.nextUrl.searchParams.get("next")! : "/admin";
  return NextResponse.redirect(new URL(`/admin/login?erro=fluxo-migrado&next=${encodeURIComponent(next)}`, request.url));
}
