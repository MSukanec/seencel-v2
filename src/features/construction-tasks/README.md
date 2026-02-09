# Construction Tasks — Ejecución de Obra

> **El feature más importante de Seencel.**
> Aquí es donde todo lo que el usuario construyó en catálogos, recetas y presupuestos cobra vida real.

---

## Qué es este feature

`construction-tasks` es la capa de **ejecución** del proyecto de construcción. Convierte tareas teóricas del catálogo (`tasks`) en tareas reales con fechas, avances, costos y desvíos.

### Analogía

| Capa | Concepto | Feature |
|------|----------|---------|
| Catálogo | "Hormigón armado de losa: necesita X m³ de concreto, Y kg de acero, Z horas de oficial" | `tasks` |
| Presupuesto | "Para este proyecto necesitamos 500 m² de losa a $X/m²" | `quotes` |
| **Ejecución** | **"La losa empezó el 15/ene, lleva 60% de avance, costó 12% más de lo presupuestado"** | **`construction-tasks`** |

---

## Posición en el flujo de Seencel

```
PILARES (catálogos base)
├── Materiales
├── Mano de Obra
├── Equipos y Herramientas (futuro)
└── Indirectos (futuro)
         ↓
    TAREAS (tasks)
    Recetas teóricas: combinan pilares en unidades de trabajo
         ↓
    PRESUPUESTOS (quotes)
    Cotización al cliente usando tareas del catálogo
         ↓  [Aprobación]
    ══════════════════════════════════════════
    EJECUCIÓN DE OBRA  ← ESTAMOS AQUÍ
    (construction-tasks)
    ══════════════════════════════════════════
         ↓
    CONTROL Y REPORTES
    Desvíos, Curva S, EVM, Números Generadores
```

---

## Conceptos clave del dominio

### Instanciación
Cuando una tarea del catálogo se asigna a un proyecto real, se **instancia**: se crea un registro en `construction_tasks` con una referencia (`task_id`) a la tarea del catálogo. En ese momento se congela un snapshot de los costos (materiales, mano de obra) para que cambios futuros en los precios del catálogo no afecten la obra en curso.

### Tarea custom
Excepcionalmente, el usuario puede crear una tarea SIN seleccionar del catálogo (para imprevistos, trabajos no planificados). En ese caso `task_id` es `null` y se usa `custom_name`.

### Fechas planificadas vs reales
Cada tarea tiene **dos pares de fechas**:
- `planned_start_date` / `planned_end_date` — se fijan al crear la tarea
- `actual_start_date` / `actual_end_date` — se actualizan durante la ejecución

Esto permite calcular `schedule_variance_days` (desvío temporal) comparando lo planificado vs lo real.

### Desvíos
Toda tarea de ejecución tiene potencial de desviarse del plan:
- **Desvío de cantidad**: la cantidad real difiere de la planificada (`quantity` vs `original_quantity`)
- **Desvío de costo**: el costo real difiere del presupuestado
- **Desvío de tiempo**: `schedule_variance_days` calculado automáticamente en la vista

### Vínculo con presupuesto
Si la tarea proviene de un presupuesto aprobado, se vincula via `quote_item_id`. Esto permite trazabilidad completa: **catálogo → presupuesto → ejecución → pagos**.

---

## Valor diferenciador de Seencel

### 1. Trazabilidad vertical completa
La competencia tiene "islas" (presupuesto por un lado, schedule por otro, pagos por otro). Seencel conecta TODO:
> Tarea → Receta → Materiales comprados → Pagos realizados → Desvío de costo

**Nadie en LATAM hace esto de forma nativa.**

### 2. Simplicidad vs herramientas enterprise
Primavera P6 y MS Project son potentes pero inaccesibles para el constructor promedio. Seencel ofrece programación con dependencias básicas (Fin-a-Inicio) que cubren el 90% de los casos sin curva de aprendizaje enterprise.

### 3. Análisis de desempeño visual
Indicadores de salud simples por tarea y proyecto:
- 🟢 En presupuesto y a tiempo
- 🟡 Desvío menor (< 10%)
- 🔴 Desvío crítico (> 10%)

### 4. Mobile-first para campo
El capataz actualiza avances desde el celular, toma fotos, marca tareas completadas. PWA nativo.

### 5. Números generadores automáticos
Documento formal de avance para cobrar al cliente, generado automáticamente a partir del avance registrado. Killer feature para LATAM.

---

