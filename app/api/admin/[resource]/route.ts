import { randomUUID } from "node:crypto";
import { and, eq, max } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getVerifiedAdmin } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { optionValues } from "@/lib/admin-options";
import { agendaItems, auditLog, collectiveDocuments, contentRevisions, directors, pages, partners, posts, services, siteSettings, submissions, submissionEvents, mediaFiles } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const resources = { documentos: collectiveDocuments, agenda: agendaItems, noticias: posts, conteudo: pages, servicos: services, institucional: directors, parceiros: partners, configuracoes: siteSettings, solicitacoes: submissions } as const;
type Resource = keyof typeof resources;
type InputRecord = Record<string, unknown>;

const fieldMap: Record<Resource, Record<string, string>> = {
  documentos: { slug: "slug", title: "title", summary: "summary", municipality: "municipality", category_id: "categoryId", category_label: "categoryLabel", year: "year", document_type: "documentType", document_status: "documentStatus", valid_from: "validFrom", valid_until: "validUntil", base_date: "baseDate", labor_union: "laborUnion", mte_registration: "mteRegistration", last_reviewed_at: "lastReviewedAt", official_source: "officialSource", storage_path: "storagePath", original_filename: "originalFilename", mime_type: "mimeType", file_size_bytes: "fileSizeBytes", version_number: "versionNumber", status: "status", published_at: "publishedAt" },
  agenda: { slug: "slug", title: "title", description: "description", starts_at: "startsAt", ends_at: "endsAt", municipality: "municipality", agenda_type: "agendaType", agenda_status: "agendaStatus", related_document_id: "relatedDocumentId", location: "location", registration_url: "registrationUrl", status: "status", published_at: "publishedAt" },
  noticias: { slug: "slug", title: "title", excerpt: "excerpt", content: "content", category: "category", author_name: "authorName", source_url: "sourceUrl", cover_image_path: "coverImagePath", status: "status", published_at: "publishedAt" },
  conteudo: { slug: "slug", title: "title", excerpt: "excerpt", content: "content", seo_title: "seoTitle", seo_description: "seoDescription", status: "status", published_at: "publishedAt" },
  servicos: { slug: "slug", title: "title", excerpt: "excerpt", content: "content", category: "category", eligibility: "eligibility", is_exclusive: "isExclusive", partner_name: "partnerName", valid_until: "validUntil", contact_url: "contactUrl", status: "status", published_at: "publishedAt" },
  institucional: { name: "name", role: "role", bio: "bio", photo_path: "photoPath", mandate_start: "mandateStart", mandate_end: "mandateEnd", display_order: "displayOrder", status: "status" },
  parceiros: { name: "name", description: "description", logo_path: "logoPath", website_url: "websiteUrl", valid_from: "validFrom", valid_until: "validUntil", display_order: "displayOrder", status: "status" },
  configuracoes: { key: "key", value: "value" },
  solicitacoes: { status: "status" },
};

const dateFields = new Set(["last_reviewed_at", "starts_at", "ends_at", "published_at", "confirmed_at", "consent_at"]);
const allowedValues: Record<string, Set<string>> = {
  status: new Set(optionValues.status),
  submissionStatus: new Set(optionValues.submissionStatus),
  documentStatus: new Set(optionValues.documentStatus),
  documentType: new Set(optionValues.documentType),
  agendaType: new Set(optionValues.agendaType),
  agendaStatus: new Set(optionValues.agendaStatus),
  category: new Set(optionValues.category),
};

const requiredFields: Partial<Record<Resource, string[]>> = {
  documentos: ["slug", "title", "municipality", "categoryLabel", "year", "documentType", "documentStatus", "lastReviewedAt"],
  agenda: ["slug", "title", "startsAt", "municipality", "agendaType", "agendaStatus"],
  noticias: ["slug", "title", "excerpt", "content", "category", "authorName"],
  conteudo: ["slug", "title", "content"],
  servicos: ["slug", "title", "content", "category"],
  institucional: ["name", "role"],
  parceiros: ["name"],
  configuracoes: ["key", "value"],
  solicitacoes: ["status"],
};

