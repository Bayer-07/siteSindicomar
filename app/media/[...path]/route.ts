import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getVerifiedAdmin } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { mediaFiles } from "@/lib/db/schema";
import { safeStoragePath, statMedia } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const segments = (await params).path ?? [];
  let storageKey: string;
  try { storageKey = segments.join("/"); safeStoragePath(storageKey); } catch { return NextResponse.json({ message: "Arquivo inválido." }, { status: 400 }); }
  const db = getDatabase();
  if (!db) return NextResponse.json({ message: "Armazenamento indisponível." }, { status: 503 });
  const rows = await db.select().from(mediaFiles).where(eq(mediaFiles.storageKey, storageKey)).limit(1);
  const media = rows[0];
  if (!media || media.deletedAt) return NextResponse.json({ message: "Arquivo não encontrado." }, { status: 404 });
  if (media.visibility !== "public" && !(await getVerifiedAdmin())) return NextResponse.json({ message: "Arquivo não encontrado." }, { status: 404 });
  try {
    const info = await statMedia(storageKey);
    const stream = Readable.toWeb(createReadStream(safeStoragePath(storageKey).resolved)) as unknown as ReadableStream;
    const isPublic = media.visibility === "public";
    return new NextResponse(stream, { headers: { "content-type": media.mimeType, "content-length": String(info.size), "cache-control": isPublic ? "public, max-age=3600, stale-while-revalidate=86400" : "private, no-store", "content-disposition": "inline" } });
  } catch { return NextResponse.json({ message: "Arquivo não encontrado." }, { status: 404 }); }
}
