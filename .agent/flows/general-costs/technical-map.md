# Technical Map: Gastos Generales

> Referencia técnica exhaustiva. Consulta rápida.

---

## 1. Tablas involucradas

### `finance.general_cost_categories`
| Columna | Tipo | FK | Uso |
|---------|------|----|-----|
| id | uuid PK | — | Identificador |
| organization_id | uuid | — | NULL para system categories |
| name | text | — | Nombre visible |
| description | text? | — | Descripción opcional |
| is_system | bool | — | true = no editable/eliminable |
| is_deleted / deleted_at | bool / timestamptz | — | Soft delete |
| created_by / updated_by | uuid? | — | Auditoría |

**RLS**: 3 políticas — view (`finance.view`), create/update (`finance.manage`)

---

### `finance.general_costs`
| Columna | Tipo | FK | Uso |
|---------|------|----|-----|
| id | uuid PK | — | Identificador |
| organization_id | uuid | — | Org scope |
| name | text | — | Nombre del concepto |
| description | text? | — | Descripción |
| category_id | uuid? | → `general_cost_categories.id` | Categoría padre |
| is_recurring | bool | — | ¿Gasto recurrente? |
| recurrence_interval | text? | — | "monthly", "quarterly", etc. |
| expected_day | smallint? | — | Día esperado del pago |
| is_deleted / deleted_at | bool / timestamptz | — | Soft delete |
| created_by / updated_by | uuid? | — | Auditoría |

**RLS**: 3 políticas — view, create, update con `can_view_org` / `can_mutate_org`

---

### `finance.general_costs_payments`
| Columna | Tipo | FK | Uso |
|---------|------|----|-----|
| id | uuid PK | — | Identificador |
| organization_id | uuid | — | Org scope |
| amount | numeric | — | Monto del pago |
| currency_id | uuid | → `currencies.id` | Moneda |
| exchange_rate | numeric? | — | Cotización |
| payment_date | date | — | Fecha del pago |
| wallet_id | uuid | → `organization_wallets.id` | Billetera |
| general_cost_id | uuid? | → `general_costs.id` | Concepto asociado |
| status | text | — | 'pending' / 'confirmed' / 'overdue' / 'cancelled' |
| notes | text? | — | Notas internas |
| reference | text? | — | Referencia/comprobante |
| import_batch_id | uuid? | → `import_batches.id` | Batch de import masivo |
| is_deleted / deleted_at | bool / timestamptz | — | Soft delete |
| created_by / updated_by | uuid? | — | Auditoría |

**RLS**: 4 políticas — SELECT, INSERT, UPDATE, DELETE

---

### `finance.general_cost_payment_allocations`
| Columna | Tipo | FK | Uso |
|---------|------|----|-----|
| id | uuid PK | — | Identificador |
| payment_id | uuid | → `general_costs_payments.id` | Pago padre |
| project_id | uuid | — | Proyecto destino |
| percentage | numeric | — | % asignado |
| created_at | timestamptz | — | Timestamp |

**RLS**: 2 políticas — view/manage via join a payments

---

## 2. Vistas SQL

| Vista | Uso | Tablas JOIN |
|-------|-----|-------------|
| `finance.general_costs_payments_view` | Lectura enriquecida de pagos | payments + general_costs + categories + currencies + wallets + users |
| `finance.general_costs_monthly_summary_view` | Resumen mensual (total + count) | payments agrupados por mes |
| `finance.general_costs_by_category_view` | Gasto por categoría por mes | payments + costs + categories |

---

## 3. Triggers y Auditoría

| Tabla | Triggers |
|-------|----------|
| `general_cost_categories` | `set_timestamp`, `handle_updated_by`, `log_general_cost_category_activity` |
| `general_costs` | `set_timestamp` (via `updated_at`), `handle_updated_by`, `log_general_costs_activity` |
| `general_costs_payments` | `handle_updated_by`, `log_general_costs_payments_activity` |

---

## 4. Archivos Frontend

