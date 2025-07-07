-- Update founder_role enum to change 'solo_founder' to 'founder'
-- This migration safely updates all existing data and the enum type

-- Step 1: Drop objects that depend on the founders.role column and founder_role type
DROP VIEW IF EXISTS founder_insights;
DROP VIEW IF EXISTS founder_timeline_analysis;
DROP FUNCTION IF EXISTS get_founder_insights();
DROP FUNCTION IF EXISTS get_founder_timeline_analysis();

-- Step 2: Create new enum type with the correct values
CREATE TYPE founder_role_new AS ENUM ('founder', 'cofounder');

-- Step 3: Update the founders table to use the new enum type
-- This will convert 'solo_founder' to 'founder' and keep 'cofounder' as is
ALTER TABLE founders 
ALTER COLUMN role TYPE founder_role_new 
USING CASE 
    WHEN role::text = 'solo_founder' THEN 'founder'::founder_role_new
    ELSE role::text::founder_role_new
END;

-- Step 4: Drop the old enum type
DROP TYPE founder_role;

-- Step 5: Rename the new type to the original name
ALTER TYPE founder_role_new RENAME TO founder_role;

-- Step 6: Update the comment to reflect the new values
COMMENT ON TYPE founder_role IS 'Simplified founder role enum: founder (single founder) or cofounder (multiple founders).';
COMMENT ON COLUMN founders.role IS 'Simplified founder classification: founder or cofounder for clear founder structure identification.';

-- Step 7: Recreate the views with the updated enum values
-- Founder timeline analysis view
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

-- Founder insights view
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

-- Step 8: Recreate the secure functions
CREATE OR REPLACE FUNCTION get_founder_timeline_analysis()
RETURNS TABLE (
    company_name text,
    company_slug citext,
    founder_name text,
    founder_email citext,
    founder_role_at_company text,
    period_start date,
    period_end date,
    update_type founder_update_type,
    sentiment_score numeric,
    key_metrics_mentioned text[],
    topics_extracted text[],
    ai_summary text,
    created_at timestamptz,
    previous_sentiment numeric,
    update_year numeric,
    update_quarter numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Explicit permission check for LP/Admin access
    IF NOT EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND p.role IN ('lp','admin')
    ) THEN
        RAISE EXCEPTION 'Access denied. LP or admin role required.';
    END IF;

    -- Return the timeline analysis data
    RETURN QUERY
    SELECT 
        c.name::text as company_name,
        c.slug as company_slug,
        f.name::text as founder_name,
        f.email as founder_email,
        cf.role::text as founder_role_at_company,
        fu.period_start,
        fu.period_end,
        fu.update_type,
        fu.sentiment_score,
        fu.key_metrics_mentioned,
        fu.topics_extracted,
        fu.ai_summary,
        fu.created_at,
        -- Calculate sentiment trend
        LAG(fu.sentiment_score) OVER (
            PARTITION BY c.id, f.id 
            ORDER BY fu.period_start
        ) as previous_sentiment,
        EXTRACT(YEAR FROM fu.period_start) as update_year,
        EXTRACT(QUARTER FROM fu.period_start) as update_quarter
    FROM founder_updates fu
    JOIN companies c ON fu.company_id = c.id
    LEFT JOIN founders f ON fu.founder_id = f.id
    LEFT JOIN company_founders cf ON (c.id = cf.company_id AND f.id = cf.founder_id AND cf.is_active = true)
    WHERE fu.period_start IS NOT NULL
    ORDER BY c.name, f.email, fu.period_start;
END;
$$;

CREATE OR REPLACE FUNCTION get_founder_insights()
RETURNS TABLE (
    founder_id uuid,
    founder_email citext,
    founder_name text,
    primary_role founder_role,
    linkedin_url text,
    total_updates bigint,
    avg_sentiment numeric,
    companies_involved uuid[],
    company_names text[],
    top_topics text[],
    first_update date,
    last_update date
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Explicit permission check for LP/Admin access
    IF NOT EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND p.role IN ('lp','admin')
    ) THEN
        RAISE EXCEPTION 'Access denied. LP or admin role required.';
    END IF;

    -- Return the founder insights data
    RETURN QUERY
    SELECT 
        f.id as founder_id,
        f.email as founder_email,
        f.name::text as founder_name,
        f.role as primary_role,
        f.linkedin_url,
        COUNT(fu.id) as total_updates,
        AVG(fu.sentiment_score) as avg_sentiment,
        ARRAY_AGG(DISTINCT c.id) FILTER (WHERE c.id IS NOT NULL) as companies_involved,
        ARRAY_AGG(DISTINCT c.name::text) FILTER (WHERE c.name IS NOT NULL) as company_names,
        -- Topic frequency analysis (top 5)
        (SELECT array_agg(topic::text) 
         FROM (
             SELECT unnest(fu2.topics_extracted) as topic, COUNT(*) as freq
             FROM founder_updates fu2 
             WHERE fu2.founder_id = f.id
             GROUP BY topic 
             ORDER BY freq DESC 
             LIMIT 5
         ) top_topics_subq) as top_topics,
        MIN(fu.period_start) as first_update,
        MAX(fu.period_end) as last_update
    FROM founders f
    LEFT JOIN founder_updates fu ON f.id = fu.founder_id
    LEFT JOIN companies c ON fu.company_id = c.id
    GROUP BY f.id, f.email, f.name, f.role, f.linkedin_url;
END;
$$; 