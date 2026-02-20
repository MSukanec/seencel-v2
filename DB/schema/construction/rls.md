# Database Schema (Auto-generated)
> Generated: 2026-02-20T14:40:38.399Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [CONSTRUCTION] RLS Policies (19)

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

### `quote_items` (4 policies)

#### ACTORES VEN ITEMS PRESUPUESTO DEL PROYECTO

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_project(project_id)
```

#### MIEMBROS CREAN QUOTE_ITEMS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'commercial.manage'::text)
```

#### MIEMBROS EDITAN QUOTE_ITEMS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'commercial.manage'::text)
```
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'commercial.manage'::text)
```

#### MIEMBROS VEN QUOTE_ITEMS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'commercial.view'::text)
```

### `quotes` (4 policies)

#### EXTERNOS VEN QUOTES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_project(project_id)
```

#### MIEMBROS ACTUALIZAN QUOTES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'commercial.manage'::text)
```

#### MIEMBROS CREAN QUOTES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'commercial.manage'::text)
```

#### MIEMBROS VEN QUOTES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'commercial.view'::text)
```
