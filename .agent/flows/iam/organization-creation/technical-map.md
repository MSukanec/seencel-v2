# Technical Map: Creación de Organización

> Referencia técnica de tablas, funciones, archivos y schemas involucrados.

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
| [page.tsx](file:///c:/Users/Usuario/Seencel/seencel-v2/src/app/[locale]/(onboarding)/workspace-setup/page.tsx) | Server Component — fetch data | Server |
| [workspace-setup-view.tsx](file:///c:/Users/Usuario/Seencel/seencel-v2/src/features/onboarding/views/workspace-setup-view.tsx) | Vista principal con 4 steps | Client |
| ~~[workspace-setup-view.tsx](file:///c:/Users/Usuario/Seencel/seencel-v2/src/app/[locale]/(onboarding)/workspace-setup/workspace-setup-view.tsx)~~ | ⚠️ DEAD CODE — versión vieja sin org type | Client |

### Server Actions

| Archivo | Función | Propósito |
|---------|---------|-----------|
| [actions.ts](file:///c:/Users/Usuario/Seencel/seencel-v2/src/features/organization/actions.ts) | `createOrganization()` | Orquesta: auth → lookup → RPC → logo → redirect |
| [upload-logo.ts](file:///c:/Users/Usuario/Seencel/seencel-v2/src/actions/upload-logo.ts) | `uploadOrganizationLogo()` | Sube logo a storage (lazy import) |

---

## Funciones SQL

### Función Principal

| Función | Schema | search_path | Tipo |
|---------|--------|-------------|------|
| `iam.handle_new_organization` | iam | `'iam', 'billing'` | SECURITY DEFINER |

**Parámetros**: `p_user_id uuid`, `p_organization_name text`, `p_business_mode text DEFAULT 'professional'`

**Retorna**: `uuid` (org_id)

### Step Functions

| Step | Función | Schema target | search_path |
|------|---------|---------------|-------------|
| 1 | `iam.step_create_organization` (4-param) | `iam.organizations` | `'iam', 'billing'` |
| 2 | `iam.step_create_organization_data` | `iam.organization_data` | `'iam', 'public'` |
| 3 | `iam.step_create_organization_roles` | `iam.roles` | `'public', 'iam'` |
| 4 | `iam.step_add_org_member` | `iam.organization_members` | `'iam'` |
| 5 | `iam.step_assign_org_role_permissions` | `iam.role_permissions` | `'public', 'iam'` |
| 6 | `iam.step_create_organization_currencies` | `finance.organization_currencies` | `'iam', 'finance', 'public'` |
| 7 | `iam.step_create_organization_wallets` | `finance.organization_wallets` | `'iam', 'finance', 'public'` |
| 8 | `iam.step_create_organization_preferences` | `iam.organization_preferences` | `'iam', 'public'` |
| 9 | Inline (no function) | `planner.kanban_boards`, `planner.kanban_lists` | N/A (qualified) |

### Función Orphan

| Función | Nota |
|---------|------|
| `iam.step_create_default_kanban_board` | ⚠️ Existe pero NO es llamada por `handle_new_organization`. Este usa código inline en step 9. Crea board "Mi Panel" en vez de "General". |

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
| `iam.role_permissions` | DELETE + INSERT | 5 |
| `iam.organization_preferences` | INSERT | 8 |
| `iam.user_preferences` | UPDATE | Final |
| `iam.user_organization_preferences` | UPSERT | Post-RPC |

### Schema `finance`

| Tabla | Acción | Step |
|-------|--------|------|
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

### Schema `public`

| Tabla | Acción | Origen |
|-------|--------|--------|
| `public.feature_flags` | SELECT | `page.tsx` (sin `.schema()`) |

---

## UUIDs Hardcodeados

| Variable | Valor | Concepto |
|----------|-------|----------|
| `v_plan_free_id` | `015d8a97-6b6e-4aec-87df-5d1e6b0e4ed2` | Plan Free |
| `v_default_currency_id` | `58c50aa7-b8b1-4035-b509-58028dd0e33f` | Peso Argentino (ARS) |
| `v_default_wallet_id` | `2658c575-0fa8-4cf6-85d7-6430ded7e188` | Efectivo |
| `v_default_pdf_template_id` | `b6266a04-9b03-4f3a-af2d-f6ee6d0a948b` | Template PDF default |

---

## Cross-Schema References

| Desde | Hacia | Tipo | Estado |
|-------|-------|------|--------|
| `iam.handle_new_organization` | `planner.kanban_boards` | Inline INSERT (schema-qualified) | ✅ OK |
| `iam.handle_new_organization` | `planner.kanban_lists` | Inline INSERT (schema-qualified) | ✅ OK |
| `iam.step_create_organization_currencies` | `finance.organization_currencies` | INSERT (schema-qualified) | ✅ OK |
| `iam.step_create_organization_wallets` | `finance.organization_wallets` | INSERT (schema-qualified) | ✅ OK |
| `audit.log_member_billable_change` | `billing.organization_member_events` | INSERT (trigger) | ✅ Fixed by DB/084 |
| `iam.handle_new_org_member_contact` | `iam.ensure_contact_for_user` → `projects.contacts` | INSERT | ✅ OK |
| `page.tsx` (frontend) | `public.feature_flags` | SELECT (sin `.schema()`) | ⚠️ Funciona pero inconsistente |
