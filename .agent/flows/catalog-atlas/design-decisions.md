# Design Decisions — Catalog Atlas

> Última actualización: **2026-02-20**

---

## Decisiones de Diseño

### D1: Parámetros vinculados al Sistema Constructivo, no al Elemento

**Elegimos**: `task_system_parameters` — los parámetros son propiedades de un `task_construction_system`.

**Alternativa eliminada**: `task_element_parameters` — **fue creada inicialmente pero está eliminada de la DB.**

**Razón**: El elemento es demasiado genérico. "Muro" puede ser de distintos sistemas (mampostería, drywall, hormigón) y cada sistema tiene parámetros distintos e incomparables entre sí.  
Vincular parámetros al sistema garantiza que:
- "Revoque grueso" siempre pida `espesor` y `tipo_mortero`
- "Revoque fino" pida `espesor` y `acabado`
- "Muro" como elemento no impone ningún parámetro por sí solo

---

### D2: El Sistema Constructivo es la capa de variabilidad técnica

**Elegimos**: `task_construction_systems` como capa explícita entre Element y Task.

**Alternativa descartada**: Codificar el sistema en el nombre de la tarea o en el description.

**Razón**: Los sistemas son comparables entre organizaciones y regiones. Que "Mampostería cerámica 18cm" sea un código técnico unificado permite que dos empresas en distintas ciudades puedan benchmarkearse. Si estuviera libre en el nombre de la tarea, se generarían miles de variantes incomparables.

---

### D3: Actions como catálogo cerrado, Action Categories como metadato de clasificación

**Elegimos**: Separar en dos conceptos:
1. `task_actions` — catálogo cerrado de verbos técnicos específicos (is_system = true)
2. `task_action_categories` — 5 categorías de intervención como metadato de agrupación

**Lo que NO funcionaba antes**: Usar acciones genéricas como "Ejecución" para tareas de pintura que deberían ser "Aplicación". El sistema tenía ~4 verbos demasiado genéricos y no había forma de distinguir el **tipo de intervención** del **verbo técnico**.

**La solución**:
- Las `task_action_categories` agrupan por tipo de intervención: Construcción / Ejecución, Provisión / Suministro, Demolición, Limpieza / Preparación, Reparación / Mantenimiento.
- Las `task_actions` son los verbos específicos: "Ejecución de", "Aplicación de", "Demolición de", "Preparación de".
- La categoría no define el nombre de la tarea — la acción sí.

**Para qué sirven las categorías**: filtros, dashboards, IA, estadísticas, clasificación económica de obras.

> No hay form de creación/edición de acciones ni de categorías desde el frontend — ambas se gestionan desde Supabase.

---

### D4: task_construction_system_id directo en catalog.tasks ✅ Implementado

**Elegimos**: `catalog.tasks.task_construction_system_id` como FK explícita.

**Antes**: La columna no existía — el sistema constructivo quedaba implícito en el nombre.

**Ahora**: ✅ La columna existe (`uuid nullable FK → task_construction_systems.id`) y permite:
- Query directa sin JOINs de muchos niveles
- Índice para filtrado por sistema
- Validación de combinaciones válidas en el formulario

---

### D5: task_element_actions en lugar de task_division_actions

**Elegimos**: Vincular Acciones → Elementos (via `task_element_actions`).

**Alternativa eliminada**: `task_division_actions` — vinculaba acciones a Rubros (divisiones).

**Razón**: Las divisiones son agrupaciones transitorias de tareas, no entidades físicas. Que una acción sea válida depende del **elemento** (no del Rubro al que pertenece). "Demoler un Muro" es conceptualmente correcto; "Demoler la división 01.02" no lo es.

---

### D6: Recipes son AI-assisted, no AI-defined

**Elegimos**: La IA solo sugiere materiales y cantidades en la recipe layer. No define la clasificación ni la parametría.

**Alternativa descartada**: Modelo AI-first donde la IA define la tarea completa.

**Razón**: El atlas debe ser técnicamente determinístico. Si la IA define la clasificación, dos requests distintos podrían producir variantes incomparables. La IA es útil solo para estimar recursos (cuántos ladrillos, cuántas horas de mano de obra), donde el rango de error es tolerable.

---

### D7: Schema `catalog` separado de `public`

**Elegimos**: Mover todas las tablas de definición técnica al schema `catalog`.

**Razón**: Separación de dominios. El schema `catalog` contiene el "libro técnico" (definiciones reutilizables). El schema `public` contiene operaciones transaccionales (compras, pagos, facturas). El schema `construction` contendrá las obras y sus tareas ejecutadas.

---

### D8: expression_template en Elements, Systems y Parameters

**Elegimos**: Cada entidad de clasificación tiene su propio `expression_template` para controlar cómo contribuye al nombre auto-generado de la tarea.

**Patrón**: El template usa `{value}` como placeholder:
- Element: `"de {value}"` → "de muro"
- System: `"de {value}"` → "de mampostería cerámica"
- Parameter: `"de {value}"` → "de ladrillo cerámico 18x33", o `"con {value}"` → "con mortero cal-cemento"

**Resultado**: El wizard parametrico construye el nombre completo concatenando los templates, en vez de hardcodear "de" entre cada componente.

