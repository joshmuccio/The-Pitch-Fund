-- Add founder_name column to companies table
-- Date: 2025-01-18
-- Reason: Restore founder_name field for search and accessibility in Step 1 of investment wizard

BEGIN;

-- Add founder_name column to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS founder_name TEXT NULL;

-- Add comment explaining the purpose
COMMENT ON COLUMN companies.founder_name IS 'Primary founder name from Step 1 for search and quick access';

-- Create index for search performance
CREATE INDEX IF NOT EXISTS idx_companies_founder_name ON companies(founder_name);

-- Populate existing records with founder data from founders table if available
-- This attempts to fill in the founder_name for existing companies that have founder relationships
UPDATE companies 
SET founder_name = (
  SELECT f.name 
  FROM founders f
  JOIN company_founders cf ON f.id = cf.founder_id 
  WHERE cf.company_id = companies.id 
    AND f.role = 'founder'
  ORDER BY cf.created_at ASC 
  LIMIT 1
)
WHERE founder_name IS NULL 
  AND EXISTS (
    SELECT 1 
    FROM company_founders cf 
    JOIN founders f ON f.id = cf.founder_id 
    WHERE cf.company_id = companies.id 
      AND f.role = 'founder'
  );

-- If no founder with role 'founder', use the first cofounder
UPDATE companies 
SET founder_name = (
  SELECT f.name 
  FROM founders f
  JOIN company_founders cf ON f.id = cf.founder_id 
  WHERE cf.company_id = companies.id 
    AND f.role = 'cofounder'
  ORDER BY cf.created_at ASC 
  LIMIT 1
)
WHERE founder_name IS NULL 
  AND EXISTS (
    SELECT 1 
    FROM company_founders cf 
    JOIN founders f ON f.id = cf.founder_id 
    WHERE cf.company_id = companies.id 
      AND f.role = 'cofounder'
  );

COMMIT;
