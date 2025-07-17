# 📋 Database Schema Reference

Complete technical specification of The Pitch Fund database schema.

## Tables Overview

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `companies` | Core company data | Parent to `founders`, `company_vcs` |
| `founders` | Founder information | Child of `companies` |
| `founder_updates` | Temporal founder data | Child of `founders` |
| `profiles` | User management | Authentication users |
| `vcs` | VC profile information | Parent to `company_vcs` |
| `company_vcs` | Company-VC relationships | Junction table linking `companies` and `vcs` |

---

## companies

Primary table containing investment portfolio companies.

### Schema

```sql
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Company Identity
  company_name text NOT NULL,
  slug citext UNIQUE NOT NULL,
  website_url text,
  
  -- Investment Details
  investment_date date NOT NULL,
  investment_amount numeric(20,4) NOT NULL,
  investment_instrument investment_instrument NOT NULL,
  stage_at_investment stage_at_investment NOT NULL,
  
  -- Valuation & Terms
  post_money_valuation numeric(20,4),
  round_size numeric(20,4),
  conversion_cap numeric(20,4),
  discount_percent numeric(5,2),
  
  -- Business Details
  description text,
  description_raw text,
  industry_tags text[],
  business_model_tags text[],
  keywords text[],
  co_investors text[],
  
  -- Pitch Episode Information
  pitch_episode_url text,
  episode_publish_date date,
  pitch_transcript text,
  
  -- Location & Legal
  country text NOT NULL,
  state text,
  city text,
  address_line_1 text,
  address_line_2 text,
  zip_code text,
  hq_latitude numeric(10,8),
  hq_longitude numeric(11,8),
  incorporation_type incorporation_type NOT NULL,
  
  -- Metadata
  ic_lp_memo text,
  founded_year integer,
  status company_status DEFAULT 'active'::company_status,
  
  -- Analytics
  description_vector vector(1536),
  
  -- Constraints
  CONSTRAINT companies_founded_year_check 
    CHECK (founded_year >= 1900 AND founded_year <= EXTRACT(YEAR FROM CURRENT_DATE)),
  CONSTRAINT companies_positive_amounts 
    CHECK (investment_amount > 0 AND (post_money_valuation IS NULL OR post_money_valuation > 0))
);
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_companies_investment_date ON companies(investment_date);
CREATE INDEX idx_companies_country ON companies(country);
CREATE INDEX idx_companies_stage ON companies(stage_at_investment);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_founded_year ON companies(founded_year);

-- Geospatial indexes
CREATE INDEX idx_companies_hq_coordinates ON companies(hq_latitude, hq_longitude);

-- Array/JSON indexes  
CREATE INDEX idx_companies_industry_tags_gin ON companies USING GIN(industry_tags);
CREATE INDEX idx_companies_business_model_tags_gin ON companies USING GIN(business_model_tags);
CREATE INDEX idx_companies_keywords_gin ON companies USING GIN(keywords);
CREATE INDEX idx_companies_co_investors ON companies USING GIN(co_investors);

-- Full-text search
CREATE INDEX idx_companies_description_fts ON companies USING GIN(to_tsvector('english', description));

-- Vector search (AI features)
CREATE INDEX idx_companies_description_vector ON companies USING ivfflat(description_vector vector_cosine_ops);
```

### Field Specifications

#### Required Fields

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `company_name` | text | Legal company name | 1-200 characters |
| `slug` | citext | URL-friendly identifier | Unique, lowercase |
| `investment_date` | date | Date investment was made | Valid date |
| `investment_amount` | numeric(20,4) | Amount invested in USD | > 0 |
| `investment_instrument` | enum | Type of investment | See enums below |
| `stage_at_investment` | enum | Company stage | See enums below |
| `country` | text | Country of incorporation | ISO country name |
| `incorporation_type` | enum | Legal structure | See enums below |

#### Conditional Fields

| Field | Required When | Type | Description |
|-------|---------------|------|-------------|
| `post_money_valuation` | instrument = 'equity' | numeric(20,4) | Post-money valuation |
| `conversion_cap` | instrument = 'safe' OR 'note' | numeric(20,4) | Valuation cap |
| `discount_percent` | instrument = 'note' | numeric(5,2) | Discount rate |

