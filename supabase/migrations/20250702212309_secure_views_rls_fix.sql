-- Migration: Secure Views RLS Fix
-- Address security concern where views might expose LP-only data through public companies table

-- Create secure function for founder timeline analysis
-- This ensures LP-only data is properly protected
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

-- Create secure function for company progress timeline
CREATE OR REPLACE FUNCTION get_company_progress_timeline()
RETURNS TABLE (
    company_id uuid,
    company_slug citext,
    company_name text,
    company_data jsonb,  -- All public company fields as JSON
    total_updates bigint,
    avg_sentiment numeric,
    founders text[],
    founder_roles text[],
    last_update_period date,
    latest_summary text
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

    -- Return the company progress data
    RETURN QUERY
    SELECT 
        c.id as company_id,
        c.slug as company_slug,
        c.name::text as company_name,
        to_jsonb(c.*) as company_data,
        COUNT(fu.id) as total_updates,
        AVG(fu.sentiment_score) as avg_sentiment,
        ARRAY_AGG(DISTINCT f.name::text) FILTER (WHERE f.name IS NOT NULL) as founders,
        ARRAY_AGG(DISTINCT cf.role::text) FILTER (WHERE cf.role IS NOT NULL) as founder_roles,
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
    GROUP BY c.id, c.slug, c.name;
END;
$$;

-- Create secure function for founder insights
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

-- Add comments explaining the security approach
COMMENT ON FUNCTION get_founder_timeline_analysis() IS 'Secure function for accessing founder timeline analysis. Explicitly checks LP/Admin permissions before returning any data that includes founder updates or sentiment analysis.';

COMMENT ON FUNCTION get_company_progress_timeline() IS 'Secure function for accessing company progress data. Combines public company info with LP-only founder update insights, with explicit permission checking.';

COMMENT ON FUNCTION get_founder_insights() IS 'Secure function for accessing founder insights and analytics. All data requires LP/Admin access due to sentiment analysis and update patterns being LP-sensitive.';
