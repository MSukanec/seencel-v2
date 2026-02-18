# Mapa Técnico: Acceso Externo a Proyectos

> Referencia técnica de todas las tablas, funciones, archivos y RLS involucradas en el flujo de acceso externo.

---

## 1. Tablas involucradas

### `contacts` — CRM de la organización
La base de todo. Un contacto puede ser persona o empresa.

| Columna clave | Tipo | Para qué |
|---------------|------|----------|
| `id` | UUID PK | Identificador |
| `organization_id` | FK → organizations | A qué org pertenece |
| `full_name` | text | Nombre completo |
| `email` | text | Email (clave para auto-link con users) |
| `linked_user_id` | FK → users | Si esta persona tiene cuenta en Seencel |
| `company_name` | text | Empresa (si es persona que pertenece a una) |

### `project_clients` — Clientes vinculados a un proyecto
Relación de negocio. El contacto-empresa que paga.

| Columna clave | Tipo | Para qué |
|---------------|------|----------|
| `id` | UUID PK | **Se usa como FK en `project_access.client_id`** |
| `project_id` | FK → projects | A qué proyecto |
| `contact_id` | FK → contacts | Qué contacto es el cliente |
| `client_role_id` | FK → client_roles | Rol (Mandante, Representante, etc.) |
| `organization_id` | FK → organizations | Org dueña |

### `organization_external_actors` — Actores externos de la org
Define que un usuario de Seencel existe a nivel organización como "externo".

| Columna clave | Tipo | Para qué |
|---------------|------|----------|
| `id` | UUID PK | Identificador |
| `user_id` | FK → users | Qué usuario de Seencel es |
| `organization_id` | FK → organizations | A qué org pertenece |
| `actor_type` | text | "client", "contractor", "accountant", etc. |
| `is_active` | bool | Si está activo |

### `project_access` — Acceso explícito a un proyecto
**Tabla central del flujo**. Define quién puede ver qué proyecto y con qué scoping.

| Columna clave | Tipo | Para qué |
|---------------|------|----------|
| `id` | UUID PK | Identificador |
| `project_id` | FK → projects | A qué proyecto tiene acceso |
| `user_id` | FK → users | Qué usuario |
| `organization_id` | FK → organizations | Org dueña del proyecto |
| `access_type` | text | "member", "external", "client", "employee" |
| `access_level` | text | "viewer", "editor", "admin" |
| `client_id` | FK → project_clients | **Scoping**: si NOT NULL, solo ve datos de ESE cliente |
| `granted_by` | FK → organization_members | Quién otorgó el acceso |
| UNIQUE | (project_id, user_id) | Un usuario = un acceso por proyecto |

### Tablas financieras (afectadas por el scoping)

| Tabla | FK a project_clients | Cómo se filtra |
|-------|---------------------|----------------|
| `client_commitments` | `client_id` → `project_clients.id` | Directo |
| `client_payments` | `client_id` → `project_clients.id` | Directo |
| `client_payment_schedule` | Via `commitment_id` → `client_commitments` | Indirecto |
| `quotes` | `client_id` → `contacts.id` (no project_clients) | Via join contacts → project_clients |

---

## 2. Funciones SQL (RLS Helpers)

### `can_view_project(project_id)` — ¿Puede ver este proyecto?
```
Lógica:
1. is_admin() → sí
2. Es org_member de la org que posee el proyecto → sí
3. Tiene registro activo en project_access para ese proyecto → sí
4. Ninguno → no
```
**Archivo**: Definida en `DB/016_multi_actor_rls_system.sql`

### `can_view_client_data(project_id, client_id)` — ¿Puede ver datos de este cliente?
```
Lógica:
1. is_admin() → sí
2. Es org_member → sí (ve todo)
3. Tiene project_access sin client_id (NULL) → sí (ve todo el proyecto)
4. Tiene project_access con client_id que coincide → sí
5. Ninguno → no
```
**Archivo**: Definida en `DB/018_client_scoped_project_access.sql`

### Funciones que NO cambian
| Función | Sigue igual | Afecta a externos |
|---------|-------------|-------------------|
| `is_admin()` | ✅ | No |
| `current_user_id()` | ✅ | No |
| `is_org_member()` | ✅ | No |
| `has_permission()` | ✅ | No |
| `can_mutate_org()` | ✅ | No — solo miembros mutan |
| `can_view_org()` | ⚠️ Ver audit | Posible expansión futura |

---

## 3. Archivos Frontend

### Queries
| Archivo | Funciones |
|---------|-----------|
| `src/features/external-actors/project-access-queries.ts` | `getProjectCollaborators()`, `getAvailableCollaborators()` |
| `src/features/external-actors/queries.ts` | `getExternalActorsByOrganization()` |
| `src/features/clients/queries.ts` | `getClients()` |

### Actions (Server)
| Archivo | Funciones |
|---------|-----------|
| `src/features/external-actors/project-access-actions.ts` | `linkCollaboratorToProjectAction()`, `unlinkCollaboratorFromProjectAction()` |
| `src/features/external-actors/actions.ts` | `addExternalActorAction()`, `removeExternalActorAction()` |
| `src/features/clients/actions.ts` | `createClientAction()`, `deleteClientAction()` |

### Forms
| Archivo | Qué hace |
|---------|----------|
| `src/features/external-actors/forms/collaborator-form.tsx` | Vincular actor externo a un proyecto |
| `src/features/external-actors/forms/external-actor-form.tsx` | Crear actor externo a nivel organización |
| `src/features/clients/forms/clients-form.tsx` | Vincular contacto como cliente de un proyecto |

### Views
| Archivo | Qué muestra |
|---------|-------------|
| `src/features/projects/views/details/project-participants-view.tsx` | Sección Clientes + Colaboradores del proyecto |

### Page
| Archivo | Qué hace |
|---------|----------|
| `src/app/[locale]/(dashboard)/organization/projects/[projectId]/page.tsx` | Fetch de clientes + colaboradores en server |

---

## 4. SQL Scripts (en orden de ejecución)

| Archivo | Qué hace | Estado |
|---------|----------|--------|
| `DB/016_multi_actor_rls_system.sql` | `project_access` table, `can_view_project()`, índices | ✅ Ejecutado |
| `DB/017_project_access_view.sql` | View `project_access_view` (versión sin client_id) | ✅ Ejecutado (reemplazado por 018) |
| `DB/018_client_scoped_project_access.sql` | `client_id` en project_access, `can_view_client_data()`, RLS paralelas, view actualizada | ⚠️ Parcial (falta sección 3: RLS) |

---

## 5. Cadena de datos completa

```
auth.uid()
  → users.auth_id → users.id
    → organization_external_actors.user_id (existencia en la org)
      → project_access.user_id (acceso al proyecto)
        → project_access.client_id → project_clients.id (scoping)
          → client_commitments.client_id (compromisos filtrados)
          → client_payments.client_id (pagos filtrados)
          → client_payment_schedule via commitment (cuotas filtradas)
          → quotes via contacts → project_clients (presupuestos filtrados)
```
