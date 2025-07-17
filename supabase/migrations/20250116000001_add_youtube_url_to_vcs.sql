-- Add youtube_url column to vcs table
ALTER TABLE vcs ADD COLUMN youtube_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN vcs.youtube_url IS 'URL to the VC''s YouTube channel or profile'; 