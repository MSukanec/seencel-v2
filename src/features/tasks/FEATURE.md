# Feature: Tasks (Tareas Paramétricas) - Plan Maestro

> Última actualización: 2026-01-24

Este documento contiene la auditoría completa, análisis competitivo, arquitectura propuesta y roadmap para el sistema de **Tareas Paramétricas Universales**.

---

## 🎯 Visión

Crear un sistema de tareas **paramétricas universales** donde:
- Una **tarea padre** define la estructura base (ej: "Contrapiso")
- **Parámetros** configurables generan **variantes** automáticamente (ej: espesor 8cm, 10cm, 12cm)
- **Recetas de materiales** se calculan dinámicamente según los parámetros
- Las organizaciones pueden usar tareas de sistema o crear las propias

---

## 📊 Estado Actual vs Competidores

### Comparativa con Líderes de Industria

| Feature | Procore | CoConstruct | Buildertrend | Seencel Actual | Objetivo |
|---------|---------|-------------|--------------|----------------|----------|
| Catálogo de tareas | ✅ | ✅ | ✅ | ✅ Básico | ✅ |
| Categorización (Rubros) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Receta de materiales | ✅ | ✅ | ✅ | ✅ (fijo) | ✅ Dinámica |
| **Parámetros configurables** | ⚠️ Manual | ✅ Parameters | ✅ Options | ❌ | ✅ |
| **Fórmulas de cálculo** | ❌ | ✅ Formulas | ⚠️ | ❌ | ✅ |
| **Variantes automáticas** | ❌ | ⚠️ | ⚠️ | ❌ | ✅ |
| **Assemblies/Sub-tareas** | ✅ | ✅ | ✅ | ❌ | ✅ |
| Templates reutilizables | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| Mano de obra asociada | ✅ | ✅ | ✅ | ❌ | ✅ Fase 2 |
| Equipos/herramientas | ✅ | ⚠️ | ⚠️ | ❌ | ✅ Fase 3 |
| AI-powered suggestions | ✅ | ❌ | ❌ | ❌ | ✅ Futuro |

### Análisis: Cómo lo hace la competencia

#### CoConstruct (Mejor implementación paramétrica)
```
Estructura de 3 niveles:
├── Categories (Rubros)
├── Items (Tareas)
│   ├── Parameters (Mediciones clave: largo, ancho, espesor)
│   ├── Formulas (Cálculos: largo × ancho × espesor)
│   └── Cost Lines (Materiales con cantidad = fórmula)
```

#### Procore (WBS tradicional)
```
Work Breakdown Structure:
├── Phases (Fases)
├── Cost Codes (Códigos de costo)
└── Line Items (con cantidades manuales)
```

#### Nuestra Propuesta: Modelo Híbrido Superior
```
Task Templates (Plantillas Paramétricas):
├── Base Task (Tarea Padre)
├── Parameters (Dimensiones, opciones, materiales)
├── Formulas (Expresiones de cálculo)
├── Recipe Rules (Reglas condicionales)
└── Generated Variants (Tareas Hijas auto-generadas)
```

---

## 🏗️ Arquitectura Propuesta

### Modelo Conceptual

```
┌─────────────────────────────────────────────────────────────────┐
│                    TASK TEMPLATE (Plantilla)                     │
│  "Ejecución de Contrapiso"                                       │
├─────────────────────────────────────────────────────────────────┤
│  Parameters:                                                     │
│  ├── espesor (select: 8cm, 10cm, 12cm)                          │
│  ├── superficie (number: m²)                                     │
│  └── usar_malla (boolean)                                        │
├─────────────────────────────────────────────────────────────────┤
│  Recipe (Receta Dinámica):                                       │
│  ├── Cemite (kg) = superficie × espesor × 0.35                  │
│  ├── Arena (m³) = superficie × espesor × 0.5                    │
│  ├── Malla (m²) = superficie × 1.1 [si usar_malla = true]       │
│  └── Agua (L) = superficie × espesor × 15                       │
├─────────────────────────────────────────────────────────────────┤
│  Generated Variants:                                             │
│  ├── Contrapiso 8cm (auto-generado)                             │
│  ├── Contrapiso 10cm (auto-generado)                            │
│  └── Contrapiso 12cm (auto-generado)                            │
└─────────────────────────────────────────────────────────────────┘
```

### Flujo de Uso

```
1. ADMINISTRADOR SISTEMA
   └── Crea Task Template con parámetros y recetas

2. ORGANIZACIÓN
   └── Genera variantes específicas o usa las del sistema

3. PROYECTO / PRESUPUESTO
   └── Selecciona variante → auto-calcula materiales

4. OBRA (construction_task)
   └── Snapshot congelado de materiales calculados
```

---

## 🗄️ Estructura de Base de Datos

### Tablas Actuales (audit)

