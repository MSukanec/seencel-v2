# Technical Map — Catalog Atlas

> Referencia técnica exhaustiva. No es un tutorial.
> Última actualización: **2026-02-19** — tablas deprecadas eliminadas, nuevas pivot tables activas.

---

## 1. Tablas involucradas

### `catalog.task_actions` — Verbos del catálogo (catálogo cerrado)

| Columna | Tipo | Uso en este flow |
|---------|------|-----------------|
| id | uuid PK | FK en `catalog.tasks.task_action_id` |
| name | text UNIQUE | "Construcción", "Demolición" |
| short_code | varchar(10) | Código corto (ej: CON, DEM) |
| action_type | text | Clasificación interna |
| sort_order | int4 | Orden de presentación en UI |
| is_system | bool | Siempre true (catálogo cerrado) |

> ⚠️ **Solo lectura desde el frontend.** Sin form de creación/edición — acciones definidas por admins desde Supabase.

---

### `catalog.task_element_actions` — Qué acciones aplican a qué elemento

| Columna | Tipo | Uso en este flow |
|---------|------|-----------------|
| action_id | uuid FK → task_actions | Verbo aplicable |
| element_id | uuid FK → task_elements | Elemento compatible |

**Propósito**: Define las combinaciones válidas. No tiene sentido "Instalar un techo" (sería demoler/remover). Esta tabla filtra combinaciones válidas al crear una tarea.

> ✅ Tabla activa. Toggle desde la vista admin de Acciones.

---

### `catalog.task_elements` — Componentes físicos

| Columna | Tipo | Uso en este flow |
|---------|------|-----------------|
| id | uuid PK | FK en `catalog.tasks.task_element_id` |
| name | text | "Muro", "Losa", "Cielorraso" |
| slug | text UNIQUE | Para URLs y referencia |
| code | varchar(4) | Código corto técnico (MUR, LOS, CIE) |
| element_type | text | Clasificación del elemento |
| default_unit_id | uuid FK → units | Unidad de medida por defecto |
| is_system | bool | Si es elemento del atlas global |
| is_deleted | bool | Soft delete |

---

### `catalog.task_element_systems` — Qué sistemas aplican a qué elemento

| Columna | Tipo | Uso en este flow |
|---------|------|-----------------|
| element_id | uuid FK → task_elements | Elemento físico |
| system_id | uuid FK → task_construction_systems | Sistema aplicable |

**Propósito**: Un Muro puede ser de Mampostería cerámica, Drywall u Hormigón. Esta tabla define cuáles son válidas para cada elemento.

> ✅ Tabla activa. Toggle desde la vista admin de Elementos.

---

### `catalog.task_construction_systems` — Métodos técnicos

| Columna | Tipo | Uso en este flow |
|---------|------|-----------------|
| id | uuid PK | FK en `catalog.tasks.task_construction_system_id` |
| name | text UNIQUE | "Mampostería cerámica", "Drywall" |
| slug | text UNIQUE | Para URLs y referencia |
| code | varchar(10) | Código corto técnico |
| category | text | Agrupación de sistemas (ej: "Estructura") |
| order | int4 | Orden de presentación |
| is_deleted | bool | Soft delete |

> ✅ CRUD completo desde la vista admin de Sistemas.

---

### `catalog.task_system_parameters` — Parámetros propios de cada sistema

| Columna | Tipo | Uso en este flow |
|---------|------|-----------------|
| system_id | uuid FK → task_construction_systems | Sistema al que pertenece |
| parameter_id | uuid FK → task_parameters | Parámetro reutilizable |
| order | int4 | Orden de presentación en el formulario |
| is_required | bool | Si es obligatorio para crear una tarea de este sistema |

> ✅ Tabla activa. Toggle desde la vista admin de Sistemas.
> ✅ Reemplazó definitivamente a `task_element_parameters` (eliminada).

---

### `catalog.task_parameters` — Definiciones de parámetros

| Columna | Tipo | Uso en este flow |
|---------|------|-----------------|
| id | uuid PK | FK en `task_system_parameters` |
| slug | text | "tipo_ladrillo", "espesor" |
| label | text | Label de UI: "Tipo de Ladrillo" |
| type | text | "select", "number", "boolean", "text", "material" |
| validation_rules | jsonb | Reglas de validación |
| is_deleted | bool | Soft delete |

---

### `catalog.task_parameter_options` — Opciones de parámetros tipo select

| Columna | Tipo | Uso en este flow |
|---------|------|-----------------|
| parameter_id | uuid FK → task_parameters | Parámetro al que pertenece |
| label | text | "Hueco 18cm", "Sólido" |
| value | text | "hueco_18", "solido" |
| short_code | varchar(10) | Para auto-gen de código de tarea |
| material_id | uuid FK → materials | Mapeo directo a material (opcional) |

---

### `catalog.tasks` — Variantes del catálogo

