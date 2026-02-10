# Feature: Tasks — Catálogo Técnico de Tareas de Construcción

> Última actualización: 2026-02-09
>
> Para la definición conceptual de qué es una tarea, ver [CONCEPT.md](./CONCEPT.md)

---

## 🎯 Propósito

El módulo de **Tareas** es el catálogo técnico central de Seencel. Define las actividades constructivas que una organización puede ejecutar en sus proyectos. Cada tarea encapsula:

- **Identidad**: nombre, código, descripción, unidad de medida
- **Clasificación**: categoría/rubro (division), acción (action), elemento constructivo (element)
- **Sistema Constructivo** *(futuro)*: técnica con la que se ejecuta (mampostería, steel frame, etc.)
- **Receta**: materiales y mano de obra necesarios para ejecutar la tarea
- **Parámetros**: variables configurables que permiten generar variantes automáticas (futuro)

El catálogo opera en dos niveles:
1. **Sistema**: tareas universales creadas por administradores, visibles para todas las organizaciones
2. **Organización**: tareas propias creadas por cada empresa, visibles solo dentro de ella

---

## 📊 Estado Actual — Auditoría Febrero 2026

### Inventario de Código

| Categoría | Archivos | Detalle |
|-----------|----------|---------|
| **Server Actions** | `actions.ts` | 51 funciones (1454 líneas) |
| **Queries** | `queries.ts` | 27 funciones (687 líneas) |
| **Types** | `types.ts` | 16 interfaces + 3 schemas Zod (264 líneas) |
| **Views** | 11 archivos | Catálogo, Detalle (General + Receta), Divisiones, Elementos, Parámetros |
| **Forms** | 10 archivos | Task, Division, Element, Parameter, Option, Material, Labor, Parametric, Creation Selector |
| **Components** | 5 archivos | Catalog, Sidebar (Divisions + Elements), Combobox, CheckboxGrid |

### Tablas en Base de Datos

| Tabla | Propósito | Estado |
|-------|-----------|--------|
| `tasks` | Tareas individuales | ✅ Funcional, con import_batch_id |
| `tasks_view` | Vista con unit_name y division_name | ✅ Funcional |
| `task_divisions` | Rubros/categorías de sistema | ✅ Funcional, con RLS |
| `task_actions` | Acciones (Ejecución, Instalación, etc.) | ✅ Funcional, con RLS |
| `task_elements` | Elementos constructivos (Contrapiso, Muro, etc.) | ✅ Funcional |
| `task_parameters` | Parámetros configurables (espesor, superficie, etc.) | ✅ Funcional |
| `task_parameter_options` | Opciones predefinidas para parámetros tipo select | ✅ Funcional |
| `task_task_parameters` | Relación N:N tarea ↔ parámetro | ✅ Funcional |
| `task_materials` | **Receta directa**: materiales de una tarea (1:1) | ✅ Funcional |
| `task_labor` | **Receta directa**: mano de obra de una tarea (1:1) | ✅ Funcional |
| `task_recipes` | **Receta enriquecida**: contenedor 1:N por organización | ⚠️ Backend listo, UI sin conectar |
| `task_recipe_items` | Items de una receta enriquecida | ⚠️ Backend listo, UI sin conectar |
| `task_recipe_ratings` | Calificaciones de recetas (1-5 estrellas) | ⚠️ Backend listo, UI sin conectar |
| `task_recipes_view` | Vista con datos resueltos de recetas | ⚠️ Existe |
| `task_division_elements` | Compatibilidad: rubro ↔ elementos | ✅ Funcional |
| `task_division_actions` | Compatibilidad: rubro ↔ acciones | ✅ Funcional |
| `task_element_actions` | Compatibilidad: acción ↔ elementos | ✅ Funcional |
| `task_element_parameters` | Compatibilidad: elemento ↔ parámetros | ✅ Funcional |
| `task_construction_systems` | Sistemas constructivos (Mampostería, Steel Frame, etc.) | ⚠️ SQL listo, pendiente ejecución |
| `task_element_systems` | Compatibilidad: elemento ↔ sistema constructivo | ⚠️ SQL listo, pendiente ejecución |
| `task_costs_view` | Vista de costos (placeholder) | ⚠️ Esqueleto sin lógica real |

