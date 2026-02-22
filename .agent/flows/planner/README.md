# Planner — Sistema Unificado de Planificación

> **Alcance**: Tasks y Events son la misma entidad (`planner.items`). Kanban, Calendario y Lista son vistas de la misma data.

## ¿Qué resuelve?

Laura, jefa de obra, necesita organizar todo en un solo lugar: reuniones con proveedores (eventos), entregas de materiales (tareas con deadline), inspecciones (tareas recurrentes) y pagos programados (items vinculados desde Finanzas). Con el Planner puede:

1. Ver su **Lista** cronológica de todo lo que viene
2. Gestionar avance con un **Kanban** (To Do → Doing → Done)
3. Tener visión mensual en el **Calendario**

Todo opera sobre la misma tabla `planner.items` — cambiar un item en Kanban lo refleja en Calendario y viceversa.

## Conceptos clave

| Concepto | Qué es | Tabla |
|----------|--------|-------|
| **Item** | Entidad core: puede ser `task` o `event` | `planner.items` |
| **Board** | Tablero Kanban (1 por org default) | `planner.boards` |
| **List** | Columna de un Board (To Do, Doing, Done) | `planner.lists` |
| **Label** | Etiqueta de color asignable a items | `planner.labels` / `planner.item_labels` |
| **Checklist** | Lista de subtareas dentro de un item | `planner.checklists` / `planner.checklist_items` |
| **Comment** | Comentario de un miembro en un item | `planner.comments` |
| **Mention** | @mención a un miembro dentro de un comentario | `planner.mentions` |
| **Attachment** | Archivo adjunto a un item | `planner.attachments` |
| **Watcher** | Miembro que observa cambios en un item | `planner.item_watchers` |
| **Attendee** | Asistente a un evento/reunión | `planner.attendees` |
| **Reminder** | Recordatorio programado pre-evento/deadline | `planner.reminders` |
| **Board Permission** | Permiso granular por miembro/rol en un tablero | `planner.board_permissions` |

## Flujo resumido

```
Planner Page (Server) → PlannerView (Client Orchestrator)
    ├── Lista → PlannerList (cronológico)
    ├── Kanban → KanbanDashboard → KanbanBoard → KanbanColumns → KanbanCards
    └── Calendario → PlannerCalendar (big-calendar)
```

## Documentos en esta carpeta

| Archivo | Contenido |
|---------|-----------|
| [README.md](README.md) | Este archivo — overview y conceptos |
| [user-journey.md](user-journey.md) | Paso a paso: crear evento, gestionar en Kanban |
| [technical-map.md](technical-map.md) | Tablas, funciones, archivos frontend, cadena de datos |
| [design-decisions.md](design-decisions.md) | Decisiones de diseño, edge cases, relaciones |
| [roadmap.md](roadmap.md) | Estado actual y todo lo que falta implementar |
