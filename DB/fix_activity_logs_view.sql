-- ============================================================================
-- FIX: organization_activity_logs_view
-- Eliminamos el filtro que excluye organizaciones de admins
-- ============================================================================

DROP VIEW IF EXISTS public.organization_activity_logs_view;

CREATE VIEW public.organization_activity_logs_view AS
SELECT
  l.id,
  l.organization_id,
  l.member_id,
  m.user_id,
  l.action,
  l.target_table,
  l.target_id,
  l.metadata,
  l.created_at,
  u.full_name,
  u.avatar_url,
  u.email
FROM
  organization_activity_logs l
  LEFT JOIN organization_members m ON l.member_id = m.id
  LEFT JOIN users u ON m.user_id = u.id;

-- Otorgar permisos a usuarios autenticados
GRANT SELECT ON public.organization_activity_logs_view TO authenticated;
