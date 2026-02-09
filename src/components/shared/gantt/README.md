# Gantt Chart — Componente Shared Reutilizable

Componente Gantt genérico y agnóstico del dominio.
No sabe nada de "construction tasks", "design" ni "projects" — solo entiende `GanttItem[]`.

---

## Arquitectura

```
gantt-chart.tsx          ← Orquestador principal (layout, events, zoom)
├── use-gantt.ts         ← Hook central (rango, posiciones, headers, scroll)
├── gantt-types.ts       ← Types, constantes, interfaces
├── gantt-header.tsx     ← Doble fila de tiempo (Meses + Semanas/Días)
├── gantt-grid.tsx       ← Líneas verticales, horizontales + línea "Hoy"
├── gantt-bar.tsx        ← Barra individual (drag, resize, progress, milestones)
├── gantt-task-list.tsx  ← Panel izquierdo con lista de tareas
├── gantt-tooltip.tsx    ← Tooltip hover con detalles de la tarea
└── gantt-dependency-lines.tsx ← Líneas SVG bezier entre barras (FS/SS/FF/SF)
```

---

## Anatomía Visual

```
┌──────────────────────────────────────────────────────────────┐
│                              ⤢  🔍➕  Día  🔍➖             │ ← Toolbar zoom
├──────────────┬───────────────────────────────────────────────┤
│              │   Enero 2026           │    Febrero 2026      │
│  Tarea   Av. │  19 ene  │  26 ene    │  2 feb   │  9 feb   │
├──────────────┤───────────────────────────────────────────────┤
│ ● Tarea 1 50%│      ████████████████████                    │
│ ● Tarea 2 30%│        ○━━━━━━━━━━━━━━━━━━○                 │
│ ◆ Hito    0% │                        ◆ Hito                │
│ ● Tarea 3 10%│                   ████████████████████       │
└──────────────┴──────────────────●───────────────────────────┘
                                  ↑ Hoy (línea + círculo, color primary)
```

**Connection dots (○)**: puntos de conexión para dependencias, aparecen en hover con offset (-6 / -6) fuera de la barra. Zona de hover extendida (`-inset-x-7`) para que sean alcanzables.

---

## Cómo Usar

### 1. Preparar `GanttItem[]`

El Gantt recibe items genéricos. El feature convierte sus datos a este formato:

```tsx
import { GanttItem } from "@/components/shared/gantt/gantt-types";

const ganttItems: GanttItem[] = tasks.map(task => ({
    id: task.id,
    label: task.name,
    subtitle: task.division_name,
    startDate: parseDateFromDB(task.start_date)!,   // ⚠️ SIEMPRE parseDateFromDB
    endDate: parseDateFromDB(task.end_date)!,        // ⚠️ NUNCA new Date(string)
    progress: task.progress_percent,
    // Sin `color` → usa bg-primary (el primario del tema)
    statusColor: "#eab308",                          // Dot indicador de estado
    avatar: { src: user.avatar, fallback: "MS" },
    group: "Fase 1",
    isMilestone: false,
    isDisabled: false,
}));
```

### 2. Renderizar

```tsx
import { GanttChart } from "@/components/shared/gantt/gantt-chart";

<GanttChart
    items={ganttItems}
    dependencies={ganttDependencies}     // Opcional
    onItemMove={handleMove}              // (id, newStart, newEnd) => void
    onItemResize={handleResize}          // (id, newEnd) => void
    onItemClick={handleClick}            // (id) => void
    zoom="day"                           // Controlado o interno, default: "day"
    onZoomChange={setZoom}               // Si es controlado
    todayLine={true}
    readOnly={false}
/>
```

---

