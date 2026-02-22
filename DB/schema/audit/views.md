# Database Schema (Auto-generated)
> Generated: 2026-02-22T20:08:16.861Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [AUDIT] Views (1)

### `audit.organization_activity_logs_view`

```sql
SELECT l.id,
    l.organization_id,
    l.member_id,
    m.user_id,
    l.action,
    l.target_table,
    l.target_id,
    l.metadata,
    l.created_at,
    u.full_name,
    u.avatar_url,
    u.email,
    r.name AS role_name
   FROM (((audit.organization_activity_logs l
     JOIN iam.organization_members m ON ((l.member_id = m.id)))
     JOIN iam.users u ON ((m.user_id = u.id)))
     LEFT JOIN iam.roles r ON ((m.role_id = r.id)))
  WHERE (l.member_id IS NOT NULL);
```
