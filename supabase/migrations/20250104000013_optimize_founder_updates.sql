-- Optimize founder_updates schema for better precision, data integrity, and performance
-- Date: 2025-01-04
-- Description: Improve sentiment scoring, standardize update types with enum, and add period_end indexing

-- Drop views that depend on founder_updates table temporarily
DROP VIEW IF EXISTS company_progress_timeline;
DROP VIEW IF EXISTS founder_timeline_analysis;
DROP VIEW IF EXISTS founder_insights;

-- 1. Create enum for founder update types
CREATE TYPE founder_update_type AS ENUM (
    'monthly',       -- Monthly updates
    'quarterly',     -- Quarterly reports
    'milestone',     -- Milestone achievements
    'annual',        -- Annual summaries
    'ad_hoc',        -- Unscheduled updates
    'other'          -- Catch-all for custom types
);

-- 2. Improve sentiment_score precision: decimal(3,2) → numeric(4,3)
-- Current: -9.99 to 9.99 (overkill for AI sentiment analysis)
-- Better: -1.000 to 1.000 (perfect precision for AI models)
ALTER TABLE founder_updates 
ALTER COLUMN sentiment_score TYPE numeric(4,3);

-- Add constraint to ensure sentiment scores stay within AI range
ALTER TABLE founder_updates 
ADD CONSTRAINT check_sentiment_score_range CHECK (
    sentiment_score IS NULL OR (sentiment_score >= -1.000 AND sentiment_score <= 1.000)
);

-- 3. Convert update_type from text to enum (handle existing data gracefully)
-- First, update any existing data to match enum values
UPDATE founder_updates SET update_type = 'monthly' WHERE update_type ILIKE '%month%';
UPDATE founder_updates SET update_type = 'quarterly' WHERE update_type ILIKE '%quarter%' OR update_type ILIKE '%q1%' OR update_type ILIKE '%q2%' OR update_type ILIKE '%q3%' OR update_type ILIKE '%q4%';
UPDATE founder_updates SET update_type = 'milestone' WHERE update_type ILIKE '%milestone%' OR update_type ILIKE '%achievement%' OR update_type ILIKE '%launch%';
UPDATE founder_updates SET update_type = 'annual' WHERE update_type ILIKE '%annual%' OR update_type ILIKE '%year%';
UPDATE founder_updates SET update_type = 'ad_hoc' WHERE update_type ILIKE '%ad%hoc%' OR update_type ILIKE '%unscheduled%' OR update_type ILIKE '%urgent%';
UPDATE founder_updates SET update_type = 'other' WHERE update_type IS NOT NULL AND update_type NOT IN ('monthly', 'quarterly', 'milestone', 'annual', 'ad_hoc');

-- Now convert the column to use the enum
ALTER TABLE founder_updates 
ALTER COLUMN update_type TYPE founder_update_type USING (
    CASE 
        WHEN update_type IN ('monthly', 'quarterly', 'milestone', 'annual', 'ad_hoc') 
        THEN update_type::founder_update_type
        ELSE 'other'::founder_update_type
    END
);

-- 4. Add period_end index to complement existing period_start index
CREATE INDEX IF NOT EXISTS idx_founder_updates_period_end ON founder_updates(period_end);

-- 5. Add composite index for date range queries (common pattern for timeline analysis)
CREATE INDEX IF NOT EXISTS idx_founder_updates_date_range ON founder_updates(period_start, period_end) 
WHERE period_start IS NOT NULL AND period_end IS NOT NULL;

-- 6. Add index for update_type filtering (now that it's an enum)
CREATE INDEX IF NOT EXISTS idx_founder_updates_update_type ON founder_updates(update_type);

-- Recreate the views with optimized queries

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

-- Add helpful comments for the new optimizations
COMMENT ON TYPE founder_update_type IS 'Standardized update types for founder communications to ensure consistency';

COMMENT ON CONSTRAINT check_sentiment_score_range ON founder_updates IS 
'Ensures sentiment scores stay within standard AI range (-1.000 to 1.000) for accurate analysis';

COMMENT ON INDEX idx_founder_updates_period_end IS 
'Optimizes queries filtering by update end dates and latest update retrieval';

COMMENT ON INDEX idx_founder_updates_date_range IS 
'Critical for timeline queries filtering by date ranges (period_start to period_end)';

COMMENT ON INDEX idx_founder_updates_update_type IS 
'Enables efficient filtering by update type (monthly, quarterly, milestone, etc.)';

-- Update column comments to reflect the optimizations
COMMENT ON COLUMN founder_updates.sentiment_score IS 
'AI sentiment analysis score using numeric(4,3) for precise range -1.000 to 1.000';

COMMENT ON COLUMN founder_updates.update_type IS 
'Standardized update type using enum (monthly, quarterly, milestone, annual, ad_hoc, other)';

COMMENT ON COLUMN founder_updates.period_end IS 
'End date for this update period. Indexed for efficient timeline queries and latest update retrieval'; 