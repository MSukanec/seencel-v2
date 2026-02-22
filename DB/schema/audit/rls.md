# Database Schema (Auto-generated)
> Generated: 2026-02-22T15:06:00.294Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [AUDIT] RLS Policies (4)

### `changelog_entries` (3 policies)

#### ADMIN ACTUALIZA CHANGELOG

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```
- **WITH CHECK**:
```sql
is_admin()
```

#### ADMIN CREA CHANGELOG

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_admin()
```

#### USUARIOS VEN CHANGELOG PUBLICO

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_admin() OR (is_public = true))
```

### `organization_activity_logs` (1 policies)

#### MIEMBROS VEN ACTIVITY_LOGS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_admin() OR is_org_member(organization_id))
```
