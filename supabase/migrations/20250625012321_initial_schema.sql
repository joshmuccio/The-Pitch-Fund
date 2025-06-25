-- The Pitch Fund Supabase schema
-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ===== CUSTOM ENUMS =====
create type user_role as enum ('admin','lp');

-- ===== PROFILES =====
create table if not exists profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    role user_role not null default 'lp',
    created_at timestamptz default now()
);
alter table profiles enable row level security;

-- Users can read only their own profile
create policy "Profiles: self read" on profiles
for select using (auth.uid() = id);

-- ===== COMPANIES (Public) =====
create table if not exists companies (
    id uuid primary key default gen_random_uuid(),
    slug text unique not null,
    name text not null,
    logo_url text,
    tagline text,
    industry_tags text[],
    latest_round text,
    employees integer,
    status text, -- pre_revenue / post_revenue
    description text,
    pitch_deck_url text,
    youtube_url text,
    spotify_url text,
    linkedin_url text,
    location text,
    created_at timestamptz default now()
);

alter table companies enable row level security;

-- Public can read basic company data
create policy "Companies: public read" on companies
for select using (true);

-- Admins can insert/update/delete companies
create policy "Companies: admin write" on companies
for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ===== KPIs (LP‑only) =====
create table if not exists kpis (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references companies(id) on delete cascade,
    label text not null,
    unit text,
    created_at timestamptz default now()
);
create table if not exists kpi_values (
    id uuid primary key default gen_random_uuid(),
    kpi_id uuid not null references kpis(id) on delete cascade,
    period_date date not null,
    value numeric,
    created_at timestamptz default now()
);

alter table kpis enable row level security;
alter table kpi_values enable row level security;

-- Read access limited to LPs and admins
create policy "KPIs: lp read" on kpis
for select using (exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('lp','admin')));
create policy "KPI values: lp read" on kpi_values
for select using (exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('lp','admin')));

-- Admin write
create policy "KPIs: admin write" on kpis
for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "KPI values: admin write" on kpi_values
for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ===== FOUNDER UPDATES (LP‑only) =====
create table if not exists founder_updates (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references companies(id) on delete cascade,
    period_start date,
    period_end date,
    update_text text,
    ai_summary text,
    created_at timestamptz default now()
);
alter table founder_updates enable row level security;

create policy "Updates: lp read" on founder_updates
for select using (exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('lp','admin')));

create policy "Updates: admin write" on founder_updates
for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ===== OPTIONAL: VECTOR EMBEDDINGS FOR AI Q&A =====
create extension if not exists vector; -- pgvector
create table if not exists embeddings (
    id bigserial primary key,
    company_id uuid references companies(id) on delete cascade,
    content text,
    content_embedding vector(1536)
);
alter table embeddings enable row level security;
create policy "Embeddings: lp read" on embeddings
for select using (exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('lp','admin')));
create policy "Embeddings: admin write" on embeddings
for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
