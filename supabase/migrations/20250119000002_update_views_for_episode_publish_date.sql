-- Update database views to use episode_publish_date instead of investment_date
-- This follows the column rename in the company_vcs table

-- Drop existing views first since PostgreSQL can't change column names with CREATE OR REPLACE
DROP VIEW IF EXISTS vc_investments;
DROP VIEW IF EXISTS vc_portfolio_summary;
DROP VIEW IF EXISTS company_investment_summary;

-- Recreate the vc_investments view
CREATE VIEW vc_investments AS
SELECT 
    cv.id as relationship_id,
    v.id as vc_id,
    v.name as vc_name,
    v.firm_name,
    v.role_title,
    c.id as company_id,
    c.name as company_name,
    c.slug as company_slug,
    cv.episode_season,
    cv.episode_number,
    cv.episode_url,
    cv.is_invested,
    cv.investment_amount_usd,
    cv.episode_publish_date,
    cv.created_at as relationship_created_at
FROM company_vcs cv
JOIN vcs v ON cv.vc_id = v.id
JOIN companies c ON cv.company_id = c.id
WHERE cv.is_invested = true
ORDER BY cv.episode_publish_date DESC;

-- Recreate the vc_portfolio_summary view
CREATE VIEW vc_portfolio_summary AS
SELECT 
    v.id as vc_id,
    v.name as vc_name,
    v.firm_name,
    COUNT(cv.id) FILTER (WHERE cv.is_invested = true) as total_investments,
    SUM(cv.investment_amount_usd) FILTER (WHERE cv.is_invested = true) as total_invested_usd,
    MIN(cv.episode_publish_date) FILTER (WHERE cv.is_invested = true) as first_episode_publish_date,
    MAX(cv.episode_publish_date) FILTER (WHERE cv.is_invested = true) as last_episode_publish_date,
    COUNT(cv.id) as total_episode_appearances
FROM vcs v
LEFT JOIN company_vcs cv ON v.id = cv.vc_id
GROUP BY v.id, v.name, v.firm_name
ORDER BY total_invested_usd DESC NULLS LAST;

-- Recreate the company_investment_summary view
CREATE VIEW company_investment_summary AS
SELECT 
    c.id as company_id,
    c.name as company_name,
    c.slug as company_slug,
    COUNT(cv.id) FILTER (WHERE cv.is_invested = true) as total_investors,
    SUM(cv.investment_amount_usd) FILTER (WHERE cv.is_invested = true) as total_raised_from_episode_usd,
    ARRAY_AGG(v.name) FILTER (WHERE cv.is_invested = true) as investor_names,
    MIN(cv.episode_publish_date) FILTER (WHERE cv.is_invested = true) as first_episode_publish_date,
    COUNT(cv.id) as total_vcs_featured
FROM companies c
LEFT JOIN company_vcs cv ON c.id = cv.company_id
LEFT JOIN vcs v ON cv.vc_id = v.id
GROUP BY c.id, c.name, c.slug
ORDER BY total_raised_from_episode_usd DESC NULLS LAST;

-- Update the index name for consistency (PostgreSQL will automatically drop the old index when the column was renamed)
-- The new index should already exist with the new column name, but let's ensure it has a consistent name
DROP INDEX IF EXISTS idx_company_vcs_investment_date;
CREATE INDEX IF NOT EXISTS idx_company_vcs_episode_publish_date ON company_vcs(episode_publish_date); 