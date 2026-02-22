-- =============================================================================
-- 117: FIX contacts_view PERMISSIONS
-- =============================================================================
-- The DROP+CREATE in script 116 lost the GRANTs on the view.
-- Also, SECURITY DEFINER was wrong: it bypasses RLS on underlying tables,
-- which would expose cross-org data. Reverting to SECURITY INVOKER.
-- =============================================================================

BEGIN;

-- 1. Recreate the view as SECURITY INVOKER (safe default)
DROP VIEW IF EXISTS contacts.contacts_view;
CREATE VIEW contacts.contacts_view
  WITH (security_invoker = true)
AS
SELECT c.id,
    c.organization_id,
    c.contact_type,
    c.first_name,
    c.last_name,
    c.full_name,
    c.email,
    c.phone,
    c.company_name,
    c.company_id,
    c.location,
    c.notes,
    c.national_id,
    c.image_url,
    c.avatar_updated_at,
    c.is_local,
    c.display_name_override,
    c.linked_user_id,
    c.linked_at,
    c.sync_status,
    c.created_at,
    c.updated_at,
    c.is_deleted,
    c.deleted_at,
    u.avatar_url AS linked_user_avatar_url,
    u.full_name AS linked_user_full_name,
    u.email AS linked_user_email,
    COALESCE(u.avatar_url, c.image_url) AS resolved_avatar_url,
    company.full_name AS linked_company_name,
    COALESCE(company.full_name, c.company_name) AS resolved_company_name,
    COALESCE(( SELECT json_agg(json_build_object('id', cc.id, 'name', cc.name)) AS json_agg
           FROM (contacts.contact_category_links ccl
             JOIN contacts.contact_categories cc ON ((cc.id = ccl.contact_category_id)))
          WHERE ((ccl.contact_id = c.id) AND (cc.is_deleted = false))), '[]'::json) AS contact_categories,
    (EXISTS ( SELECT 1
           FROM iam.organization_members om
          WHERE ((om.user_id = c.linked_user_id) AND (om.organization_id = c.organization_id)))) AS is_organization_member,
    ( SELECT r.name
           FROM (iam.organization_members om
             JOIN iam.roles r ON ((r.id = om.role_id)))
          WHERE ((om.user_id = c.linked_user_id) AND (om.organization_id = c.organization_id) AND (om.is_active = true))
         LIMIT 1) AS member_role_name,
    ( SELECT oea.actor_type
           FROM iam.organization_external_actors oea
          WHERE ((oea.user_id = c.linked_user_id) AND (oea.organization_id = c.organization_id) AND (oea.is_active = true) AND (oea.is_deleted = false))
         LIMIT 1) AS external_actor_type
   FROM ((contacts.contacts c
     LEFT JOIN iam.users u ON ((u.id = c.linked_user_id)))
     LEFT JOIN contacts.contacts company ON (((company.id = c.company_id) AND (company.is_deleted = false))))
  WHERE (c.is_deleted = false);

-- 2. Restore GRANTs (lost when we DROP+CREATE'd the view)
GRANT SELECT ON contacts.contacts_view TO authenticated;
GRANT SELECT ON contacts.contacts_view TO anon;

-- 3. Also fix contact_categories SELECT to filter is_deleted
--    (found in the RLS audit — soft-deleted categories were visible)
DROP POLICY IF EXISTS "MIEMBROS VEN CONTACT_CATEGORIES" ON contacts.contact_categories;
CREATE POLICY "MIEMBROS VEN CONTACT_CATEGORIES"
  ON contacts.contact_categories
  FOR SELECT
  USING (
    (is_deleted = false)
    AND (organization_id IS NULL OR is_org_member(organization_id))
  );

COMMIT;
