# The Pitch Fund - Database Schema

## Overview

The Pitch Fund uses Supabase (PostgreSQL) with Row Level Security (RLS) for secure data access. The schema supports portfolio company management, founder tracking, and AI-powered insights.

## Core Tables

### profiles
User authentication and role management.
- `id` (uuid) - Links to auth.users
- `role` (enum) - 'admin' or 'lp'
- `created_at` (timestamptz)

### companies (Enhanced)
Portfolio companies with comprehensive investment tracking.

**Core Fields:**
- `id` (uuid) - Primary key
- `slug` (text) - URL-friendly identifier
- `name` (text) - Company name
- `logo_url`, `tagline`, `description` - Basic company info
- `industry_tags` (text[]) - Industry categories
- `location` - Company location

**Investment Tracking Fields:**
- `website_url` - Company website
- `company_linkedin_url` - Company LinkedIn profile
- `founded_year` - Year company was founded
- `investment_date` - Date of Pitch Fund investment
- `investment_amount` - Amount invested (USD)
- `post_money_valuation` - Valuation at investment
- `co_investors` (text[]) - Other investors in the round
- `pitch_episode_url` - Link to The Pitch episode
- `key_metrics` (jsonb) - Flexible metrics storage
- `is_active` - Whether company is still in portfolio
- `notes` - Internal notes
- `updated_at` - Auto-updated timestamp

**Legacy Fields:**
- `latest_round`, `employees`, `status` - Basic company data
- `youtube_url`, `spotify_url` - Media links

### founders
Founder information with data integrity.
- `id` (uuid) - Primary key
- `email` (text) - Unique identifier
- `name`, `linkedin_url`, `role` - Basic founder info
- `bio` - Additional details
- `created_at`, `updated_at` - Timestamps

### company_founders
Junction table linking founders to companies (many-to-many).
- `company_id`, `founder_id` - Foreign keys
- `role` - Founder's role at this company
- `is_active` - Whether founder is still with company
- `joined_date`, `left_date` - Employment dates

### founder_updates (AI-Enhanced)
Founder communications with AI analysis.

**Core Fields:**
- `id` (uuid) - Primary key
- `company_id` - Links to companies
- `founder_id` - Links to founders table
- `period_start`, `period_end` - Update period
- `update_text` - Original founder message
- `ai_summary` - AI-generated summary

**AI Analysis Fields:**
- `update_type` - monthly, quarterly, milestone, etc.
- `key_metrics_mentioned` (jsonb) - AI-extracted KPIs
- `sentiment_score` (decimal) - Sentiment analysis (-1 to 1)
- `topics_extracted` (text[]) - AI-identified themes
- `action_items` (text[]) - AI-extracted next steps

**Legacy Fields (Backward Compatibility):**
- `founder_name`, `founder_email`, `founder_role`, `founder_linkedin_url`

### kpis & kpi_values
Structured KPI tracking (LP-only access).
- Time-series data for company metrics
- Flexible label/unit system

### embeddings
Vector embeddings for AI-powered Q&A.
- `content_embedding` (vector) - 1536-dimensional embeddings
- Links to companies for context

## AI-Powered Views

### founder_timeline_analysis
Comprehensive founder update timeline with sentiment trends.
- Tracks sentiment changes over time
- Extracts quarterly/yearly patterns
- Links founders to companies properly

### company_progress_timeline
Company-centric view of progress and updates.
- Aggregates all founder updates per company
- Shows latest summaries and sentiment trends
- Lists all founders and their roles

### founder_insights
Founder-centric analytics and insights.
- Topic frequency analysis
- Sentiment tracking across companies
- Update patterns and engagement

## Security (Row Level Security)

### Public Access
- Basic company information (name, description, etc.)

### LP Access
- All company data including investment details
- Founder updates and AI insights
- KPI data and trends

### Admin Access
- Full read/write access to all tables
- Can manage companies, founders, and updates
- Access to admin dashboard

## Triggers & Functions

### Auto-Update Timestamps
- `update_updated_at_column()` function
- Triggers on companies, founders, founder_updates

## Indexes

### Performance Optimizations
- Company search: founded_year, investment_date, is_active
- Founder lookup: email, name
- AI queries: sentiment_score, topics_extracted, key_metrics
- JSONB indexes for flexible data queries

## Migration History

### 20250102000000_enhance_companies_schema.sql
- Added investment tracking fields to companies
- Enhanced founder_updates with AI analysis fields
- Created performance indexes
- Added auto-update triggers

### 20250102000001_add_founders_table.sql
- Created founders table for data integrity
- Added company_founders junction table
- Linked founder_updates to founders table
- Updated views for proper founder relationships

### 20250103000000_remove_founder_phone_and_equity.sql
- Removed `phone` field from founders table
- Removed `equity_percentage` field from company_founders table
- Updated admin interface to unified company+founder management
- Simplified form fields for better user experience