#### Optional Fields

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `website_url` | text | Company website | NULL |
| `description` | text | Company description | NULL |
| `description_raw` | text | Raw description text | NULL |
| `industry_tags` | text[] | Industry categories | [] |
| `business_model_tags` | text[] | Business model categories | [] |
| `keywords` | text[] | Operational keywords | [] |
| `co_investors` | text[] | Other investors | [] |
| `state` | text | State/province | NULL |
| `city` | text | City | NULL |
| `address_line_1` | text | Street address | NULL |
| `address_line_2` | text | Additional address | NULL |
| `zip_code` | text | Postal code | NULL |
| `hq_latitude` | numeric(10,8) | Headquarters latitude | NULL |
| `hq_longitude` | numeric(11,8) | Headquarters longitude | NULL |
| `ic_lp_memo` | text | Investment memo | NULL |
| `founded_year` | integer | Year founded | NULL |
| `status` | enum | Company status | 'active' |

---

## founders

Individual founder information linked to companies.

### Schema

```sql
CREATE TABLE founders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Identity
  email citext UNIQUE NOT NULL,
  name text,
  
  -- Professional
  role founder_role NOT NULL DEFAULT 'founder'::founder_role,
  linkedin_url text,
  bio text,
  
  -- Company Association
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Validation
  CONSTRAINT founders_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT founders_linkedin_format CHECK (linkedin_url IS NULL OR linkedin_url ~* '^https?://([a-z]+\.)?linkedin\.com/')
);
```

### Indexes

```sql
CREATE INDEX idx_founders_company_id ON founders(company_id);
CREATE INDEX idx_founders_email ON founders(email);
CREATE INDEX idx_founders_role ON founders(role);
CREATE UNIQUE INDEX idx_founders_email_unique ON founders(email);
```

### Field Specifications

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `email` | citext | Yes | Primary contact email | Valid email format |
| `name` | text | No | Full name | 1-100 characters |
| `role` | enum | Yes | Founder role | 'founder' \| 'cofounder' |
| `linkedin_url` | text | No | LinkedIn profile | Valid LinkedIn URL |
| `bio` | text | No | Professional background | Free text |
| `company_id` | uuid | Yes | Associated company | Valid company ID |

---

## founder_updates

Temporal data for founder updates and communications.

### Schema

```sql
CREATE TABLE founder_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Associations
  founder_id uuid NOT NULL REFERENCES founders(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Update Content
  update_type founder_update_type NOT NULL,
  content text NOT NULL,
  
  -- AI Analysis
  sentiment_score numeric(4,3),
  key_metrics_mentioned text[],
  topics_extracted text[],
  ai_summary text,
  
  -- Metadata
  period_start date,
  period_end date,
  external_id text,
  
  -- Validation
  CONSTRAINT founder_updates_sentiment_range 
    CHECK (sentiment_score IS NULL OR (sentiment_score >= -1 AND sentiment_score <= 1)),
  CONSTRAINT founder_updates_period_order 
    CHECK (period_start IS NULL OR period_end IS NULL OR period_start <= period_end)
);
```

### Indexes

```sql
CREATE INDEX idx_founder_updates_founder_id ON founder_updates(founder_id);
CREATE INDEX idx_founder_updates_company_id ON founder_updates(company_id);
CREATE INDEX idx_founder_updates_type ON founder_updates(update_type);
CREATE INDEX idx_founder_updates_created_at ON founder_updates(created_at);
CREATE INDEX idx_founder_updates_period ON founder_updates(period_start, period_end);
```

---

## profiles

User management and authentication.

### Schema

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Profile Information
  email text UNIQUE NOT NULL,
  full_name text,
  role text DEFAULT 'user'::text,
  
  -- Preferences
  preferences jsonb DEFAULT '{}'::jsonb,
  
  -- Validation
  CONSTRAINT profiles_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);
