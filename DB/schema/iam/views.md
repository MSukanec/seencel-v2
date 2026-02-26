# Database Schema (Auto-generated)
> Generated: 2026-02-26T15:52:15.290Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [IAM] Views (6)

### `iam.admin_organizations_view` (🔓 INVOKER)

```sql
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
   FROM (((((iam.organizations o
     LEFT JOIN iam.users ow ON ((ow.id = o.owner_id)))
     LEFT JOIN billing.plans pl ON ((pl.id = o.plan_id)))
     LEFT JOIN LATERAL ( SELECT (count(*))::integer AS member_count
           FROM iam.organization_members om
          WHERE ((om.organization_id = o.id) AND (om.is_active = true))) mc ON (true))
     LEFT JOIN LATERAL ( SELECT (count(*))::integer AS project_count
           FROM projects.projects p
          WHERE ((p.organization_id = o.id) AND (p.is_deleted = false))) pc ON (true))
     LEFT JOIN LATERAL ( SELECT max(oal.created_at) AS last_activity_at
           FROM audit.organization_activity_logs oal
          WHERE (oal.organization_id = o.id)) al ON (true))
  WHERE (o.is_deleted = false);
```

### `iam.admin_users_view` (🔓 INVOKER)

```sql
SELECT users.auth_id
   FROM iam.users
  WHERE (users.role_id = 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid);
```

### `iam.organization_member_details` (🔓 INVOKER)

```sql
SELECT om.id AS member_id,
    om.organization_id,
    om.user_id,
    om.role_id,
    om.is_active,
    om.joined_at,
    om.invited_by,
    u.full_name,
    u.email,
    u.avatar_url
   FROM (iam.organization_members om
     JOIN iam.users u ON ((om.user_id = u.id)));
```

### `iam.organization_members_full_view` (🔓 INVOKER)

```sql
SELECT om.id,
    om.user_id,
    om.organization_id,
    om.role_id,
    om.is_active,
    om.is_billable,
    om.is_over_limit,
    om.joined_at,
    om.last_active_at,
    om.invited_by,
    om.created_at,
    om.updated_at,
    u.full_name AS user_full_name,
    u.email AS user_email,
    u.avatar_url AS user_avatar_url,
    r.id AS role_id_ref,
    r.name AS role_name,
    r.type AS role_type
   FROM ((iam.organization_members om
     LEFT JOIN iam.users u ON ((om.user_id = u.id)))
     LEFT JOIN iam.roles r ON ((om.role_id = r.id)));
```

### `iam.organization_online_users` (🔓 INVOKER)

```sql
SELECT up.organization_id AS org_id,
    up.user_id,
    up.last_seen_at,
    ((now() - up.last_seen_at) <= '00:01:30'::interval) AS is_online
   FROM iam.user_presence up;
```

### `iam.users_public_profile_view` (🔓 INVOKER)

```sql
SELECT users.id,
    users.full_name,
    users.avatar_url,
    users.role_id
   FROM iam.users;
```
