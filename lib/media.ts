import { createHash } from "node:crypto";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export const IMAGE_LIMIT = 10 * 1024 * 1024;
export const PDF_LIMIT = 20 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
const extensionsByMime: Record<string, string[]> = { "application/pdf": ["pdf"], "image/jpeg": ["jpg", "jpeg"], "image/png": ["png"], "image/webp": ["webp"], "image/avif": ["avif"] };

export function uploadsRoot() { return path.resolve(/*turbopackIgnore: true*/ process.env.UPLOADS_DIR || path.join(process.cwd(), "var", "uploads")); }

export function safeStoragePath(storageKey: string) {
  if (!storageKey || storageKey.includes("\0") || path.isAbsolute(storageKey)) throw new Error("Caminho de arquivo inválido.");
  const normalized = storageKey.replaceAll("\\", "/");
  if (normalized.split("/").some((part) => part === ".." || part === "." || !part)) throw new Error("Caminho de arquivo inválido.");
  const root = uploadsRoot();
  const resolved = path.resolve(root, normalized);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) throw new Error("Caminho de arquivo inválido.");
  return { normalized, resolved };
}

export function publicMediaUrl(storageKey: string) { return `/media/${storageKey.split("/").map(encodeURIComponent).join("/")}`; }
export function safeFilename(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "arquivo"; }
export function hasAllowedExtension(filename: string, mimeType: string) { const extension = filename.split(".").pop()?.toLowerCase() ?? ""; return Boolean(extension && extensionsByMime[mimeType]?.includes(extension)); }
export function fileHash(buffer: Buffer) { return createHash("sha256").update(buffer).digest("hex"); }
export function hasExpectedSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === "application/pdf") return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  if (mimeType === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimeType === "image/webp") return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  if (mimeType === "image/avif") return buffer.subarray(4, 12).toString("ascii").includes("ftyp") || buffer.subarray(8, 12).toString("ascii") === "avif";
  return false;
}

export async function saveMedia(storageKey: string, buffer: Buffer) {
  const target = safeStoragePath(storageKey);
  await mkdir(path.dirname(target.resolved), { recursive: true });
  await writeFile(target.resolved, buffer, { flag: "wx" });
  return target;
}

export async function removeMedia(storageKey: string) { const target = safeStoragePath(storageKey); await unlink(target.resolved).catch(() => undefined); }
export async function statMedia(storageKey: string) { const target = safeStoragePath(storageKey); return stat(/*turbopackIgnore: true*/ target.resolved); }
