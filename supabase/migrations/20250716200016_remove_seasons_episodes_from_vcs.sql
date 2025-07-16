-- Remove seasons and episodes tracking from VCs table
-- These fields are being removed as they're no longer needed

-- Drop the GIN index on seasons_appeared if it exists
DROP INDEX IF EXISTS idx_vcs_seasons;

-- Drop the columns
ALTER TABLE vcs DROP COLUMN IF EXISTS seasons_appeared;
ALTER TABLE vcs DROP COLUMN IF EXISTS total_episodes_count;

-- Note: Any queries that reference these columns will need to be updated
-- in the application code to ensure compatibility.
