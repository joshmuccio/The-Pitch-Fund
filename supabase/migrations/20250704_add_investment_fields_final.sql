-- 20250704_add_investment_fields_final.sql
-- ──────────────────────────────────────────
-- Add 5 missing investment fields to companies table
-- This migration runs AFTER 20250703 migrations to avoid conflicts
-- 1. round_size_usd - Full target round size in USD
-- 2. has_pro_rata_rights - Whether SAFE/Note includes pro-rata clause
-- 3. reason_for_investing - Internal memo for IC/LP letter
-- 4. country_of_incorp - ISO-3166-1 alpha-2 country code
-- 5. incorporation_type - Legal entity type at formation

-- 1. Create incorporation_type enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'incorporation_type'
  ) THEN
    CREATE TYPE incorporation_type AS ENUM (
      'c_corp',
      's_corp',
      'llc',
      'bcorp',
      'gmbh',
      'ltd',
      'plc',
      'other'
    );
  END IF;
END$$;

-- 2. Add the 5 fields if they don't exist
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS round_size_usd numeric CHECK (round_size_usd >= 0),
  ADD COLUMN IF NOT EXISTS has_pro_rata_rights boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reason_for_investing text,
  ADD COLUMN IF NOT EXISTS country_of_incorp char(2)
        CHECK (country_of_incorp ~ '^[A-Za-z]{2}$'),
  ADD COLUMN IF NOT EXISTS incorporation_type incorporation_type;

-- 3. Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_companies_round_size
  ON companies(round_size_usd);

CREATE INDEX IF NOT EXISTS idx_companies_country_of_incorp
  ON companies(country_of_incorp);

CREATE INDEX IF NOT EXISTS idx_companies_incorporation_type
  ON companies(incorporation_type);

-- 4. Add helpful comments
COMMENT ON COLUMN companies.round_size_usd        IS 'Full target round size in USD';
COMMENT ON COLUMN companies.has_pro_rata_rights   IS 'True if SAFE/Note includes pro-rata clause';
COMMENT ON COLUMN companies.reason_for_investing  IS 'Internal memo for IC / LP letter';
COMMENT ON COLUMN companies.country_of_incorp     IS 'ISO-3166-1 alpha-2 country code';
COMMENT ON COLUMN companies.incorporation_type    IS 'Legal entity type at formation'; 