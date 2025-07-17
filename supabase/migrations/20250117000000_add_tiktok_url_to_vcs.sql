-- Add tiktok_url column to vcs table
ALTER TABLE vcs ADD COLUMN tiktok_url text;

-- Add comment for documentation
COMMENT ON COLUMN vcs.tiktok_url IS 'TikTok profile URL for the VC'; 