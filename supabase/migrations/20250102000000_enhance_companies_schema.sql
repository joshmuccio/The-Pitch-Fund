-- Enhanced Companies Schema Migration
-- Adds specific fields for portfolio company management and AI-powered founder update tracking

-- Add new columns to companies table
ALTER TABLE companies 
ADD COLUMN website_url TEXT,
ADD COLUMN company_linkedin_url TEXT,
ADD COLUMN founded_year INTEGER CHECK (founded_year >= 1800 AND founded_year <= EXTRACT(YEAR FROM CURRENT_DATE) + 10),
ADD COLUMN investment_date DATE,
ADD COLUMN investment_amount DECIMAL(15,2) CHECK (investment_amount >= 0),
ADD COLUMN post_money_valuation DECIMAL(15,2) CHECK (post_money_valuation >= 0),
ADD COLUMN co_investors TEXT[],
ADD COLUMN pitch_episode_url TEXT,
ADD COLUMN key_metrics JSONB DEFAULT '{}',
ADD COLUMN is_active BOOLEAN DEFAULT true,
ADD COLUMN notes TEXT,
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Enhance founder_updates table for AI-powered timeline tracking
ALTER TABLE founder_updates 
ADD COLUMN founder_name TEXT,
ADD COLUMN founder_email TEXT,
ADD COLUMN founder_role TEXT, -- CEO, CTO, Co-founder, etc.
ADD COLUMN founder_linkedin_url TEXT,
ADD COLUMN update_type TEXT, -- monthly, quarterly, milestone, etc.
ADD COLUMN key_metrics_mentioned JSONB DEFAULT '{}', -- AI-extracted KPIs from update text
ADD COLUMN sentiment_score DECIMAL(3,2), -- AI sentiment analysis (-1 to 1)
ADD COLUMN topics_extracted TEXT[], -- AI-extracted topics/themes
ADD COLUMN action_items TEXT[], -- AI-extracted action items
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create indexes for better query performance
CREATE INDEX idx_companies_founded_year ON companies(founded_year);
CREATE INDEX idx_companies_investment_date ON companies(investment_date);
CREATE INDEX idx_companies_is_active ON companies(is_active);
CREATE INDEX idx_companies_key_metrics ON companies USING GIN(key_metrics);

-- Indexes for AI-powered founder update queries
CREATE INDEX idx_founder_updates_founder_email ON founder_updates(founder_email);
CREATE INDEX idx_founder_updates_founder_role ON founder_updates(founder_role);
CREATE INDEX idx_founder_updates_update_type ON founder_updates(update_type);
CREATE INDEX idx_founder_updates_period_start ON founder_updates(period_start);
CREATE INDEX idx_founder_updates_sentiment_score ON founder_updates(sentiment_score);
CREATE INDEX idx_founder_updates_key_metrics_mentioned ON founder_updates USING GIN(key_metrics_mentioned);
CREATE INDEX idx_founder_updates_topics_extracted ON founder_updates USING GIN(topics_extracted);

-- Create trigger to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_founder_updates_updated_at 
    BEFORE UPDATE ON founder_updates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON COLUMN companies.website_url IS 'Company website URL';
COMMENT ON COLUMN companies.company_linkedin_url IS 'Company LinkedIn profile URL';
COMMENT ON COLUMN companies.founded_year IS 'Year the company was founded';
COMMENT ON COLUMN companies.investment_date IS 'Date of investment by The Pitch Fund';
COMMENT ON COLUMN companies.investment_amount IS 'Amount invested in USD';
COMMENT ON COLUMN companies.post_money_valuation IS 'Post-money valuation at time of investment in USD';
COMMENT ON COLUMN companies.co_investors IS 'Array of co-investor names';
COMMENT ON COLUMN companies.pitch_episode_url IS 'URL to The Pitch episode featuring this company';
COMMENT ON COLUMN companies.key_metrics IS 'Flexible JSON storage for company metrics (revenue, users, etc.)';
COMMENT ON COLUMN companies.is_active IS 'Whether the company is still active in our portfolio';
COMMENT ON COLUMN companies.notes IS 'Internal notes about the company';
COMMENT ON COLUMN companies.updated_at IS 'Timestamp of last record update';

