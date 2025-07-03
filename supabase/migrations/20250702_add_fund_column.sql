-- Migration: Add fund column to companies table
-- Date: 2025-07-02
-- Description: Add fund_number enum and fund column to track which Pitch Fund vehicle made each investment

-- ────────────────────────────────────────────
-- 1. ENUM renamed to fund_number
-- ────────────────────────────────────────────
CREATE TYPE fund_number AS ENUM ('fund_i','fund_ii','fund_iii');

-- ────────────────────────────────────────────
-- 2. Add column to companies
-- ────────────────────────────────────────────
ALTER TABLE companies
ADD COLUMN fund fund_number NOT NULL DEFAULT 'fund_i';

-- handy index for queries
CREATE INDEX IF NOT EXISTS idx_companies_fund ON companies(fund);

COMMENT ON COLUMN companies.fund IS
  'Which Pitch Fund vehicle made the investment (enum)'; 