const maxLengths: Record<string, number> = {
  slug: 190, title: 255, name: 255, role: 255, summary: 65535, excerpt: 65535, municipality: 255,
  categoryLabel: 255, category: 255, baseDate: 100, laborUnion: 255, mteRegistration: 100, officialSource: 255,
  description: 65535, bio: 65535, eligibility: 65535, partnerName: 255, websiteUrl: 500, validFrom: 10,
  validUntil: 10, sourceUrl: 500, seoTitle: 255, seoDescription: 65535, key: 190, storagePath: 500,
  originalFilename: 255, mimeType: 100,
};
const datePayloadFields = new Set(["lastReviewedAt", "startsAt", "endsAt", "publishedAt", "confirmedAt", "consentAt", "validFrom", "validUntil", "mandateStart", "mandateEnd"]);
const fieldLabels: Record<string, string> = {
  slug: "slug", title: "título", name: "nome", role: "cargo", municipality: "município", categoryLabel: "categoria",
  year: "ano", documentType: "tipo", documentStatus: "situação do instrumento", lastReviewedAt: "última conferência",
  startsAt: "início", agendaType: "tipo", agendaStatus: "situação", excerpt: "resumo", category: "categoria",
  authorName: "autor", content: "conteúdo", status: "publicação", key: "chave", value: "valor da configuração",
};

function validResource(value: string): value is Resource { return value in resources; }
function sameOrigin(request: Request) { const origin = request.headers.get("origin"); return !origin || origin === new URL(request.url).origin || origin === new URL(process.env.NEXT_PUBLIC_SITE_URL ?? request.url).origin; }
function normalizeValue(key: string, value: unknown) {
  if (value === "") return null;
  if (dateFields.has(key) && typeof value === "string" && value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new Error(`Data inválida para ${key}.`);
    return date;
  }
  return value;
}
function toDbPayload(resource: Resource, input: InputRecord) {
  const result: Record<string, unknown> = {};
  for (const [wireKey, dbKey] of Object.entries(fieldMap[resource])) if (Object.prototype.hasOwnProperty.call(input, wireKey)) result[dbKey] = normalizeValue(wireKey, input[wireKey]);
  if (resource === "configuracoes" && typeof result.value === "string") {
    try { result.value = JSON.parse(result.value); } catch { throw new Error("O valor da configuração deve ser um JSON válido."); }
  }
  if (resource === "servicos" && typeof result.isExclusive === "string") result.isExclusive = result.isExclusive === "true";
  return result;
}

