# Database Schema (Auto-generated)
> Generated: 2026-02-26T22:25:46.213Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PROJECTS] RLS Policies (34)

### `client_portal_branding` (4 policies)

#### ACTORS SELECT CLIENT_PORTAL_BRANDING

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
iam.can_view_project(project_id)
```

#### MEMBERS INSERT CLIENT_PORTAL_BRANDING

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
iam.can_mutate_org(organization_id, 'commercial.manage'::text)
```

#### MEMBERS SELECT CLIENT_PORTAL_BRANDING

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
iam.can_view_org(organization_id, 'commercial.view'::text)
```

#### MEMBERS UPDATE CLIENT_PORTAL_BRANDING

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
iam.can_mutate_org(organization_id, 'commercial.manage'::text)
```

### `client_portal_settings` (3 policies)

#### MEMBERS INSERT CLIENT_PORTAL_SETTINGS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
iam.can_mutate_org(organization_id, 'commercial.manage'::text)
```

#### MEMBERS SELECT CLIENT_PORTAL_SETTINGS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
iam.can_view_org(organization_id, 'commercial.view'::text)
```

#### MEMBERS UPDATE CLIENT_PORTAL_SETTINGS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
iam.can_mutate_org(organization_id, 'commercial.manage'::text)
```

### `client_roles` (3 policies)

#### MEMBERS INSERT CLIENT_ROLES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
((organization_id IS NOT NULL) AND iam.can_mutate_org(organization_id, 'commercial.manage'::text))
```

#### MEMBERS SELECT CLIENT_ROLES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((organization_id IS NULL) OR iam.can_view_org(organization_id, 'commercial.view'::text))
```

#### MEMBERS UPDATE CLIENT_ROLES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((organization_id IS NOT NULL) AND iam.can_mutate_org(organization_id, 'commercial.manage'::text))
```

### `project_clients` (4 policies)

#### ACTORS SELECT PROJECT_CLIENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
iam.can_view_project(project_id)
```

#### MEMBERS INSERT PROJECT_CLIENTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
iam.can_mutate_org(organization_id, 'commercial.manage'::text)
```

#### MEMBERS SELECT PROJECT_CLIENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
iam.can_view_org(organization_id, 'commercial.view'::text)
```

#### MEMBERS UPDATE PROJECT_CLIENTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
iam.can_mutate_org(organization_id, 'commercial.manage'::text)
```

### `project_data` (4 policies)

#### ACTORS SELECT PROJECT_DATA

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
iam.can_view_project(project_id)
```

#### MEMBERS INSERT PROJECT_DATA

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
iam.can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MEMBERS SELECT PROJECT_DATA

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(iam.can_view_org(organization_id, 'projects.view'::text) OR (is_public = true))
```

#### MEMBERS UPDATE PROJECT_DATA

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
iam.can_mutate_org(organization_id, 'projects.manage'::text)
```
- **WITH CHECK**:
```sql
iam.can_mutate_org(organization_id, 'projects.manage'::text)
```

### `project_labor` (3 policies)

#### MEMBERS INSERT PROJECT_LABOR

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
iam.can_mutate_org(organization_id, 'construction.manage'::text)
```

#### MEMBERS SELECT PROJECT_LABOR

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
iam.can_view_org(organization_id, 'construction.view'::text)
```

#### MEMBERS UPDATE PROJECT_LABOR

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
iam.can_mutate_org(organization_id, 'construction.manage'::text)
```

### `project_modalities` (3 policies)

#### MEMBERS INSERT PROJECT_MODALITIES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
iam.can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MEMBERS SELECT PROJECT_MODALITIES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(iam.is_admin() OR ((is_deleted = false) AND ((organization_id IS NULL) OR iam.can_view_org(organization_id, 'projects.view'::text))))
```

#### MEMBERS UPDATE PROJECT_MODALITIES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
iam.can_mutate_org(organization_id, 'projects.manage'::text)
```
- **WITH CHECK**:
```sql
iam.can_mutate_org(organization_id, 'projects.manage'::text)
```

### `project_settings` (3 policies)

#### MEMBERS INSERT PROJECT_SETTINGS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
iam.can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MEMBERS SELECT PROJECT_SETTINGS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
iam.can_view_org(organization_id, 'projects.view'::text)
```

#### MEMBERS UPDATE PROJECT_SETTINGS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
iam.can_mutate_org(organization_id, 'projects.manage'::text)
```

### `project_types` (3 policies)

#### MEMBERS INSERT PROJECT_TYPES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
iam.can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MEMBERS SELECT PROJECT_TYPES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(iam.is_admin() OR ((is_deleted = false) AND ((organization_id IS NULL) OR iam.can_view_org(organization_id, 'projects.view'::text))))
```

#### MEMBERS UPDATE PROJECT_TYPES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
iam.can_mutate_org(organization_id, 'projects.manage'::text)
```
- **WITH CHECK**:
```sql
iam.can_mutate_org(organization_id, 'projects.manage'::text)
```

### `projects` (4 policies)

#### ACTORS SELECT PROJECTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
iam.can_view_project(id)
```

#### MEMBERS INSERT PROJECTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
iam.can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MEMBERS SELECT PROJECTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(iam.can_view_org(organization_id, 'projects.view'::text) OR (EXISTS ( SELECT 1
   FROM projects.project_data pd
  WHERE ((pd.project_id = projects.id) AND (pd.is_public = true)))))
```

#### MEMBERS UPDATE PROJECTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
iam.can_mutate_org(organization_id, 'projects.manage'::text)
```