-- Enhanced founder_updates comments for AI tracking
COMMENT ON COLUMN founder_updates.founder_name IS 'Name of founder providing the update';
COMMENT ON COLUMN founder_updates.founder_email IS 'Email of founder providing the update';
COMMENT ON COLUMN founder_updates.founder_role IS 'Role of founder in company (CEO, CTO, etc.)';
COMMENT ON COLUMN founder_updates.founder_linkedin_url IS 'LinkedIn profile of founder';
COMMENT ON COLUMN founder_updates.update_type IS 'Type of update (monthly, quarterly, milestone, etc.)';
COMMENT ON COLUMN founder_updates.key_metrics_mentioned IS 'AI-extracted KPIs and metrics mentioned in update';
COMMENT ON COLUMN founder_updates.sentiment_score IS 'AI sentiment analysis score (-1 negative to 1 positive)';
COMMENT ON COLUMN founder_updates.topics_extracted IS 'AI-extracted topics and themes from update';
COMMENT ON COLUMN founder_updates.action_items IS 'AI-extracted action items and next steps';

-- Create helpful views for AI timeline analysis
CREATE OR REPLACE VIEW founder_timeline_analysis AS
SELECT 
    c.name as company_name,
    c.slug as company_slug,
    fu.founder_name,
    fu.founder_role,
    fu.period_start,
    fu.period_end,
    fu.update_type,
    fu.sentiment_score,
    fu.key_metrics_mentioned,
    fu.topics_extracted,
    fu.ai_summary,
    fu.created_at,
    -- Calculate sentiment trend over time
    LAG(fu.sentiment_score) OVER (
        PARTITION BY c.id, fu.founder_email 
        ORDER BY fu.period_start
    ) as previous_sentiment,
    -- Extract time-based insights
    EXTRACT(YEAR FROM fu.period_start) as update_year,
    EXTRACT(QUARTER FROM fu.period_start) as update_quarter
FROM founder_updates fu
JOIN companies c ON fu.company_id = c.id
WHERE fu.period_start IS NOT NULL
ORDER BY c.name, fu.founder_email, fu.period_start;

CREATE OR REPLACE VIEW company_progress_timeline AS
SELECT 
    c.*,
    -- Aggregate founder update insights
    COUNT(fu.id) as total_updates,
    AVG(fu.sentiment_score) as avg_sentiment,
    ARRAY_AGG(DISTINCT fu.founder_name) FILTER (WHERE fu.founder_name IS NOT NULL) as founders,
    ARRAY_AGG(DISTINCT fu.founder_role) FILTER (WHERE fu.founder_role IS NOT NULL) as founder_roles,
    -- Latest update info
    MAX(fu.period_end) as last_update_period,
    (SELECT fu2.ai_summary 
     FROM founder_updates fu2 
     WHERE fu2.company_id = c.id 
     ORDER BY fu2.period_end DESC NULLS LAST 
     LIMIT 1) as latest_summary
FROM companies c
LEFT JOIN founder_updates fu ON c.id = fu.company_id
GROUP BY c.id;

-- Create view for AI-powered founder insights
CREATE OR REPLACE VIEW founder_insights AS
SELECT 
    founder_email,
    founder_name,
    founder_role,
    COUNT(*) as total_updates,
    AVG(sentiment_score) as avg_sentiment,
    ARRAY_AGG(DISTINCT company_id) as companies_involved,
    -- Topic frequency analysis
    (SELECT array_agg(topic) 
     FROM (
         SELECT unnest(topics_extracted) as topic, COUNT(*) as freq
         FROM founder_updates fu2 
         WHERE fu2.founder_email = fu.founder_email
         GROUP BY topic 
         ORDER BY freq DESC 
         LIMIT 5
     ) top_topics) as top_topics,
    MIN(period_start) as first_update,
    MAX(period_end) as last_update
FROM founder_updates fu
WHERE founder_email IS NOT NULL
GROUP BY founder_email, founder_name, founder_role; 