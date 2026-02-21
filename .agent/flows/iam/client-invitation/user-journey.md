# User Journey: Vincular e Invitar un Cliente a un Proyecto

> Tutorial paso a paso. Escrito como si el lector no supiera nada de Seencel.

## Escenario

- **Matías** es dueño de **Constructora Lenga** (organización en Seencel)
- Tiene el proyecto **"Colegio Elumar"**
- Quiere que **Mariano Pérez** (socio del colegio) pueda ver datos del proyecto como cliente

---

## Paso 1: (Opcional) Crear contacto en CRM

Matías va a **Contactos** y crea un registro para Mariano.

| Campo | Valor |
|-------|-------|
| Nombre | Mariano Pérez |
| Email | mariano@colegio.com |
| Tipo | Persona |

**Tabla**: `contacts` → `contacts.organization_id` = Constructora Lenga

> **¿Por qué es opcional?** El Paso 2 (Modo B: email) auto-crea el contacto si no existe.

> **Auto-link**: Si Mariano ya tiene cuenta en Seencel con el mismo email, el sistema auto-linkea `contacts.linked_user_id` (trigger `handle_registered_invitation`).

**Estado**: ✅ Funciona

---

## Paso 2: Agregar cliente al proyecto

Matías va al proyecto → pestaña **Participantes** → sección **Clientes** → **Agregar Cliente**.

El formulario `ClientForm` tiene **dos modos** (toggle visual):

### Modo A: Contacto existente

1. Selecciona un contacto que ya existe (ej: "Colegio Elumar S.A.") 
2. Asigna un rol (Mandante, Representante, etc.)
3. Submit → `createClientAction`

**Qué pasa por detrás:**
- Inserta en `project_clients` (project_id + contact_id + role)
- Verifica si el contacto tiene `linked_user_id`
  - **Sí** → auto-llama `linkCollaboratorToProjectAction` → crea `project_access` con `client_id` (scoping)
  - **No** → solo queda como entidad financiera (sin acceso al portal)

**Archivos**:
- Form: `src/features/clients/forms/clients-form.tsx` → líneas 134-160
- Action: `src/features/clients/actions.ts` → `createClientAction()` (L37-102)
- Action delegada: `src/features/external-actors/project-access-actions.ts` → `linkCollaboratorToProjectAction()` (L11-86)

**Estado**: ✅ Funciona

### Modo B: Invitar por email

1. Matías ingresa email `mariano@colegio.com` y nombre "Mariano Pérez"
2. Submit → `inviteClientToProjectAction`

**Qué pasa por detrás (5 pasos):**

| Paso | Qué hace | Tabla afectada |
|------|----------|----------------|
| 1. Auth | Obtiene `currentUser` | `users` |
| 2. Find/Create Contact | Busca contacto por email en la org, si no existe lo crea | `contacts` |
| 3. Check Duplicado | Verifica que no sea ya `project_client` | `project_clients` |
| 4. Create project_client | Inserta relación contacto-proyecto | `project_clients` |
| 5a. User existe | Llama `linkCollaboratorToProjectAction` → `project_access` directo | `organization_external_actors` + `project_access` |
| 5b. User no existe | Llama `addExternalCollaboratorWithProjectAction` → crea invitación | `organization_invitations` (con `project_id` + `client_id`) |

**Archivos**:
- Form: `src/features/clients/forms/clients-form.tsx` → líneas 161-199
- Action principal: `src/features/clients/actions.ts` → `inviteClientToProjectAction()` (L937-1125)
- Action delegada (user existente): `src/features/external-actors/project-access-actions.ts` → `linkCollaboratorToProjectAction()` (L11-86)
- Action delegada (user nuevo): `src/features/team/actions.ts` → `addExternalCollaboratorWithProjectAction()` (L1077-1260)

**Estado**: ✅ Funciona (la invitación se crea y el email se envía)

---

## Paso 3: Mariano acepta la invitación

### Si ya tenía cuenta (caso 5a del Paso 2):
No hay invitación. Mariano entra a Seencel y ya ve el proyecto en su Portal.

### Si fue invitado (caso 5b del Paso 2):

