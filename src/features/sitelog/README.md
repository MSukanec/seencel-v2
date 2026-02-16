# Bitácora de Obra (SiteLog)

## Descripción

La Bitácora de Obra permite registrar las actividades diarias, incidencias, condiciones climáticas y avances de los proyectos de construcción. Funciona como un diario digital de obra donde los miembros del equipo documentan el progreso y los eventos relevantes.

## Estructura del Feature

```
src/features/sitelog/
├── actions.ts                    # Server actions (CRUD)
├── constants.ts                  # WEATHER_CONFIG, SEVERITY_OPTIONS
├── types.ts                      # SiteLog, SiteLogType interfaces
├── forms/
│   ├── sitelog-entry-form.tsx     # Form para crear/editar registros
│   └── sitelog-type-form.tsx      # Form para crear/editar tipos
├── views/
│   ├── sitelog-entries-view.tsx   # Vista principal con feed de registros
│   └── sitelog-settings-view.tsx  # Gestión de tipos de bitácora
└── components/
    ├── sitelog-feed.tsx           # Feed de cards con LogCard
    └── sitelog-types-manager.tsx  # (legacy, lógica migrada a settings view)
```

## Modelo de Datos

### Entidades principales

- **site_logs**: Registros individuales de bitácora con fecha, comentarios, clima, severidad y visibilidad.
- **site_log_types**: Tipos/categorías para clasificar registros (ej: General, Incidente, Inspección). Incluye tipos de sistema (`is_system=true`) y de organización.

### Relaciones

- `site_logs.organization_id` → `organizations.id`
- `site_logs.project_id` → `projects.id` (opcional)
- `site_logs.entry_type_id` → `site_log_types.id`
- `site_logs.created_by` → `members.id`

## Funcionalidad

### Registros (Entries View)

- **Crear/Editar** registros con: fecha, tipo, clima, severidad, contenido, archivos adjuntos y visibilidad.
- **Filtrado** client-side por: búsqueda de texto, severidad, tipo, favoritos y proyecto activo.
- **Eliminación optimista** con confirmación vía `DeleteConfirmationDialog`.
- **Favoritos**: toggle rápido para marcar registros importantes.
- **Visibilidad**: controla si el registro es visible para el cliente o solo para equipo interno.

### Tipos (Settings View)

- **CRUD** de tipos de bitácora personalizados por organización.
- **Tipos de sistema** (ej: "General") son de solo lectura — no se editan ni eliminan.
- **Eliminación con reasignación**: al eliminar un tipo, se puede reasignar los registros asociados a otro tipo vía `DeleteReplacementModal`.

## Rutas

| Contexto | Ruta |
|----------|------|
| Organización | `/organization/sitelog` → `/organizacion/bitacora` |
| Proyecto | `/project/[projectId]/sitelog` → `/proyecto/[projectId]/bitacora` |

## Patrones aplicados

- **Pattern A**: `page.tsx` es Server Component, importa views directamente.
- **Semi-autónomo**: Ambos forms usan `useModal()` + `useRouter()` internamente.
- **Field Factories**: Todos los campos usan factories (`DateField`, `SelectField`, `NotesField`, `SwitchField`, `TextField`).
- **Optimistic UI**: Eliminación de registros es optimista con rollback en error.
- **Sticky Footer**: Ambos forms usan el patrón `flex flex-col h-full min-h-0` + `FormFooter`.
