-- Add GIN index on industry_tags for fast array queries
-- This enables efficient filtering like:
-- WHERE industry_tags @> ARRAY['SaaS'] 
-- WHERE industry_tags && ARRAY['AI', 'Fintech']
-- WHERE 'SaaS' = ANY(industry_tags)
CREATE INDEX IF NOT EXISTS idx_companies_industry_tags 
ON companies USING GIN(industry_tags);

-- Add a comment explaining the performance benefits
COMMENT ON INDEX idx_companies_industry_tags IS 
'GIN index for fast array queries on industry tags. Enables efficient filtering by industry categories for portfolio directory and search features.'; 