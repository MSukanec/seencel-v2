# User Journey: Creación de Organización

> Tutorial paso a paso del flujo completo de creación de una organización en Seencel.
> **Actualizado**: 2026-02-22 — Consolidación DB/088 + Currency Selector DB/089.

## Escenario

**Juan** es un arquitecto que se acaba de registrar en Seencel. Completó el onboarding personal (nombre, apellido, timezone). Ahora necesita crear su estudio de arquitectura como organización.

---

## Paso 0: Entry Point — Llegar al Workspace Setup

**Tres caminos posibles:**

### A) Desde el Hub (usuario sin org)
- **Qué pasa**: Si el usuario no tiene ninguna org activa, el layout del dashboard lo redirige automáticamente.
- **Archivo**: `src/app/[locale]/(dashboard)/organization/layout.tsx`
- **Lógica**: `if (!activeOrgId && orgs.length === 0) → redirect('/workspace-setup')`

### B) Desde el Hub (botón "Espacio de Trabajo")
- **Archivo**: `src/features/organization/components/create-organization-button.tsx`
- **Lógica**: `router.push({ pathname: '/workspace-setup', query: { new: 'true' } })`

### C) Desde Profile > Organizaciones
- **Archivo**: `src/features/users/views/profile-organizations-view.tsx`
- **Lógica**: `router.push({ pathname: '/workspace-setup', query: { new: 'true' } })`

---

## Paso 1: Server Page — Data Fetching

**Archivo**: `src/app/[locale]/(onboarding)/workspace-setup/page.tsx`

**Queries ejecutadas (en paralelo):**

| Query | Función | Schema | Propósito |
|-------|---------|--------|-----------|
| Orgs del usuario | `getUserOrganizations(userId)` | `iam` | Verificar si ya tiene org |
| Es admin? | `checkIsAdmin()` | `iam` | Permitir bypass de restricciones |
| Invitación pendiente | `checkPendingInvitation(email)` | `iam` | Mostrar opción de aceptar |
| Feature flag | `supabase.from('feature_flags')` | `public` | Controlar si se puede crear |
| Monedas | `supabase.schema('finance').from('currencies')` | `finance` | Poblar selector de moneda |

**Redirección**: Si el usuario ya tiene org y NO viene con `?new=true`, redirige a `/organization`.

**Props pasadas a WorkspaceSetupView**: `pendingInvitation`, `isNewOrg`, `isAdmin`, `orgCreationEnabled`, `currencies`

---

## Paso 2: Step "choose" — Elegir Modo

**Qué hace el usuario**: Ve dos opciones:
1. **Crear una organización** → avanza a step "type"
2. **Aceptar invitación** (si existe) → llama `acceptInvitationAction`

**Lógica de bloqueo**:
- Si `orgCreationDisabled` y NO es admin → botón bloqueado visualmente
- Si `orgCreationDisabled` y SÍ es admin → puede clickear (opacity reducida)

---

## Paso 3: Step "type" — Seleccionar Tipo de Organización

**Qué hace el usuario**: Elige entre:
1. **Estudio Profesional / Constructora** (`businessMode = 'professional'`)
2. **Proveedor** (`businessMode = 'supplier'`) — bloqueado para no-admins

**Lógica**:
- Proveedor: solo admin puede seleccionar
- Profesional: bloqueado solo si `orgCreationDisabled && !isAdmin`
- Al elegir → `setBusinessMode(mode)` + `setStep("name")`

---

## Paso 4: Step "name" — Nombre, Logo y Moneda

**Qué hace el usuario**: 
1. Sube un logo (opcional) vía `ImageUploader`
2. Ingresa el nombre de la organización
3. **Selecciona moneda principal** desde un `<Select>` con todas las currencies disponibles
   - Tooltip explica: define divisa de movimientos/presupuestos/reportes, no se puede cambiar, podrá agregar secundarias

**Al presionar "Crear y Continuar"**: Llama `handleCreateOrg()` que pasa `orgName`, `businessMode`, `logoFormData`, y `selectedCurrencyId` a la action.

---

## Paso 5: Server Action — createOrganization()

**Archivo**: `src/features/organization/actions.ts`

**Parámetros**: `organizationName`, `businessMode`, `logoFormData?`, `defaultCurrencyId?`

