-- Add GIN index on co_investors for fast array queries
-- This enables efficient filtering like:
-- WHERE co_investors @> ARRAY['Andreessen Horowitz'] 
-- WHERE co_investors && ARRAY['Y Combinator', 'Sequoia Capital']
-- WHERE 'Techstars' = ANY(co_investors)
CREATE INDEX IF NOT EXISTS idx_companies_co_investors 
ON companies USING GIN(co_investors);

-- Add a comment explaining the performance benefits
COMMENT ON INDEX idx_companies_co_investors IS 
'GIN index for fast array queries on co-investors. Enables efficient filtering by investor networks for LP syndication tracking and investor relationship analysis.'; 