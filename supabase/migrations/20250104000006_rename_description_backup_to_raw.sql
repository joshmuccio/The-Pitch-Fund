-- Rename description_backup to description_raw for clearer naming
-- This column stores the original user-input text before AI vector conversion
ALTER TABLE companies 
RENAME COLUMN description_backup TO description_raw;

-- Update the comment to reflect the new naming
COMMENT ON COLUMN companies.description_raw IS 
'Original text description as entered by users. Used as source for AI vector embeddings in the description column.'; 