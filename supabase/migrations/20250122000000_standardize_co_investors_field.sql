-- Standardize co_investors field to work like keywords - support existing values and new entries
-- Date: 2025-01-22
-- Reason: Enable standardized co-investor tracking with dynamic entry capability like keywords field

BEGIN;

-- ===== 1. BACKUP EXISTING DATA =====
-- Store existing co_investors data temporarily for migration
CREATE TEMP TABLE co_investors_backup AS
SELECT 
  id,
  co_investors
FROM companies 
WHERE co_investors IS NOT NULL AND array_length(co_investors, 1) > 0;

-- ===== 2. CREATE NORMALIZATION FUNCTIONS =====
-- Function to normalize investor names to snake_case format (exactly like keywords)
CREATE OR REPLACE FUNCTION normalize_co_investor_name(input_text text)
RETURNS text AS $$
BEGIN
  IF input_text IS NULL OR trim(input_text) = '' THEN
    RETURN input_text;
  END IF;
  
  -- Convert to snake_case (same logic as keywords):
  -- 1. Convert to lowercase
  -- 2. Replace spaces and hyphens with underscores
  -- 3. Remove any characters that aren't letters, digits, or underscores
  -- 4. Replace multiple underscores with single underscore
  -- 5. Remove leading/trailing underscores
  RETURN trim(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            lower(trim(input_text)), 
            '[[:space:]\-]+', '_', 'g'  -- Replace spaces and hyphens with underscores
          ),
          '[^a-z0-9_]', '', 'g'         -- Remove any character that isn't lowercase letter, digit, or underscore
        ),
        '_+', '_', 'g'                  -- Replace multiple underscores with single underscore
      ),
      '^_+|_+$', '', 'g'               -- Remove leading and trailing underscores
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ===== 3. CREATE VALIDATION FUNCTION =====
-- Validation function for co_investors array (exactly like keywords validation)
CREATE OR REPLACE FUNCTION validate_co_investors(co_investors text[]) 
RETURNS boolean AS $$
BEGIN
  -- Allow NULL or empty arrays
  IF co_investors IS NULL OR array_length(co_investors, 1) IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check for reasonable array size (max 15 co-investors)
  IF array_length(co_investors, 1) > 15 THEN
    RETURN FALSE;
  END IF;
  
  -- Check that all co-investors follow snake_case format (like keywords)
  IF EXISTS (
    SELECT 1 
    FROM unnest(co_investors) AS investor 
    WHERE investor IS NULL 
       OR trim(investor) = '' 
       OR length(investor) > 100
       OR length(trim(investor)) < 2 -- Minimum 2 characters
       OR investor ~ '[[:upper:]]' -- No uppercase letters
       OR investor ~ '^[^a-z]' -- Must start with lowercase letter
       OR investor ~ '[^a-z0-9_]' -- Only lowercase letters, digits, underscores
       OR investor ~ '__' -- No consecutive underscores
       OR investor ~ '^_|_$' -- No leading or trailing underscores
  ) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ===== 4. CREATE HELPER FUNCTIONS =====