## GanttItem — Todos los campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | `string` | ✅ | Identificador único |
| `label` | `string` | ✅ | Nombre visible en la barra y task list |
| `subtitle` | `string` | — | Texto secundario (ej: división, categoría) |
| `startDate` | `Date` | ✅ | Fecha de inicio (usar `parseDateFromDB()`) |
| `endDate` | `Date` | ✅ | Fecha de fin (usar `parseDateFromDB()`) |
| `progress` | `number` | ✅ | Porcentaje completado (0-100) |
| `color` | `string` | — | Color hex para la barra. Sin color → usa `bg-primary` |
| `statusColor` | `string` | — | Color del dot indicador de estado |
| `avatar` | `{ src?, fallback }` | — | Avatar del responsable |
| `group` | `string` | — | Agrupación (fase, división) — *futuro* |
| `isMilestone` | `boolean` | — | Renderiza como diamante ◆ en vez de barra |
| `isDisabled` | `boolean` | — | No permite drag/resize, opacity reducida |

---

## GanttDependency — Líneas entre tareas

```tsx
interface GanttDependency {
    id: string;
    fromId: string;          // ID de la tarea origen
    toId: string;            // ID de la tarea destino
    type: "FS" | "FF" | "SS" | "SF";
}
```

| Tipo | Significado | Visual |
|------|-------------|--------|
| `FS` | Finish-to-Start | Línea sólida con flecha |
| `SS` | Start-to-Start | Línea punteada |
| `FF` | Finish-to-Finish | Línea punteada |
| `SF` | Start-to-Finish | Línea punteada |

Las líneas se renderizan como SVG bezier curves con routing inteligente cuando el target está detrás del source.

---

## Niveles de Zoom

| Zoom | `dayWidth` | Header Superior | Header Inferior |
|------|-----------|-----------------|-----------------| 
| `day` | 40px | Meses | Días individuales |
| `week` | 16px | Meses | Semanas (`19 ene`, `26 ene`) |
| `month` | 5px | Años | Meses (`Ene`, `Feb`) |
| `quarter` | 2px | Años | Trimestres (`Q1`, `Q2`) |

**Default**: `day`. Los controles de zoom están en un **toolbar dedicado** arriba del header:
- **⤢ Ajustar**: Auto-selecciona el zoom que hace que todas las tareas quepan
- **🔍+ Acercar**: Nivel más detallado
- **🔍− Alejar**: Nivel más general

---

## Constantes (gantt-types.ts)

| Constante | Valor | Uso |
|-----------|-------|-----|
| `GANTT_ROW_HEIGHT` | 44px | Altura de cada fila |
| `GANTT_HEADER_HEIGHT` | 56px | Altura del header dual |
| `GANTT_TASK_LIST_WIDTH` | 300px | Ancho inicial del panel izquierdo |
| `GANTT_TASK_LIST_MIN_WIDTH` | 200px | Mínimo al redimensionar panel |
| `GANTT_TASK_LIST_MAX_WIDTH` | 500px | Máximo al redimensionar panel |
| `GANTT_BAR_HEIGHT` | 28px | Altura de la barra de tarea |
| `GANTT_MILESTONE_SIZE` | 16px | Tamaño del diamante milestone |

---

## Rango de Fechas (TimeRange)

El hook `useGantt` calcula automáticamente el rango visible:

1. **Con tareas**: Busca `min(startDate)` y `max(endDate)`, agrega padding, y garantiza un rango mínimo centrado en "hoy"
2. **Sin tareas**: Muestra 30 días al pasado y 90 días al futuro desde hoy
3. **Alineación**: Se alinea a los bordes del período según el zoom (inicio de semana, inicio de mes, etc.)

### Rango mínimo garantizado

- Al menos **30 días al pasado** desde hoy
- Al menos **90 días al futuro** desde hoy
- Si las tareas exceden ese rango, se agranda para incluirlas

### Scroll inicial

Al montar, el Gantt centra automáticamente la vista en **Hoy** (`todayX - containerWidth / 2`).

---

## Línea "Hoy"

- Posición: centrada dentro de la columna del día actual (`dayIndex * dayWidth + dayWidth / 2`)
- Usa `differenceInCalendarDays` (timezone-aware) para evitar off-by-one
- Visual: línea vertical de 2px (`bg-primary/70`) con círculo sólido en el top (`bg-primary`)
- Se extiende al 100% del alto del contenedor (no solo el alto de las tareas)

---

## Interacciones del Usuario

