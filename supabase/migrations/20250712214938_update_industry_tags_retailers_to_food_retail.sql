-- Update industry_tag enum: remove 'retailers' and add 'food_retail'
-- This migration handles the enum update and data migration

BEGIN;

-- First, update any existing data that uses 'retailers' to use 'food_retail'
UPDATE companies 
SET industry_tags = array_replace(industry_tags, 'retailers', 'food_retail')
WHERE 'retailers' = ANY(industry_tags);

-- Drop all dependent objects in the correct order
DROP VIEW IF EXISTS tag_analytics;
DROP VIEW IF EXISTS company_progress_timeline;
DROP VIEW IF EXISTS founder_timeline_analysis;
DROP VIEW IF EXISTS founder_insights;
ALTER TABLE companies DROP CONSTRAINT IF EXISTS chk_industry_tags_valid;
DROP FUNCTION IF EXISTS validate_industry_tags(text[]);
DROP FUNCTION IF EXISTS get_valid_industry_tags();

-- Drop the industry_tags column temporarily
ALTER TABLE companies DROP COLUMN IF EXISTS industry_tags;

-- Create new enum type with 'food_retail' instead of 'retailers'
CREATE TYPE industry_tag_new AS ENUM (
  -- Technology & Software
  'fintech', 'edtech', 'healthtech', 'proptech', 'insurtech', 'legaltech', 'hrtech', 'martech', 'adtech', 
  'cleantech', 'foodtech', 'agtech', 'regtech', 'cybersecurity', 'data_analytics', 'cloud', 'mobile', 
  'gaming', 'ar_vr', 'iot', 'robotics', 'autonomous_vehicles', 'hardware', 'ev_tech', 'vertical_saas', 
  'agentic_ai', 'deeptech',
  -- Industries  
  'e_commerce', 'retail', 'food_retail', 'fashion_beauty', 'cpg', 'food_beverage', 'fitness', 'wellness', 'mental_health', 
  'telemedicine', 'biotech', 'pharma', 'medical_devices', 'diagnostics', 'digital_health', 'consumer_goods', 
  'productivity', 'communication', 'media_entertainment', 'sports', 'travel', 'hospitality', 'food_delivery', 
  'logistics', 'supply_chain', 'transportation', 'real_estate', 'construction', 'manufacturing', 'energy', 
  'greentech_sustainability', 'circular_economy', 'impact', 'non_profit', 'government', 'public_sector', 
  'defense', 'space', 'agriculture', 'farming', 'pets', 'parenting', 'seniors', 'disability', 'accessibility', 
  'diversity', 'inclusion', 'gig_economy', 'freelance', 'remote_work', 'future_of_work',
  -- Target Markets
  'smb', 'enterprise', 'consumer', 'prosumer', 'developer', 'creator', 'influencer', 'small_business', 
  'solopreneur', 'freelancer', 'remote_worker', 'genz', 'millennials', 'parents', 'students', 'professionals', 
  'healthcare_providers', 'financial_advisors'
);

-- Drop the old enum type
DROP TYPE industry_tag;

-- Rename the new enum type
ALTER TYPE industry_tag_new RENAME TO industry_tag;

-- Add the industry_tags column back with the new enum type
ALTER TABLE companies ADD COLUMN industry_tags industry_tag[] DEFAULT NULL;

-- Create GIN index for industry_tags
CREATE INDEX IF NOT EXISTS idx_companies_industry_tags ON companies USING gin(industry_tags);

-- Recreate the validation function with proper type
CREATE OR REPLACE FUNCTION validate_industry_tags(tags industry_tag[]) 
RETURNS boolean AS $$
BEGIN
  -- Check if all keywords are valid enum values
  -- This is automatically enforced by the enum type
  RETURN tags IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Add the constraint back
ALTER TABLE companies ADD CONSTRAINT chk_industry_tags_valid 
CHECK (validate_industry_tags(industry_tags));

-- Recreate the get_valid_industry_tags function
CREATE OR REPLACE FUNCTION get_valid_industry_tags() 
RETURNS text[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT enumlabel::text 
    FROM pg_enum 
    WHERE enumtypid = 'industry_tag'::regtype
    ORDER BY enumlabel
  );
END;
$$ LANGUAGE plpgsql;

-- Recreate the tag_analytics view
CREATE VIEW tag_analytics AS
SELECT 
  'industry' as tag_type,
  unnest(industry_tags)::text as tag_value,
  COUNT(*) as usage_count
FROM companies 
WHERE industry_tags IS NOT NULL
GROUP BY unnest(industry_tags)

UNION ALL

SELECT 
  'business_model' as tag_type,
  unnest(business_model_tags)::text as tag_value,
  COUNT(*) as usage_count
FROM companies 
WHERE business_model_tags IS NOT NULL
GROUP BY unnest(business_model_tags)

UNION ALL

SELECT 
  'keywords' as tag_type,
  unnest(keywords)::text as tag_value,
  COUNT(*) as usage_count
FROM companies 
WHERE keywords IS NOT NULL
GROUP BY unnest(keywords)

ORDER BY tag_type, usage_count DESC;

-- Recreate the founder_timeline_analysis view
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

-- Recreate the company_progress_timeline view
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

-- Recreate the founder_insights view
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

COMMIT;
