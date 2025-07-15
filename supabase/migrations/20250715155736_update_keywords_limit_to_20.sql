-- Update keyword validation to allow up to 20 keywords instead of 15
-- Date: 2025-01-15
-- Description: Increase keyword limit from 15 to 20 to match AI generation capability

BEGIN;

-- Update the validate_keywords function to allow up to 20 keywords
CREATE OR REPLACE FUNCTION validate_keywords(keywords keyword_tag[]) 
RETURNS boolean AS $$
BEGIN
  -- Allow NULL or empty arrays
  IF keywords IS NULL OR array_length(keywords, 1) IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check for reasonable array size (max 20 tags - increased from 15)
  IF array_length(keywords, 1) > 20 THEN
    RETURN FALSE;
  END IF;
  
  -- All values should be valid enum values (automatically checked by PostgreSQL)
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add comment explaining the change
COMMENT ON FUNCTION validate_keywords(keyword_tag[]) IS 'Validates keywords array - allows up to 20 keywords to match AI generation capability';

COMMIT;
