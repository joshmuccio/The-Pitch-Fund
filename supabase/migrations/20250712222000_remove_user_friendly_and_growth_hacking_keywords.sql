-- Remove unwanted keywords from keyword_tag enum
-- Date: July 12, 2025
-- Reason: User preference - removing these keywords from the taxonomy
-- Removing: user_friendly, growth_hacking, seamless_integration, real_time_analytics, behavioral_insights

BEGIN;

-- First, update any existing data that uses these keywords (remove them from company records)
UPDATE companies 
SET keywords = array_remove(keywords, 'user_friendly')
WHERE 'user_friendly' = ANY(keywords);

UPDATE companies 
SET keywords = array_remove(keywords, 'growth_hacking')
WHERE 'growth_hacking' = ANY(keywords);

UPDATE companies 
SET keywords = array_remove(keywords, 'seamless_integration')
WHERE 'seamless_integration' = ANY(keywords);

UPDATE companies 
SET keywords = array_remove(keywords, 'real_time_analytics')
WHERE 'real_time_analytics' = ANY(keywords);

UPDATE companies 
SET keywords = array_remove(keywords, 'behavioral_insights')
WHERE 'behavioral_insights' = ANY(keywords);

-- Clean up any empty arrays that might result
UPDATE companies 
SET keywords = NULL
WHERE keywords = '{}';

-- Drop all dependent objects
DROP VIEW IF EXISTS tag_analytics;
DROP VIEW IF EXISTS company_progress_timeline;
-- Drop constraint first, then function
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_keywords_check;
DROP FUNCTION IF EXISTS validate_keywords(keyword_tag[]);
DROP FUNCTION IF EXISTS get_valid_keywords();

-- Drop the keywords column temporarily
ALTER TABLE companies DROP COLUMN IF EXISTS keywords;

-- Create new enum type without the unwanted keywords
CREATE TYPE keyword_tag_new AS ENUM (
  -- Growth Strategies (removed 'growth_hacking')
  'product_market_fit', 'founder_market_fit', 'minimum_viable_product', 'mvp', 'pivot', 'bootstrapped', 
  'viral_growth', 'flywheel_effect', 'lean_startup', 'network_effects', 'product_led_growth', 'sales_led_growth',
  'community_led_growth', 'customer_acquisition_cost', 'lifetime_value', 'churn_rate',
  
  -- Technology & AI
  'AI', 'machine_learning', 'deep_learning', 'natural_language_processing', 'nlp', 'computer_vision',
  'generative_ai', 'agentic_ai', 'blockchain_based', 'cloud_native', 'edge_computing', 'api_first',
  'no_code', 'low_code', 'open_source', 'proprietary_technology', 'patent_pending', 'scalable_infrastructure',
  
  -- Data & Analytics (removed 'real_time_analytics', 'behavioral_insights')
  'data_play', 'predictive_analytics', 'big_data', 'personalization', 'recommendation_engine',
  'user_generated_content', 'content_moderation', 'search_optimization',
  
  -- Delivery & Operations
  'mobile_app', 'web_based', 'cross_platform', 'omnichannel', 'white_glove', 'self_service', 'managed_service',
  'do_it_yourself', 'on_demand', 'subscription_based', 'freemium_model', 'pay_per_use', 'usage_based_pricing',
  
  -- Manufacturing & Physical
  '3d_printing', 'additive_manufacturing', 'supply_chain_optimization', 'inventory_management', 'logistics',
  'last_mile_delivery', 'cold_chain', 'quality_assurance', 'regulatory_compliance',
  
  -- User Experience (removed 'user_friendly', 'seamless_integration')
  'intuitive_interface', 'single_sign_on', 'multi_tenant',
  'white_label', 'customizable', 'configurable', 'plug_and_play', 'turnkey_solution'
);

-- Drop the old enum type
DROP TYPE keyword_tag;

-- Rename the new enum type
ALTER TYPE keyword_tag_new RENAME TO keyword_tag;

-- Add the keywords column back with the new enum type
ALTER TABLE companies ADD COLUMN keywords keyword_tag[] DEFAULT NULL;

-- Create GIN index for keywords
CREATE INDEX IF NOT EXISTS idx_companies_keywords_gin ON companies USING gin(keywords);

-- Recreate the validation function
CREATE OR REPLACE FUNCTION validate_keywords(keywords keyword_tag[])
RETURNS boolean AS $$
BEGIN
  -- Check if all keywords are valid enum values
  -- This is automatically enforced by the enum type
  RETURN keywords IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Add the constraint back
ALTER TABLE companies ADD CONSTRAINT companies_keywords_check 
CHECK (validate_keywords(keywords));

-- Recreate the get_valid_keywords function
CREATE OR REPLACE FUNCTION get_valid_keywords()
RETURNS TABLE(value TEXT, label TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  WITH all_enum_values AS (
    SELECT unnest(enum_range(NULL::keyword_tag))::TEXT as keyword_value
  ),
  usage_counts AS (
    SELECT 
      unnest(keywords)::TEXT as keyword,
      COUNT(*) as usage_count
    FROM companies 
    WHERE keywords IS NOT NULL
    GROUP BY unnest(keywords)
  )
  SELECT 
    aev.keyword_value as value,
    INITCAP(REPLACE(aev.keyword_value, '_', ' ')) as label,
    COALESCE(uc.usage_count, 0) as count
  FROM all_enum_values aev
  LEFT JOIN usage_counts uc ON aev.keyword_value = uc.keyword
  ORDER BY count DESC, value ASC;
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

COMMIT; 