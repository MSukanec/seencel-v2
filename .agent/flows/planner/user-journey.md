# User Journey: Crear y Gestionar un Evento en el Planner

> Tutorial paso a paso de cómo un usuario crea un evento y lo gestiona.

## Escenario

**Laura** es la directora de obra de "Torres del Sol". Necesita agendar una reunión de coordinación con el equipo de instalaciones eléctricas para la próxima semana.

---

## Paso 1: Navegar al Planner

Laura hace click en "Planificador" en el sidebar.

- **Tabla leída**: `planner.boards` (para cargar el board default), `planner.items` (para eventos)
- **Archivo page**: `src/app/[locale]/(dashboard)/organization/planner/page.tsx`
- **Query**: `getBoards()`, `getCalendarItems()`, `getBoardWithData()`
- **Estado**: ✅ Funciona

---

## Paso 2: Click en "Nuevo Evento"

Laura clickea el botón "Nuevo Evento" en el Toolbar.

- **Store**: `useModal` abre el `CalendarEventForm` en un modal
- **Archivo form**: `src/features/planner/forms/calendar-event-form.tsx`
- **Estado**: ✅ Funciona

---

## Paso 3: Completar el formulario

Laura llena los campos:
- **Título**: "Coordinación eléctrica — Planta Baja"
- **Proyecto**: Torres del Sol (selector de proyectos activos)
- **Color**: Amarillo
- **Todo el día**: No
- **Fecha inicio**: 2026-02-28 — 10:00
- **Fecha fin**: 2026-02-28 — 11:30
- **Ubicación**: "Oficina técnica, Piso 3"
- **Descripción**: "Revisar avance de tendido de cables..."

### Lo que NO puede hacer hoy:

| Campo que falta | Tabla DB | Estado |
|-----------------|----------|--------|
| Asignar responsable | `items.assigned_to` (member_id) | 🚧 Campo existe en DB, falta en form |
| Agregar asistentes | `planner.attendees` | 🚧 Tabla existe, sin UI |
| Adjuntar planos | `planner.attachments` | 🚧 Tabla existe, sin UI |
| Configurar recordatorio | `planner.reminders` | 🚧 Tabla existe, sin UI |
| Recurrencia ("repetir semanalmente") | `items.recurrence_rule` | 🚧 Campo existe en DB, sin UI |

- **Action**: `createCalendarEvent()` → `createItem()` con `item_type: 'event'`
- **Archivo action**: `src/features/planner/actions.ts`
- **Estado**: ✅ Funciona (campos básicos)

---

## Paso 4: Ver el evento en la vista

El evento aparece instantáneamente (optimistic update) en:
- **Vista Lista**: agrupado por fecha → `planner-list.tsx`
- **Vista Calendario**: bloque visual → `planner-calendar.tsx`
- **Vista Kanban**: No aparece (solo tasks)

- **Estado**: ✅ Funciona

---

## Paso 5: Click en el evento (Editar)

Laura clickea el evento para editarlo.

### Lo que funciona:
- Cambiar título, fechas, color, ubicación, descripción ✅
- Cambiar proyecto ✅

### Lo que NO funciona (falta implementar):
- **Panel de detalle del item** (sidebar o modal detalle): 🚧
  - Ver / agregar comentarios: 🚧
  - Ver / gestionar checklists: 🚧
  - Ver / agregar attachments: 🚧
  - Ver / gestionar labels: 🚧 (solo desde Kanban card)
  - Asignar miembros: 🚧
  - Ver watchers: 🚧

- **Estado**: ⚠️ Parcial — solo edición básica

---

## Paso 6: Eliminar evento

Laura quiere cancelar la reunión.

- **Action**: `deleteItem()` / `deleteCalendarEvent()` (soft delete)
- **UI de Delete**: Existe `planner-event-actions.tsx` con confirmación
- **Estado**: ✅ Funciona (soft delete vía `is_deleted = true`)

---

## Diagrama completo

```
[Planner Page]
   │
   ├── getBoards(orgId) ──────────── planner.boards
   ├── getCalendarItems(orgId) ───── planner.items (WHERE dates NOT NULL)
   ├── getBoardWithData(boardId) ─── planner.boards + lists + items + labels
   │
   └── [PlannerView] (Client Orchestrator)
       │
       ├── [Lista] ─── Filtra por búsqueda/tipo → muestra cronológico
       │   └── Click item → openModal(CalendarEventForm)
       │
       ├── [Kanban] ─── Muestra board con columnas + cards
       │   ├── Drag & drop → moveItem(), reorderItems()
       │   ├── Click card → openModal(KanbanCardForm)
       │   └── Labels → addLabelToItem(), removeLabelFromItem()
       │
       └── [Calendario] ─── Big-calendar grid mensual
           └── Click event → openModal(CalendarEventForm)
```

---

## Caso multi-actor

En plan **Teams**, múltiples miembros de la organización pueden:
- Ver todos los items (filtrado por RLS con `can_view_org`)
- Crear/editar items (con permiso `planner.manage`)
- El filtro por proyecto activo (`activeProjectId`) es client-side
