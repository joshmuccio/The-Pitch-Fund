-- Simple migration to add social_commerce to industry_tag enum
-- and remove it from business_model_tag enum
-- Date: July 12, 2025

BEGIN;

-- Drop views that depend on the business_model_tags column
DROP VIEW IF EXISTS tag_analytics;
DROP VIEW IF EXISTS company_progress_timeline;

-- Drop constraints that depend on the business_model_tag type
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_business_model_tags_check;
ALTER TABLE companies DROP CONSTRAINT IF EXISTS chk_business_model_tags_valid;

-- Add social_commerce to industry_tag enum
ALTER TYPE industry_tag ADD VALUE 'social_commerce';

-- For business_model_tag, we need to recreate the enum without social_commerce
-- First, create a new enum without social_commerce
CREATE TYPE business_model_tag_new AS ENUM (
  'b2b', 'b2c', 'b2b2c', 'marketplace', 'platform', 'saas', 'paas', 'iaas',
  'subscription', 'freemium', 'pay_per_use', 'licensing', 'commission', 'transaction_fee',
  'advertising', 'affiliate', 'dropshipping', 'white_label', 'franchise', 'aggregator',
  'on_demand', 'peer_to_peer', 'api_economy', 'data_monetization', 'hardware_sales',
  'services', 'consulting', 'managed_services', 'hybrid', 'other'
);

-- Update the column to use the new enum type
ALTER TABLE companies ALTER COLUMN business_model_tags TYPE business_model_tag_new[] USING business_model_tags::text[]::business_model_tag_new[];

-- Drop the old enum and rename the new one
DROP TYPE business_model_tag;
ALTER TYPE business_model_tag_new RENAME TO business_model_tag;

-- Recreate the views
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

CREATE VIEW company_progress_timeline AS
SELECT 
  id,
  name,
  slug,
  stage_at_investment,
  industry_tags,
  business_model_tags,
  keywords,
  post_money_valuation,
  total_funding_usd,
  created_at,
  updated_at
FROM companies
ORDER BY updated_at DESC;

COMMIT; 