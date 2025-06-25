# Database Documentation

This document describes the complete database schema for The Pitch Fund application.

## 🏗️ Architecture Overview

The database uses **PostgreSQL** with **Row Level Security (RLS)** to ensure proper access control. All tables are designed around a **role-based access system** with three user types:

- **Public** - Can view basic company information
- **LP (Limited Partners)** - Can access private metrics and updates
- **Admin** - Full CRUD access to all data

## 📊 Schema Diagram

```
auth.users (Supabase Auth)
    ↓
profiles (user roles)
    ↓
companies (portfolio companies) ←─── PUBLIC ACCESS
    ↓
├── kpis → kpi_values (metrics)     ←─── LP ONLY
├── founder_updates (communications) ←─── LP ONLY  
└── embeddings (AI vectors)         ←─── LP ONLY
```

## 🗃️ Table Specifications

### `profiles`
Links Supabase Auth users to application roles.

```sql
CREATE TABLE profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'lp',
    created_at timestamptz DEFAULT now()
);
```

**Security**: Users can only read their own profile.

---

### `companies`
Portfolio companies with public information.

```sql
CREATE TABLE companies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    name text NOT NULL,
    logo_url text,
    tagline text,
    industry_tags text[],
    latest_round text,
    employees integer,
    status text, -- 'pre_revenue' or 'post_revenue'
    description text,
    pitch_deck_url text,
    youtube_url text,
    spotify_url text,
    linkedin_url text,
    location text,
    created_at timestamptz DEFAULT now()
);
```

**Security**: 
- **Read**: Public access (anyone can view)
- **Write**: Admin only

**Key Fields**:
- `slug`: URL-friendly identifier
- `industry_tags`: Array of industry categories
- `status`: Revenue stage indicator

---

### `kpis` & `kpi_values`
Key Performance Indicators with time-series data.

```sql
CREATE TABLE kpis (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    label text NOT NULL,
    unit text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE kpi_values (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_id uuid NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
    period_date date NOT NULL,
    value numeric,
    created_at timestamptz DEFAULT now()
);
```

**Security**: LP and Admin access only

**Relationship**: 
- One company → Many KPIs
- One KPI → Many time-period values

**Examples**:
- KPI: "Monthly Recurring Revenue", Unit: "USD"
- Values: [2024-01-01: 50000], [2024-02-01: 55000], ...

---

### `founder_updates`
Periodic communications from company founders.

```sql
CREATE TABLE founder_updates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    period_start date,
    period_end date,
    update_text text,
    ai_summary text,
    created_at timestamptz DEFAULT now()
);
```

**Security**: LP and Admin access only

**Key Fields**:
- `update_text`: Full founder communication
- `ai_summary`: AI-generated summary for quick reading
- `period_start/end`: Time period covered by update

---

### `embeddings`
Vector embeddings for AI-powered Q&A functionality.

```sql
CREATE TABLE embeddings (
    id bigserial PRIMARY KEY,
    company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
    content text,
    content_embedding vector(1536)
);
```

**Security**: LP and Admin access only

**Purpose**: 
- Stores text content with vector embeddings
- Enables semantic search and AI Q&A features
- Uses OpenAI-compatible 1536-dimensional vectors

## 🔒 Security Model

### Row Level Security (RLS)

All tables have RLS enabled with specific policies:

#### Public Access
```sql
-- Anyone can read company data
CREATE POLICY "Companies: public read" ON companies
FOR SELECT USING (true);
```

#### LP Access
```sql
-- LPs can read KPIs and updates
CREATE POLICY "KPIs: lp read" ON kpis
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND p.role IN ('lp','admin')
    )
);
```

#### Admin Access
```sql
-- Admins can do everything
CREATE POLICY "Companies: admin write" ON companies
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND p.role = 'admin'
    )
);
```

### Access Matrix

| Table | Public | LP | Admin |
|-------|--------|-----|-------|
| `companies` | Read | Read | Full |
| `profiles` | None | Self only | Full |
| `kpis` | None | Read | Full |
| `kpi_values` | None | Read | Full |
| `founder_updates` | None | Read | Full |
| `embeddings` | None | Read | Full |

## 🔧 Extensions Used

```sql
-- For UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- For encryption functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- For vector similarity search (AI features)
CREATE EXTENSION IF NOT EXISTS "vector";
```

## 📈 Indexes (Recommended)

For optimal performance, consider adding these indexes:

```sql
-- Company lookups
CREATE INDEX companies_slug_idx ON companies(slug);
CREATE INDEX companies_industry_idx ON companies USING GIN(industry_tags);

-- KPI queries
CREATE INDEX kpis_company_idx ON kpis(company_id);
CREATE INDEX kpi_values_period_idx ON kpi_values(period_date);
CREATE INDEX kpi_values_kpi_period_idx ON kpi_values(kpi_id, period_date);

-- Founder updates
CREATE INDEX founder_updates_company_idx ON founder_updates(company_id);
CREATE INDEX founder_updates_period_idx ON founder_updates(period_start, period_end);

-- Vector similarity search
CREATE INDEX embeddings_company_idx ON embeddings(company_id);
CREATE INDEX embeddings_vector_idx ON embeddings 
    USING ivfflat (content_embedding vector_cosine_ops);
```

## 🚀 Usage Examples

### Query Examples

```sql
-- Get all public companies
SELECT slug, name, tagline, industry_tags 
FROM companies;

-- Get LP-accessible KPI data for a company
SELECT k.label, k.unit, kv.period_date, kv.value
FROM kpis k
JOIN kpi_values kv ON k.id = kv.kpi_id
WHERE k.company_id = 'company-uuid'
ORDER BY kv.period_date DESC;

-- Get recent founder updates
SELECT period_start, period_end, ai_summary
FROM founder_updates
WHERE company_id = 'company-uuid'
ORDER BY period_start DESC
LIMIT 5;

-- Vector similarity search (for AI Q&A)
SELECT content, company_id
FROM embeddings
ORDER BY content_embedding <-> 'query-vector'
LIMIT 10;
```

## 🛠️ Migration Management

### Creating New Migrations

```bash
# Create new migration
supabase migration new add_new_feature

# Edit the generated file
# supabase/migrations/[timestamp]_add_new_feature.sql

# Apply to database
supabase db push
```

### Migration Best Practices

1. **Always use migrations** - Never edit schema directly in production
2. **Test locally first** - Use `supabase start` for local testing
3. **Backup before major changes** - Use Supabase dashboard backup feature
4. **Keep migrations atomic** - One logical change per migration
5. **Document breaking changes** - Update this file for schema changes

## 🔍 Monitoring & Maintenance

### Performance Monitoring

```sql
-- Check table sizes
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public';

-- Check index usage
SELECT indexrelname, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes;
```

### Regular Maintenance

1. **Vacuum tables** - Handled automatically by Supabase
2. **Monitor RLS policies** - Ensure they're performing well
3. **Archive old data** - Consider archiving old KPI values
4. **Update vector indexes** - Rebuild if AI accuracy degrades

---

**Last Updated**: June 2025  
**Schema Version**: 1.0.0  
**Migration**: `20250625012321_initial_schema.sql` 