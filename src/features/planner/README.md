# Feature: Planner (Agenda)

## Propósito

La Agenda es el centro de planificación de la organización. Tiene dos herramientas:

- **Calendario**: Para eventos con fecha/hora (reuniones, hitos, plazos)
- **Panel de Tareas**: Para organizar ideas, pendientes y cosas por hacer

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
│   ├── planner-calendar.tsx   # Calendario completo
│   └── planner-list-view.tsx  # Vista lista del calendario
├── forms/            # Formularios (card, event, board)
├── types.ts          # Tipos TypeScript
└── views/
    └── planner-page.tsx  # Orchestrador client (tabs Calendario/Panel)
```

## Documentación

La doc del usuario está en `content/docs/es/agenda/` con tres artículos:
- `introduccion.mdx` — Visión general
- `calendario.mdx` — Cómo usar el calendario
- `kanban.mdx` — Cómo usar el panel de tareas
