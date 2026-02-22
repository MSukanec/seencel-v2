# Design Decisions: Planner

> Decisiones de diseño, edge cases y relaciones con otros flows.

---

## Decisiones de Diseño

### D1: Items unificados (tasks + events en una sola tabla)

- **Elegimos**: Una tabla `planner.items` con campo `item_type` que distingue `task` vs `event`
- **Alternativa descartada**: Tablas separadas `planner.tasks` y `planner.events`
- **Razón**: Las entidades comparten 90% de los campos (título, fechas, proyecto, asignación). Tener una sola tabla permite filtros cruzados, vistas unificadas, y simplifica enormemente queries y RLS. Los campos exclusivos de eventos (`location`, `recurrence_rule`, `attendees`) son nullable y no afectan a tasks.

### D2: Kanban como vista, no como sistema separado

- **Elegimos**: `board_id`, `list_id` y `position` como campos directos en `planner.items`
- **Alternativa descartada**: Tabla M2M `board_items` para mapear items a boards
- **Razón**: Un item pertenece a máximo un board/list a la vez. Campos directos simplifican queries de board rendering y evitan JOINs innecesarios. El trigger `set_item_board_id()` asegura consistencia.

### D3: Un board default por organización

- **Elegimos**: `handle_new_organization()` crea automáticamente 1 board con 3 lists default (Por Hacer, Haciendo, Hecho).
- **Alternativa descartada**: Permitir boards dinámicos desde el inicio
- **Razón**: Simplifica el onboarding. El 95% de los usuarios solo necesita 1 board. La arquitectura permite múltiples boards en el futuro, pero la UI hoy está optimizada para single-board.

### D4: Client orchestrator para PlannerView

- **Elegimos**: `planner-view.tsx` como Client Component que orquesta las 3 vistas
- **Alternativa descartada**: 3 tabs separados directamente en `page.tsx`
- **Razón**: Las 3 vistas comparten estado significativo: `searchQuery`, `viewMode`, `typeFilter`, `activeProjectId`. Según `pages.md`, un client orchestrator se justifica cuando hay lógica compartida compleja entre tabs.

### D5: Shallow routing para persistir modo de vista

- **Elegimos**: `window.history.replaceState()` para mantener `?view=kanban` en la URL
- **Alternativa descartada**: `useRouter().push()` de Next.js
- **Razón**: `replaceState` no causa re-render del Server Component, evitando re-fetch de data. Es el patrón estándar para filters/tabs que no requieren nueva data del servidor.

### D6: Optimistic updates vía useOptimisticList

- **Elegimos**: React 19 `useOptimistic` via `useOptimisticList` hook
- **Alternativa descartada**: `router.refresh()` post-acción
- **Razón**: Feedback instantáneo. El usuario ve el cambio inmediatamente mientras el servidor persiste en background. Rollback automático si falla. Obligatorio según `optimistic-updates.md`.

---

## Edge Cases y Gotchas

### E1: Timezones en fechas de eventos

- **Impacto**: `items.start_at` y `end_at` son `timestamptz`. Si el frontend parsea con `new Date(string)` directamente, convierte a UTC, mostrando el día anterior en zonas horarias negativas (ej: Argentina UTC-3).
- **Solución actual**: ✅ Corregido — usa `parseDateFromDB()` y `formatDateTimeForDB()` desde `@/lib/timezone-data`.

### E2: Auto-complete al mover a lista "Hecho"

- **Impacto**: Si una list tiene `auto_complete = true`, mover un item allí lo marca como completado automáticamente vía trigger. El frontend debe reflejar esto sin re-fetch.
- **Solución futura**: Replicar la lógica del trigger en el optimistic update del drag & drop.

### E3: Items sin board/list (events puros)

- **Impacto**: Los events (tipo `event`) no pertenecen a ningún board. Aparecen en Calendar y Lista pero no en Kanban. El empty state del Kanban no debería contar events.
- **Solución actual**: ✅ El `hasNoData` check verifica `calendarEvents.length === 0 && !activeBoardData`.

### E4: Source-linked items (pagos, hitos)

- **Impacto**: Items con `source_type = 'payment'` o `'quote_milestone'` son creados por otros features de Seencel. Si el source se elimina, el item queda huérfano.
- **Solución futura**: Trigger en tablas source que haga soft-delete del item vinculado, o badge visual "Fuente eliminada".

### E5: Recurrencia de eventos

- **Impacto**: `recurrence_rule` (iCal RRULE) y `parent_item_id` existen en DB pero NO tienen UI. No hay generación de instancias de recurrencia.
- **Solución futura**: Implementar un RRULE parser en frontend para generar items virtuales en el calendario, y un backend job para materializar instancias futuras.

---

## Relación con otros Flows

| Flow | Conexión |
|------|----------|
| **Proyectos** | `items.project_id` vincula items a proyectos. Filtro `activeProjectId` filtra items client-side. |
| **Finanzas** | `source_type='payment'` + `source_id` vincula pagos programados como items del planner. |
| **Presupuestos** | `source_type='quote_milestone'` vincula hitos de presupuesto al planner. |
| **Bitácora** | `source_type='sitelog'` (futuro) vincularía entradas de bitácora. |
| **Notificaciones** | `planner.mentions` + `planner.reminders` deberían enviar notificaciones (🚧 sin implementar). |
| **Equipo** | `items.assigned_to` + `attendees.member_id` + `item_watchers.member_id` usan `iam.organization_members.id` como FK. |
