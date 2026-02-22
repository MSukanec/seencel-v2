# User Journey: Creación de Organización

> Tutorial paso a paso del flujo completo de creación de una organización en Seencel.

## Escenario

**Juan** es un arquitecto que se acaba de registrar en Seencel. Completó el onboarding personal (nombre, apellido, timezone). Ahora necesita crear su estudio de arquitectura como organización.

---

## Paso 0: Entry Point — Llegar al Workspace Setup

**Tres caminos posibles:**

### A) Desde el Hub (usuario sin org)
- **Qué pasa**: Si el usuario no tiene ninguna org activa, el layout del dashboard lo redirige automáticamente.
- **Archivo**: `src/app/[locale]/(dashboard)/organization/layout.tsx` (línea 32)
- **Lógica**: `if (!activeOrgId && orgs.length === 0) → redirect('/workspace-setup')`
- **Estado**: ✅ Funciona

### B) Desde el Hub (botón "Espacio de Trabajo")
- **Qué pasa**: El usuario presiona el botón en el Hub
- **Archivo**: `src/features/organization/components/create-organization-button.tsx`
- **Lógica**: `router.push({ pathname: '/workspace-setup', query: { new: 'true' } })`
- **Estado**: ✅ Funciona

### C) Desde Profile > Organizaciones
- **Qué pasa**: En la vista de organizaciones del perfil, presiona "Crear Organización"
- **Archivo**: `src/features/users/views/profile-organizations-view.tsx` (línea 47)
- **Lógica**: `router.push({ pathname: '/workspace-setup', query: { new: 'true' } })`
- **Estado**: ✅ Funciona

---

## Paso 1: Server Page — Data Fetching

**Qué pasa**: El server component carga datos necesarios en paralelo.

**Archivo**: `src/app/[locale]/(onboarding)/workspace-setup/page.tsx`

**Queries ejecutadas (en paralelo):**

| Query | Función | Schema | Propósito |
|-------|---------|--------|-----------|
| Orgs del usuario | `getUserOrganizations(userId)` | `iam` | Verificar si ya tiene org |
| Es admin? | `checkIsAdmin()` | `iam` | Permitir bypass de restricciones |
| Invitación pendiente | `checkPendingInvitation(email)` | `iam` | Mostrar opción de aceptar |
| Feature flag | `supabase.from('feature_flags')` | ⚠️ `public` | Controlar si se puede crear |

**Redirección**: Si el usuario ya tiene org y NO viene con `?new=true`, redirige a `/organization`.

**Props pasadas a WorkspaceSetupView**: `pendingInvitation`, `isNewOrg`, `isAdmin`, `orgCreationEnabled`

**Estado**: ✅ Funciona

---

## Paso 2: Step "choose" — Elegir Modo

**Qué hace el usuario**: Ve dos opciones:
1. **Crear una organización** → avanza a step "type"
2. **Aceptar invitación** (si existe) → llama `acceptInvitationAction`

**Archivo**: `src/features/onboarding/views/workspace-setup-view.tsx` (líneas 345-446)

**Lógica de bloqueo**:
- Si `orgCreationDisabled` y NO es admin → botón bloqueado visualmente
- Si `orgCreationDisabled` y SÍ es admin → puede clickear (opacity reducida)

**Estado**: ✅ Funciona

---

## Paso 3: Step "type" — Seleccionar Tipo de Organización

**Qué hace el usuario**: Elige entre:
1. **Estudio Profesional / Constructora** (`businessMode = 'professional'`)
2. **Proveedor** (`businessMode = 'supplier'`) — siempre bloqueado para no-admins

**Archivo**: `src/features/onboarding/views/workspace-setup-view.tsx` (líneas 209-342)

**Lógica**:
- Proveedor: solo admin puede seleccionar (línea 281: `if (!isAdmin) return`)
- Profesional: bloqueado solo si `orgCreationDisabled && !isAdmin`
- Al elegir → `setBusinessMode(mode)` + `setStep("name")`

**Estado**: ✅ Funciona

---

## Paso 4: Step "name" — Nombre y Logo

**Qué hace el usuario**: Ingresa el nombre de la organización y opcionalmente sube un logo.

**Archivo**: `src/features/onboarding/views/workspace-setup-view.tsx` (líneas 115-207)

**Componentes usados**:
- `ImageUploader` con `compressionPreset="avatar"` — guarda File en `logoFileRef`
- `Input` controlado con `onChange` → `setOrgName`
- Soporte para Enter → submit

**Al presionar "Crear y Continuar"**: Llama `handleCreateOrg()` (línea 46)

**Estado**: ✅ Funciona

---

## Paso 5: Server Action — createOrganization()

**Qué pasa**: Se ejecuta la lógica server-side de creación.

**Archivo**: `src/features/organization/actions.ts` (líneas 90-160)

**Pasos internos**:

1. `supabase.auth.getUser()` → obtener auth user
2. `iam.users` lookup por `auth_id` → obtener `publicUser.id` (users.id)
3. **RPC `iam.handle_new_organization`** con: `p_user_id`, `p_organization_name`, `p_business_mode`
4. Upsert `iam.user_organization_preferences` (timestamp de último acceso)
5. Upload logo (si hay) vía `uploadOrganizationLogo`
6. `revalidatePath('/', 'layout')`
7. `redirect('/organization')`

**Estado**: ✅ Funciona

---

## Paso 6: RPC — iam.handle_new_organization

**Qué pasa**: Función SECURITY DEFINER que ejecuta 9 pasos atómicos.

