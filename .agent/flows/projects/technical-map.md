# Technical Map: Proyectos

> Referencia técnica exhaustiva. Para consulta rápida, no tutorial.

---

## 1. Tablas involucradas

### `projects.projects` — Identidad del proyecto
| Columna | Tipo | FK | Uso |
|---------|------|----|-----|
| `id` | uuid PK | — | ID principal, referenciado por todo el sistema |
| `name` | text | — | Nombre visible |
| `code` | text? | — | Código interno opcional |
| `status` | project_status | — | `active`, `planning`, `inactive`, `completed` |
| `color` | text? | — | Color identificativo preset |
| `image_url` | text? | — | Imagen principal (Storage) |
| `image_palette` | jsonb? | — | Paleta extraída de la imagen |
| `project_type_id` | uuid? | → project_types.id | Clasificación por naturaleza |
| `project_modality_id` | uuid? | → project_modalities.id | Clasificación por contrato |
| `organization_id` | uuid | — | Org dueña |
| `last_active_at` | timestamptz? | — | Última vez que un user entró (para sidebar order) |
| `is_over_limit` | bool | — | Flag de billing: proyecto superó límite del plan |
| `created_by` | uuid? | → org_members.id | Miembro que creó |

### `projects.project_data` — Info extendida (1:1 con projects)
| Columna | Tipo | Uso |
|---------|------|-----|
| `project_id` | uuid PK, FK | 1:1 con projects |
| `description` | text? | Descripción larga |
| `surface_total/covered/semi` | numeric? | Superficies en m² |
| `lat/lng` | numeric? | Coordenadas para mapa |
| `address/city/state/country/zip_code` | text? | Dirección |
| `place_id` | text? | Google Places ID |
| `is_public` | bool | Si es visible sin login (RLS) |

### `projects.project_settings` — Config visual (1:1 con projects)
| Columna | Tipo | Uso |
|---------|------|-----|
| `project_id` | uuid UNIQUE, FK | 1:1 con projects |
| `use_custom_color` | bool | Usar color custom en vez de preset |
| `custom_color_h` | int? | Hue del color custom |
| `custom_color_hex` | text? | Hex del color custom |
| `use_palette_theme` | bool | Tema basado en paleta de imagen |
| `work_days` | int[] | Días laborales (1-7) |

### `projects.project_types` — Tipos de proyecto (org-scoped + system)
| Columna | Tipo | Uso |
|---------|------|-----|
| `name` | text | "Residencial", "Comercial", etc. |
| `is_system` | bool | System = global, org = custom |
| `organization_id` | uuid? | NULL si es system |

### `projects.project_modalities` — Modalidades (ídem tipos)
Misma estructura que `project_types`.

### `projects.project_clients` — Clientes vinculados
| Columna | Tipo | FK | Uso |
|---------|------|----|-----|
| `project_id` | uuid | → projects.id | Proyecto |
| `contact_id` | uuid? | → contacts.id | Contacto vinculado |
| `client_role_id` | uuid? | → client_roles.id | Rol en el proyecto |
| `is_primary` | bool | — | Cliente principal |
| `status` | text | — | `active` / `inactive` |

### `projects.client_roles` — Roles de cliente
| Columna | Tipo | Uso |
|---------|------|-----|
| `name` | text | "Propietario", "Inversor", "Representante" |
| `is_system` | bool | Predefinidos vs custom |

### `projects.client_portal_branding` — Branding del portal (1:1)
Colores, hero, footer text, show_powered_by.

### `projects.client_portal_settings` — Visibilidad del portal (1:1)
Toggles: show_dashboard, show_installments, show_payments, show_logs, show_quotes, show_progress, allow_comments.

---

## 2. Views SQL

| Vista | Uso | Joins |
|-------|-----|-------|
| `projects_view` | Listado principal con datos de settings, data, type y modality | projects ← project_data ← project_settings ← project_types ← project_modalities |
| `project_clients_view` | Clientes del proyecto con contacto, rol, invitaciones | project_clients ← contacts ← users ← client_roles ← organization_invitations |
| `project_access_view` | Acceso externo (colaboradores) con contacto y usuario | project_access ← users ← contacts ← org_members ← project_clients |
| `project_labor_view` | Mano de obra asignada con contacto y stats de pago | project_labor ← contacts ← labor_categories ← projects ← org_members ← labor_payments |

---

## 3. RLS Policies (resumen)