## Roadmap

### Fase 1 — Fundamentos ✅

> Objetivo: que el usuario pueda asignar tareas del catálogo a un proyecto y hacer seguimiento básico.

- [x] **Modelo de datos corregido** — FK `task_id` con SET NULL, NOT NULL en org/project, fechas planned/actual
- [x] **`construction_dependencies`** — Recreada con RLS, checks, indices, auditoría
- [x] **`construction_task_material_snapshots`** — FK source_task + RLS
- [x] **Selector de tarea del catálogo** en el form (reemplaza input de texto libre)
- [x] Campos de ejecución: fechas planificadas, cantidad, alcance de costos, notas
- [x] Seguimiento de estado: Pendiente → En Progreso → Completada → Pausada
- [x] Seguimiento de progreso (% avance)
- [x] Creación de tareas custom (sin catálogo, para imprevistos)
- [x] Vista de tarjetas mejorada con fechas planificadas
- [x] Vista de tabla con DataTable (nombre, estado, fechas, progreso, duración, fase, cantidad)
- [x] Optimistic updates en drag/resize del Gantt (persistencia con rollback)
- [x] Documentación in-app (ejecución de obra)
- [ ] Dashboard resumen del proyecto (KPIs: completadas, en progreso, retrasadas, % general)

### Fase 2 — Programación (EN PROGRESO)

> Objetivo: el usuario puede programar la obra en el tiempo y ver el avance real vs planificado.

- [x] **Gantt interactivo** — Custom component con drag & drop, resize, zoom (4 niveles), línea Hoy
- [x] **Persistencia Gantt** — Server actions con optimistic updates para move/resize
- [x] **Label exterior** — Labels se muestran fuera de barras pequeñas, ancho mínimo visual
- [x] **Tres vistas** — toggle entre Gantt, Tarjetas y Tabla
- [x] **Dependencias entre tareas** — FS con creación visual (drag entre puntos), eliminación, ruteo ortogonal
- [x] **Propagación en cascada** — Push-forward recursivo (mover tarea empuja sucesores), rollback individual
- [x] **Headers con día de semana** — Muestra "LUN. 9" en mayúsculas, columnas de 50px
- [x] **Ajustes del proyecto** — Tab "Ajustes" con días laborales configurables (auto-save), visual en Gantt
- [ ] Fases de construcción (`construction_phases` — tablas existen, faltan RLS + UI)
- [ ] Modal de detalle de dependencia (cambiar tipo FS/FF/SS/SF y lag)
- [ ] Validación de dependencias circulares
- [ ] Responsable asignado por tarea (miembro del equipo)
- [ ] Control de costos por tarea: presupuestado vs comprometido vs real
- [ ] Alertas de desvío (notificaciones cuando una tarea se retrasa o excede presupuesto)

### Fase 3 — Control y Reportes

> Objetivo: herramientas analíticas profesionales para control de obra.

- [ ] Curva S (avance planificado vs real en el tiempo)
- [ ] EVM simplificado (CPI, SPI, indicadores de salud)
- [ ] Números generadores automáticos (documento de avance para cobro)
- [ ] Reportes de desvío (costo, tiempo, cantidad)
- [ ] Registro fotográfico por tarea (evidencia de avance)
- [ ] Daily logs vinculados a tareas (bitácora de obra integrada)
- [ ] Exportación a PDF de programa de obra y reportes

---

## Estado actual del código

### Archivos existentes

| Archivo | Estado | Notas |
|---------|--------|-------|
| `types.ts` | ✅ Actualizado | Columnas planned/actual, schedule_variance_days, CostScope |
| `actions.ts` | ✅ Actualizado | CRUD con nuevos campos, original_quantity = quantity |
| `queries.ts` | ✅ Funcional | Query principal contra vista |
| `forms/construction-task-form.tsx` | ✅ Rediseñado | Selector de catálogo + búsqueda + tarea custom + DateField/NotesField |
| `views/construction-tasks-view.tsx` | ✅ Completa | 3 vistas (Gantt/Cards/Table), ContentLayout, optimistic updates, docsPath |
| `components/construction-task-card.tsx` | ✅ Actualizado | Usa planned_start_date/planned_end_date |
| `components/construction-tasks-columns.tsx` | ✅ Nuevo | 8 columnas DataTable con factories estándar |
| `components/shared/gantt/` | ✅ Nuevo | 10 archivos: componente Gantt reutilizable |

