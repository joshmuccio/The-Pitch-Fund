-- Add wikipedia_url column to vcs table
ALTER TABLE vcs ADD COLUMN wikipedia_url text;

-- Add comment for documentation
COMMENT ON COLUMN vcs.wikipedia_url IS 'Wikipedia profile URL for the VC'; 