-- Migration: Create Standardized Tag Taxonomy
-- Date: 2025-01-09
-- Description: Create standardized tag taxonomies for consistent portfolio filtering

-- Drop existing enum types if they exist (to handle reruns)
DROP TYPE IF EXISTS industry_tag CASCADE;
DROP TYPE IF EXISTS business_model_tag CASCADE;
DROP TYPE IF EXISTS keyword_tag CASCADE;

-- Create enum for standardized industry tags
CREATE TYPE industry_tag AS ENUM (
  -- Technology & Software
  'fintech',
  'edtech',
  'healthtech',
  'proptech',
  'insurtech',
  'legaltech',
  'hrtech',
  'martech',
  'adtech',
  'cleantech',
  'foodtech',
  'agtech',
  'regtech',
  'cybersecurity',
  'data_analytics',
  'cloud',
  'mobile',
  'gaming',
  'ar_vr',
  'iot',
  'robotics',
  'autonomous_vehicles',
  'hardware',
  'ev_tech',
  'vertical_saas',
  'agentic_ai',
  'deeptech',
  
  -- Industries
  'e_commerce',
  'retail',
  'fashion_beauty',
  'cpg',
  'food_beverage',
  'fitness',
  'wellness',
  'mental_health',
  'telemedicine',
  'biotech',
  'pharma',
  'medical_devices',
  'diagnostics',
  'digital_health',
  'consumer_goods',
  'productivity',
  'communication',
  'media_entertainment',
  'sports',
  'travel',
  'hospitality',
  'food_delivery',
  'logistics',
  'supply_chain',
  'transportation',
  'real_estate',
  'construction',
  'manufacturing',
  'energy',
  'greentech_sustainability',
  'circular_economy',
  'impact',
  'non_profit',
  'government',
  'public_sector',
  'defense',
  'space',
  'agriculture',
  'farming',
  'pets',
  'parenting',
  'seniors',
  'disability',
  'accessibility',
  'diversity',
  'inclusion',
  'gig_economy',
  'freelance',
  'remote_work',
  'future_of_work',
  
  -- Target Markets
  'smb',
  'enterprise',
  'consumer',
  'prosumer',
  'developer',
  'creator',
  'influencer',
  'small_business',
  'solopreneur',
  'freelancer',
  'remote_worker',
  'genz',
  'millennials',
  'parents',
  'students',
  'professionals',
  'healthcare_providers',
  'financial_advisors',
  'real_estate_agents',
  'restaurants',
  'retailers',
  'manufacturers',
  'logistics_providers'
);

-- Create enum for standardized business model tags (revenue models and business types only)
CREATE TYPE business_model_tag AS ENUM (
  -- Revenue Models
  'subscription',
  'saas',
  'freemium',
  'transaction_fee',
  'commission',
  'advertising',
  'sponsored_content',
  'affiliate',
  'licensing',
  'white_label',
  'franchise',
  'one_time_purchase',
  'usage_based',
  'pay_per_use',
  
  -- Business Types
  'platform',
  'marketplace',
  'social_network',
  'two_sided_marketplace',
  'multi_sided_platform',
  'aggregator',
  'peer_to_peer',
  'p2p',
  'social_commerce',
  'live_commerce',
  'group_buying',
  'subscription_commerce',
  'direct_to_consumer',
  'd2c',
  'b2b',
  'b2c',
  'b2b2c'
);

-- Create enum for descriptive keywords (delivery models and technology approaches)
CREATE TYPE keyword_tag AS ENUM (
  -- Delivery Models
  'on_demand',
  'instant_delivery',
  'scheduled_delivery',
  'pickup',
  'curbside',
  'in_store',
  'online_only',
  'omnichannel',
  'mobile_first',
  'web_based',
  'native_app',
  'progressive_web_app',
  'api_first',
  'headless',
  'no_code',
  'low_code',
  'self_service',
  'self_serve',
  'managed_service',
  'white_glove',
  'do_it_yourself',
  'do_it_for_you',
  'do_it_with_you',
  
  -- Growth Strategies & Business Characteristics
  'product_led_growth',
  'sales_led_growth',
  'community_led_growth',
  'network_effects',
  'disintermediation',
  'product_market_fit',
  'founder_market_fit',
  'minimum_viable_product',
  'pivot',
  'bootstrapped',
  'viral_growth',
  'flywheel_effect',
  'lean_startup',
  'enterprise_sales',
  
  -- Technology Approaches
  'ai_powered',
  'ai',
  'machine_learning',
  'deep_learning',
  'natural_language_processing',
  'nlp',
  'computer_vision',
  'generative_ai',
  'automation',
  'workflow_automation',
  'robotic_process_automation',
  'intelligent_automation',
  '3d_printing',
  'predictive_analytics',
  'real_time_analytics',
  'big_data',
  'personalization',
  'recommendation_engine',
  'matching_algorithm',
  'optimization',
  'integration_platform',
  'connector',
  'middleware',
  'infrastructure',
  'developer_tools',
  'api',
  'api_platform',
  'microservices',
  'serverless',
  'edge_computing',
  'distributed_system',
  'decentralized',
  'blockchain',
  'blockchain_based',
  'crypto',
  'smart_contracts',
  'tokenization',
  'nft',
  'defi',
  'web3',
  'metaverse',
  'virtual_reality',
  'augmented_reality',
  'mixed_reality',
  'spatial_computing'
);

