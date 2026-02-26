# Technical Map: Cobros (Ingresos de Clientes)

> Referencia técnica exhaustiva. Para consulta rápida.

---

## 1. Tablas involucradas

### `finance.client_commitments`
| Columna | Tipo | FK | Uso en este flow |
|---------|------|-----|------------------|
| `id` | uuid | PK | Identificador del compromiso |
| `project_id` | uuid | | Proyecto al que pertenece |
| `client_id` | uuid | | project_client (NO contact) |
| `organization_id` | uuid | | Org propietaria |
| `amount` | numeric | | Monto comprometido |
| `currency_id` | uuid | → currencies | Moneda del compromiso |
| `exchange_rate` | numeric | | TC al momento del acuerdo |
| `commitment_method` | enum | | `'fixed'` o `'per_unit'` |
| `unit_name` | text | | Nombre de la unidad (si per_unit) |
| `concept` | text | | Concepto del compromiso |
| `description` | text | | Descripción libre |
| `quote_id` | uuid | → quotes | Vinculación a presupuesto |
| `created_by` | uuid | | Member que lo creó |
| `is_deleted` / `deleted_at` | | | Soft delete |

### `finance.client_payment_schedule`
| Columna | Tipo | FK | Uso en este flow |
|---------|------|-----|------------------|
| `id` | uuid | PK | Identificador de la cuota |
| `commitment_id` | uuid | → client_commitments | Compromiso padre |
| `due_date` | date | | Fecha de vencimiento |
| `amount` | numeric | | Monto de la cuota |
| `currency_id` | uuid | → currencies | Moneda de la cuota |
| `status` | text | | `pending`, `paid`, `overdue`, `cancelled` |
| `paid_at` | timestamptz | | Cuándo se pagó |
| `payment_method` | text | | Medio de pago |
| `notes` | text | | Notas de la cuota |
| `organization_id` | uuid | | Org propietaria |
| `created_by` / `updated_by` | uuid | | Auditoría |
| `is_deleted` / `deleted_at` | | | Soft delete |

### `finance.client_payments`
| Columna | Tipo | FK | Uso en este flow |
|---------|------|-----|------------------|
| `id` | uuid | PK | Identificador del cobro |
| `project_id` | uuid | | Proyecto vinculado |
| `client_id` | uuid | | project_client receptor |
| `commitment_id` | uuid | → client_commitments | Compromiso vinculado (opcional) |
| `schedule_id` | uuid | → client_payment_schedule | Cuota vinculada (opcional) |
| `organization_id` | uuid | | Org propietaria |
| `amount` | numeric | | Monto cobrado |
| `currency_id` | uuid | → currencies | Moneda del cobro |
| `exchange_rate` | numeric | | TC al momento del cobro |
| `wallet_id` | uuid | → organization_wallets | Billetera destino |
| `payment_date` | date | | Fecha del cobro |
| `status` | text | | `confirmed`, `pending`, `rejected`, `void` |
| `reference` | text | | Referencia de transacción |
| `notes` | text | | Notas |
| `created_by` / `updated_by` | uuid | | Auditoría |
| `is_deleted` / `deleted_at` | | | Soft delete |
| `import_batch_id` | uuid | | Si fue importado masivamente |

### Tablas auxiliares

| Tabla | Rol en el flow |
|-------|----------------|
| `projects.project_clients` | Entidad "Cliente en Proyecto" (contact + role + project) |
| `projects.client_roles` | Clasificación del cliente (Comitente, Inversor, etc.) |
| `contacts.contacts` | Datos de la persona/empresa |
| `finance.currencies` | Catálogo de monedas |
| `finance.organization_wallets` | Billeteras de la organización |
| `finance.wallets` | Tipos de billetera (sistema) |
| `finance.quotes` | Presupuestos/Contratos (vinculados via `quote_id`) |
| `finance.movements` | Ledger unificado de la organización |

---

## 2. Vistas SQL

### `finance.client_financial_summary_view`
- **Propósito**: Consolidar comprometido vs cobrado por client + currency
- **Fuentes**: `client_commitments` + `client_payments` + `project_clients` + `currencies`
- **Campos clave**: `total_committed_amount`, `total_paid_amount`, `balance_due`, `commitment_exchange_rate`
- **Filtros**: `commitments.is_deleted = false`, `payments.status = 'confirmed' AND is_deleted = false`

### `finance.client_payments_view`
- **Propósito**: Vista enriquecida de pagos con datos de cliente, billetera, moneda, compromiso, proyecto
- **JOINs**: `project_clients` → `contacts` → `users`, `organization_wallets` → `wallets`, `currencies`, `client_commitments`, `client_payment_schedule`, `organization_members` → `users`, `projects`
- **Campos clave**: `client_name`, `wallet_name`, `currency_symbol`, `commitment_concept`, `project_name`, `creator_full_name`
- **Filtro**: `cp.is_deleted = false`

### `finance.contract_summary_view`
- **Propósito**: Mostrar valor del contrato + change orders (aprobados/pendientes/valor revisado)
- **Fuentes**: `quotes` + `quotes_view` (para calcular totales de COs)
- **Campos clave**: `original_contract_value`, `approved_changes_value`, `revised_contract_value`, `potential_contract_value`

---

## 3. Funciones SQL

