-- Fix tag_analytics view column names to match API expectations
-- Date: July 13, 2025

DROP VIEW IF EXISTS tag_analytics;

CREATE VIEW tag_analytics AS
SELECT 
  'industry' as tag_type,
  unnest(industry_tags)::text as tag_value,
  count(*) as usage_count
FROM companies 
WHERE industry_tags IS NOT NULL
GROUP BY unnest(industry_tags)
UNION ALL
SELECT 
  'business_model' as tag_type,
  unnest(business_model_tags)::text as tag_value,
  count(*) as usage_count
FROM companies 
WHERE business_model_tags IS NOT NULL
GROUP BY unnest(business_model_tags)
UNION ALL
SELECT 
  'keyword' as tag_type,
  unnest(keywords)::text as tag_value,
  count(*) as usage_count
FROM companies 
WHERE keywords IS NOT NULL
GROUP BY unnest(keywords)
ORDER BY tag_type, usage_count DESC;
