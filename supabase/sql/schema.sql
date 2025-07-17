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
CREATE TYPE fund_number AS ENUM ('fund_i', 'fund_ii', 'fund_iii');
CREATE TYPE incorporation_type AS ENUM ('c_corp', 's_corp', 'llc', 'bcorp', 'gmbh', 'ltd', 'plc', 'other');
CREATE TYPE investment_instrument AS ENUM ('safe_post', 'safe_pre', 'convertible_note', 'equity');

-- Standardized tag taxonomies for consistent portfolio filtering
CREATE TYPE industry_tag AS ENUM (
  -- Technology & Software
  'fintech', 'edtech', 'healthtech', 'proptech', 'insurtech', 'legaltech', 'hrtech', 'martech', 'adtech', 
  'cleantech', 'foodtech', 'agtech', 'regtech', 'cybersecurity', 'data_analytics', 'cloud', 'mobile', 
  'gaming', 'ar_vr', 'iot', 'robotics', 'autonomous_vehicles', 'hardware', 'ev_tech', 'vertical_saas', 
  'agentic_ai', 'deeptech',
  -- Industries  
  'e_commerce', 'retail', 'grocery_retail', 'social_commerce', 'fashion_beauty', 'cpg', 'food_beverage', 'fitness', 'wellness', 'mental_health', 
  'telemedicine', 'biotech', 'pharma', 'medical_devices', 'diagnostics', 'digital_health', 'consumer_goods', 
  'productivity', 'communication', 'media_entertainment', 'sports', 'travel', 'hospitality', 'food_delivery', 
  'logistics', 'supply_chain', 'transportation', 'real_estate', 'construction', 'manufacturing', 'energy', 
  'greentech_sustainability', 'circular_economy', 'impact', 'non_profit', 'government', 'public_sector', 
  'defense', 'space', 'agriculture', 'farming', 'pets', 'parenting', 'seniors', 'disability', 'accessibility', 
  'diversity', 'inclusion', 'gig_economy', 'freelance', 'remote_work', 'future_of_work',
  -- Target Markets
  'smb', 'enterprise', 'consumer_tech', 'prosumer', 'developer', 'creator', 'influencer', 'small_business', 
  'solopreneur', 'freelancer', 'remote_worker', 'genz', 'millennials', 'parents', 'students', 'professionals', 
  'healthcare_providers', 'financial_advisors'
);

CREATE TYPE business_model_tag AS ENUM (
  -- Revenue Models (removed 'usage_based' and 'commission')
  'subscription', 'saas', 'freemium', 'transaction_fee', 'advertising', 'sponsored_content', 
  'affiliate', 'licensing', 'white_label', 'franchise', 'one_time_purchase', 'pay_per_use',
  -- Business Types (removed 'platform')
  'marketplace', 'social_network', 'two_sided_marketplace', 'multi_sided_platform', 'aggregator', 
  'peer_to_peer', 'p2p', 'live_commerce', 'group_buying', 'subscription_commerce', 
  'direct_to_consumer', 'd2c', 'b2b', 'b2c', 'b2b2c',
  -- Data & Analytics
  'data_monetization'
);

CREATE TYPE keyword_tag AS ENUM (
  -- Growth Strategies
  'product_market_fit', 'founder_market_fit', 'minimum_viable_product', 'mvp', 'pivot', 'bootstrapped', 
  'viral_growth', 'flywheel_effect', 'lean_startup', 'network_effects', 'product_led_growth', 'sales_led_growth',
  'community_led_growth', 'customer_acquisition_cost', 'lifetime_value', 'churn_rate',
  
  -- Technology & AI
  'AI', 'machine_learning', 'deep_learning', 'natural_language_processing', 'nlp', 'computer_vision',
  'generative_ai', 'agentic_ai', 'blockchain_based', 'cloud_native', 'edge_computing', 'api_first',
  'no_code', 'low_code', 'open_source', 'proprietary_technology', 'patent_pending', 'scalable_infrastructure',
  
  -- Data & Analytics
  'data_play', 'predictive_analytics', 'big_data', 'personalization', 'recommendation_engine',
  'user_generated_content', 'content_moderation', 'search_optimization',
  
  -- Delivery & Operations
  'mobile_app', 'web_based', 'cross_platform', 'omnichannel', 'white_glove', 'self_service', 'managed_service',
  'do_it_yourself', 'on_demand', 'subscription_based', 'freemium_model', 'pay_per_use', 'usage_based_pricing',
  
  -- Manufacturing & Physical
  '3d_printing', 'additive_manufacturing', 'supply_chain_optimization', 'inventory_management', 'logistics',
  'last_mile_delivery', 'cold_chain', 'quality_assurance', 'regulatory_compliance',
  
  -- User Experience
  'intuitive_interface', 'single_sign_on', 'multi_tenant',
  'white_label', 'customizable', 'configurable', 'plug_and_play', 'turnkey_solution'
);

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
    'percentage_decimal', -- Decimal percentage (0.25 = 25%)
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

