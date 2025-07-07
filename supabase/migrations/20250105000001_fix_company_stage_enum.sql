-- Migration: Fix Company Stage Enum
-- Date: 2025-01-05
-- Description: Add missing series stages to company_stage enum to match form schema

-- Add the missing values to the company_stage enum
ALTER TYPE company_stage ADD VALUE 'series_a';
ALTER TYPE company_stage ADD VALUE 'series_b'; 
ALTER TYPE company_stage ADD VALUE 'series_c';

-- Add comment explaining the complete enum
COMMENT ON TYPE company_stage IS 
'Company funding stage at time of investment: pre_seed, seed, series_a, series_b, series_c';

-- Update the comment on the companies table column
COMMENT ON COLUMN companies.stage_at_investment IS
'What stage the company was in when The Pitch Fund invested (supports pre_seed through series_c)'; 