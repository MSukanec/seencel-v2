-- ============================================
-- Agregar role_name a organization_activity_logs_view
-- ============================================
-- Agrega un LEFT JOIN a roles para traer el nombre del rol
-- del miembro que realizó la acción.
--
-- Ejecutar en Supabase SQL Editor.
-- ============================================

CREATE OR REPLACE VIEW public.organization_activity_logs_view AS
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
    u.email,
    r.name AS role_name
FROM
    organization_activity_logs l
    JOIN organization_members m ON l.member_id = m.id
    JOIN users u ON m.user_id = u.id
    LEFT JOIN roles r ON m.role_id = r.id
WHERE
    l.member_id IS NOT NULL;