-- ===== COMPANIES (Enhanced with investment tracking, AI embeddings, and standardized tagging) =====
CREATE TABLE IF NOT EXISTS companies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug citext UNIQUE NOT NULL,
    name text NOT NULL,
    legal_name text,
    logo_url text,
    svg_logo_url text,
    tagline text,
    industry_tags industry_tag[],
    business_model_tags business_model_tag[],
    keywords keyword_tag[],
    latest_round text,
    employees integer,
    description vector(1536), -- AI embeddings for semantic search
    description_raw text, -- Original text description for user input (source for AI embeddings)
    pitch_transcript text,
    youtube_url text,
    spotify_url text,
    apple_podcasts_url text,
    location text,
    -- Enhanced fields from migration
    website_url text,
    company_linkedin_url text,
    founded_year integer CHECK (founded_year >= 1800 AND founded_year <= EXTRACT(YEAR FROM CURRENT_DATE) + 10),
    
    -- Investment details
    fund fund_number NOT NULL DEFAULT 'fund_i',
    investment_date date,
    investment_amount numeric(20,4) CHECK (investment_amount >= 0),
    post_money_valuation numeric(20,4) CHECK (post_money_valuation >= 0),
    instrument investment_instrument NOT NULL DEFAULT 'safe_post',
    conversion_cap_usd numeric(20,4) CHECK (conversion_cap_usd >= 0),
    discount_percent numeric(5,2) CHECK (discount_percent >= 0 AND discount_percent <= 100),
    has_pro_rata_rights boolean NOT NULL DEFAULT false,
    round_size_usd numeric(20,4) CHECK (round_size_usd >= 0),
    reason_for_investing text,
    
    -- Company details
    incorporation_type incorporation_type,
    country char(2) CHECK (country ~ '^[A-Z]{2}$'),
    country_of_incorp char(2) CHECK (country_of_incorp ~ '^[A-Z]{2}$'),
    
    -- HQ Address
    hq_address_line_1 text,
    hq_address_line_2 text,
    hq_city text,
    hq_state text,
    hq_zip_code text,
    hq_country text,
    hq_latitude numeric(10,8),
    hq_longitude numeric(11,8),
    
    co_investors text[],
    pitch_episode_url text,
    episode_publish_date date,
    episode_title text,
    episode_season integer CHECK (episode_season >= 1 AND episode_season <= 50),
    episode_show_notes text,
    key_metrics jsonb DEFAULT '{}',
    notes text,
    -- New fields for data tracking and metrics
    annual_revenue_usd numeric(20,4) CHECK (annual_revenue_usd >= 0),
    users integer CHECK (users >= 0),
    last_scraped_at timestamptz,
    total_funding_usd numeric(20,4) CHECK (total_funding_usd >= 0),
    status company_status DEFAULT 'active',
    -- Portfolio analytics fields
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
CREATE INDEX IF NOT EXISTS idx_companies_business_model_tags_gin ON companies USING GIN(business_model_tags);
CREATE INDEX IF NOT EXISTS idx_companies_keywords_gin ON companies USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_companies_co_investors ON companies USING GIN(co_investors);
CREATE INDEX IF NOT EXISTS idx_companies_slug_btree ON companies USING BTREE (slug);
-- Portfolio analytics indexes
CREATE INDEX IF NOT EXISTS idx_companies_pitch_season ON companies(pitch_season);
CREATE INDEX IF NOT EXISTS idx_companies_country_stage ON companies(country, stage_at_investment);
CREATE INDEX IF NOT EXISTS idx_companies_fund ON companies(fund);
CREATE INDEX IF NOT EXISTS idx_companies_instrument ON companies(instrument);
-- Episode data indexes
CREATE INDEX IF NOT EXISTS idx_companies_episode_season ON companies(episode_season);
CREATE INDEX IF NOT EXISTS idx_companies_episode_title ON companies(episode_title);

