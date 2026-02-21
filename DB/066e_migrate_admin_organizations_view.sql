-- ============================================================================
-- 066e: Drop organizations_view (unused) + Migrate admin_organizations_view to IAM
-- ============================================================================

-- 1. Drop the unused organizations_view
DROP VIEW IF EXISTS public.organizations_view;

-- 2. Drop admin_organizations_view from public
DROP VIEW IF EXISTS public.admin_organizations_view;

-- 3. Recreate in IAM schema
CREATE OR REPLACE VIEW iam.admin_organizations_view AS
SELECT o.id,
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
FROM iam.organizations o
LEFT JOIN iam.users ow ON ow.id = o.owner_id
LEFT JOIN billing.plans pl ON pl.id = o.plan_id
LEFT JOIN LATERAL (
    SELECT count(*)::integer AS member_count
    FROM iam.organization_members om
    WHERE om.organization_id = o.id AND om.is_active = true
) mc ON true
LEFT JOIN LATERAL (
    SELECT count(*)::integer AS project_count
    FROM projects.projects p
    WHERE p.organization_id = o.id AND p.is_deleted = false
) pc ON true
LEFT JOIN LATERAL (
    SELECT max(oal.created_at) AS last_activity_at
    FROM audit.organization_activity_logs oal
    WHERE oal.organization_id = o.id
) al ON true
WHERE o.is_deleted = false;


-- ============================================================================
-- 4. Migrate admin_users → iam.admin_users_view (rename for consistency)
-- ============================================================================

-- 4a. Drop from public
DROP VIEW IF EXISTS public.admin_users;

-- 4b. Create in IAM with proper name
CREATE OR REPLACE VIEW iam.admin_users_view AS
SELECT users.auth_id
FROM iam.users
WHERE users.role_id = 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid;

-- 4c. Update iam.is_admin() to use new view location
CREATE OR REPLACE FUNCTION iam.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  select exists (
    select 1
    from iam.admin_users_view au
    where au.auth_id = auth.uid()
  );
$function$;
