# User Journey: Invitar un Miembro a la Organización

> Tutorial paso a paso. Escrito como si el lector no supiera nada de Seencel.

## Escenario

- **Matías** es dueño (admin) de **Constructora Lenga** (organización en Seencel)
- Tiene el plan Professional con 5 asientos incluidos
- Actualmente tiene 3 miembros activos
- Quiere invitar a **Jorge Méndez** (jorge@constructoralenga.com) como Editor

---

## Paso 1: Abrir el modal de invitación

Matías va a **Equipo** → ve la lista de miembros → hace click en **"Invitar miembro"** en el toolbar.

Se abre un modal con:
- Campo de email
- Selector de rol (Administrador, Editor, Visualizador)
- Resumen de asientos (incluidos, comprados, en uso, disponibles)
- Botón "Comprar más asientos" (siempre accesible)

**Archivo**: `src/features/team/forms/team-invite-member-form.tsx`

**Estado**: ✅ Funciona

---

## Paso 2: Completar y enviar la invitación

Matías ingresa `jorge@constructoralenga.com` y selecciona el rol **Editor**.

Click en **"Invitar"** → se ejecuta `sendInvitationAction`.

### Validaciones (en orden):

| # | Validación | Qué verifica | Tabla / RPC |
|---|-----------|--------------|-------------|
| 1 | Auth | Usuario autenticado | `auth.getUser()` |
| 2 | Permisos | Caller es admin de la org | `iam.organization_members_full_view` |
| 3 | Asientos | Hay asientos disponibles | `billing.get_organization_seat_status` RPC |
| 4 | Duplicado miembro | Email no es ya miembro activo | `iam.organization_members` JOIN `iam.users` |
| 5 | Duplicado invitación | No hay invitación pendiente para ese email | `iam.organization_invitations` |
| 6 | Rol válido | El rol no es de sistema/owner/web | `iam.roles` |

### Qué pasa por detrás si pasa todas las validaciones:

| Paso | Qué hace | Tabla afectada |
|------|----------|----------------|
| 1. Genera token | `randomUUID()` → token único | — |
| 2. Inserta invitación | Crea registro con status `pending` | `iam.organization_invitations` |
| 3. Envía email | Template `TeamInvitationEmail` vía Resend | — |

**Archivos**:
- Action: `src/features/team/actions.ts` → `sendInvitationAction()` (L23-169)
- Email template: `src/features/emails/templates/team-invitation-email.tsx`
- Traducciones: `src/features/emails/lib/email-translations.ts` → namespace `teamInvitation`

**Estado**: ✅ Funciona

---

## Paso 3: Jorge recibe el email

Jorge recibe un email con:
- Nombre de la organización
- Nombre de quien invitó
- Rol asignado
- Botón "Aceptar Invitación" → link: `seencel.com/invite/accept?token=XYZ`

**Template**: `TeamInvitationEmail` con props: `organizationName`, `inviterName`, `roleName`, `acceptUrl`

**Estado**: ✅ Funciona

---

## Paso 4: Jorge abre el link de aceptación

### Page server-side (`page.tsx`)

1. Extrae el `token` de los query params
2. Llama `getInvitationByToken(token)` → RPC `iam.get_invitation_by_token`
3. Valida: token existe, no expirado, no usado
4. Verifica si Jorge ya tiene cuenta (`iam.users` por email)
5. Obtiene logo de la organización
6. Renderiza `AcceptInvitationClient`

### Lo que ve Jorge:

| Estado de Jorge | Qué ve |
|-----------------|--------|
| **No tiene cuenta** | Card con info de la org + botones "Registrarse" y "Iniciar Sesión" |
| **Tiene cuenta, no logueado** | Card con info de la org + solo botón "Iniciar Sesión" |
| **Logueado** | Card con info de la org + botón "Aceptar Invitación" |

**Archivos**:
- Page: `src/app/[locale]/invite/accept/page.tsx`
- Client: `src/app/[locale]/invite/accept/accept-invitation-client.tsx`

**Estado**: ✅ Funciona

---

## Paso 5: Jorge acepta la invitación

Jorge (ya logueado) hace click en **"Aceptar Invitación"** → `acceptInvitationAction(token)`.

### Flujo del action (L387-554):

| Paso | Qué hace | Tabla |
|------|----------|-------|
| 1 | Obtiene `authUser` | `auth.getUser()` |
| 2 | Resuelve `users.id` desde `auth_id` | `iam.users` |
| 3 | Lee invitación por token | `iam.organization_invitations` |
| 4 | Detecta `invitation_type` | — |
| 5 | Si `member` → RPC `accept_organization_invitation` | — |

