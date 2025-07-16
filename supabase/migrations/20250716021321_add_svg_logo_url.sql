-- Add svg_logo_url field to companies table
-- This will store the vectorized SVG version of the logo
ALTER TABLE companies 
ADD COLUMN svg_logo_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN companies.svg_logo_url IS 'URL to the vectorized SVG version of the company logo (generated from logo_url)';
