-- Migration: Add Portfolio Analytics Fields
-- Adds demographic tracking, investment stage context, and podcast season mapping

-- ===== 1. NEW ENUMS =====

-- Founder demographic tracking
CREATE TYPE founder_sex AS ENUM ('male','female');

-- Company funding stage at time of our investment
CREATE TYPE company_stage AS ENUM (
  'pre_seed',
  'seed'
);

-- ===== 2. COMPANIES TABLE UPDATES =====

-- a) Country (ISO-3166-1 alpha-2) – short, index-friendly
ALTER TABLE companies
ADD COLUMN country char(2) CHECK (country ~ '^[A-Z]{2}$');

-- b) Stage at the moment **we** invested
ALTER TABLE companies
ADD COLUMN stage_at_investment company_stage DEFAULT 'pre_seed';

-- c) Season number of the podcast episode the company debuted in
ALTER TABLE companies
ADD COLUMN pitch_season integer CHECK (pitch_season >= 1);

-- ===== 3. FOUNDERS TABLE UPDATE =====

-- Add demographic tracking field
ALTER TABLE founders
ADD COLUMN sex founder_sex;

-- ===== 4. PERFORMANCE INDEXES =====

-- Helpful index for filtering by season
CREATE INDEX IF NOT EXISTS idx_companies_pitch_season ON companies(pitch_season);

-- Optional index if querying by founder demographics
CREATE INDEX IF NOT EXISTS idx_founders_sex ON founders(sex);

-- Compound index for common analytics queries (country + stage)
CREATE INDEX IF NOT EXISTS idx_companies_country_stage ON companies(country, stage_at_investment);

-- ===== 5. FIELD DOCUMENTATION =====

COMMENT ON COLUMN companies.country IS
  'Company HQ country code (ISO-3166-1 alpha-2, e.g. US, GB, DE)';

COMMENT ON COLUMN companies.stage_at_investment IS
  'What stage the company was in when The Pitch Fund invested';

COMMENT ON COLUMN companies.pitch_season IS
  'Season number of "The Pitch" podcast where the company appeared';

COMMENT ON COLUMN founders.sex IS
  'Founder self-identified sex / gender (enum)';

-- ===== 6. ENUM DOCUMENTATION =====

COMMENT ON TYPE founder_sex IS
  'Demographic tracking for founder diversity analytics';

COMMENT ON TYPE company_stage IS
  'Funding stage classification at time of investment by The Pitch Fund';

-- ===== 7. ANALYTICS HELPER VIEWS =====

-- Portfolio demographics overview
CREATE OR REPLACE VIEW portfolio_demographics AS
SELECT 
    c.country,
    c.stage_at_investment,
    c.pitch_season,
    COUNT(DISTINCT c.id) as company_count,
    COUNT(DISTINCT f.id) as founder_count,
    COUNT(DISTINCT f.id) FILTER (WHERE f.sex = 'female') as female_founders,
    COUNT(DISTINCT f.id) FILTER (WHERE f.sex = 'male') as male_founders,
    ROUND(
        COUNT(DISTINCT f.id) FILTER (WHERE f.sex = 'female')::numeric / 
        NULLIF(COUNT(DISTINCT f.id), 0) * 100, 
        1
    ) as female_founder_percentage
FROM companies c
LEFT JOIN company_founders cf ON c.id = cf.company_id AND cf.is_active = true
LEFT JOIN founders f ON cf.founder_id = f.id
WHERE c.status = 'active'
GROUP BY c.country, c.stage_at_investment, c.pitch_season
ORDER BY c.pitch_season DESC, c.country;

-- Season performance overview
CREATE OR REPLACE VIEW season_performance AS
SELECT 
    pitch_season,
    COUNT(*) as companies_invested,
    COUNT(*) FILTER (WHERE status = 'active') as still_active,
    COUNT(*) FILTER (WHERE status = 'exited') as successful_exits,
    COUNT(*) FILTER (WHERE status = 'acquihired') as acquihires,
    COUNT(*) FILTER (WHERE status = 'dead') as failed_companies,
    AVG(investment_amount) as avg_investment,
    AVG(post_money_valuation) as avg_valuation,
    ROUND(
        COUNT(*) FILTER (WHERE status IN ('exited', 'acquihired'))::numeric / 
        COUNT(*)::numeric * 100, 
        1
    ) as success_rate_percentage
FROM companies
WHERE pitch_season IS NOT NULL
GROUP BY pitch_season
ORDER BY pitch_season DESC;

COMMENT ON VIEW portfolio_demographics IS
  'Analytics view: Portfolio diversity and geographic distribution by stage and season';

COMMENT ON VIEW season_performance IS
  'Analytics view: Investment performance metrics by podcast season';

-- ===== 8. BEST PRACTICES COMPLIANCE =====

-- Update updated_at timestamp for modified tables
-- (Triggers already exist from previous migrations, so new columns will be included automatically)

-- Add validation examples in comments
/*
USAGE EXAMPLES:

1. Portfolio Analytics by Country:
   SELECT * FROM portfolio_demographics WHERE country = 'US';

2. Season Performance Tracking:
   SELECT * FROM season_performance ORDER BY success_rate_percentage DESC;

3. Diversity Analytics:
   SELECT 
     country,
     AVG(female_founder_percentage) as avg_female_representation
   FROM portfolio_demographics 
   GROUP BY country
   ORDER BY avg_female_representation DESC;

4. Investment Stage Analysis:
   SELECT 
     stage_at_investment,
     COUNT(*) as investments,
     AVG(post_money_valuation) as avg_valuation
   FROM companies 
   WHERE stage_at_investment IS NOT NULL
   GROUP BY stage_at_investment;

5. Podcast Season ROI Analysis:
   SELECT 
     pitch_season,
     success_rate_percentage,
     avg_investment,
     avg_valuation
   FROM season_performance
   WHERE companies_invested >= 3; -- Seasons with meaningful sample size
*/