- **projects, project_data, project_settings**: `can_view_org(org_id, 'projects.view')` / `can_mutate_org(org_id, 'projects.manage')`
- **projects** tiene además: `can_view_project(id)` para acceso externo (clientes/colaboradores)
- **project_data** tiene además: `is_public = true` para proyectos públicos
- **project_clients, client_roles, portal_***: `can_view_org(org_id, 'commercial.view')` / `can_mutate_org(org_id, 'commercial.manage')`
- **project_labor**: `construction.view` / `construction.manage`
- **project_types, project_modalities**: `organization_id IS NULL` (system) visible para todos

---

## 4. Triggers (19 total)

Todas las tablas tienen:
- `set_timestamp()` → `updated_at` automático
- `handle_updated_by()` → `updated_by` automático
- `audit.log_*_activity()` → Activity log

---

## 5. Archivos Frontend

### Queries (`features/projects/queries.ts`)
| Función | Uso |
|---------|-----|
| `getOrganizationProjects()` | Lista todos vía `projects_view` |
| `getActiveOrganizationProjects()` | Solo activos, para selectores en forms |
| `getSidebarProjects()` | Campos mínimos para sidebar (excl. completed) |
| `getProjectById()` | Detalle completo (cached con `React.cache`) |
| `getProjectFinancialMovements()` | Movimientos financieros del proyecto |
| `getProjectLocations()` | Proyectos con lat/lng para mapa |
| `getLastActiveProject()` | Último proyecto activo del usuario |

### Actions (`features/projects/actions.ts`)
| Función | Uso |
|---------|-----|
| `createProject()` | Crea proyecto + project_data + project_settings |
| `updateProject()` | Actualiza cualquier campo de las 3 tablas |
| `updateProjectInline()` | Updates parciales desde DataTable inline |
| `deleteProject()` | Soft delete (`is_deleted = true`) |
| `checkActiveProjectLimit()` | Valida límite del plan |
| `swapProjectStatus()` | Intercambia estado entre 2 proyectos |
| `getActiveProjectsForSwap()` | Lista para swap modal |
| `saveLastActiveProject()` | Guarda último proyecto en preferencias |
| `fetchProjectsAction()` | Wrapper para sidebar |
| `getProjectTypes()` / `createProjectType()` / `updateProjectType()` / `deleteProjectType()` | CRUD tipos |
| `getProjectModalities()` / `createProjectModality()` / `updateProjectModality()` / `deleteProjectModality()` | CRUD modalidades |

### Forms
| Archivo | Panel ID | Uso |
|---------|----------|-----|
| `projects-project-form.tsx` | `project-form` | Crear/editar proyecto |
| `projects-type-form.tsx` | — | Crear/editar tipo (inline en settings) |
| `projects-modality-form.tsx` | — | Crear/editar modalidad (inline en settings) |
| `clients-form.tsx` | `clients-client-form` | Vincular cliente al proyecto |
| `invite-client-portal-form.tsx` | `clients-invite-portal-form` | Invitar al portal |
| `collaborator-form.tsx` | `collaborator-form` | Vincular colaborador |

### Views
| Archivo | Qué muestra |
|---------|-------------|
| `projects-list-view.tsx` | DataTable + Cards toggle de todos los proyectos |
| `projects-location-view.tsx` | Mapa global con marcadores |
| `projects-settings-view.tsx` | Gestión de tipos y modalidades |
| `project-dashboard-view.tsx` | Dashboard del proyecto (widgets) |
| `project-profile-view.tsx` | Perfil editable (autosave) |
| `project-appearance-view.tsx` | Color, imagen, paleta |
| `project-location-view.tsx` | Ubicación del proyecto (mapa individual) |
| `project-participants-view.tsx` | Clientes y colaboradores |

### Pages
| Ruta | Archivo |
|------|---------|
| `/organization/projects` | `page.tsx` → list view |
| `/organization/projects/location` | `location/page.tsx` → mapa |
| `/organization/projects/settings` | `settings/page.tsx` → config |
| `/organization/projects/[projectId]` | `[projectId]/page.tsx` → detalle |

### Componentes
| Archivo | Uso |
|---------|-----|
| `project-card.tsx` | Card del proyecto para grid view |
| `project-swap-modal.tsx` | Modal para intercambiar estados cuando se alcanza el límite |

---

## 6. Cadena de datos

```
auth.uid()
  → iam.users (auth_id → id)
  → iam.organization_members (user_id + org_id → member_id)
  → RLS: can_view_org(org_id, 'projects.view') / can_mutate_org(org_id, 'projects.manage')
  → projects.projects (organization_id filtered)
  → projects.project_data (project_id)
  → projects.project_settings (project_id)
  → projects.project_clients (project_id → contact_id)
```

Para acceso externo (clients/collaboradores):
```
auth.uid()
  → iam.users → id
  → iam.project_access (user_id + project_id + is_active)
  → RLS: can_view_project(project_id)
  → projects.projects (id)
```