-- Public can read basic company data
CREATE POLICY "Companies: public read" ON companies
FOR SELECT USING (true);

-- Admins can insert/update/delete companies
CREATE POLICY "Companies: admin write" ON companies
FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ===== VCS TABLE =====
CREATE TABLE IF NOT EXISTS vcs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  firm_name text,
  role_title text,
  bio text,
  profile_image_url text,
  thepitch_profile_url text,
  linkedin_url text,
  twitter_url text,
  instagram_url text,
  youtube_url text,
  tiktok_url text,
  website_url text,
  podcast_url text,
  wikipedia_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vcs ENABLE ROW LEVEL SECURITY;

-- Indexes for VCs
CREATE INDEX IF NOT EXISTS idx_vcs_name ON vcs(name);
CREATE INDEX IF NOT EXISTS idx_vcs_firm_name ON vcs(firm_name);

-- Public can read VCs data
CREATE POLICY "VCs: public read" ON vcs
FOR SELECT USING (true);

-- Admins can insert/update/delete VCs
CREATE POLICY "VCs: admin write" ON vcs
FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ===== COMPANY_VCS JUNCTION TABLE =====
CREATE TABLE IF NOT EXISTS company_vcs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  vc_id uuid REFERENCES vcs(id) ON DELETE CASCADE,
  episode_season text,
  episode_number text,
  episode_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE company_vcs ENABLE ROW LEVEL SECURITY;

-- Indexes for company_vcs
CREATE INDEX IF NOT EXISTS idx_company_vcs_company_id ON company_vcs(company_id);
CREATE INDEX IF NOT EXISTS idx_company_vcs_vc_id ON company_vcs(vc_id);

-- Public can read company-VC relationships
CREATE POLICY "Company VCs: public read" ON company_vcs
FOR SELECT USING (true);

-- Admins can insert/update/delete company-VC relationships
CREATE POLICY "Company VCs: admin write" ON company_vcs
FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ===== FOUNDERS TABLE =====
CREATE TABLE IF NOT EXISTS founders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext UNIQUE NOT NULL,
  name text,
  first_name text,
  last_name text,
  title text,
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

CREATE TRIGGER update_vcs_updated_at 
    BEFORE UPDATE ON vcs 
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

-- ===== TAG VALIDATION FUNCTIONS =====

-- Validation function for industry tags
CREATE OR REPLACE FUNCTION validate_industry_tags(tags industry_tag[]) 
RETURNS boolean AS $$
BEGIN
  -- Check if all keywords are valid enum values
  -- This is automatically enforced by the enum type
  RETURN tags IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Validation function for business model tags