### 20250704_add_investment_fields_final.sql
- Added 5 comprehensive investment tracking fields to companies table
- Created `incorporation_type_enum` with 8 standardized business entity types
- Enhanced investment data collection with:
  - `round_size_usd`: Full target round size tracking (up to $999T)
  - `has_pro_rata_rights`: SAFE/Note pro-rata clause tracking
  - `reason_for_investing`: Internal IC/LP memo storage (4000 char limit)
  - `country_of_incorp`: ISO-3166-1 alpha-2 country codes
  - `incorporation_type`: Business entity classification
- Added proper constraints and default values for data integrity
- Updated TypeScript types for seamless frontend integration

## Data Relationships

```
auth.users → profiles (1:1)
companies ← company_founders → founders (many:many)
companies → founder_updates (1:many)
founders → founder_updates (1:many)
companies → kpis → kpi_values (1:many:many)
companies → embeddings (1:many)
```

## Key Features

### Investment Tracking
- Complete investment round details
- Co-investor tracking
- Valuation and amount tracking
- Portfolio status management

### AI-Powered Insights
- Sentiment analysis on founder updates
- Topic extraction and trending
- Action item identification
- Automated summarization

### Founder Management
- Proper founder-company relationships
- Role tracking across companies
- Equity and employment history
- Communication timeline

### Flexible Metrics
- JSONB storage for custom KPIs
- Time-series data support
- AI-extracted metrics from updates
- Structured and unstructured data support

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
Portfolio companies with comprehensive investment tracking.

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
      youtube_url text,
    spotify_url text,
    
    location text,
    
    -- Enhanced Investment Fields (Added January 2025)
    round_size_usd numeric(20,4), -- Full target round size (up to $999T)
    has_pro_rata_rights boolean DEFAULT false, -- SAFE/Note pro-rata clause tracking
    reason_for_investing text CHECK (char_length(reason_for_investing) <= 4000), -- IC/LP memo (4000 char limit)
    country_of_incorp char(2), -- ISO-3166-1 alpha-2 country codes
    incorporation_type incorporation_type_enum DEFAULT 'C-Corp', -- Business entity type
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enhanced Incorporation Types Enum
CREATE TYPE incorporation_type_enum AS ENUM (
    'C-Corp',
    'S-Corp', 
    'LLC',
    'PBC',
    'Non-Profit',
    'Partnership',
    'Sole-Proprietorship',
    'Other'
);
```

**Security**: 
- **Read**: Public access (anyone can view basic info, enhanced fields LP/Admin only)
- **Write**: Admin only

**Key Fields**:
- `slug`: URL-friendly identifier
- `industry_tags`: Array of industry categories
- `status`: Revenue stage indicator
- `round_size_usd`: Full target round size with financial precision
- `has_pro_rata_rights`: Investment terms tracking for SAFE/Note instruments
- `reason_for_investing`: Internal documentation for IC/LP communications
- `country_of_incorp`: International incorporation tracking with ISO validation
- `incorporation_type`: Standardized business entity classification

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

## 🏗️ Database Management Workflow

### Schema Management Strategy

This project uses a **migration-first approach** with Supabase:

1. **Migrations** (`supabase/migrations/`) - Source of truth for database changes
2. **Generated Types** (`src/types/supabase.types.ts`) - Auto-generated from live database
3. **Schema Documentation** (`supabase/sql/schema.sql`) - Human-readable reference

### Workflow Process

```bash
# 1. Create a new migration for schema changes
supabase migration new update_founder_role_enum

# 2. Write your SQL changes in the migration file
# Edit: supabase/migrations/20250104000015_update_founder_role_enum.sql

# 3. Push migration to Supabase (applies to live database)
supabase db push

# 4. Generate TypeScript types from the updated database schema
supabase gen types typescript --linked > src/types/supabase.types.ts

# 5. Update frontend code to use new types/enum values
# Update all components, schemas, and utilities

# 6. (Optional) Update schema.sql for documentation
# Keep supabase/sql/schema.sql in sync for reference
```

### Key Points

- **Migrations are the source of truth** - They define what actually gets applied to the database
- **Generated types reflect reality** - They're created from the live database state
- **Schema.sql is documentation** - Useful for understanding structure but not directly executed
- **Always generate types after migrations** - This ensures frontend code stays in sync

### Example: Recent Founder Role Update

```sql
-- Migration: 20250104000015_update_founder_role_enum.sql
-- Changed founder_role enum from 'solo_founder' to 'founder'

-- Before: CREATE TYPE founder_role AS ENUM ('solo_founder', 'cofounder');
-- After:  CREATE TYPE founder_role AS ENUM ('founder', 'cofounder');
```

After this migration:
- Types were regenerated: `founder_role: "founder" | "cofounder"`
- Frontend code was updated to use 'founder' instead of 'solo_founder'
- Schema.sql was updated for documentation consistency

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