### Tablas de Compatibilidad (Grafo de Relaciones)

```
task_divisions ←→ task_actions       (via task_division_actions)
task_divisions ←→ task_elements      (via task_division_elements)
task_elements  ←→ task_actions       (via task_element_actions)
task_elements  ←→ task_parameters    (via task_element_parameters)
task_elements  ←→ task_construction_systems  (via task_element_systems) [NUEVO]
```

Este grafo permite que al seleccionar un **elemento**, se filtren las **acciones** y **sistemas constructivos** compatibles, y se pre-carguen los **parámetros** relevantes. Es la base del wizard paramétrico.

---

## ⚠️ Hallazgo Crítico: DOS Sistemas de Recetas Paralelos

Actualmente coexisten **dos sistemas** que deben unificarse:

### Sistema A: Receta Directa (task_materials + task_labor)
- **Relación**: 1 tarea → N materiales/labor directamente
- **Tablas**: `task_materials`, `task_labor`
- **UI**: ✅ Conectada en `TasksDetailRecipeView`
- **Actions**: `addTaskMaterial`, `updateTaskMaterial`, `removeTaskMaterial`, `addTaskLabor`, etc.
- **Limitación**: Solo 1 receta por tarea, sin ownership por organización

### Sistema B: Recipes (task_recipes + task_recipe_items)
- **Relación**: 1 tarea → N recetas (cada una de una organización diferente)
- **Tablas**: `task_recipes`, `task_recipe_items`, `task_recipe_ratings`
- **UI**: ❌ **NO conectada** — el código backend existe pero ninguna vista lo consume
- **Actions**: `createRecipe`, `getMyRecipe`, `getPublicRecipes`, `addRecipeItem`, `rateRecipe`, `adoptRecipe`
- **Ventaja**: Soporta múltiples recetas, ratings, publicación, adopción

### Diagnóstico

El **Sistema A** es legacy y sirve como "receta rápida" para la vista actual de detalle de tarea. El **Sistema B** es la arquitectura correcta pero está desconectada de la UI. El camino forward es **migrar hacia el Sistema B** como fuente de verdad y eventualmente deprecar el Sistema A.

---

## 🏗️ Arquitectura del Feature

### Estructura de Archivos

```
src/features/tasks/
├── CONCEPT.md                                   # Definición conceptual de los 3 pilares
├── README.md                                    # Este documento
├── TABLES.md                                    # Esquemas SQL reales
├── actions.ts                                   # 51 server actions
├── queries.ts                                   # 27 queries de lectura
├── types.ts                                     # Interfaces + schemas Zod
│
├── views/
│   ├── tasks-catalog-view.tsx                   # Vista principal del catálogo
│   ├── tasks-detail-general-view.tsx            # Tab General del detalle
│   ├── tasks-detail-recipe-view.tsx             # Tab Receta del detalle
│   ├── tasks-divisions-view.tsx                 # CRUD de rubros (admin)
│   ├── tasks-division-general-view.tsx          # Detalle de un rubro
│   ├── tasks-division-elements-view.tsx         # Elementos compatibles de un rubro
│   ├── tasks-division-kinds-view.tsx            # Tipos compatibles de un rubro
│   ├── tasks-elements-view.tsx                  # CRUD de elementos (admin)
│   ├── tasks-element-general-view.tsx           # Detalle de un elemento
│   ├── tasks-element-parameters-view.tsx        # Parámetros de un elemento
│   └── tasks-parameters-view.tsx                # CRUD de parámetros (admin)
│
├── forms/
│   ├── tasks-form.tsx                           # Formulario de tarea simple
│   ├── tasks-parametric-form.tsx                # Wizard paramétrico (32KB, complejo)
│   ├── tasks-creation-selector.tsx              # Selector: simple vs paramétrica
│   ├── tasks-division-form.tsx                  # Form de rubros
│   ├── tasks-element-form.tsx                   # Form de elementos
│   ├── tasks-parameter-form.tsx                 # Form de parámetros
│   ├── tasks-option-form.tsx                    # Form de opciones de parámetro
│   ├── tasks-material-form.tsx                  # Form de agregar material a receta
│   ├── tasks-labor-form.tsx                     # Form de agregar labor a receta
│   └── index.ts                                 # Barrel export
│
└── components/
    ├── tasks-catalog.tsx                         # Lista/grid de tareas
    ├── tasks-catalog-combobox.tsx                # Combobox para seleccionar tarea
    ├── divisions-sidebar.tsx                     # Sidebar de rubros con numeración
    ├── elements-sidebar.tsx                      # Sidebar de elementos
    └── checkbox-grid.tsx                         # Grid de checkboxes para compatibilidad
```

