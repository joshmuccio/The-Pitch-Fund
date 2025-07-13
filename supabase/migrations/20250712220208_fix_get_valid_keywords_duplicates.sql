-- Fix get_valid_keywords function to eliminate duplicates
-- The issue was calling unnest(enum_range()) multiple times causing a Cartesian product

BEGIN;

-- Drop and recreate the get_valid_keywords function with proper logic
DROP FUNCTION IF EXISTS get_valid_keywords();

CREATE OR REPLACE FUNCTION get_valid_keywords()
RETURNS TABLE(value TEXT, label TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  WITH all_enum_values AS (
    SELECT unnest(enum_range(NULL::keyword_tag))::TEXT as keyword_value
  ),
  usage_counts AS (
    SELECT 
      unnest(keywords)::TEXT as keyword,
      COUNT(*) as usage_count
    FROM companies 
    WHERE keywords IS NOT NULL
    GROUP BY unnest(keywords)
  )
  SELECT 
    aev.keyword_value as value,
    INITCAP(REPLACE(aev.keyword_value, '_', ' ')) as label,
    COALESCE(uc.usage_count, 0) as count
  FROM all_enum_values aev
  LEFT JOIN usage_counts uc ON aev.keyword_value = uc.keyword
  ORDER BY count DESC, value ASC;
END;
$$ LANGUAGE plpgsql;

COMMIT;
