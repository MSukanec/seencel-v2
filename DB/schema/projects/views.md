# Database Schema (Auto-generated)
> Generated: 2026-02-22T20:08:16.861Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PROJECTS] Views (7)

### `projects.contacts_summary_view`

```sql
SELECT c.organization_id,
    count(*) AS total_contacts,
    count(c.linked_user_id) AS linked_contacts,
    count(
        CASE
            WHEN (EXISTS ( SELECT 1
               FROM iam.organization_members om
              WHERE ((om.user_id = c.linked_user_id) AND (om.organization_id = c.organization_id)))) THEN 1
            ELSE NULL::integer
        END) AS member_contacts
   FROM projects.contacts c
  WHERE (c.is_deleted = false)
  GROUP BY c.organization_id;
```

### `projects.contacts_view`

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
           FROM (projects.contact_category_links ccl
             JOIN projects.contact_categories cc ON ((cc.id = ccl.contact_category_id)))
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
   FROM ((projects.contacts c
     LEFT JOIN iam.users u ON ((u.id = c.linked_user_id)))
     LEFT JOIN projects.contacts company ON (((company.id = c.company_id) AND (company.is_deleted = false))))
  WHERE (c.is_deleted = false);
```

### `projects.labor_insurance_view`

```sql
SELECT li.id,
    li.organization_id,
    li.project_id,
    li.labor_id,
    pl.contact_id,
    li.insurance_type,
    li.policy_number,
    li.provider,
    li.coverage_start,
    li.coverage_end,
    li.reminder_days,
    li.certificate_attachment_id,
    li.notes,
    li.created_by,
    li.created_at,
    li.updated_at,
    (li.coverage_end - CURRENT_DATE) AS days_to_expiry,
        CASE
            WHEN (CURRENT_DATE > li.coverage_end) THEN 'vencido'::text
            WHEN ((li.coverage_end - CURRENT_DATE) <= 30) THEN 'por_vencer'::text
            ELSE 'vigente'::text
        END AS status,
    ct.first_name AS contact_first_name,
    ct.last_name AS contact_last_name,
    COALESCE(ct.display_name_override, ct.full_name, concat(ct.first_name, ' ', ct.last_name)) AS contact_display_name,
    lt.name AS labor_type_name,
    proj.name AS project_name
   FROM ((((projects.labor_insurances li
     LEFT JOIN projects.project_labor pl ON ((pl.id = li.labor_id)))
     LEFT JOIN projects.contacts ct ON ((ct.id = pl.contact_id)))
     LEFT JOIN catalog.labor_categories lt ON ((lt.id = pl.labor_type_id)))
     LEFT JOIN projects.projects proj ON ((proj.id = li.project_id)));
```

### `projects.project_access_view`

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
     LEFT JOIN projects.contacts c ON (((c.linked_user_id = pa.user_id) AND (c.organization_id = pa.organization_id) AND (c.is_deleted = false))))
     LEFT JOIN iam.organization_members gm ON ((gm.id = pa.granted_by)))
     LEFT JOIN iam.users gm_u ON ((gm_u.id = gm.user_id)))
     LEFT JOIN projects.project_clients pc ON ((pc.id = pa.client_id)))
     LEFT JOIN projects.contacts pc_c ON ((pc_c.id = pc.contact_id)))
  WHERE (pa.is_deleted = false);
```

### `projects.project_clients_view`

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
     LEFT JOIN projects.contacts c ON ((c.id = pc.contact_id)))
     LEFT JOIN iam.users u ON ((u.id = c.linked_user_id)))
     LEFT JOIN projects.client_roles cr ON ((cr.id = pc.client_role_id)))
  WHERE (pc.is_deleted = false);
```

### `projects.project_labor_view`

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
     LEFT JOIN projects.contacts ct ON ((ct.id = pl.contact_id)))
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

### `projects.projects_view`

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