### Queries (Server Actions)
| Función | Archivo | Qué hace |
|---------|---------|----------|
| `getActiveOrganizationId()` | `actions.ts` | Obtiene org activa del JWT |
| `getGeneralCostCategories()` | `actions.ts` | Lista categorías activas |
| `getGeneralCosts()` | `actions.ts` | Lista conceptos con categoría |
| `getGeneralCostPayments()` | `actions.ts` | Lista pagos (vista SQL) |
| `getGeneralCostsDashboard()` | `actions.ts` | KPIs + charts + insights |

### Mutations (Server Actions)
| Función | Archivo | Qué hace |
|---------|---------|----------|
| `createGeneralCostCategory()` | `actions.ts` | Crea categoría |
| `updateGeneralCostCategory()` | `actions.ts` | Edita categoría |
| `deleteGeneralCostCategory()` | `actions.ts` | Soft delete categoría |
| `createGeneralCost()` | `actions.ts` | Crea concepto |
| `updateGeneralCost()` | `actions.ts` | Edita concepto |
| `deleteGeneralCost()` | `actions.ts` | Soft delete concepto |
| `createGeneralCostPayment()` | `actions.ts` | Crea pago (con media upload) |
| `updateGeneralCostPayment()` | `actions.ts` | Edita pago (con media upload) |
| `deleteGeneralCostPayment()` | `actions.ts` | Soft delete pago |

### Forms
| Archivo | Tipo | Qué hace |
|---------|------|----------|
| `general-costs-category-form.tsx` | Panel ✅ | CRUD de categorías (FolderOpen, sm) |
| `general-costs-concept-form.tsx` | Panel ✅ | CRUD de conceptos con recurrencia (FileText, md) |
| `general-costs-payment-form.tsx` | Panel ✅ | CRUD de pagos con moneda, billetera, attachments (Receipt, lg) |

### Import
| Archivo | Qué hace |
|---------|----------|
| `src/lib/import/general-costs-import.ts` | Adapter de import masivo de pagos (resuelve concepto, moneda, billetera por nombre) |

### Views
| Archivo | Qué muestra |
|---------|-------------|
| `general-costs-dashboard-view.tsx` | KPIs + Charts + Insights + Actividad Reciente |
| `general-costs-concepts-view.tsx` | DataTable de conceptos |
| `general-costs-payments-view.tsx` | DataTable de pagos con filtros, bulk delete, export, import masivo |
| `general-costs-settings-view.tsx` | SettingsSection con CategoryListItem |

### Tables (Column Definitions)
| Archivo | Columnas |
|---------|----------|
| `general-costs-concept-columns.tsx` | Nombre, Descripción, Categoría, Recurrencia |
| `general-costs-payment-columns.tsx` | Fecha, Concepto, Descripción, Billetera, Monto, Estado |

### Page
| Archivo | Qué hace |
|---------|----------|
| `app/[locale]/(dashboard)/organization/general-costs/page.tsx` | Server Component. Fetch de todo + 4 tabs (Dashboard, Conceptos, Pagos, Ajustes) |

---

## 5. Cadena de datos

```
auth.uid() → users.id → organization_members.user_id
           → can_view_org(org_id, 'finance.view')
           → SELECT finance.general_costs_payments_view
           → JOINs: payments ← general_costs ← categories
                     payments → currencies, wallets, users
```

---

## 6. Índices

| Tabla | Índice | Columnas |
|-------|--------|----------|
| `general_cost_categories` | `idx_gc_categories_list` | `(organization_id) WHERE NOT is_deleted` |
| `general_cost_categories` | `uq_gc_categories_org_name` | UNIQUE `(organization_id, name) WHERE NOT is_deleted` |
| `general_cost_categories` | `uq_gc_categories_system_name` | UNIQUE system names |
| `general_costs` | `idx_general_costs_org_deleted` | `(organization_id) WHERE NOT is_deleted` |
| `general_costs_payments` | `idx_gc_payments_general_cost` | `(general_cost_id)` |
| `general_costs_payments` | `idx_gc_payments_org_date` | `(organization_id, payment_date)` |
| `general_costs_payments` | `idx_gc_payments_status_org` | `(status, organization_id)` |
| `general_costs_payments` | `idx_gc_payments_wallet` | `(wallet_id)` |
