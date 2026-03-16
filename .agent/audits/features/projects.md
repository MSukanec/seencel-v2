# 🔍 Auditoría Pre-Lanzamiento: PROYECTOS

> Fecha: 2026-03-13
> Fuente DB: `DB/schema/projects/` (generado 2026-03-10)
> Estado: **COMPLETO — TODOS LOS FIXES APLICADOS ✅**

## Resumen

| Capa | ✅ OK | ❌ Falla | ⚠️ Aviso | 🔒 Bloqueante | Estado |
|------|-------|---------|----------|---------------|--------|
| 1. Base de Datos | 9 | 0 | 0 | 0 | ✅ APROBADA |
| 2. RLS | 9 | 0 | 0 | 0 | ✅ APROBADA |
| 3. Server Actions/Queries | 15 | 0 | 3 | 0 | ✅ COMPLETADA |
| 4. Arquitectura de Página | 7 | 0 | 1 | 0 | ✅ COMPLETADA |
| 5. Componentes UI | 5 | 0 | 1 | 0 | ✅ OK |
| 6. Performance | 5 | 0 | 0 | 0 | ✅ COMPLETADA |
| 7. Fechas/i18n/Docs | 4 | 0 | 1 | 0 | ✅ COMPLETADA |

---

## Capa 1: Base de Datos ✅ SÓLIDA

> Fuente: `DB/schema/projects/tables_1.md` + `triggers.md` + `indexes.md`

### Tablas auditadas (9):

| Tabla | `created_at` | `updated_at` | `is_deleted` | `deleted_at` | `created_by` | `updated_by` | Triggers |
|-------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `projects` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 3/3 ✅ |
| `project_data` | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | 3/3 ✅ |
| `project_settings` | ✅ | ✅ | ❌ | ❌ | — | — | 0/3 ⚠️ |
| `project_types` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 3/3 ✅ |
| `project_modalities` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 3/3 ✅ |
| `project_clients` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 2/2 ✅ |
| `project_labor` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 2/2 ✅ |
| `client_roles` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 2/2 ✅ |
| `client_portal_branding` | ✅ | ✅ | — | — | — | — | — |

### Triggers verificados (19 total):

| Tabla | `set_timestamp` | `handle_updated_by` | `audit_log` |
|-------|:---:|:---:|:---:|
| `projects` | ✅ `projects_set_updated_at` | ✅ `set_updated_by_projects` | ✅ `on_project_audit` |
| `project_data` | ✅ `project_data_set_updated_at` | ✅ `set_updated_by_project_data` | ✅ `on_project_data_audit` |
| `project_types` | ✅ `project_types_set_updated_at` | ✅ `set_updated_by_project_types` | ✅ `on_project_type_audit` |
| `project_modalities` | ✅ `project_modalities_set_updated_at` | ✅ `set_updated_by_project_modalities` | ✅ `on_project_modality_audit` |
| `project_clients` | — | ✅ `set_audit_project_clients` | ✅ `on_project_client_audit` |
| `project_labor` | — | ✅ `set_updated_by_project_labor` | ✅ `on_project_labor_audit` |
| `client_roles` | — | ✅ `set_audit_client_roles` | ✅ `on_client_role_audit` |

### Índices: 41 (parciales ✅ para is_deleted en types y modalities)

### ℹ️ Notas (no requieren fix):

| Tabla | Nota |
|-------|------|
| `project_data` | Sin `is_deleted`/`deleted_at` — es satélite 1:1, se invalida por cascada del proyecto padre. Correcto. |
| `project_settings` | Sin `is_deleted`/`created_by`/`updated_by` — es satélite 1:1 de config. Correcto. |

---

## Capa 2: RLS ✅ COMPLETA

> Fuente: `DB/schema/projects/rls.md` — 34 políticas

### Verificación por tabla:

| Tabla | SELECT | INSERT | UPDATE | Permiso |
|-------|:---:|:---:|:---:|:---:|
| `projects` | ✅ (2: org + project) | ✅ `projects.manage` | ✅ `projects.manage` | ✅ |
| `project_data` | ✅ (2: org + project + public) | ✅ `projects.manage` | ✅ `projects.manage` | ✅ |
| `project_settings` | ✅ `projects.view` | ✅ `projects.manage` | ✅ `projects.manage` | ✅ |
| `project_types` | ✅ (admin OR !deleted + org) | ✅ `projects.manage` | ✅ `projects.manage` | ✅ |
| `project_modalities` | ✅ (admin OR !deleted + org) | ✅ `projects.manage` | ✅ `projects.manage` | ✅ |
| `project_clients` | ✅ (2: org + project) | ✅ `commercial.manage` | ✅ `commercial.manage` | ✅ |
| `project_labor` | ✅ `construction.view` | ✅ `construction.manage` | ✅ `construction.manage` | ✅ |
| `client_roles` | ✅ (null org OR org) | ✅ `commercial.manage` | ✅ `commercial.manage` | ✅ |
| `client_portal_branding` | ✅ (2: org + project) | ✅ `commercial.manage` | ✅ `commercial.manage` | ✅ |

