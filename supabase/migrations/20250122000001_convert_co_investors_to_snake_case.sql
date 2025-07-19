-- Convert co_investors field to snake_case format to match keywords pattern
-- Date: 2025-01-22
-- Reason: Follow exact same snake_case pattern as keywords for database consistency

BEGIN;

-- ===== 1. UPDATE NORMALIZATION FUNCTION =====
-- Replace the Title Case normalization with snake_case normalization (like keywords)
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

-- ===== 2. UPDATE VALIDATION FUNCTION =====
-- Replace validation to enforce snake_case format (like keywords)
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

-- ===== 3. UPDATE HELPER FUNCTION =====
-- Update get_valid_co_investors to display Title Case labels (like keywords)
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

-- ===== 4. MIGRATE EXISTING DATA =====
-- Convert any existing co_investors data from Title Case to snake_case
-- First, create a backup
CREATE TEMP TABLE co_investors_migration_backup AS
SELECT 
  id,
  co_investors,
  array_length(co_investors, 1) as co_investor_count
FROM companies 
WHERE co_investors IS NOT NULL AND array_length(co_investors, 1) > 0;

-- Update existing co_investors data to snake_case format
UPDATE companies 
SET co_investors = (
  SELECT ARRAY(
    SELECT normalize_co_investor_name(unnest(co_investors))
    FROM unnest(co_investors) AS investor
  )
)
WHERE co_investors IS NOT NULL AND array_length(co_investors, 1) > 0;

-- ===== 5. UPDATE CONSTRAINT =====
-- Drop and recreate constraint to enforce new validation
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_co_investors_check;
ALTER TABLE companies ADD CONSTRAINT companies_co_investors_check 
CHECK (validate_co_investors(co_investors));

-- ===== 6. UPDATE COMMENTS =====
COMMENT ON COLUMN companies.co_investors IS 'Standardized co-investor names in snake_case format - works like keywords field, supports both existing selections and new entries for comprehensive syndication tracking';
COMMENT ON FUNCTION normalize_co_investor_name(text) IS 'Normalizes investor names to snake_case format for database consistency (like keywords)';
COMMENT ON FUNCTION validate_co_investors(text[]) IS 'Validates co_investors array: max 15 items, snake_case format, 2-100 chars each (like keywords validation)';
COMMENT ON FUNCTION get_valid_co_investors() IS 'Returns all co-investors actually used in database with usage counts for frontend selection (like get_valid_keywords)';

-- ===== 7. MIGRATION LOGGING =====
-- Log the migration results
DO $$
DECLARE
    companies_updated integer;
    total_co_investors integer;
BEGIN
    SELECT COUNT(*) INTO companies_updated 
    FROM companies 
    WHERE co_investors IS NOT NULL AND array_length(co_investors, 1) > 0;
    
    SELECT SUM(array_length(co_investors, 1)) INTO total_co_investors
    FROM companies 
    WHERE co_investors IS NOT NULL;
    
    RAISE NOTICE 'Migration completed: Updated % companies with % total co-investor entries to snake_case format', 
                 companies_updated, total_co_investors;
END $$;

COMMIT; 