**Fallback**: Si no hay template definido, se usa `"de {value}"` por defecto.

---

### D9: Eliminación de columnas sin uso en task_parameters y task_actions

**Eliminamos**:
- `task_parameters.order` → el orden se maneja en `task_system_parameters.order` y `task_template_parameters.order`
- `task_parameters.default_value` → sin uso real en el sistema
- `task_parameters.validation_rules` → sin implementación en el frontend
- `task_actions.sort_order` → las acciones se muestran por nombre
- `task_actions.action_type` → reemplazado conceptualmente por `action_category_id`

**Razón**: Columnas que nunca se usaron y que contaminaban el modelo. La Regla 14 ("nada provisional") aplica retroactivamente: se limpian en cuanto se detecta que no tienen uso.

---

## Edge Cases y Gotchas

### E1: Elementos sin sistema asignado

**Escenario**: Se crea un elemento sin asociarlo a ningún sistema constructivo.

**Impacto**: El wizard parametrico no puede continuar al paso 2 sin sistema seleccionado.

**Solución actual**: El formulario requiere seleccionar un sistema al crear una tarea parametrizada.

---

### E2: Parámetros compartidos entre sistemas

**Escenario**: Dos sistemas distintos (ej: "Revoque grueso" y "Revoque fino") comparten el parámetro `espesor`.

**Impacto**: No es un problema técnico — cada sistema tiene su propia fila en `task_system_parameters` con el mismo `parameter_id`. Son independientes, con su propio `order` e `is_required` por sistema.

---

### E3: Acciones sin elementos vinculados

**Escenario**: Una acción no tiene ningún elemento vinculado en `task_element_actions`.

**Impacto**: La acción queda "libre" — no aparecerá en el wizard si se valida la combinación.

**Solución actual**: El admin debe vincular acciones a elementos desde la vista "Acciones" del catálogo de admin antes de poder crear tareas parametrizadas.

---

### E4: Action sin category asignada

**Escenario**: Una acción tiene `action_category_id = null`.

**Impacto**: La acción no aparece en filtros por categoría. Funciona para crear tareas, pero pierde metadato de clasificación.

**Solución**: Garantizar en Supabase que todas las acciones del catálogo tengan `action_category_id` asignada.

---

## Relación con otros Flows

| Flow relacionado | Cómo se conecta |
|-----------------|-----------------|
| `construction-tasks` | Las tareas de obra referencian `catalog.tasks` (con snapshot de parámetros) |
| `ai-recipe-suggester` | El AI suggester recibe el task_id + system_id para generar recetas |
| `import-system` | Las tareas se pueden importar masivamente respetando la jerarquía del atlas |
| `admin-catalog` | Los admins gestionan el atlas desde las páginas de admin |

---

### D10: Backfill en lugar de Versionado de Definiciones (task_definitions rechazada)

**Problema planteado**: al agregar un parámetro nuevo a un template que ya tiene tasks generadas, las tasks viejas no tienen ese parámetro y dejan de ser comparables con las nuevas.

Ejemplo concreto:
- Template "Ejecución de muro" tiene params: `tipo_ladrillo + tipo_mortero`
- Se agrega `refuerzo` (boolean) como nuevo parámetro
- Task vieja: `{ladrillo: LCH12, mortero: CC}` — sin `refuerzo`
- Task nueva: `{ladrillo: LCH12, mortero: CC, refuerzo: false}` — misma realidad física
- **Problema**: no son comparables en dashboards ni benchmarks aunque describan lo mismo

**Alternativa rechazada**: `catalog.task_definitions` — capa de definición técnica versionada e inmutable entre templates y tasks (propuesta al estilo SAP/Oracle).

**Por qué se rechazó**:
1. Los snapshots en `construction.construction_tasks` ya protegen el historial de obra — los cambios en el catálogo no afectan proyectos en ejecución.
2. Las tasks ya tienen `parameter_values` JSONB congelado al momento de creación.
3. La complejidad de versionar definiciones no tiene contrapartida real en el escenario actual de Seencel.
4. El versionado enterprise (SAP-style) aplica cuando hay auditoría legal, multi-tenant en versiones distintas simultáneas, y proyectos de 10+ años. Seencel no está en ese punto.

**Solución elegida: Backfill con `default_value`**:
- Se agrega `default_value text` a `task_template_parameters`.
- Al agregar un parámetro nuevo a un template, se especifica el default: `false`, `"0"`, etc.
- Un script de backfill actualiza las tasks existentes del template con ese valor:
  ```sql
  UPDATE catalog.tasks
  SET parameter_values = parameter_values || jsonb_build_object('refuerzo', 'false')
  WHERE template_id = '<uuid>'
    AND NOT (parameter_values ? 'refuerzo');
  ```
- Las tasks viejas quedan idénticas a las nuevas sin el parámetro activo → comparabilidad restaurada.
- Los snapshots históricos no se tocan.

**Cuándo revisar esta decisión**: si Seencel requiere auditoría de cambios retroactiva por tipo de obra o exigencias legales, se puede introducir `task_definitions` en ese momento sin romper el modelo actual.
