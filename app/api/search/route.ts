import { NextRequest, NextResponse } from "next/server";
import { searchPublishedContent } from "@/lib/content";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  if (query.trim().length < 2) return NextResponse.json({ results: [] });
  return NextResponse.json({ results: searchPublishedContent(query) }, { headers: { "cache-control": "public, max-age=60, stale-while-revalidate=300" } });
}
