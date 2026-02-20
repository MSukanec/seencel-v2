# Roadmap — Catalog Atlas

> Última actualización: **2026-02-19**

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
| `task_element_actions` | Nueva pivot: vincula acciones a elementos compatibles — ✅ activa con toggle en UI |
| CRUD Sistemas Constructivos | Vista admin "Sistemas" con form, soft delete, checkboxes de parámetros |
| Vista admin "Acciones" | Lista acciones + checkboxes de elementos compatibles (sin form — catálogo cerrado) |
| Vista admin "Elementos" | Lista elementos + checkboxes de sistemas aplicables |
| Eliminación de tablas deprecadas | `task_element_parameters`, `task_division_actions`, `task_division_elements` eliminadas |
| Flow documentado | 5 archivos en `.agent/flows/catalog-atlas/` actualizados al estado real |

---

## ⏳ Pendiente: Corto Plazo

### P1 — Formulario de creación de tareas paramétricas actualizado

**Prioridad**: Alta  
**Qué hacer**: El formulario `tasks-parametric-form.tsx` usa `task_element_parameters` (tabla eliminada). Debe migrar a:
1. Al seleccionar un elemento → mostrar sistemas compatibles (de `task_element_systems`)
2. Al seleccionar un sistema → cargar sus parámetros (de `task_system_parameters`)
3. Guardar `task_construction_system_id` al crear la tarea

**Archivos a modificar**:
- `src/features/tasks/forms/tasks-parametric-form.tsx`
- `src/features/tasks/queries.ts` → ya existe `getSystemParameterLinks()`

---

### P2 — View `catalog.tasks_view` incluye system_name

**Prioridad**: Media  
**Qué hacer**: Regenerar la vista incluyendo JOIN a `task_construction_systems` para agregar `system_name`, `system_slug` como columnas.  
**Script**: `DB/033_update_tasks_view.sql` (a crear).

---

### P3 — Validación de combinaciones válidas al crear tareas

**Prioridad**: Media  
**Qué hacer**: Al crear una tarea parametrizada, validar que la combinación `action_id + element_id` exista en `task_element_actions`. UI debe filtrar las acciones disponibles al seleccionar un elemento.

---

### P4 — Soft-delete para task_elements funciona con FK constraint

**Prioridad**: Media  
**Contexto**: El botón de eliminar elemento desde el frontend funciona (soft delete = `is_deleted=true`). Sin embargo, hacer hard delete desde Supabase falla si hay tareas que referencian ese elemento.  
**Documentar**: Agregar tooltip en la vista admin explicando que "eliminar" oculta el elemento pero no lo borra físicamente.

---

## 🔮 Pendiente: Largo Plazo

| Qué | Descripción |
|-----|------------|
| **Marketplace de recetas** | Recetas públicas comparables entre organizaciones, con ranking y precio promedio regional |
| **Auto-generación de código de tarea** | Sistema que genera `code` de tarea a partir de ACTION + ELEMENT + SYSTEM + PARAM_VALUES |
| **Validación de parámetros en tiempo real** | Al crear una tarea, validar que los `parameter_values` sean coherentes con `task_system_parameters.validation_rules` |
| **AI recipe batch for system** | Generar recetas masivas para todas las variantes de un sistema constructivo de una sola vez |
| **Acciones editables por admins power** | Posibilidad de que superadmins agreguen nuevas acciones desde el frontend (hoy solo desde Supabase) |
