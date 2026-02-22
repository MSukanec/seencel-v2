# Mapa Técnico: Invitación de Miembros

> Referencia técnica de todas las tablas, funciones, archivos y RLS involucradas en el flujo de invitación de miembros.

---

## 1. Tablas involucradas

### `iam.organization_members` — Miembros de la organización

| Columna clave | Tipo | Para qué |
|---------------|------|----------|
| `id` | UUID PK | Identificador del membership |
| `organization_id` | FK → organizations | A qué org pertenece |
| `user_id` | FK → users | Qué usuario |
| `role_id` | FK → roles | Rol asignado (Admin, Editor, Visualizador) |
| `is_active` | bool | Si está activo (false = ex-miembro) |
| `is_billable` | bool | Si consume asiento (billing) |
| `joined_at` | timestamptz | Cuándo se unió |
| `invited_by` | FK → organization_members | Quién lo invitó (member_id) |
| `is_over_limit` | bool | Si excede el límite de asientos |
| UNIQUE | (organization_id, user_id) | Un membership por org |

### `iam.organization_invitations` — Invitaciones pendientes

| Columna clave | Tipo | Para qué |
|---------------|------|----------|
| `id` | UUID PK | Identificador |
| `organization_id` | FK → organizations | A qué org |
| `email` | text | Email del invitado |
| `token` | text | Token único para aceptar |
| `status` | text | `pending` / `registered` / `accepted` / `rejected` |
| `role_id` | FK → roles | Rol que se asigna al aceptar |
| `invitation_type` | text | `member` / `external` / `client` |
| `invited_by` | FK → organization_members | Quién invitó (member_id) |
| `expires_at` | timestamptz | Expiración (7 días) |
| `user_id` | FK → users | Se llena al aceptar |
| `accepted_at` | timestamptz | Cuándo aceptó |

### `iam.roles` — Roles de la organización

| Columna clave | Tipo | Para qué |
|---------------|------|----------|
| `id` | UUID PK | Identificador |
| `name` | text | Nombre (Administrador, Editor, Visualizador) |
| `type` | text | `admin` / `editor` / `viewer` / `owner` / `web` |
| `organization_id` | FK → organizations | Si es custom de la org (NULL = sistema) |
| `is_system` | bool | Si es rol de sistema (no asignable) |

### `billing.organization_member_events` — Eventos de billing de miembros

| Columna clave | Tipo | Para qué |
|---------------|------|----------|
| `id` | UUID PK | Identificador |
| `organization_id` | FK → organizations | A qué org |
| `member_id` | FK → organization_members | Qué miembro |
| `user_id` | FK → users | Qué usuario |
| `event_type` | text | `member_added` / `member_removed` / `billable_changed` / `invitation_accepted` |
| `was_billable` | bool | Billable antes del cambio |
| `is_billable` | bool | Billable después del cambio |
| `performed_by` | FK → users | Quién ejecutó la acción |
| `created_at` | timestamptz | Cuándo |

### `billing.plans` — Planes de suscripción

| Columna clave | Tipo | Para qué |
|---------------|------|----------|
| `features` | jsonb | `features->>'seats_included'` define cuántos asientos incluye el plan |

### `iam.organizations` — Organizaciones

| Columna clave | Tipo | Para qué en este flow |
|---------------|------|----------|
| `purchased_seats` | int | Asientos comprados adicionales |
| `plan_id` | FK → billing.plans | Para calcular capacity total |
| `owner_id` | FK → users | Dueño de la org |

### `iam.user_preferences` — Preferencias del usuario

| Columna clave | Tipo | Para qué |
|---------------|------|----------|
| `user_id` | FK → users | Qué usuario |
| `last_organization_id` | FK → organizations | Última org activa (se actualiza al aceptar) |

### `iam.user_organization_preferences` — Preferencias por org

| Columna clave | Tipo | Para qué |
|---------------|------|----------|
| `user_id` | FK → users | Qué usuario |
| `organization_id` | FK → organizations | Qué org |
| `updated_at` | timestamptz | Última interacción |

---

## 2. Funciones SQL

### `iam.accept_organization_invitation(p_token, p_user_id)` — SECURITY DEFINER

```
search_path: 'iam', 'billing'

Lógica:
1. Busca invitación por token (JOIN organizations para nombre)
2. Valida: status in (pending, registered), no expirada
3. Si ya es miembro activo → marca invitación accepted, retorna already_member
4. Busca miembro inactivo (ex-miembro)
5. Calcula capacidad: plans.features->>'seats_included' + organizations.purchased_seats
6. Cuenta miembros activos
7. Si available <= 0 → retorna error no_seats_available
8. Si ex-miembro → UPDATE is_active=true, actualiza rol y joined_at
9. Si nuevo → INSERT organization_members
10. UPDATE organization_invitations → status=accepted
11. INSERT billing.organization_member_events (invitation_accepted)
12. Retorna {success, organization_id, org_name, member_id}
```

**Schema archivo**: `DB/schema/iam/functions_1.md` (L330-517)
**Estado**: ✅ Funciona

### `iam.get_invitation_by_token(p_token)` — SECURITY DEFINER

```
search_path: 'iam'

Lógica:
1. Busca invitación por token
2. JOIN organizations, roles, organization_members para obtener nombres
3. Retorna: id, email, status, expires_at, invitation_type, actor_type,
   organization_name, role_name, inviter_name
4. Si no existe → retorna {success: false}
```

