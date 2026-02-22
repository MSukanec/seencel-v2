# Technical Map: Planner

> Referencia técnica exhaustiva del sistema Planner.

## 1. Tablas involucradas

### 1.1 Core

| Tabla | Columnas clave | Para qué |
|-------|----------------|----------|
| `planner.items` | `id`, `organization_id`, `project_id`, `item_type` (task/event), `title`, `start_at`, `due_at`, `end_at`, `status`, `priority`, `is_completed`, `assigned_to`, `board_id`, `list_id`, `position`, `source_type`, `source_id`, `recurrence_rule`, `location` | Entidad nuclear. Tasks y Events unificados. |
| `planner.boards` | `id`, `organization_id`, `project_id`, `name`, `default_list_id`, `is_template` | Tableros Kanban. Cada org tiene 1 default. |
| `planner.lists` | `id`, `board_id`, `name`, `position`, `limit_wip`, `auto_complete` | Columnas de un board. "To Do", "Doing", "Done". |

### 1.2 Extensiones

| Tabla | Columnas clave | Para qué | Uso en frontend |
|-------|----------------|----------|-----------------|
| `planner.labels` | `id`, `organization_id`, `name`, `color` | Etiquetas de color | ✅ CRUD + assign |
| `planner.item_labels` | `item_id`, `label_id` (M2M) | Relación item↔label | ✅ Add/remove |
| `planner.checklists` | `id`, `item_id`, `title`, `position` | Listas de subtareas | 🚧 Sin UI |
| `planner.checklist_items` | `id`, `checklist_id`, `content`, `is_completed`, `assigned_to`, `due_date` | Items de checklist | 🚧 Sin UI |
| `planner.comments` | `id`, `item_id`, `author_id`, `content` | Comentarios en items | 🚧 Sin UI |
| `planner.mentions` | `id`, `comment_id`, `mentioned_member_id`, `is_read` | @menciones en comments | 🚧 Sin UI |
| `planner.attachments` | `id`, `item_id`, `file_url`, `file_name`, `uploaded_by` | Adjuntos en items | 🚧 Sin UI |
| `planner.item_watchers` | `item_id`, `member_id` (M2M) | Observadores de items | 🚧 Sin UI |
| `planner.attendees` | `id`, `item_id`, `member_id`, `status` (pending/accepted/declined/tentative) | Asistentes a eventos | 🚧 Sin UI (query existe) |
| `planner.reminders` | `id`, `item_id`, `remind_at`, `reminder_type`, `is_sent` | Recordatorios | 🚧 Sin UI ni job |
| `planner.board_permissions` | `id`, `board_id`, `member_id`, `role_id`, `permission_level` | Permisos granulares | 🚧 Sin UI |

---

## 2. Funciones SQL

| Función | Lógica | Trigger |
|---------|--------|---------|
| `planner.auto_complete_item()` | Si un item se mueve a una list con `auto_complete=true`, marca `is_completed=true`, `status='done'` | `BEFORE INSERT/UPDATE OF list_id ON items` |
| `planner.set_item_board_id()` | Si un item tiene `list_id`, auto-setea `board_id` desde la list | `BEFORE INSERT/UPDATE OF list_id ON items` |
| `planner.log_item_activity()` | Audit log: create/update/delete/complete/archive item → `audit.organization_activity_logs` | `AFTER INSERT/UPDATE/DELETE ON items` |
| `planner.log_board_activity()` | Audit log: create/update/delete/archive board → `audit.organization_activity_logs` | `AFTER INSERT/UPDATE/DELETE ON boards` |
| `planner.log_comment_activity()` | Audit log: create/update/delete comment → `audit.organization_activity_logs` | `AFTER INSERT/UPDATE/DELETE ON comments` |
| `set_timestamp()` | Global — auto updated_at | Múltiples tablas |
| `handle_updated_by()` | Global — auto updated_by con member_id | Múltiples tablas |

---

## 3. Views SQL

| Vista | Para qué |
|-------|----------|
| `planner.boards_view` | Boards enriquecidos con `project_name`, `list_count`, `item_count`, `completed_item_count` |
| `planner.items_view` | Items con `list_name`, `board_name`, `assigned_to_user_id`, `comment_count`, `attachment_count`, `checklist_progress`, `labels[]` |

