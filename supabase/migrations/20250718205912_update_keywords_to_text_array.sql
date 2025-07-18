-- Update keywords column from keyword_tag[] to text[] to allow dynamic keywords
-- Date: 2025-01-18
-- Reason: Enable AI-generated keywords to be added dynamically without enum constraints

BEGIN;

-- Drop dependent objects that reference the keywords column
DROP VIEW IF EXISTS tag_analytics;
DROP VIEW IF EXISTS company_progress_timeline;
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_keywords_check;
ALTER TABLE companies DROP CONSTRAINT IF EXISTS chk_keywords_valid;
DROP FUNCTION IF EXISTS validate_keywords(keyword_tag[]) CASCADE;
DROP FUNCTION IF EXISTS validate_keywords(text[]) CASCADE;
DROP FUNCTION IF EXISTS validate_keywords CASCADE;

-- Store existing keywords data temporarily
CREATE TEMP TABLE keywords_backup AS
SELECT 
  id,
  keywords::text[] as keywords_text
FROM companies 
WHERE keywords IS NOT NULL;

-- Drop the keywords column
ALTER TABLE companies DROP COLUMN IF EXISTS keywords;

-- Add new keywords column as text array (allows dynamic keywords)
ALTER TABLE companies ADD COLUMN keywords text[] DEFAULT NULL;

-- Restore existing keywords data
UPDATE companies 
SET keywords = kb.keywords_text
FROM keywords_backup kb
WHERE companies.id = kb.id;

-- Create new validation function for text array (more flexible)
CREATE OR REPLACE FUNCTION validate_keywords(keywords text[]) 
RETURNS boolean AS $$
BEGIN
  -- Allow NULL or empty arrays
  IF keywords IS NULL OR array_length(keywords, 1) IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check for reasonable array size (max 20 keywords)
  IF array_length(keywords, 1) > 20 THEN
    RETURN FALSE;
  END IF;
  
  -- Check that all keywords are non-empty strings and properly formatted
  IF EXISTS (
    SELECT 1 
    FROM unnest(keywords) AS keyword 
    WHERE keyword IS NULL 
       OR trim(keyword) = '' 
       OR length(keyword) > 100
       OR keyword ~ '[[:upper:]]' -- No uppercase letters allowed
       OR keyword ~ '^[^a-z]' -- Must start with lowercase letter
       OR keyword ~ '[^a-z0-9_]' -- Only lowercase, digits, underscores
  ) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add the validation constraint back
ALTER TABLE companies ADD CONSTRAINT companies_keywords_check 
CHECK (validate_keywords(keywords));

-- Update get_valid_keywords function to work with dynamic keywords
CREATE OR REPLACE FUNCTION get_valid_keywords()
RETURNS TABLE(value TEXT, label TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  WITH existing_enum_keywords AS (
    -- Get keywords from the original enum for backward compatibility
    SELECT unnest(enum_range(NULL::keyword_tag))::TEXT as keyword_value
  ),
  actual_keywords AS (
    -- Get all keywords actually used in the database
    SELECT 
      unnest(keywords)::TEXT as keyword,
      COUNT(*) as usage_count
    FROM companies 
    WHERE keywords IS NOT NULL
    GROUP BY unnest(keywords)
  ),
  all_keywords AS (
    -- Combine enum keywords with actual keywords
    SELECT keyword_value as keyword, 0 as usage_count FROM existing_enum_keywords
    UNION
    SELECT keyword, usage_count FROM actual_keywords
  )
  SELECT 
    ak.keyword as value,
    INITCAP(REPLACE(ak.keyword, '_', ' ')) as label,
    COALESCE(MAX(ak.usage_count), 0) as count
  FROM all_keywords ak
  GROUP BY ak.keyword
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

-- Recreate the GIN index for keywords performance
CREATE INDEX IF NOT EXISTS idx_companies_keywords_gin ON companies USING gin(keywords);

-- Add comment explaining the change
COMMENT ON COLUMN companies.keywords IS 'Dynamic keywords array - accepts both approved enum keywords and new AI-generated keywords';

-- Drop the temporary backup table
DROP TABLE keywords_backup;

COMMIT;
