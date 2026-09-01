import { createClient } from "@supabase/supabase-js";
import { agendaItems as fallbackAgendaItems, collectiveDocuments as fallbackDocuments, posts as fallbackPosts, services as fallbackServices } from "@/data/site-content";
import type { AgendaItem, CollectiveDocument, DocumentStatus, Post, Service } from "@/types/content";

type PublicCollections = {
  collectiveDocuments: CollectiveDocument[];
  agendaItems: AgendaItem[];
  services: Service[];
  posts: Post[];
};

type DatabaseRow = Record<string, unknown>;

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function publishedRows(table: string): Promise<DatabaseRow[] | null> {
  const client = publicClient();
  if (!client) return null;
  try {
    const { data, error } = await client.from(table).select("*").eq("status", "published");
    if (error) return null;
    return data as DatabaseRow[];
  } catch {
    return null;
  }
}

function stringValue(row: DatabaseRow, key: string, fallback = "") {
  const value = row[key];
  return typeof value === "string" ? value : fallback;
}

function numberValue(row: DatabaseRow, key: string, fallback = 0) {
  const value = row[key];
  return typeof value === "number" ? value : Number(value ?? fallback);
}

function dateOnlyValue(row: DatabaseRow, key: string, fallback = new Date().toISOString()) {
  const value = stringValue(row, key);
  return value ? value.slice(0, 10) : fallback.slice(0, 10);
}

function richTextParagraphs(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  const root = value as { content?: unknown };
  if (!Array.isArray(root.content)) return [];
  return root.content.map((node) => {
    if (!node || typeof node !== "object") return "";
    const paragraph = node as { content?: unknown };
    if (!Array.isArray(paragraph.content)) return "";
    return paragraph.content.map((child) => {
      if (!child || typeof child !== "object") return "";
      return typeof (child as { text?: unknown }).text === "string" ? (child as { text: string }).text : "";
    }).join("").trim();
  }).filter(Boolean);
}

function mapDocument(row: DatabaseRow): CollectiveDocument {
  const client = publicClient();
  const storagePath = stringValue(row, "storage_path");
  const pdfUrl = client && storagePath ? client.storage.from("public-documents").getPublicUrl(storagePath).data.publicUrl : undefined;
  return {
    id: stringValue(row, "id"),
    slug: stringValue(row, "slug"),
    title: stringValue(row, "title"),
    summary: stringValue(row, "summary"),
    municipality: stringValue(row, "municipality"),
    category: stringValue(row, "category_label"),
    year: numberValue(row, "year"),
    type: stringValue(row, "document_type") as CollectiveDocument["type"],
    status: stringValue(row, "document_status") as DocumentStatus,
    validFrom: stringValue(row, "valid_from") || undefined,
    validUntil: stringValue(row, "valid_until") || undefined,
    baseDate: stringValue(row, "base_date") || undefined,
    laborUnion: stringValue(row, "labor_union") || undefined,
    mteRegistration: stringValue(row, "mte_registration") || undefined,
    lastReviewedAt: dateOnlyValue(row, "last_reviewed_at"),
    officialSource: stringValue(row, "official_source") || undefined,
    pdfUrl,
  };
}

function mapAgendaItem(row: DatabaseRow): AgendaItem {
  return {
    id: stringValue(row, "id"),
    slug: stringValue(row, "slug"),
    title: stringValue(row, "title"),
    description: stringValue(row, "description"),
    date: stringValue(row, "starts_at"),
    endDate: stringValue(row, "ends_at") || undefined,
    municipality: stringValue(row, "municipality"),
    type: stringValue(row, "agenda_type") as AgendaItem["type"],
    status: stringValue(row, "agenda_status") as AgendaItem["status"],
  };
}

function mapService(row: DatabaseRow): Service {
  const paragraphs = richTextParagraphs(row.content);
  return {
    slug: stringValue(row, "slug"),
    title: stringValue(row, "title"),
    excerpt: stringValue(row, "excerpt"),
    description: paragraphs.join("\n\n") || stringValue(row, "excerpt"),
    category: stringValue(row, "category") as Service["category"],
    eligibility: stringValue(row, "eligibility"),
    exclusive: row.is_exclusive === true,
    partner: stringValue(row, "partner_name") || undefined,
    validity: stringValue(row, "valid_until") || undefined,
  };
}

