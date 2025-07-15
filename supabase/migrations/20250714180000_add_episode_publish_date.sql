-- Migration: Add episode_publish_date column to companies table
-- Date: 2025-07-14
-- Description: Add episode_publish_date field to store the publish date of the pitch episode

-- Add episode_publish_date column to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS episode_publish_date date;

-- Add helpful comment
COMMENT ON COLUMN companies.episode_publish_date IS 
'Publish date of the pitch episode (extracted from pitch_episode_url via API)';

-- Add index for efficient querying by episode publish date
CREATE INDEX IF NOT EXISTS idx_companies_episode_publish_date 
ON companies(episode_publish_date);

-- Add migration tracking comment
COMMENT ON TABLE companies IS 
'Portfolio companies table with episode publish date for pitch episode tracking'; 