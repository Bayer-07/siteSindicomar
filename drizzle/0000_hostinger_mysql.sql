CREATE TABLE IF NOT EXISTS site_settings (
  id CHAR(36) NOT NULL PRIMARY KEY,
  `key` VARCHAR(190) NOT NULL,
  value JSON NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY site_settings_key_uq (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pages (
  id CHAR(36) NOT NULL PRIMARY KEY,
  slug VARCHAR(190) NOT NULL,
  title VARCHAR(255) NOT NULL,
  excerpt TEXT NULL,
  content JSON NOT NULL,
  seo_title VARCHAR(255) NULL,
  seo_description TEXT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'draft',
  published_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY pages_slug_uq (slug),
  KEY pages_status_idx (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS directors (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  bio TEXT NULL,
  photo_path VARCHAR(500) NULL,
  mandate_start DATE NULL,
  mandate_end DATE NULL,
  display_order INT NOT NULL DEFAULT 0,
  status VARCHAR(24) NOT NULL DEFAULT 'draft',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY directors_status_order_idx (status, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS territories (
  id CHAR(36) NOT NULL PRIMARY KEY,
  municipality VARCHAR(255) NOT NULL,
  state CHAR(2) NOT NULL DEFAULT 'PR',
  notes TEXT NULL,
  confirmed_at DATETIME(3) NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'draft',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY territories_municipality_state_uq (municipality, state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  cnaes JSON NOT NULL,
  exclusions TEXT NULL,
  confirmed_at DATETIME(3) NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'draft',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY categories_name_uq (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS collective_documents (
  id CHAR(36) NOT NULL PRIMARY KEY,
  slug VARCHAR(190) NOT NULL,
  title VARCHAR(255) NOT NULL,
  summary TEXT NULL,
  municipality VARCHAR(255) NOT NULL,
  category_id CHAR(36) NULL,
  category_label VARCHAR(255) NOT NULL,
  year INT NOT NULL,
  document_type VARCHAR(24) NOT NULL,
  document_status VARCHAR(24) NOT NULL,
  valid_from DATE NULL,
  valid_until DATE NULL,
  base_date VARCHAR(100) NULL,
  labor_union VARCHAR(255) NULL,
  mte_registration VARCHAR(100) NULL,
  last_reviewed_at DATETIME(3) NOT NULL,
  official_source VARCHAR(255) NULL,
  storage_path VARCHAR(500) NULL,
  original_filename VARCHAR(255) NULL,
  mime_type VARCHAR(100) NULL,
  file_size_bytes BIGINT NULL,
  version_number INT NOT NULL DEFAULT 1,
  status VARCHAR(24) NOT NULL DEFAULT 'draft',
  published_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY collective_documents_slug_uq (slug),
  UNIQUE KEY collective_documents_storage_path_uq (storage_path),
  KEY collective_documents_filter_idx (document_status, year, municipality, document_type),
  KEY collective_documents_status_idx (status),
  CONSTRAINT collective_documents_category_fk FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS document_relations (
  id CHAR(36) NOT NULL PRIMARY KEY,
  source_document_id CHAR(36) NOT NULL,
  related_document_id CHAR(36) NOT NULL,
  relation_type VARCHAR(24) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY document_relations_uq (source_document_id, related_document_id, relation_type),
  CONSTRAINT document_relations_source_fk FOREIGN KEY (source_document_id) REFERENCES collective_documents(id) ON DELETE CASCADE,
  CONSTRAINT document_relations_related_fk FOREIGN KEY (related_document_id) REFERENCES collective_documents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS agenda_items (
  id CHAR(36) NOT NULL PRIMARY KEY,
  slug VARCHAR(190) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  starts_at DATETIME(3) NOT NULL,
  ends_at DATETIME(3) NULL,
  municipality VARCHAR(255) NOT NULL,
  agenda_type VARCHAR(24) NOT NULL,
  agenda_status VARCHAR(24) NOT NULL,
  related_document_id CHAR(36) NULL,
  location VARCHAR(255) NULL,
  registration_url VARCHAR(500) NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'draft',
  published_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY agenda_items_slug_uq (slug),
  KEY agenda_items_date_idx (starts_at, agenda_status),
  KEY agenda_items_status_idx (status),
  CONSTRAINT agenda_items_related_document_fk FOREIGN KEY (related_document_id) REFERENCES collective_documents(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS services (
  id CHAR(36) NOT NULL PRIMARY KEY,
  slug VARCHAR(190) NOT NULL,
  title VARCHAR(255) NOT NULL,
  excerpt TEXT NULL,
  content JSON NOT NULL,
  category VARCHAR(32) NOT NULL,
  eligibility TEXT NULL,
  is_exclusive TINYINT(1) NOT NULL DEFAULT 0,
  partner_name VARCHAR(255) NULL,
  valid_until DATE NULL,
  contact_url VARCHAR(500) NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'draft',
  published_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY services_slug_uq (slug),
  KEY services_status_idx (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS partners (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  logo_path VARCHAR(500) NULL,
  website_url VARCHAR(500) NULL,
  valid_from DATE NULL,
  valid_until DATE NULL,
  display_order INT NOT NULL DEFAULT 0,
  status VARCHAR(24) NOT NULL DEFAULT 'draft',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY partners_status_order_idx (status, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS posts (
  id CHAR(36) NOT NULL PRIMARY KEY,
  slug VARCHAR(190) NOT NULL,
  title VARCHAR(255) NOT NULL,
  excerpt TEXT NULL,
  content JSON NOT NULL,
  category VARCHAR(255) NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  source_url VARCHAR(500) NULL,
  cover_image_path VARCHAR(500) NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'draft',
  published_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY posts_slug_uq (slug),
  KEY posts_status_published_idx (status, published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS submissions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  protocol VARCHAR(24) NOT NULL,
  kind VARCHAR(24) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'new',
  requester_name VARCHAR(255) NOT NULL,
  email VARCHAR(320) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  preferred_channel VARCHAR(24) NOT NULL,
  subject VARCHAR(255) NULL,
  company_cnpj VARCHAR(32) NULL,
  company_name VARCHAR(255) NULL,
  municipality VARCHAR(255) NULL,
  activity TEXT NULL,
  message TEXT NOT NULL,
  source_path VARCHAR(500) NULL,
  consent_at DATETIME(3) NOT NULL,
  email_notification_status VARCHAR(24) NOT NULL DEFAULT 'pending',
  email_notification_error TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY submissions_protocol_uq (protocol),
  KEY submissions_status_created_idx (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS submission_events (
  id CHAR(36) NOT NULL PRIMARY KEY,
  submission_id CHAR(36) NOT NULL,
  event_type VARCHAR(40) NOT NULL,
  from_status VARCHAR(24) NULL,
  to_status VARCHAR(24) NULL,
  details JSON NOT NULL,
  actor_email VARCHAR(320) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY submission_events_submission_idx (submission_id, created_at),
  CONSTRAINT submission_events_submission_fk FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS content_revisions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  entity_type VARCHAR(80) NOT NULL,
  entity_id CHAR(36) NOT NULL,
  revision_number INT NOT NULL,
  snapshot JSON NOT NULL,
  actor_email VARCHAR(320) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY content_revisions_uq (entity_type, entity_id, revision_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_log (
  id CHAR(36) NOT NULL PRIMARY KEY,
  actor_email VARCHAR(320) NOT NULL,
  action VARCHAR(40) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id VARCHAR(100) NULL,
  before_data JSON NULL,
  after_data JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY audit_log_entity_idx (entity_type, entity_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS media_files (
  id CHAR(36) NOT NULL PRIMARY KEY,
  storage_key VARCHAR(500) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  byte_size BIGINT NOT NULL,
  sha256 CHAR(64) NOT NULL,
  kind VARCHAR(24) NOT NULL,
  visibility VARCHAR(16) NOT NULL DEFAULT 'private',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  UNIQUE KEY media_files_storage_key_uq (storage_key),
  KEY media_files_visibility_idx (visibility, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_users (
  id CHAR(36) NOT NULL PRIMARY KEY,
  email VARCHAR(320) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  totp_secret_encrypted TEXT NULL,
  totp_enabled TINYINT(1) NOT NULL DEFAULT 0,
  failed_login_count INT NOT NULL DEFAULT 0,
  locked_until DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY admin_users_email_uq (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_sessions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  admin_user_id CHAR(36) NOT NULL,
  token_hash CHAR(64) NOT NULL,
  mfa_verified_at DATETIME(3) NULL,
  expires_at DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  last_seen_at DATETIME(3) NOT NULL,
  UNIQUE KEY admin_sessions_token_uq (token_hash),
  KEY admin_sessions_expiry_idx (expires_at),
  CONSTRAINT admin_sessions_admin_fk FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_recovery_codes (
  id CHAR(36) NOT NULL PRIMARY KEY,
  admin_user_id CHAR(36) NOT NULL,
  code_hash CHAR(64) NOT NULL,
  used_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY admin_recovery_codes_hash_uq (code_hash),
  KEY admin_recovery_codes_admin_idx (admin_user_id, used_at),
  CONSTRAINT admin_recovery_codes_admin_fk FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  id CHAR(36) NOT NULL PRIMARY KEY,
  bucket_key VARCHAR(190) NOT NULL,
  window_started_at DATETIME(3) NOT NULL,
  hits INT NOT NULL DEFAULT 0,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY rate_limit_buckets_key_uq (bucket_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