### Páginas

| Ruta | Propósito |
|------|-----------|
| `/organization/catalog` | Catálogo de tareas de la organización |
| `/organization/catalog/task/[taskId]` | Detalle de una tarea (General + Receta) |
| `/admin/catalog` | Catálogo admin (tareas, materiales, labor, rubros, elementos, parámetros) |

---

## 🌐 Comparativa vs Nivel Internacional

### vs Procore (líder global, USA)

| Feature | Procore | Seencel | Gap |
|---------|---------|---------|-----|
| Catálogo de tareas | ✅ Cost Codes + WBS | ✅ Task Catalog | Paridad |
| Categorización jerárquica | ✅ CSI Divisions | ✅ Rubros con parent_id | Paridad |
| Receta de materiales | ✅ Line Items | ✅ Sistema A funcional | Paridad |
| Múltiples recetas por tarea | ❌ | ⚠️ Backend listo | **Ventaja potencial** |
| Ratings y comunidad | ❌ | ⚠️ Backend listo | **Ventaja potencial** |
| Parámetros configurables | ⚠️ Manual via spreadsheets | ✅ Sistema completo | **Ventaja** |
| Assemblies/Sub-tareas | ✅ | ❌ | **Gap** |
| Fórmulas de cálculo | ❌ | ❌ (planificado) | Igual |
| Importación masiva | ✅ | ✅ Excel/CSV | Paridad |
| AI suggestions | ✅ (beta) | ❌ | **Gap futuro** |

### vs PlanGrid/Autodesk Build

| Feature | PlanGrid | Seencel | Gap |
|---------|----------|---------|-----|
| Task templates | ✅ | ✅ Parcial (parametric) | Casi paridad |
| Equipment tracking | ✅ | ❌ | **Gap** (futuro) |
| Photo documentation | ✅ | ❌ (bitácora separada) | Otro feature |

### vs CoConstruct (mejor paramétrico)

| Feature | CoConstruct | Seencel | Gap |
|---------|-------------|---------|-----|
| Parámetros por tarea | ✅ | ✅ | Paridad |
| Fórmulas de cantidad | ✅ Formulas engine | ❌ | **Gap principal** |
| Variantes auto-generadas | ⚠️ | ❌ (planificado) | **Gap** |
| Grafo de compatibilidad | ❌ | ✅ Division↔Action↔Element↔Parameter↔System | **Ventaja** |

### Resumen de Posicionamiento

```
🟢 FORTALEZAS (ventaja competitiva):
├── Grafo de compatibilidad Division↔Action↔Element↔Parameter↔System
├── Sistema de Recipes 1:N con ratings (cuando se conecte)
├── Wizard paramétrico (tasks-parametric-form.tsx)
└── Importación masiva con auto-creación de divisiones

⚠️ A CONECTAR (existe backend, falta UI):
├── Múltiples recetas por tarea (Sistema B)
├── Ratings y calificaciones de recetas
├── Adopción de recetas de otras organizaciones
└── Recetas públicas/anónimas

🔴 GAPS (no existe aún):
├── Motor de fórmulas (expression engine)
├── Generación automática de variantes
├── Assemblies/sub-tareas compuestas
├── Equipos/herramientas en receta
├── Vista de costos real (task_costs_view es placeholder)
└── AI-powered suggestions
```

---

## 🗺️ Roadmap

### Fase 1: Unificación de Recetas (PRIORIDAD ALTA)

**Objetivo**: Conectar el Sistema B (task_recipes) a la UI y migrarlo como fuente de verdad.

- [ ] Crear vista de **"Mis Recetas"** en el detalle de tarea
- [ ] Crear vista de **"Recetas Públicas"** con ratings y adopción
- [ ] Migrar los datos de task_materials/task_labor al modelo de task_recipes
- [ ] Permitir a una organización tener N recetas por tarea
- [ ] UI para publicar receta (pública/anónima)
- [ ] UI para calificar recetas de otras organizaciones
- [ ] UI para adoptar receta como preferida
- [ ] Mostrar receta adoptada al crear construction_task

