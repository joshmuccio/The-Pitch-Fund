-- Migration: Revert Company Stage Enum to Early-Stage Only
-- Date: 2025-01-05
-- Description: Remove series stages as The Pitch Fund only invests in early-stage companies

-- Drop views that depend on the stage_at_investment column
DROP VIEW IF EXISTS portfolio_demographics;
DROP VIEW IF EXISTS season_performance;

-- PostgreSQL doesn't allow removing enum values directly, so we need to recreate the type
-- Step 1: Create new enum with only early-stage values
CREATE TYPE company_stage_new AS ENUM ('pre_seed', 'seed');

-- Step 2: Update the companies table to use the new enum
-- First drop the default to avoid casting issues
ALTER TABLE companies 
ALTER COLUMN stage_at_investment DROP DEFAULT;

-- Then change the type
ALTER TABLE companies 
ALTER COLUMN stage_at_investment TYPE company_stage_new 
USING stage_at_investment::text::company_stage_new;

-- Set the default back to pre_seed (early-stage default)
ALTER TABLE companies 
ALTER COLUMN stage_at_investment SET DEFAULT 'pre_seed'::company_stage_new;

-- Step 3: Drop the old enum and rename the new one
DROP TYPE company_stage;
ALTER TYPE company_stage_new RENAME TO company_stage;

-- Update the comment to reflect early-stage focus
COMMENT ON TYPE company_stage IS 
'Company funding stage at time of investment: pre_seed, seed (The Pitch Fund focuses on early-stage investing)';

-- Update the comment on the companies table column
COMMENT ON COLUMN companies.stage_at_investment IS
'What stage the company was in when The Pitch Fund invested (early-stage only: pre_seed or seed)';

-- Recreate the views that were dropped
-- Portfolio demographics overview
CREATE OR REPLACE VIEW portfolio_demographics AS
SELECT 
    c.country,
    c.stage_at_investment,
    c.pitch_season,
    COUNT(DISTINCT c.id) as company_count,
    COUNT(DISTINCT f.id) as founder_count,
    COUNT(DISTINCT f.id) FILTER (WHERE f.sex = 'female') as female_founders,
    COUNT(DISTINCT f.id) FILTER (WHERE f.sex = 'male') as male_founders,
    ROUND(
        COUNT(DISTINCT f.id) FILTER (WHERE f.sex = 'female')::numeric / 
        NULLIF(COUNT(DISTINCT f.id), 0) * 100, 
        1
    ) as female_founder_percentage
FROM companies c
LEFT JOIN company_founders cf ON c.id = cf.company_id AND cf.is_active = true
LEFT JOIN founders f ON cf.founder_id = f.id
WHERE c.status = 'active'
GROUP BY c.country, c.stage_at_investment, c.pitch_season
ORDER BY c.pitch_season DESC, c.country;

-- Season performance overview
CREATE OR REPLACE VIEW season_performance AS
SELECT 
    pitch_season,
    COUNT(*) as companies_invested,
    COUNT(*) FILTER (WHERE status = 'active') as still_active,
    COUNT(*) FILTER (WHERE status = 'exited') as successful_exits,
    COUNT(*) FILTER (WHERE status = 'acquihired') as acquihires,
    COUNT(*) FILTER (WHERE status = 'dead') as failed_companies,
    AVG(investment_amount) as avg_investment,
    AVG(post_money_valuation) as avg_valuation,
    ROUND(
        COUNT(*) FILTER (WHERE status IN ('exited', 'acquihired'))::numeric / 
        COUNT(*)::numeric * 100, 
        1
    ) as success_rate_percentage
FROM companies
WHERE pitch_season IS NOT NULL
GROUP BY pitch_season
ORDER BY pitch_season DESC; 