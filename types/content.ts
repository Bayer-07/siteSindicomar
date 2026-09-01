import type { JSONContent } from "@tiptap/core";

export type DocumentStatus = "current" | "extended" | "negotiating" | "superseded" | "expired";
export type DocumentType = "cct" | "act" | "amendment" | "minutes" | "circular" | "notice";
export type AgendaStatus = "confirmed" | "pending" | "cancelled" | "informational";
export type SubmissionKind = "contact" | "classification" | "membership";
export type SubmissionStatus = "new" | "handling" | "waiting" | "completed";

export interface CollectiveDocument {
  id: string;
  slug: string;
  title: string;
  summary: string;
  municipality: string;
  category: string;
  year: number;
  type: DocumentType;
  status: DocumentStatus;
  validFrom?: string;
  validUntil?: string;
  baseDate?: string;
  laborUnion?: string;
  mteRegistration?: string;
  lastReviewedAt: string;
  officialSource?: string;
  pdfUrl?: string;
}

export interface AgendaItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  endDate?: string;
  municipality: string;
  type: "holiday" | "special-hours" | "assembly" | "course" | "event";
  status: AgendaStatus;
  relatedDocumentSlug?: string;
}

export interface Service {
  slug: string;
  title: string;
  excerpt: string;
  description: string;
  category: "labor" | "training" | "health" | "technology" | "finance" | "commerce";
  eligibility: string;
  exclusive: boolean;
  partner?: string;
  validity?: string;
  content?: JSONContent;
}

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  updatedAt: string;
  author: string;
  body: string[];
  coverImageUrl?: string;
  content?: JSONContent;
}
