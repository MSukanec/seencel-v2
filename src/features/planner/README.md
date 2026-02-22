# Feature: Planner (Agenda)

## Propósito

La Agenda es el centro de planificación de la organización. Ofrece **3 modos de visualización**
sobre el mismo dataset unificado (`planner.items`):

- **Lista**: Vista cronológica de eventos agrupados por fecha
- **Panel de Tareas (Kanban)**: Tableros con listas y tarjetas para gestionar tareas
- **Calendario**: Grilla mensual con navegación

El selector de modo está integrado en el **Toolbar** (header) como un `ToolbarTabs` animado
con íconos (`List`, `LayoutGrid`, `Calendar`). El modo seleccionado persiste en la URL
como `?view=list|kanban|calendar`.

## ⚠️ Panel de Tareas ≠ Tareas de Obra

El Panel de Tareas **NO** es para tareas de construcción (hormigonado, mampostería, etc.).
Es un espacio de gestión general: ideas, to-dos, pendientes administrativos, coordinación.

Para tareas de obra → usar **Tareas de Obra** dentro de cada proyecto.

## Regla de Empty State

La `featureDescription` del `ViewEmptyState` debe ser **~4 líneas visibles** (con `max-w-lg`).
Esto mantiene consistencia visual y no agobia al usuario. Si el texto es más largo, ajustar
la redacción sin perder contenido útil.

## Estructura

```
planner/
├── actions/          # Server actions
├── components/       # Componentes internos
│   ├── kanban-*      # Todo lo de paneles (dashboard, board, card, column)
│   ├── planner-calendar.tsx   # Calendario (sin Toolbar propio)
│   └── planner-list.tsx       # Vista lista cronológica
├── forms/            # Formularios (card, event, board)
├── types.ts          # Tipos TypeScript (PlannerItem unificado)
└── views/
    └── planner-view.tsx  # Orchestrador client (3 modos: Lista/Kanban/Calendario)
```

## Arquitectura

```
page.tsx (Server)
├── Fetch: boards, calendarEvents, projects, planFeatures
└── Renderiza PlannerView (Client Orchestrator)
    ├── Toolbar con ToolbarTabs (mode selector) + search/filtros
    └── Renderizado condicional:
        ├── viewMode === "list"     → PlannerList
        ├── viewMode === "kanban"   → KanbanDashboard
        └── viewMode === "calendar" → PlannerCalendar
```

**Justificación del Client Orchestrator**: Estado compartido significativo
entre los 3 modos (viewMode, searchQuery, typeFilter, board selection).

## Documentación

La doc del usuario está en `content/docs/es/agenda/` con tres artículos:
- `introduccion.mdx` — Visión general
- `calendario.mdx` — Cómo usar el calendario
- `kanban.mdx` — Cómo usar el panel de tareas
