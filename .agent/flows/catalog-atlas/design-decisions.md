# Design Decisions — Catalog Atlas

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

### D3: Actions como catálogo cerrado

**Elegimos**: Catálogo cerrado de ~6 acciones sistema (`is_system = true`).

**Alternativa descartada**: Permitir que cada organización defina sus propias acciones.

**Razón**: La acción es el verbo técnico. "Construcción", "Demolición", "Reparación" son universales. Permitir variantes libres destruiría la comparabilidad del atlas. Las organizaciones pueden tener tareas con cualquier combinación, pero los verbos deben ser los mismos.

> No hay form de creación/edición de acciones desde el frontend — se gestionan directamente en Supabase.

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

## Edge Cases y Gotchas

### E1: Elementos sin sistema asignado

**Escenario**: Se crea un elemento sin asociarlo a ningún sistema constructivo.

**Impacto**: Técnicamente posible (la FK es nullable en tasks), pero genera tareas "sin sistema" = no comparables.

**Solución futura**: Validación en el formulario de creación de tareas que exija seleccionar un sistema cuando el elemento tiene sistemas disponibles.

---

### E2: Parámetros compartidos entre sistemas

**Escenario**: Dos sistemas distintos (ej: "Revoque grueso" y "Revoque fino") comparten el parámetro `espesor`.

**Impacto**: No es un problema técnico — cada sistema tiene su propia fila en `task_system_parameters` con el mismo `parameter_id`. Son independientes.

**Solución**: No hace falta nada. La tabla `task_system_parameters` permite que el mismo `parameter_id` aparezca para múltiples sistemas, con su propio `order` e `is_required` por sistema.

---

### E3: Acciones aplicables sin restricción si no hay elementos vinculados

**Escenario**: Una acción no tiene ningún elemento vinculado en `task_element_actions`.

**Impacto**: La acción queda "libre" — no hay forma de crear tareas con esa acción si la aplicación valida la combinación.

**Solución actual**: El admin debe vincular acciones a elementos desde la vista "Acciones" del catálogo de admin antes de poder crear tareas parametrizadas.

---

## Relación con otros Flows

| Flow relacionado | Cómo se conecta |
|-----------------|-----------------|
| `construction-tasks` | Las tareas de obra referencian `catalog.tasks` (con snapshot de parámetros) |
| `ai-recipe-suggester` | El AI suggester recibe el task_id + system_id para generar recetas |
| `import-system` | Las tareas se pueden importar masivamente respetando la jerarquía del atlas |
| `admin-catalog` | Los admins gestionan el atlas desde las páginas de admin |