### `finance.fn_financial_kpi_summary(p_org_id, p_project_id)`
- **Propósito**: KPIs globales de ingresos/egresos/balance
- **Lógica**: Lee `unified_financial_movements_view`, suma ingresos (sign=1) y egresos (sign=-1)
- **Retorna**: `income`, `expenses`, `balance`, `currency_symbol`, `currency_code`
- **Schema Path**: `finance`, `iam`, `public`

---

## 4. Archivos Frontend

### Queries (`src/features/clients/queries.ts`)
| Función | Qué hace |
|---------|----------|
| `getClients(projectId)` | Obtiene clientes de un proyecto |
| `getClientsByOrganization(orgId)` | Obtiene todos los clientes de la org |
| `getOrganizationContacts(orgId)` | Contactos para selector de representante |
| `getFinancialSummaryByOrganization(orgId)` | Resumen financiero consolidado |
| `getCommitmentsByOrganization(orgId)` | Todos los compromisos |
| `getPaymentsByOrganization(orgId)` | Todos los cobros |
| `enrichPaymentsWithMedia(payments)` | Enriquece pagos con URLs firmadas de archivos adjuntos |
| `getSchedulesByOrganization(orgId)` | Todas las cuotas programadas |
| `getClientFinancialSummary(projectId)` | Resumen financiero por proyecto |
| `getClientCommitments(projectId)` | Compromisos por proyecto |
| `getClientPayments(projectId)` | Cobros por proyecto |
| `getClientPaymentSchedules(projectId)` | Cuotas por proyecto |
| `getClientRoles(orgId)` | Roles disponibles |

### Actions (`src/features/clients/actions.ts`)
| Función | Qué hace |
|---------|----------|
| `createClientAction(input)` | Crea un proyecto-cliente |
| `updateClientAction(input)` | Actualiza un proyecto-cliente |
| `deleteClientAction(clientId)` | Elimina (soft delete) |
| `deactivateClientAction(clientId)` | Desactiva + revoca acceso |
| `reactivateClientAction(clientId)` | Reactiva acceso |
| `createClientRoleAction(input)` | Crea un rol de cliente |
| `updateClientRoleAction(input)` | Actualiza rol |
| `deleteClientRoleAction(roleId, replacementId)` | Borra rol (con reemplazo) |
| `createCommitmentAction(input)` | Crea un compromiso |
| `updateCommitmentAction(input)` | Actualiza compromiso |
| `deleteCommitmentAction(id)` | Borra compromiso (soft delete) |
| `createPaymentAction(input)` | **Crea cobro + movement en ledger** |
| `updatePaymentAction(input)` | **Actualiza cobro + movement** |
| `deletePaymentAction(id)` | Borra cobro (soft delete) |

### Forms (`src/features/clients/forms/`)
| Archivo | Qué hace |
|---------|----------|
| `clients-form.tsx` | Form para crear/editar proyecto-cliente |
| `clients-role-form.tsx` | Form para crear/editar roles |
| `clients-commitment-form.tsx` | Form para crear/editar compromisos |
| `clients-payment-form.tsx` | Form para crear/editar cobros |
| `invite-client-portal-form.tsx` | Form para vincular cliente por email (portal externo) |

### Views (`src/features/clients/views/`)
| Archivo | Qué muestra |
|---------|-------------|
| `clients-overview-view.tsx` | Vista principal con KPIs y listado de clientes |
| `clients-commitments-view.tsx` | Listado de compromisos con DataTable |
| `clients-payments-view.tsx` | Listado de cobros con DataTable y KPIs |
| `clients-schedules-view.tsx` | Listado de cuotas programadas |
| `index.ts` | Barrel export |
| `external/` | Componentes del portal externo del cliente |

### Pages
| Ruta | Archivo |
|------|---------|
| `/organization/clients` | `src/app/[locale]/(dashboard)/organization/clients/page.tsx` |
| `/external/client/...` | Portal externo para clientes |

---

## 5. Cadena de datos completa

```
auth.uid()
  → iam.users.id
    → iam.organization_members.user_id (RLS: is_org_member)
      → projects.project_clients (RLS: org_id match)
        → finance.client_commitments (RLS: org_id match)
          → finance.client_payment_schedule (RLS: org_id match)
          → finance.client_payments (RLS: org_id match)
            → finance.movements (ledger, via action)
              → finance.unified_financial_movements_view
                → fn_financial_kpi_summary()
```

---

## 6. Tipos TypeScript (`src/features/clients/types.ts`)

| Tipo | Descripción |
|------|-------------|
| `ClientRole` | Rol de cliente (id, name, description) |
| `ProjectClient` | Cliente en proyecto (contact_id, role, status) |
| `ProjectClientView` | Vista enriquecida con datos del contacto |
| `ClientCommitment` | Compromiso (amount, method, quote_id) |
| `ClientPaymentSchedule` | Cuota programada (due_date, amount, status) |
| `ClientPayment` | Cobro (amount, wallet_id, status) |
| `ClientPaymentView` | Vista enriquecida con datos del cliente y proyecto |
| `ClientFinancialSummary` | Resumen: comprometido vs cobrado vs saldo |
| `OrganizationCurrency` | Moneda de la org |
| `OrganizationWallet` | Billetera de la org |
