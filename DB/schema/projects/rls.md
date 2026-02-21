# Database Schema (Auto-generated)
> Generated: 2026-02-21T21:03:12.424Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PROJECTS] RLS Policies (34)

### `client_roles` (3 policies)

#### MIEMBROS CREAN CLIENT_ROLES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
((organization_id IS NOT NULL) AND can_mutate_org(organization_id, 'commercial.manage'::text))
```

#### MIEMBROS EDITAN CLIENT_ROLES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((organization_id IS NOT NULL) AND can_mutate_org(organization_id, 'commercial.manage'::text))
```

#### MIEMBROS VEN CLIENT_ROLES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((organization_id IS NULL) OR can_view_org(organization_id, 'commercial.view'::text))
```

### `contact_categories` (3 policies)

#### MIEMBROS CREAN CONTACT_TYPES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'contacts.manage'::text)
```

#### MIEMBROS EDITAN CONTACT_TYPES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((organization_id IS NOT NULL) AND can_mutate_org(organization_id, 'contacts.manage'::text))
```

#### MIEMBROS VEN CONTACT_TYPES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((organization_id IS NULL) OR can_view_org(organization_id, 'contacts.view'::text))
```

### `contact_category_links` (4 policies)

#### MIEMBROS BORRAN CONTACT_TYPE_LINKS

- **Command**: DELETE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'contacts.manage'::text)
```

#### MIEMBROS CREAN CONTACT_TYPE_LINKS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'contacts.manage'::text)
```

#### MIEMBROS EDITAN CONTACT_TYPE_LINKS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'contacts.manage'::text)
```

#### MIEMBROS VEN CONTACT_TYPE_LINKS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'contacts.view'::text)
```

### `contacts` (3 policies)

#### MIEMBROS CREAN CONTACTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'contacts.manage'::text)
```

#### MIEMBROS EDITAN CONTACTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'contacts.manage'::text)
```
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'contacts.manage'::text)
```

#### MIEMBROS VEN CONTACTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(can_view_org(organization_id, 'contacts.view'::text) AND (is_deleted = false))
```

### `project_clients` (4 policies)

#### ACTORES VEN CLIENTES DEL PROYECTO

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_project(project_id)
```

#### MIEMBROS CREAN PROJECT_CLIENTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'clients.manage'::text)
```

#### MIEMBROS EDITAN PROJECT_CLIENTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'clients.manage'::text)
```

#### MIEMBROS VEN PROJECT_CLIENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'clients.view'::text)
```

### `project_data` (4 policies)

#### ACTORES VEN DATOS DEL PROYECTO

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_project(project_id)
```

#### MIEMBROS ACTUALIZAN PROJECT_DATA

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS CREAN PROJECT_DATA

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS VEN PROJECT_DATA

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(can_view_org(organization_id, 'projects.view'::text) OR (is_public = true))
```

### `project_labor` (3 policies)

#### MIEMBROS CREAN PROJECT_LABOR

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'labor.manage'::text)
```

#### MIEMBROS EDITAN PROJECT_LABOR

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'labor.manage'::text)
```

#### MIEMBROS VEN PROJECT_LABOR

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'labor.view'::text)
```

### `project_modalities` (3 policies)

#### MIEMBROS ACTUALIZAN PROJECT_MODALITIES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS CREAN PROJECT_MODALITIES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS VEN PROJECT_MODALITIES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_admin() OR ((is_deleted = false) AND ((organization_id IS NULL) OR can_view_org(organization_id, 'projects.view'::text))))
```

### `project_types` (3 policies)

#### MIEMBROS ACTUALIZAN PROJECT_TYPES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS CREAN PROJECT_TYPES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS VEN PROJECT_TYPES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_admin() OR ((is_deleted = false) AND ((organization_id IS NULL) OR can_view_org(organization_id, 'projects.view'::text))))
```

### `projects` (4 policies)

#### ACTORES VEN PROYECTOS CON ACCESO

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_project(id)
```

#### MIEMBROS CREAN PROJECTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS EDITAN PROJECTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS VEN PROJECTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(can_view_org(organization_id, 'projects.view'::text) OR (EXISTS ( SELECT 1
   FROM projects.project_data pd
  WHERE ((pd.project_id = projects.id) AND (pd.is_public = true)))))
```