---

## 4. Archivos Frontend

### Pages

| Archivo | Qué hace |
|---------|----------|
| `src/app/[locale]/(dashboard)/organization/planner/page.tsx` | Server Component. Fetch: boards, calendarItems, boardWithData, projects. Render: PlannerView |
| `src/app/[locale]/(dashboard)/organization/planner/loading.tsx` | PageSkeleton durante carga |

### Views

| Archivo | Qué hace |
|---------|----------|
| `src/features/planner/views/planner-view.tsx` | Client orchestrator. 3 modos: List, Kanban, Calendar. Toolbar + filters + empty state |

### Components

| Archivo | Qué hace |
|---------|----------|
| `planner-list.tsx` | Lista cronológica agrupada por fecha |
| `planner-calendar.tsx` | Calendario mensual (react-big-calendar) |
| `kanban-dashboard.tsx` | Orchestador Kanban (empty state o board) |
| `kanban-board.tsx` | Board completo: columnas con DnD |
| `kanban-column.tsx` | Columna individual con cards |
| `kanban-card.tsx` | Card individual (labels, deadline, assignee) |
| `kanban-board-selector.tsx` | Selector de boards (⚠️ deprecated post-unificación) |
| `move-list-modal.tsx` | Modal para mover lista entre boards |
| `planner-event-actions.tsx` | Acciones de evento (editar, duplicar, eliminar) |

### Forms

| Archivo | Qué hace |
|---------|----------|
| `calendar-event-form.tsx` | Crear/editar evento (título, fechas, color, proyecto, ubicación) |
| `kanban-card-form.tsx` | Crear/editar task/card (título, descripción, priority, labels, dates, assignee) |
| `kanban-board-form.tsx` | Crear/editar board |
| `kanban-list-form.tsx` | Crear/editar list (columna) |

### Queries

| Función | Qué retorna |
|---------|-------------|
| `getBoards(orgId)` | Boards de la org |
| `getBoard(boardId)` | Un board |
| `getBoardWithData(boardId)` | Board + lists (con items embebidos) + labels + members |
| `getItemDetails(itemId)` | Detalle de un item |
| `getLabels(orgId)` | Labels de la org |
| `getCalendarItems(orgId)` | Items con fechas (para calendar/list) |
| `getItemWithAttendees(itemId)` | Item con attendees (preparado, sin UI) |

### Actions

| Función | Qué hace |
|---------|----------|
| `createBoard()`, `updateBoard()`, `deleteBoard()` | CRUD boards |
| `createList()`, `updateList()`, `deleteList()`, `moveList()`, `reorderLists()` | CRUD + drag lists |
| `createItem()`, `updateItem()`, `deleteItem()`, `moveItem()`, `reorderItems()` | CRUD + drag items |
| `createLabel()`, `addLabelToItem()`, `removeLabelFromItem()` | Labels management |

---

## 5. SQL Scripts

| Archivo | Qué hace | Estado |
|---------|----------|--------|
| `090_planner_v2_schema.sql` | Schema completo: 14 tablas, RLS, triggers, indexes, views | ⚠️ Pendiente de ejecutar |
| `091_update_handle_new_org_for_planner_v2.sql` | Actualiza `handle_new_organization` para crear board/lists default | ⚠️ Pendiente de ejecutar |
| `092_drop_legacy_planner.sql` | Drop tablas legacy (kanban_*, calendar_*) | ⚠️ Pendiente (ejecutar DESPUÉS de migrar frontend) |

---

## 6. Cadena de datos

```
auth.uid()
  → iam.users (WHERE auth_id = auth.uid())
    → iam.organization_members (WHERE user_id = users.id)
      → can_view_org(org_id, 'planner.view') / can_mutate_org(org_id, 'planner.manage')
        → planner.items (RLS permite SELECT/INSERT/UPDATE/DELETE)
          → planner.boards, planner.lists, planner.labels (via organization_id)
            → planner.comments, planner.checklists, planner.attachments (via item_id)
```
