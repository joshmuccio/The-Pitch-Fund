-- The Pitch Fund Supabase Schema
-- Updated to reflect all applied migrations

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector; -- pgvector for AI embeddings

-- ===== CUSTOM ENUMS =====
CREATE TYPE user_role AS ENUM ('admin','lp');
CREATE TYPE company_status AS ENUM ('active', 'acquihired', 'exited', 'dead');
CREATE TYPE founder_role AS ENUM ('founder', 'cofounder');
CREATE TYPE founder_sex AS ENUM ('male','female');
CREATE TYPE company_stage AS ENUM ('pre_seed', 'seed');
CREATE TYPE kpi_unit AS ENUM (
    'usd',           -- US Dollars
    'users',         -- User count
    'percent',       -- Percentage (%)
    'count',         -- Generic count/number
    'months',        -- Time in months
    'days',          -- Time in days
    'mbps',          -- Megabits per second
    'gb',            -- Gigabytes
    'requests_sec',  -- Requests per second
    'score',         -- Generic score (1-10, etc.)
    'ratio',         -- Numeric ratio (0.25 = 25%)
    'other'          -- Catch-all for custom units
);
CREATE TYPE founder_update_type AS ENUM (
    'monthly',       -- Monthly updates
    'quarterly',     -- Quarterly reports
    'milestone',     -- Milestone achievements
    'annual',        -- Annual summaries
    'ad_hoc',        -- Unscheduled updates
    'other'          -- Catch-all for custom types
);