CREATE OR REPLACE FUNCTION validate_business_model_tags(tags business_model_tag[]) 
RETURNS boolean AS $$
BEGIN
  -- Allow NULL or empty arrays
  IF tags IS NULL OR array_length(tags, 1) IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check for reasonable array size (max 10 tags)
  IF array_length(tags, 1) > 10 THEN
    RETURN FALSE;
  END IF;
  
  -- All values should be valid enum values (automatically checked by PostgreSQL)
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Validation function for keyword tags
CREATE OR REPLACE FUNCTION validate_keywords(keywords keyword_tag[]) 
RETURNS boolean AS $$
BEGIN
  -- Allow NULL or empty arrays
  IF keywords IS NULL OR array_length(keywords, 1) IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check for reasonable array size (max 20 tags)
  IF array_length(keywords, 1) > 20 THEN
    RETURN FALSE;
  END IF;
  
  -- All values should be valid enum values (automatically checked by PostgreSQL)
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Helper functions to get valid tags for frontend
CREATE OR REPLACE FUNCTION get_valid_industry_tags() 
RETURNS text[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT enumlabel::text 
    FROM pg_enum 
    WHERE enumtypid = 'industry_tag'::regtype
    ORDER BY enumlabel
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_valid_business_model_tags() 
RETURNS text[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT enumlabel::text 
    FROM pg_enum 
    WHERE enumtypid = 'business_model_tag'::regtype
    ORDER BY enumlabel
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_valid_keywords() 
RETURNS TABLE(value TEXT, label TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  WITH all_enum_values AS (
    SELECT unnest(enum_range(NULL::keyword_tag))::TEXT as keyword_value
  ),
  usage_counts AS (
    SELECT 
      unnest(keywords)::TEXT as keyword,
      COUNT(*) as usage_count
    FROM companies 
    WHERE keywords IS NOT NULL
    GROUP BY unnest(keywords)
  )
  SELECT 
    aev.keyword_value as value,
    INITCAP(REPLACE(aev.keyword_value, '_', ' ')) as label,
    COALESCE(uc.usage_count, 0) as count
  FROM all_enum_values aev
  LEFT JOIN usage_counts uc ON aev.keyword_value = uc.keyword
  ORDER BY count DESC, value ASC;
END;
$$ LANGUAGE plpgsql;

-- Add validation constraints to companies table
ALTER TABLE companies 
ADD CONSTRAINT chk_industry_tags_valid 
CHECK (validate_industry_tags(industry_tags));

ALTER TABLE companies 
ADD CONSTRAINT chk_business_model_tags_valid 
CHECK (validate_business_model_tags(business_model_tags));

ALTER TABLE companies 
ADD CONSTRAINT chk_keywords_valid 
CHECK (validate_keywords(keywords));

-- ===== TAG ANALYTICS VIEW =====

-- Analytics view showing tag usage across the portfolio
CREATE VIEW tag_analytics AS
SELECT 
  'industry' as tag_type,
  unnest(industry_tags)::text as tag_value,
  count(*) as usage_count
FROM companies 
WHERE industry_tags IS NOT NULL
GROUP BY unnest(industry_tags)
UNION ALL
SELECT 
  'business_model' as tag_type,
  unnest(business_model_tags)::text as tag_value,
  count(*) as usage_count
FROM companies 
WHERE business_model_tags IS NOT NULL
GROUP BY unnest(business_model_tags)
UNION ALL
SELECT 
  'keyword' as tag_type,
  unnest(keywords)::text as tag_value,
  count(*) as usage_count
FROM companies 
WHERE keywords IS NOT NULL
GROUP BY unnest(keywords)
ORDER BY tag_type, usage_count DESC;

-- ===== PORTFOLIO ANALYTICS VIEWS =====

-- Portfolio demographics view
CREATE VIEW portfolio_demographics AS
SELECT 
    c.pitch_season,
    c.stage_at_investment,
    c.country,
    COUNT(DISTINCT c.id) as company_count,
    COUNT(DISTINCT f.id) as founder_count,
    COUNT(DISTINCT f.id) FILTER (WHERE f.sex = 'male') as male_founders,
    COUNT(DISTINCT f.id) FILTER (WHERE f.sex = 'female') as female_founders,
    ROUND(
        (COUNT(DISTINCT f.id) FILTER (WHERE f.sex = 'female')::numeric / 
         NULLIF(COUNT(DISTINCT f.id), 0)) * 100, 2
    ) as female_founder_percentage
FROM companies c
LEFT JOIN company_founders cf ON c.id = cf.company_id
LEFT JOIN founders f ON cf.founder_id = f.id
GROUP BY c.pitch_season, c.stage_at_investment, c.country
ORDER BY c.pitch_season DESC, c.stage_at_investment, c.country;

-- Season performance view
CREATE VIEW season_performance AS
SELECT 
    pitch_season,
    COUNT(*) as companies_invested,
    AVG(investment_amount) as avg_investment,
    AVG(post_money_valuation) as avg_valuation,
    COUNT(*) FILTER (WHERE status = 'active') as still_active,
    COUNT(*) FILTER (WHERE status = 'exited') as successful_exits,
    COUNT(*) FILTER (WHERE status = 'acquihired') as acquihires,
    COUNT(*) FILTER (WHERE status = 'dead') as failed_companies,
    ROUND(
        (COUNT(*) FILTER (WHERE status IN ('exited', 'acquihired'))::numeric / 
         COUNT(*)::numeric) * 100, 2
    ) as success_rate_percentage
FROM companies
WHERE pitch_season IS NOT NULL
GROUP BY pitch_season
ORDER BY pitch_season DESC;

-- Embedding size monitoring view
CREATE VIEW embedding_size_monitor AS
SELECT 
    id,
    company_id,
    content_size_bytes,
    ROUND(content_size_bytes / 1024.0, 2) as size_kb,
    CASE 
        WHEN content_size_bytes <= 4096 THEN 'Small (≤4KB)'
        WHEN content_size_bytes <= 8192 THEN 'Medium (4-8KB)'
        WHEN content_size_bytes <= 12288 THEN 'Large (8-12KB)'
        ELSE 'Oversized (>12KB)'
    END as size_category,
    created_at,
    updated_at
FROM embeddings
ORDER BY content_size_bytes DESC;

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

-- Timezone best practices view
CREATE VIEW timezone_best_practices AS
SELECT 
    'Always store timestamps in UTC' as practice,
    'Use timestamptz data type for all datetime columns' as implementation,
    'Ensures consistent timezone handling across different environments' as description
UNION ALL
SELECT 
    'Convert to user timezone only in frontend',
    'Use JavaScript Date methods or libraries like date-fns/moment',
    'Database stays timezone-agnostic, UI handles localization'
UNION ALL
SELECT 
    'Use functions for timezone operations',
    'utilize ensure_utc_timestamp(), utc_now(), safe_parse_timestamp()',
    'Centralized timezone logic prevents inconsistencies'
UNION ALL
SELECT 
    'Validate timestamp formats',
    'Use safe_parse_timestamp() with fallback timezones',
    'Handles various input formats gracefully'
UNION ALL
SELECT 
    'Store business hours in company timezone',
    'Add timezone column to companies/users tables',
    'Enables timezone-aware business logic';

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

-- Create additional secure functions for LP-only data access
CREATE OR REPLACE FUNCTION get_company_progress_timeline()
RETURNS TABLE (
    company_id uuid,
    company_slug citext,
    company_name text,
    company_data jsonb,
    total_updates bigint,
    avg_sentiment numeric,
    founders text[],
    founder_roles text[],
    last_update_period date,
    latest_summary text
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
        c.id as company_id,
        c.slug as company_slug,
        c.name::text as company_name,
        to_jsonb(c.*) as company_data,
        COUNT(fu.id) as total_updates,
        AVG(fu.sentiment_score) as avg_sentiment,
        ARRAY_AGG(DISTINCT f.name) FILTER (WHERE f.name IS NOT NULL) as founders,
        ARRAY_AGG(DISTINCT cf.role) FILTER (WHERE cf.role IS NOT NULL) as founder_roles,
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
    GROUP BY c.id, c.slug, c.name;
END;
$$;

CREATE OR REPLACE FUNCTION get_founder_insights()
RETURNS TABLE (
    founder_id uuid,
    founder_email citext,
    founder_name text,
    primary_role founder_role,
    linkedin_url text,
    total_updates bigint,
    avg_sentiment numeric,
    companies_involved uuid[],
    company_names text[],
    top_topics text[],
    first_update date,
    last_update date
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
        f.id as founder_id,
        f.email as founder_email,
        f.name::text as founder_name,
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
END;
$$;

-- Additional utility functions for data consistency
CREATE OR REPLACE FUNCTION ensure_utc_timestamp(input_timestamp timestamptz)
RETURNS timestamptz AS $$
BEGIN
    RETURN input_timestamp AT TIME ZONE 'UTC';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION utc_now()
RETURNS timestamptz AS $$
BEGIN
    RETURN now() AT TIME ZONE 'UTC';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION safe_parse_timestamp(input_text text, fallback_timezone text DEFAULT 'UTC')
RETURNS timestamptz AS $$
BEGIN
    -- Try to parse the timestamp, fallback to UTC if no timezone specified
    BEGIN
        RETURN input_text::timestamptz;
    EXCEPTION WHEN OTHERS THEN
        -- If direct casting fails, try with fallback timezone
        BEGIN
            RETURN (input_text || ' ' || fallback_timezone)::timestamptz;
        EXCEPTION WHEN OTHERS THEN
            -- If all parsing fails, return NULL
            RETURN NULL;
        END;
    END;
END;
$$ LANGUAGE plpgsql;

-- Get embedding size statistics function
CREATE OR REPLACE FUNCTION get_embedding_size_stats()
RETURNS TABLE (
    total_embeddings bigint,
    avg_size_bytes numeric,
    max_size_bytes integer,
    oversized_count bigint,
    size_distribution jsonb
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
        COUNT(*) as total_embeddings,
        ROUND(AVG(content_size_bytes), 2) as avg_size_bytes,
        MAX(content_size_bytes) as max_size_bytes,
        COUNT(*) FILTER (WHERE content_size_bytes > 12288) as oversized_count,
        jsonb_build_object(
            'small_4kb', COUNT(*) FILTER (WHERE content_size_bytes <= 4096),
            'medium_8kb', COUNT(*) FILTER (WHERE content_size_bytes > 4096 AND content_size_bytes <= 8192),
            'large_12kb', COUNT(*) FILTER (WHERE content_size_bytes > 8192 AND content_size_bytes <= 12288),
            'oversized', COUNT(*) FILTER (WHERE content_size_bytes > 12288)
        ) as size_distribution
    FROM embeddings;
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
COMMENT ON COLUMN companies.notes IS 'Internal notes about the company';
COMMENT ON COLUMN companies.country IS 'Company HQ country code (ISO-3166-1 alpha-2, e.g. US, GB, DE)';
COMMENT ON COLUMN companies.stage_at_investment IS 'What stage the company was in when The Pitch Fund invested';
COMMENT ON COLUMN companies.pitch_season IS 'Season number of "The Pitch" podcast where the company appeared';
COMMENT ON COLUMN companies.updated_at IS 'Timestamp of last record update';
COMMENT ON COLUMN companies.fund IS 'The Pitch Fund number (I, II, III)';
COMMENT ON COLUMN companies.instrument IS 'Investment instrument type (SAFE, convertible note, equity)';
COMMENT ON COLUMN companies.legal_name IS 'Legal company name as registered';
COMMENT ON COLUMN companies.svg_logo_url IS 'SVG format logo URL for better scalability';
COMMENT ON COLUMN companies.episode_publish_date IS 'Date when The Pitch episode was published';

-- VCs table comments
COMMENT ON TABLE vcs IS 'Venture capitalists and investors featured on The Pitch podcast';
COMMENT ON COLUMN vcs.name IS 'Full name of the VC/investor';
COMMENT ON COLUMN vcs.firm_name IS 'Name of the investment firm';
COMMENT ON COLUMN vcs.role_title IS 'Job title at the firm';
COMMENT ON COLUMN vcs.thepitch_profile_url IS 'URL to their profile on ThePitch.show website';
COMMENT ON COLUMN vcs.instagram_url IS 'Instagram profile URL';

-- Founders table comments
COMMENT ON TABLE founders IS 'Minimal founders table for data integrity and proper linking';
COMMENT ON COLUMN founders.email IS 'Case-insensitive unique email using citext. Supports email@domain.com = EMAIL@DOMAIN.COM matching.';
COMMENT ON COLUMN founders.role IS 'Simplified founder classification: founder or cofounder for clear founder structure identification.';
COMMENT ON COLUMN founders.sex IS 'Founder self-identified sex / gender (enum)';
COMMENT ON COLUMN founders.first_name IS 'First name of the founder';
COMMENT ON COLUMN founders.last_name IS 'Last name of the founder';
COMMENT ON COLUMN founders.title IS 'Professional title/role';

-- Company founders table comments
COMMENT ON TABLE company_founders IS 'Junction table linking founders to companies (many-to-many)';
COMMENT ON COLUMN company_founders.role IS 'Founder role at this specific company';

-- Company VCs table comments
COMMENT ON TABLE company_vcs IS 'Junction table linking companies to VCs through podcast episodes';
COMMENT ON COLUMN company_vcs.episode_season IS 'Season of The Pitch episode';
COMMENT ON COLUMN company_vcs.episode_number IS 'Episode number within the season';
COMMENT ON COLUMN company_vcs.episode_url IS 'URL to the specific episode';

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
