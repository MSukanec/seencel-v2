# User Journey — Catalog Atlas

> Tutorial paso a paso: cómo funciona el catálogo de tareas desde el punto de vista del usuario y del sistema.
> Última actualización: **2026-02-20** — TODO el flujo ahora está implementado y operativo.

---

## Escenario

**Carlos** es admin de Seencel. Su empresa quiere presupuestar obras de mampostería. Necesita que el catálogo tenga la tarea "Ejecución de muro de mampostería cerámica hueca de ladrillo cerámico hueco de 12x18x33 con cal y cemento" con todas sus variantes y con recetas de materiales y mano de obra.

---

## Paso 0 (sistema): Las categorías y acciones existen en el catálogo

Las `task_action_categories` y `task_actions` son catálogos cerrados gestionados desde Supabase.

**Las 5 categorías disponibles:**
- Construcción / Ejecución
- Provisión / Suministro
- Demolición
- Limpieza / Preparación
- Reparación / Mantenimiento

Cada `task_action` (ej: "Ejecución de") tiene su `action_category_id` asignada y su `short_code` (ej: "EJE").

---

## Paso 1: Admin define los sistemas constructivos disponibles

**Qué hace el usuario**: En `Admin → Catálogo → Sistemas Constructivos`, crea "Mampostería cerámica hueca".

**Qué pasa en el backend**:
- Se inserta en `catalog.task_construction_systems` con `name`, `slug`, `code`, `expression_template`.
- El admin asocia el sistema al elemento "Muro" via el toggle en la vista de Elementos (`catalog.task_element_systems`).

**Archivos frontend**:
- Form: `src/features/tasks/forms/tasks-system-form.tsx`
- Action: `src/features/tasks/actions.ts` → `createConstructionSystem()`, `updateConstructionSystem()`
- Query: `src/features/tasks/queries.ts` → `getAllConstructionSystems()`

**Estado**: ✅ Implementado y operativo

---

## Paso 2: Admin define los parámetros y los asocia al sistema

**Qué hace el usuario**:
1. En `Admin → Catálogo → Parámetros`, crea los parámetros reutilizables:
   - "Tipo de Ladrillos / Bloques" (slug: `tipo_ladrillo`, type: `select`, expression_template: `de {value}`)
   - "Tipo de Mortero" (slug: `tipo_mortero`, type: `select`, expression_template: `con {value}`)
2. En `Admin → Catálogo → Sistemas Constructivos`, dentro de "Mampostería cerámica", activa esos parámetros con el toggle.

**Qué pasa en el backend**:
- Se insertan filas en `catalog.task_parameters` (reutilizables entre sistemas).
- Se insertan filas en `catalog.task_system_parameters` (system_id, parameter_id, order, is_required).
- Los `expression_template` de los parámetros controlan cómo se arma el nombre de la tarea.

**Archivos frontend**:
- Form: `src/features/tasks/forms/tasks-parameter-form.tsx`
- Action: `src/features/tasks/actions.ts` → `createTaskParameter()`, `updateTaskParameter()`
- Query: `src/features/tasks/queries.ts` → `getTaskParameters()`, `getSystemParameterLinks()`

**Estado**: ✅ Implementado y operativo

---

## Paso 3: Admin crea una plantilla de tarea

**Qué hace el usuario**: En `Admin → Catálogo → Plantillas`, crea una plantilla llamada "Ejecución de muro de mampostería cerámica hueca".

Selecciona:
- **Acción**: Ejecución de (`catalog.task_actions`)
- **Elemento**: Muro (`catalog.task_elements`)
- **Sistema**: Mampostería cerámica hueca (`catalog.task_construction_systems`)
- **Rubro**: Albañilerías y Mamposterías (`catalog.task_divisions`, opcional)
- **Unidad**: m²

La plantilla auto-genera su nombre y código base: `EJE-MUR-MCH`.

Y luego asigna qué parámetros del sistema aplican a esta plantilla, en qué orden (`catalog.task_template_parameters`).

**Archivos frontend**:
- Form: `src/features/tasks/forms/tasks-template-form.tsx`
- Page: `src/app/[locale]/(dashboard)/admin/catalog/page.tsx`

**Estado**: ✅ Implementado y operativo

---

## Paso 4: Usuario crea una tarea parametrizada usando la plantilla

**Qué hace el usuario**: En `Admin → Catálogo → Tareas → Nueva tarea parametrizada`.