### Flujo del RPC `iam.accept_organization_invitation` (SECURITY DEFINER):

| Paso | Qué hace | Tabla |
|------|----------|-------|
| 1 | Busca invitación por token | `iam.organization_invitations` JOIN `iam.organizations` |
| 2 | Valida status (pending/registered) y expiración | — |
| 3 | Verifica si ya es miembro activo → marca accepted, retorna | `iam.organization_members` |
| 4 | Verifica si hay miembro inactivo (ex-miembro) | `iam.organization_members` |
| 5 | Calcula asientos disponibles | `iam.organizations` JOIN `billing.plans` |
| 6 | Si no hay asientos → retorna error | — |
| 7a | Si ex-miembro → reactiva (is_active=true, nuevo rol) | `iam.organization_members` UPDATE |
| 7b | Si nuevo → INSERT organization_members | `iam.organization_members` INSERT |
| 8 | Marca invitación como accepted | `iam.organization_invitations` UPDATE |
| 9 | Registra evento de billing | `billing.organization_member_events` INSERT |
| 10 | Retorna `{success, organization_id, org_name, member_id}` | — |

### Post-RPC en el action (L528-553):

| Paso | Qué hace | Tabla |
|------|----------|-------|
| 1 | Actualiza `last_organization_id` | `iam.user_preferences` |
| 2 | Upsert org preferences | `iam.user_organization_preferences` |
| 3 | Revalida paths | — |

### Trigger automático al INSERT/UPDATE en organization_members:

`audit.log_member_billable_change()` → INSERT en `billing.organization_member_events` con `event_type = 'member_added'`

> ⚠️ Este trigger tenía un bug (tabla sin schema prefix) que fue corregido en `DB/084_fix_member_events_schema_ref.sql`

**Estado**: ✅ Funciona (post-fix 084)

---

## Paso 6: Jorge ya es miembro

Jorge es redirigido al Hub de la organización. Ahora puede:
- Ver el dashboard completo
- Acceder a todos los módulos según los permisos de su rol (Editor)
- Ver proyectos, materiales, finanzas, etc.

**Archivos de redirección**: 
- `accept-invitation-client.tsx` → `router.push('/organization')` de `@/i18n/routing`

**Estado**: ✅ Funciona

---

## Diagrama completo

```
MATÍAS (admin de Constructora Lenga)
│
└── Equipo → Toolbar → "Invitar miembro"
    │
    └── Modal: email + rol + resumen asientos
        │
        ├── sendInvitationAction()
        │   ├── Valida: auth, permisos, asientos, duplicados, rol
        │   ├── INSERT organization_invitations (token, status=pending)
        │   └── sendEmail(TeamInvitationEmail)
        │
        └── JORGE recibe email → Abre link
            │
            ├── page.tsx: get_invitation_by_token RPC → valida
            │
            ├── Si no tiene cuenta → Registrarse → Login → vuelve al link
            ├── Si tiene cuenta pero no logueado → Login → vuelve al link
            └── Si logueado → Click "Aceptar Invitación"
                │
                └── acceptInvitationAction(token)
                    │
                    ├── detect invitation_type = 'member'
                    └── RPC iam.accept_organization_invitation
                        ├── Valida token, status, expiración
                        ├── Verifica asientos disponibles
                        ├── INSERT/REACTIVATE organization_members
                        ├── UPDATE organization_invitations → accepted
                        ├── INSERT billing.organization_member_events
                        └── Retorna → redirect al Hub
```

---

## Caso: Reenviar invitación

Si Jorge no acepta a tiempo, Matías puede ir a **Equipo** → pestaña **Invitaciones** → click en el menú de la invitación → **"Reenviar"**.

- `resendInvitationAction()` genera nuevo token, actualiza `expires_at`, y envía nuevo email
- La invitación anterior queda con el token viejo (ya no funciona)

**Action**: `src/features/team/actions.ts` → `resendInvitationAction()` (L290-380)

**Estado**: ✅ Funciona

---

## Caso: Revocar invitación

Matías puede cancelar una invitación pendiente haciendo click en **"Revocar"** desde el menú de la invitación.

- `revokeInvitationAction()` → DELETE de `iam.organization_invitations`

**Action**: `src/features/team/actions.ts` → `revokeInvitationAction()` (L241-285)

**Estado**: ✅ Funciona