### Drag & Drop (mover tarea)
1. `mousedown` en la barra → `handleDragStart(id, clientX)`
2. `mousemove` global → calcula offset **con snapping a días** (`Math.round(delta / dayWidth) * dayWidth`)
3. `mouseup` → convierte offset a días
4. Llama `onItemMove(id, newStartDate, newEndDate)`

### Resize (cambiar duración)
1. `mousedown` en el handle derecho → `handleResizeStart(id, clientX)`
2. `mousemove` global → calcula offset **con snapping a días**
3. `mouseup` → convierte a días, valida que `newEnd > startDate`
4. Llama `onItemResize(id, newEndDate)`

### Supresión de click tras drag/resize
- Después de un drag o resize, el click se **suprime** durante un frame (`requestAnimationFrame`)
- Evita que se abra el modal de edición accidentalmente tras arrastrar

### Click
- Click en barra (sin drag previo) o en task list → `onItemClick(id)`

### Connection Dots (dependencias)
- En hover sobre una barra, aparecen **dos puntos de conexión** fuera de la barra (`-left-6` / `-right-6`)
- Zona de hover invisible extendida (`-inset-x-7`) para que los dots sean alcanzables
- `mousedown` en un dot → inicia creación de dependencia

### Panel Resize
- El divisor entre task list y timeline es draggable
- Rango: 200px — 500px

### Scroll Sync
- El scroll vertical se sincroniza entre task list y timeline
- El scroll horizontal se sincroniza entre header y timeline

### Tooltip
- Hover sobre barra → tooltip con detalles (delay 400ms)
- Muestra: nombre, subtítulo, fechas inicio/fin, duración, progreso, avatar

---

## Cómo Escalar

### Agregar un nuevo zoom level

1. Agregar a `GanttZoom` type en `gantt-types.ts`
2. Agregar `dayWidth` en `GANTT_DAY_WIDTH_BY_ZOOM`
3. Agregar case en `topHeaderCells` y `bottomHeaderCells` del `use-gantt.ts`
4. Agregar a `ZOOM_ORDER` en `gantt-chart.tsx`

### Agregar grouping/collapsing

1. Agregar `group` field a `GanttItem` (ya existe)
2. Crear `gantt-group-row.tsx` para renderizar rows de grupo
3. Modificar `gantt-chart.tsx` para intercalar group rows con task rows
4. Agregar estado de collapsed/expanded por grupo

### Agregar critical path

1. Agregar `isCritical?: boolean` a `GanttItem`
2. Modificar `gantt-bar.tsx` para estilo visual diferente
3. Modificar `gantt-dependency-lines.tsx` para highlight en rojo

### Agregar multi-select

1. Agregar estado `selectedIds: Set<string>` en `gantt-chart.tsx`
2. Modificar `GanttBar` para mostrar estado seleccionado
3. Agregar drag multi-move

### Agregar baseline (plan original vs real)

1. Agregar `baselineStart?` y `baselineEnd?` a `GanttItem`
2. Crear barra secundaria semitransparente detrás de la principal
3. Tooltip muestra diferencia plan vs real

---

## ⚠️ Reglas Críticas

1. **Fechas**: SIEMPRE usar `parseDateFromDB()` al convertir strings de DB a `GanttItem.startDate/endDate`. NUNCA `new Date(string)`.

2. **Agnóstico**: Este componente NO sabe de construction tasks ni de ningún feature. La conversión dominio → GanttItem se hace en el feature (ej: `taskToGanttItem()`).

3. **Performance**: Todos los sub-componentes usan `React.memo`. Los cálculos pesados usan `useMemo` y `useCallback`.

4. **Scroll sync**: El scroll se maneja manual con refs, no con CSS. El header scrollea horizontalmente en sync con el body.

5. **ReadOnly**: Si `readOnly={true}`, se deshabilitan drag, resize y dependency creation. El click sigue funcionando.

6. **Color primario**: Sin `color` prop → las barras usan `bg-primary` del tema. Solo pasar `color` hex si se necesita un color específico.

7. **Snapping**: Drag y resize siempre snappean a días completos. No hay movimiento sub-día.