function validatePayload(resource: Resource, payload: Record<string, unknown>, partial = false) {
  const selectFields = resource === "documentos"
    ? [["status", "status"], ["documentStatus", "documentStatus"], ["documentType", "documentType"]]
    : resource === "agenda"
      ? [["status", "status"], ["agendaType", "agendaType"], ["agendaStatus", "agendaStatus"]]
      : resource === "servicos"
        ? [["status", "status"], ["category", "category"]]
        : resource === "solicitacoes"
          ? [["status", "submissionStatus"]]
          : [["status", "status"]];

  if (!partial) {
    for (const field of requiredFields[resource] ?? []) {
      const value = payload[field];
      if (value === undefined || value === null || (typeof value === "string" && !value.trim())) return `Preencha o campo ${fieldLabels[field] ?? field}.`;
    }
  }

  for (const [field, allowedField] of selectFields) {
    const value = payload[field];
    if (value !== undefined && value !== null && (typeof value !== "string" || !allowedValues[allowedField]?.has(value))) return `Valor inválido para ${field}.`;
  }

  for (const field of ["slug"]) {
    const value = payload[field];
    if (typeof value === "string" && value && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) return "O slug deve conter apenas letras minúsculas, números e hífens.";
  }

  for (const [field, maxLength] of Object.entries(maxLengths)) {
    const value = payload[field];
    const effectiveMaxLength = resource === "servicos" && field === "category" ? 32 : maxLength;
    if (typeof value === "string" && value.length > effectiveMaxLength) return `O campo ${fieldLabels[field] ?? field} ultrapassa o limite permitido.`;
  }

  for (const field of datePayloadFields) {
    const value = payload[field];
    if (value instanceof Date && Number.isNaN(value.getTime())) return `Data inválida para ${field}.`;
    if (typeof value === "string" && value && Number.isNaN(Date.parse(value))) return `Data inválida para ${field}.`;
  }

  for (const field of ["year", "displayOrder", "fileSizeBytes", "versionNumber"]) {
    const value = payload[field];
    if (value !== undefined && value !== null && (typeof value !== "number" || !Number.isFinite(value))) return `Valor numérico inválido para ${field}.`;
  }
  if (payload.year !== undefined && payload.year !== null && (!Number.isInteger(payload.year) || Number(payload.year) < 1900 || Number(payload.year) > 2200)) return "O ano deve ser um número inteiro entre 1900 e 2200.";
  if (payload.displayOrder !== undefined && payload.displayOrder !== null && (!Number.isInteger(payload.displayOrder) || Number(payload.displayOrder) < 0)) return "A ordem deve ser um número inteiro maior ou igual a zero.";
  if (payload.fileSizeBytes !== undefined && payload.fileSizeBytes !== null && Number(payload.fileSizeBytes) < 0) return "O tamanho do arquivo não pode ser negativo.";
  if (payload.versionNumber !== undefined && payload.versionNumber !== null && (!Number.isInteger(payload.versionNumber) || Number(payload.versionNumber) < 1)) return "A versão deve ser um número inteiro positivo.";
  if (payload.isExclusive !== undefined && payload.isExclusive !== null && typeof payload.isExclusive !== "boolean") return "Valor inválido para benefício exclusivo.";

  for (const field of ["content"]) {
    const value = payload[field];
    if (value !== undefined && value !== null && (typeof value !== "object" || Array.isArray(value))) return `Valor inválido para ${field}.`;
  }

  if (["noticias", "conteudo", "servicos"].includes(resource) && payload.content && !hasTextContent(payload.content)) return "Preencha o conteúdo antes de salvar.";

  return null;
}

function hasTextContent(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const node = value as { text?: unknown; content?: unknown };
  if (typeof node.text === "string" && node.text.trim()) return true;
  return Array.isArray(node.content) && node.content.some(hasTextContent);
}

async function updateMediaVisibility(db: NonNullable<ReturnType<typeof getDatabase>>, path: unknown, visibility: "public" | "private") {
  if (typeof path === "string" && path) await db.update(mediaFiles).set({ visibility }).where(eq(mediaFiles.storageKey, path));
}

async function retireMedia(db: NonNullable<ReturnType<typeof getDatabase>>, path: unknown) {
  if (typeof path !== "string" || !path) return;
  // Keep the previous file metadata and bytes for audit/rollback, but make it
  // private and unavailable through the public media route.
  await db.update(mediaFiles).set({ visibility: "private", deletedAt: new Date() }).where(eq(mediaFiles.storageKey, path));
}

