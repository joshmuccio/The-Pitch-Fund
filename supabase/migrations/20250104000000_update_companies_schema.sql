-- Migration: Update companies table schema
-- Date: 2025-01-04
-- Description: Add new columns, convert description to vector, update status field

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop dependent views first (we'll recreate them later)
DROP VIEW IF EXISTS company_progress_timeline CASCADE;
DROP VIEW IF EXISTS founder_timeline_analysis CASCADE;
DROP VIEW IF EXISTS founder_insights CASCADE;

-- Add new columns to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS annual_revenue_usd numeric CHECK (annual_revenue_usd >= 0),
ADD COLUMN IF NOT EXISTS users integer CHECK (users >= 0),
ADD COLUMN IF NOT EXISTS last_scraped_at timestamptz,
ADD COLUMN IF NOT EXISTS total_funding_usd numeric CHECK (total_funding_usd >= 0);

-- Create a temporary column for the new description_vector
ALTER TABLE companies ADD COLUMN IF NOT EXISTS description_vector vector(1536);

-- Copy existing description data to a backup column temporarily
ALTER TABLE companies ADD COLUMN IF NOT EXISTS description_backup text;
UPDATE companies SET description_backup = description WHERE description IS NOT NULL;

-- Drop the old description column
ALTER TABLE companies DROP COLUMN IF EXISTS description;

-- Rename the vector column to description
ALTER TABLE companies RENAME COLUMN description_vector TO description;

-- Drop the old status-related columns
ALTER TABLE companies DROP COLUMN IF EXISTS is_active;
ALTER TABLE companies DROP COLUMN IF EXISTS status;

-- Add the new status column with proper constraints
ALTER TABLE companies ADD COLUMN status text CHECK (status IN ('active', 'acquihired', 'exited', 'dead')) DEFAULT 'active';

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_companies_annual_revenue ON companies(annual_revenue_usd);
CREATE INDEX IF NOT EXISTS idx_companies_users ON companies(users);
CREATE INDEX IF NOT EXISTS idx_companies_last_scraped_at ON companies(last_scraped_at);
CREATE INDEX IF NOT EXISTS idx_companies_total_funding ON companies(total_funding_usd);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);

-- Add a vector similarity search index for the description embeddings
CREATE INDEX IF NOT EXISTS idx_companies_description_vector ON companies USING ivfflat (description vector_cosine_ops);

-- Update the companies policies to handle the new schema
-- (Existing policies should continue to work as they are already permissive)

-- Add a comment to track this migration
COMMENT ON TABLE companies IS 'Updated schema with revenue tracking, user metrics, status enum, and vector embeddings for AI search';

-- Restore description data to description_backup for reference
-- (This allows manual review/migration of text descriptions to vectors later)
COMMENT ON COLUMN companies.description_backup IS 'Backup of original text descriptions before vector conversion';

-- Recreate the views that were dropped (updated for new schema)
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

-- Company progress timeline view (updated to use new schema)
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