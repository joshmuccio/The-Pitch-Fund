-- Add episode fields to companies table
-- Migration: 20250118000000_add_episode_fields_to_companies.sql

-- Add episode title field
ALTER TABLE companies ADD COLUMN episode_title text;

-- Add episode season field as integer (we'll use dropdown in frontend)
-- Season numbers should be reasonable (1-50)
ALTER TABLE companies ADD COLUMN episode_season integer CHECK (episode_season >= 1 AND episode_season <= 50);

-- Add episode show notes field as large text
ALTER TABLE companies ADD COLUMN episode_show_notes text;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_companies_episode_season ON companies(episode_season);
CREATE INDEX IF NOT EXISTS idx_companies_episode_title ON companies(episode_title);

-- Update the updated_at trigger to include new fields
-- The trigger should already exist for the companies table, but let's ensure it handles all fields

COMMENT ON COLUMN companies.episode_title IS 'Title of the episode extracted from thepitch.show';
COMMENT ON COLUMN companies.episode_season IS 'Season number of the episode (1-50)';
COMMENT ON COLUMN companies.episode_show_notes IS 'Show notes content extracted from the episode page'; 