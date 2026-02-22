# Database Schema (Auto-generated)
> Generated: 2026-02-22T22:05:48.801Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [CONSTRUCTION] RLS Policies (24)

### `construction_dependencies` (4 policies)

#### MIEMBROS BORRAN CONSTRUCTION_DEPENDENCIES

- **Command**: DELETE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS CREAN CONSTRUCTION_DEPENDENCIES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS EDITAN CONSTRUCTION_DEPENDENCIES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS VEN CONSTRUCTION_DEPENDENCIES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'projects.view'::text)
```

### `construction_task_material_snapshots` (3 policies)

#### MIEMBROS CREAN CONSTRUCTION_TASK_MATERIAL_SNAPSHOTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS EDITAN CONSTRUCTION_TASK_MATERIAL_SNAPSHOTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS VEN CONSTRUCTION_TASK_MATERIAL_SNAPSHOTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'projects.view'::text)
```

### `construction_tasks` (4 policies)

#### ACTORES VEN TAREAS DEL PROYECTO

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_project(project_id)
```

#### MIEMBROS CREAN CONSTRUCTION_TASKS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS EDITAN CONSTRUCTION_TASKS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS VEN CONSTRUCTION_TASKS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'projects.view'::text)
```

### `labor_insurances` (3 policies)

#### MIEMBROS CREAN LABOR_INSURANCES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'construction.manage'::text)
```

#### MIEMBROS EDITAN LABOR_INSURANCES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'construction.manage'::text)
```

#### MIEMBROS VEN LABOR_INSURANCES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'construction.view'::text)
```

### `personnel_attendees` (3 policies)

#### MIEMBROS CREAN PERSONNEL_ATTENDEES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'construction.manage'::text)
```

#### MIEMBROS EDITAN PERSONNEL_ATTENDEES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'construction.manage'::text)
```

#### MIEMBROS VEN PERSONNEL_ATTENDEES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'construction.view'::text)
```

### `site_log_types` (3 policies)

#### MIEMBROS CREAN SITE_LOG_TYPES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
(((organization_id IS NULL) AND is_admin()) OR ((organization_id IS NOT NULL) AND can_mutate_org(organization_id, 'construction.manage'::text)))
```

#### MIEMBROS EDITAN SITE_LOG_TYPES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(((organization_id IS NULL) AND is_admin()) OR ((organization_id IS NOT NULL) AND can_mutate_org(organization_id, 'construction.manage'::text)))
```

#### MIEMBROS VEN SITE_LOG_TYPES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((organization_id IS NULL) OR can_view_org(organization_id, 'construction.view'::text))
```

### `site_logs` (4 policies)

#### ACTORES VEN BITACORAS DEL PROYECTO

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_project(project_id)
```

#### MIEMBROS CREAN SITE_LOGS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'construction.manage'::text)
```

#### MIEMBROS EDITAN SITE_LOGS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'construction.manage'::text)
```

#### MIEMBROS VEN SITE_LOGS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'construction.view'::text)
```