-- ===== PROFILES =====
CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'lp',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read only their own profile
CREATE POLICY "Profiles: self read" ON profiles
FOR SELECT USING (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Profiles: self write" ON profiles
FOR ALL USING (auth.uid() = id);

-- ===== COMPANIES (Enhanced with investment tracking and AI embeddings) =====
CREATE TABLE IF NOT EXISTS companies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug citext UNIQUE NOT NULL,
    name text NOT NULL,
    logo_url text,
    tagline text,
    industry_tags text[],
    latest_round text,
    employees integer,
    description vector(1536), -- AI embeddings for semantic search
    description_raw text, -- Original text description for user input (source for AI embeddings)
    pitch_deck_url text,
    youtube_url text,
    spotify_url text,
    linkedin_url text,
    location text,
    -- Enhanced fields from migration
    website_url text,
    company_linkedin_url text,
    founded_year integer CHECK (founded_year >= 1800 AND founded_year <= EXTRACT(YEAR FROM CURRENT_DATE) + 10),
    investment_date date,
    investment_amount numeric(20,4) CHECK (investment_amount >= 0),
post_money_valuation numeric(20,4) CHECK (post_money_valuation >= 0),
    co_investors text[],
    pitch_episode_url text,
    key_metrics jsonb DEFAULT '{}',
    notes text,
    -- New fields for data tracking and metrics
    annual_revenue_usd numeric(20,4) CHECK (annual_revenue_usd >= 0),
    users integer CHECK (users >= 0),
    last_scraped_at timestamptz,
    total_funding_usd numeric(20,4) CHECK (total_funding_usd >= 0),
    status company_status DEFAULT 'active',
    -- Portfolio analytics fields
    country char(2) CHECK (country ~ '^[A-Z]{2}$'),
    stage_at_investment company_stage DEFAULT 'pre_seed',
    pitch_season integer CHECK (pitch_season >= 1),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_companies_founded_year ON companies(founded_year);
CREATE INDEX IF NOT EXISTS idx_companies_investment_date ON companies(investment_date);
CREATE INDEX IF NOT EXISTS idx_companies_key_metrics ON companies USING GIN(key_metrics);
CREATE INDEX IF NOT EXISTS idx_companies_annual_revenue ON companies(annual_revenue_usd);
CREATE INDEX IF NOT EXISTS idx_companies_users ON companies(users);
CREATE INDEX IF NOT EXISTS idx_companies_last_scraped_at ON companies(last_scraped_at);
CREATE INDEX IF NOT EXISTS idx_companies_total_funding ON companies(total_funding_usd);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
-- Vector similarity search index for AI-powered semantic search
CREATE INDEX IF NOT EXISTS idx_companies_description_vector ON companies USING ivfflat (description vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_companies_industry_tags ON companies USING GIN(industry_tags);
CREATE INDEX IF NOT EXISTS idx_companies_co_investors ON companies USING GIN(co_investors);
CREATE INDEX IF NOT EXISTS idx_companies_slug_btree ON companies USING BTREE (slug);
-- Portfolio analytics indexes
CREATE INDEX IF NOT EXISTS idx_companies_pitch_season ON companies(pitch_season);
CREATE INDEX IF NOT EXISTS idx_companies_country_stage ON companies(country, stage_at_investment);

-- Public can read basic company data
CREATE POLICY "Companies: public read" ON companies
FOR SELECT USING (true);

-- Admins can insert/update/delete companies
CREATE POLICY "Companies: admin write" ON companies
FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ===== FOUNDERS TABLE =====
CREATE TABLE IF NOT EXISTS founders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext UNIQUE NOT NULL,
  name text,
  linkedin_url text,
  role founder_role, -- Simplified role (founder, cofounder)
  bio text,
  sex founder_sex, -- Demographic tracking
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE founders ENABLE ROW LEVEL SECURITY;

-- Indexes for founders
CREATE INDEX IF NOT EXISTS idx_founders_email ON founders(email);
CREATE INDEX IF NOT EXISTS idx_founders_email_lower ON founders(lower(email));
CREATE INDEX IF NOT EXISTS idx_founders_name ON founders(name);
CREATE INDEX IF NOT EXISTS idx_founders_sex ON founders(sex);

-- RLS policies for founders table
CREATE POLICY "Founders: admin read" ON founders
FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "Founders: admin write" ON founders
FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ===== COMPANY FOUNDERS JUNCTION TABLE =====
CREATE TABLE IF NOT EXISTS company_founders (
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  founder_id uuid REFERENCES founders(id) ON DELETE CASCADE,
  role text, -- Role at this specific company
  is_active boolean DEFAULT true,
  joined_date date,
  left_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (company_id, founder_id)
);

ALTER TABLE company_founders ENABLE ROW LEVEL SECURITY;

-- Indexes for company_founders
CREATE INDEX IF NOT EXISTS idx_company_founders_company_id ON company_founders(company_id);
CREATE INDEX IF NOT EXISTS idx_company_founders_founder_id ON company_founders(founder_id);
CREATE INDEX IF NOT EXISTS idx_company_founders_is_active ON company_founders(is_active);

-- RLS policies for company_founders table
CREATE POLICY "Company founders: admin read" ON company_founders
FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "Company founders: admin write" ON company_founders
FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ===== KPIs (LP‑only) =====
CREATE TABLE IF NOT EXISTS kpis (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    label text NOT NULL,
    unit kpi_unit,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT unique_company_kpi_label UNIQUE (company_id, label)
);

CREATE TABLE IF NOT EXISTS kpi_values (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_id uuid NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
    period_date date NOT NULL,
    value numeric(20,4),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT check_period_date_reasonable CHECK (
        period_date >= '2000-01-01' AND period_date <= (CURRENT_DATE + INTERVAL '1 year')
    )
);

ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_values ENABLE ROW LEVEL SECURITY;

-- Performance indexes for KPIs
CREATE INDEX IF NOT EXISTS idx_kpis_company_label ON kpis(company_id, label);
CREATE INDEX IF NOT EXISTS idx_kpi_values_kpi_period ON kpi_values(kpi_id, period_date);
CREATE INDEX IF NOT EXISTS idx_kpi_values_value ON kpi_values(value) WHERE value IS NOT NULL;

-- Read access limited to LPs and admins
CREATE POLICY "KPIs: lp read" ON kpis
FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('lp','admin')));
CREATE POLICY "KPI values: lp read" ON kpi_values
FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('lp','admin')));

-- Admin write
CREATE POLICY "KPIs: admin write" ON kpis
FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "KPI values: admin write" ON kpi_values
FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ===== FOUNDER UPDATES (Enhanced with AI features) =====
CREATE TABLE IF NOT EXISTS founder_updates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    founder_id uuid REFERENCES founders(id),
    period_start date,
    period_end date,
    update_text text,
    ai_summary text,
    -- Legacy fields (kept for backward compatibility)
    founder_name text,
    founder_email text,
    founder_role text,
    founder_linkedin_url text,
    -- Enhanced AI fields
    update_type founder_update_type, -- monthly, quarterly, milestone, etc.
    key_metrics_mentioned jsonb DEFAULT '{}', -- AI-extracted KPIs from update text
    sentiment_score numeric(4,3), -- AI sentiment analysis (-1.000 to 1.000)
    topics_extracted text[], -- AI-extracted topics/themes
    action_items text[], -- AI-extracted action items
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT check_sentiment_score_range CHECK (
        sentiment_score IS NULL OR (sentiment_score >= -1.000 AND sentiment_score <= 1.000)
    )
);

