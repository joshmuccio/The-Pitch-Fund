-- Optimize KPIs schema for better data integrity and performance
-- Date: 2025-01-04
-- Description: Add unique constraints, enum for units, improve indexing, and ensure data quality

-- Drop views that depend on KPI tables temporarily
DROP VIEW IF EXISTS company_progress_timeline;
DROP VIEW IF EXISTS founder_timeline_analysis;
DROP VIEW IF EXISTS founder_insights;

-- First, let's create an enum for common KPI units
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
    'ratio',         -- Decimal ratio
    'other'          -- Catch-all for custom units
);

-- Add the unique constraint for (company_id, label) to prevent duplicate KPI labels per company
ALTER TABLE kpis 
ADD CONSTRAINT unique_company_kpi_label UNIQUE (company_id, label);

-- Convert unit column from text to enum (handle existing data gracefully)
-- First, update any existing data to match enum values
UPDATE kpis SET unit = 'usd' WHERE unit ILIKE '%usd%' OR unit ILIKE '%dollar%' OR unit = '$';
UPDATE kpis SET unit = 'users' WHERE unit ILIKE '%user%' OR unit ILIKE '%subscriber%' OR unit ILIKE '%customer%';
UPDATE kpis SET unit = 'percent' WHERE unit ILIKE '%percent%' OR unit = '%' OR unit ILIKE '%rate%';
UPDATE kpis SET unit = 'count' WHERE unit ILIKE '%count%' OR unit ILIKE '%number%';
UPDATE kpis SET unit = 'months' WHERE unit ILIKE '%month%';
UPDATE kpis SET unit = 'days' WHERE unit ILIKE '%day%';
UPDATE kpis SET unit = 'other' WHERE unit IS NOT NULL AND unit NOT IN ('usd', 'users', 'percent', 'count', 'months', 'days', 'mbps', 'gb', 'requests_sec', 'score', 'ratio');

-- Now convert the column to use the enum
ALTER TABLE kpis 
ALTER COLUMN unit TYPE kpi_unit USING (
    CASE 
        WHEN unit IN ('usd', 'users', 'percent', 'count', 'months', 'days', 'mbps', 'gb', 'requests_sec', 'score', 'ratio') 
        THEN unit::kpi_unit
        ELSE 'other'::kpi_unit
    END
);

-- Add NOT NULL constraint to label (it should always be present)
ALTER TABLE kpis 
ALTER COLUMN label SET NOT NULL;

-- Add performance index for KPI lookups by company and label
CREATE INDEX IF NOT EXISTS idx_kpis_company_label ON kpis(company_id, label);

-- Add the crucial performance index for KPI values (kpi_id, period_date) for dashboard queries
-- Note: To filter by company, queries need to join kpis table: kpi_values -> kpis -> company_id
CREATE INDEX IF NOT EXISTS idx_kpi_values_kpi_period ON kpi_values(kpi_id, period_date);

-- Add index for value-based filtering (e.g., top performers)
CREATE INDEX IF NOT EXISTS idx_kpi_values_value ON kpi_values(value) WHERE value IS NOT NULL;

-- Note: kpi_values.value is already numeric(20,4) from migration 20250104000007_standardize_money_columns.sql
-- This provides proper precision/scale to avoid float vs int ambiguity in JS clients

-- Add helpful constraints for data quality
ALTER TABLE kpi_values 
ADD CONSTRAINT check_period_date_reasonable CHECK (
    period_date >= '2000-01-01' AND period_date <= (CURRENT_DATE + INTERVAL '1 year')
);

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
COMMENT ON TYPE kpi_unit IS 'Standardized units for KPI measurements to ensure consistency';

COMMENT ON CONSTRAINT unique_company_kpi_label ON kpis IS 
'Ensures each company can only have one KPI with the same label to prevent duplicates';

COMMENT ON INDEX idx_kpis_company_label IS 
'Optimizes lookups for specific KPIs within a company';

COMMENT ON INDEX idx_kpi_values_kpi_period IS 
'Critical index for dashboard queries and time-series analysis - fetches KPI data by KPI and time period (joins with kpis table for company filtering)';

COMMENT ON INDEX idx_kpi_values_value IS 
'Enables efficient filtering and sorting by KPI values (e.g., top performers)';

COMMENT ON CONSTRAINT check_period_date_reasonable ON kpi_values IS 
'Prevents obviously incorrect dates that could indicate data entry errors';

-- Update column comments to reflect the optimizations
COMMENT ON COLUMN kpis.label IS 
'KPI label/name (e.g., "Monthly Recurring Revenue", "Daily Active Users"). Must be unique per company.';

COMMENT ON COLUMN kpis.unit IS 
'Standardized unit for this KPI measurement (usd, users, percent, etc.) using enum for consistency';

COMMENT ON COLUMN kpi_values.value IS 
'KPI metric value using numeric(20,4) for precise decimal handling in JavaScript clients';

COMMENT ON COLUMN kpi_values.period_date IS 
'Date for this KPI measurement. Indexed with kpi_id for efficient dashboard queries (company filtering via kpis table join)'; 