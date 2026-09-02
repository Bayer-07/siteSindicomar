import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getVerifiedAdmin } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { mediaFiles } from "@/lib/db/schema";
import { fileHash, hasAllowedExtension, hasExpectedSignature, IMAGE_LIMIT, IMAGE_TYPES, PDF_LIMIT, publicMediaUrl, safeFilename, saveMedia, removeMedia } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sameOrigin(request: Request) { const origin = request.headers.get("origin"); return !origin || origin === new URL(request.url).origin || origin === new URL(process.env.NEXT_PUBLIC_SITE_URL ?? request.url).origin; }

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ message: "Origem não autorizada." }, { status: 403 });
  const admin = await getVerifiedAdmin(); const db = getDatabase();
  if (!admin) return NextResponse.json({ message: "Sessão expirada." }, { status: 401 });
  if (!db) return NextResponse.json({ message: "Banco indisponível." }, { status: 503 });
  const form = await request.formData(); const file = form.get("file"); const kind = form.get("kind");
  if (!(file instanceof File) || typeof kind !== "string" || !["image", "document"].includes(kind)) return NextResponse.json({ message: "Arquivo inválido." }, { status: 422 });
  const isDocument = kind === "document";
  const allowed = isDocument ? file.type === "application/pdf" : IMAGE_TYPES.includes(file.type as (typeof IMAGE_TYPES)[number]);
  const limit = isDocument ? PDF_LIMIT : IMAGE_LIMIT;
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!allowed || !hasAllowedExtension(file.name, file.type) || file.size > limit || !hasExpectedSignature(buffer, file.type)) return NextResponse.json({ message: isDocument ? "O arquivo deve ser um PDF de até 20 MB." : "A imagem deve ser JPG, PNG, WEBP ou AVIF de até 10 MB." }, { status: 422 });
  const cleanName = safeFilename(file.name);
  const extension = cleanName.includes(".") ? cleanName.split(".").pop()?.toLowerCase() : (isDocument ? "pdf" : "bin");
  const storageKey = `${isDocument ? "documents" : "images"}/${randomUUID()}-${cleanName.slice(0, 100)}${extension && !cleanName.endsWith(`.${extension}`) ? `.${extension}` : ""}`;
  try {
    await saveMedia(storageKey, buffer);
    await db.insert(mediaFiles).values({ id: randomUUID(), storageKey, originalFilename: file.name, mimeType: file.type, byteSize: file.size, sha256: fileHash(buffer), kind, visibility: "private", createdAt: new Date() });
    return NextResponse.json({ storageKey, url: publicMediaUrl(storageKey), filename: file.name, mimeType: file.type, size: file.size });
  } catch (error) {
    await removeMedia(storageKey);
    return NextResponse.json({ message: error instanceof Error ? error.message : "Não foi possível salvar o arquivo." }, { status: 422 });
  }
}
