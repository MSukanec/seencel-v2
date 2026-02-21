# Database Schema (Auto-generated)
> Generated: 2026-02-21T13:42:37.043Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [CATALOG] RLS Policies (53)

### `labor_categories` (3 policies)

#### MIEMBROS CREAN LABOR_CATEGORIES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
((is_system = false) AND can_mutate_org(organization_id, 'labor.manage'::text))
```

#### MIEMBROS EDITAN LABOR_CATEGORIES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((is_system = false) AND can_mutate_org(organization_id, 'labor.manage'::text))
```

#### MIEMBROS VEN LABOR_CATEGORIES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((is_system = true) OR can_view_org(organization_id, 'labor.view'::text))
```

### `labor_levels` (2 policies)

#### ADMINS GESTIONAN LABOR_LEVELS

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```
- **WITH CHECK**:
```sql
is_admin()
```

#### TODOS VEN LABOR_LEVELS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `labor_prices` (4 policies)

#### MIEMBROS BORRAN LABOR_PRICES

- **Command**: DELETE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'tasks.manage'::text)
```

#### MIEMBROS CREAN LABOR_PRICES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'tasks.manage'::text)
```

#### MIEMBROS EDITAN LABOR_PRICES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'tasks.manage'::text)
```

#### MIEMBROS VEN LABOR_PRICES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'tasks.view'::text)
```

### `labor_roles` (2 policies)

#### ADMINS GESTIONAN LABOR_ROLES

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```
- **WITH CHECK**:
```sql
is_admin()
```

#### TODOS VEN LABOR_ROLES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `labor_types` (2 policies)

#### ADMINS GESTIONAN LABOR_TYPES

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```
- **WITH CHECK**:
```sql
is_admin()
```

#### TODOS VEN LABOR_TYPES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `material_categories` (3 policies)

#### ADMIN ACTUALIZA MATERIAL_CATEGORIES

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

#### ADMIN CREA MATERIAL_CATEGORIES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_admin()
```

#### TODOS VEN MATERIAL_CATEGORIES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `materials` (3 policies)

#### MIEMBROS CREAN MATERIALS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
(((organization_id IS NOT NULL) AND can_mutate_org(organization_id, 'materials.manage'::text)) OR ((organization_id IS NULL) AND (is_system = true) AND is_admin()))
```

#### MIEMBROS EDITAN MATERIALS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(((organization_id IS NOT NULL) AND can_mutate_org(organization_id, 'materials.manage'::text)) OR ((is_system = true) AND is_admin()))
```

#### MIEMBROS VEN MATERIALS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(((organization_id IS NULL) AND (is_system = true)) OR can_view_org(organization_id, 'materials.view'::text))
```

### `task_actions` (2 policies)

#### ADMINS GESTIONAN TASK_KIND

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### TODOS VEN TASK_KIND

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `task_divisions` (3 policies)

#### MIEMBROS CREAN TASK_DIVISIONS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
(((is_system = true) AND is_admin()) OR ((is_system = false) AND can_mutate_org(organization_id, 'projects.manage'::text)))
```

#### MIEMBROS EDITAN TASK_DIVISIONS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(((is_system = true) AND is_admin()) OR ((is_system = false) AND can_mutate_org(organization_id, 'projects.manage'::text)))
```

#### MIEMBROS VEN TASK_DIVISIONS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((is_system = true) OR can_view_org(organization_id, 'projects.view'::text))
```

### `task_element_actions` (2 policies)

#### ADMINS GESTIONAN TASK_KIND_ELEMENTS

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### TODOS VEN TASK_KIND_ELEMENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `task_elements` (2 policies)

#### ADMINS GESTIONAN TASK_ELEMENTS

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### TODOS VEN TASK_ELEMENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `task_parameter_options` (2 policies)

#### ADMINS GESTIONAN TASK_PARAMETER_OPTIONS

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### TODOS VEN TASK_PARAMETER_OPTIONS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `task_parameters` (2 policies)

#### ADMINS GESTIONAN TASK_PARAMETERS

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### TODOS VEN TASK_PARAMETERS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `task_recipe_labor` (3 policies)

#### MIEMBROS CREAN TASK_RECIPE_LABOR

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS EDITAN TASK_RECIPE_LABOR

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS VEN TASK_RECIPE_LABOR

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'projects.view'::text)
```

### `task_recipe_materials` (3 policies)

#### MIEMBROS CREAN TASK_RECIPE_MATERIALS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS EDITAN TASK_RECIPE_MATERIALS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS VEN TASK_RECIPE_MATERIALS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'projects.view'::text)
```

### `task_recipes` (3 policies)

#### MIEMBROS CREAN TASK_RECIPES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS EDITAN TASK_RECIPES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS VEN TASK_RECIPES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(can_view_org(organization_id, 'projects.view'::text) OR ((is_public = true) AND (is_deleted = false)))
```

### `task_template_parameters` (2 policies)

#### ADMINS GESTIONAN TASK_TEMPLATE_PARAMETERS

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```
- **WITH CHECK**:
```sql
is_admin()
```

#### TODOS VEN TASK_TEMPLATE_PARAMETERS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `task_templates` (2 policies)

#### ADMINS GESTIONAN TASK_TEMPLATES

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```
- **WITH CHECK**:
```sql
is_admin()
```

#### TODOS VEN TASK_TEMPLATES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_deleted = false)
```

### `tasks` (3 policies)

#### MIEMBROS ACTUALIZAN TASKS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(((is_system = false) AND can_mutate_org(organization_id, 'tasks.manage'::text)) OR ((is_system = true) AND is_admin()))
```

#### MIEMBROS CREAN TASKS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
(((is_system = false) AND can_mutate_org(organization_id, 'tasks.manage'::text)) OR ((is_system = true) AND is_admin()))
```

#### MIEMBROS VEN TASKS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(((is_system = true) AND (is_admin() OR ((status <> 'draft'::task_catalog_status) AND (is_deleted = false)))) OR ((is_system = false) AND can_view_org(organization_id, 'tasks.view'::text)))
```

### `unit_categories` (2 policies)

#### ADMINS GESTIONAN UNIT_CATEGORIES

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```
- **WITH CHECK**:
```sql
is_admin()
```

#### TODOS VEN UNIT_CATEGORIES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `units` (3 policies)

#### MIEMBROS CREAN UNITS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
(((is_system = true) AND is_admin()) OR ((is_system = false) AND is_org_member(organization_id)))
```

#### MIEMBROS EDITAN UNITS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(((is_system = true) AND is_admin()) OR ((is_system = false) AND is_org_member(organization_id)))
```

#### TODOS VEN UNITS SISTEMA O DE SU ORG

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((is_system = true) OR is_org_member(organization_id) OR is_admin())
```
