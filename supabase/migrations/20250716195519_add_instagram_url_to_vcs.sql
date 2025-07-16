-- Add instagram_url column to vcs table
ALTER TABLE vcs ADD COLUMN instagram_url text;

-- Add comment for the new column
COMMENT ON COLUMN vcs.instagram_url IS 'Instagram profile URL for the VC';