export async function POST(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ message: "Origem não autorizada." }, { status: 403 });
  const resource = (await params).resource;
  if (!validResource(resource)) return NextResponse.json({ message: "Módulo não encontrado." }, { status: 404 });
  const admin = await getVerifiedAdmin();
  if (!admin) return NextResponse.json({ message: "Sessão expirada." }, { status: 401 });
  const db = getDatabase(); if (!db) return NextResponse.json({ message: "Banco indisponível." }, { status: 503 });
  let body: unknown; try { body = await request.json(); } catch { return NextResponse.json({ message: "Dados inválidos." }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ message: "Dados inválidos." }, { status: 422 });
  let payload: Record<string, unknown>;
  try { payload = toDbPayload(resource, body as InputRecord); } catch (error) { return NextResponse.json({ message: error instanceof Error ? error.message : "Dados inválidos." }, { status: 422 }); }
  const validationError = validatePayload(resource, payload);
  if (validationError) return NextResponse.json({ message: validationError }, { status: 422 });
  payload.id = randomUUID();
  if ("status" in payload && payload.status === "published" && !payload.publishedAt) payload.publishedAt = new Date();
  const table = resources[resource] as typeof posts;
  try {
    await db.insert(table).values(payload as never);
    const created = await db.select().from(table).where(eq(table.id, payload.id as string)).limit(1);
    const data = created[0] ?? payload;
    await db.insert(auditLog).values({ id: randomUUID(), actorEmail: admin.email, action: "create", entityType: resource, entityId: String(payload.id), beforeData: null, afterData: data });
    await saveRevision(db, resource, String(payload.id), data, admin.email);
    await updatePublishedMedia(db, resource, data);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) { return NextResponse.json({ message: error instanceof Error ? error.message : "Não foi possível salvar o registro." }, { status: 422 }); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ message: "Origem não autorizada." }, { status: 403 });
  const resource = (await params).resource;
  if (!validResource(resource)) return NextResponse.json({ message: "Módulo não encontrado." }, { status: 404 });
  const admin = await getVerifiedAdmin();
  if (!admin) return NextResponse.json({ message: "Sessão expirada." }, { status: 401 });
  const db = getDatabase(); if (!db) return NextResponse.json({ message: "Banco indisponível." }, { status: 503 });
  let body: unknown; try { body = await request.json(); } catch { return NextResponse.json({ message: "Dados inválidos." }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ message: "Dados inválidos." }, { status: 422 });
  const input = body as InputRecord; const id = typeof input.id === "string" ? input.id : "";
  if (!id) return NextResponse.json({ message: "Registro inválido." }, { status: 422 });
  let payload: Record<string, unknown>;
  try { payload = toDbPayload(resource, input); } catch (error) { return NextResponse.json({ message: error instanceof Error ? error.message : "Dados inválidos." }, { status: 422 }); }
  delete payload.id;
  const validationError = validatePayload(resource, payload, true);
  if (validationError) return NextResponse.json({ message: validationError }, { status: 422 });
  if ("status" in payload && payload.status === "published" && !payload.publishedAt) payload.publishedAt = new Date();
  const table = resources[resource] as typeof posts;
  try {
    const previousRows = await db.select().from(table).where(eq(table.id, id)).limit(1); const previous = previousRows[0];
    if (!previous) return NextResponse.json({ message: "Registro não encontrado." }, { status: 404 });

    const previousRecord = previous as unknown as Record<string, unknown>;
    const nextFile = resource === "documentos" && typeof payload.storagePath === "string" ? payload.storagePath : "";
    const previousFile = resource === "documentos" && typeof previousRecord.storagePath === "string" ? previousRecord.storagePath : "";
    const replacedDocumentFile = Boolean(nextFile && nextFile !== previousFile);
    if (replacedDocumentFile) payload.versionNumber = Number(previousRecord.versionNumber ?? 1) + 1;
    await db.update(table).set(payload as never).where(eq(table.id, id));
    const updatedRows = await db.select().from(table).where(eq(table.id, id)).limit(1); const data = updatedRows[0] ?? { ...previous, ...payload };
    await db.insert(auditLog).values({ id: randomUUID(), actorEmail: admin.email, action: "update", entityType: resource, entityId: id, beforeData: previous, afterData: data });
    await saveRevision(db, resource, id, data, admin.email);
    await updatePublishedMedia(db, resource, data);
    if (replacedDocumentFile) await retireMedia(db, previousFile);
    const dataRecord = data as unknown as Record<string, unknown>;
    if (resource === "solicitacoes" && previousRecord.status !== dataRecord.status) {
      await db.insert(submissionEvents).values({ id: randomUUID(), submissionId: id, eventType: "status_changed", fromStatus: typeof previousRecord.status === "string" ? previousRecord.status : null, toStatus: typeof dataRecord.status === "string" ? dataRecord.status : null, details: {}, actorEmail: admin.email, createdAt: new Date() });
    }
    const oldCover = typeof previousRecord.coverImagePath === "string" ? previousRecord.coverImagePath : "";
    const newCover = typeof dataRecord.coverImagePath === "string" ? dataRecord.coverImagePath : "";
    const oldLogo = typeof previousRecord.logoPath === "string" ? previousRecord.logoPath : "";
    const newLogo = typeof dataRecord.logoPath === "string" ? dataRecord.logoPath : "";
    const oldPhoto = typeof previousRecord.photoPath === "string" ? previousRecord.photoPath : "";
    const newPhoto = typeof dataRecord.photoPath === "string" ? dataRecord.photoPath : "";
    if (resource === "noticias" && oldCover && oldCover !== newCover) await db.update(mediaFiles).set({ visibility: "private", deletedAt: new Date() }).where(eq(mediaFiles.storageKey, oldCover));
    if (resource === "parceiros" && oldLogo && oldLogo !== newLogo) await db.update(mediaFiles).set({ visibility: "private", deletedAt: new Date() }).where(eq(mediaFiles.storageKey, oldLogo));
    if (resource === "institucional" && oldPhoto && oldPhoto !== newPhoto) await db.update(mediaFiles).set({ visibility: "private", deletedAt: new Date() }).where(eq(mediaFiles.storageKey, oldPhoto));
    return NextResponse.json({ data });
  } catch (error) { return NextResponse.json({ message: error instanceof Error ? error.message : "Não foi possível atualizar o registro." }, { status: 422 }); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ message: "Origem não autorizada." }, { status: 403 });
  const resource = (await params).resource;
  if (!validResource(resource)) return NextResponse.json({ message: "Módulo não encontrado." }, { status: 404 });
  const admin = await getVerifiedAdmin(); const db = getDatabase();
  if (!admin) return NextResponse.json({ message: "Sessão expirada." }, { status: 401 });
  if (!db) return NextResponse.json({ message: "Banco indisponível." }, { status: 503 });
  let body: unknown; try { body = await request.json(); } catch { return NextResponse.json({ message: "Dados inválidos." }, { status: 400 }); }
  const id = body && typeof body === "object" && "id" in body && typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ message: "Registro inválido." }, { status: 422 });
  const table = resources[resource] as typeof posts;
  const previousRows = await db.select().from(table).where(eq(table.id, id)).limit(1); const previous = previousRows[0];
  if (!previous) return NextResponse.json({ message: "Registro não encontrado." }, { status: 404 });
  await db.delete(table).where(eq(table.id, id));
  await db.insert(auditLog).values({ id: randomUUID(), actorEmail: admin.email, action: "delete", entityType: resource, entityId: id, beforeData: previous, afterData: null });
  return NextResponse.json({ ok: true });
}

async function saveRevision(db: NonNullable<ReturnType<typeof getDatabase>>, resource: Resource, id: string, snapshot: unknown, actorEmail: string) {
  if (!["noticias", "conteudo", "servicos", "documentos", "agenda"].includes(resource)) return;
  const latest = await db.select({ revision: max(contentRevisions.revisionNumber) }).from(contentRevisions).where(and(eq(contentRevisions.entityType, resource), eq(contentRevisions.entityId, id)));
  const revisionNumber = Number(latest[0]?.revision ?? 0) + 1;
  await db.insert(contentRevisions).values({ id: randomUUID(), entityType: resource, entityId: id, revisionNumber, snapshot, actorEmail });
}

async function updatePublishedMedia(db: NonNullable<ReturnType<typeof getDatabase>>, resource: Resource, row: Record<string, unknown>) {
  const visibility = row.status === "published" ? "public" : "private";
  if (resource === "noticias") await updateMediaVisibility(db, row.coverImagePath, visibility);
  if (resource === "parceiros") await updateMediaVisibility(db, row.logoPath, visibility);
  if (resource === "institucional") await updateMediaVisibility(db, row.photoPath, visibility);
  if (resource === "documentos") await updateMediaVisibility(db, row.storagePath, visibility);
}
