-- Add episode_number column to companies table
-- This field will store the episode number (e.g., 164 for episode 164)

ALTER TABLE companies 
ADD COLUMN episode_number INTEGER;

-- Add comment to document the field
COMMENT ON COLUMN companies.episode_number IS 'The episode number from The Pitch show (e.g., 164)';

-- Update any existing records to have a default episode number if needed
-- This is commented out as we'll handle this manually if needed
-- UPDATE companies SET episode_number = 1 WHERE episode_number IS NULL; 