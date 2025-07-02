-- Add content size monitoring for embeddings to prevent large document storage issues
-- Date: 2025-01-04
-- Description: Add constraints and monitoring for content size to prevent storage of documents > 16KB

-- 1. Add a constraint to prevent content over 16KB (16,384 bytes)
ALTER TABLE embeddings 
ADD CONSTRAINT check_content_size_limit CHECK (
    content IS NULL OR length(content) <= 16384
);

-- 2. Add a computed column to track content size for monitoring
ALTER TABLE embeddings 
ADD COLUMN content_size_bytes integer GENERATED ALWAYS AS (
    CASE 
        WHEN content IS NULL THEN 0
        ELSE length(content)
    END
) STORED;

-- 3. Add an index on content size for monitoring queries
CREATE INDEX IF NOT EXISTS idx_embeddings_content_size ON embeddings(content_size_bytes);

-- 4. Create a function to check content size before insertion
CREATE OR REPLACE FUNCTION check_embedding_content_size()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if content exceeds 16KB
    IF NEW.content IS NOT NULL AND length(NEW.content) > 16384 THEN
        RAISE EXCEPTION 'Content size (% bytes) exceeds 16KB limit. Consider external storage for large documents.', 
               length(NEW.content)
        USING HINT = 'Store large documents externally and reference them via URL or ID';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger to enforce size check on insert/update
CREATE TRIGGER enforce_embedding_content_size
    BEFORE INSERT OR UPDATE ON embeddings
    FOR EACH ROW
    EXECUTE FUNCTION check_embedding_content_size();

-- 6. Create a view for monitoring content sizes
CREATE OR REPLACE VIEW embedding_size_monitor AS
SELECT 
    id,
    company_id,
    content_size_bytes,
    CASE 
        WHEN content_size_bytes = 0 THEN 'Empty'
        WHEN content_size_bytes <= 1024 THEN 'Small (≤1KB)'
        WHEN content_size_bytes <= 4096 THEN 'Medium (≤4KB)'
        WHEN content_size_bytes <= 8192 THEN 'Large (≤8KB)'
        WHEN content_size_bytes <= 16384 THEN 'Very Large (≤16KB)'
        ELSE 'OVERSIZED (>16KB)'
    END as size_category,
    ROUND(content_size_bytes / 1024.0, 2) as size_kb,
    created_at,
    updated_at
FROM embeddings
ORDER BY content_size_bytes DESC;

-- 7. Create a monitoring function for size statistics
CREATE OR REPLACE FUNCTION get_embedding_size_stats()
RETURNS TABLE (
    total_embeddings bigint,
    avg_size_bytes numeric,
    max_size_bytes integer,
    oversized_count bigint,
    size_distribution jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_embeddings,
        ROUND(AVG(content_size_bytes), 2) as avg_size_bytes,
        MAX(content_size_bytes) as max_size_bytes,
        COUNT(*) FILTER (WHERE content_size_bytes > 16384) as oversized_count,
        jsonb_build_object(
            'empty', COUNT(*) FILTER (WHERE content_size_bytes = 0),
            'small_1kb', COUNT(*) FILTER (WHERE content_size_bytes > 0 AND content_size_bytes <= 1024),
            'medium_4kb', COUNT(*) FILTER (WHERE content_size_bytes > 1024 AND content_size_bytes <= 4096),
            'large_8kb', COUNT(*) FILTER (WHERE content_size_bytes > 4096 AND content_size_bytes <= 8192),
            'very_large_16kb', COUNT(*) FILTER (WHERE content_size_bytes > 8192 AND content_size_bytes <= 16384),
            'oversized', COUNT(*) FILTER (WHERE content_size_bytes > 16384)
        ) as size_distribution
    FROM embeddings;
END;
$$ LANGUAGE plpgsql;

-- 8. Add helpful comments and documentation
COMMENT ON CONSTRAINT check_content_size_limit ON embeddings IS 
'Prevents storage of content larger than 16KB (16,384 bytes) to avoid database performance issues';

COMMENT ON COLUMN embeddings.content_size_bytes IS 
'Auto-calculated size of content in bytes. Used for monitoring and preventing large document storage';

COMMENT ON FUNCTION check_embedding_content_size() IS 
'Trigger function that validates content size before insert/update, preventing storage of documents > 16KB';

COMMENT ON VIEW embedding_size_monitor IS 
'Monitoring view for tracking embedding content sizes and identifying potential storage issues';

COMMENT ON FUNCTION get_embedding_size_stats() IS 
'Returns comprehensive statistics about embedding content sizes for monitoring and optimization';

-- 9. Create alerts for oversized content (using PostgreSQL's built-in logging)
-- This will log warnings when content approaches the limit
CREATE OR REPLACE FUNCTION log_large_content_warning()
RETURNS TRIGGER AS $$
BEGIN
    -- Log warning for content over 12KB (75% of limit)
    IF NEW.content IS NOT NULL AND length(NEW.content) > 12288 THEN
        RAISE WARNING 'Large content detected (% bytes) approaching 16KB limit for embedding ID %', 
               length(NEW.content), NEW.id
        USING HINT = 'Consider splitting content or using external storage';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger for large content warnings
CREATE TRIGGER warn_large_embedding_content
    AFTER INSERT OR UPDATE ON embeddings
    FOR EACH ROW
    EXECUTE FUNCTION log_large_content_warning();

-- 11. Update existing embeddings with size information (one-time calculation)
-- The content_size_bytes column will auto-populate for new rows
-- For existing rows, the GENERATED ALWAYS will calculate on next update

-- 12. Add RLS policy for the monitoring view (inherit from embeddings table)
ALTER VIEW embedding_size_monitor SET (security_barrier = true);

-- Create monitoring query examples as documentation
COMMENT ON TABLE embeddings IS 
'Vector embeddings for AI search. Content limited to 16KB. Use these monitoring queries:

-- Check size distribution:
SELECT * FROM get_embedding_size_stats();

-- Find large content:
SELECT * FROM embedding_size_monitor WHERE size_category = ''Very Large (≤16KB)'';

-- Monitor average sizes:
SELECT AVG(content_size_bytes) as avg_bytes, COUNT(*) as total FROM embeddings;

-- Find content approaching limit:
SELECT id, company_id, size_kb FROM embedding_size_monitor WHERE content_size_bytes > 12288;';

-- 13. Performance optimization: add partial index for large content monitoring
CREATE INDEX IF NOT EXISTS idx_embeddings_large_content ON embeddings(content_size_bytes) 
WHERE content_size_bytes > 12288; 