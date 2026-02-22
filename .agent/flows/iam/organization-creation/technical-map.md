# Technical Map: Creación de Organización

> Referencia técnica de tablas, funciones, archivos y schemas involucrados.
> **Actualizado**: 2026-02-22 — Consolidación DB/088 + Currency Selector DB/089.

---

## Archivos Frontend

### Entry Points

| Archivo | Rol | Ruta |
|---------|-----|------|
| [create-organization-button.tsx](file:///c:/Users/Usuario/Seencel/seencel-v2/src/features/organization/components/create-organization-button.tsx) | Botón "Crear Organización" (Hub/Profile) | `/workspace-setup?new=true` |
| [profile-organizations-view.tsx](file:///c:/Users/Usuario/Seencel/seencel-v2/src/features/users/views/profile-organizations-view.tsx) | Vista de orgs en Profile | `/workspace-setup?new=true` |
| [layout.tsx](file:///c:/Users/Usuario/Seencel/seencel-v2/src/app/[locale]/(dashboard)/organization/layout.tsx) | Layout del dashboard — redirige si sin org | `/workspace-setup` |

### Page + View

| Archivo | Rol | Tipo |
|---------|-----|------|
| [page.tsx](file:///c:/Users/Usuario/Seencel/seencel-v2/src/app/[locale]/(onboarding)/workspace-setup/page.tsx) | Server Component — fetch data + currencies | Server |
| [workspace-setup-view.tsx](file:///c:/Users/Usuario/Seencel/seencel-v2/src/features/onboarding/views/workspace-setup-view.tsx) | Vista principal con 4 steps (incluye currency selector) | Client |

### Server Actions

| Archivo | Función | Propósito |
|---------|---------|-----------|
| [actions.ts](file:///c:/Users/Usuario/Seencel/seencel-v2/src/features/organization/actions.ts) | `createOrganization()` | Orquesta: auth → lookup → RPC (con currency) → logo → redirect |
| [upload-logo.ts](file:///c:/Users/Usuario/Seencel/seencel-v2/src/actions/upload-logo.ts) | `uploadOrganizationLogo()` | Sube logo a storage (lazy import) |

---

## Función SQL Principal

| Función | Schema | search_path | Tipo |
|---------|--------|-------------|------|
| `iam.handle_new_organization` | iam | `'iam', 'billing'` | SECURITY DEFINER |

**Parámetros**:
- `p_user_id uuid`
- `p_organization_name text`
- `p_business_mode text DEFAULT 'professional'`
- `p_default_currency_id uuid DEFAULT NULL` ← **DB/089**

**Retorna**: `uuid` (org_id)

> ⚠️ **Ya no existen step functions**. Toda la lógica está inline en esta función (consolidado por DB/088).

### Triggers Relevantes

| Tabla | Trigger | Función | Evento |
|-------|---------|---------|--------|
| `iam.organization_members` | `log_member_billable_changes` | `audit.log_member_billable_change()` | AFTER INSERT/UPDATE/DELETE |
| `iam.organization_members` | `handle_new_org_member_contact` | `iam.handle_new_org_member_contact()` | AFTER INSERT |

---

## Tablas Afectadas

### Schema `iam`

| Tabla | Acción | Step |
|-------|--------|------|
| `iam.organizations` | INSERT | 1 |
| `iam.organization_data` | INSERT | 2 |
| `iam.roles` | INSERT (x3) | 3 |
| `iam.organization_members` | INSERT | 4 |
| `iam.role_permissions` | INSERT | 5 |
| `iam.organization_preferences` | INSERT | 8 |
| `iam.user_preferences` | UPDATE | 10 |
| `iam.user_organization_preferences` | UPSERT | Post-RPC |

### Schema `finance`

| Tabla | Acción | Step |
|-------|--------|------|
| `finance.currencies` | SELECT | page.tsx (para el selector) |
| `finance.organization_currencies` | INSERT | 6 |
| `finance.organization_wallets` | INSERT | 7 |

### Schema `planner`

| Tabla | Acción | Step |
|-------|--------|------|
| `planner.kanban_boards` | INSERT | 9 |
| `planner.kanban_lists` | INSERT (x3) | 9 |

### Schema `billing` (via trigger)

| Tabla | Acción | Origen |
|-------|--------|--------|
| `billing.organization_member_events` | INSERT | Trigger on `organization_members` INSERT |

### Schema `projects` (via trigger)

| Tabla | Acción | Origen |
|-------|--------|--------|
| `projects.contacts` | INSERT | Trigger `handle_new_org_member_contact()` → `ensure_contact_for_user()` |

---

## UUIDs Hardcodeados

| Variable | Valor | Concepto |
|----------|-------|----------|
| `v_plan_free_id` | `015d8a97-6b6e-4aec-87df-5d1e6b0e4ed2` | Plan Free |
| `v_default_currency_id` | `COALESCE(p_default_currency_id, '58c50aa7-...')` | Moneda elegida o ARS fallback |
| `v_default_wallet_id` | `2658c575-0fa8-4cf6-85d7-6430ded7e188` | Efectivo |
| `v_default_pdf_template_id` | `b6266a04-9b03-4f3a-af2d-f6ee6d0a948b` | Template PDF default |

---

## Migraciones Aplicadas

| Script | Qué hizo |
|--------|----------|
| DB/088 | Consolidó 8 step functions en `handle_new_organization` inline + drop de 9 funciones orphan |
| DB/089 | Agregó `p_default_currency_id uuid DEFAULT NULL` con COALESCE fallback a ARS |