```

### Indexes

```sql
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
```

---

## Enums

### investment_instrument

Valid investment types.

```sql
CREATE TYPE investment_instrument AS ENUM (
  'safe',    -- Simple Agreement for Future Equity
  'note',    -- Convertible Note
  'equity'   -- Direct Equity Investment
);
```

### stage_at_investment

Company stage when investment was made.

```sql
CREATE TYPE stage_at_investment AS ENUM (
  'pre_seed',
  'seed'
);
```

### incorporation_type

Legal structure types.

```sql
CREATE TYPE incorporation_type AS ENUM (
  'c_corporation',
  'llc',
  'partnership',
  'sole_proprietorship',
  'other'
);
```

### founder_role

Founder role classification.

```sql
CREATE TYPE founder_role AS ENUM (
  'founder',      -- Single founder or primary founder
  'cofounder'     -- Co-founder
);
```

### company_status

Company status tracking.

```sql
CREATE TYPE company_status AS ENUM (
  'active',    -- Currently operating
  'exited',    -- Successful exit
  'dead'       -- No longer operating
);
```

### founder_update_type

Types of founder updates.

```sql
CREATE TYPE founder_update_type AS ENUM (
  'monthly_update',
  'quarterly_update',
  'annual_update',
  'milestone_update',
  'ad_hoc_update'
);
```

### industry_tag

Standardized industry and target market categories.

```sql
CREATE TYPE industry_tag AS ENUM (
  -- Technology & Software
  'fintech', 'edtech', 'healthtech', 'proptech', 'insurtech', 'legaltech', 'hrtech', 'martech', 'adtech',
  'cleantech', 'foodtech', 'agtech', 'regtech', 'femtech', 'biotech', 'medtech', 'deeptech', 'hardware',
  'ev_tech', 'vertical_saas', 'agentic_ai', 'ai', 'machine_learning', 'blockchain', 'crypto', 'web3',
  'iot', 'cybersecurity', 'developer_tools', 'no_code', 'robotics', 'ar_vr', 'gaming',
  'esports', 'nft', 'digital_health', 'telemedicine', 'mental_health', 'climate_tech', 'carbon_credits',
  'renewable_energy', 'sustainability', 'greentech_sustainability', 'supply_chain', 'logistics',
  'transportation', 'mobility', 'autonomous_vehicles', 'drones', 'space_tech', 'quantum_computing',
  -- Target Markets
  'b2b', 'b2c', 'b2b2c', 'enterprise', 'smb', 'consumer', 'prosumer', 'government', 'healthcare_providers',
  'financial_services', 'retail', 'manufacturing', 'construction', 'real_estate', 'hospitality', 'travel',
  'food_beverage', 'cpg', 'fashion_beauty', 'sports_fitness', 'pets', 'parenting', 'seniors', 'students',
  'freelancers', 'creators', 'artists', 'musicians', 'photographers', 'writers', 'designers', 'developers',
  -- Industries
  'media_entertainment', 'news', 'social_media', 'marketplace', 'ecommerce', 'marketplace_commerce',
  'sharing_economy', 'gig_economy', 'remote_work', 'collaboration', 'communication', 'productivity',
  'project_management', 'crm', 'sales', 'marketing', 'analytics', 'data', 'api', 'infrastructure'
);
```

### business_model_tag

Standardized business model and revenue model categories.

```sql
CREATE TYPE business_model_tag AS ENUM (
  -- Revenue Models
  'subscription', 'freemium', 'free', 'one_time_purchase', 'usage_based', 'transaction_fee', 'commission',
  'advertising', 'sponsorship', 'affiliate', 'licensing', 'white_label', 'franchise',
  -- Business Types
  'saas', 'paas', 'iaas', 'marketplace', 'platform', 'social_network', 'aggregator', 'broker',
  'peer_to_peer', 'p2p', 'consulting', 'agency', 'services', 'hardware', 'ecommerce',
  -- Target Markets
  'b2b', 'b2c', 'b2b2c', 'enterprise', 'smb', 'consumer'
);
```

### keyword_tag

Standardized operational keywords and technology approaches (70+ values).

```sql
CREATE TYPE keyword_tag AS ENUM (
  -- Growth Strategies
  'product_market_fit', 'founder_market_fit', 'minimum_viable_product', 'mvp', 'pivot', 'bootstrapped', 
  'viral_growth', 'flywheel_effect', 'lean_startup', 'network_effects', 'product_led_growth', 'sales_led_growth',
  'community_led_growth', 'growth_hacking', 'customer_acquisition_cost', 'lifetime_value', 'churn_rate',
  
  -- Technology & AI
  'AI', 'machine_learning', 'deep_learning', 'natural_language_processing', 'nlp', 'computer_vision',
  'generative_ai', 'agentic_ai', 'blockchain_based', 'cloud_native', 'edge_computing', 'api_first',
  'no_code', 'low_code', 'open_source', 'proprietary_technology', 'patent_pending', 'scalable_infrastructure',
  
  -- Data & Analytics
  'data_play', 'real_time_analytics', 'predictive_analytics', 'big_data', 'personalization', 'recommendation_engine',
  'behavioral_insights', 'user_generated_content', 'content_moderation', 'search_optimization',
  
  -- Delivery & Operations
  'mobile_app', 'web_based', 'cross_platform', 'omnichannel', 'white_glove', 'self_service', 'managed_service',
  'do_it_yourself', 'on_demand', 'subscription_based', 'freemium_model', 'pay_per_use', 'usage_based_pricing',
  
  -- Manufacturing & Physical
  '3d_printing', 'additive_manufacturing', 'supply_chain_optimization', 'inventory_management', 'logistics',
  'last_mile_delivery', 'cold_chain', 'quality_assurance', 'regulatory_compliance',
  
  -- User Experience
  'user_friendly', 'intuitive_interface', 'seamless_integration', 'single_sign_on', 'multi_tenant',
  'white_label', 'customizable', 'configurable', 'plug_and_play', 'turnkey_solution'
  'product_market_fit', 'founder_market_fit', 'minimum_viable_product', 'pivot', 'bootstrapped',
  'lean_startup', 'agile', 'design_thinking', 'user_centric', 'data_play', 'metrics_driven',
  'flywheel_effect', '3d_printing'
  -- ... and many more (see migration files for complete list)
);
```

**Note**: The complete enum contains 70+ values across technology approaches, delivery models, service models, growth strategies, operational characteristics, and business strategy keywords. See `supabase/migrations/20250109000000_create_standardized_tags.sql` for the full enum definition.

---

## Views

### Materialized Views

#### company_analytics

Pre-computed analytics for performance.

```sql
CREATE MATERIALIZED VIEW company_analytics AS
SELECT 
  c.id,
  c.company_name,
  c.investment_amount,
  c.investment_date,
  EXTRACT(YEAR FROM c.investment_date) as investment_year,
  c.stage_at_investment,
  c.country,
  array_length(c.industry_tags, 1) as industry_tag_count,
  array_length(c.business_model_tags, 1) as business_model_tag_count,
  array_length(c.keywords, 1) as keyword_count,
  array_length(c.co_investors, 1) as co_investor_count,
  COUNT(f.id) as founder_count,
  COUNT(fu.id) as update_count,
  AVG(fu.sentiment_score) as avg_sentiment,
  MAX(fu.created_at) as last_update
