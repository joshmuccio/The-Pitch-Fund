-- Fix overly restrictive keywords validation and enforce snake_case consistency
-- Date: 2025-01-18
-- Reason: Keywords should use snake_case format like other enum fields for consistency

BEGIN;

-- Drop the existing constraint temporarily
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_keywords_check;

-- Create a function to normalize text to snake_case format
CREATE OR REPLACE FUNCTION normalize_to_snake_case(input_text text)
RETURNS text AS $$
BEGIN
  IF input_text IS NULL OR trim(input_text) = '' THEN
    RETURN input_text;
  END IF;
  
  -- Convert to snake_case:
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

-- Create a more appropriate validation function for snake_case keywords
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
  
  -- Check that all keywords follow snake_case format
  IF EXISTS (
    SELECT 1 
    FROM unnest(keywords) AS keyword 
    WHERE keyword IS NULL 
       OR trim(keyword) = '' 
       OR length(keyword) > 100
       OR length(trim(keyword)) < 2 -- Minimum 2 characters
       OR keyword ~ '[[:upper:]]' -- No uppercase letters
       OR keyword ~ '^[^a-z]' -- Must start with lowercase letter
       OR keyword ~ '[^a-z0-9_]' -- Only lowercase letters, digits, underscores
       OR keyword ~ '__' -- No consecutive underscores
       OR keyword ~ '^_|_$' -- No leading or trailing underscores
  ) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add the constraint back with the new validation
ALTER TABLE companies ADD CONSTRAINT companies_keywords_check 
CHECK (validate_keywords(keywords));

-- Add comments explaining the functions
COMMENT ON FUNCTION normalize_to_snake_case(text) IS 'Converts text to snake_case format: lowercase letters, digits, and underscores only';
COMMENT ON FUNCTION validate_keywords(text[]) IS 'Validates keywords array: max 20 items, snake_case format, 2-100 chars each';

COMMIT;
