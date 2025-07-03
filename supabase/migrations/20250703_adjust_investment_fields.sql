/* ───────────────── ENUMS ───────────────── */
-- 1. Trimmed instrument list
DROP TYPE IF EXISTS investment_instrument CASCADE;

CREATE TYPE investment_instrument AS ENUM (
  'safe_post',        -- SAFE (Post-Money)
  'safe_pre',         -- SAFE (Pre-Money)
  'convertible_note', -- Convertible Note
  'equity'            -- Priced Equity
);

/* ───────────────── TABLE CHANGES ───────────────── */
-- Remove no-longer-used columns
ALTER TABLE companies
  DROP COLUMN IF EXISTS round,               -- stage enum removed
  DROP COLUMN IF EXISTS has_warrants,
  DROP COLUMN IF EXISTS thesis_match,
  DROP COLUMN IF EXISTS type_of_fundraise;

-- Replace / keep only the fields we still need
ALTER TABLE companies
  -- instrument is NOW mandatory & uses reduced enum
  ADD COLUMN IF NOT EXISTS instrument investment_instrument NOT NULL DEFAULT 'safe_post',

  -- conditional fields (safe / note only)
  ADD COLUMN IF NOT EXISTS conversion_cap_usd numeric CHECK (conversion_cap_usd >= 0),
  ADD COLUMN IF NOT EXISTS discount_percent  numeric CHECK (discount_percent >= 0 AND discount_percent <= 100);

-- Equity-only valuation already exists — allow NULL for non-equity
ALTER TABLE companies ALTER COLUMN post_money_valuation DROP NOT NULL;

-- Create a guard so values don't collide
ALTER TABLE companies ADD CONSTRAINT companies_instrument_guard CHECK (
    (
      instrument IN ('safe_post','safe_pre','convertible_note')
      AND post_money_valuation IS NULL                      -- no PMV in SAFEs / notes
    ) OR (
      instrument = 'equity'
      AND conversion_cap_usd IS NULL
      AND discount_percent IS NULL
    )
);

/* If you created the now-obsolete round_stage enum earlier: */
DROP TYPE IF EXISTS round_stage;

/* ───────────────── HOUSEKEEPING ───────────────── */
-- refresh RLS and indexes only if you removed round_stage index earlier
DROP INDEX IF EXISTS idx_companies_round_stage_instrument;
CREATE INDEX IF NOT EXISTS idx_companies_instrument
  ON companies (instrument); 