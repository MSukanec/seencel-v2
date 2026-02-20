# Roadmap — Catalog Atlas

> Última actualización: **2026-02-20**

---

## ✅ Completado

| Qué | Detalles |
|-----|---------|
| Schema `catalog` creado | `DB/031_create_catalog_schema.sql` ejecutado |
| Frontend migrado a `.schema('catalog')` | Todos los queries/actions de tasks, materials, labor, units actualizados |
| Introspector actualizado | `scripts/introspect-db.mjs` incluye schema catalog |
| `task_element_systems` | Tabla que vincula elementos a sistemas constructivos — ✅ activa con toggle en UI |
| `task_system_parameters` | Tabla que vincula parámetros a sistemas — ✅ activa con toggle en UI |
| `task_construction_system_id` en `catalog.tasks` | FK explícita al sistema constructivo — ✅ columna existe |
| `task_element_actions` | Pivot: vincula acciones a elementos compatibles — ✅ activa con toggle en UI |
| `task_templates` | Plantillas preconfiguradas (acción + elemento + sistema + parámetros) — ✅ CRUD operativo |
| `task_template_parameters` | Parámetros ordenados por plantilla — ✅ activo |
| `task_template_parameters.default_value` | Columna para el patrón de backfill — ✅ agregada en Supabase |
| `task_action_categories` | 5 categorías de intervención como metadato de clasificación — ✅ tabla creada en Supabase |
| `action_category_id` en `task_actions` | FK hacia `task_action_categories` — ✅ columna existe |
| CRUD Sistemas Constructivos | Vista admin "Sistemas" con form, soft delete, checkboxes de parámetros |
| CRUD Parámetros | Form refactorizado: slug auto-gen, expression_template, shared fields |
| CRUD Elementos | Form con expression_template |
| Vista admin "Acciones" | Lista acciones + checkboxes de elementos compatibles (sin form — catálogo cerrado) |
| Vista admin "Elementos" | Lista elementos + checkboxes de sistemas aplicables |
| Wizard parametrico 3 pasos | Paso 1: plantilla, Paso 2: parámetros, Paso 3: confirma con preview de nombre y código |
| expression_template en nombre de tarea | El wizard usa los templates de parámetro/elemento/sistema para armar el nombre correcto |
| Orden de parámetros desde `task_template_parameters.order` | Los parámetros se muestran en el orden correcto definido por la plantilla |
| Eliminación de columnas sin uso | `order`, `default_value`, `validation_rules` de `task_parameters`; `sort_order`, `action_type` de `task_actions` |
| Filtro soft-delete en rubros | La query de rubros en el form de plantilla ahora excluye is_deleted=true |
| **Decisión de diseño: Backfill en lugar de task_definitions** | Alternativa enterprise de versionado de definiciones evaluada y descartada — ver design-decisions.md D10 |
| Flow documentado | 5 archivos en `.agent/flows/catalog-atlas/` actualizados al estado real (esta sesión) |

---

## ⏳ Pendiente: Corto Plazo

### P1 — Vista admin de Plantillas (Templates)

**Prioridad**: Alta  
**Qué hacer**: El CRUD de plantillas existe en el form (`tasks-template-form.tsx`) pero no tiene una vista dedicada en la página de admin. Falta:
- Tab "Plantillas" en `AdminCatalogPage`
- Vista `TasksTemplatesView` que liste las plantillas con sus parámetros asociados
- Posibilidad de editar/eliminar plantillas desde esa vista

**Archivos a crear/modificar**:
- `src/features/tasks/views/tasks-templates-view.tsx` (crear)
- `src/app/[locale]/(dashboard)/admin/catalog/page.tsx` (agregar tab)

---

### P2 — Mostrar `action_category` en las vistas de acciones y tareas

**Prioridad**: Media  
**Qué hacer**: La categoría de intervención existe en la BD pero no se muestra en ninguna UI todavía. Agregar:
- Badge de categoría en la vista admin de Acciones
- Filtro por categoría en el listado de tareas del catálogo
- Metadato visible en el wizard parametrico (paso 1 de selección de plantilla)

---

### P3 — Validación de combinaciones válidas al crear tareas

**Prioridad**: Media  
**Qué hacer**: Al crear una tarea parametrizada, validar que la combinación `action_id + element_id` exista en `task_element_actions`. El wizard ya filtra por plantilla, pero no valida explícitamente las combinaciones in-wizard.

---

### P4 — Asegurar que todas las `task_actions` tengan `action_category_id` asignado

**Prioridad**: Alta (dato, no código)  
**Qué hacer**: Verificar en Supabase que las acciones del catálogo tengan su FK de categoría asignada. Si alguna está sin categoría, no aparecerá en filtros.  
**Responsable**: Usuario, desde Supabase.

---

### P5 — View `catalog.tasks_view` actualizada con nuevas columnas

**Prioridad**: Media  
**Qué hacer**: La vista SQL que expone tareas para listados debería incluir:
- `action_category_name` (JOIN a task_action_categories)
- `template_name` (JOIN a task_templates)
- `system_name` y `system_code` (si no existen ya)

**Script**: `DB/040_update_tasks_view.sql` (a crear)

---

## 🔮 Pendiente: Largo Plazo

| Qué | Descripción |
|-----|------------|
| **Marketplace de recetas** | Recetas públicas comparables entre organizaciones, con ranking y precio promedio regional |
| **Filtros por action_category en catálogo** | Filtrar tareas por categoría de intervención en la vista de cliente |
| **Dashboard de distribución de trabajo** | Gráfico que muestre % de obra por categoría (ejecución vs reparación vs provisión) |
| **AI recipe batch for system** | Generar recetas masivas para todas las variantes de un sistema constructivo de una sola vez |
| **Acciones editables por admins power** | Posibilidad de que superadmins agreguen nuevas acciones desde el frontend (hoy solo desde Supabase) |
| **Búsqueda semántica por categoría** | Motor de búsqueda que use action_category para contextualizar resultados |