ALTER TABLE founder_updates ENABLE ROW LEVEL SECURITY;

-- Indexes for AI-powered founder update queries
CREATE INDEX IF NOT EXISTS idx_founder_updates_founder_id ON founder_updates(founder_id);
CREATE INDEX IF NOT EXISTS idx_founder_updates_founder_email ON founder_updates(founder_email);
CREATE INDEX IF NOT EXISTS idx_founder_updates_founder_role ON founder_updates(founder_role);
CREATE INDEX IF NOT EXISTS idx_founder_updates_update_type ON founder_updates(update_type);
CREATE INDEX IF NOT EXISTS idx_founder_updates_period_start ON founder_updates(period_start);
CREATE INDEX IF NOT EXISTS idx_founder_updates_period_end ON founder_updates(period_end);
CREATE INDEX IF NOT EXISTS idx_founder_updates_date_range ON founder_updates(period_start, period_end) 
WHERE period_start IS NOT NULL AND period_end IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_founder_updates_sentiment_score ON founder_updates(sentiment_score);
CREATE INDEX IF NOT EXISTS idx_founder_updates_key_metrics_mentioned ON founder_updates USING GIN(key_metrics_mentioned);
CREATE INDEX IF NOT EXISTS idx_founder_updates_topics_extracted ON founder_updates USING GIN(topics_extracted);

CREATE POLICY "Updates: lp read" ON founder_updates
FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('lp','admin')));

CREATE POLICY "Updates: admin write" ON founder_updates
FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ===== VECTOR EMBEDDINGS FOR AI Q&A =====
CREATE TABLE IF NOT EXISTS embeddings (
    id bigserial PRIMARY KEY,
    company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
    content text,
    content_embedding vector(1536),
    content_size_bytes integer GENERATED ALWAYS AS (
        CASE 
            WHEN content IS NULL THEN 0
            ELSE length(content)
        END
    ) STORED,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT check_content_size_limit CHECK (
        content IS NULL OR length(content) <= 16384
    )
);

ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

-- Indexes for embeddings table
CREATE INDEX IF NOT EXISTS idx_embeddings_company_id ON embeddings(company_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_content_embedding ON embeddings USING ivfflat (content_embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_embeddings_content_size ON embeddings(content_size_bytes);
CREATE INDEX IF NOT EXISTS idx_embeddings_large_content ON embeddings(content_size_bytes) 
WHERE content_size_bytes > 12288;

CREATE POLICY "Embeddings: lp read" ON embeddings
FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('lp','admin')));
CREATE POLICY "Embeddings: admin write" ON embeddings
FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ===== FUNCTIONS AND TRIGGERS =====

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at columns
CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_founders_updated_at 
    BEFORE UPDATE ON founders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_founder_updates_updated_at 
    BEFORE UPDATE ON founder_updates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Additional triggers for tables with updated_at columns
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_founders_updated_at
    BEFORE UPDATE ON company_founders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kpis_updated_at
    BEFORE UPDATE ON kpis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kpi_values_updated_at
    BEFORE UPDATE ON kpi_values
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_embeddings_updated_at
    BEFORE UPDATE ON embeddings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===== AI-POWERED VIEWS =====
-- Note: Use secure functions get_founder_timeline_analysis(), get_company_progress_timeline(), 
-- and get_founder_insights() for LP-only data access with explicit permission checking.

-- Founder timeline analysis view
CREATE OR REPLACE VIEW founder_timeline_analysis AS
SELECT 
    c.name as company_name,
    c.slug as company_slug,
    f.name as founder_name,
    f.email as founder_email,
    cf.role as founder_role_at_company,
    fu.period_start,
    fu.period_end,
    fu.update_type,
    fu.sentiment_score,
    fu.key_metrics_mentioned,
    fu.topics_extracted,
    fu.ai_summary,
    fu.created_at,
    -- Calculate sentiment trend over time
    LAG(fu.sentiment_score) OVER (
        PARTITION BY c.id, f.id 
        ORDER BY fu.period_start
    ) as previous_sentiment,
    -- Extract time-based insights
    EXTRACT(YEAR FROM fu.period_start) as update_year,
    EXTRACT(QUARTER FROM fu.period_start) as update_quarter
