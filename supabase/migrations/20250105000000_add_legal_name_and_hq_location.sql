-- Migration: Add Legal Name and HQ Location Fields
-- Date: 2025-01-05
-- Description: Add legal_name and structured headquarters location fields for better search and sorting

-- Add legal_name field
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS legal_name text;

-- Add structured headquarters location fields for efficient searching and sorting
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS hq_address_line_1 text,
ADD COLUMN IF NOT EXISTS hq_address_line_2 text,
ADD COLUMN IF NOT EXISTS hq_city text,
ADD COLUMN IF NOT EXISTS hq_state text,
ADD COLUMN IF NOT EXISTS hq_zip_code text,
ADD COLUMN IF NOT EXISTS hq_country char(2);

-- Add constraint for ISO-3166-1 alpha-2 country codes
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'hq_country_iso' 
    AND table_name = 'companies'
  ) THEN
    ALTER TABLE companies
    ADD CONSTRAINT hq_country_iso CHECK (hq_country ~ '^[A-Z]{2}$');
  END IF;
END $$;

-- Add new columns to founders table for detailed founder information
ALTER TABLE founders
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS title text;

-- Create indexes for efficient city and state searching/sorting
CREATE INDEX IF NOT EXISTS idx_companies_hq_city ON companies(hq_city);
CREATE INDEX IF NOT EXISTS idx_companies_hq_state ON companies(hq_state);
CREATE INDEX IF NOT EXISTS idx_companies_hq_state_city ON companies(hq_state, hq_city);

-- Add helpful comments
COMMENT ON COLUMN companies.legal_name IS 
'Legal entity name of the company as registered with authorities';

COMMENT ON COLUMN companies.hq_address_line_1 IS 
'Primary street address of company headquarters';

COMMENT ON COLUMN companies.hq_address_line_2 IS 
'Secondary address line (suite, apartment, floor, etc.)';

COMMENT ON COLUMN companies.hq_city IS 
'City where company headquarters is located (indexed for fast searching)';

COMMENT ON COLUMN companies.hq_state IS 
'State/province where company headquarters is located (indexed for fast searching)';

COMMENT ON COLUMN companies.hq_zip_code IS 
'Postal/ZIP code of company headquarters';

COMMENT ON COLUMN companies.hq_country IS 
'Country where company headquarters is located (use ISO-3166-1 alpha-2 codes like US, CA, GB)';

-- Add helpful comments for founders table
COMMENT ON COLUMN founders.first_name IS 
'Founder first name for detailed contact information';

COMMENT ON COLUMN founders.last_name IS 
'Founder last name for detailed contact information';

COMMENT ON COLUMN founders.title IS 
'Founder title/position (e.g. CEO, CTO, Co-founder, etc.)';

-- Add migration tracking comment
COMMENT ON TABLE companies IS 
'Portfolio companies table with legal name and structured headquarters location for efficient geographical search and sorting';

-- Usage examples in comments:
/*
USAGE EXAMPLES:

1. Search by city:
   SELECT * FROM companies WHERE hq_city = 'San Francisco';

2. Filter by state:
   SELECT * FROM companies WHERE hq_state = 'CA';

3. Sort by location:
   SELECT * FROM companies ORDER BY hq_state, hq_city;

4. Companies in specific metro areas:
   SELECT * FROM companies 
   WHERE hq_city IN ('San Francisco', 'Palo Alto', 'Mountain View', 'San Jose')
   AND hq_state = 'CA';

5. Portfolio distribution by state:
   SELECT hq_state, COUNT(*) as company_count 
   FROM companies 
   WHERE hq_state IS NOT NULL 
   GROUP BY hq_state 
   ORDER BY company_count DESC;

6. Portfolio distribution by city:
   SELECT hq_city, hq_state, COUNT(*) as company_count 
   FROM companies 
   WHERE hq_city IS NOT NULL 
   GROUP BY hq_city, hq_state 
   ORDER BY company_count DESC;

7. Find companies with different legal vs. display names:
   SELECT name, legal_name 
   FROM companies 
   WHERE legal_name IS NOT NULL 
   AND legal_name != name;

8. Get all founders for a company (supports multiple founders):
   SELECT 
     c.name as company_name,
     f.first_name,
     f.last_name,
     f.title,
     f.email,
     cf.role as role_at_company
   FROM companies c
   JOIN company_founders cf ON c.id = cf.company_id
   JOIN founders f ON cf.founder_id = f.id
   WHERE c.slug = 'company-slug' AND cf.is_active = true;

9. Find all companies founded by a specific founder:
   SELECT 
     c.name as company_name,
     c.slug,
     cf.role as founder_role,
     f.first_name,
     f.last_name,
     f.title
   FROM founders f
   JOIN company_founders cf ON f.id = cf.founder_id
   JOIN companies c ON cf.company_id = c.id
   WHERE f.email = 'founder@email.com' AND cf.is_active = true;

10. Count founders per company:
    SELECT 
      c.name,
      COUNT(cf.founder_id) as founder_count
    FROM companies c
    LEFT JOIN company_founders cf ON c.id = cf.company_id AND cf.is_active = true
    GROUP BY c.id, c.name
    ORDER BY founder_count DESC;
*/ 