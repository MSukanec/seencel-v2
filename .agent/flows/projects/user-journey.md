# User Journey: Proyectos

> Tutorial paso a paso de cómo un usuario gestiona proyectos en Seencel.

## Escenario

María es directora de obra en Constructora Patagonia. Necesita crear un nuevo proyecto "Torre Palermo 42", asignarle tipo y modalidad, configurar su apariencia, vincular al cliente propietario, y empezar a operar.

---

## Paso 1: Crear un proyecto

**Qué hace el usuario**: Desde la vista de Proyectos, hace clic en "Nuevo Proyecto" (header action). Se abre un **panel** con el formulario de creación.

- **Tabla escrita**: `projects.projects` (nombre, código, estado, color, image_url, image_palette, type_id, modality_id)
- **Tablas auxiliares creadas**: `projects.project_data` (ubicación si se ingresó), `projects.project_settings` (color customization)
- **Archivos frontend**:
  - Form: `features/projects/forms/projects-project-form.tsx`
  - Action: `features/projects/actions.ts` → `createProject()`
  - Panel ID: `project-form` (registrado en `panel-registry.ts`)

**Validación**: Si el plan tiene límite de proyectos activos y se alcanzó, se muestra el `ProjectSwapModal` para desactivar otro proyecto.
- Función SQL: `billing.check_active_project_limit()`
- Action: `checkActiveProjectLimit()`, `swapProjectStatus()`
- Componente: `features/projects/components/project-swap-modal.tsx`

**Estado**: ✅ Funciona

---

## Paso 2: Ver todos los proyectos

**Qué hace el usuario**: Accede a Proyectos desde el sidebar. Ve una **DataTable** con todos los proyectos o un **grid de cards**. Puede filtrar por estado, tipo, modalidad y buscar por nombre.

- **Tabla leída**: `projects.projects_view` (view que une projects + project_data + project_settings + types + modalities)
- **Archivos frontend**:
  - Page: `app/[locale]/(dashboard)/organization/projects/page.tsx`
  - View: `features/projects/views/projects-list-view.tsx`
  - Columns: `features/projects/tables/projects-columns.tsx`
  - Card: `features/projects/components/project-card.tsx`
  - Query: `features/projects/queries.ts` → `getOrganizationProjects()`

**Estado**: ✅ Funciona — inline editing, context menu, toggle table/cards

---

## Paso 3: Ver proyectos en el mapa

**Qué hace el usuario**: Navega a Proyectos → Ubicación. Ve un mapa con marcadores para cada proyecto que tenga coordenadas lat/lng.

- **Tabla leída**: `projects.project_data` + join con `projects.projects`
- **Archivos frontend**:
  - Page: `app/[locale]/(dashboard)/organization/projects/location/page.tsx`
  - View: `features/projects/views/projects-location-view.tsx`
  - Query: `features/projects/queries.ts` → `getProjectLocations()`

**Estado**: ✅ Funciona

---

## Paso 4: Entrar al detalle de un proyecto

**Qué hace el usuario**: Hace clic en un proyecto (desde la tabla, card, o sidebar). Entra a la **página de detalle** del proyecto con múltiples sub-vistas via sidebar drill-down.

- **Tabla leída**: `projects.projects` + joins con `project_data`, `project_settings`, `project_types`, `project_modalities`
- **Archivos frontend**:
  - Page: `app/[locale]/(dashboard)/organization/projects/[projectId]/page.tsx`
  - Detail Page: `features/projects/views/details/project-detail-page.tsx`
  - Query: `features/projects/queries.ts` → `getProjectById()` (cached con `React.cache`)

**Sub-vistas del detalle** (sidebar drill-down):

| Sub-vista | Archivo | Qué muestra |
|-----------|---------|-------------|
| Perfil | `project-profile-view.tsx` | Nombre, descripción, superficies (autosave) |
| Apariencia | `project-appearance-view.tsx` | Color, imagen, paleta, preview card |
| Ubicación | `project-location-view.tsx` | Mapa con geocoding, dirección |
| Participantes | `project-participants-view.tsx` | Clientes + Colaboradores (panels) |

