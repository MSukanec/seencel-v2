-- ============================================================================
-- 011: Limpieza y Unificación de Vistas de Analíticas
-- Fecha: 2026-02-17
-- Descripción:
--   1. Elimina 9 vistas sin uso (8 user_* + 1 analytics_session_quality_view)
--   2. Mejora analytics_hourly_activity_view (fuente más precisa)
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 1: Eliminar vistas user_* (código muerto — sin consumo en frontend)
-- ─────────────────────────────────────────────────────────────────────────────

-- Duplica analytics_hourly_activity_view
DROP VIEW IF EXISTS user_hourly_activity_view;

-- Duplica analytics_page_engagement_view
DROP VIEW IF EXISTS user_engagement_by_view_view;

-- Duplica analytics_top_users_view
DROP VIEW IF EXISTS user_top_performers_view;

-- Duplica analytics_at_risk_users_view
DROP VIEW IF EXISTS user_drop_off_view;

-- Duplica analytics_general_kpis_view (versión expandida sin uso)
DROP VIEW IF EXISTS user_stats_summary_view;

-- Duplica analytics_user_growth_view (agrupada por mes)
DROP VIEW IF EXISTS user_monthly_growth_view;

-- Redundante con consulta directa a user_presence
DROP VIEW IF EXISTS user_presence_activity_view;

-- Única pero sin consumo (distribución por fuente de adquisición)
DROP VIEW IF EXISTS user_acquisition_distribution_view;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 2: Eliminar analytics_session_quality_view (código muerto)
-- La funcionalidad de bounce ya la cubre analytics_bounce_rate_view
-- ─────────────────────────────────────────────────────────────────────────────

DROP VIEW IF EXISTS analytics_session_quality_view;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 3: Mejorar analytics_hourly_activity_view
-- Antes: usaba user_presence.last_seen_at (presencia, menos precisa)
-- Ahora: usa user_view_history.entered_at (navegación real, más precisa)
-- ─────────────────────────────────────────────────────────────────────────────

DROP VIEW IF EXISTS analytics_hourly_activity_view;

CREATE OR REPLACE VIEW analytics_hourly_activity_view AS
SELECT 
    (EXTRACT(hour FROM h.entered_at))::integer AS hour_of_day,
    count(*) AS activity_count
FROM user_view_history h
JOIN users u ON u.id = h.user_id
WHERE h.entered_at > (now() - interval '7 days')
  AND u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid
GROUP BY EXTRACT(hour FROM h.entered_at)
ORDER BY EXTRACT(hour FROM h.entered_at);
