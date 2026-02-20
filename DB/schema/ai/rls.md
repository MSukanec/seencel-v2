# Database Schema (Auto-generated)
> Generated: 2026-02-20T14:40:38.399Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [AI] RLS Policies (6)

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
