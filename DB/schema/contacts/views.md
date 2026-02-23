# Database Schema (Auto-generated)
> Generated: 2026-02-23T12:14:47.276Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [CONTACTS] Views (1)

### `contacts.contacts_view` (🔓 INVOKER)

```sql
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
```