FROM companies c
LEFT JOIN founders f ON c.id = f.company_id
LEFT JOIN founder_updates fu ON c.id = fu.company_id
GROUP BY c.id, c.company_name, c.investment_amount, c.investment_date, 
         c.stage_at_investment, c.country, c.industry_tags, c.business_model_tags, c.keywords, c.co_investors;

CREATE UNIQUE INDEX idx_company_analytics_id ON company_analytics(id);
```

---

## Functions

### Utility Functions

#### utc_now()

Returns current UTC timestamp.

```sql
CREATE OR REPLACE FUNCTION utc_now()
RETURNS timestamptz AS $$
BEGIN
  RETURN now() AT TIME ZONE 'UTC';
END;
$$ LANGUAGE plpgsql;
```

#### ensure_utc_timestamp()

Converts any timestamp to UTC.

```sql
CREATE OR REPLACE FUNCTION ensure_utc_timestamp(input_timestamp timestamptz)
RETURNS timestamptz AS $$
BEGIN
  RETURN input_timestamp AT TIME ZONE 'UTC';
END;
$$ LANGUAGE plpgsql;
```

### Triggers

#### updated_at Trigger

Automatically updates `updated_at` field.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = utc_now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_founders_updated_at
  BEFORE UPDATE ON founders
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_founder_updates_updated_at
  BEFORE UPDATE ON founder_updates
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
```

---

## Row Level Security (RLS)

### companies Table

```sql
-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all companies
CREATE POLICY "Users can view all companies" ON companies
  FOR SELECT USING (true);

-- Allow authenticated users to insert companies
CREATE POLICY "Authenticated users can insert companies" ON companies
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update companies
CREATE POLICY "Authenticated users can update companies" ON companies
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete companies
CREATE POLICY "Authenticated users can delete companies" ON companies
  FOR DELETE USING (auth.role() = 'authenticated');
```

### founders Table

