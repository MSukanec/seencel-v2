-- =============================================
-- FIX: contacts_view — agregar member_role_name y external_actor_type
-- =============================================
-- La vista actual tiene is_organization_member (boolean) pero no
-- muestra qué ROL tiene ni si es un actor externo.
-- Agregamos:
--   member_role_name     → nombre del rol si es org member
--   external_actor_type  → actor_type de organization_external_actors
-- =============================================

DROP VIEW IF EXISTS contacts_view;

CREATE OR REPLACE VIEW contacts_view AS
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
    -- User info (linked)
    u.avatar_url AS linked_user_avatar_url,
    u.full_name AS linked_user_full_name,
    u.email AS linked_user_email,
    COALESCE(u.avatar_url, c.image_url) AS resolved_avatar_url,
    -- Company info
    company.full_name AS linked_company_name,
    COALESCE(company.full_name, c.company_name) AS resolved_company_name,
    -- Categories (aggregated JSON)
    COALESCE(
        (SELECT json_agg(json_build_object('id', cc.id, 'name', cc.name))
         FROM contact_category_links ccl
         JOIN contact_categories cc ON cc.id = ccl.contact_category_id
         WHERE ccl.contact_id = c.id AND cc.is_deleted = false
        ), '[]'::json
    ) AS contact_categories,
    -- Is organization member?
    (EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.user_id = c.linked_user_id
          AND om.organization_id = c.organization_id
    )) AS is_organization_member,
    -- Member role name (if org member)
    (SELECT r.name
     FROM organization_members om
     JOIN roles r ON r.id = om.role_id
     WHERE om.user_id = c.linked_user_id
       AND om.organization_id = c.organization_id
       AND om.is_active = true
     LIMIT 1
    ) AS member_role_name,
    -- External actor type (if external actor)
    (SELECT oea.actor_type
     FROM organization_external_actors oea
     WHERE oea.user_id = c.linked_user_id
       AND oea.organization_id = c.organization_id
       AND oea.is_active = true
       AND oea.is_deleted = false
     LIMIT 1
    ) AS external_actor_type
FROM contacts c
LEFT JOIN users u ON u.id = c.linked_user_id
LEFT JOIN contacts company ON company.id = c.company_id AND company.is_deleted = false
WHERE c.is_deleted = false;
