-- Add apple_podcasts_url column to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS apple_podcasts_url text;

-- Add comment explaining the column's purpose
COMMENT ON COLUMN companies.apple_podcasts_url IS 'URL to the company''s Apple Podcasts page'; 