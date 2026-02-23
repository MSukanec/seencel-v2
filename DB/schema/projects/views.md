# Database Schema (Auto-generated)
> Generated: 2026-02-23T12:14:47.276Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PROJECTS] Views (4)

### `projects.project_access_view` (🔓 INVOKER)

```sql
SELECT pa.id,
    pa.project_id,
    pa.organization_id,
    pa.user_id,
    pa.access_type,
    pa.access_level,
    pa.granted_by,
    pa.client_id,
    pa.is_active,
    pa.created_at,
    pa.updated_at,
    pa.is_deleted,
    u.full_name AS user_full_name,
    u.email AS user_email,
    u.avatar_url AS user_avatar_url,
    c.id AS contact_id,
    c.full_name AS contact_full_name,
    c.email AS contact_email,
    c.phone AS contact_phone,
    c.company_name AS contact_company_name,
    c.image_url AS contact_image_url,
    COALESCE(u.avatar_url, c.image_url) AS resolved_avatar_url,
    gm_u.full_name AS granted_by_name,
    pc_c.full_name AS client_name
   FROM ((((((iam.project_access pa
     LEFT JOIN iam.users u ON ((u.id = pa.user_id)))
     LEFT JOIN contacts.contacts c ON (((c.linked_user_id = pa.user_id) AND (c.organization_id = pa.organization_id) AND (c.is_deleted = false))))
     LEFT JOIN iam.organization_members gm ON ((gm.id = pa.granted_by)))
     LEFT JOIN iam.users gm_u ON ((gm_u.id = gm.user_id)))
     LEFT JOIN projects.project_clients pc ON ((pc.id = pa.client_id)))
     LEFT JOIN contacts.contacts pc_c ON ((pc_c.id = pc.contact_id)))
  WHERE (pa.is_deleted = false);
```

### `projects.project_clients_view` (🔓 INVOKER)

```sql
SELECT pc.id,
    pc.project_id,
    pc.organization_id,
    pc.contact_id,
    pc.client_role_id,
    pc.is_primary,
    pc.status,
    pc.notes,
    pc.created_at,
    pc.updated_at,
    pc.is_deleted,
    c.full_name AS contact_full_name,
    c.first_name AS contact_first_name,
    c.last_name AS contact_last_name,
    c.email AS contact_email,
    c.phone AS contact_phone,
    c.company_name AS contact_company_name,
    c.image_url AS contact_image_url,
    c.linked_user_id,
    u.avatar_url AS linked_user_avatar_url,
    COALESCE(u.avatar_url, c.image_url) AS contact_avatar_url,
    cr.name AS role_name,
    ( SELECT inv.status
           FROM iam.organization_invitations inv
          WHERE ((inv.client_id = pc.id) AND (inv.organization_id = pc.organization_id) AND (inv.status = 'pending'::text))
          ORDER BY inv.created_at DESC
         LIMIT 1) AS invitation_status,
    ( SELECT inv.id
           FROM iam.organization_invitations inv
          WHERE ((inv.client_id = pc.id) AND (inv.organization_id = pc.organization_id) AND (inv.status = 'pending'::text))
          ORDER BY inv.created_at DESC
         LIMIT 1) AS invitation_id,
    ( SELECT inv.created_at
           FROM iam.organization_invitations inv
          WHERE ((inv.client_id = pc.id) AND (inv.organization_id = pc.organization_id) AND (inv.status = 'pending'::text))
          ORDER BY inv.created_at DESC
         LIMIT 1) AS invitation_sent_at
   FROM (((projects.project_clients pc
     LEFT JOIN contacts.contacts c ON ((c.id = pc.contact_id)))
     LEFT JOIN iam.users u ON ((u.id = c.linked_user_id)))
     LEFT JOIN projects.client_roles cr ON ((cr.id = pc.client_role_id)))
  WHERE (pc.is_deleted = false);
```

### `projects.project_labor_view` (🔓 INVOKER)

```sql
SELECT pl.id,
    pl.project_id,
    pl.organization_id,
    pl.contact_id,
    pl.labor_type_id,
    pl.status,
    pl.notes,
    pl.start_date,
    pl.end_date,
    pl.created_at,
    pl.updated_at,
    pl.created_by,
    pl.updated_by,
    pl.is_deleted,
    pl.deleted_at,
    ct.first_name AS contact_first_name,
    ct.last_name AS contact_last_name,
    ct.full_name AS contact_full_name,
    COALESCE(ct.display_name_override, ct.full_name, concat(ct.first_name, ' ', ct.last_name)) AS contact_display_name,
    ct.national_id AS contact_national_id,
    ct.phone AS contact_phone,
    ct.email AS contact_email,
    ct.image_url AS contact_image_url,
    lc.name AS labor_type_name,
    lc.description AS labor_type_description,
    proj.name AS project_name,
    om_created.id AS creator_member_id,
    u_created.full_name AS creator_name,
    u_created.avatar_url AS creator_avatar_url,
    (EXISTS ( SELECT 1
           FROM media_links ml
          WHERE (ml.contact_id = ct.id))) AS contact_has_attachments,
    COALESCE(payment_stats.total_payments, 0) AS total_payments_count,
    COALESCE(payment_stats.total_amount, (0)::numeric) AS total_amount_paid
   FROM ((((((projects.project_labor pl
     LEFT JOIN contacts.contacts ct ON ((ct.id = pl.contact_id)))
     LEFT JOIN catalog.labor_categories lc ON ((lc.id = pl.labor_type_id)))
     LEFT JOIN projects.projects proj ON ((proj.id = pl.project_id)))
     LEFT JOIN iam.organization_members om_created ON ((om_created.id = pl.created_by)))
     LEFT JOIN iam.users u_created ON ((u_created.id = om_created.user_id)))
     LEFT JOIN LATERAL ( SELECT (count(*))::integer AS total_payments,
            sum(lp.amount) AS total_amount
           FROM finance.labor_payments lp
          WHERE ((lp.labor_id = pl.id) AND ((lp.is_deleted = false) OR (lp.is_deleted IS NULL)) AND (lp.status = 'confirmed'::text))) payment_stats ON (true))
  WHERE (pl.is_deleted = false);
```

### `projects.projects_view` (🔓 INVOKER)

```sql
SELECT p.id,
    p.name,
    p.code,
    p.status,
    p.created_at,
    p.updated_at,
    p.last_active_at,
    p.is_active,
    p.is_deleted,
    p.deleted_at,
    p.organization_id,
    p.created_by,
    p.color,
    p.is_over_limit,
    p.image_url,
    p.image_palette,
    p.project_type_id,
    p.project_modality_id,
    COALESCE(pst.use_custom_color, false) AS use_custom_color,
    pst.custom_color_h,
    pst.custom_color_hex,
    COALESCE(pst.use_palette_theme, false) AS use_palette_theme,
    pd.is_public,
    pd.city,
    pd.country,
    pt.name AS project_type_name,
    pm.name AS project_modality_name
   FROM ((((projects.projects p
     LEFT JOIN projects.project_data pd ON ((pd.project_id = p.id)))
     LEFT JOIN projects.project_settings pst ON ((pst.project_id = p.id)))
     LEFT JOIN projects.project_types pt ON (((pt.id = p.project_type_id) AND (pt.is_deleted = false))))
     LEFT JOIN projects.project_modalities pm ON (((pm.id = p.project_modality_id) AND (pm.is_deleted = false))))
  WHERE (p.is_deleted = false);
```
