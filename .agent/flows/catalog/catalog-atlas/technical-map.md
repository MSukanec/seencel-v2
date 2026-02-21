# Technical Map — Catalog Atlas

> Referencia técnica exhaustiva. No es un tutorial.
> Última actualización: **2026-02-20** — task_action_categories activa; sort_order, action_type, validation_rules, order, default_value eliminados; task_templates operativo con expression_template en parámetros.

---

## 1. Tablas involucradas

### `catalog.task_action_categories` — Categorías de intervención (NEW)

| Columna | Tipo | Uso en este flow |
|---------|------|-----------------|
| id | uuid PK | FK en `task_actions.action_category_id` |
| name | text UNIQUE | "Construcción / Ejecución", "Demolición" |
| code | varchar(20) UNIQUE | Código corto (ej: EXEC, DEMO, PROV) |
| description | text | Descripción de la categoría |
| is_system | bool | Siempre true (catálogo cerrado) |

> ⚠️ **Catálogo cerrado.** 5 categorías fijas, gestionadas desde Supabase.
> No tienen soft-delete — son invariables del sistema.

**Las 5 categorías:**
| name | code | Propósito |
|------|------|-----------|
| Construcción / Ejecución | EXEC | Materialización de elementos nuevos |
| Provisión / Suministro | PROV | Entrega/instalación de productos |
| Demolición | DEMO | Remoción o desmantelamiento |
| Limpieza / Preparación | PREP | Acondicionamiento de superficie |
| Reparación / Mantenimiento | MANT | Trabajos sobre elementos existentes |

---

### `catalog.task_actions` — Verbos técnicos del catálogo

| Columna | Tipo | Uso en este flow |
|---------|------|-----------------|
| id | uuid PK | FK en `catalog.tasks.task_action_id` |
| name | text UNIQUE | "Ejecución", "Aplicación", "Demolición" |
| short_code | varchar(10) | Código corto para auto-gen de código de tarea |
| action_category_id | uuid FK → task_action_categories | Metadato de categoría de intervención |
| is_system | bool | Siempre true (catálogo cerrado) |

> ⚠️ **Solo lectura desde el frontend.** Sin form de creación/edición — acciones definidas desde Supabase.
> Las columnas `sort_order` y `action_type` fueron **eliminadas en migración 039**.

---

### `catalog.task_element_actions` — Qué acciones aplican a qué elemento

| Columna | Tipo | Uso en este flow |
|---------|------|-----------------|
| action_id | uuid FK → task_actions | Verbo aplicable |
| element_id | uuid FK → task_elements | Elemento compatible |

**Propósito**: Define las combinaciones válidas. No tiene sentido "Instalar un Muro" (sería construir/ejecutar). Esta tabla filtra combinaciones válidas al seleccionar una acción en el wizard.

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
| expression_template | text | Template para auto-gen del nombre de tarea (ej: "de {value}") |
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
| expression_template | text | Template para auto-gen del nombre (ej: "de {value}") |
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
| id | uuid PK | FK en `task_system_parameters`, `task_template_parameters` |
| slug | text | "tipo_ladrillo", "espesor" |
| label | text | Label de UI: "Tipo de Ladrillo" |
| type | text | "select", "number", "boolean", "text", "material" |
| expression_template | text | Template para armar el nombre de la tarea (ej: "de {value}", "con {value}") |
| is_required | bool | Si es obligatorio por defecto |
| description | text | Descripción del parámetro |
| value_unit | text | Unidad del valor (ej: "cm", "mm") |
| semantic_group | text | Agrupación semántica para IA |
| affects_recipe | bool | Si este parámetro afecta la receta de recursos |
| is_deleted | bool | Soft delete |

> Las columnas `order`, `default_value` y `validation_rules` fueron **eliminadas en migración 038**.

---

### `catalog.task_parameter_options` — Opciones de parámetros tipo select

| Columna | Tipo | Uso en este flow |
|---------|------|-----------------|
| parameter_id | uuid FK → task_parameters | Parámetro al que pertenece |
| label | text | "Ladrillo cerámico hueco de 12x18x33" |
| value | text | "lch12" |
| short_code | varchar(10) | Para auto-gen de código de tarea |
| material_id | uuid FK → materials | Mapeo directo a material (opcional) |
| order | int4 | Orden de presentación |

---

### `catalog.task_templates` — Plantillas de tareas paramétricas