| Tabla | Propósito | Estado | Acción |
|-------|-----------|--------|--------|
| `tasks` | Tareas individuales | ✅ Funcional | Mantener |
| `task_divisions` | Rubros/categorías (SISTEMA) | ✅ **SIMPLIFICADA** | Ver abajo |
| ~~`task_categories`~~ | ⛔ Duplicado | ⛔ **ELIMINADA** | Migración aplicada |
| `task_kind` | Tipos de acción (SISTEMA) | ✅ **LIMPIADA** | Ver abajo |
| `task_parameters` | Parámetros | ⚠️ Base creada | **EXPANDIR** |
| `task_parameter_options` | Opciones | ⚠️ Base creada | **EXPANDIR** |
| `task_materials` | Receta fija | ✅ Funcional | Convertir a dinámica |

### `task_divisions` - Tabla de Sistema (Simplificada)

La tabla `task_divisions` fue simplificada para ser una **tabla de sistema only**:
- ❌ Eliminado: `organization_id`, `created_by`, `updated_by`, `is_system`
- ✅ Estructura actual:
  ```sql
  create table public.task_divisions (
    id uuid not null default gen_random_uuid(),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    name text not null,
    description text null,
    "order" integer null,
    code text null,
    parent_id uuid null references task_divisions(id) on delete set null,
    is_deleted boolean not null default false,
    deleted_at timestamp with time zone null,
    constraint task_rubros_pkey primary key (id)
  );
  ```
- ✅ RLS: Todos pueden ver, solo admins pueden mutar
- ✅ UI CRUD completa en `/admin/catalog` (pestaña Rubros)

### Nuevas Tablas Propuestas

| Tabla | Propósito | Prioridad |
|-------|-----------|-----------| 
| `task_templates` | Plantillas padre parametrizables | 🔴 Alta |
| `task_template_parameters` | Parámetros de plantilla | 🔴 Alta |
| `task_template_recipe_items` | Items de receta con fórmulas | 🔴 Alta |
| `task_variants` | Variantes generadas | 🟡 Media |
| `task_labor_items` | Mano de obra por tarea | 🟢 Baja |
| `task_equipment_items` | Equipos por tarea | 🟢 Baja |

---

## 📁 Estructura de Archivos Actual

```
src/features/tasks/
├── actions.ts           # Server actions (CRUD Tasks + Divisions)
├── queries.ts           # Queries de lectura
├── types.ts             # Types básicos
├── FEATURE.md           # Este archivo
├── TABLES.md            # Esquemas SQL
├── components/
│   ├── catalog/
│   │   ├── divisions-sidebar.tsx    ✅ Con numeración jerárquica
│   │   ├── task-catalog.tsx         ✅
│   │   └── task-columns.tsx         ⚠️ No usado
│   ├── detail/
│   │   └── task-detail-view.tsx     ✅
│   └── forms/
│       ├── task-form.tsx            ✅
│       └── division-form.tsx        ✅ NUEVO
└── views/
    ├── tasks-catalog-view.tsx       ✅
    ├── divisions-catalog-view.tsx   ✅ NUEVO
    └── index.ts                     ✅
```

---

## ✅ ROADMAP / Checklist

### Fase 0: Limpieza y Consolidación ✅ COMPLETADA
- [x] Auditar `task_categories` vs `task_divisions` → **ELIMINADA**
- [x] Crear `TABLES.md` con esquemas SQL actuales
- [x] Simplificar `task_divisions` a tabla de sistema
  - [x] Eliminar `organization_id`, `is_system`, `created_by`, `updated_by`
  - [x] Implementar RLS: todos ven, solo admins mutan
  - [x] Crear UI CRUD en catálogo admin (DivisionsCatalogView)
  - [x] Formulario de creación/edición (DivisionForm)
  - [x] Delete con reasignación de tareas (DeleteReplacementModal)
  - [x] Numeración jerárquica en sidebar y catálogo
- [x] Limpiar `task_kind` (migración 20260124_cleanup_task_kind.sql)
  - [x] Renombrar constraints legacy
  - [x] Agregar `is_deleted`, `deleted_at`, `order`
  - [x] Implementar RLS: todos ven, solo admins mutan
  - [x] Agregar trigger set_timestamp

---

### Fase 1: Sistema de Parámetros (3-5 días)

#### Backend: ✅ COMPLETADO
- [x] Limpiar tabla `task_parameters` (migración 20260124_cleanup_task_parameters.sql):
  - [x] Renombrar constraints legacy
  - [x] Campo `slug` (único) para referencias en fórmulas
  - [x] Campo `type` (text, number, select, material, boolean)
  - [x] Campo `default_value`, `validation_rules` (JSONB)
  - [x] Campo `description`, `order`
  - [x] Soft delete + RLS
