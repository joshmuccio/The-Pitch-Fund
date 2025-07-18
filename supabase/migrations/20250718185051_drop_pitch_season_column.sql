-- Migration: Drop redundant pitch_season column from companies table
-- Date: 2025-01-18
-- Description: Remove the redundant 'pitch_season' column that duplicates 'episode_season'
--              Keep episode_season as the single source of truth for season data

-- Drop any dependent views that might reference the pitch_season column
DROP VIEW IF EXISTS portfolio_demographics CASCADE;
DROP VIEW IF EXISTS season_performance CASCADE;
DROP VIEW IF EXISTS company_progress_timeline CASCADE;
DROP VIEW IF EXISTS founder_timeline_analysis CASCADE;
DROP VIEW IF EXISTS founder_insights CASCADE;

-- Migrate any existing data from 'pitch_season' to 'episode_season' if episode_season is null
-- This ensures we don't lose any data that might exist in the old column
UPDATE companies 
SET episode_season = pitch_season 
WHERE pitch_season IS NOT NULL 
  AND (episode_season IS NULL);

-- Drop the redundant pitch_season column
ALTER TABLE companies DROP COLUMN IF EXISTS pitch_season;

-- Recreate the views using episode_season instead of pitch_season
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

-- Season performance view using episode_season
CREATE OR REPLACE VIEW season_performance AS
SELECT 
    episode_season,
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
WHERE episode_season IS NOT NULL
GROUP BY episode_season
ORDER BY episode_season DESC;

-- Recreate the other views that were dropped
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

-- Add migration notes
COMMENT ON TABLE companies IS 
'Portfolio companies table - cleaned up to use episode_season instead of redundant pitch_season column';

-- Add helpful comment
COMMENT ON COLUMN companies.episode_season IS 
'Season number of the podcast episode where the company was featured (replaced pitch_season)';