-- Function to get all valid co-investors (existing values used in database)
CREATE OR REPLACE FUNCTION get_valid_co_investors()
RETURNS TABLE(value TEXT, label TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  WITH actual_investors AS (
    -- Get all co-investors actually used in the database
    SELECT 
      unnest(co_investors)::TEXT as investor,
      COUNT(*) as usage_count
    FROM companies 
    WHERE co_investors IS NOT NULL
    GROUP BY unnest(co_investors)
  )
  SELECT 
    ai.investor as value,
    INITCAP(REPLACE(ai.investor, '_', ' ')) as label,  -- Display as Title Case (like keywords)
    ai.usage_count as count
  FROM actual_investors ai
  ORDER BY count DESC, value ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to suggest co-investor standardization based on existing values
CREATE OR REPLACE FUNCTION suggest_co_investor_standardization(input_name text)
RETURNS text AS $$
DECLARE
  normalized_input text;
  existing_values text[];
  closest_match text;
BEGIN
  -- Normalize the input to snake_case
  normalized_input := normalize_co_investor_name(input_name);
  
  -- Get all existing co-investor values
  SELECT ARRAY(
    SELECT DISTINCT unnest(co_investors)
    FROM companies 
    WHERE co_investors IS NOT NULL
  ) INTO existing_values;
  
  -- Look for exact matches first
  SELECT ev INTO closest_match
  FROM unnest(existing_values) ev
  WHERE ev = normalized_input
  LIMIT 1;
  
  -- If no exact match, try partial matching
  IF closest_match IS NULL THEN
    SELECT ev INTO closest_match
    FROM unnest(existing_values) ev
    WHERE ev LIKE '%' || normalized_input || '%' 
       OR normalized_input LIKE '%' || ev || '%'
    ORDER BY length(ev) ASC -- Prefer shorter matches
    LIMIT 1;
  END IF;
  
  RETURN COALESCE(closest_match, normalized_input);
END;
$$ LANGUAGE plpgsql;

-- ===== 5. ADD VALIDATION CONSTRAINT =====
-- Add validation constraint to co_investors column
ALTER TABLE companies ADD CONSTRAINT companies_co_investors_check 
CHECK (validate_co_investors(co_investors));

-- ===== 6. CREATE ANALYTICS VIEWS =====
-- View for co-investor analytics
CREATE OR REPLACE VIEW co_investor_analytics AS
SELECT 
  investor,
  COUNT(*) as portfolio_companies,
  COUNT(*) * 100.0 / (SELECT COUNT(*) FROM companies WHERE co_investors IS NOT NULL) as portfolio_percentage,
  ARRAY_AGG(DISTINCT c.name ORDER BY c.name) as company_names,
  ARRAY_AGG(DISTINCT c.industry_tags) FILTER (WHERE c.industry_tags IS NOT NULL) as industries_invested,
  MIN(c.investment_date) as earliest_investment,
  MAX(c.investment_date) as latest_investment,
  AVG(c.investment_amount) as avg_round_size,
  SUM(c.investment_amount) as total_invested_with_pitch_fund
FROM companies c
CROSS JOIN LATERAL unnest(c.co_investors) as investor
WHERE c.co_investors IS NOT NULL
GROUP BY investor
ORDER BY portfolio_companies DESC;

-- View for syndication opportunities (companies with shared co-investors)
CREATE OR REPLACE VIEW syndication_opportunities AS
SELECT 
  c1.name as company1,
  c1.slug as company1_slug,
  c2.name as company2,
  c2.slug as company2_slug,
  array_length(
    array(
      SELECT unnest(c1.co_investors) 
      INTERSECT 
      SELECT unnest(c2.co_investors)
    ), 1
  ) as shared_investors_count,
  array(
    SELECT unnest(c1.co_investors) 
    INTERSECT 
    SELECT unnest(c2.co_investors)
  ) as shared_investors
FROM companies c1
CROSS JOIN companies c2
WHERE c1.id < c2.id 
  AND c1.co_investors IS NOT NULL 
  AND c2.co_investors IS NOT NULL
  AND c1.co_investors && c2.co_investors
  AND array_length(
    array(
      SELECT unnest(c1.co_investors) 
      INTERSECT 
      SELECT unnest(c2.co_investors)
    ), 1
  ) > 0
ORDER BY shared_investors_count DESC;

-- Update the existing tag_analytics view to include co_investors
DROP VIEW IF EXISTS tag_analytics;
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

UNION ALL

SELECT 
  'co_investors' as tag_type,
  unnest(co_investors)::text as tag_value,
  COUNT(*) as usage_count
FROM companies 
WHERE co_investors IS NOT NULL
GROUP BY unnest(co_investors)

ORDER BY tag_type, usage_count DESC;

-- ===== 7. UPDATE COLUMN COMMENT =====
COMMENT ON COLUMN companies.co_investors IS 'Standardized co-investor names in snake_case format - works like keywords field, supports both existing selections and new entries for comprehensive syndication tracking';

-- ===== 8. ADD FUNCTION COMMENTS =====
COMMENT ON FUNCTION normalize_co_investor_name(text) IS 'Normalizes investor names to snake_case format for database consistency (like keywords)';
COMMENT ON FUNCTION validate_co_investors(text[]) IS 'Validates co_investors array: max 15 items, snake_case format, 2-100 chars each (like keywords validation)';
COMMENT ON FUNCTION get_valid_co_investors() IS 'Returns all co-investors actually used in database with usage counts for frontend selection (like get_valid_keywords)';
COMMENT ON FUNCTION suggest_co_investor_standardization(text) IS 'Suggests standardized co-investor names based on existing database entries';

-- ===== 9. VIEW COMMENTS =====
COMMENT ON VIEW co_investor_analytics IS 'Analytics view showing portfolio distribution and investment patterns by co-investor';
COMMENT ON VIEW syndication_opportunities IS 'Identifies companies with shared co-investors for syndication and network analysis';

COMMIT; 