🔒 **RLS perfecta.** Todas las tablas usan `can_view_org`/`can_mutate_org` o `can_view_project`. Las SELECT de types/modalities incluyen `is_deleted = false` en la propia política.

### Vistas — SECURITY INVOKER:

| Vista | Security | Estado |
|-------|----------|--------|
| `project_access_view` | 🔓 INVOKER | ✅ |
| `project_clients_view` | 🔓 INVOKER | ✅ |
| `project_labor_view` | 🔓 INVOKER | ✅ |
| `projects_view` | 🔓 INVOKER | ✅ FIX APLICADO (estaba UNRESTRICTED, corregido con `ALTER VIEW SET security_invoker = true`) |

---

## Capa 3: Server Actions / Queries

### [actions.ts](file:///c:/Users/Usuario/Seencel/seencel-v2/src/features/projects/actions.ts) (916 líneas, 15 funciones)

#### ✅:
- ✅ `"use server"` al inicio
- ✅ `createProject` (L102) — auth + membership + sanitizeError
- ✅ `deleteProject` (L507) — soft delete correcto
- ✅ `deleteProjectType` (L758) — soft delete + migración
- ✅ `deleteProjectModality` (L886) — soft delete + migración
- ✅ `updateProjectInline` (L537) — valida auth
- ✅ `createProjectType` (L686) — auth + membership
- ✅ `createProjectModality` (L814) — auth + membership

#### 🔒 BLOQUEANTES:

| # | Línea | Función | Problema | Fix |
|---|-------|---------|----------|-----|
| **B1** | L244 | `updateProject` | **No valida auth.** No llama `getAuthUser()`. | Agregar `getAuthUser()` check al inicio |
| **B2** | L507 | `deleteProject` | **No valida auth ni ownership.** | Agregar `getAuthUser()` + verificar que el proyecto pertenece a la org del usuario |

> **Nota:** RLS protege en la DB, pero las actions deben validar también para dar errores correctos y evitar que requests arbitrarios lleguen siquiera a la DB.

#### ❌ Fallos:

| # | Línea | Función | Problema | Fix |
|---|-------|---------|----------|-----|
| **F1** | L400 | `updateProject` | `.from("project_data")` sin `.schema('projects')` | Agregar `.schema('projects')` |
| **F2** | L417 | `updateProject` | `.from("project_settings")` sin `.schema('projects')` | Agregar `.schema('projects')` |
| **F3** | L623 | `updateProjectInline` | `.from('project_data')` sin `.schema('projects')` | Agregar `.schema('projects')` |
| **F4** | L735 | `updateProjectType` | No valida auth | Agregar `getAuthUser()` check |
| **F5** | L863 | `updateProjectModality` | No valida auth | Agregar `getAuthUser()` check |

#### ⚠️ Avisos:

| # | Línea | Problema |
|---|-------|---------|
| W1 | L669 | `getProjectTypes` usa `select('*')` |
| W2 | L797 | `getProjectModalities` usa `select('*')` |
| W3 | L647 | Import de `getSidebarProjects` en medio del archivo |

---

### [queries.ts](file:///c:/Users/Usuario/Seencel/seencel-v2/src/features/projects/queries.ts) (150 líneas, 6 funciones)

#### ✅:
- ✅ `getOrganizationProjects` (L31) — filtra `organization_id` + `is_deleted`
- ✅ `getActiveOrganizationProjects` (L54) — filtra `organization_id` + `is_deleted` + `status`
- ✅ `getLastActiveProject` (L5) — valida auth

#### ❌ Fallos:

| # | Línea | Función | Problema | Fix |
|---|-------|---------|----------|-----|
| **F6** | L73-82 | `getSidebarProjects` | **Falta `.eq('is_deleted', false)`**. Proyectos borrados aparecerían en el sidebar. | Agregar filtro |
| **F7** | L92-105 | `getProjectById` | **Falta `.eq('is_deleted', false)`**. Acceso por URL directa a proyecto borrado. | Agregar filtro |

---

### [file-queries.ts](file:///c:/Users/Usuario/Seencel/seencel-v2/src/features/projects/file-queries.ts) (50 líneas)

