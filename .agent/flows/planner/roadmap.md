# Roadmap: Planner

> Estado actual y pendientes del sistema de planificación.

---

## ✅ Completado

| Qué | Detalle |
|-----|---------|
| Schema V2 (SQL) | 14 tablas, RLS completo, triggers de audit, auto_complete, set_board_id, indexes, views |
| Tabla `planner.items` unificada | Tasks y events en una sola entidad |
| Board + Lists CRUD | Crear, editar, eliminar boards y lists |
| Items CRUD básico | Crear, editar, eliminar, mover items entre lists |
| Drag & Drop Kanban | Mover cards entre columnas, reordenar posición |
| Labels management | CRUD labels, assign/remove labels de items |
| Calendar Event Form | Crear/editar eventos con título, fechas, color, proyecto, ubicación |
| Kanban Card Form | Crear/editar tasks con título, descripción, priority, labels, dates |
| Vista unificada (3 modos) | List + Kanban + Calendar en una sola página |
| Optimistic updates | `useOptimisticList` para crear/editar eventos sin recargar |
| Toolbar con ToolbarTabs | Switch de modos, búsqueda con debounce 300ms, filtros |
| Empty State correcto | `ViewEmptyState` con `docsPath`, `mode="empty"` y `mode="no-results"` |
| Loading skeleton | `loading.tsx` con PageSkeleton |
| Documentación MDX | ES + EN unificados en `/docs/agenda/introduccion` |
| Timezone-safe date handling | `parseDateFromDB()` + `formatDateTimeForDB()` |
| Audit triggers | Activity logs para items, boards, comments |
| RLS con permisos granulares | `planner.view`, `planner.manage` |
| Routing i18n | `/organization/planner` → `/organizacion/planificador` |

---

## ⏳ Pendiente: Corto plazo (impacto alto, factible con lo que hay)

### P1: Panel de Detalle de Item ⭐ PRIORIDAD ALTA

- **Qué**: Sidebar o modal detalle al clickear un item. Muestra título, descripción, fechas, checklist progress, comments, attachments, labels, assigned_to
- **Archivos a crear/modificar**: 
  - `src/features/planner/components/item-detail-panel.tsx` [NUEVO]
  - `src/features/planner/queries.ts` (usar `getItemDetails` que ya existe)
- **Tablas involucradas**: `planner.items`, `planner.checklists`, `planner.comments`, `planner.attachments`
- **Impacto**: Sin esto, el usuario no puede ver la información completa de un item

### P2: Comentarios en Items ⭐ PRIORIDAD ALTA

- **Qué**: Sección de comentarios dentro del panel de detalle
- **Archivos a crear/modificar**:
  - `src/features/planner/components/item-comments.tsx` [NUEVO]
  - `src/features/planner/actions.ts` → agregar `createComment()`, `updateComment()`, `deleteComment()`
  - `src/features/planner/queries.ts` → agregar `getComments(itemId)`
- **Tabla**: `planner.comments` (ya existe con RLS)
- **Impacto**: Core feature de cualquier gestor de proyectos — sin comentarios, la colaboración se rompe

### P3: Checklists (Subtareas)

- **Qué**: Dentro del panel de detalle, poder crear checklists con items que se marcan como completados
- **Archivos a crear/modificar**:
  - `src/features/planner/components/item-checklist.tsx` [NUEVO]
  - `src/features/planner/actions.ts` → agregar CRUD checklists + checklist items
  - `src/features/planner/queries.ts` → agregar `getChecklists(itemId)`
- **Tablas**: `planner.checklists`, `planner.checklist_items` (ya existen con RLS)
- **Impacto**: Desglosar tareas complejas en pasos — la kanban card ya muestra `checklist_progress` en la view SQL

### P4: Asignar responsable (assigned_to)

- **Qué**: Selector de miembro en ambos forms (event + card) y en el panel de detalle
- **Archivos a crear/modificar**:
  - `src/features/planner/forms/calendar-event-form.tsx` → agregar campo `assigned_to`
  - `src/features/planner/forms/kanban-card-form.tsx` → verificar que ya lo tenga
  - Usar `MemberSelector` existente o crear `AssigneeField`
- **Tabla**: `planner.items.assigned_to` (FK a `iam.organization_members.id`)
- **Impacto**: Sin esto, no se puede saber quién es responsable de qué

### P5: Adjuntos (Attachments)

- **Qué**: Subir archivos (fotos, PDFs, planos) a un item
- **Archivos a crear/modificar**:
  - `src/features/planner/components/item-attachments.tsx` [NUEVO]
  - `src/features/planner/actions.ts` → agregar `uploadAttachment()`, `deleteAttachment()`
  - Supabase Storage bucket para archivos del planner
