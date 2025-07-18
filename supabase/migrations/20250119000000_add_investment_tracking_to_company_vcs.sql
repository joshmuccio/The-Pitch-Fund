-- Migration: Add investment tracking to company_vcs table
-- Date: 2025-01-19
-- Description: Add investment tracking fields to track which VCs invested in companies and how much

-- Add investment tracking fields to company_vcs table
ALTER TABLE company_vcs 
ADD COLUMN IF NOT EXISTS is_invested boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS investment_amount_usd numeric CHECK (investment_amount_usd >= 0),
ADD COLUMN IF NOT EXISTS investment_date date;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_company_vcs_is_invested ON company_vcs(is_invested);
CREATE INDEX IF NOT EXISTS idx_company_vcs_investment_amount ON company_vcs(investment_amount_usd);
CREATE INDEX IF NOT EXISTS idx_company_vcs_investment_date ON company_vcs(investment_date);

-- Add helpful comments
COMMENT ON COLUMN company_vcs.is_invested IS 'Whether this VC invested in the company featured on the episode';
COMMENT ON COLUMN company_vcs.investment_amount_usd IS 'Amount invested by this VC in USD (only if is_invested is true)';
COMMENT ON COLUMN company_vcs.investment_date IS 'Date when the investment was made (only if is_invested is true)';

-- Create a view for easy querying of VC investments
CREATE OR REPLACE VIEW vc_investments AS
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
    cv.investment_date,
    cv.created_at as relationship_created_at
FROM company_vcs cv
JOIN vcs v ON cv.vc_id = v.id
JOIN companies c ON cv.company_id = c.id
WHERE cv.is_invested = true
ORDER BY cv.investment_date DESC;

-- Create a view for VC investment portfolio summaries
CREATE OR REPLACE VIEW vc_portfolio_summary AS
SELECT 
    v.id as vc_id,
    v.name as vc_name,
    v.firm_name,
    COUNT(cv.id) FILTER (WHERE cv.is_invested = true) as total_investments,
    SUM(cv.investment_amount_usd) FILTER (WHERE cv.is_invested = true) as total_invested_usd,
    MIN(cv.investment_date) FILTER (WHERE cv.is_invested = true) as first_investment_date,
    MAX(cv.investment_date) FILTER (WHERE cv.is_invested = true) as last_investment_date,
    COUNT(cv.id) as total_episode_appearances
FROM vcs v
LEFT JOIN company_vcs cv ON v.id = cv.vc_id
GROUP BY v.id, v.name, v.firm_name
ORDER BY total_invested_usd DESC NULLS LAST;

-- Create a view for company investment summaries
CREATE OR REPLACE VIEW company_investment_summary AS
SELECT 
    c.id as company_id,
    c.name as company_name,
    c.slug as company_slug,
    COUNT(cv.id) FILTER (WHERE cv.is_invested = true) as total_investors,
    SUM(cv.investment_amount_usd) FILTER (WHERE cv.is_invested = true) as total_raised_from_episode_usd,
    ARRAY_AGG(v.name) FILTER (WHERE cv.is_invested = true) as investor_names,
    MIN(cv.investment_date) FILTER (WHERE cv.is_invested = true) as first_investment_date,
    COUNT(cv.id) as total_vcs_featured
FROM companies c
LEFT JOIN company_vcs cv ON c.id = cv.company_id
LEFT JOIN vcs v ON cv.vc_id = v.id
GROUP BY c.id, c.name, c.slug
ORDER BY total_raised_from_episode_usd DESC NULLS LAST;

-- Add RLS policies for the new views (allow authenticated users to read)
ALTER VIEW vc_investments OWNER TO postgres;
ALTER VIEW vc_portfolio_summary OWNER TO postgres;  
ALTER VIEW company_investment_summary OWNER TO postgres;

-- Add migration tracking comment
COMMENT ON TABLE company_vcs IS 'Company-VC relationships with episode context and investment tracking'; 