- ✅ Filtra `is_deleted = false` en `media_links` y `media_files`
- ⚠️ L9: `.from('media_links')` sin `.schema()` — `media_links` está en public, así que funciona, pero no es explícito

---

## Capa 4: Arquitectura de Página

### ✅:
- ✅ `layout.tsx` — Solo auth, sin queries, sin ContentLayout
- ✅ `page.tsx` — `generateMetadata` + `robots`, `try/catch`, `Promise.all`, `PageWrapper` + `ContentLayout variant="wide"`
- ✅ `settings/page.tsx` — `ContentLayout variant="settings"`, `try/catch`
- ✅ `location/page.tsx` — `generateMetadata`, `try/catch`, `variant="full"`
- ✅ `[projectId]/page.tsx` — `generateMetadata`, `try/catch`, `Promise.all`, `parentLabel`, `BackButton`, `DetailContentTabs`
- ✅ `loading.tsx` × 2 — ambos con `PageSkeleton`

### ❌:

| # | Archivo | Problema | Fix |
|---|---------|----------|-----|
| **F8** | `location/page.tsx` L21-27 | **Query inline en page.** Debería estar en `queries.ts`. | Extraer a `getProjectLocations(orgId)` |

### ⚠️:

| # | Problema |
|---|---------|
| W4 | `[projectId]/page.tsx` L27+L55: `getProjectById` se llama 2 veces por request (metadata + page) |

---

## Capa 5: Componentes UI ✅ OK

- ✅ `ViewEmptyState` con `mode="empty"` y `mode="no-results"`
- ✅ `ToolbarCard` + `SearchButton` + `FilterPopover` + `ViewToggle`
- ✅ `PageHeaderActionPortal` para acción primaria
- ✅ Columnas en `tables/projects-columns.tsx` con Column Factories
- ✅ Context Menu habilitado con `onView`, `onEdit`, `onDelete`

### ⚠️:

| # | Problema |
|---|---------|
| W5 | `projects-list-view.tsx` = 511 líneas (máx recomendado 250) |

---

## Capa 6: Performance

- ✅ `Promise.all` para queries paralelas en pages
- ✅ `loading.tsx` con skeleton
- ✅ Optimistic updates via `useOptimisticList`
- ✅ Google Maps lazy loaded con `dynamic({ ssr: false })`

### ❌:

| # | Problema | Fix |
|---|---------|-----|
| **F9** | `getProjectById` se ejecuta 2× por request (metadata L27 + page L55). Next.js no deduplica server functions. | Wrappear `getProjectById` con `React.cache()` en queries.ts |

---

## Capa 7: Fechas / i18n / Docs

- ✅ Rutas en `routing.ts`: 4 rutas (projects, [projectId], settings, location)
- ✅ `useRouter` de `@/i18n/routing`
- ✅ Panel registrado en `panel-registry.ts`

### ❌:

| # | Archivo | Línea | Problema | Fix |
|---|---------|-------|---------|-----|
| **F10** | `location/page.tsx` | L49 | `new Date(p.created_at).getFullYear()` — **bug timezone** | Usar `parseDateFromDB()` |

### ⚠️:

| # | Problema |
|---|---------|
| W6 | No existe `features/projects/README.md` |

---

## Fixes Aplicados

| # | Fix | Estado |
|---|-----|--------|
| DB-VIEW | `projects_view` → `ALTER VIEW SET (security_invoker = true)` | ✅ Aplicado por usuario |
| B1 | `updateProject` → auth check con `getAuthUser()` | ✅ Aplicado |
| B2 | `deleteProject` → auth check con `getAuthUser()` | ✅ Aplicado |
| F1 | `updateProject` project_data → `.schema('projects')` | ✅ Aplicado |
| F2 | `updateProject` project_settings → `.schema('projects')` | ✅ Aplicado |
| F3 | `updateProjectInline` project_data → `.schema('projects')` | ✅ Aplicado |
| F4 | `updateProjectType` → auth check | ✅ Aplicado |
| F5 | `updateProjectModality` → auth check | ✅ Aplicado |
| F6 | `getSidebarProjects` → `.eq('is_deleted', false)` | ✅ Aplicado |
| F7 | `getProjectById` → `.eq('is_deleted', false)` | ✅ Aplicado |
| F8 | Query inline extraída a `getProjectLocations()` en queries.ts | ✅ Aplicado |
| F9 | `getProjectById` → `React.cache()` (deduplicación metadata+page) | ✅ Aplicado |
| F10 | `new Date()` → `parseDateFromDB()` en getProjectLocations | ✅ Aplicado |
| W1-W2 | `select('*')` → columnas explícitas en types/modalities | ✅ Aplicado |
| W3 | Import movido al top del archivo | ✅ Aplicado |
