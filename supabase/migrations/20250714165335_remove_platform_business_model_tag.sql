-- Remove platform from business_model_tag enum
-- Date: January 14, 2025
-- Reason: Platform is more of a technology architecture than a business model

BEGIN;

-- Drop views that depend on the business_model_tags column
DROP VIEW IF EXISTS tag_analytics;
DROP VIEW IF EXISTS company_progress_timeline;

-- Drop constraints that depend on the business_model_tag type
ALTER TABLE companies DROP CONSTRAINT IF EXISTS chk_business_model_tags_valid;

-- Create a new enum without platform
CREATE TYPE business_model_tag_new AS ENUM (
  -- Revenue Models
  'subscription', 'saas', 'freemium', 'transaction_fee', 'advertising', 'sponsored_content', 
  'affiliate', 'licensing', 'white_label', 'franchise', 'one_time_purchase', 'pay_per_use',
  -- Business Types (removed 'platform')
  'marketplace', 'social_network', 'two_sided_marketplace', 'multi_sided_platform', 'aggregator', 
  'peer_to_peer', 'p2p', 'live_commerce', 'group_buying', 'subscription_commerce', 
  'direct_to_consumer', 'd2c', 'b2b', 'b2c', 'b2b2c',
  -- Data & Analytics
  'data_monetization'
);

-- Update existing data to remove any "platform" tags
UPDATE companies 
SET business_model_tags = array_remove(business_model_tags, 'platform')
WHERE 'platform' = ANY(business_model_tags);

-- Update the column to use the new enum type
ALTER TABLE companies ALTER COLUMN business_model_tags TYPE business_model_tag_new[] USING business_model_tags::text[]::business_model_tag_new[];

-- Drop functions that depend on the old enum type
DROP FUNCTION IF EXISTS validate_business_model_tags(business_model_tag[]);
DROP FUNCTION IF EXISTS get_valid_business_model_tags();

-- Drop the old enum and rename the new one
DROP TYPE business_model_tag;
ALTER TYPE business_model_tag_new RENAME TO business_model_tag;

-- Recreate the validation function with proper type
CREATE OR REPLACE FUNCTION validate_business_model_tags(tags business_model_tag[]) 
RETURNS boolean AS $$
BEGIN
  -- Allow NULL or empty arrays
  IF tags IS NULL OR array_length(tags, 1) IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check for reasonable array size (max 10 tags)
  IF array_length(tags, 1) > 10 THEN
    RETURN FALSE;
  END IF;
  
  -- All values should be valid enum values (automatically checked by PostgreSQL)
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add the constraint back
ALTER TABLE companies ADD CONSTRAINT chk_business_model_tags_valid 
CHECK (validate_business_model_tags(business_model_tags));

-- Recreate the get_valid_business_model_tags function
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
  'keyword' as tag_type,
  unnest(keywords)::text as tag_value,
  COUNT(*) as usage_count
FROM companies 
WHERE keywords IS NOT NULL
GROUP BY unnest(keywords)

ORDER BY tag_type, usage_count DESC;

COMMIT;
