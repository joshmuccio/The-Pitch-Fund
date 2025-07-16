-- Create VCs table with comprehensive profile data
CREATE TABLE vcs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  firm_name TEXT,
  role_title TEXT,
  bio TEXT,
  profile_image_url TEXT,
  
  -- Social and web links
  linkedin_url TEXT,
  twitter_url TEXT,
  website_url TEXT,
  podcast_url TEXT,
  
  -- Episode appearance tracking
  seasons_appeared TEXT[], -- Array of seasons like ["1", "2", "13"]
  total_episodes_count INTEGER DEFAULT 0,
  
  -- Profile source and metadata
  thepitch_profile_url TEXT UNIQUE, -- Source URL we scraped from
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique VCs (no duplicates)
  CONSTRAINT unique_vc_name_firm UNIQUE(name, firm_name)
);

-- Create company-VC relationships table (many-to-many)
CREATE TABLE company_vcs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  vc_id UUID REFERENCES vcs(id) ON DELETE CASCADE,
  
  -- Episode context
  episode_season TEXT, -- Which season this relationship occurred
  episode_number TEXT, -- Episode number like "164"
  episode_url TEXT, -- The pitch episode URL
  
  -- Relationship metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate relationships
  CONSTRAINT unique_company_vc UNIQUE(company_id, vc_id)
);

-- Create indexes for better performance
CREATE INDEX idx_vcs_name ON vcs(name);
CREATE INDEX idx_vcs_firm ON vcs(firm_name);
CREATE INDEX idx_vcs_seasons ON vcs USING GIN(seasons_appeared);
CREATE INDEX idx_company_vcs_company ON company_vcs(company_id);
CREATE INDEX idx_company_vcs_vc ON company_vcs(vc_id);
CREATE INDEX idx_company_vcs_episode ON company_vcs(episode_season, episode_number);

-- Add RLS policies for VCs table
ALTER TABLE vcs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read VCs
CREATE POLICY "Allow authenticated users to read VCs" ON vcs
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert/update VCs (admin functionality)
CREATE POLICY "Allow authenticated users to manage VCs" ON vcs
  FOR ALL TO authenticated USING (true);

-- Add RLS policies for company_vcs table  
ALTER TABLE company_vcs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read company-VC relationships
CREATE POLICY "Allow authenticated users to read company VCs" ON company_vcs
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to manage company-VC relationships
CREATE POLICY "Allow authenticated users to manage company VCs" ON company_vcs
  FOR ALL TO authenticated USING (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vcs_updated_at BEFORE UPDATE ON vcs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 