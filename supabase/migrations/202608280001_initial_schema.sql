create extension if not exists pgcrypto;

create table if not exists public.admin_allowlist (
  email text primary key,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_allowlist
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  link_url text,
  priority integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  content jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  seo_title text,
  seo_description text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.directors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  bio text,
  photo_path text,
  mandate_start date,
  mandate_end date,
  display_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.territories (
  id uuid primary key default gen_random_uuid(),
  municipality text not null,
  state char(2) not null default 'PR',
  notes text,
  confirmed_at timestamptz,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (municipality, state)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  cnaes text[] not null default '{}',
  exclusions text,
  confirmed_at timestamptz,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collective_documents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text,
  municipality text not null,
  category_id uuid references public.categories(id) on delete restrict,
  category_label text not null,
  year integer not null check (year between 1900 and 2200),
  document_type text not null check (document_type in ('cct','act','amendment','minutes','circular','notice')),
  document_status text not null check (document_status in ('current','extended','negotiating','superseded','expired')),
  valid_from date,
  valid_until date,
  base_date text,
  labor_union text,
  mte_registration text,
  last_reviewed_at timestamptz not null,
  official_source text,
  storage_path text unique,
  original_filename text,
  mime_type text check (mime_type is null or mime_type = 'application/pdf'),
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes <= 20971520),
  version_number integer not null default 1 check (version_number > 0),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_until is null or valid_from is null or valid_until >= valid_from)
);

create table if not exists public.document_relations (
  id uuid primary key default gen_random_uuid(),
  source_document_id uuid not null references public.collective_documents(id) on delete cascade,
  related_document_id uuid not null references public.collective_documents(id) on delete cascade,
  relation_type text not null check (relation_type in ('amends','extends','replaces','references','communicates')),
  created_at timestamptz not null default now(),
  unique (source_document_id, related_document_id, relation_type),
  check (source_document_id <> related_document_id)
);

create table if not exists public.agenda_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  municipality text not null,
  agenda_type text not null check (agenda_type in ('holiday','special-hours','assembly','course','event')),
  agenda_status text not null check (agenda_status in ('confirmed','pending','cancelled','informational')),
  related_document_id uuid references public.collective_documents(id) on delete set null,
  location text,
  registration_url text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  content jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  category text not null,
  eligibility text,
  is_exclusive boolean not null default false,
  partner_name text,
  valid_until date,
  contact_url text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  logo_path text,
  website_url text,
  valid_from date,
  valid_until date,
  display_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  content jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  category text not null,
  author_name text not null,
  source_url text,
  cover_image_path text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  protocol text not null unique,
  kind text not null check (kind in ('contact','classification','membership')),
  status text not null default 'new' check (status in ('new','handling','waiting','completed')),
  requester_name text not null,
  email text not null,
  phone text not null,
  preferred_channel text not null check (preferred_channel in ('email','phone','whatsapp')),
  subject text,
  company_cnpj text,
  company_name text,
  municipality text,
  activity text,
  message text not null,
  source_path text,
  consent_at timestamptz not null,
  email_notification_status text not null default 'pending' check (email_notification_status in ('pending','sent','failed')),
  email_notification_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.submission_events (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  details jsonb not null default '{}'::jsonb,
  actor_email text,
  created_at timestamptz not null default now()
);

create table if not exists public.content_revisions (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  revision_number integer not null,
  snapshot jsonb not null,
  actor_email text not null,
  created_at timestamptz not null default now(),
  unique (entity_type, entity_id, revision_number)
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_email text not null,
  action text not null,
  entity_type text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists submissions_status_created_idx on public.submissions(status, created_at desc);
create index if not exists collective_documents_filter_idx on public.collective_documents(document_status, year desc, municipality, document_type);
create index if not exists agenda_items_date_idx on public.agenda_items(starts_at, agenda_status);
create index if not exists posts_status_published_idx on public.posts(status, published_at desc);

do $$
declare table_name text;
begin
  foreach table_name in array array['site_settings','alerts','pages','directors','territories','categories','collective_documents','agenda_items','services','partners','posts','submissions']
  loop
    execute format('drop trigger if exists %I_touch_updated_at on public.%I', table_name, table_name);
    execute format('create trigger %I_touch_updated_at before update on public.%I for each row execute function public.touch_updated_at()', table_name, table_name);
  end loop;
end $$;

alter table public.admin_allowlist enable row level security;
alter table public.site_settings enable row level security;
alter table public.alerts enable row level security;
alter table public.pages enable row level security;
alter table public.directors enable row level security;
alter table public.territories enable row level security;
alter table public.categories enable row level security;
alter table public.collective_documents enable row level security;
alter table public.document_relations enable row level security;
alter table public.agenda_items enable row level security;
alter table public.services enable row level security;
alter table public.partners enable row level security;
alter table public.posts enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_events enable row level security;
alter table public.content_revisions enable row level security;
alter table public.audit_log enable row level security;

create policy "public reads published alerts" on public.alerts for select using (status = 'published' and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));
create policy "public reads published pages" on public.pages for select using (status = 'published');
create policy "public reads published directors" on public.directors for select using (status = 'published');
create policy "public reads published territories" on public.territories for select using (status = 'published');
create policy "public reads published categories" on public.categories for select using (status = 'published');
create policy "public reads published documents" on public.collective_documents for select using (status = 'published');
create policy "public reads relations for published documents" on public.document_relations for select using (exists (select 1 from public.collective_documents d where d.id = source_document_id and d.status = 'published') and exists (select 1 from public.collective_documents d where d.id = related_document_id and d.status = 'published'));
create policy "public reads published agenda" on public.agenda_items for select using (status = 'published');
create policy "public reads published services" on public.services for select using (status = 'published');
create policy "public reads published partners" on public.partners for select using (status = 'published');
create policy "public reads published posts" on public.posts for select using (status = 'published');

do $$
declare table_name text;
begin
  foreach table_name in array array['admin_allowlist','site_settings','alerts','pages','directors','territories','categories','collective_documents','document_relations','agenda_items','services','partners','posts','submissions','submission_events','content_revisions','audit_log']
  loop
    execute format('create policy "admin manages %I" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', table_name, table_name);
  end loop;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('public-documents', 'public-documents', true, 20971520, array['application/pdf']),
  ('public-images', 'public-images', true, 10485760, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "public reads public assets" on storage.objects for select using (bucket_id in ('public-documents','public-images'));
create policy "admin uploads public assets" on storage.objects for insert to authenticated with check (bucket_id in ('public-documents','public-images') and public.is_admin());
create policy "admin updates public assets" on storage.objects for update to authenticated using (bucket_id in ('public-documents','public-images') and public.is_admin()) with check (bucket_id in ('public-documents','public-images') and public.is_admin());
create policy "admin deletes public assets" on storage.objects for delete to authenticated using (bucket_id in ('public-documents','public-images') and public.is_admin());

comment on table public.collective_documents is 'Each file version is a new immutable record; storage_path must never be overwritten.';
comment on table public.submissions is 'Retain for 12 months by default only after privacy policy approval.';