function mapPost(row: DatabaseRow): Post {
  const body = richTextParagraphs(row.content);
  return {
    slug: stringValue(row, "slug"),
    title: stringValue(row, "title"),
    excerpt: stringValue(row, "excerpt"),
    category: stringValue(row, "category"),
    publishedAt: dateOnlyValue(row, "published_at"),
    updatedAt: dateOnlyValue(row, "updated_at", dateOnlyValue(row, "published_at")),
    author: stringValue(row, "author_name"),
    body: body.length ? body : [stringValue(row, "excerpt")],
  };
}

function databaseOrFallback<T>(databaseItems: T[] | null, fallbackItems: T[]) {
  return databaseItems === null ? fallbackItems : databaseItems;
}

export async function getPublicCollections(): Promise<PublicCollections> {
  const [documentRows, agendaRows, serviceRows, postRows] = await Promise.all([
    publishedRows("collective_documents"),
    publishedRows("agenda_items"),
    publishedRows("services"),
    publishedRows("posts"),
  ]);
  return {
    collectiveDocuments: databaseOrFallback(documentRows?.map(mapDocument).filter((item) => item.slug) ?? null, fallbackDocuments),
    agendaItems: databaseOrFallback(agendaRows?.map(mapAgendaItem).filter((item) => item.slug) ?? null, fallbackAgendaItems),
    services: databaseOrFallback(serviceRows?.map(mapService).filter((item) => item.slug) ?? null, fallbackServices),
    posts: databaseOrFallback(postRows?.map(mapPost).filter((item) => item.slug) ?? null, fallbackPosts),
  };
}

export async function getPublicDocuments() { return (await getPublicCollections()).collectiveDocuments; }
export async function getPublicAgendaItems() { return (await getPublicCollections()).agendaItems; }
export async function getPublicServices() { return (await getPublicCollections()).services; }
export async function getPublicPosts() { return (await getPublicCollections()).posts; }

export function getCurrentDocuments() {
  const activeStatuses: DocumentStatus[] = ["current", "extended", "negotiating"];
  return fallbackDocuments.filter((document) => activeStatuses.includes(document.status));
}

export async function getDocumentBySlug(slug: string) {
  return (await getPublicDocuments()).find((document) => document.slug === slug);
}

export async function getAgendaItemBySlug(slug: string) {
  return (await getPublicAgendaItems()).find((item) => item.slug === slug);
}

export async function getServiceBySlug(slug: string) {
  return (await getPublicServices()).find((service) => service.slug === slug);
}

export async function getPostBySlug(slug: string) {
  return (await getPublicPosts()).find((post) => post.slug === slug);
}

function searchCandidates(query: string, collections: PublicCollections) {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  if (normalized.length < 2) return [];
  const { collectiveDocuments, agendaItems, services, posts } = collections;
  const candidates = [
    ...collectiveDocuments.map((item) => ({ type: "Documento", title: item.title, excerpt: item.summary, href: `/convencoes/${item.slug}` })),
    ...agendaItems.map((item) => ({ type: "Agenda", title: item.title, excerpt: item.description, href: "/agenda" })),
    ...services.map((item) => ({ type: "Serviço", title: item.title, excerpt: item.excerpt, href: `/servicos/${item.slug}` })),
    ...posts.map((item) => ({ type: "Notícia", title: item.title, excerpt: item.excerpt, href: `/noticias/${item.slug}` })),
  ];
  return candidates.filter((item) => `${item.title} ${item.excerpt}`.toLocaleLowerCase("pt-BR").includes(normalized)).slice(0, 12);
}

export function searchPublishedContent(query: string) {
  return searchCandidates(query, { collectiveDocuments: fallbackDocuments, agendaItems: fallbackAgendaItems, services: fallbackServices, posts: fallbackPosts });
}

export async function searchPublishedContentAsync(query: string) {
  return searchCandidates(query, await getPublicCollections());
}