El wizard de 3 pasos:
1. **Elige plantilla**: selecciona "Ejecución de muro de mampostería cerámica hueca"
2. **Completa parámetros**: 
   - Tipo de Ladrillos: "Ladrillo cerámico hueco de 12x18x33" → code: LCH12
   - Tipo de Mortero: "Cal y cemento" → code: CC
3. **Confirma** y ve el preview:
   - **Nombre**: "Ejecución de muro de mampostería cerámica hueca de ladrillo cerámico hueco de 12x18x33 con cal y cemento"
   - **Código**: EJE-MUR-MCH-LCH12-CC

**Cómo se arma el nombre**:
```
[Acción: "Ejecución de"] + [Elemento template: "muro de"] + [Sistema template: "mampostería cerámica hueca"]
+ [Param 1 expression_template: "de ladrillo cerámico hueco de 12x18x33"]
+ [Param 2 expression_template: "con cal y cemento"]
```

**Qué pasa en el backend**:
- Se inserta en `catalog.tasks` con `task_action_id`, `task_element_id`, `task_construction_system_id`, `template_id`, `parameter_values = { tipo_ladrillo: "LCH12", tipo_mortero: "CC" }`, `name`, `code`.

**Archivos frontend**:
- Form: `src/features/tasks/forms/tasks-parametric-form.tsx`
- Action: `src/features/tasks/actions.ts` → `createTask()`

**Estado**: ✅ Implementado y operativo

---

## Paso 5: Admin o IA crea una receta (AI-assisted)

**Qué hace el usuario**: Dentro de la tarea, hace clic en "Sugerir receta con IA" o crea la receta manualmente.

**Qué pasa en el backend**:
- El AI suggester recibe: `task_id`, parámetros, system.
- El AI devuelve: lista de materiales con cantidades + lista de labor_types con horas.
- Se crea un `catalog.task_recipes` con sus `task_recipe_materials`, `task_recipe_labor` y opcionalmente `task_recipe_external_services`.

**Estado**: ✅ Funcional (con catalog schema)

---

## Paso 6: Organización usa la tarea en un presupuesto o en obra

**Qué hace el usuario**: Al crear una tarea de construcción en un proyecto, busca en el catálogo "muro mampostería" y selecciona esta tarea.

**Qué pasa en el backend**:
- Se hace un **snapshot** de la receta al momento de la creación (patrón Snapshot de Obra).
- La tarea de obra queda desacoplada del catálogo para que cambios futuros no afecten obras en ejecución.

**Estado**: ✅ Implementado (ver skill `obra-snapshot-pattern`)

---

## Diagrama completo

```
ADMIN SETUP
┌─────────────────────────────────────────────────────────────────────┐
│  task_action_categories                                             │
│  (Construcción / Ejecución, Demolición, etc.)                       │
│           │                                                         │
│  task_actions          task_elements     task_construction_systems  │
│  (Ejecución de)    +   (Muro)       +   (Mampostería cerámica)     │
│     action_category_id ↑               expression_template per sys │
│                                                │                    │
│                                   task_system_parameters            │
│                                   (tipo_ladrillo, tipo_mortero)     │
│                                   (con expression_template)         │
│                                                │                    │
│                                   task_template_parameters          │
│                                   (subset ordenado de params)       │
│                                                │                    │
│                                   task_templates                    │
│                                   (EJE + MUR + MCH → EJE-MUR-MCH)  │
└────────────────────────────────────┬────────────────────────────────┘
                                     │  wizard parametrico
TAREA CATALOG                        ↓
┌─────────────────────────────────────────────────────────────────────┐
│  catalog.tasks                                                      │
│  (action=Ejecución, element=Muro, system=Mampostería cerámica,     │
│   param_values={ladrillo:LCH12, mortero:CC},                       │
│   name="Ejecución de muro de mampostería cerámica hueca...",       │
│   code="EJE-MUR-MCH-LCH12-CC")                                     │
└────────────────────────────────────┬────────────────────────────────┘
                                     │
RECIPE LAYER (AI-assisted)          ↓
┌─────────────────────────────────────────────────────────────────────┐
│  catalog.task_recipes                                               │
│  ├── task_recipe_materials (ladrillo cerámico, cemento, cal)        │
│  ├── task_recipe_labor (Oficial albañil 0.8h, Ayudante 0.4h)       │
│  └── task_recipe_external_services (opcional)                       │
└────────────────────────────────────┬────────────────────────────────┘
                                     │ snapshot
OBRA                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│  construction.construction_tasks (+ snapshot de recursos)           │
└─────────────────────────────────────────────────────────────────────┘
```