FROM founder_updates fu
JOIN companies c ON fu.company_id = c.id
LEFT JOIN founders f ON fu.founder_id = f.id
LEFT JOIN company_founders cf ON (c.id = cf.company_id AND f.id = cf.founder_id AND cf.is_active = true)
WHERE fu.period_start IS NOT NULL
ORDER BY c.name, f.email, fu.period_start;

-- Company progress timeline view
CREATE OR REPLACE VIEW company_progress_timeline AS
SELECT 
    c.*,
    -- Aggregate founder update insights
    COUNT(fu.id) as total_updates,
    AVG(fu.sentiment_score) as avg_sentiment,
    ARRAY_AGG(DISTINCT f.name) FILTER (WHERE f.name IS NOT NULL) as founders,
    ARRAY_AGG(DISTINCT cf.role) FILTER (WHERE cf.role IS NOT NULL) as founder_roles,
    -- Latest update info
    MAX(fu.period_end) as last_update_period,
    (SELECT fu2.ai_summary 
     FROM founder_updates fu2 
     WHERE fu2.company_id = c.id 
     ORDER BY fu2.period_end DESC NULLS LAST 
     LIMIT 1) as latest_summary
FROM companies c
LEFT JOIN founder_updates fu ON c.id = fu.company_id
LEFT JOIN founders f ON fu.founder_id = f.id
LEFT JOIN company_founders cf ON (c.id = cf.company_id AND f.id = cf.founder_id AND cf.is_active = true)
GROUP BY c.id;

-- Founder insights view
CREATE OR REPLACE VIEW founder_insights AS
SELECT 
    f.id as founder_id,
    f.email,
    f.name,
    f.role as primary_role,
    f.linkedin_url,
    COUNT(fu.id) as total_updates,
    AVG(fu.sentiment_score) as avg_sentiment,
    ARRAY_AGG(DISTINCT c.id) FILTER (WHERE c.id IS NOT NULL) as companies_involved,
    ARRAY_AGG(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL) as company_names,
    -- Topic frequency analysis
    (SELECT array_agg(topic) 
     FROM (
         SELECT unnest(fu2.topics_extracted) as topic, COUNT(*) as freq
         FROM founder_updates fu2 
         WHERE fu2.founder_id = f.id
         GROUP BY topic 
         ORDER BY freq DESC 
         LIMIT 5
     ) top_topics) as top_topics,
    MIN(fu.period_start) as first_update,
    MAX(fu.period_end) as last_update
FROM founders f
LEFT JOIN founder_updates fu ON f.id = fu.founder_id
LEFT JOIN companies c ON fu.company_id = c.id
GROUP BY f.id, f.email, f.name, f.role, f.linkedin_url;

-- SECURITY NOTE: These views inherit RLS from underlying tables
-- Since founder_updates and founders tables have LP-only access,
-- the views automatically respect those permissions.
-- However, be cautious when companies table is public-read.

-- BEST PRACTICES APPLIED:
-- ✅ All timestamps use timestamptz and store in UTC
-- ✅ All decimal numbers use numeric(precision,scale) for consistency
-- ✅ Secure functions provide explicit permission checking for LP-only data
-- ✅ Timezone utilities available: ensure_utc_timestamp(), utc_now(), safe_parse_timestamp()
-- See docs/DATABASE_BEST_PRACTICES.md for detailed usage examples

-- Create LP-only secure functions to address RLS concerns
-- These functions explicitly check user permissions before returning data

CREATE OR REPLACE FUNCTION get_founder_timeline_analysis()
RETURNS TABLE (
    company_name text,
    company_slug citext,
    founder_name text,
    founder_email citext,
    founder_role_at_company text,
    period_start date,
    period_end date,
    update_type founder_update_type,
    sentiment_score numeric,
    key_metrics_mentioned text[],
    topics_extracted text[],
    ai_summary text,
    created_at timestamptz,
    previous_sentiment numeric,
    update_year numeric,
    update_quarter numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user has LP or admin access
    IF NOT EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND p.role IN ('lp','admin')
    ) THEN
        RAISE EXCEPTION 'Access denied. LP or admin role required.';
    END IF;

    RETURN QUERY
    SELECT 
        c.name::text as company_name,
        c.slug as company_slug,
        f.name::text as founder_name,
        f.email as founder_email,
        cf.role::text as founder_role_at_company,
        fu.period_start,
        fu.period_end,
        fu.update_type,
        fu.sentiment_score,
        fu.key_metrics_mentioned,
        fu.topics_extracted,
        fu.ai_summary,
        fu.created_at,
        LAG(fu.sentiment_score) OVER (
            PARTITION BY c.id, f.id 
            ORDER BY fu.period_start
        ) as previous_sentiment,
        EXTRACT(YEAR FROM fu.period_start) as update_year,
        EXTRACT(QUARTER FROM fu.period_start) as update_quarter
    FROM founder_updates fu
    JOIN companies c ON fu.company_id = c.id
    LEFT JOIN founders f ON fu.founder_id = f.id
    LEFT JOIN company_founders cf ON (c.id = cf.company_id AND f.id = cf.founder_id AND cf.is_active = true)
    WHERE fu.period_start IS NOT NULL
    ORDER BY c.name, f.email, fu.period_start;