1. Mariano recibe email con link: `seencel.com/invite/accept?token=XYZ`
2. Abre el link → ve la página de aceptación

   **Page**: `src/app/[locale]/invite/accept/page.tsx` (Server Component)
   **Client**: `src/app/[locale]/invite/accept/accept-invitation-client.tsx`

3. Si no tiene cuenta → se registra primero (redirect con token)
4. Click "Aceptar Invitación" → `acceptInvitationAction(token)`

   **Action**: `src/features/team/actions.ts` → `acceptInvitationAction()` (L396-460)

5. La action detecta `invitation_type = 'external'` → llama RPC `accept_external_invitation`

   **RPC**: `public.accept_external_invitation(p_token, p_user_id)` — SECURITY DEFINER

6. El RPC auto-crea:
   - `organization_external_actors` (si no existe, o reactiva si estaba inactivo)
   - `project_access` con `client_id` = scoping (ON CONFLICT DO NOTHING)
   - Actualiza `user_preferences.last_organization_id`

7. Mariano es redirigido al Hub → Portal de Cliente

**Estado**: ✅ Funciona

---

## Paso 4: Lo que ve Mariano en el Portal

| Sección | Acceso | Controlado por |
|---------|--------|----------------|
| Dashboard de avance | ✅ Sí | `can_view_project()` |
| Documentos compartidos | ✅ Sí | `can_view_project()` |
| Pagos de "Colegio Elumar S.A." | ✅ Sí | `can_view_client_data(project_id, client_id)` |
| Pagos de OTROS clientes | ❌ No | `can_view_client_data()` filtra por `client_id` matching |
| Materiales, costos internos | ❌ No | Sin política RLS que otorgue acceso |
| Subcontratos | ❌ No | Sin política RLS que otorgue acceso |

**Estado**: ⚠️ Parcial — Las RLS paralelas para financial scoping (client_commitments, client_payments) están pendientes en Sección 3 del SQL 018.

---

## Diagrama completo

```
MATÍAS (admin de Constructora Lenga)
│
└── Proyecto → Participantes → Clientes → Agregar
    │
    ├── Modo A (contacto existente)
    │   │
    │   ├── createClientAction()
    │   │   └── INSERT project_clients
    │   │
    │   └── Auto-grant si linked_user_id
    │       └── linkCollaboratorToProjectAction()
    │           ├── UPSERT organization_external_actors
    │           └── INSERT project_access (client_id = scoping)
    │
    └── Modo B (invitar por email)
        │
        ├── inviteClientToProjectAction()
        │   ├── Find/Create contact
        │   ├── INSERT project_clients
        │   │
        │   ├── User existe → linkCollaboratorToProjectAction()
        │   │   ├── UPSERT organization_external_actors
        │   │   └── INSERT project_access (client_id = scoping)
        │   │
        │   └── User NO existe → addExternalCollaboratorWithProjectAction()
        │       └── INSERT organization_invitations
        │           (project_id + client_id + token)
        │
        └── MARIANO recibe email → Acepta
            └── acceptInvitationAction(token)
                └── RPC accept_external_invitation
                    ├── INSERT/REACTIVATE organization_external_actors
                    ├── INSERT project_access (client_id = scoping)
                    └── UPDATE user_preferences
```

---

## Caso: Mismo cliente en múltiples proyectos

```
Mariano Pérez (contacts.linked_user_id = mariano.users.id)
├── Proyecto "Colegio Elumar"
│   └── project_access (client_id = "Colegio Elumar S.A.")
│
├── Proyecto "Gimnasio Municipal"
│   └── project_access (client_id = "Municipalidad")
│
└── organization_external_actors (1 solo registro por org)
```

> Cada vinculación a proyecto crea un `project_access` separado. El actor externo a nivel organización es único.

---

## Caso: Multi-cliente en un proyecto

```
Proyecto: Torres Sur
├── Depto 1 → project_client: "Familia López"
│   ├── Juan López → project_access (client_id = Familia López) → solo sus pagos
│   └── María López → project_access (client_id = Familia López) → solo sus pagos
│
├── Depto 2 → project_client: "Familia García"
│   └── Ana García → project_access (client_id = Familia García) → solo sus pagos
│
└── Director de Obra Externo → project_access (client_id = NULL) → ve TODO
```
