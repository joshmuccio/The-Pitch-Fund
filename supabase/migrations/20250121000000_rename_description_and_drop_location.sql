-- Migration: Rename description to description_ai_generated and drop location column
-- Date: 2025-01-21
-- Description: Rename 'description' column to 'description_ai_generated' for clarity (it stores vector embeddings)
--              and drop the redundant 'location' column as it's superseded by structured location fields

-- Drop any dependent views that might reference these columns
DROP VIEW IF EXISTS company_progress_timeline CASCADE;
DROP VIEW IF EXISTS founder_timeline_analysis CASCADE;
DROP VIEW IF EXISTS founder_insights CASCADE;
DROP VIEW IF EXISTS portfolio_demographics CASCADE;
DROP VIEW IF EXISTS company_investment_summary CASCADE;

-- 1. Rename description to description_ai_generated for clarity
-- This column stores vector embeddings (vector(1536)) for AI-powered features
ALTER TABLE companies 
RENAME COLUMN description TO description_ai_generated;

-- Update the comment to reflect the new name and purpose
COMMENT ON COLUMN companies.description_ai_generated IS 
'AI-generated vector embeddings (vector(1536)) of company description for semantic search and ML features';

-- 2. Drop the redundant location column
-- This is superseded by structured location fields: hq_address_line_1, hq_city, hq_state, hq_country, etc.
ALTER TABLE companies 
DROP COLUMN IF EXISTS location;

-- Recreate the main views that were dropped
-- Company progress timeline view
CREATE OR REPLACE VIEW company_progress_timeline AS
SELECT 
    c.*,
    -- Aggregate founder update insights
    COUNT(fu.id) as total_updates,
    AVG(fu.sentiment_score) as avg_sentiment,
    ARRAY_AGG(DISTINCT CONCAT(COALESCE(f.first_name, ''), ' ', COALESCE(f.last_name, ''))) FILTER (WHERE f.first_name IS NOT NULL OR f.last_name IS NOT NULL) as founders,
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

-- Portfolio demographics view
CREATE OR REPLACE VIEW portfolio_demographics AS
SELECT 
    c.hq_country,
    c.stage_at_investment,
    c.episode_season,
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
GROUP BY c.hq_country, c.stage_at_investment, c.episode_season
ORDER BY c.episode_season DESC, c.hq_country;

-- Company investment summary view
CREATE OR REPLACE VIEW company_investment_summary AS
SELECT 
    c.id as company_id,
    c.name as company_name,
    c.slug as company_slug,
    MIN(cv.episode_publish_date) as first_episode_publish_date,
    COUNT(DISTINCT cv.vc_id) as total_vcs_featured,
    COUNT(DISTINCT cv.vc_id) FILTER (WHERE cv.is_invested = true) as total_investors,
    SUM(cv.investment_amount_usd) FILTER (WHERE cv.is_invested = true) as total_raised_from_episode_usd,
    ARRAY_AGG(DISTINCT v.name) FILTER (WHERE cv.is_invested = true) as investor_names
FROM companies c
LEFT JOIN company_vcs cv ON c.id = cv.company_id
LEFT JOIN vcs v ON cv.vc_id = v.id
GROUP BY c.id, c.name, c.slug;

-- Founder timeline analysis view
CREATE OR REPLACE VIEW founder_timeline_analysis AS
SELECT 
    c.name as company_name,
    c.slug as company_slug,
    CONCAT(COALESCE(f.first_name, ''), ' ', COALESCE(f.last_name, '')) as founder_name,
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
    CONCAT(COALESCE(f.first_name, ''), ' ', COALESCE(f.last_name, '')) as founder_name,
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
GROUP BY f.id, f.email, f.first_name, f.last_name, f.role, f.linkedin_url;

-- Add migration tracking comment
COMMENT ON TABLE companies IS 
'Portfolio companies table - renamed description to description_ai_generated and removed redundant location column';

-- Add helpful migration notes
/*
MIGRATION NOTES:

1. RENAMED COLUMN: description → description_ai_generated
   - This column stores vector embeddings (vector(1536)) for AI features
   - The rename clarifies its purpose vs description_raw (user input)

2. DROPPED COLUMN: location
   - Redundant with structured location fields:
     * hq_address_line_1, hq_address_line_2
     * hq_city, hq_state, hq_zip_code, hq_country
     * hq_latitude, hq_longitude

3. UPDATED VIEWS: Recreated dependent views to ensure compatibility
   - Fixed founder name references to use first_name + last_name instead of deprecated name column

USAGE AFTER MIGRATION:
- Use description_raw for human-readable company descriptions
- Use description_ai_generated for vector/embedding operations
- Use structured hq_* fields for location queries
*/ 