- **Tabla**: `planner.attachments` (ya existe con RLS)
- **Impacto**: Contexto visual — adjuntar fotos de avance, planos de referencia

### P6: Attendees (Asistentes a eventos)

- **Qué**: Agregar miembros del equipo como asistentes a un evento/reunión
- **Archivos a crear/modificar**:
  - `src/features/planner/forms/calendar-event-form.tsx` → agregar sección attendees
  - `src/features/planner/actions.ts` → agregar `addAttendee()`, `removeAttendee()`, `updateAttendeeStatus()`
  - `src/features/planner/queries.ts` → `getItemWithAttendees()` ya existe ✅
- **Tabla**: `planner.attendees` (ya existe con RLS)
- **Impacto**: Saber quién asiste a reuniones de obra

---

## ⏳ Pendiente: Mediano plazo (requiere más diseño)

### P7: Watchers (Observadores)

- **Qué**: Un miembro puede "seguir" un item para recibir notificaciones de cambios
- **Tabla**: `planner.item_watchers` (ya existe con RLS)
- **Requiere**: Sistema de notificaciones funcionando (flow `notifications`)
- **Archivos**: Botón "Seguir" en panel de detalle → `src/features/planner/components/item-detail-panel.tsx`

### P8: Mentions (@menciones en comentarios)

- **Qué**: @mencionar a un miembro en un comentario para notificarlo
- **Tabla**: `planner.mentions` (ya existe con RLS)
- **Requiere**: P2 (Comentarios) + sistema de notificaciones
- **Archivos**: Editor de comentarios con autocomplete de miembros

### P9: Reminders (Recordatorios)

- **Qué**: Configurar un reminder X minutos/horas antes de un evento o deadline
- **Tabla**: `planner.reminders` (ya existe con RLS)
- **Requiere**: 
  - Backend job/cron que consulte `WHERE remind_at <= now() AND is_sent = false`
  - Sistema de notificaciones push o email
  - UI en form para configurar `remind_at`
- **Impacto alto** pero alta complejidad — necesita infraestructura de envío

### P10: Board Permissions (permisos granulares por tablero)

- **Qué**: Restringir quién puede ver/editar un tablero específico
- **Tabla**: `planner.board_permissions` (ya existe con RLS)
- **Requiere**: UI de gestión de permisos + integrar con RLS existente
- **Aplica solo a plan Teams**

### P11: Recurrencia de eventos

- **Qué**: "Repetir cada martes", "Repetir mensualmente"
- **Campos**: `items.recurrence_rule` (iCal RRULE), `items.recurrence_end_at`, `items.parent_item_id`
- **Requiere**:
  - Parser RRULE en frontend (ej: `rrule` npm package)
  - Generación de instancias (virtual en calendario, materializada para notificaciones)
  - UI de selección de recurrencia en event form
- **Complejidad**: Alta — iCal RRULE es un estándar complejo

---

## 🔮 Pendiente: Largo plazo (evolución futura)

### P12: Templates de boards

- **Qué**: Boards marcados como `is_template = true` que se pueden clonar para nuevos proyectos
- **Campo**: `boards.is_template`, `boards.template_id`
- **Caso de uso**: "Sprint Board", "Obra Civil Board", etc.

### P13: Multi-board UI

- **Qué**: Interfaz para gestionar múltiples boards (hoy la UI está optimizada para 1)
- **Incluye**: Board selector, crear/eliminar boards, permisos por board

### P14: Integración con Calendario externo (Google Calendar, Outlook)

- **Qué**: Sync bidireccional de eventos del planner con calendarios externos
- **Requiere**: OAuth flow, API de Google/Microsoft, webhook/polling

### P15: Time Tracking

- **Qué**: Registrar `actual_hours` contra `estimated_hours` para medir productividad
- **Campos**: `items.estimated_hours`, `items.actual_hours` (ya existen)
- **Requiere**: Timer UI en panel de detalle, reportes

### P16: Vinculación automática con otros features

- **Qué**: Cuando se crea un pago con fecha, auto-crear item en planner con `source_type='payment'`
- **Requiere**: Triggers en tablas de Finanzas / Presupuestos / Subcontratos que inserten en `planner.items`

### P17: Vista Gantt

- **Qué**: Cuarta vista: diagrama de Gantt para visualizar dependencias y duración de tasks
- **Requiere**: Campo `dependencies` (M2M), library de Gantt
