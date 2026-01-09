-- Drop with CASCADE to remove dependent views (like contacts_summary_view)
DROP VIEW IF EXISTS contacts_with_relations_view CASCADE;

-- 1. Recreate Main View
CREATE OR REPLACE VIEW contacts_with_relations_view AS
SELECT 
  c.id,
  c.organization_id,
  c.first_name,
  c.last_name,
  c.full_name,
  c.email,
  c.phone,
  c.company_name,
  c.location,
  c.notes,
  c.national_id,
  c.image_url,
  -- REMOVED legacy image_bucket using
  -- REMOVED legacy image_path
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
  
  u.avatar_url as linked_user_avatar_url,
  u.full_name as linked_user_full_name,
  u.email as linked_user_email,
  
  -- Computed
  COALESCE(u.avatar_url, c.image_url) as resolved_avatar_url,

  COALESCE(
    (
      SELECT json_agg(json_build_object('id', ct.id, 'name', ct.name))
      FROM contact_type_links ctl
      JOIN contact_types ct ON ct.id = ctl.contact_type_id
      WHERE ctl.contact_id = c.id
        AND ct.is_deleted = false
    ),
    '[]'::json
  ) AS contact_types,

  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = c.linked_user_id
      AND om.organization_id = c.organization_id
  ) AS is_organization_member

FROM contacts c
LEFT JOIN users u ON u.id = c.linked_user_id
WHERE c.is_deleted = false;

GRANT SELECT ON contacts_with_relations_view TO authenticated;
GRANT SELECT ON contacts_with_relations_view TO service_role;

-- 2. Restore Dependent View (contacts_summary_view)
CREATE OR REPLACE VIEW contacts_summary_view AS
SELECT 
  c.organization_id,
  COUNT(*) AS total_contacts,
  COUNT(c.linked_user_id) AS linked_contacts,
  COUNT(CASE WHEN EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = c.linked_user_id
      AND om.organization_id = c.organization_id
  ) THEN 1 END) AS member_contacts
FROM contacts c
WHERE c.is_deleted = false
GROUP BY c.organization_id;

GRANT SELECT ON contacts_summary_view TO authenticated;
GRANT SELECT ON contacts_summary_view TO service_role;
