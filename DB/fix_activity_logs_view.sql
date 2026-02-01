-- ============================================================================
-- FIX: organization_activity_logs_view
-- Filtra registros donde member_id es NULL (acciones de sistema)
-- Solo muestra actividad de miembros reales de la organización
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
  INNER JOIN organization_members m ON l.member_id = m.id
  INNER JOIN users u ON m.user_id = u.id
WHERE
  l.member_id IS NOT NULL;

-- Otorgar permisos a usuarios autenticados
GRANT SELECT ON public.organization_activity_logs_view TO authenticated;