| Columna | Tipo | Uso en este flow |
|---------|------|-----------------|
| id | uuid PK | Referenciado por recipes y construction_tasks |
| task_action_id | uuid FK → task_actions | Verbo |
| task_element_id | uuid FK → task_elements | Componente físico |
| task_construction_system_id | uuid FK → task_construction_systems | Sistema técnico ✅ |
| unit_id | uuid FK → units | Unidad de medida de la tarea |
| parameter_values | jsonb | Valores concretos de parámetros |
| is_parametric | bool | Si la tarea usa parametría |
| is_system | bool | Si es tarea global del atlas |
| status | task_catalog_status | "draft" / "published" |
| task_division_id | uuid FK → task_divisions | Rubro |

---

### `catalog.task_recipes` — Recetas de recursos

| Columna | Tipo | Uso en este flow |
|---------|------|-----------------|
| task_id | uuid FK → tasks | Tarea a la que pertenece |
| organization_id | uuid | Organización que creó la receta |
| is_public | bool | Si es pública para el marketplace |
| execution_type | text | "own" / "subcontract" |
| status | task_catalog_status | "draft" / "published" |

**Subtablas**:
- `catalog.task_recipe_materials` — materiales con cantidades y waste_percentage
- `catalog.task_recipe_labor` — tipos de MO con horas
- `catalog.task_recipe_external_services` — servicios externos (con includes_materials)
- `catalog.task_recipe_ratings` — ratings por organización

---

### Tablas eliminadas (no buscar en el código)

| Tabla | Estado | Reemplazada por |
|-------|--------|-----------------|
| `catalog.task_element_parameters` | ❌ Eliminada | `catalog.task_system_parameters` |
| `catalog.task_division_actions` | ❌ Eliminada | `catalog.task_element_actions` |
| `catalog.task_division_elements` | ❌ Eliminada | vinculación directa action→element |

---

## 2. Archivos Frontend

### Queries (`src/features/tasks/queries.ts`)

| Función | Qué hace |
|---------|---------|
| `getTaskActions()` | Todas las acciones del catálogo |
| `getTaskElements()` | Todos los elementos (no eliminados) |
| `getAllElements()` | Todos los elementos incluyendo inactivos (admin) |
| `getAllConstructionSystems()` | Todos los sistemas (admin) |
| `getTaskParameters()` | Todos los parámetros |
| `getSystemParameterLinks()` | Links system_id ↔ parameter_id |
| `getElementSystemLinks()` | Links element_id ↔ system_id |
| `getElementActionLinks()` | Links action_id ↔ element_id |
| `getCompatibleElements(actionId)` | Elementos compatibles con una acción |

### Actions (`src/features/tasks/actions.ts`)

| Función | Qué hace |
|---------|---------|
| `createConstructionSystem()` | CRUD sistema |
| `updateConstructionSystem()` | CRUD sistema |
| `deleteConstructionSystem()` | Soft delete sistema |
| `toggleSystemParameter()` | Vincula/desvincula parámetro a sistema |
| `toggleElementSystem()` | Vincula/desvincula sistema a elemento |
| `toggleElementAction()` | Vincula/desvincula acción a elemento |

### Views (admin catalog page)

| Vista | Tab | Qué gestiona |
|-------|-----|-------------|
| `TasksAccionesView` | Acciones | Lista acciones + checkboxes de elementos compatibles |
| `TasksElementsView` | Elementos | Lista elementos + checkboxes de sistemas aplicables |
| `TasksSistemasView` | Sistemas | CRUD sistemas + checkboxes de parámetros |
| `TasksParametersView` | Parámetros | CRUD parámetros + opciones |
| `TasksDivisionsView` | Rubros | CRUD rubros (divisiones) |
| `TasksCatalogView` | Tareas | Listado completo de tareas |

### Pages

| Archivo | Server fetches |
|---------|---------------|
| `src/app/[locale]/(dashboard)/admin/catalog/page.tsx` | Promise.all de 11 queries: acciones, elementos, sistemas, parámetros, links de los 3 pivots, units, divisions, materials |

---

## 3. SQL Scripts

| Archivo | Qué hace | Estado |
|---------|---------|--------|
| `DB/031_create_catalog_schema.sql` | Crea schema catalog, mueve tablas desde public | ✅ Ejecutado |
| `DB/032_create_task_system_parameters.sql` | Crea task_system_parameters + task_construction_system_id en tasks | ✅ Ejecutado |

---

## 4. Cadena de datos completa

```
auth.uid()
    → public.users.id
    → public.organization_members (org_id, role)
    → catalog.tasks (via admin o features)
        → catalog.task_actions        [clasificación: verbo]
        → catalog.task_elements       [clasificación: objeto]
        → catalog.task_construction_systems  [clasificación: método]
        → catalog.task_parameters + task_system_parameters [parametría]
        → catalog.task_recipes [recursos]
            → catalog.task_recipe_materials
            → catalog.task_recipe_labor
            → catalog.task_recipe_external_services
```