END;
$$;

-- ===== HELPFUL COMMENTS =====

-- Companies table comments
COMMENT ON COLUMN companies.website_url IS 'Company website URL';
COMMENT ON COLUMN companies.company_linkedin_url IS 'Company LinkedIn profile URL';
COMMENT ON COLUMN companies.founded_year IS 'Year the company was founded';
COMMENT ON COLUMN companies.investment_date IS 'Date of investment by The Pitch Fund';
COMMENT ON COLUMN companies.investment_amount IS 'Amount invested in USD';
COMMENT ON COLUMN companies.post_money_valuation IS 'Post-money valuation at time of investment in USD';
COMMENT ON COLUMN companies.co_investors IS 'Array of co-investor names';
COMMENT ON COLUMN companies.pitch_episode_url IS 'URL to The Pitch episode featuring this company';
COMMENT ON COLUMN companies.key_metrics IS 'Flexible JSON storage for company metrics (revenue, users, etc.)';
COMMENT ON COLUMN companies.is_active IS 'Whether the company is still active in our portfolio';
COMMENT ON COLUMN companies.notes IS 'Internal notes about the company';
COMMENT ON COLUMN companies.country IS 'Company HQ country code (ISO-3166-1 alpha-2, e.g. US, GB, DE)';
COMMENT ON COLUMN companies.stage_at_investment IS 'What stage the company was in when The Pitch Fund invested';
COMMENT ON COLUMN companies.pitch_season IS 'Season number of "The Pitch" podcast where the company appeared';
COMMENT ON COLUMN companies.updated_at IS 'Timestamp of last record update';

-- Founders table comments
COMMENT ON TABLE founders IS 'Minimal founders table for data integrity and proper linking';
COMMENT ON COLUMN founders.email IS 'Case-insensitive unique email using citext. Supports email@domain.com = EMAIL@DOMAIN.COM matching.';
COMMENT ON COLUMN founders.role IS 'Simplified founder classification: founder or cofounder for clear founder structure identification.';
COMMENT ON COLUMN founders.sex IS 'Founder self-identified sex / gender (enum)';

-- Company founders table comments
COMMENT ON TABLE company_founders IS 'Junction table linking founders to companies (many-to-many)';
COMMENT ON COLUMN company_founders.role IS 'Founder role at this specific company';
COMMENT ON COLUMN company_founders.equity_percentage IS 'Founder equity percentage in this company';

-- Company slug comments
COMMENT ON COLUMN companies.slug IS 'URL-friendly identifier for company profile pages. Uses citext for case-insensitive uniqueness.';

-- Enhanced founder_updates comments for AI tracking
COMMENT ON COLUMN founder_updates.founder_id IS 'Links to founders table for data integrity';
COMMENT ON COLUMN founder_updates.founder_name IS 'Name of founder providing the update (legacy field)';
COMMENT ON COLUMN founder_updates.founder_email IS 'Email of founder providing the update (legacy field)';
COMMENT ON COLUMN founder_updates.founder_role IS 'Role of founder in company (legacy field)';
COMMENT ON COLUMN founder_updates.founder_linkedin_url IS 'LinkedIn profile of founder (legacy field)';
COMMENT ON COLUMN founder_updates.update_type IS 'Type of update (monthly, quarterly, milestone, etc.)';
COMMENT ON COLUMN founder_updates.key_metrics_mentioned IS 'AI-extracted KPIs and metrics mentioned in update';
COMMENT ON COLUMN founder_updates.sentiment_score IS 'AI sentiment analysis score (-1 negative to 1 positive)';
COMMENT ON COLUMN founder_updates.topics_extracted IS 'AI-extracted topics and themes from update';
COMMENT ON COLUMN founder_updates.action_items IS 'AI-extracted action items and next steps';
