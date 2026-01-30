-- ============================================================
-- UPDATE: organization_activity_logs_view
-- Date: 2026-01-30
-- Change: Exclude logs from organizations owned by admin users
-- ============================================================

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
  LEFT JOIN users u ON m.user_id = u.id
WHERE
  -- Excluir organizaciones cuyo owner es admin
  l.organization_id NOT IN (
    SELECT o.id 
    FROM organizations o
    JOIN users owner_user ON o.owner_id = owner_user.id
    WHERE owner_user.auth_id IN (SELECT auth_id FROM admin_users)
  );
