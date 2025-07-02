-- Optimize indexes for better performance
-- 1. Set vector storage to PLAIN to keep TOAST tidy for large embeddings
-- 2. Add BTREE index on slug for faster join performance

-- Set storage mode for vector embeddings to PLAIN
-- This prevents TOAST compression/decompression overhead for vectors >2KB
-- Vector embeddings are already dense binary data that doesn't compress well
ALTER TABLE companies 
ALTER COLUMN description SET STORAGE PLAIN;

-- Add BTREE index on slug for faster join performance
-- Even though slug has a unique constraint, a dedicated BTREE index helps with:
-- 1. JOIN operations between tables
-- 2. ORDER BY slug queries  
-- 3. Range queries and pattern matching
-- 4. Foreign key lookups in related tables
CREATE INDEX IF NOT EXISTS idx_companies_slug_btree 
ON companies USING BTREE (slug);

-- Add comments explaining the optimizations
COMMENT ON INDEX idx_companies_slug_btree IS 
'BTREE index on slug for optimized JOIN performance and range queries. Complements the unique constraint for better query planning.';

COMMENT ON COLUMN companies.description IS 
'Vector embeddings (1536 dimensions) for AI-powered semantic search. Storage set to PLAIN to avoid TOAST overhead for large vectors.'; 