- [x] Limpiar tabla `task_parameter_options` (migración 20260124_cleanup_task_parameter_options.sql):
  - [x] Campo `value` para cálculos
  - [x] Campo `order`
  - [x] Soft delete + RLS
- [x] Crear tabla `task_task_parameters` (migración 20260124_create_task_task_parameters.sql):
  - [x] Tabla de unión tarea ↔ parámetro
  - [x] Override de `default_value`, `is_required`, `order` por tarea

#### Frontend:
- [ ] Componente `ParameterEditor` para definir parámetros en admin
- [ ] Componente `ParameterValueSelector` para elegir valores
- [ ] Integrar en `task-form.tsx` o `task-detail-view.tsx`

---

### Fase 2: Recetas Dinámicas (4-6 días)

#### Backend:
- [ ] Crear tabla `task_recipe_items`:
  ```sql
  - task_id
  - material_id
  - quantity_formula (ej: "superficie * espesor * 0.35")
  - condition_formula (ej: "usar_malla == true")
  - unit_id
  ```
- [ ] Crear función `evaluate_recipe()` en PostgreSQL
- [ ] Crear función `calculate_materials(task_id, parameters JSONB)`

#### Frontend:
- [ ] Componente `RecipeEditor` con fórmulas
- [ ] Preview en tiempo real de cálculos
- [ ] Validación de expresiones

---

### Fase 3: Generación de Variantes (3-4 días)

#### Backend:
- [ ] Crear tabla `task_variants`:
  ```sql
  - id
  - parent_task_id (plantilla)
  - parameter_values (JSONB)
  - generated_name
  - is_auto_generated
  ```
- [ ] Trigger para auto-generar variantes al guardar plantilla
- [ ] Función para "materializar" variante → crear tarea concreta

#### Frontend:
- [ ] Vista de variantes en detalle de tarea
- [ ] Popup para generar nueva variante manual
- [ ] Integrar variantes en selector de presupuesto

---

### Fase 4: Mano de Obra (Futuro)

- [ ] Crear tabla `task_labor_items`
- [ ] Vincular oficios/roles con horas estimadas
- [ ] Fórmulas de cálculo de horas
- [ ] Integración con módulo de nómina

---

### Fase 5: Equipos y Herramientas (Futuro)

- [ ] Crear tabla `task_equipment_items`
- [ ] Catálogo de equipos con costo por hora/día
- [ ] Fórmulas de duración de uso

---

### Fase 6: AI Suggestions (Futuro)

- [ ] Analizar tareas similares para sugerir recetas
- [ ] Auto-completar parámetros comunes
- [ ] Detectar inconsistencias en recetas

---

## 🔧 Decisiones de Arquitectura

### 1. ¿Por qué no modificar `tasks` directamente?

La tabla `tasks` actual funciona bien para tareas simples. En lugar de agregar complejidad, crearemos un sistema paralelo de **templates** que opcionalmente generan `tasks` concretas.

### 2. ¿Fórmulas en PostgreSQL o JavaScript?

**Recomendación: Ambos**
- PostgreSQL para cálculos batch (vistas, reportes)
- JavaScript para preview en tiempo real (frontend)
- Usar misma sintaxis de expresiones (ej: `superficie * espesor`)

### 3. ¿Variantes pre-generadas o dinámicas?

**Híbrido:**
- **Variantes comunes** (8cm, 10cm, 12cm): pre-generadas para fácil selección
- **Variantes custom**: generadas on-demand con parámetros personalizados

---

## 📝 Notas Técnicas

### Expression Engine (Motor de Fórmulas)

Propuesta de sintaxis para fórmulas:
```javascript
// Variables son los slugs de parámetros
"superficie * espesor * 0.35"

// Condicionales
"usar_malla ? superficie * 1.1 : 0"

// Funciones built-in
"ROUND(superficie * 0.35, 2)"
"MAX(espesor, 8)"
"IF(tipo_suelo == 'arcilla', 1.2, 1.0)"
```

### Snapshot en Obra

Cuando se crea una `construction_task`:
1. Se evalúan las fórmulas con los parámetros elegidos
2. Se congela el resultado en `construction_task_material_snapshots`
3. Cambios posteriores en la receta NO afectan la obra

---

## 🚀 Siguiente Paso Inmediato

**Fase 1: Sistema de Parámetros**

Con la Fase 0 completada (limpieza de `task_divisions`), el siguiente paso es implementar el sistema de parámetros para tareas:

1. **Revisar tablas existentes** `task_parameters` y `task_parameter_options`
2. **Expandir esquema** para soportar tipos: number, select, boolean, material
3. **Crear UI** para definir parámetros en tareas
4. **Integrar** con el formulario de tareas existente

### Archivos clave a revisar:
- `src/features/tasks/TABLES.md` - Esquemas SQL
- Tablas en Supabase: `task_parameters`, `task_parameter_options`

