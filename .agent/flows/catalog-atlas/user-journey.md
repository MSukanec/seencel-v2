# User Journey — Catalog Atlas

> Tutorial paso a paso: cómo funciona el catálogo de tareas desde el punto de vista del usuario y del sistema.

---

## Escenario

**Carlos** es admin de Seencel. Su empresa quiere presupuestar obras de mampostería. Necesita que el catálogo tenga la tarea "Construcción de muro de mampostería cerámica 18cm" con todas sus variantes y con recetas de materiales y mano de obra.

---

## Paso 1: Admin define los sistemas constructivos disponibles

**Qué hace el usuario**: En el panel de admin, entra a "Catálogo → Sistemas Constructivos" y crea "Mampostería cerámica".

**Qué pasa en el backend**:
- Se inserta en `catalog.task_construction_systems` con `name`, `slug`, `code`.
- El admin asocia el sistema al elemento "Muro" via `catalog.task_element_systems` (element_id, system_id).

**Archivos frontend**:
- Query: `src/features/admin/queries.ts` → (pendiente función específica para systems)
- Action: (pendiente)

**Estado**: ⚠️ Parcialmente implementado (tabla existe, UI de gestión aún no completa)

---

## Paso 2: Admin asocia parámetros al sistema constructivo

**Qué hace el usuario**: Dentro de "Mampostería cerámica", define los parámetros que diferencian variantes:
- `tipo_ladrillo` (select: hueco 18cm, hueco 12cm, sólido, bloque)
- `espesor` (numérico, en cm)
- `tipo_mortero` (select: cal-cemento, cemento)

**Qué pasa en el backend**:
- Se insertan filas en `catalog.task_system_parameters` (system_id, parameter_id, order, is_required).
- Los parámetros (`task_parameters`) son globales y reutilizables entre sistemas.

> 🚨 **GAP ACTUAL**: La tabla `task_system_parameters` todavía NO EXISTE.  
> Hoy existe `task_element_parameters` (conceptualmente incorrecto).  
> Ver `roadmap.md` para el SQL de migración.

**Estado**: 🚧 No implementado (requiere SQL 032)

---

## Paso 3: Admin crea una tarea del catálogo

**Qué hace el usuario**: Va a "Catálogo → Tareas" y crea una nueva tarea.
Selecciona:
- **Acción**: Construcción / Ejecución (`catalog.task_actions`)
- **Elemento**: Muro (`catalog.task_elements`)
- **Sistema**: Mampostería cerámica (`catalog.task_construction_systems`) ← *aún no existe en el form*
- **Parámetros**: tipo_ladrillo = "hueco 18cm", espesor = 18, tipo_mortero = "cal-cemento"
- **Unidad**: m² (`catalog.units`)

**Qué pasa en el backend**:
- Se inserta en `catalog.tasks` con todos los FKs y `parameter_values = { tipo_ladrillo: "hueco 18cm", ... }`.
- Se puede opcionalmente vincular a `catalog.task_task_parameters` para tracking explícito de parámetros.

**Archivos frontend**:
- Query: `src/features/tasks/queries.ts` → `getTaskById`, `getTaskDivisions`, `getTaskElements`, `getTaskActions`
- Action: `src/features/tasks/actions.ts` → `createTask`, `updateTask`
- Form: `src/features/tasks/forms/tasks-parametric-form.tsx`
- Page: `src/app/[locale]/(dashboard)/admin/catalog/page.tsx`

**Estado**: ⚠️ Parcialmente funcional (system_id no se guarda en la tarea aún)

---

## Paso 4: Usuario crea una receta (AI-assisted)

**Qué hace el usuario**: Dentro de la tarea "Muro mampostería cerámica 18cm", hace clic en "Sugerir receta con IA".

**Qué pasa en el backend**:
- El AI suggester recibe: `task_id`, parámetros (tipo_ladrillo, espesor, mortero).
- El AI devuelve: lista de materiales con cantidades + lista de labor_types con horas.
- Se crea un `catalog.task_recipes` con sus `task_recipe_materials` y `task_recipe_labor`.

**Archivos frontend**:
- Prompt: `src/features/ai/prompts/recipe-suggester.ts`
- Action: `src/features/ai/ai-catalog-actions.ts`
- UI: componentes de Recipe card en `src/features/tasks/`

**Estado**: ✅ Funcional (con catalog schema)

---

## Paso 5: Organización usa la tarea en un presupuesto o en obra

**Qué hace el usuario**: Al crear una tarea de construcción en un proyecto, busca en el catálogo "muro mampostería" y selecciona esta tarea.

**Qué pasa en el backend**:
- Se hace un **snapshot** de la receta al momento de la creación (patrón Snapshot de Obra).
- La tarea de obra queda desacoplada del catálogo para que cambios futuros no afecten obras en ejecución.

**Estado**: ⚠️ Implementado parcialmente (según el skill `obra-snapshot-pattern`)

---

## Diagrama completo

```
ADMIN SETUP
┌─────────────────────────────────────────────────────────────┐
│  task_actions        task_elements     task_construction_systems
│  (Construcción)  +   (Muro)       +   (Mampostería cerámica)
│                                            │
│                                   task_system_parameters
│                                   (tipo_ladrillo, espesor)
└─────────────────────────────────────────┬───────────────────┘
                                          │
TAREA CATALOG                             ↓
┌─────────────────────────────────────────────────────────────┐
│  catalog.tasks                                              │
│  (action=Construcción, element=Muro, system=Mampostería,   │
│   param_values={ladrillo:18cm, mortero:cal-cemento})        │
└─────────────────────────────────────────┬───────────────────┘
                                          │
RECIPE LAYER (AI-assisted)               ↓
┌─────────────────────────────────────────────────────────────┐
│  catalog.task_recipes                                       │
│  ├── task_recipe_materials (ladrillo ceramic, cemento, cal) │
│  └── task_recipe_labor (Oficial albañil 0.8h, Ayudante 0.4h)│
└─────────────────────────────────────────┬───────────────────┘
                                          │ snapshot
OBRA                                      ↓
┌─────────────────────────────────────────────────────────────┐
│  construction.construction_tasks (+ snapshot de recursos)   │
└─────────────────────────────────────────────────────────────┘
```
