-- Remove legacy name field from founders table
-- Date: 2025-01-18
-- Reason: Founders should only use first_name and last_name fields for consistency

BEGIN;

-- Drop dependent views first
DROP VIEW IF EXISTS founder_timeline_analysis;
DROP VIEW IF EXISTS founder_insights;

-- Drop the index on the name field
DROP INDEX IF EXISTS idx_founders_name;

-- Remove the legacy name column from founders table
ALTER TABLE founders DROP COLUMN IF EXISTS name;

-- Recreate the views without the name field, using first_name and last_name instead
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

COMMIT;
