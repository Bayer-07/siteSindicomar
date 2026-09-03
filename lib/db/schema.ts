import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const id = (name = "id") => uuid(name).defaultRandom();
const createdAt = () => timestamp("created_at", { mode: "date", withTimezone: true, precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`);
const updatedAt = () => timestamp("updated_at", { mode: "date", withTimezone: true, precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`);

export const siteSettings = pgTable("site_settings", {
  id: id().primaryKey(),
  key: varchar("key", { length: 190 }).notNull(),
  value: jsonb("value").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [uniqueIndex("site_settings_key_uq").on(table.key)]);

export const pages = pgTable("pages", {
  id: id().primaryKey(),
  slug: varchar("slug", { length: 190 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  excerpt: text("excerpt"),
  content: jsonb("content").notNull(),
  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: text("seo_description"),
  status: varchar("status", { length: 24 }).notNull().default("draft"),
  publishedAt: timestamp("published_at", { mode: "date", withTimezone: true, precision: 3 }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [uniqueIndex("pages_slug_uq").on(table.slug), index("pages_status_idx").on(table.status)]);

export const directors = pgTable("directors", {
  id: id().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }).notNull(),
  bio: text("bio"),
  photoPath: varchar("photo_path", { length: 500 }),
  mandateStart: date("mandate_start", { mode: "string" }),
  mandateEnd: date("mandate_end", { mode: "string" }),
  displayOrder: integer("display_order").notNull().default(0),
  status: varchar("status", { length: 24 }).notNull().default("draft"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [index("directors_status_order_idx").on(table.status, table.displayOrder)]);

export const territories = pgTable("territories", {
  id: id().primaryKey(),
  municipality: varchar("municipality", { length: 255 }).notNull(),
  state: varchar("state", { length: 2 }).notNull().default("PR"),
  notes: text("notes"),
  confirmedAt: timestamp("confirmed_at", { mode: "date", withTimezone: true, precision: 3 }),
  status: varchar("status", { length: 24 }).notNull().default("draft"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [uniqueIndex("territories_municipality_state_uq").on(table.municipality, table.state)]);

export const categories = pgTable("categories", {
  id: id().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  cnaes: jsonb("cnaes").notNull(),
  exclusions: text("exclusions"),
  confirmedAt: timestamp("confirmed_at", { mode: "date", withTimezone: true, precision: 3 }),
  status: varchar("status", { length: 24 }).notNull().default("draft"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [uniqueIndex("categories_name_uq").on(table.name)]);

export const collectiveDocuments = pgTable("collective_documents", {
  id: id().primaryKey(),
  slug: varchar("slug", { length: 190 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  summary: text("summary"),
  municipality: varchar("municipality", { length: 255 }).notNull(),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  categoryLabel: varchar("category_label", { length: 255 }).notNull(),
  year: integer("year").notNull(),
  documentType: varchar("document_type", { length: 24 }).notNull(),
  documentStatus: varchar("document_status", { length: 24 }).notNull(),
  validFrom: date("valid_from", { mode: "string" }),
  validUntil: date("valid_until", { mode: "string" }),
  baseDate: varchar("base_date", { length: 100 }),
  laborUnion: varchar("labor_union", { length: 255 }),
  mteRegistration: varchar("mte_registration", { length: 100 }),
  lastReviewedAt: timestamp("last_reviewed_at", { mode: "date", withTimezone: true, precision: 3 }).notNull(),
  officialSource: varchar("official_source", { length: 255 }),
  storagePath: varchar("storage_path", { length: 500 }),
  originalFilename: varchar("original_filename", { length: 255 }),
  mimeType: varchar("mime_type", { length: 100 }),
  fileSizeBytes: bigint("file_size_bytes", { mode: "number" }),
  versionNumber: integer("version_number").notNull().default(1),
  status: varchar("status", { length: 24 }).notNull().default("draft"),
  publishedAt: timestamp("published_at", { mode: "date", withTimezone: true, precision: 3 }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  uniqueIndex("collective_documents_slug_uq").on(table.slug),
  index("collective_documents_filter_idx").on(table.documentStatus, table.year, table.municipality, table.documentType),
  index("collective_documents_status_idx").on(table.status),
]);

export const documentRelations = pgTable("document_relations", {
  id: id().primaryKey(),
  sourceDocumentId: uuid("source_document_id").notNull().references(() => collectiveDocuments.id, { onDelete: "cascade" }),
  relatedDocumentId: uuid("related_document_id").notNull().references(() => collectiveDocuments.id, { onDelete: "cascade" }),
  relationType: varchar("relation_type", { length: 24 }).notNull(),
  createdAt: createdAt(),
}, (table) => [uniqueIndex("document_relations_uq").on(table.sourceDocumentId, table.relatedDocumentId, table.relationType)]);

export const agendaItems = pgTable("agenda_items", {
  id: id().primaryKey(),
  slug: varchar("slug", { length: 190 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startsAt: timestamp("starts_at", { mode: "date", withTimezone: true, precision: 3 }).notNull(),
  endsAt: timestamp("ends_at", { mode: "date", withTimezone: true, precision: 3 }),
  municipality: varchar("municipality", { length: 255 }).notNull(),
  agendaType: varchar("agenda_type", { length: 24 }).notNull(),
  agendaStatus: varchar("agenda_status", { length: 24 }).notNull(),
  relatedDocumentId: uuid("related_document_id").references(() => collectiveDocuments.id, { onDelete: "set null" }),
  location: varchar("location", { length: 255 }),
  registrationUrl: varchar("registration_url", { length: 500 }),
  status: varchar("status", { length: 24 }).notNull().default("draft"),
  publishedAt: timestamp("published_at", { mode: "date", withTimezone: true, precision: 3 }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [uniqueIndex("agenda_items_slug_uq").on(table.slug), index("agenda_items_date_idx").on(table.startsAt, table.agendaStatus), index("agenda_items_status_idx").on(table.status)]);

export const services = pgTable("services", {
  id: id().primaryKey(),
  slug: varchar("slug", { length: 190 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  excerpt: text("excerpt"),
  content: jsonb("content").notNull(),
  category: varchar("category", { length: 32 }).notNull(),
  eligibility: text("eligibility"),
  isExclusive: boolean("is_exclusive").notNull().default(false),
  partnerName: varchar("partner_name", { length: 255 }),
  validUntil: date("valid_until", { mode: "string" }),
  contactUrl: varchar("contact_url", { length: 500 }),
  status: varchar("status", { length: 24 }).notNull().default("draft"),
  publishedAt: timestamp("published_at", { mode: "date", withTimezone: true, precision: 3 }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [uniqueIndex("services_slug_uq").on(table.slug), index("services_status_idx").on(table.status)]);

export const partners = pgTable("partners", {
  id: id().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  logoPath: varchar("logo_path", { length: 500 }),
  websiteUrl: varchar("website_url", { length: 500 }),
  validFrom: date("valid_from", { mode: "string" }),
  validUntil: date("valid_until", { mode: "string" }),
  displayOrder: integer("display_order").notNull().default(0),
  status: varchar("status", { length: 24 }).notNull().default("draft"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [index("partners_status_order_idx").on(table.status, table.displayOrder)]);

export const posts = pgTable("posts", {
  id: id().primaryKey(),
  slug: varchar("slug", { length: 190 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  excerpt: text("excerpt"),
  content: jsonb("content").notNull(),
  category: varchar("category", { length: 255 }).notNull(),
  authorName: varchar("author_name", { length: 255 }).notNull(),
  sourceUrl: varchar("source_url", { length: 500 }),
  coverImagePath: varchar("cover_image_path", { length: 500 }),
  status: varchar("status", { length: 24 }).notNull().default("draft"),
  publishedAt: timestamp("published_at", { mode: "date", withTimezone: true, precision: 3 }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [uniqueIndex("posts_slug_uq").on(table.slug), index("posts_status_published_idx").on(table.status, table.publishedAt)]);

export const submissions = pgTable("submissions", {
  id: id().primaryKey(),
  protocol: varchar("protocol", { length: 24 }).notNull(),
  kind: varchar("kind", { length: 24 }).notNull(),
  status: varchar("status", { length: 24 }).notNull().default("new"),
  requesterName: varchar("requester_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull(),
  preferredChannel: varchar("preferred_channel", { length: 24 }).notNull(),
  subject: varchar("subject", { length: 255 }),
  companyCnpj: varchar("company_cnpj", { length: 32 }),
  companyName: varchar("company_name", { length: 255 }),
  municipality: varchar("municipality", { length: 255 }),
  activity: text("activity"),
  message: text("message").notNull(),
  sourcePath: varchar("source_path", { length: 500 }),
  consentAt: timestamp("consent_at", { mode: "date", withTimezone: true, precision: 3 }).notNull(),
  emailNotificationStatus: varchar("email_notification_status", { length: 24 }).notNull().default("pending"),
  emailNotificationError: text("email_notification_error"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [uniqueIndex("submissions_protocol_uq").on(table.protocol), index("submissions_status_created_idx").on(table.status, table.createdAt)]);

export const submissionEvents = pgTable("submission_events", {
  id: id().primaryKey(),
  submissionId: uuid("submission_id").notNull().references(() => submissions.id, { onDelete: "cascade" }),
  eventType: varchar("event_type", { length: 40 }).notNull(),
  fromStatus: varchar("from_status", { length: 24 }),
  toStatus: varchar("to_status", { length: 24 }),
  details: jsonb("details").notNull(),
  actorEmail: varchar("actor_email", { length: 320 }),
  createdAt: createdAt(),
}, (table) => [index("submission_events_submission_idx").on(table.submissionId, table.createdAt)]);

export const contentRevisions = pgTable("content_revisions", {
  id: id().primaryKey(),
  entityType: varchar("entity_type", { length: 80 }).notNull(),
  entityId: uuid("entity_id").notNull(),
  revisionNumber: integer("revision_number").notNull(),
  snapshot: jsonb("snapshot").notNull(),
  actorEmail: varchar("actor_email", { length: 320 }).notNull(),
  createdAt: createdAt(),
}, (table) => [uniqueIndex("content_revisions_uq").on(table.entityType, table.entityId, table.revisionNumber)]);

export const auditLog = pgTable("audit_log", {
  id: id().primaryKey(),
  actorEmail: varchar("actor_email", { length: 320 }).notNull(),
  action: varchar("action", { length: 40 }).notNull(),
  entityType: varchar("entity_type", { length: 80 }).notNull(),
  entityId: varchar("entity_id", { length: 100 }),
  beforeData: jsonb("before_data"),
  afterData: jsonb("after_data"),
  createdAt: createdAt(),
}, (table) => [index("audit_log_entity_idx").on(table.entityType, table.entityId, table.createdAt)]);

export const mediaFiles = pgTable("media_files", {
  id: id().primaryKey(),
  storageKey: varchar("storage_key", { length: 500 }).notNull(),
  originalFilename: varchar("original_filename", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  byteSize: bigint("byte_size", { mode: "number" }).notNull(),
  sha256: varchar("sha256", { length: 64 }).notNull(),
  kind: varchar("kind", { length: 24 }).notNull(),
  visibility: varchar("visibility", { length: 16 }).notNull().default("private"),
  createdAt: createdAt(),
  deletedAt: timestamp("deleted_at", { mode: "date", withTimezone: true, precision: 3 }),
}, (table) => [uniqueIndex("media_files_storage_key_uq").on(table.storageKey), index("media_files_visibility_idx").on(table.visibility, table.deletedAt)]);

export const adminUsers = pgTable("admin_users", {
  id: id().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  totpSecretEncrypted: text("totp_secret_encrypted"),
  totpEnabled: boolean("totp_enabled").notNull().default(false),
  failedLoginCount: integer("failed_login_count").notNull().default(0),
  lockedUntil: timestamp("locked_until", { mode: "date", withTimezone: true, precision: 3 }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [uniqueIndex("admin_users_email_uq").on(table.email)]);

export const adminSessions = pgTable("admin_sessions", {
  id: id().primaryKey(),
  adminUserId: uuid("admin_user_id").notNull().references(() => adminUsers.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 64 }).notNull(),
  mfaVerifiedAt: timestamp("mfa_verified_at", { mode: "date", withTimezone: true, precision: 3 }),
  expiresAt: timestamp("expires_at", { mode: "date", withTimezone: true, precision: 3 }).notNull(),
  createdAt: createdAt(),
  lastSeenAt: timestamp("last_seen_at", { mode: "date", withTimezone: true, precision: 3 }).notNull(),
}, (table) => [uniqueIndex("admin_sessions_token_uq").on(table.tokenHash), index("admin_sessions_expiry_idx").on(table.expiresAt)]);

export const adminRecoveryCodes = pgTable("admin_recovery_codes", {
  id: id().primaryKey(),
  adminUserId: uuid("admin_user_id").notNull().references(() => adminUsers.id, { onDelete: "cascade" }),
  codeHash: varchar("code_hash", { length: 64 }).notNull(),
  usedAt: timestamp("used_at", { mode: "date", withTimezone: true, precision: 3 }),
  createdAt: createdAt(),
}, (table) => [uniqueIndex("admin_recovery_codes_hash_uq").on(table.codeHash), index("admin_recovery_codes_admin_idx").on(table.adminUserId, table.usedAt)]);

export const rateLimitBuckets = pgTable("rate_limit_buckets", {
  id: id().primaryKey(),
  bucketKey: varchar("bucket_key", { length: 190 }).notNull(),
  windowStartedAt: timestamp("window_started_at", { mode: "date", withTimezone: true, precision: 3 }).notNull(),
  hits: integer("hits").notNull().default(0),
  updatedAt: updatedAt(),
}, (table) => [uniqueIndex("rate_limit_buckets_key_uq").on(table.bucketKey)]);

export const schema = {
  siteSettings,
  pages,
  directors,
  territories,
  categories,
  collectiveDocuments,
  documentRelations,
  agendaItems,
  services,
  partners,
  posts,
  submissions,
  submissionEvents,
  contentRevisions,
  auditLog,
  mediaFiles,
  adminUsers,
  adminSessions,
  adminRecoveryCodes,
  rateLimitBuckets,
};
