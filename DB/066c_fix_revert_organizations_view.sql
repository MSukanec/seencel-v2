-- ============================================================
-- FIX: Revert organizations_view back to public
-- ============================================================
-- The view is cross-schema (touches iam, billing) and has no
-- direct frontend references. Keeping it in public avoids
-- PostgREST schema resolution conflicts.

DROP VIEW IF EXISTS iam.organizations_view;

CREATE OR REPLACE VIEW public.organizations_view AS
SELECT o.id,
    o.name,
    o.logo_url,
    o.owner_id,
    o.plan_id,
    o.is_active,
    o.is_deleted,
    o.deleted_at,
    o.is_demo,
    o.business_mode,
    o.settings,
    o.created_at,
    o.updated_at,
    o.created_by,
    o.purchased_seats,
    p.name AS plan_name,
    p.slug AS plan_slug,
    p.features AS plan_features,
    u.full_name AS owner_name,
    u.email AS owner_email,
    ( SELECT (count(*))::integer AS count
           FROM iam.organization_members om
          WHERE ((om.organization_id = o.id) AND (om.is_active = true))) AS active_members_count
   FROM ((iam.organizations o
     LEFT JOIN billing.plans p ON ((o.plan_id = p.id)))
     LEFT JOIN iam.users u ON ((o.owner_id = u.id)));

GRANT SELECT ON public.organizations_view TO authenticated, service_role;