**Archivo SQL**: `DB/schema/iam/functions_2.md`
**search_path**: `'iam', 'billing'`

### Step 1: Crear organización
- **Función**: `iam.step_create_organization(p_user_id, p_org_name, v_plan_free_id, p_business_mode)`
- **Tabla**: `iam.organizations` — INSERT con plan Free hardcodeado
- **Nota**: Existe overload de 3 y 4 params. El de 4 params incluye `business_mode`

### Step 2: Datos de org
- **Función**: `iam.step_create_organization_data(v_org_id)`
- **Tabla**: `iam.organization_data` — INSERT row vacío

### Step 3: Roles
- **Función**: `iam.step_create_organization_roles(v_org_id)`
- **Tabla**: `iam.roles` — INSERT Administrador, Editor, Lector (idempotente)

### Step 4: Agregar miembro owner
- **Función**: `iam.step_add_org_member(p_user_id, v_org_id, v_admin_role_id)`
- **Tabla**: `iam.organization_members` — INSERT con rol Administrador
- **⚠️ TRIGGER**: Dispara `audit.log_member_billable_change()` → INSERT en `billing.organization_member_events`

### Step 5: Permisos
- **Función**: `iam.step_assign_org_role_permissions(v_org_id)`
- **Tabla**: `iam.role_permissions` — Asigna permisos a cada rol

### Step 6: Monedas
- **Función**: `iam.step_create_organization_currencies(v_org_id, v_default_currency_id)`
- **Tabla**: `finance.organization_currencies` — INSERT ARS como default
- **UUID hardcodeado**: `58c50aa7-b8b1-4035-b509-58028dd0e33f`

### Step 7: Billeteras
- **Función**: `iam.step_create_organization_wallets(v_org_id, v_default_wallet_id)`
- **Tabla**: `finance.organization_wallets` — INSERT Efectivo como default
- **UUID hardcodeado**: `2658c575-0fa8-4cf6-85d7-6430ded7e188`

### Step 8: Preferencias
- **Función**: `iam.step_create_organization_preferences(v_org_id, ...)`
- **Tabla**: `iam.organization_preferences` — INSERT con defaults

### Step 9: Kanban Board
- **Lógica inline** (no usa `step_create_default_kanban_board`)
- **Tablas**: `planner.kanban_boards` + `planner.kanban_lists`
- **Inserta**: Board "General" + 3 listas (Por Hacer, En Progreso, Hecho)

### Paso final: Activar org
- `UPDATE iam.user_preferences SET last_organization_id = v_org_id`

**Estado**: ✅ Funciona (con fix DB/084 aplicado para el trigger de billing)

---

## Paso 7: Post-Creación

**Qué pasa**: Después del RPC exitoso:

1. Se hace upsert de `user_organization_preferences` (redundante — ya se hizo en el action)
2. Se sube el logo si se proporcionó uno
3. Se revalidan paths
4. Redirect a `/organization` → aterriza en el dashboard

**Estado**: ✅ Funciona

---

## Diagrama completo

```
[Hub/Profile/Layout Redirect]
        │
        ▼
[workspace-setup/page.tsx] ── Server ──────────────────────────────
│ Promise.all([                                                    │
│   getUserOrganizations(),                                        │
│   checkIsAdmin(),                                                │
│   checkPendingInvitation(),                                      │
│   feature_flags query                                            │
│ ])                                                               │
└──────────────────────────────────────────────────────────────────┘
        │
        ▼
[WorkspaceSetupView] ── Client ────────────────────────────────────
│ Step 0: choose  → "Crear" / "Aceptar invitación"                │
│ Step 1: type    → Professional / Supplier                        │
│ Step 2: name    → Nombre + Logo upload                           │
│ Step 3: submit  → handleCreateOrg()                              │
└──────────────────────────────────────────────────────────────────┘
        │
        ▼
[createOrganization()] ── Server Action ───────────────────────────
│ 1. auth.getUser()                                                │
│ 2. iam.users lookup (auth_id → users.id)                         │
│ 3. RPC iam.handle_new_organization ──┐                           │
│ 4. upsert user_org_preferences       │                           │
│ 5. upload logo (optional)            │                           │
│ 6. revalidatePath                    │                           │
│ 7. redirect('/organization')         │                           │
└──────────────────────────────────────┘                           │
        ┌──────────────────────────────────────────────────────────┘
        ▼
[iam.handle_new_organization] ── SQL SECURITY DEFINER ─────────────
│ Step 1: iam.step_create_organization → iam.organizations         │
│ Step 2: iam.step_create_organization_data → iam.organization_data│
│ Step 3: iam.step_create_organization_roles → iam.roles           │
│ Step 4: iam.step_add_org_member → iam.organization_members       │
│         ⚡ TRIGGER: audit.log_member_billable_change()            │
│         → billing.organization_member_events                     │
│ Step 5: iam.step_assign_org_role_permissions → iam.role_perms    │
│ Step 6: iam.step_create_org_currencies → finance.org_currencies  │
│ Step 7: iam.step_create_org_wallets → finance.org_wallets        │
│ Step 8: iam.step_create_org_preferences → iam.org_preferences    │
│ Step 9: Inline → planner.kanban_boards + planner.kanban_lists    │
│ Final:  UPDATE iam.user_preferences (last_organization_id)       │
└──────────────────────────────────────────────────────────────────┘
        │
        ▼
[Dashboard] ── Org activa, usuario es Admin, Kanban listo
```
