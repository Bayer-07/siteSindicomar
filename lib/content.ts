import { agendaItems, collectiveDocuments, posts, services } from "@/data/site-content";
import type { DocumentStatus } from "@/types/content";

export function getCurrentDocuments() {
  const activeStatuses: DocumentStatus[] = ["current", "extended", "negotiating"];
  return collectiveDocuments.filter((document) => activeStatuses.includes(document.status));
}

export function getDocumentBySlug(slug: string) {
  return collectiveDocuments.find((document) => document.slug === slug);
}

export function getAgendaItemBySlug(slug: string) {
  return agendaItems.find((item) => item.slug === slug);
}

export function getServiceBySlug(slug: string) {
  return services.find((service) => service.slug === slug);
}

export function getPostBySlug(slug: string) {
  return posts.find((post) => post.slug === slug);
}

export function searchPublishedContent(query: string) {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  if (normalized.length < 2) return [];

  const candidates = [
    ...collectiveDocuments.map((item) => ({ type: "Documento", title: item.title, excerpt: item.summary, href: `/convencoes/${item.slug}` })),
    ...agendaItems.map((item) => ({ type: "Agenda", title: item.title, excerpt: item.description, href: "/agenda" })),
    ...services.map((item) => ({ type: "Serviço", title: item.title, excerpt: item.excerpt, href: `/servicos/${item.slug}` })),
    ...posts.map((item) => ({ type: "Notícia", title: item.title, excerpt: item.excerpt, href: `/noticias/${item.slug}` })),
  ];

  return candidates.filter((item) => `${item.title} ${item.excerpt}`.toLocaleLowerCase("pt-BR").includes(normalized)).slice(0, 12);
}