| Columna | Tipo | Uso en este flow |
|---------|------|-----------------|
| id | uuid PK | FK en `catalog.tasks.template_id` |
| name | text | "Ejecución de muro de mampostería cerámica" |
| task_action_id | uuid FK → task_actions | Verbo |
| task_element_id | uuid FK → task_elements | Componente físico |
| task_construction_system_id | uuid FK → task_construction_systems | Sistema técnico |
| task_division_id | uuid FK → task_divisions | Rubro (opcional) |
| unit_id | uuid FK → units | Unidad de medida |
| code | varchar(20) | Código base del template |
| status | task_catalog_status | "draft" / "published" |
| is_system | bool | Si es plantilla del atlas global |
| is_deleted | bool | Soft delete |

> ✅ CRUD desde la vista admin. El wizard paramétrico selecciona una plantilla y genera variantes.

---

### `catalog.task_template_parameters` — Parámetros de una plantilla

| Columna | Tipo | Uso en este flow |
|---------|------|-----------------|
| template_id | uuid FK → task_templates | PK compuesta |
| parameter_id | uuid FK → task_parameters | PK compuesta |
| order | int4 | Orden en el formulario del wizard |
| is_required | bool | Si es obligatorio para esta plantilla |
| default_value | text nullable | Valor por defecto para backfill al agregar un parámetro nuevo |

> Diferencia con `task_system_parameters`: los templates pueden tener un subconjunto de los parámetros del sistema, en un orden específico.
> `default_value` solo se usa para el **Patrón de Backfill** (ver sección 5).

---

### `catalog.tasks` — Variantes del catálogo

| Columna | Tipo | Uso en este flow |
|---------|------|-----------------|
| id | uuid PK | Referenciado por recipes y construction_tasks |
| task_action_id | uuid FK → task_actions | Verbo |
| task_element_id | uuid FK → task_elements | Componente físico |
| task_construction_system_id | uuid FK → task_construction_systems | Sistema técnico |
| unit_id | uuid FK → units | Unidad de medida de la tarea |
| parameter_values | jsonb | Valores concretos de parámetros |
| is_parametric | bool | Si la tarea usa parametría |
| template_id | uuid FK → task_templates | Plantilla de origen |
| is_system | bool | Si es tarea global del atlas |
| status | task_catalog_status | "draft" / "published" |
| task_division_id | uuid FK → task_divisions | Rubro |
| name | text | Nombre auto-generado |
| code | text | Código auto-generado |

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

### Columnas eliminadas

| Tabla | Columnas eliminadas | Migración |
|-------|--------------------|-----------| 
| `catalog.task_actions` | `sort_order`, `action_type` | `DB/039_clean_task_actions.sql` |
| `catalog.task_parameters` | `order`, `default_value`, `validation_rules` | `DB/038_clean_task_parameters.sql` |

---

## 2. Archivos Frontend

### Queries (`src/features/tasks/queries.ts`)

| Función | Qué hace |
|---------|---------|
| `getTaskActions()` | Todas las acciones del catálogo |
| `getTaskElements()` | Todos los elementos (no eliminados) |
| `getAllElements()` | Todos los elementos incluyendo inactivos (admin) |
| `getAllConstructionSystems()` | Todos los sistemas (admin) |
| `getTaskParameters()` | Todos los parámetros activos, ordenados por label |
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
| `createTaskParameter()` | CRUD parámetro (slug, label, type, expression_template, is_required, description) |
| `updateTaskParameter()` | CRUD parámetro |
| `toggleSystemParameter()` | Vincula/desvincula parámetro a sistema |
| `toggleElementSystem()` | Vincula/desvincula sistema a elemento |
| `toggleElementAction()` | Vincula/desvincula acción a elemento |

### Forms (relevantes para el atlas)

| Archivo | Qué gestiona |
|---------|-------------|
| `tasks-template-form.tsx` | CRUD de plantillas (action + element + system + unit + division) |
| `tasks-parameter-form.tsx` | CRUD de parámetros (label, slug auto-gen, type, expression_template, is_required, description) |
| `tasks-parametric-form.tsx` | Wizard de 3 pasos: elige plantilla → completa parámetros → confirma. Genera nombre y código con expression_template |
| `tasks-element-form.tsx` | CRUD de elementos (name, slug, code, element_type, expression_template) |
| `tasks-system-form.tsx` | CRUD de sistemas (name, slug, code, category, expression_template) |

### Views (admin catalog page)

