---
name: Patrón de Snapshot para Obra
description: Patrón arquitectónico para congelar datos (materiales, mano de obra, equipos) al momento de crear tareas de construcción, evitando que cambios en catálogos técnicos afecten obras en ejecución
---

# Patrón de Snapshot para Obra

## Descripción

Este patrón resuelve el problema de las "recetas vivas" en sistemas de construcción: cuando modificas un catálogo técnico (ej. materiales de una tarea), los cambios NO deben afectar obras que ya están en ejecución.

## El Problema

```
┌─────────────────────────────────────────────────────────────┐
│ SIN SNAPSHOT (malo):                                        │
│                                                             │
│ task_materials (receta) ←── construction_tasks              │
│       ↓                           ↓                         │
│   Editas receta          Todos los proyectos cambian! ❌    │
└─────────────────────────────────────────────────────────────┘
```

## La Solución

```
┌─────────────────────────────────────────────────────────────┐
│ CON SNAPSHOT (correcto):                                    │
│                                                             │
│ task_materials (receta) → SNAPSHOT → construction_task_*    │
│       ↓                     ↓                               │
│   Editas receta     Proyectos existentes SIN cambios ✅     │
└─────────────────────────────────────────────────────────────┘
```

## Cuándo Usar Este Patrón

- ✅ Materiales de tareas de construcción
- ✅ Mano de obra / rendimientos
- ✅ Equipos y herramientas
- ✅ Cualquier "receta" que no deba cambiar retroactivamente

## Arquitectura

### 1. Tabla de Snapshot

Nombre: `{entidad}_snapshots` (ej: `construction_task_material_snapshots`)

Campos mínimos:
```sql
CREATE TABLE {entidad}_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- FK al registro principal
    construction_task_id UUID NOT NULL REFERENCES construction_tasks(id) ON DELETE CASCADE,
    
    -- FK al ítem del catálogo (material, labor, etc)
    {item}_id UUID NOT NULL REFERENCES {items}(id) ON DELETE RESTRICT,
    
    -- Datos congelados
    quantity_planned NUMERIC(20, 4) NOT NULL,
    amount_per_unit NUMERIC(20, 4) NOT NULL,
    
    -- Trazabilidad
    source_task_id UUID NULL,          -- Tarea técnica original
    snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Campos estándar
    organization_id UUID NOT NULL,
    project_id UUID NOT NULL,
    
    -- Unique constraint
    CONSTRAINT unique_item UNIQUE (construction_task_id, {item}_id)
);
```

### 2. Trigger de Auto-Snapshot

```sql
CREATE OR REPLACE FUNCTION create_{entidad}_snapshot()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.task_id IS NOT NULL THEN
        INSERT INTO {entidad}_snapshots (...)
        SELECT ... FROM {catalogo} WHERE task_id = NEW.task_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_{entidad}_snapshot
AFTER INSERT ON construction_tasks
FOR EACH ROW
EXECUTE FUNCTION create_{entidad}_snapshot();
```

### 3. Trigger de Protección (Opcional)

Bloquea cambios en `task_id` para preservar integridad:

```sql
CREATE OR REPLACE FUNCTION prevent_task_id_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.task_id IS NOT NULL AND NEW.task_id IS DISTINCT FROM OLD.task_id THEN
        RAISE EXCEPTION 'Cannot change task_id once snapshots exist';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Implementaciones Actuales

| Entidad | Tabla Snapshot | Estado |
|---------|---------------|--------|
| Materiales | `construction_task_material_snapshots` | ✅ Implementado |
| Mano de obra | `construction_task_labor_snapshots` | ⏳ Pendiente |
| Equipos | `construction_task_equipment_snapshots` | ⏳ Pendiente |

## Precios vs Cantidades

> [!IMPORTANT]
> Los snapshots guardan **CANTIDADES**, no precios. Los precios se manejan en:
> - `quote_items.unit_price` → Precio vendido al cliente
> - `material_payments.amount` → Precio real pagado

## Vistas

Las vistas de requerimientos deben leer desde snapshots, NO desde catálogos:

```sql
-- ✅ Correcto: leer desde snapshot
SELECT ... FROM construction_task_material_snapshots ctms ...

-- ❌ Incorrecto: leer desde catálogo vivo
SELECT ... FROM task_materials tm JOIN construction_tasks ct ON ct.task_id = tm.task_id
```

## Migración Retroactiva

Si ya existen `construction_tasks` sin snapshots:

```sql
INSERT INTO {entidad}_snapshots (...)
SELECT ...
FROM construction_tasks ct
INNER JOIN {catalogo} ON ...
WHERE NOT EXISTS (SELECT 1 FROM {entidad}_snapshots WHERE ...);
```

## Consideraciones

> [!NOTE]
> Este patrón es estándar en Procore, SAP y Oracle para gestión de obra. Prioriza trazabilidad y consistencia histórica sobre simplicidad.

> [!WARNING]
> Una vez creado el snapshot, es INMUTABLE. Si hay errores, se deben manejar con tablas de ajustes separadas.