**Schema archivo**: `DB/schema/iam/functions_1.md` (L1086+)
**Estado**: ✅ Funciona

### `billing.get_organization_seat_status(p_organization_id)` — SECURITY DEFINER

```
Lógica:
1. Calcula: seats_included (plan) + purchased_seats = total_capacity
2. Cuenta: used (miembros activos) + pending_invitations
3. Retorna: SeatStatus con available, can_invite, precios, proration
```

**Estado**: ✅ Funciona

### `audit.log_member_billable_change()` — Trigger AFTER INSERT/UPDATE/DELETE

```
search_path: 'audit', 'billing'
Dispara en: iam.organization_members

Lógica:
- INSERT → billing.organization_member_events (member_added)
- UPDATE is_billable changed → billing.organization_member_events (billable_changed)
- DELETE → billing.organization_member_events (member_removed)
```

**Fix reciente**: `DB/084_fix_member_events_schema_ref.sql` — corrigió referencia sin schema prefix
**Estado**: ✅ Funciona (post-fix 084)

---

## 3. Archivos Frontend

### Actions (Server)

| Archivo | Función | Qué hace |
|---------|---------|----------|
| `src/features/team/actions.ts` | `sendInvitationAction()` (L23-169) | Valida, crea invitación, envía email |
| `src/features/team/actions.ts` | `getInvitationByToken()` (L175-235) | Lee invitación por token (para page server) |
| `src/features/team/actions.ts` | `revokeInvitationAction()` (L241-285) | Elimina invitación pendiente |
| `src/features/team/actions.ts` | `resendInvitationAction()` (L290-380) | Genera nuevo token + reenvía email |
| `src/features/team/actions.ts` | `acceptInvitationAction()` (L387-554) | Orquesta aceptación: detecta tipo → RPC |
| `src/features/team/actions.ts` | `getOrganizationSeatStatus()` (L832-847) | Lee estado de asientos (billing RPC) |

### Queries (Server)

| Archivo | Función |
|---------|---------|
| `src/features/team/queries.ts` | `getOrganizationMembers()` — Lista miembros activos |
| `src/features/team/queries.ts` | `getOrganizationInvitations()` — Lista invitaciones pendientes |
| `src/features/team/queries.ts` | `getOrganizationRoles()` — Roles asignables |

### Forms

| Archivo | Qué hace |
|---------|----------|
| `src/features/team/forms/team-invite-member-form.tsx` | Modal de invitación: email + rol + asientos + opción compra |

### Views

| Archivo | Qué muestra |
|---------|-------------|
| `src/features/team/views/team-members-view.tsx` | Lista de miembros con acciones |
| `src/features/team/views/team-invitations-view.tsx` | Invitaciones pendientes con reenviar/revocar |

### Pages

| Archivo | Qué hace |
|---------|----------|
| `src/app/[locale]/(dashboard)/organization/settings/team/page.tsx` | Fetch miembros, invitaciones, roles en server |
| `src/app/[locale]/invite/accept/page.tsx` | Página de aceptación (server: valida token, auth) |
| `src/app/[locale]/invite/accept/accept-invitation-client.tsx` | Client component: UI de aceptación + handleAccept |

### Email

| Archivo | Qué hace |
|---------|----------|
| `src/features/emails/templates/team-invitation-email.tsx` | Template React Email por invitación |
| `src/features/emails/lib/email-translations.ts` | Traducciones (namespace `teamInvitation`) |
| `src/features/emails/lib/send-email.ts` | Envío vía Resend |

---

## 4. SQL Scripts (en orden de ejecución)

| Archivo | Qué hace | Estado |
|---------|----------|--------|
| (original) | `iam.accept_organization_invitation` con lógica de asientos | ✅ Ejecutado |
| `DB/084_fix_member_events_schema_ref.sql` | Fix cross-schema ref en `audit.log_member_billable_change` | ✅ Ejecutado |

---

## 5. Cadena de datos completa

```
auth.uid()
  → iam.users.auth_id → iam.users.id
    → sendInvitationAction():
        → iam.organization_members_full_view (validar admin)
        → billing.get_organization_seat_status RPC (validar asientos)
        → iam.organization_invitations INSERT (token, status=pending)
        → sendEmail (Resend)

auth.uid() [Jorge]
  → iam.users.auth_id → iam.users.id
    → acceptInvitationAction():
        → iam.organization_invitations (buscar por token)
        → iam.accept_organization_invitation RPC:
            → iam.organization_members INSERT/UPDATE
            → billing.organization_member_events INSERT
            → iam.organization_invitations UPDATE (accepted)
        → iam.user_preferences UPDATE (last_organization_id)
        → iam.user_organization_preferences UPSERT
```

---

## 6. Email y Notificaciones

| Canal | Cuándo | Archivo |
|-------|--------|---------|
| **Email** | Al enviar invitación | `sendInvitationAction()` → `sendEmail(TeamInvitationEmail)` |
| **Email** | Al reenviar invitación | `resendInvitationAction()` → `sendEmail(TeamInvitationEmail)` |
| **Modal automático** | Si Jorge ya está logueado en Seencel | `PendingInvitationChecker` (componente global) |
