-- Migration: Add missing updated_at columns for timestamp consistency
-- Date: 2025-01-04
-- Description: Add updated_at columns to tables that only have created_at

-- Add updated_at to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add updated_at to company_founders table
ALTER TABLE company_founders 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add updated_at to kpis table
ALTER TABLE kpis 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add updated_at to kpi_values table
ALTER TABLE kpi_values 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add created_at and updated_at to embeddings table (currently has no timestamps)
ALTER TABLE embeddings 
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create triggers for automatic updated_at management
-- (The update_updated_at_column() function already exists)

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_founders_updated_at
    BEFORE UPDATE ON company_founders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kpis_updated_at
    BEFORE UPDATE ON kpis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kpi_values_updated_at
    BEFORE UPDATE ON kpi_values
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_embeddings_updated_at
    BEFORE UPDATE ON embeddings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON COLUMN profiles.updated_at IS 'Timestamp of last profile update';
COMMENT ON COLUMN company_founders.updated_at IS 'Timestamp of last relationship update';
COMMENT ON COLUMN kpis.updated_at IS 'Timestamp of last KPI definition update';
COMMENT ON COLUMN kpi_values.updated_at IS 'Timestamp of last KPI value update';
COMMENT ON COLUMN embeddings.created_at IS 'Timestamp when embedding was created';
COMMENT ON COLUMN embeddings.updated_at IS 'Timestamp of last embedding update'; 