**Estado**: ✅ Funciona

---

## Paso 5: Configurar apariencia del proyecto

**Qué hace el usuario**: En detalle → Apariencia, elige un color identificativo preset o custom, sube una imagen y opcionalmente activa el tema basado en paleta.

- **Tablas escritas**: `projects.projects` (color, image_url, image_palette), `projects.project_settings` (use_custom_color, custom_color_h, custom_color_hex, use_palette_theme)
- **Archivos frontend**:
  - View: `features/projects/views/details/project-appearance-view.tsx`
  - Action: `features/projects/actions.ts` → `updateProject()`

**Estado**: ✅ Funciona

---

## Paso 6: Vincular clientes al proyecto

**Qué hace el usuario**: En detalle → Participantes → "Agregar Cliente". Se abre un **panel** para vincular un contacto existente como cliente, asignándole un rol.

- **Tabla escrita**: `projects.project_clients`
- **Tablas leídas**: `contacts.contacts`, `projects.client_roles`
- **Archivos frontend**:
  - Panel: `features/clients/forms/clients-form.tsx` (panel ID: `clients-client-form`)
  - Vista: `features/projects/views/details/project-participants-view.tsx`
  - View SQL: `projects.project_clients_view` (une clientes con contactos, roles e invitaciones)

**Estado**: ✅ Funciona — migrado de modal a panel

---

## Paso 7: Invitar cliente al portal

**Qué hace el usuario**: Desde la tarjeta del cliente en Participantes, "Invitar al Portal". Se abre un **panel** que muestra la info del contacto y envía la invitación.

- **Tablas involucradas**: `iam.organization_invitations`
- **Archivos frontend**:
  - Panel: `features/clients/forms/invite-client-portal-form.tsx` (panel ID: `clients-invite-portal-form`)
  - Action: `features/clients/actions.ts` → `sendClientInvitationAction()`

**Estado**: ✅ Funciona — migrado de modal a panel

---

## Paso 8: Gestionar configuración del proyecto

**Qué hace el usuario**: En sidebar de organización → Configuración → Proyectos. Gestiona tipos y modalidades custom de la organización.

- **Tablas**: `projects.project_types`, `projects.project_modalities`
- **Archivos frontend**:
  - Page: `app/[locale]/(dashboard)/organization/projects/settings/page.tsx`
  - View: `features/projects/views/projects-settings-view.tsx`
  - Forms: `projects-type-form.tsx`, `projects-modality-form.tsx`
  - Actions: `createProjectType()`, `updateProjectType()`, `deleteProjectType()`, `createProjectModality()`, `updateProjectModality()`, `deleteProjectModality()`

**Estado**: ✅ Funciona

---

## Diagrama completo

```
                    ┌─────────────────────┐
                    │   CREAR PROYECTO     │
                    │   (project-form)     │
                    └──────────┬──────────┘
                               │
              ┌────────────────┴────────────────┐
              │                                 │
    ┌─────────▼─────────┐            ┌─────────▼─────────┐
    │  projects          │            │  project_data      │
    │  (identity)        │            │  (location, desc)  │
    └─────────┬─────────┘            └────────────────────┘
              │
    ┌─────────▼─────────┐
    │  project_settings  │
    │  (color, theme)    │
    └─────────┬─────────┘
              │
    ┌─────────▼──────────────────────────┐
    │  DETALLE (sidebar drill-down)       │
    │  ├─ Perfil (autosave)               │
    │  ├─ Apariencia (color, imagen)      │
    │  ├─ Ubicación (mapa + geocoding)    │
    │  └─ Participantes                   │
    │     ├─ Clientes (project_clients)   │
    │     └─ Colaboradores (🔒 próx.)     │
    └────────────────────────────────────┘
              │
    ┌─────────▼─────────┐
    │  OPERACIÓN         │
    │  (sidebar context) │
    │  ├─ Materiales     │
    │  ├─ Tareas         │
    │  ├─ Finanzas       │
    │  ├─ Subcontratos   │
    │  └─ Presupuestos   │
    └────────────────────┘
```
