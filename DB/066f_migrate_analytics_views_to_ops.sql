-- ============================================================================
-- 066f: Migrate 12 analytics views from public → ops
-- ============================================================================

-- 1. Drop all from public
DROP VIEW IF EXISTS public.analytics_at_risk_users_view;
DROP VIEW IF EXISTS public.analytics_bounce_rate_view;
DROP VIEW IF EXISTS public.analytics_general_kpis_view;
DROP VIEW IF EXISTS public.analytics_hourly_activity_view;
DROP VIEW IF EXISTS public.analytics_page_engagement_view;
DROP VIEW IF EXISTS public.analytics_realtime_overview_view;
DROP VIEW IF EXISTS public.analytics_session_duration_view;
DROP VIEW IF EXISTS public.analytics_top_users_view;
DROP VIEW IF EXISTS public.analytics_user_growth_view;
DROP VIEW IF EXISTS public.analytics_user_journeys_view;
DROP VIEW IF EXISTS public.analytics_user_session_summary_view;
DROP VIEW IF EXISTS public.analytics_users_by_country_view;

-- 2. Recreate in ops schema

-- 2.1 analytics_user_session_summary_view (base for at_risk)
CREATE OR REPLACE VIEW ops.analytics_user_session_summary_view AS
SELECT u.id,
    u.full_name,
    u.avatar_url,
    u.created_at,
    count(DISTINCT h.session_id) AS session_count,
    max(h.entered_at) AS last_activity_at,
    sum(h.duration_seconds) AS total_time_seconds
FROM iam.users u
LEFT JOIN iam.user_view_history h ON h.user_id = u.id
WHERE u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid
  AND u.is_active = true
GROUP BY u.id, u.full_name, u.avatar_url, u.created_at;

-- 2.2 analytics_at_risk_users_view (depends on 2.1)
CREATE OR REPLACE VIEW ops.analytics_at_risk_users_view AS
SELECT id, full_name, avatar_url, created_at, session_count, last_activity_at
FROM ops.analytics_user_session_summary_view
WHERE created_at < (now() - '7 days'::interval)
  AND session_count < 3
ORDER BY session_count, last_activity_at NULLS FIRST
LIMIT 10;

-- 2.3 analytics_bounce_rate_view
CREATE OR REPLACE VIEW ops.analytics_bounce_rate_view AS
WITH session_pages AS (
    SELECT h.session_id, count(*) AS page_count
    FROM iam.user_view_history h
    JOIN iam.users u ON u.id = h.user_id
    WHERE h.session_id IS NOT NULL
      AND u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid
    GROUP BY h.session_id
)
SELECT count(*) FILTER (WHERE page_count = 1) AS bounced_sessions,
    count(*) AS total_sessions,
    round(((count(*) FILTER (WHERE page_count = 1))::numeric / NULLIF(count(*), 0)::numeric) * 100::numeric, 1) AS bounce_rate_percent
FROM session_pages;

-- 2.4 analytics_general_kpis_view
CREATE OR REPLACE VIEW ops.analytics_general_kpis_view AS
SELECT
    (SELECT count(*) FROM iam.organizations WHERE is_active = true) AS total_organizations,
    (SELECT count(*) FROM projects.projects WHERE is_deleted = false) AS total_projects,
    (SELECT count(*) FROM iam.users WHERE is_active = true AND role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid) AS total_users;

-- 2.5 analytics_hourly_activity_view
CREATE OR REPLACE VIEW ops.analytics_hourly_activity_view AS
SELECT (EXTRACT(hour FROM h.entered_at))::integer AS hour_of_day,
    count(*) AS activity_count
FROM iam.user_view_history h
JOIN iam.users u ON u.id = h.user_id
WHERE h.entered_at > (now() - '7 days'::interval)
  AND u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid
GROUP BY EXTRACT(hour FROM h.entered_at)
ORDER BY EXTRACT(hour FROM h.entered_at);

-- 2.6 analytics_page_engagement_view
CREATE OR REPLACE VIEW ops.analytics_page_engagement_view AS
SELECT h.view_name,
    count(*) AS visits,
    avg(h.duration_seconds) AS avg_duration,
    count(DISTINCT h.session_id) AS unique_sessions
FROM iam.user_view_history h
JOIN iam.users u ON u.id = h.user_id
WHERE u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid
GROUP BY h.view_name;

-- 2.7 analytics_realtime_overview_view
CREATE OR REPLACE VIEW ops.analytics_realtime_overview_view AS
SELECT count(*) AS active_users
FROM iam.user_presence up
JOIN iam.users u ON u.id = up.user_id
WHERE up.last_seen_at > (now() - '00:05:00'::interval)
  AND up.status = 'online'
  AND u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid;

-- 2.8 analytics_session_duration_view
CREATE OR REPLACE VIEW ops.analytics_session_duration_view AS
SELECT round(avg(sessions.total_duration), 0) AS avg_duration_seconds,
    round(avg(sessions.total_duration) / 60::numeric, 1) AS avg_duration_minutes,
    count(*) AS total_sessions
FROM (
    SELECT h.session_id, sum(h.duration_seconds) AS total_duration
    FROM iam.user_view_history h
    JOIN iam.users u ON u.id = h.user_id
    WHERE h.session_id IS NOT NULL
      AND h.duration_seconds IS NOT NULL
      AND u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid
    GROUP BY h.session_id
) sessions;

-- 2.9 analytics_top_users_view
CREATE OR REPLACE VIEW ops.analytics_top_users_view AS
SELECT u.id,
    u.full_name,
    u.avatar_url,
    count(DISTINCT h.session_id) AS total_sessions,
    count(*) AS total_pageviews,
    COALESCE(sum(h.duration_seconds), 0::bigint) AS total_time_seconds
FROM iam.users u
JOIN iam.user_view_history h ON h.user_id = u.id
WHERE u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid
GROUP BY u.id, u.full_name, u.avatar_url
ORDER BY count(*) DESC;

-- 2.10 analytics_user_growth_view
CREATE OR REPLACE VIEW ops.analytics_user_growth_view AS
SELECT date_trunc('day', created_at) AS date,
    count(*) AS new_users
FROM iam.users
WHERE role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid
GROUP BY date_trunc('day', created_at)
ORDER BY date_trunc('day', created_at) DESC;

-- 2.11 analytics_user_journeys_view
CREATE OR REPLACE VIEW ops.analytics_user_journeys_view AS
SELECT h.session_id,
    u.id AS user_id,
    u.full_name,
    u.avatar_url,
    h.view_name,
    h.entered_at,
    h.exited_at,
    h.duration_seconds,
    row_number() OVER (PARTITION BY h.session_id ORDER BY h.entered_at) AS step_number
FROM iam.user_view_history h
JOIN iam.users u ON u.id = h.user_id
WHERE h.session_id IS NOT NULL
  AND u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid
  AND h.entered_at > (now() - '7 days'::interval)
ORDER BY h.session_id, h.entered_at;

-- 2.12 analytics_users_by_country_view
CREATE OR REPLACE VIEW ops.analytics_users_by_country_view AS
SELECT c.id AS country_id,
    c.name AS country_name,
    c.alpha_2 AS country_code,
    count(ud.user_id) AS user_count
FROM iam.user_data ud
JOIN public.countries c ON c.id = ud.country
WHERE ud.country IS NOT NULL
GROUP BY c.id, c.name, c.alpha_2
ORDER BY count(ud.user_id) DESC;