```sql
-- Enable RLS
ALTER TABLE founders ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all founders
CREATE POLICY "Users can view all founders" ON founders
  FOR SELECT USING (true);

-- Allow authenticated users to insert founders
CREATE POLICY "Authenticated users can insert founders" ON founders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update founders
CREATE POLICY "Authenticated users can update founders" ON founders
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete founders
CREATE POLICY "Authenticated users can delete founders" ON founders
  FOR DELETE USING (auth.role() = 'authenticated');
```

---

## Data Validation

### Check Constraints

```sql
-- Companies table constraints
ALTER TABLE companies ADD CONSTRAINT companies_positive_amounts 
  CHECK (investment_amount > 0 AND (post_money_valuation IS NULL OR post_money_valuation > 0));

ALTER TABLE companies ADD CONSTRAINT companies_founded_year_check 
  CHECK (founded_year >= 1900 AND founded_year <= EXTRACT(YEAR FROM CURRENT_DATE));

-- Founders table constraints  
ALTER TABLE founders ADD CONSTRAINT founders_email_format 
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE founders ADD CONSTRAINT founders_linkedin_format 
  CHECK (linkedin_url IS NULL OR linkedin_url ~* '^https?://([a-z]+\.)?linkedin\.com/');

-- Founder updates constraints
ALTER TABLE founder_updates ADD CONSTRAINT founder_updates_sentiment_range 
  CHECK (sentiment_score IS NULL OR (sentiment_score >= -1 AND sentiment_score <= 1));
```

### Foreign Key Constraints

```sql
-- Founders reference companies
ALTER TABLE founders ADD CONSTRAINT fk_founders_company_id
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Founder updates reference founders and companies
ALTER TABLE founder_updates ADD CONSTRAINT fk_founder_updates_founder_id
  FOREIGN KEY (founder_id) REFERENCES founders(id) ON DELETE CASCADE;

ALTER TABLE founder_updates ADD CONSTRAINT fk_founder_updates_company_id
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Profiles reference auth users
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_id
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

---

## Migration History

### Key Migrations

| Migration | Date | Description |
|-----------|------|-------------|
| `20250625012321_initial_schema.sql` | 2025-06-25 | Initial schema creation |
| `20250702212309_secure_views_rls_fix.sql` | 2025-07-02 | RLS policies and secure views |
| `20250703055109_cleanup_best_practices.sql` | 2025-07-03 | Timezone and data consistency |
| `20250703060033_add_portfolio_analytics_fields.sql` | 2025-07-03 | Portfolio analytics |
| `20250704_add_investment_fields_final.sql` | 2025-07-04 | Investment field enhancements |
| `20250104000015_update_founder_role_enum.sql` | 2025-01-04 | Updated founder role enum |
| `20250106000000_drop_redundant_linkedin_url.sql` | 2025-01-06 | Removed redundant linkedin_url field |
| `20250106000001_drop_pitch_deck_url.sql` | 2025-01-06 | Removed pitch_deck_url field |
| `20250107000000_add_hq_coordinates.sql` | 2025-01-07 | Added latitude/longitude fields for geocoding |

### Recent Changes

**2025-01-07**: Added `hq_latitude` and `hq_longitude` fields to companies table for precise geocoding coordinates. These fields are automatically populated via Mapbox API integration during address normalization.

**2025-01-06**: Removed redundant `linkedin_url` field from companies table (kept individual founder LinkedIn URLs) and `pitch_deck_url` field from companies table to eliminate form duplication.

**2025-01-04**: Updated `founder_role` enum from `'solo_founder'` to `'founder'` for clarity.

---

## Performance Considerations

### Query Optimization

**Recommended Indexes:**
- Always index foreign key columns
- Add composite indexes for multi-column WHERE clauses
- Use GIN indexes for array/JSONB searches
- Consider partial indexes for filtered queries

**Example Queries:**

```sql
-- Efficient: Uses index on investment_date
SELECT * FROM companies WHERE investment_date >= '2024-01-01';

-- Efficient: Uses composite index
SELECT * FROM companies WHERE country = 'United States' AND stage_at_investment = 'seed';

-- Efficient: Uses GIN index
-- Query examples with three-tag system
SELECT * FROM companies WHERE industry_tags @> ARRAY['fintech'];
SELECT * FROM companies WHERE business_model_tags @> ARRAY['saas'];
SELECT * FROM companies WHERE keywords @> ARRAY['AI'];

-- Multi-tag complex queries
SELECT * FROM companies 
WHERE industry_tags @> ARRAY['fintech'] 
  AND business_model_tags @> ARRAY['saas'] 
  AND keywords @> ARRAY['AI'];

