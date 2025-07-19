-- Rename investment_date to episode_publish_date in company_vcs table
-- This maintains consistency with companies table and reflects that this date
-- represents when the episode was published, not when investment was actually made

ALTER TABLE company_vcs 
RENAME COLUMN investment_date TO episode_publish_date;

-- Add comment to clarify the purpose of this field
COMMENT ON COLUMN company_vcs.episode_publish_date IS 'Date when the episode featuring this company was published. Denormalized from companies.episode_publish_date for query optimization.'; 