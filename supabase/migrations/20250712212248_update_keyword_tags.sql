-- Update keyword_tag enum values
-- Remove automation, rename ai_powered to AI, mobile_first to mobile_app, data_driven to data_play

BEGIN;

-- First, update any existing data that uses the old values
UPDATE companies 
SET keywords = array_replace(keywords, 'automation', NULL)
WHERE 'automation' = ANY(keywords);

UPDATE companies 
SET keywords = array_replace(keywords, 'ai_powered', 'AI')
WHERE 'ai_powered' = ANY(keywords);

UPDATE companies 
SET keywords = array_replace(keywords, 'mobile_first', 'mobile_app')
WHERE 'mobile_first' = ANY(keywords);

UPDATE companies 
SET keywords = array_replace(keywords, 'data_driven', 'data_play')
WHERE 'data_driven' = ANY(keywords);

-- Clean up any NULL values that might have been introduced
UPDATE companies 
SET keywords = array_remove(keywords, NULL)
WHERE keywords IS NOT NULL;

-- Drop all dependent objects
DROP VIEW IF EXISTS tag_analytics;
DROP FUNCTION IF EXISTS validate_keywords(keyword_tag[]);
DROP FUNCTION IF EXISTS get_valid_keywords();

-- Drop the keywords column temporarily
ALTER TABLE companies DROP COLUMN IF EXISTS keywords;

-- Create new enum type with updated values
CREATE TYPE keyword_tag_new AS ENUM (
  -- Growth Strategies
  'product_market_fit', 'founder_market_fit', 'minimum_viable_product', 'mvp', 'pivot', 'bootstrapped', 
  'viral_growth', 'flywheel_effect', 'lean_startup', 'network_effects', 'product_led_growth', 'sales_led_growth',
  'community_led_growth', 'growth_hacking', 'customer_acquisition_cost', 'lifetime_value', 'churn_rate',
  
  -- Technology & AI
  'AI', 'machine_learning', 'deep_learning', 'natural_language_processing', 'nlp', 'computer_vision',
  'generative_ai', 'agentic_ai', 'blockchain_based', 'cloud_native', 'edge_computing', 'api_first',
  'no_code', 'low_code', 'open_source', 'proprietary_technology', 'patent_pending', 'scalable_infrastructure',
  
  -- Data & Analytics
  'data_play', 'real_time_analytics', 'predictive_analytics', 'big_data', 'personalization', 'recommendation_engine',
  'behavioral_insights', 'user_generated_content', 'content_moderation', 'search_optimization',
  
  -- Delivery & Operations
  'mobile_app', 'web_based', 'cross_platform', 'omnichannel', 'white_glove', 'self_service', 'managed_service',
  'do_it_yourself', 'on_demand', 'subscription_based', 'freemium_model', 'pay_per_use', 'usage_based_pricing',
  
  -- Manufacturing & Physical
  '3d_printing', 'additive_manufacturing', 'supply_chain_optimization', 'inventory_management', 'logistics',
  'last_mile_delivery', 'cold_chain', 'quality_assurance', 'regulatory_compliance',
  
  -- User Experience
  'user_friendly', 'intuitive_interface', 'seamless_integration', 'single_sign_on', 'multi_tenant',
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
  SELECT 
    unnest(enum_range(NULL::keyword_tag))::TEXT as value,
    INITCAP(REPLACE(unnest(enum_range(NULL::keyword_tag))::TEXT, '_', ' ')) as label,
    COALESCE(keyword_counts.count, 0) as count
  FROM (
    SELECT 
      unnest(keywords)::TEXT as keyword,
      COUNT(*) as count
    FROM companies 
    WHERE keywords IS NOT NULL
    GROUP BY unnest(keywords)
  ) keyword_counts
  RIGHT JOIN (
    SELECT unnest(enum_range(NULL::keyword_tag))::TEXT as keyword
  ) all_keywords ON keyword_counts.keyword = all_keywords.keyword
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

COMMIT;
