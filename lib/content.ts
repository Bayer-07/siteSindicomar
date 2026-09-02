import type { JSONContent } from "@tiptap/core";
import { eq } from "drizzle-orm";
import { agendaItems as fallbackAgendaItems, collectiveDocuments as fallbackDocuments, posts as fallbackPosts, publicContact, services as fallbackServices } from "@/data/site-content";
import { getDatabase } from "@/lib/db";
import { agendaItems, collectiveDocuments, partners, posts, services, siteSettings } from "@/lib/db/schema";
import type { AgendaItem, CollectiveDocument, DocumentStatus, Partner, Post, Service } from "@/types/content";

type PublicCollections = { collectiveDocuments: CollectiveDocument[]; agendaItems: AgendaItem[]; services: Service[]; posts: Post[]; partners: Partner[] };
export type PublicSiteSettings = typeof publicContact;
type DatabaseRow = Record<string, unknown>;
type PublishedTable = typeof collectiveDocuments | typeof agendaItems | typeof services | typeof posts | typeof partners;

function fallbackAllowed() { return process.env.NODE_ENV !== "production" || process.env.DEMO_MODE === "true"; }

async function publishedRows(table: PublishedTable): Promise<DatabaseRow[] | null> {
  const db = getDatabase();
  if (!db) return null;
  try {
    const typedTable = table as typeof posts;
    const data = await db.select().from(typedTable).where(eq(typedTable.status, "published"));
    return data as unknown as DatabaseRow[];
  } catch {
    return null;
  }
}

function stringValue(row: DatabaseRow, key: string, fallback = "") { const value = row[key]; return typeof value === "string" ? value : fallback; }
function numberValue(row: DatabaseRow, key: string, fallback = 0) { const value = row[key]; return typeof value === "number" ? value : Number(value ?? fallback); }
function dateOnlyValue(row: DatabaseRow, key: string, fallback = new Date().toISOString()) { const value = row[key]; const date = value instanceof Date ? value.toISOString() : stringValue(row, key); return date ? date.slice(0, 10) : fallback.slice(0, 10); }
function assetUrl(value: string) { return value ? `/media/${value.split("/").map(encodeURIComponent).join("/")}` : undefined; }
function parseJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return null; }
}

function richTextParagraphs(value: unknown): string[] {
  const parsed = parseJson(value);
  if (!parsed || typeof parsed !== "object") return [];
  const root = parsed as { content?: unknown };
  if (!Array.isArray(root.content)) return [];
  function extract(node: unknown): string[] {
    if (!node || typeof node !== "object") return [];
    const current = node as { type?: unknown; text?: unknown; content?: unknown };
    if (typeof current.text === "string") return [current.text];
    if (!Array.isArray(current.content)) return [];
    const children = current.content.flatMap(extract);
    return ["paragraph", "heading", "listItem", "blockquote", "codeBlock"].includes(String(current.type)) ? [children.join("").trim()] : children;
  }
  return root.content.flatMap(extract).filter(Boolean);
}

function richTextContent(value: unknown): JSONContent | undefined { const parsed = parseJson(value); return parsed && typeof parsed === "object" && (parsed as JSONContent).type === "doc" ? parsed as JSONContent : undefined; }

function mapDocument(row: DatabaseRow): CollectiveDocument {
  return { id: stringValue(row, "id"), slug: stringValue(row, "slug"), title: stringValue(row, "title"), summary: stringValue(row, "summary"), municipality: stringValue(row, "municipality"), category: stringValue(row, "categoryLabel"), year: numberValue(row, "year"), type: stringValue(row, "documentType") as CollectiveDocument["type"], status: stringValue(row, "documentStatus") as DocumentStatus, validFrom: stringValue(row, "validFrom") || undefined, validUntil: stringValue(row, "validUntil") || undefined, baseDate: stringValue(row, "baseDate") || undefined, laborUnion: stringValue(row, "laborUnion") || undefined, mteRegistration: stringValue(row, "mteRegistration") || undefined, lastReviewedAt: dateOnlyValue(row, "lastReviewedAt"), officialSource: stringValue(row, "officialSource") || undefined, pdfUrl: assetUrl(stringValue(row, "storagePath")) };
}

function mapAgendaItem(row: DatabaseRow): AgendaItem { return { id: stringValue(row, "id"), slug: stringValue(row, "slug"), title: stringValue(row, "title"), description: stringValue(row, "description"), date: dateValue(row, "startsAt"), endDate: dateValue(row, "endsAt") || undefined, municipality: stringValue(row, "municipality"), type: stringValue(row, "agendaType") as AgendaItem["type"], status: stringValue(row, "agendaStatus") as AgendaItem["status"] }; }
function dateValue(row: DatabaseRow, key: string) { const value = row[key]; return value instanceof Date ? value.toISOString() : stringValue(row, key); }

function mapService(row: DatabaseRow): Service {
  const paragraphs = richTextParagraphs(row.content);
  return { slug: stringValue(row, "slug"), title: stringValue(row, "title"), excerpt: stringValue(row, "excerpt"), description: paragraphs.join("\n\n") || stringValue(row, "excerpt"), category: stringValue(row, "category") as Service["category"], eligibility: stringValue(row, "eligibility"), exclusive: row.isExclusive === true || row.isExclusive === 1, partner: stringValue(row, "partnerName") || undefined, validity: stringValue(row, "validUntil") || undefined, content: richTextContent(row.content) };
}

function mapPost(row: DatabaseRow): Post {
  const body = richTextParagraphs(row.content);
  return { slug: stringValue(row, "slug"), title: stringValue(row, "title"), excerpt: stringValue(row, "excerpt"), category: stringValue(row, "category"), publishedAt: dateOnlyValue(row, "publishedAt"), updatedAt: dateOnlyValue(row, "updatedAt", dateOnlyValue(row, "publishedAt")), author: stringValue(row, "authorName"), body: body.length ? body : [stringValue(row, "excerpt")], coverImageUrl: assetUrl(stringValue(row, "coverImagePath")), content: richTextContent(row.content) };
}

