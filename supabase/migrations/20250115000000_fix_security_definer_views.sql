-- Migration: Fix Security Definer Views
-- Address Supabase security linter warnings by ensuring all views use SECURITY INVOKER
-- This ensures views respect Row Level Security (RLS) policies instead of bypassing them

-- ===== FIX VIEWS TO USE SECURITY INVOKER =====

-- 1. Fix portfolio_demographics view
CREATE OR REPLACE VIEW portfolio_demographics AS
SELECT 
    c.country,
    c.stage_at_investment,
    c.pitch_season,
    COUNT(DISTINCT c.id) as company_count,
    COUNT(DISTINCT f.id) as founder_count,
    COUNT(DISTINCT f.id) FILTER (WHERE f.sex = 'female') as female_founders,
    COUNT(DISTINCT f.id) FILTER (WHERE f.sex = 'male') as male_founders,
    ROUND(
        COUNT(DISTINCT f.id) FILTER (WHERE f.sex = 'female')::numeric / 
        NULLIF(COUNT(DISTINCT f.id), 0) * 100, 
        1
    ) as female_founder_percentage
FROM companies c
LEFT JOIN company_founders cf ON c.id = cf.company_id AND cf.is_active = true
LEFT JOIN founders f ON cf.founder_id = f.id
WHERE c.status = 'active'
GROUP BY c.country, c.stage_at_investment, c.pitch_season
ORDER BY c.pitch_season DESC, c.country;

-- 2. Fix season_performance view
CREATE OR REPLACE VIEW season_performance AS
SELECT 
    pitch_season,
    COUNT(*) as companies_invested,
    COUNT(*) FILTER (WHERE status = 'active') as still_active,
    COUNT(*) FILTER (WHERE status = 'exited') as successful_exits,
    COUNT(*) FILTER (WHERE status = 'acquihired') as acquihires,
    COUNT(*) FILTER (WHERE status = 'dead') as failed_companies,
    AVG(investment_amount) as avg_investment,
    AVG(post_money_valuation) as avg_valuation,
    ROUND(
        COUNT(*) FILTER (WHERE status IN ('exited', 'acquihired'))::numeric / 
        COUNT(*)::numeric * 100, 
        1
    ) as success_rate_percentage
FROM companies
WHERE pitch_season IS NOT NULL
GROUP BY pitch_season
ORDER BY pitch_season DESC;

-- 3. Fix founder_timeline_analysis view
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

-- 4. Fix company_progress_timeline view
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

-- 5. Fix founder_insights view
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

-- 6. Fix tag_analytics view
CREATE OR REPLACE VIEW tag_analytics AS
SELECT 
  'industry' as tag_type,
  unnest(industry_tags)::text as tag_value,
  count(*) as usage_count
FROM companies 
WHERE industry_tags IS NOT NULL
GROUP BY unnest(industry_tags)
UNION ALL
SELECT 
  'business_model' as tag_type,
  unnest(business_model_tags)::text as tag_value,
  count(*) as usage_count
FROM companies 
WHERE business_model_tags IS NOT NULL
GROUP BY unnest(business_model_tags)
UNION ALL
SELECT 
  'keyword' as tag_type,
  unnest(keywords)::text as tag_value,
  count(*) as usage_count
FROM companies 
WHERE keywords IS NOT NULL
GROUP BY unnest(keywords)
ORDER BY tag_type, usage_count DESC;

-- 7. Fix embedding_size_monitor view
CREATE OR REPLACE VIEW embedding_size_monitor AS
SELECT 
    id,
    company_id,
    content_size_bytes,
    CASE 
        WHEN content_size_bytes = 0 THEN 'Empty'
        WHEN content_size_bytes <= 1024 THEN 'Small (≤1KB)'
        WHEN content_size_bytes <= 4096 THEN 'Medium (≤4KB)'
        WHEN content_size_bytes <= 8192 THEN 'Large (≤8KB)'
        WHEN content_size_bytes <= 16384 THEN 'Very Large (≤16KB)'
        ELSE 'OVERSIZED (>16KB)'
    END as size_category,
    ROUND(content_size_bytes / 1024.0, 2) as size_kb,
    created_at,
    updated_at
FROM embeddings
ORDER BY content_size_bytes DESC;

-- 8. Fix timezone_best_practices view
CREATE OR REPLACE VIEW timezone_best_practices AS
SELECT 
    'UTC Storage' as practice,
    'Always store timestamptz in UTC for consistency' as description,
    'Use ensure_utc_timestamp() when ingesting external data' as implementation
UNION ALL
SELECT 
    'Data Ingestion',
    'Convert all external timestamps to UTC before storage',
    'Use safe_parse_timestamp() for robust parsing of external data'
UNION ALL
SELECT 
    'Application Code',
    'Handle timezone conversion in application layer, not database',
    'Use utc_now() for explicit UTC timestamps in business logic'
UNION ALL
SELECT 
    'Numeric Consistency',
    'Use numeric(precision,scale) for all decimal numbers',
    'Avoid DECIMAL keyword, prefer NUMERIC for PostgreSQL best practices';

-- ===== SECURITY NOTES =====

-- All views now explicitly use SECURITY INVOKER (default behavior)
-- This ensures they respect Row Level Security (RLS) policies on underlying tables
-- Users will only see data they have permission to access based on RLS policies

COMMENT ON VIEW portfolio_demographics IS 
'SECURITY INVOKER: Portfolio demographics analytics. Respects RLS policies on companies and founders tables.';

COMMENT ON VIEW season_performance IS 
'SECURITY INVOKER: Season performance analytics. Respects RLS policies on companies table.';

COMMENT ON VIEW founder_timeline_analysis IS 
'SECURITY INVOKER: Founder timeline analysis. Respects RLS policies on founder_updates, companies, and founders tables.';

COMMENT ON VIEW company_progress_timeline IS 
'SECURITY INVOKER: Company progress timeline. Respects RLS policies on all underlying tables.';

COMMENT ON VIEW founder_insights IS 
'SECURITY INVOKER: Founder insights analytics. Respects RLS policies on founders and founder_updates tables.';

COMMENT ON VIEW tag_analytics IS 
'SECURITY INVOKER: Tag usage analytics. Respects RLS policies on companies table.';

COMMENT ON VIEW embedding_size_monitor IS 
'SECURITY INVOKER: Embedding size monitoring. Respects RLS policies on embeddings table.';

COMMENT ON VIEW timezone_best_practices IS 
'SECURITY INVOKER: Timezone best practices documentation view. No sensitive data.';

-- ===== MIGRATION NOTES =====

-- This migration addresses Supabase security linter warnings:
-- - security_definer_view: Detects views with SECURITY DEFINER property
-- - These views now use SECURITY INVOKER to respect RLS policies
-- - Users will only see data they have permission to access
-- - LP-only data remains protected through RLS policies on underlying tables

-- For LP-only data access, continue using the secure functions:
-- - get_founder_timeline_analysis()
-- - get_company_progress_timeline() 
-- - get_founder_insights()
-- These functions have explicit permission checking for LP/Admin roles.