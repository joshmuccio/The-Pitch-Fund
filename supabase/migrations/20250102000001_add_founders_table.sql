-- Add Founders Table Migration
-- Creates minimal founders table for data integrity and proper linking

-- Create minimal founders table for data integrity
CREATE TABLE founders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  linkedin_url TEXT,
  role TEXT, -- Primary role (CEO, CTO, etc.)
  bio TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create company_founders junction table for many-to-many relationship
CREATE TABLE company_founders (
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  founder_id UUID REFERENCES founders(id) ON DELETE CASCADE,
  role TEXT, -- Role at this specific company
  is_active BOOLEAN DEFAULT true,
  equity_percentage DECIMAL(5,2) CHECK (equity_percentage >= 0 AND equity_percentage <= 100),
  joined_date DATE,
  left_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (company_id, founder_id)
);

-- Add founder_id to founder_updates for proper linking
ALTER TABLE founder_updates 
ADD COLUMN founder_id UUID REFERENCES founders(id);

-- Enable RLS on new tables
ALTER TABLE founders ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_founders ENABLE ROW LEVEL SECURITY;

-- RLS policies for founders table
CREATE POLICY "Founders: admin read" ON founders
FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "Founders: admin write" ON founders
FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- RLS policies for company_founders table
CREATE POLICY "Company founders: admin read" ON company_founders
FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "Company founders: admin write" ON company_founders
FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Create indexes for performance
CREATE INDEX idx_founders_email ON founders(email);
CREATE INDEX idx_founders_name ON founders(name);

CREATE INDEX idx_company_founders_company_id ON company_founders(company_id);
CREATE INDEX idx_company_founders_founder_id ON company_founders(founder_id);
CREATE INDEX idx_company_founders_is_active ON company_founders(is_active);

CREATE INDEX idx_founder_updates_founder_id ON founder_updates(founder_id);

-- Add trigger for updated_at on founders
CREATE TRIGGER update_founders_updated_at 
    BEFORE UPDATE ON founders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE founders IS 'Minimal founders table for data integrity and proper linking';
COMMENT ON COLUMN founders.email IS 'Unique email address for founder identification';
COMMENT ON COLUMN founders.role IS 'Primary role of founder (CEO, CTO, etc.)';

COMMENT ON TABLE company_founders IS 'Junction table linking founders to companies (many-to-many)';
COMMENT ON COLUMN company_founders.role IS 'Founder role at this specific company';
COMMENT ON COLUMN company_founders.equity_percentage IS 'Founder equity percentage in this company';

COMMENT ON COLUMN founder_updates.founder_id IS 'Links to founders table for data integrity';

-- Update the views to use proper founder linking
DROP VIEW IF EXISTS founder_timeline_analysis;
CREATE OR REPLACE VIEW founder_timeline_analysis AS
SELECT 
    c.name as company_name,
    c.slug as company_slug,
    f.name as founder_name,
    f.email as founder_email,
    cf.role as founder_role_at_company,
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
        PARTITION BY c.id, f.id 
        ORDER BY fu.period_start
    ) as previous_sentiment,
    -- Extract time-based insights
    EXTRACT(YEAR FROM fu.period_start) as update_year,
    EXTRACT(QUARTER FROM fu.period_start) as update_quarter
FROM founder_updates fu
JOIN companies c ON fu.company_id = c.id
LEFT JOIN founders f ON fu.founder_id = f.id
LEFT JOIN company_founders cf ON (c.id = cf.company_id AND f.id = cf.founder_id AND cf.is_active = true)
WHERE fu.period_start IS NOT NULL
ORDER BY c.name, f.email, fu.period_start;

DROP VIEW IF EXISTS company_progress_timeline;
CREATE OR REPLACE VIEW company_progress_timeline AS
SELECT 
    c.*,
    -- Aggregate founder update insights
    COUNT(fu.id) as total_updates,
    AVG(fu.sentiment_score) as avg_sentiment,
    ARRAY_AGG(DISTINCT f.name) FILTER (WHERE f.name IS NOT NULL) as founders,
    ARRAY_AGG(DISTINCT cf.role) FILTER (WHERE cf.role IS NOT NULL) as founder_roles,
    -- Latest update info
    MAX(fu.period_end) as last_update_period,
    (SELECT fu2.ai_summary 
     FROM founder_updates fu2 
     WHERE fu2.company_id = c.id 
     ORDER BY fu2.period_end DESC NULLS LAST 
     LIMIT 1) as latest_summary
FROM companies c
LEFT JOIN founder_updates fu ON c.id = fu.company_id
LEFT JOIN founders f ON fu.founder_id = f.id
LEFT JOIN company_founders cf ON (c.id = cf.company_id AND f.id = cf.founder_id AND cf.is_active = true)
GROUP BY c.id;

DROP VIEW IF EXISTS founder_insights;
CREATE OR REPLACE VIEW founder_insights AS
SELECT 
    f.id as founder_id,
    f.email,
    f.name,
    f.role as primary_role,
    f.linkedin_url,
    COUNT(fu.id) as total_updates,
    AVG(fu.sentiment_score) as avg_sentiment,
    ARRAY_AGG(DISTINCT c.id) FILTER (WHERE c.id IS NOT NULL) as companies_involved,
    ARRAY_AGG(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL) as company_names,
    -- Topic frequency analysis
    (SELECT array_agg(topic) 
     FROM (
         SELECT unnest(fu2.topics_extracted) as topic, COUNT(*) as freq
         FROM founder_updates fu2 
         WHERE fu2.founder_id = f.id
         GROUP BY topic 
         ORDER BY freq DESC 
         LIMIT 5
     ) top_topics) as top_topics,
    MIN(fu.period_start) as first_update,
    MAX(fu.period_end) as last_update
FROM founders f
LEFT JOIN founder_updates fu ON f.id = fu.founder_id
LEFT JOIN companies c ON fu.company_id = c.id
GROUP BY f.id, f.email, f.name, f.role, f.linkedin_url; 