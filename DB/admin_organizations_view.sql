-- ============================================================
-- Vista: admin_organizations_view
-- Propósito: Vista completa para la tabla admin de organizaciones
-- Incluye: owner, plan, conteos de miembros/proyectos, última actividad
-- ============================================================

CREATE OR REPLACE VIEW public.admin_organizations_view AS
SELECT
    o.id,
    o.name,
    o.logo_path,
    o.created_at,
    o.updated_at,
    o.is_active,
    o.is_deleted,
    o.is_demo,
    o.settings,
    o.purchased_seats,

    -- Owner info (JOIN con users via owner_id)
    ow.full_name AS owner_name,
    ow.email AS owner_email,

    -- Plan info (JOIN con plans via plan_id)
    pl.name AS plan_name,
    pl.slug AS plan_slug,

    -- Conteo de miembros activos
    COALESCE(mc.member_count, 0)::int AS member_count,

    -- Conteo de proyectos no eliminados
    COALESCE(pc.project_count, 0)::int AS project_count,

    -- Última actividad real (de organization_activity_logs)
    al.last_activity_at

FROM organizations o
LEFT JOIN users ow ON ow.id = o.owner_id
LEFT JOIN plans pl ON pl.id = o.plan_id
LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS member_count
    FROM organization_members om
    WHERE om.organization_id = o.id
      AND om.is_active = true
) mc ON true
LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS project_count
    FROM projects p
    WHERE p.organization_id = o.id
      AND p.is_deleted = false
) pc ON true
LEFT JOIN LATERAL (
    SELECT MAX(oal.created_at) AS last_activity_at
    FROM organization_activity_logs oal
    WHERE oal.organization_id = o.id
) al ON true
WHERE o.is_deleted = false;

-- Grant access
GRANT SELECT ON public.admin_organizations_view TO authenticated;
GRANT SELECT ON public.admin_organizations_view TO service_role;