-- Inefficient: Full table scan
SELECT * FROM companies WHERE EXTRACT(YEAR FROM investment_date) = 2024;
```

### Connection Pooling

- Supabase handles connection pooling automatically
- Maximum 60 connections per project on free tier
- Use connection pooling for high-traffic applications

---

## vcs

Venture capitalist profile information table.

### Schema

```sql
CREATE TABLE vcs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Profile Information
  name text NOT NULL,
  firm text,
  role text,
  bio text,
  seasons integer[] DEFAULT '{}',
  
  -- Social Links
  linkedin_url text,
  twitter_url text,
  website_url text,
  podcast_url text,
  
  -- Profile Management
  profile_image_url text,
  profile_source_url text,
  
  -- Constraints
  CONSTRAINT unique_vc_name_firm UNIQUE (name, firm)
);
```

### Indexes

```sql
-- Search optimization
CREATE INDEX idx_vcs_name ON vcs USING btree(name);
CREATE INDEX idx_vcs_firm ON vcs USING btree(firm);
CREATE INDEX idx_vcs_seasons ON vcs USING gin(seasons);

-- URL lookups
CREATE INDEX idx_vcs_profile_source_url ON vcs USING btree(profile_source_url);
```

### RLS Policies

```sql
-- Read access for authenticated users
CREATE POLICY "Authenticated users can read VCs" 
ON vcs FOR SELECT 
TO authenticated 
USING (true);

-- Admin-only write access
CREATE POLICY "Admin users can manage VCs" 
ON vcs FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);
```

### Key Features

- **Unique Constraint**: Prevents duplicate VCs based on name+firm combination
- **Social Links**: Comprehensive social media and website URL storage
- **Profile Source**: Tracks original URL where profile was sourced from
- **Flexible Firm**: Allows updating firm when VCs change companies
- **Manual Management**: VCs are created and managed through admin interface

---

## company_vcs

Junction table managing many-to-many relationships between companies and VCs.

### Schema

```sql
CREATE TABLE company_vcs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  
  -- Relationships
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  vc_id uuid REFERENCES vcs(id) ON DELETE CASCADE,
  
  -- Episode Context
  episode_season integer,
  episode_number integer,
  episode_url text,
  
  -- Constraints
  CONSTRAINT unique_company_vc UNIQUE (company_id, vc_id)
);
```

### Indexes

```sql
-- Relationship lookups
CREATE INDEX idx_company_vcs_company_id ON company_vcs USING btree(company_id);
CREATE INDEX idx_company_vcs_vc_id ON company_vcs USING btree(vc_id);

-- Episode context
CREATE INDEX idx_company_vcs_season ON company_vcs USING btree(episode_season);
```

### RLS Policies

```sql
-- Read access for authenticated users
CREATE POLICY "Authenticated users can read company-VC relationships" 
ON company_vcs FOR SELECT 
TO authenticated 
USING (true);

-- Admin-only write access
CREATE POLICY "Admin users can manage company-VC relationships" 
ON company_vcs FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);
```

### Key Features

- **Unique Relationships**: Prevents duplicate company-VC associations
- **Episode Context**: Tracks which episode featured the relationship
- **Cascade Delete**: Automatically cleans up relationships when companies or VCs are deleted
- **Flexible Metadata**: Allows storing additional context about the relationship

### Common Queries

```sql
-- Get all VCs for a specific company
SELECT v.*, cv.episode_season, cv.episode_number, cv.episode_url
FROM vcs v
JOIN company_vcs cv ON v.id = cv.vc_id
WHERE cv.company_id = $1;

-- Get all companies a VC has invested in
SELECT c.*, cv.episode_season, cv.episode_number
FROM companies c
JOIN company_vcs cv ON c.id = cv.company_id
WHERE cv.vc_id = $1;

-- VCs by season participation
SELECT v.*, array_agg(DISTINCT cv.episode_season) as investment_seasons
FROM vcs v
JOIN company_vcs cv ON v.id = cv.vc_id
GROUP BY v.id, v.name, v.firm;
```

---

**Related Documentation:**
- [Database Management](../how-to/database-management.md) - Managing schema changes
- [VC Management Guide](../VC_MANAGEMENT_GUIDE.md) - Complete VC system documentation
- [Architecture Overview](../explanation/architecture.md) - System design context
- [Form Validation](../how-to/form-validation.md) - Frontend validation rules 