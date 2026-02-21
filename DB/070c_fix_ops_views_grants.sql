-- ============================================================
-- 070c: Fix grants para ops views y tablas subyacentes
-- ============================================================
-- Error: getUserJourneys retorna {} al consultar
--        ops.analytics_user_journeys_view
-- Causa probable: falta GRANT SELECT para authenticated/anon
-- ============================================================

BEGIN;

-- Grants en el schema ops para que PostgREST pueda acceder
GRANT USAGE ON SCHEMA ops TO authenticated;
GRANT USAGE ON SCHEMA ops TO anon;

-- Grants en todas las vistas de ops analytics
GRANT SELECT ON ops.analytics_user_journeys_view TO authenticated;
GRANT SELECT ON ops.analytics_at_risk_users_view TO authenticated;
GRANT SELECT ON ops.analytics_bounce_rate_view TO authenticated;
GRANT SELECT ON ops.analytics_general_kpis_view TO authenticated;
GRANT SELECT ON ops.analytics_hourly_activity_view TO authenticated;
GRANT SELECT ON ops.analytics_page_engagement_view TO authenticated;
GRANT SELECT ON ops.analytics_realtime_overview_view TO authenticated;
GRANT SELECT ON ops.analytics_session_duration_view TO authenticated;
GRANT SELECT ON ops.analytics_top_users_view TO authenticated;
GRANT SELECT ON ops.analytics_user_growth_view TO authenticated;
GRANT SELECT ON ops.analytics_user_session_summary_view TO authenticated;
GRANT SELECT ON ops.analytics_users_by_country_view TO authenticated;

-- Grants en tablas subyacentes que las vistas necesitan leer
GRANT SELECT ON iam.user_view_history TO authenticated;
GRANT SELECT ON iam.user_presence TO authenticated;

COMMIT;
