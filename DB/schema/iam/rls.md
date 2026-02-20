# Database Schema (Auto-generated)
> Generated: 2026-02-20T00:26:33.263Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [IAM] RLS Policies (4)

### `organization_invitations` (4 policies)

#### INVITADOS VEN SU INVITACION

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text))
```

#### MIEMBROS CREAN INVITATIONS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'members.manage'::text)
```

#### MIEMBROS EDITAN INVITATIONS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'members.manage'::text)
```

#### MIEMBROS VEN INVITATIONS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'members.view'::text)
```
