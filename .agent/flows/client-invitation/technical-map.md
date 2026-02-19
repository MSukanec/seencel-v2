# Mapa Técnico: Invitación y Acceso de Clientes

> Referencia técnica de todas las tablas, funciones, archivos y RLS involucradas en el flujo de clientes.

---

## 1. Tablas involucradas

### `contacts` — CRM de la organización

| Columna clave | Tipo | Para qué |
|---------------|------|----------|
| `id` | UUID PK | Identificador |
| `organization_id` | FK → organizations | A qué org pertenece |
| `full_name` | text | Nombre completo |
| `email` | text | Email (clave para auto-link con users) |
| `linked_user_id` | FK → users | Si esta persona tiene cuenta en Seencel |
| `contact_type` | text | "person" o "company" |
| `is_deleted` | bool | Soft delete |

### `project_clients` — Clientes vinculados a un proyecto

| Columna clave | Tipo | Para qué |
|---------------|------|----------|
| `id` | UUID PK | **Se usa como FK en `project_access.client_id`** |
| `project_id` | FK → projects | A qué proyecto |
| `contact_id` | FK → contacts | Qué contacto es el cliente |
| `client_role_id` | FK → client_roles | Rol (Mandante, Representante, etc.) |
| `organization_id` | FK → organizations | Org dueña |
| `status` | text | "active" / "inactive" |
| `is_primary` | bool | Si es el cliente principal |
| `is_deleted` | bool | Soft delete |
| UNIQUE | (project_id, contact_id) | Un contacto = un client por proyecto |

### `organization_external_actors` — Actores externos

| Columna clave | Tipo | Para qué |
|---------------|------|----------|
| `id` | UUID PK | Identificador |
| `user_id` | FK → users | Qué usuario Seencel |
| `organization_id` | FK → organizations | A qué org |
| `actor_type` | text | "client", "field_worker", "accountant", etc. |
| `is_active` | bool | Si está activo |
| `is_deleted` | bool | Soft delete |
| UNIQUE | (organization_id, user_id) | Un actor por org |

### `project_access` — Tabla central de permisos

| Columna clave | Tipo | Para qué |
|---------------|------|----------|
| `id` | UUID PK | Identificador |
| `project_id` | FK → projects | A qué proyecto |
| `user_id` | FK → users | Qué usuario |
| `organization_id` | FK → organizations | Org dueña |
| `access_type` | text | "member", "external", "client" |
| `access_level` | text | "viewer", "editor", "admin" |
| `client_id` | FK → project_clients | **Scoping**: si NOT NULL, solo ve datos de ESE client |
| `is_active` | bool | Si está activo |
| `is_deleted` | bool | Soft delete |
| UNIQUE | (project_id, user_id) WHERE is_deleted = false | Un acceso por proyecto |

### `organization_invitations` — Invitaciones pendientes

| Columna clave | Tipo | Para qué |
|---------------|------|----------|
| `id` | UUID PK | Identificador |
| `organization_id` | FK → organizations | A qué org |
| `email` | text | Email del invitado |
| `token` | text | Token único para aceptar |
| `status` | text | "pending" / "registered" / "accepted" |
| `invitation_type` | text | "member" / "external" |
| `actor_type` | text | "client", "field_worker", etc. |
| `project_id` | FK → projects | **Contexto**: auto-crear project_access al aceptar |
| `client_id` | FK → project_clients | **Scoping**: pasar al project_access al aceptar |
| `invited_by` | FK → organization_members | Quién invitó |
| `expires_at` | timestamptz | Expiración (30 días) |
| `user_id` | FK → users | Se llena al aceptar |

---

## 2. Funciones SQL (RLS Helpers)

### `accept_external_invitation(p_token, p_user_id)` — SECURITY DEFINER

```
Lógica:
1. Busca invitación externa por token
2. Verifica status (pending/registered) y expiración
3. Si ya es actor activo → marca invitación accepted, mantiene actor
4. Si actor existe pero inactivo → reactiva, marca invitación accepted
5. Si no existe actor → inserta organization_external_actors
6. Si invitación tiene project_id → INSERT project_access (ON CONFLICT DO NOTHING)
7. Actualiza user_preferences.last_organization_id
8. Retorna {success, already_actor, organization_id, org_name, project_id}
```
**DB Script**: `DB/022_simplify_external_access_flow.sql`
**Estado**: ✅ Ejecutado

### `can_view_project(project_id)` — ¿Puede ver el proyecto?

