-- Migration: Cleanup Best Practices
-- 1. Standardize numeric vs decimal terminology in comments
-- 2. Add UTC timezone utilities and documentation

-- ===== TERMINOLOGY CLEANUP =====

-- Update KPI unit enum comment to use "numeric" consistently
COMMENT ON TYPE kpi_unit IS 'Standardized units for KPI metrics using numeric data types';

-- Update ratio comment to be more specific
-- (Note: The enum value 'ratio' stays the same for backward compatibility, but we clarify the comment)
ALTER TYPE kpi_unit ADD VALUE IF NOT EXISTS 'percentage_decimal';  -- For values like 0.25 = 25%
COMMENT ON TYPE kpi_unit IS 'Standardized KPI units. Use numeric data types for all values. Examples: ratio (0.25 = 25%), percentage_decimal (25.5), score (1-10 scale)';

-- ===== UTC TIMEZONE UTILITIES =====

-- Create utility function to ensure UTC storage for scraped data
CREATE OR REPLACE FUNCTION ensure_utc_timestamp(input_timestamp timestamptz)
RETURNS timestamptz
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    -- Convert any timezone to UTC for consistent storage
    RETURN input_timestamp AT TIME ZONE 'UTC';
END;
$$;

-- Create utility function for common UTC operations
CREATE OR REPLACE FUNCTION utc_now()
RETURNS timestamptz
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT now() AT TIME ZONE 'UTC';
$$;

-- Create helper function for data ingestion
CREATE OR REPLACE FUNCTION safe_parse_timestamp(
    input_text text,
    fallback_timezone text DEFAULT 'UTC'
)
RETURNS timestamptz
LANGUAGE plpgsql
AS $$
DECLARE
    result timestamptz;
BEGIN
    -- Try to parse the timestamp string
    BEGIN
        -- If input has timezone info, use it directly
        result := input_text::timestamptz;
    EXCEPTION WHEN OTHERS THEN
        -- If no timezone info, assume the fallback timezone
        BEGIN
            result := (input_text::timestamp AT TIME ZONE fallback_timezone);
        EXCEPTION WHEN OTHERS THEN
            -- If parsing fails completely, return NULL
            RETURN NULL;
        END;
    END;
    
    -- Always store in UTC
    RETURN result AT TIME ZONE 'UTC';
END;
$$;

-- ===== ENHANCED COMMENTS FOR BEST PRACTICES =====

-- Add comprehensive timezone documentation
COMMENT ON COLUMN companies.last_scraped_at IS 'UTC timestamp of last data scraping. Always store scraped data timestamps in UTC using ensure_utc_timestamp() function.';

COMMENT ON COLUMN companies.investment_date IS 'Investment date (date only, timezone-agnostic). For precise investment timestamps, use timestamptz and store in UTC.';

COMMENT ON COLUMN companies.created_at IS 'Record creation timestamp in UTC. Automatically set by database.';
COMMENT ON COLUMN companies.updated_at IS 'Record last modification timestamp in UTC. Automatically updated by trigger.';

-- Add function documentation
COMMENT ON FUNCTION ensure_utc_timestamp(timestamptz) IS 'Utility: Convert any timestamptz to UTC for consistent storage. Use when ingesting external data with unknown timezones.';

COMMENT ON FUNCTION utc_now() IS 'Utility: Get current UTC timestamp. Prefer this over now() for explicit UTC handling in application code.';

COMMENT ON FUNCTION safe_parse_timestamp(text, text) IS 'Utility: Safely parse timestamp strings from external sources. Handles timezone conversion and defaults to UTC storage. Returns NULL for invalid inputs.';

-- ===== BEST PRACTICES DOCUMENTATION =====

-- Create a view that documents timezone best practices
CREATE OR REPLACE VIEW timezone_best_practices AS
SELECT 
    'UTC Storage' as practice,
    'Always store timestamptz in UTC for consistency' as description,
    'Use ensure_utc_timestamp() when ingesting external data' as implementation
UNION ALL
SELECT 
    'Data Ingestion',
    'Convert all external timestamps to UTC before storage',
    'Use safe_parse_timestamp() for robust parsing of external data'
UNION ALL
SELECT 
    'Application Code',
    'Handle timezone conversion in application layer, not database',
    'Use utc_now() for explicit UTC timestamps in business logic'
UNION ALL
SELECT 
    'Numeric Consistency',
    'Use numeric(precision,scale) for all decimal numbers',
    'Avoid DECIMAL keyword, prefer NUMERIC for PostgreSQL best practices';

-- ===== USAGE EXAMPLES IN COMMENTS =====

-- Example usage documentation
/* 
TIMEZONE BEST PRACTICES EXAMPLES:

1. Ingesting scraped data:
   UPDATE companies 
   SET last_scraped_at = ensure_utc_timestamp(scraped_timestamp_from_api)
   WHERE id = company_id;

2. Parsing external timestamps:
   INSERT INTO founder_updates (period_start, created_at) 
   VALUES (
     safe_parse_timestamp('2024-01-15 14:30:00', 'America/New_York'),
     utc_now()
   );

3. Application queries (Next.js example):
   // In your API routes, always work with UTC
   const companies = await supabase
     .from('companies')
     .select('name, last_scraped_at')
     .gte('last_scraped_at', new Date().toISOString()); // ISO string is UTC

NUMERIC BEST PRACTICES:
- ✅ numeric(20,4) for money amounts  
- ✅ numeric(4,3) for sentiment scores (-1.000 to 1.000)
- ✅ numeric(5,2) for percentages (0.00 to 100.00)
- ❌ DECIMAL - use numeric instead for PostgreSQL consistency
*/
