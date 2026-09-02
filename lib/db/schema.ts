import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  char,
  date,
  datetime,
  index,
  int,
  json,
  mysqlTable,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

const id = (name = "id") => char(name, { length: 36 });
const createdAt = () => datetime("created_at", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`);
const updatedAt = () => datetime("updated_at", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`);

export const siteSettings = mysqlTable("site_settings", {
  id: id().primaryKey(),
  key: varchar("key", { length: 190 }).notNull(),
  value: json("value").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [uniqueIndex("site_settings_key_uq").on(table.key)]);

export const pages = mysqlTable("pages", {
  id: id().primaryKey(),
  slug: varchar("slug", { length: 190 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  excerpt: text("excerpt"),
  content: json("content").notNull(),
  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: text("seo_description"),
  status: varchar("status", { length: 24 }).notNull().default("draft"),
  publishedAt: datetime("published_at", { mode: "date", fsp: 3 }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [uniqueIndex("pages_slug_uq").on(table.slug), index("pages_status_idx").on(table.status)]);

export const directors = mysqlTable("directors", {
  id: id().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }).notNull(),
  bio: text("bio"),
  photoPath: varchar("photo_path", { length: 500 }),
  mandateStart: date("mandate_start", { mode: "string" }),
  mandateEnd: date("mandate_end", { mode: "string" }),
  displayOrder: int("display_order").notNull().default(0),
  status: varchar("status", { length: 24 }).notNull().default("draft"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [index("directors_status_order_idx").on(table.status, table.displayOrder)]);

export const territories = mysqlTable("territories", {
  id: id().primaryKey(),
  municipality: varchar("municipality", { length: 255 }).notNull(),
  state: char("state", { length: 2 }).notNull().default("PR"),
  notes: text("notes"),
  confirmedAt: datetime("confirmed_at", { mode: "date", fsp: 3 }),
  status: varchar("status", { length: 24 }).notNull().default("draft"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [uniqueIndex("territories_municipality_state_uq").on(table.municipality, table.state)]);

export const categories = mysqlTable("categories", {
  id: id().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  cnaes: json("cnaes").notNull(),
  exclusions: text("exclusions"),
  confirmedAt: datetime("confirmed_at", { mode: "date", fsp: 3 }),
  status: varchar("status", { length: 24 }).notNull().default("draft"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [uniqueIndex("categories_name_uq").on(table.name)]);

export const collectiveDocuments = mysqlTable("collective_documents", {
  id: id().primaryKey(),
  slug: varchar("slug", { length: 190 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  summary: text("summary"),
  municipality: varchar("municipality", { length: 255 }).notNull(),
  categoryId: char("category_id", { length: 36 }),
  categoryLabel: varchar("category_label", { length: 255 }).notNull(),
  year: int("year").notNull(),
  documentType: varchar("document_type", { length: 24 }).notNull(),
  documentStatus: varchar("document_status", { length: 24 }).notNull(),
  validFrom: date("valid_from", { mode: "string" }),
  validUntil: date("valid_until", { mode: "string" }),
  baseDate: varchar("base_date", { length: 100 }),
  laborUnion: varchar("labor_union", { length: 255 }),
  mteRegistration: varchar("mte_registration", { length: 100 }),
  lastReviewedAt: datetime("last_reviewed_at", { mode: "date", fsp: 3 }).notNull(),
  officialSource: varchar("official_source", { length: 255 }),
  storagePath: varchar("storage_path", { length: 500 }),
  originalFilename: varchar("original_filename", { length: 255 }),
  mimeType: varchar("mime_type", { length: 100 }),
  fileSizeBytes: bigint("file_size_bytes", { mode: "number" }),
  versionNumber: int("version_number").notNull().default(1),
  status: varchar("status", { length: 24 }).notNull().default("draft"),
  publishedAt: datetime("published_at", { mode: "date", fsp: 3 }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  uniqueIndex("collective_documents_slug_uq").on(table.slug),
  index("collective_documents_filter_idx").on(table.documentStatus, table.year, table.municipality, table.documentType),
  index("collective_documents_status_idx").on(table.status),
]);

export const documentRelations = mysqlTable("document_relations", {
  id: id().primaryKey(),
  sourceDocumentId: char("source_document_id", { length: 36 }).notNull(),
  relatedDocumentId: char("related_document_id", { length: 36 }).notNull(),
  relationType: varchar("relation_type", { length: 24 }).notNull(),
  createdAt: createdAt(),
}, (table) => [uniqueIndex("document_relations_uq").on(table.sourceDocumentId, table.relatedDocumentId, table.relationType)]);

export const agendaItems = mysqlTable("agenda_items", {
  id: id().primaryKey(),
  slug: varchar("slug", { length: 190 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startsAt: datetime("starts_at", { mode: "date", fsp: 3 }).notNull(),
  endsAt: datetime("ends_at", { mode: "date", fsp: 3 }),
  municipality: varchar("municipality", { length: 255 }).notNull(),
  agendaType: varchar("agenda_type", { length: 24 }).notNull(),
  agendaStatus: varchar("agenda_status", { length: 24 }).notNull(),
  relatedDocumentId: char("related_document_id", { length: 36 }),
  location: varchar("location", { length: 255 }),
  registrationUrl: varchar("registration_url", { length: 500 }),
  status: varchar("status", { length: 24 }).notNull().default("draft"),
  publishedAt: datetime("published_at", { mode: "date", fsp: 3 }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [uniqueIndex("agenda_items_slug_uq").on(table.slug), index("agenda_items_date_idx").on(table.startsAt, table.agendaStatus), index("agenda_items_status_idx").on(table.status)]);

export const services = mysqlTable("services", {
  id: id().primaryKey(),
  slug: varchar("slug", { length: 190 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  excerpt: text("excerpt"),
  content: json("content").notNull(),
  category: varchar("category", { length: 32 }).notNull(),
  eligibility: text("eligibility"),
  isExclusive: boolean("is_exclusive").notNull().default(false),
  partnerName: varchar("partner_name", { length: 255 }),
  validUntil: date("valid_until", { mode: "string" }),
  contactUrl: varchar("contact_url", { length: 500 }),
  status: varchar("status", { length: 24 }).notNull().default("draft"),
  publishedAt: datetime("published_at", { mode: "date", fsp: 3 }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [uniqueIndex("services_slug_uq").on(table.slug), index("services_status_idx").on(table.status)]);

export const partners = mysqlTable("partners", {
  id: id().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  logoPath: varchar("logo_path", { length: 500 }),
  websiteUrl: varchar("website_url", { length: 500 }),
  validFrom: date("valid_from", { mode: "string" }),
  validUntil: date("valid_until", { mode: "string" }),
  displayOrder: int("display_order").notNull().default(0),
  status: varchar("status", { length: 24 }).notNull().default("draft"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [index("partners_status_order_idx").on(table.status, table.displayOrder)]);

export const posts = mysqlTable("posts", {
  id: id().primaryKey(),
  slug: varchar("slug", { length: 190 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  excerpt: text("excerpt"),
  content: json("content").notNull(),
  category: varchar("category", { length: 255 }).notNull(),
  authorName: varchar("author_name", { length: 255 }).notNull(),
  sourceUrl: varchar("source_url", { length: 500 }),
  coverImagePath: varchar("cover_image_path", { length: 500 }),
  status: varchar("status", { length: 24 }).notNull().default("draft"),
  publishedAt: datetime("published_at", { mode: "date", fsp: 3 }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [uniqueIndex("posts_slug_uq").on(table.slug), index("posts_status_published_idx").on(table.status, table.publishedAt)]);

export const submissions = mysqlTable("submissions", {
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
  consentAt: datetime("consent_at", { mode: "date", fsp: 3 }).notNull(),
  emailNotificationStatus: varchar("email_notification_status", { length: 24 }).notNull().default("pending"),
  emailNotificationError: text("email_notification_error"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [uniqueIndex("submissions_protocol_uq").on(table.protocol), index("submissions_status_created_idx").on(table.status, table.createdAt)]);

export const submissionEvents = mysqlTable("submission_events", {
  id: id().primaryKey(),
  submissionId: char("submission_id", { length: 36 }).notNull(),
  eventType: varchar("event_type", { length: 40 }).notNull(),
  fromStatus: varchar("from_status", { length: 24 }),
  toStatus: varchar("to_status", { length: 24 }),
  details: json("details").notNull(),
  actorEmail: varchar("actor_email", { length: 320 }),
  createdAt: createdAt(),
}, (table) => [index("submission_events_submission_idx").on(table.submissionId, table.createdAt)]);

export const contentRevisions = mysqlTable("content_revisions", {
  id: id().primaryKey(),
  entityType: varchar("entity_type", { length: 80 }).notNull(),
  entityId: char("entity_id", { length: 36 }).notNull(),
  revisionNumber: int("revision_number").notNull(),
  snapshot: json("snapshot").notNull(),
  actorEmail: varchar("actor_email", { length: 320 }).notNull(),
  createdAt: createdAt(),
}, (table) => [uniqueIndex("content_revisions_uq").on(table.entityType, table.entityId, table.revisionNumber)]);

export const auditLog = mysqlTable("audit_log", {
  id: id().primaryKey(),
  actorEmail: varchar("actor_email", { length: 320 }).notNull(),
  action: varchar("action", { length: 40 }).notNull(),
  entityType: varchar("entity_type", { length: 80 }).notNull(),
  entityId: varchar("entity_id", { length: 100 }),
  beforeData: json("before_data"),
  afterData: json("after_data"),
  createdAt: createdAt(),
}, (table) => [index("audit_log_entity_idx").on(table.entityType, table.entityId, table.createdAt)]);

export const mediaFiles = mysqlTable("media_files", {
  id: id().primaryKey(),
  storageKey: varchar("storage_key", { length: 500 }).notNull(),
  originalFilename: varchar("original_filename", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  byteSize: bigint("byte_size", { mode: "number" }).notNull(),
  sha256: char("sha256", { length: 64 }).notNull(),
  kind: varchar("kind", { length: 24 }).notNull(),
  visibility: varchar("visibility", { length: 16 }).notNull().default("private"),
  createdAt: createdAt(),
  deletedAt: datetime("deleted_at", { mode: "date", fsp: 3 }),
}, (table) => [uniqueIndex("media_files_storage_key_uq").on(table.storageKey), index("media_files_visibility_idx").on(table.visibility, table.deletedAt)]);

export const adminUsers = mysqlTable("admin_users", {
  id: id().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  totpSecretEncrypted: text("totp_secret_encrypted"),
  totpEnabled: boolean("totp_enabled").notNull().default(false),
  failedLoginCount: int("failed_login_count").notNull().default(0),
  lockedUntil: datetime("locked_until", { mode: "date", fsp: 3 }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [uniqueIndex("admin_users_email_uq").on(table.email)]);

export const adminSessions = mysqlTable("admin_sessions", {
  id: id().primaryKey(),
  adminUserId: char("admin_user_id", { length: 36 }).notNull(),
  tokenHash: char("token_hash", { length: 64 }).notNull(),
  mfaVerifiedAt: datetime("mfa_verified_at", { mode: "date", fsp: 3 }),
  expiresAt: datetime("expires_at", { mode: "date", fsp: 3 }).notNull(),
  createdAt: createdAt(),
  lastSeenAt: datetime("last_seen_at", { mode: "date", fsp: 3 }).notNull(),
}, (table) => [uniqueIndex("admin_sessions_token_uq").on(table.tokenHash), index("admin_sessions_expiry_idx").on(table.expiresAt)]);

export const adminRecoveryCodes = mysqlTable("admin_recovery_codes", {
  id: id().primaryKey(),
  adminUserId: char("admin_user_id", { length: 36 }).notNull(),
  codeHash: char("code_hash", { length: 64 }).notNull(),
  usedAt: datetime("used_at", { mode: "date", fsp: 3 }),
  createdAt: createdAt(),
}, (table) => [uniqueIndex("admin_recovery_codes_hash_uq").on(table.codeHash), index("admin_recovery_codes_admin_idx").on(table.adminUserId, table.usedAt)]);

export const rateLimitBuckets = mysqlTable("rate_limit_buckets", {
  id: id().primaryKey(),
  bucketKey: varchar("bucket_key", { length: 190 }).notNull(),
  windowStartedAt: datetime("window_started_at", { mode: "date", fsp: 3 }).notNull(),
  hits: int("hits").notNull().default(0),
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