```
Lógica:
1. is_admin() → sí
2. Es org_member de la org del proyecto → sí
3. Tiene registro activo en project_access → sí
4. Ninguno → no
```
**DB Script**: `DB/016_multi_actor_rls_system.sql`

### `can_view_client_data(project_id, client_id)` — ¿Puede ver datos de este cliente?

```
Lógica:
1. is_admin() → sí
2. Es org_member → sí (ve todo)
3. Tiene project_access sin client_id (NULL) → sí (ve todo el proyecto)
4. Tiene project_access con client_id matching → sí
5. Ninguno → no
```
**DB Script**: `DB/018_client_scoped_project_access.sql`

---

## 3. Archivos Frontend

### Actions (Server)

| Archivo | Función | Qué hace |
|---------|---------|----------|
| `src/features/clients/actions.ts` | `createClientAction()` (L37-102) | Crea project_client + auto-grant access si linked_user |
| `src/features/clients/actions.ts` | `inviteClientToProjectAction()` (L937-1125) | Orquesta: find/create contact → project_client → access/invitación |
| `src/features/clients/actions.ts` | `updateClientAction()` (L108-133) | Actualiza project_client |
| `src/features/clients/actions.ts` | `deleteClientAction()` (L135-159) | Elimina project_client |
| `src/features/clients/actions.ts` | `deactivateClientAction()` (L161-187) | Desactiva client + revoca access |
| `src/features/clients/actions.ts` | `reactivateClientAction()` (L189-214) | Reactiva client + access |
| `src/features/external-actors/project-access-actions.ts` | `linkCollaboratorToProjectAction()` (L11-86) | Auto-crea external actor + project_access |
| `src/features/team/actions.ts` | `addExternalCollaboratorWithProjectAction()` (L1077-1260) | Crea invitación con project_id + client_id + email |
| `src/features/team/actions.ts` | `acceptInvitationAction()` (L396-460) | Detecta tipo → llama RPC correspondiente |

### Queries (Server)

| Archivo | Función |
|---------|---------|
| `src/features/clients/queries.ts` | `getClients(projectId)` |
| `src/features/clients/queries.ts` | `getClientsByOrganization(orgId)` |
| `src/features/clients/queries.ts` | `getOrganizationContacts(orgId)` |
| `src/features/clients/queries.ts` | `getClientFinancialSummary(projectId)` |
| `src/features/clients/queries.ts` | `getClientRoles(orgId)` |

### Forms

| Archivo | Qué hace |
|---------|----------|
| `src/features/clients/forms/clients-form.tsx` | **Formulario unificado** con toggle: Modo A (contacto existente) / Modo B (invitar por email) |

### Views

| Archivo | Qué muestra |
|---------|-------------|
| `src/features/projects/views/details/project-participants-view.tsx` | Sección Clientes + Colaboradores |

### Pages

| Archivo | Qué hace |
|---------|----------|
| `src/app/[locale]/(dashboard)/organization/projects/[projectId]/page.tsx` | Fetch clientes + colaboradores en server |
| `src/app/[locale]/invite/accept/page.tsx` | Página de aceptación (server: valida token) |
| `src/app/[locale]/invite/accept/accept-invitation-client.tsx` | Client component de aceptación (UI + handleAccept) |

---

## 4. SQL Scripts (en orden de ejecución)

| Archivo | Qué hace | Estado |
|---------|----------|--------|
| `DB/016_multi_actor_rls_system.sql` | `project_access` table, `can_view_project()`, índices | ✅ Ejecutado |
| `DB/017_project_access_view.sql` | View `project_access_view` (sin client_id) | ✅ Ejecutado (reemplazado por 018) |
| `DB/018_client_scoped_project_access.sql` | `client_id` en project_access, `can_view_client_data()`, RLS paralelas, view actualizada | ⚠️ Parcial (falta Sección 3: RLS financieras) |
| `DB/022_simplify_external_access_flow.sql` | `accept_external_invitation` actualizada, columnas project_id/client_id en invitations | ✅ Ejecutado |

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

---

## 6. Email y Notificaciones

| Canal | Cuándo | Archivo |
|-------|--------|---------|
| **Email** | SIEMPRE que se envía invitación | `addExternalCollaboratorWithProjectAction()` → `sendEmail()` con `TeamInvitationEmail` |
| **Notificación in-app** | Solo si el usuario ya existe en Seencel | `addExternalCollaboratorWithProjectAction()` → insert `notifications` + `user_notifications` |
| **Modal automático** | Si el usuario ya está logueado | `PendingInvitationChecker` (componente global) |