| Vista | Tab | Qué gestiona |
|-------|-----|-------------|
| `TasksAccionesView` | Acciones | Lista acciones (con su categoría) + checkboxes de elementos compatibles |
| `TasksElementsView` | Elementos | Lista elementos + checkboxes de sistemas aplicables |
| `TasksSistemasView` | Sistemas | CRUD sistemas + checkboxes de parámetros |
| `TasksParametersView` | Parámetros | CRUD parámetros + opciones |
| `TasksDivisionsView` | Rubros | CRUD rubros (divisiones) |
| `TasksCatalogView` | Tareas | Listado completo de tareas |
| *(pendiente)* | Templates | CRUD plantillas |

### Pages

| Archivo | Server fetches |
|---------|---------------|
| `src/app/[locale]/(dashboard)/admin/catalog/page.tsx` | Promise.all de queries: acciones, elementos, sistemas, parámetros, links de los 3 pivots, units, divisions, materials |

---

## 3. SQL Scripts

| Archivo | Qué hace | Estado |
|---------|---------|--------|
| `DB/031_create_catalog_schema.sql` | Crea schema catalog, mueve tablas desde public | ✅ Ejecutado |
| `DB/032_create_task_system_parameters.sql` | Crea task_system_parameters + task_construction_system_id en tasks | ✅ Ejecutado |
| `DB/037_unique_task_template_combination.sql` | Unique constraint en task_templates | ✅ Ejecutado |
| `DB/038_clean_task_parameters.sql` | Elimina order, default_value, validation_rules de task_parameters | ✅ Ejecutado |
| `DB/039_clean_task_actions.sql` | Elimina sort_order, action_type de task_actions | ✅ Ejecutado |

---

## 4. Cadena de datos completa

```
auth.uid()
    → public.users.id
    → public.organization_members (org_id, role)
    → catalog.tasks (via admin o features)
        → catalog.task_action_categories [metadato: categoría de intervención]
        → catalog.task_actions           [verbo técnico]
        → catalog.task_elements          [componente físico]
        → catalog.task_construction_systems  [método técnico]
        → catalog.task_parameters + task_system_parameters [parametría + expression_template]
        → catalog.task_recipes [recursos]
            → catalog.task_recipe_materials
            → catalog.task_recipe_labor
            → catalog.task_recipe_external_services
```

---

## 5. Patrón de Backfill — Evolución de Parámetros

> **Problema resuelto**: cuando se agrega un parámetro nuevo a un template que ya tiene tasks generadas, ¿qué pasa con las tasks viejas?

### El principio

Las tasks son **variantes del catálogo** — su identidad se basa en la combinación de `parameter_values`. Si el template agrega un parámetro nuevo y las tasks viejas no lo tienen, se pierde la comparabilidad:

```
Task vieja: {ladrillo: LCH12, mortero: CC}              ← sin "refuerzo"
Task nueva: {ladrillo: LCH12, mortero: CC, refuerzo: false}  ← misma realidad física
→ No son comparables aunque describan lo mismo
```

### La solución: default_value + backfill

Al agregar un nuevo parámetro a `task_template_parameters`, se define su `default_value`. Ese valor se usa para **actualizar las tasks existentes del template** que no tengan ese parámetro:

```sql
-- Al agregar "refuerzo" con default_value = 'false' al template:
UPDATE catalog.tasks
SET parameter_values = parameter_values || jsonb_build_object('refuerzo', 'false')
WHERE template_id = '<template_uuid>'
  AND NOT (parameter_values ? 'refuerzo');
```

**Resultado**: las tasks viejas quedan con `{ladrillo: LCH12, mortero: CC, refuerzo: false}` — idéntico a una task nueva sin refuerzo. Se mantiene la comparabilidad.

### ¿Por qué no rompe los snapshots de obra?

Los snapshots en `construction.construction_tasks` son independientes del catálogo. Una obra que usó una task antes del backfill tiene su propio snapshot congelado. El UPDATE en `catalog.tasks.parameter_values` no toca los snapshots históricos.

### Cuándo ejecutar el backfill

El backfill **no es automático** — lo ejecuta un admin cuando agrega un parámetro estructural a un template existente. Para parámetros opcionales o de metadata, puede no ser necesario.

### Estado del mecanismo

| Componente | Estado |
|-----------|--------|
| `task_template_parameters.default_value` | ✅ Columna existe (text nullable) |
| Script/función de backfill | ⏳ Pendiente — crearlo cuando se necesite por primera vez |
| UI para triggear el backfill | 🔮 Largo plazo |
