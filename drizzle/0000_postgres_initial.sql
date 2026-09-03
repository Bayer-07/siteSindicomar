CREATE EXTENSION IF NOT EXISTS pgcrypto;--> statement-breakpoint
CREATE TABLE "admin_recovery_codes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"admin_user_id" uuid NOT NULL,
	"code_hash" varchar(64) NOT NULL,
	"used_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"admin_user_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"mfa_verified_at" timestamp (3) with time zone,
	"expires_at" timestamp (3) with time zone NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"last_seen_at" timestamp (3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"totp_secret_encrypted" text,
	"totp_enabled" boolean DEFAULT false NOT NULL,
	"failed_login_count" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agenda_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" varchar(190) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"starts_at" timestamp (3) with time zone NOT NULL,
	"ends_at" timestamp (3) with time zone,
	"municipality" varchar(255) NOT NULL,
	"agenda_type" varchar(24) NOT NULL,
	"agenda_status" varchar(24) NOT NULL,
	"related_document_id" uuid,
	"location" varchar(255),
	"registration_url" varchar(500),
	"status" varchar(24) DEFAULT 'draft' NOT NULL,
	"published_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY NOT NULL,
	"actor_email" varchar(320) NOT NULL,
	"action" varchar(40) NOT NULL,
	"entity_type" varchar(80) NOT NULL,
	"entity_id" varchar(100),
	"before_data" jsonb,
	"after_data" jsonb,
	"created_at" timestamp (3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"cnaes" jsonb NOT NULL,
	"exclusions" text,
	"confirmed_at" timestamp (3) with time zone,
	"status" varchar(24) DEFAULT 'draft' NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collective_documents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" varchar(190) NOT NULL,
	"title" varchar(255) NOT NULL,
	"summary" text,
	"municipality" varchar(255) NOT NULL,
	"category_id" uuid,
	"category_label" varchar(255) NOT NULL,
	"year" integer NOT NULL,
	"document_type" varchar(24) NOT NULL,
	"document_status" varchar(24) NOT NULL,
	"valid_from" date,
	"valid_until" date,
	"base_date" varchar(100),
	"labor_union" varchar(255),
	"mte_registration" varchar(100),
	"last_reviewed_at" timestamp (3) with time zone NOT NULL,
	"official_source" varchar(255),
	"storage_path" varchar(500),
	"original_filename" varchar(255),
	"mime_type" varchar(100),
	"file_size_bytes" bigint,
	"version_number" integer DEFAULT 1 NOT NULL,
	"status" varchar(24) DEFAULT 'draft' NOT NULL,
	"published_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_revisions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"entity_type" varchar(80) NOT NULL,
	"entity_id" uuid NOT NULL,
	"revision_number" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"actor_email" varchar(320) NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "directors" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" varchar(255) NOT NULL,
	"bio" text,
	"photo_path" varchar(500),
	"mandate_start" date,
	"mandate_end" date,
	"display_order" integer DEFAULT 0 NOT NULL,
	"status" varchar(24) DEFAULT 'draft' NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_relations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"source_document_id" uuid NOT NULL,
	"related_document_id" uuid NOT NULL,
	"relation_type" varchar(24) NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_files" (
	"id" uuid PRIMARY KEY NOT NULL,
	"storage_key" varchar(500) NOT NULL,
	"original_filename" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"byte_size" bigint NOT NULL,
	"sha256" varchar(64) NOT NULL,
	"kind" varchar(24) NOT NULL,
	"visibility" varchar(16) DEFAULT 'private' NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp (3) with time zone
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" varchar(190) NOT NULL,
	"title" varchar(255) NOT NULL,
	"excerpt" text,
	"content" jsonb NOT NULL,
	"seo_title" varchar(255),
	"seo_description" text,
	"status" varchar(24) DEFAULT 'draft' NOT NULL,
	"published_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"logo_path" varchar(500),
	"website_url" varchar(500),
	"valid_from" date,
	"valid_until" date,
	"display_order" integer DEFAULT 0 NOT NULL,
	"status" varchar(24) DEFAULT 'draft' NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" varchar(190) NOT NULL,
	"title" varchar(255) NOT NULL,
	"excerpt" text,
	"content" jsonb NOT NULL,
	"category" varchar(255) NOT NULL,
	"author_name" varchar(255) NOT NULL,
	"source_url" varchar(500),
	"cover_image_path" varchar(500),
	"status" varchar(24) DEFAULT 'draft' NOT NULL,
	"published_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit_buckets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"bucket_key" varchar(190) NOT NULL,
	"window_started_at" timestamp (3) with time zone NOT NULL,
	"hits" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" varchar(190) NOT NULL,
	"title" varchar(255) NOT NULL,
	"excerpt" text,
	"content" jsonb NOT NULL,
	"category" varchar(32) NOT NULL,
	"eligibility" text,
	"is_exclusive" boolean DEFAULT false NOT NULL,
	"partner_name" varchar(255),
	"valid_until" date,
	"contact_url" varchar(500),
	"status" varchar(24) DEFAULT 'draft' NOT NULL,
	"published_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"key" varchar(190) NOT NULL,
	"value" jsonb NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"submission_id" uuid NOT NULL,
	"event_type" varchar(40) NOT NULL,
	"from_status" varchar(24),
	"to_status" varchar(24),
	"details" jsonb NOT NULL,
	"actor_email" varchar(320),
	"created_at" timestamp (3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"protocol" varchar(24) NOT NULL,
	"kind" varchar(24) NOT NULL,
	"status" varchar(24) DEFAULT 'new' NOT NULL,
	"requester_name" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"phone" varchar(40) NOT NULL,
	"preferred_channel" varchar(24) NOT NULL,
	"subject" varchar(255),
	"company_cnpj" varchar(32),
	"company_name" varchar(255),
	"municipality" varchar(255),
	"activity" text,
	"message" text NOT NULL,
	"source_path" varchar(500),
	"consent_at" timestamp (3) with time zone NOT NULL,
	"email_notification_status" varchar(24) DEFAULT 'pending' NOT NULL,
	"email_notification_error" text,
	"created_at" timestamp (3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "territories" (
	"id" uuid PRIMARY KEY NOT NULL,
	"municipality" varchar(255) NOT NULL,
	"state" varchar(2) DEFAULT 'PR' NOT NULL,
	"notes" text,
	"confirmed_at" timestamp (3) with time zone,
	"status" varchar(24) DEFAULT 'draft' NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_recovery_codes" ADD CONSTRAINT "admin_recovery_codes_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_related_document_id_collective_documents_id_fk" FOREIGN KEY ("related_document_id") REFERENCES "public"."collective_documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collective_documents" ADD CONSTRAINT "collective_documents_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_relations" ADD CONSTRAINT "document_relations_source_document_id_collective_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."collective_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_relations" ADD CONSTRAINT "document_relations_related_document_id_collective_documents_id_fk" FOREIGN KEY ("related_document_id") REFERENCES "public"."collective_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_events" ADD CONSTRAINT "submission_events_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_recovery_codes_hash_uq" ON "admin_recovery_codes" USING btree ("code_hash");--> statement-breakpoint
CREATE INDEX "admin_recovery_codes_admin_idx" ON "admin_recovery_codes" USING btree ("admin_user_id","used_at");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_sessions_token_uq" ON "admin_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "admin_sessions_expiry_idx" ON "admin_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_email_uq" ON "admin_users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "agenda_items_slug_uq" ON "agenda_items" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "agenda_items_date_idx" ON "agenda_items" USING btree ("starts_at","agenda_status");--> statement-breakpoint
CREATE INDEX "agenda_items_status_idx" ON "agenda_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "audit_log_entity_idx" ON "audit_log" USING btree ("entity_type","entity_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_name_uq" ON "categories" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "collective_documents_slug_uq" ON "collective_documents" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "collective_documents_filter_idx" ON "collective_documents" USING btree ("document_status","year","municipality","document_type");--> statement-breakpoint
CREATE INDEX "collective_documents_status_idx" ON "collective_documents" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "content_revisions_uq" ON "content_revisions" USING btree ("entity_type","entity_id","revision_number");--> statement-breakpoint
CREATE INDEX "directors_status_order_idx" ON "directors" USING btree ("status","display_order");--> statement-breakpoint
CREATE UNIQUE INDEX "document_relations_uq" ON "document_relations" USING btree ("source_document_id","related_document_id","relation_type");--> statement-breakpoint
CREATE UNIQUE INDEX "media_files_storage_key_uq" ON "media_files" USING btree ("storage_key");--> statement-breakpoint
CREATE INDEX "media_files_visibility_idx" ON "media_files" USING btree ("visibility","deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "pages_slug_uq" ON "pages" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "pages_status_idx" ON "pages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "partners_status_order_idx" ON "partners" USING btree ("status","display_order");--> statement-breakpoint
CREATE UNIQUE INDEX "posts_slug_uq" ON "posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "posts_status_published_idx" ON "posts" USING btree ("status","published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "rate_limit_buckets_key_uq" ON "rate_limit_buckets" USING btree ("bucket_key");--> statement-breakpoint
CREATE UNIQUE INDEX "services_slug_uq" ON "services" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "services_status_idx" ON "services" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "site_settings_key_uq" ON "site_settings" USING btree ("key");--> statement-breakpoint
CREATE INDEX "submission_events_submission_idx" ON "submission_events" USING btree ("submission_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "submissions_protocol_uq" ON "submissions" USING btree ("protocol");--> statement-breakpoint
CREATE INDEX "submissions_status_created_idx" ON "submissions" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "territories_municipality_state_uq" ON "territories" USING btree ("municipality","state");
--> statement-breakpoint
CREATE OR REPLACE FUNCTION sindicomar_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION sindicomar_set_updated_at();
--> statement-breakpoint
CREATE TRIGGER pages_updated_at BEFORE UPDATE ON pages FOR EACH ROW EXECUTE FUNCTION sindicomar_set_updated_at();
--> statement-breakpoint
CREATE TRIGGER directors_updated_at BEFORE UPDATE ON directors FOR EACH ROW EXECUTE FUNCTION sindicomar_set_updated_at();
--> statement-breakpoint
CREATE TRIGGER territories_updated_at BEFORE UPDATE ON territories FOR EACH ROW EXECUTE FUNCTION sindicomar_set_updated_at();
--> statement-breakpoint
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION sindicomar_set_updated_at();
--> statement-breakpoint
CREATE TRIGGER collective_documents_updated_at BEFORE UPDATE ON collective_documents FOR EACH ROW EXECUTE FUNCTION sindicomar_set_updated_at();
--> statement-breakpoint
CREATE TRIGGER agenda_items_updated_at BEFORE UPDATE ON agenda_items FOR EACH ROW EXECUTE FUNCTION sindicomar_set_updated_at();
--> statement-breakpoint
CREATE TRIGGER services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION sindicomar_set_updated_at();
--> statement-breakpoint
CREATE TRIGGER partners_updated_at BEFORE UPDATE ON partners FOR EACH ROW EXECUTE FUNCTION sindicomar_set_updated_at();
--> statement-breakpoint
CREATE TRIGGER posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION sindicomar_set_updated_at();
--> statement-breakpoint
CREATE TRIGGER submissions_updated_at BEFORE UPDATE ON submissions FOR EACH ROW EXECUTE FUNCTION sindicomar_set_updated_at();
--> statement-breakpoint
CREATE TRIGGER admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION sindicomar_set_updated_at();
--> statement-breakpoint
CREATE TRIGGER admin_sessions_updated_at BEFORE UPDATE ON admin_sessions FOR EACH ROW EXECUTE FUNCTION sindicomar_set_updated_at();
--> statement-breakpoint
CREATE TRIGGER rate_limit_buckets_updated_at BEFORE UPDATE ON rate_limit_buckets FOR EACH ROW EXECUTE FUNCTION sindicomar_set_updated_at();
