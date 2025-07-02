-- Standardize all money columns to numeric(20,4) for better precision and larger value support
-- This prevents overflow on large valuations and provides 4 decimal places for precise calculations

-- Drop views that depend on money columns temporarily
DROP VIEW IF EXISTS company_progress_timeline;
DROP VIEW IF EXISTS founder_timeline_analysis;
DROP VIEW IF EXISTS founder_insights;

-- Update existing decimal(15,2) columns to numeric(20,4)
ALTER TABLE companies 
ALTER COLUMN investment_amount TYPE numeric(20,4),
ALTER COLUMN post_money_valuation TYPE numeric(20,4);

-- Update existing numeric columns to have explicit precision
ALTER TABLE companies 
ALTER COLUMN annual_revenue_usd TYPE numeric(20,4),
ALTER COLUMN total_funding_usd TYPE numeric(20,4);

-- Update KPI values table for consistency
ALTER TABLE kpi_values 
ALTER COLUMN value TYPE numeric(20,4);

-- Note: sentiment_score stays as decimal(3,2) since it's a score (-1 to 1), not money

-- Recreate the views with updated column types

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

-- Update comments to reflect the standardization
COMMENT ON COLUMN companies.investment_amount IS 
'Investment amount in USD. Using numeric(20,4) to handle large amounts with 4-decimal precision.';

COMMENT ON COLUMN companies.post_money_valuation IS 
'Post-money valuation in USD. Using numeric(20,4) to handle unicorn+ valuations with precision.';

COMMENT ON COLUMN companies.annual_revenue_usd IS 
'Annual revenue in USD. Using numeric(20,4) for large enterprise revenue figures.';

COMMENT ON COLUMN companies.total_funding_usd IS 
'Total funding raised in USD. Using numeric(20,4) to handle multi-round funding totals.';

COMMENT ON COLUMN kpi_values.value IS 
'KPI metric value. Using numeric(20,4) to handle various financial metrics consistently.'; 