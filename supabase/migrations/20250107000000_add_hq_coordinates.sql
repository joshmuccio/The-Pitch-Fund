-- Add latitude and longitude columns to companies table for Mapbox geocoding coordinates
-- Migration: 20250107000000_add_hq_coordinates.sql
-- Purpose: Store precise latitude/longitude coordinates from Mapbox geocoding API
--          to enable mapping, distance calculations, and geographic analysis

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS hq_latitude  numeric,
  ADD COLUMN IF NOT EXISTS hq_longitude numeric;

-- Add comments to document the purpose of these columns
COMMENT ON COLUMN companies.hq_latitude IS 'Latitude coordinate from Mapbox geocoding (WGS84)';
COMMENT ON COLUMN companies.hq_longitude IS 'Longitude coordinate from Mapbox geocoding (WGS84)';

-- Create an index for geographic queries (optional but recommended for performance)
CREATE INDEX IF NOT EXISTS idx_companies_hq_coordinates 
ON companies (hq_latitude, hq_longitude) 
WHERE hq_latitude IS NOT NULL AND hq_longitude IS NOT NULL;

-- Add a check constraint to ensure valid coordinate ranges
ALTER TABLE companies 
ADD CONSTRAINT chk_hq_latitude_range 
CHECK (hq_latitude IS NULL OR (hq_latitude >= -90 AND hq_latitude <= 90));

ALTER TABLE companies 
ADD CONSTRAINT chk_hq_longitude_range 
CHECK (hq_longitude IS NULL OR (hq_longitude >= -180 AND hq_longitude <= 180)); 