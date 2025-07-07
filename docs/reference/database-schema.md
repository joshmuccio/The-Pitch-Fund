# 📋 Database Schema Reference

Complete technical specification of The Pitch Fund database schema.

## Tables Overview

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `companies` | Core company data | Parent to `founders` |
| `founders` | Founder information | Child of `companies` |
| `founder_updates` | Temporal founder data | Child of `founders` |
| `profiles` | User management | Authentication users |

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
  co_investors text[],
  
  -- Location & Legal
  country text NOT NULL,
  state text,
  city text,
  address_line_1 text,
  address_line_2 text,
  zip_code text,
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

-- Array/JSON indexes
CREATE INDEX idx_companies_industry_tags ON companies USING GIN(industry_tags);
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
| `co_investors` | text[] | Other investors | [] |
| `state` | text | State/province | NULL |
| `city` | text | City | NULL |
| `address_line_1` | text | Street address | NULL |
| `address_line_2` | text | Additional address | NULL |
| `zip_code` | text | Postal code | NULL |
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
  array_length(c.industry_tags, 1) as tag_count,
  array_length(c.co_investors, 1) as co_investor_count,
  COUNT(f.id) as founder_count,
  COUNT(fu.id) as update_count,
  AVG(fu.sentiment_score) as avg_sentiment,
  MAX(fu.created_at) as last_update
FROM companies c
LEFT JOIN founders f ON c.id = f.company_id
LEFT JOIN founder_updates fu ON c.id = fu.company_id
GROUP BY c.id, c.company_name, c.investment_amount, c.investment_date, 
         c.stage_at_investment, c.country, c.industry_tags, c.co_investors;

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

### Recent Changes

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
SELECT * FROM companies WHERE industry_tags @> ARRAY['fintech'];

-- Inefficient: Full table scan
SELECT * FROM companies WHERE EXTRACT(YEAR FROM investment_date) = 2024;
```

### Connection Pooling

- Supabase handles connection pooling automatically
- Maximum 60 connections per project on free tier
- Use connection pooling for high-traffic applications

---

**Related Documentation:**
- [Database Management](../how-to/database-management.md) - Managing schema changes
- [Architecture Overview](../explanation/architecture.md) - System design context
- [Form Validation](../how-to/form-validation.md) - Frontend validation rules 