**Pasos internos**:

1. `supabase.auth.getUser()` → obtener auth user
2. `iam.users` lookup por `auth_id` → obtener `publicUser.id` (users.id)
3. **RPC `iam.handle_new_organization`** con: `p_user_id`, `p_organization_name`, `p_business_mode`, `p_default_currency_id`
4. Upsert `iam.user_organization_preferences` (timestamp de último acceso)
5. Upload logo (si hay) vía `uploadOrganizationLogo`
6. `revalidatePath('/', 'layout')`
7. `redirect('/organization')`

---

## Paso 6: RPC — iam.handle_new_organization

**Función SECURITY DEFINER con 10 pasos atómicos inline** (consolidado, sin step functions externas).

| Step | Acción | Tabla |
|------|--------|-------|
| Rate Limit | max 3 orgs/hora por usuario | `iam.organizations` (SELECT count) |
| 1 | Crear organización | `iam.organizations` |
| 2 | Datos de org | `iam.organization_data` |
| 3 | Roles (Admin, Editor, Lector) | `iam.roles` (x3 RETURNING) |
| 4 | Miembro owner | `iam.organization_members` + ⚡ triggers |
| 5 | Permisos por rol | `iam.role_permissions` |
| 6 | Moneda default | `finance.organization_currencies` — usa `COALESCE(p_default_currency_id, ARS_UUID)` |
| 7 | Billetera default | `finance.organization_wallets` — Efectivo |
| 8 | Preferencias | `iam.organization_preferences` — con la moneda elegida |
| 9 | Kanban board | `planner.kanban_boards` + `planner.kanban_lists` (General + 3 listas) |
| 10 | Activar org | `iam.user_preferences` UPDATE |

**EXCEPTION handler**: Loguea en `ops.log_system_error` con todos los params (incluyendo `p_default_currency_id`).

---

## Paso 7: Post-Creación

1. Se hace upsert de `user_organization_preferences` (último acceso)
2. Se sube el logo si se proporcionó uno
3. Se revalidan paths
4. Redirect a `/organization` → aterriza en el dashboard

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
│   feature_flags query,                                           │
│   finance.currencies query  ← NEW                                │
│ ])                                                               │
└──────────────────────────────────────────────────────────────────┘
        │
        ▼
[WorkspaceSetupView] ── Client ────────────────────────────────────
│ Step 0: choose  → "Crear" / "Aceptar invitación"                │
│ Step 1: type    → Professional / Supplier                        │
│ Step 2: name    → Nombre + Logo + Moneda Principal               │
│ Step 3: submit  → handleCreateOrg()                              │
└──────────────────────────────────────────────────────────────────┘
        │
        ▼
[createOrganization()] ── Server Action ───────────────────────────
│ 1. auth.getUser()                                                │
│ 2. iam.users lookup (auth_id → users.id)                         │
│ 3. RPC iam.handle_new_organization (con currency_id) ─┐          │
│ 4. upsert user_org_preferences                        │          │
│ 5. upload logo (optional)                             │          │
│ 6. revalidatePath + redirect('/organization')         │          │
└───────────────────────────────────────────────────────┘          │
        ┌─────────────────────────────────────────────────────────┘
        ▼
[iam.handle_new_organization] ── SQL SECURITY DEFINER (all inline) ─
│ Rate Limit: max 3 orgs/hora                                      │
│ Step 1:  INSERT iam.organizations                                 │
│ Step 2:  INSERT iam.organization_data                             │
│ Step 3:  INSERT iam.roles (x3 RETURNING)                          │
│ Step 4:  INSERT iam.organization_members ⚡ triggers              │
│ Step 5:  INSERT iam.role_permissions (admin/editor/lector)         │
│ Step 6:  INSERT finance.organization_currencies (moneda elegida)   │
│ Step 7:  INSERT finance.organization_wallets (Efectivo)            │
│ Step 8:  INSERT iam.organization_preferences                      │
│ Step 9:  INSERT planner.kanban_boards + kanban_lists               │
│ Step 10: UPDATE iam.user_preferences (activar org)                │
└───────────────────────────────────────────────────────────────────┘
        │
        ▼
[Dashboard] ── Org activa, usuario es Admin, Kanban listo
```
