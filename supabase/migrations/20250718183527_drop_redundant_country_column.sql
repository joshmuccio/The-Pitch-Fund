-- Migration: Drop redundant country column from companies table
-- Date: 2025-01-18
-- Description: Remove the redundant 'country' column that conflicts with 'hq_country'
--              Keep hq_country (for headquarters location) and country_of_incorp (for legal incorporation)

-- Drop any dependent views that might reference the country column
DROP VIEW IF EXISTS company_progress_timeline CASCADE;
DROP VIEW IF EXISTS founder_timeline_analysis CASCADE;
DROP VIEW IF EXISTS founder_insights CASCADE;
DROP VIEW IF EXISTS portfolio_demographics CASCADE;

-- Drop the index that uses the country column
DROP INDEX IF EXISTS idx_companies_country_stage;

-- Migrate any existing data from 'country' to 'hq_country' if hq_country is null
-- This ensures we don't lose data
UPDATE companies 
SET hq_country = country 
WHERE country IS NOT NULL 
  AND (hq_country IS NULL OR hq_country = '');

-- Drop the redundant country column
ALTER TABLE companies DROP COLUMN IF EXISTS country;

-- Recreate the index using hq_country instead of country
CREATE INDEX IF NOT EXISTS idx_companies_hq_country_stage 
ON companies(hq_country, stage_at_investment);

-- Add an index for just hq_country for efficient geographic queries
CREATE INDEX IF NOT EXISTS idx_companies_hq_country 
ON companies(hq_country) 
WHERE hq_country IS NOT NULL;

-- Recreate the views that were dropped
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

-- Recreate the portfolio_demographics view using hq_country instead of country
CREATE OR REPLACE VIEW portfolio_demographics AS
SELECT 
    c.hq_country,
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
GROUP BY c.hq_country, c.stage_at_investment, c.pitch_season
ORDER BY c.pitch_season DESC, c.hq_country;

-- Update column comments to clarify the remaining country fields
COMMENT ON COLUMN companies.hq_country IS 
'Country where company headquarters is located (ISO-3166-1 alpha-2 codes like US, CA, GB)';

COMMENT ON COLUMN companies.country_of_incorp IS 
'Country where company is legally incorporated (ISO-3166-1 alpha-2 codes)';

-- Add migration notes
COMMENT ON TABLE companies IS 
'Portfolio companies table - cleaned up to use hq_country (HQ location) and country_of_incorp (legal) instead of redundant country column';
