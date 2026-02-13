-- ============================================================================
-- Actualizar admin_organizations_view: logo_path → logo_url
-- ============================================================================
-- La vista actual aliasa o.logo_url AS logo_path.
-- Este script la recrea exponiendo la columna como logo_url directamente.
-- ============================================================================

DROP VIEW IF EXISTS public.admin_organizations_view;

CREATE VIEW public.admin_organizations_view AS
SELECT
  o.id,
  o.name,
  o.logo_url,
  o.created_at,
  o.updated_at,
  o.is_active,
  o.is_deleted,
  o.is_demo,
  o.settings,
  o.purchased_seats,
  ow.full_name AS owner_name,
  ow.email AS owner_email,
  pl.name AS plan_name,
  pl.slug AS plan_slug,
  COALESCE(mc.member_count, 0) AS member_count,
  COALESCE(pc.project_count, 0) AS project_count,
  al.last_activity_at
FROM
  organizations o
  LEFT JOIN users ow ON ow.id = o.owner_id
  LEFT JOIN plans pl ON pl.id = o.plan_id
  LEFT JOIN LATERAL (
    SELECT count(*)::integer AS member_count
    FROM organization_members om
    WHERE om.organization_id = o.id
      AND om.is_active = true
  ) mc ON true
  LEFT JOIN LATERAL (
    SELECT count(*)::integer AS project_count
    FROM projects p
    WHERE p.organization_id = o.id
      AND p.is_deleted = false
  ) pc ON true
  LEFT JOIN LATERAL (
    SELECT max(oal.created_at) AS last_activity_at
    FROM organization_activity_logs oal
    WHERE oal.organization_id = o.id
  ) al ON true
WHERE
  o.is_deleted = false;