function externalUrl(value: string) { if (!value) return undefined; try { const parsed = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`); return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : undefined; } catch { return undefined; } }
function mapPartner(row: DatabaseRow): Partner { return { id: stringValue(row, "id"), name: stringValue(row, "name"), description: stringValue(row, "description"), websiteUrl: externalUrl(stringValue(row, "websiteUrl")), validFrom: stringValue(row, "validFrom") || undefined, validUntil: stringValue(row, "validUntil") || undefined, displayOrder: numberValue(row, "displayOrder"), logoUrl: assetUrl(stringValue(row, "logoPath")) }; }

function databaseOrFallback<T>(databaseItems: T[] | null, fallbackItems: T[]) { return databaseItems === null && fallbackAllowed() ? fallbackItems : databaseItems ?? []; }

function settingText(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value && typeof value === "object" && "value" in value) return settingText((value as { value?: unknown }).value);
  return "";
}

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  const fallback = { ...publicContact };
  const db = getDatabase();
  if (!db) return fallback;
  try {
    const rows = await db.select({ key: siteSettings.key, value: siteSettings.value }).from(siteSettings);
    const values = new Map(rows.map((row) => [row.key, settingText(row.value)]));
    return {
      email: values.get("contact_email") || fallback.email,
      phone: values.get("contact_phone") || fallback.phone,
      whatsapp: values.get("whatsapp_number") || fallback.whatsapp,
      address: values.get("address") || fallback.address,
      note: values.get("contact_note") || fallback.note,
    };
  } catch {
    return fallback;
  }
}

export async function getPublicCollections(): Promise<PublicCollections> {
  const [documentRows, agendaRows, serviceRows, postRows, partnerRows] = await Promise.all([publishedRows(collectiveDocuments), publishedRows(agendaItems), publishedRows(services), publishedRows(posts), publishedRows(partners)]);
  const partnerItems = partnerRows?.map(mapPartner).filter((item) => item.id && item.name).sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name, "pt-BR")) ?? null;
  return { collectiveDocuments: databaseOrFallback(documentRows?.map(mapDocument).filter((item) => item.slug) ?? null, fallbackDocuments), agendaItems: databaseOrFallback(agendaRows?.map(mapAgendaItem).filter((item) => item.slug) ?? null, fallbackAgendaItems), services: databaseOrFallback(serviceRows?.map(mapService).filter((item) => item.slug) ?? null, fallbackServices), posts: databaseOrFallback(postRows?.map(mapPost).filter((item) => item.slug) ?? null, fallbackPosts), partners: databaseOrFallback(partnerItems, []) };
}

export async function getPublicDocuments() { const rows = await publishedRows(collectiveDocuments); return databaseOrFallback(rows?.map(mapDocument).filter((item) => item.slug) ?? null, fallbackDocuments); }
export async function getPublicAgendaItems() { const rows = await publishedRows(agendaItems); return databaseOrFallback(rows?.map(mapAgendaItem).filter((item) => item.slug) ?? null, fallbackAgendaItems); }
export async function getPublicServices() { const rows = await publishedRows(services); return databaseOrFallback(rows?.map(mapService).filter((item) => item.slug) ?? null, fallbackServices); }
export async function getPublicPosts() { const rows = await publishedRows(posts); return databaseOrFallback(rows?.map(mapPost).filter((item) => item.slug) ?? null, fallbackPosts); }
export async function getPublicPartners() { const rows = await publishedRows(partners); return databaseOrFallback(rows?.map(mapPartner).filter((item) => item.id && item.name).sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name, "pt-BR")) ?? null, []); }

export function getCurrentDocuments() { return fallbackDocuments.filter((document) => ["current", "extended", "negotiating"].includes(document.status)); }
export async function getDocumentBySlug(slug: string) { return (await getPublicDocuments()).find((document) => document.slug === slug); }
export async function getAgendaItemBySlug(slug: string) { return (await getPublicAgendaItems()).find((item) => item.slug === slug); }
export async function getServiceBySlug(slug: string) { return (await getPublicServices()).find((service) => service.slug === slug); }
export async function getPostBySlug(slug: string) { return (await getPublicPosts()).find((post) => post.slug === slug); }

function searchCandidates(query: string, collections: PublicCollections) {
  const normalized = query.trim().toLocaleLowerCase("pt-BR"); if (normalized.length < 2) return [];
  const candidates = [...collections.collectiveDocuments.map((item) => ({ type: "Documento", title: item.title, excerpt: item.summary, href: `/convencoes/${item.slug}` })), ...collections.agendaItems.map((item) => ({ type: "Agenda", title: item.title, excerpt: item.description, href: "/agenda" })), ...collections.services.map((item) => ({ type: "Serviço", title: item.title, excerpt: item.excerpt, href: `/servicos/${item.slug}` })), ...collections.posts.map((item) => ({ type: "Notícia", title: item.title, excerpt: item.excerpt, href: `/noticias/${item.slug}` }))];
  return candidates.filter((item) => `${item.title} ${item.excerpt}`.toLocaleLowerCase("pt-BR").includes(normalized)).slice(0, 12);
}

export function searchPublishedContent(query: string) { return searchCandidates(query, { collectiveDocuments: fallbackDocuments, agendaItems: fallbackAgendaItems, services: fallbackServices, posts: fallbackPosts, partners: [] }); }
export async function searchPublishedContentAsync(query: string) { return searchCandidates(query, await getPublicCollections()); }
