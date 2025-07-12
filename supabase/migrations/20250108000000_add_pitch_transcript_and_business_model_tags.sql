-- Migration: Add pitch transcript and business model tags fields
-- Date: 2025-01-08
-- Description: Add pitch_transcript field for storing episode transcripts and business_model_tags array for AI-generated business model categorization

-- Add pitch_transcript field to store episode transcripts (up to ~10k words)
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS pitch_transcript text;

-- Add business_model_tags field as text array for AI-generated business model categorization
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS business_model_tags text[];

-- Create index for business model tags using GIN for array operations
CREATE INDEX IF NOT EXISTS idx_companies_business_model_tags 
ON companies USING GIN(business_model_tags);

-- Add helpful comments
COMMENT ON COLUMN companies.pitch_transcript IS 
'Full transcript of the pitch episode where the company was featured. Used for AI-powered field generation.';

COMMENT ON COLUMN companies.business_model_tags IS 
'AI-generated business model categorization tags (e.g., B2B, SaaS, Marketplace, Subscription, etc.)';

-- Add migration tracking comment
COMMENT ON TABLE companies IS 
'Portfolio companies table with pitch transcript and business model tags for AI-powered form field generation'; 