### Fase 2: Motor de Fórmulas (DIFERENCIADOR)

**Objetivo**: Permitir que las cantidades de materiales sean calculadas dinámicamente.

- [ ] Diseñar expression engine (sintaxis: `superficie * espesor * 0.35`)
- [ ] Implementar evaluador en JavaScript (preview) y SQL (batch)
- [ ] Integrar con task_recipe_items (campo `quantity_formula`)
- [ ] Reglas condicionales (`usar_malla ? superficie * 1.1 : 0`)
- [ ] Preview en tiempo real en el form de receta
- [ ] Validación de expresiones

### Fase 3: Variantes Automáticas

**Objetivo**: Generar tareas concretas a partir de combinaciones de parámetros.

- [ ] Crear tabla `task_variants` (parent_task_id, parameter_values JSONB)
- [ ] Trigger para auto-generar variantes al guardar parámetros
- [ ] Materializar variante → crear tarea concreta con receta evaluada
- [ ] Integrar variantes en selector de presupuesto/obra

### Fase 4: Vista de Costos Reales

**Objetivo**: Calcular el costo unitario real de cada tarea.

- [ ] Implementar `task_costs_view` con lógica real
- [ ] Sumar costo de materiales × cantidad × precio unitario
- [ ] Sumar costo de mano de obra × cantidad × precio hora
- [ ] Integrar con el módulo financiero (precios por organización)
- [ ] Mostrar costo por m², ml, u, etc.

### Fase 5: Assemblies / Sub-tareas

**Objetivo**: Permitir tareas compuestas (ej: "Muro completo" = preparación + levantamiento + revoque).

- [ ] Diseñar modelo de datos (task_assemblies, task_assembly_items)
- [ ] UI de composición drag & drop
- [ ] Cálculo de costos recursivo

### Fase 6: Equipos/Herramientas

**Objetivo**: Agregar recursos de equipamiento a la receta.

- [ ] Crear módulo de equipos (catálogo, precios por hora/día)
- [ ] Vincular equipos a recetas
- [ ] Integrar con costos

### Fase 7: AI-Powered (Futuro)

- [ ] Sugerir recetas basadas en tareas similares
- [ ] Auto-completar parámetros comunes
- [ ] Detectar inconsistencias en recetas
- [ ] Benchmarking de costos por región

---

## 🔍 Bugs Conocidos y Deuda Técnica

| Issue | Severidad | Detalle |
|-------|-----------|---------|
| `task_labor.labor_type_id` FK inconsistente | 🟡 Media | La FK apunta a `labor_categories`, pero el campo se llama `labor_type_id`. Debería apuntar a `labor_types` o renombrar el campo a `labor_category_id`. |
| `labor_categories` sin `unit_id` | 🟡 Media | La receta de labor no puede mostrar unidad porque la tabla intermedia no tiene relación con units. Se debería resolver migrando a `labor_types` como FK. |
| `task_costs_view` es placeholder | 🟡 Media | Retorna 0 para todos los costos. No aporta valor hasta que se implemente. |
| FEATURE.md desactualizado | ✅ Resuelto | Eliminado. `CONCEPT.md` + este README lo reemplazan. |
| Recetas duplicadas | 🟡 Media | Los sistemas A y B coexisten sin sincronización. Riesgo de datos divergentes. |

---

## 📐 Reglas del Feature

1. **Las tareas de sistema no pertenecen a ninguna organización** — `organization_id IS NULL` + `is_system = true`
2. **Las tareas de organización siempre tienen dueño** — `organization_id IS NOT NULL` + `is_system = false` (enforced by CHECK constraint)
3. **Los rubros (divisions) son de sistema** — solo admins los mutan
4. **Los parámetros son de sistema** — compartidos universalmente
5. **Las recetas son por organización** — cada empresa define su propia forma de ejecutar una tarea
6. **El constraint unique `task_recipes(organization_id, task_id)`** impone 1 receta por org por tarea actualmente — para permitir N recetas se debe remover este constraint
