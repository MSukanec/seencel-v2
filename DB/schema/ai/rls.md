# Database Schema (Auto-generated)
> Generated: 2026-03-20T17:04:16.493Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [AI] RLS Policies (12)

### `ai_import_mapping_patterns` (3 policies)

#### MIEMBROS CREAN IMPORT_PATTERNS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_org_member(organization_id)
```

#### MIEMBROS EDITAN IMPORT_PATTERNS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_org_member(organization_id)
```

#### MIEMBROS VEN IMPORT_PATTERNS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `ai_import_value_patterns` (3 policies)

#### MIEMBROS CREAN VALUE_PATTERNS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_org_member(organization_id)
```

#### MIEMBROS EDITAN VALUE_PATTERNS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_org_member(organization_id)
```

#### TODOS VEN VALUE_PATTERNS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `ai_organization_usage_limits` (3 policies)

#### MEMBERS INSERT AI_ORGANIZATION_USAGE_LIMITS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {authenticated}
- **WITH CHECK**:
```sql
iam.is_org_member(organization_id)
```

#### MEMBERS SELECT AI_ORGANIZATION_USAGE_LIMITS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
iam.can_view_org(organization_id, 'organization.view'::text)
```

#### MEMBERS UPDATE AI_ORGANIZATION_USAGE_LIMITS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {authenticated}
- **USING**:
```sql
iam.is_org_member(organization_id)
```

### `ai_usage_logs` (3 policies)

#### MEMBERS INSERT AI_USAGE_LOGS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {authenticated}
- **WITH CHECK**:
```sql
is_org_member(organization_id)
```

#### MEMBERS SELECT AI_USAGE_LOGS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
iam.can_view_org(organization_id, 'organization.view'::text)
```

#### MEMBERS UPDATE AI_USAGE_LOGS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {authenticated}
- **USING**:
```sql
is_org_member(organization_id)
```