-- Add keywords column to companies table if it doesn't exist
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS keywords text[];

-- Create validation function for industry tags
CREATE OR REPLACE FUNCTION validate_industry_tags(tags text[]) 
RETURNS boolean AS $$
BEGIN
  -- Check if all provided tags exist in the enum
  RETURN NOT EXISTS (
    SELECT 1 FROM unnest(tags) AS tag 
    WHERE tag::text NOT IN (
      SELECT enumlabel FROM pg_enum 
      WHERE enumtypid = 'industry_tag'::regtype
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Create validation function for business model tags
CREATE OR REPLACE FUNCTION validate_business_model_tags(tags text[]) 
RETURNS boolean AS $$
BEGIN
  -- Check if all provided tags exist in the enum
  RETURN NOT EXISTS (
    SELECT 1 FROM unnest(tags) AS tag 
    WHERE tag::text NOT IN (
      SELECT enumlabel FROM pg_enum 
      WHERE enumtypid = 'business_model_tag'::regtype
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Create validation function for keyword tags
CREATE OR REPLACE FUNCTION validate_keywords(tags text[]) 
RETURNS boolean AS $$
BEGIN
  -- Check if all provided tags exist in the enum
  RETURN NOT EXISTS (
    SELECT 1 FROM unnest(tags) AS tag 
    WHERE tag::text NOT IN (
      SELECT enumlabel FROM pg_enum 
      WHERE enumtypid = 'keyword_tag'::regtype
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Drop existing constraints if they exist
ALTER TABLE companies DROP CONSTRAINT IF EXISTS chk_industry_tags_valid;
ALTER TABLE companies DROP CONSTRAINT IF EXISTS chk_business_model_tags_valid;
ALTER TABLE companies DROP CONSTRAINT IF EXISTS chk_keywords_valid;

-- Add constraints to companies table to validate tags
ALTER TABLE companies 
ADD CONSTRAINT chk_industry_tags_valid 
CHECK (validate_industry_tags(industry_tags));

ALTER TABLE companies 
ADD CONSTRAINT chk_business_model_tags_valid 
CHECK (validate_business_model_tags(business_model_tags));

ALTER TABLE companies 
ADD CONSTRAINT chk_keywords_valid 
CHECK (validate_keywords(keywords));

-- Drop existing view if it exists
DROP VIEW IF EXISTS tag_analytics;

-- Create helper view for tag analytics
CREATE VIEW tag_analytics AS
SELECT 
  'industry' as tag_type,
  unnest(industry_tags) as tag_name,
  count(*) as company_count
FROM companies 
WHERE industry_tags IS NOT NULL
GROUP BY unnest(industry_tags)
UNION ALL
SELECT 
  'business_model' as tag_type,
  unnest(business_model_tags) as tag_name,
  count(*) as company_count
FROM companies 
WHERE business_model_tags IS NOT NULL
GROUP BY unnest(business_model_tags)
UNION ALL
SELECT 
  'keyword' as tag_type,
  unnest(keywords) as tag_name,
  count(*) as company_count
FROM companies 
WHERE keywords IS NOT NULL
GROUP BY unnest(keywords)
ORDER BY tag_type, company_count DESC;

-- Create helper function to get all valid tags
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

CREATE OR REPLACE FUNCTION get_valid_business_model_tags() 
RETURNS text[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT enumlabel::text 
    FROM pg_enum 
    WHERE enumtypid = 'business_model_tag'::regtype
    ORDER BY enumlabel
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_valid_keywords() 
RETURNS text[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT enumlabel::text 
    FROM pg_enum 
    WHERE enumtypid = 'keyword_tag'::regtype
    ORDER BY enumlabel
  );
END;
$$ LANGUAGE plpgsql;

-- Create index for keywords array column for efficient querying
CREATE INDEX IF NOT EXISTS idx_companies_keywords_gin ON companies USING GIN (keywords);

-- Add helpful comments
COMMENT ON TYPE industry_tag IS 'Standardized industry and technology tags for consistent portfolio categorization';
COMMENT ON TYPE business_model_tag IS 'Standardized business model tags for revenue model and business type categorization';
COMMENT ON TYPE keyword_tag IS 'Standardized keyword tags for delivery models and technology approaches';
COMMENT ON VIEW tag_analytics IS 'Analytics view showing tag usage across the portfolio';
COMMENT ON FUNCTION get_valid_industry_tags() IS 'Returns array of all valid industry tags for frontend validation';
COMMENT ON FUNCTION get_valid_business_model_tags() IS 'Returns array of all valid business model tags for frontend validation';
COMMENT ON FUNCTION get_valid_keywords() IS 'Returns array of all valid keyword tags for frontend validation';
COMMENT ON COLUMN companies.keywords IS 'Array of keyword tags describing delivery models and technology approaches'; 