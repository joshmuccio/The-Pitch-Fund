-- Remove phone field from founders table and equity_percentage from company_founders table
-- Migration: 20250103000000_remove_founder_phone_and_equity.sql

-- Remove phone column from founders table
ALTER TABLE founders DROP COLUMN IF EXISTS phone;

-- Remove equity_percentage column from company_founders table
ALTER TABLE company_founders DROP COLUMN IF EXISTS equity_percentage; 