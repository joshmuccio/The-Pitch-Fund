-- Restore missing validation constraints that were dropped during social_commerce migration
-- Date: July 12, 2025
-- Reason: The previous migration dropped validation constraints but didn't recreate them

BEGIN;

-- First, ensure the validation functions exist and are up to date
CREATE OR REPLACE FUNCTION validate_industry_tags(tags industry_tag[]) 
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

CREATE OR REPLACE FUNCTION validate_keywords(keywords keyword_tag[]) 
RETURNS boolean AS $$
BEGIN
  -- Allow NULL or empty arrays
  IF keywords IS NULL OR array_length(keywords, 1) IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check for reasonable array size (max 15 tags)
  IF array_length(keywords, 1) > 15 THEN
    RETURN FALSE;
  END IF;
  
  -- All values should be valid enum values (automatically checked by PostgreSQL)
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Now restore the missing validation constraints (only add if they don't exist)
DO $$
BEGIN
  -- Add industry tags constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_industry_tags_valid' 
    AND conrelid = 'companies'::regclass
  ) THEN
    ALTER TABLE companies ADD CONSTRAINT chk_industry_tags_valid 
    CHECK (validate_industry_tags(industry_tags));
  END IF;

  -- Add business model tags constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_business_model_tags_valid' 
    AND conrelid = 'companies'::regclass
  ) THEN
    ALTER TABLE companies ADD CONSTRAINT chk_business_model_tags_valid 
    CHECK (validate_business_model_tags(business_model_tags));
  END IF;

  -- Add keywords constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_keywords_valid' 
    AND conrelid = 'companies'::regclass
  ) THEN
    ALTER TABLE companies ADD CONSTRAINT chk_keywords_valid 
    CHECK (validate_keywords(keywords));
  END IF;
END $$;

COMMIT; 