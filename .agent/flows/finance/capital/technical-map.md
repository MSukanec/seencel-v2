# Technical Map: Capital

> Referencia técnica exhaustiva. Consulta rápida.

---

## 1. Tablas involucradas

### `finance.capital_participants`
| Columna | Tipo | FK | Propósito |
|---------|------|----|-----------|
| id | uuid | PK | ID del participante |
| contact_id | uuid | → contacts.contacts | Contacto vinculado |
| organization_id | uuid | | Org dueña |
| ownership_percentage | numeric | | % esperado de participación |
| status | text | | `active` / `inactive` |
| created_by | uuid | | Miembro que lo creó |
| is_deleted / deleted_at | | | Soft delete |

### `finance.partner_contributions`
| Columna | Tipo | FK | Propósito |
|---------|------|----|-----------|
| id | uuid | PK | |
| partner_id | uuid | → capital_participants | Socio que aporta |
| amount | numeric | | Monto en moneda original |
| currency_id | uuid | → currencies | Moneda |
| exchange_rate | numeric | | TC al momento |
| contribution_date | date | | Fecha del aporte |
| wallet_id | uuid | → organization_wallets | Billetera destino |
| project_id | uuid | | Proyecto asociado (opcional) |
| status | text | | `confirmed` / `pending` / `rejected` |
| reference | text | | Nro comprobante |
| is_deleted | bool | | Soft delete |

### `finance.partner_withdrawals`
Misma estructura que `partner_contributions` pero con `withdrawal_date`.

### `finance.capital_adjustments`
| Columna | Tipo | FK | Propósito |
|---------|------|----|-----------|
| id | uuid | PK | |
| partner_id | uuid | → capital_participants | Socio afectado |
| amount | numeric | | Puede ser negativo |
| currency_id | uuid | → currencies | |
| adjustment_date | date | | |
| reason | text | | Razón del ajuste |
| status | text | | `confirmed` default |
| **wallet_id** | — | **NO TIENE** | Ajustes no pasan por wallet |

### `finance.partner_capital_balance`
| Columna | Tipo | FK | Propósito |
|---------|------|----|-----------|
| partner_id | uuid | → capital_participants | UNIQUE per org |
| organization_id | uuid | | UNIQUE with partner_id |
| balance_amount | numeric | | Saldo materializado |
| balance_date | date | | Última actualización |

---

## 2. Views SQL

| View | Tipo | Propósito |
|------|------|-----------|
| `capital_ledger_view` | INVOKER | UNION ALL de contributions + withdrawals + adjustments, unificado con `movement_type` |
| `capital_organization_totals_view` | INVOKER | Totales agregados por org (sum contributions, withdrawals, adjustments) |
| `capital_partner_balances_view` | INVOKER | Balance calculado por socio (sum de cada tipo, count, last_date) |
| `capital_participants_summary_view` | INVOKER | Join de participants + balances_view para lectura rápida |
| `capital_partner_kpi_view` | INVOKER | KPIs avanzados: expected_contribution, deviation, real_ownership_ratio, contribution_status |

### `capital_partner_kpi_view` — Campos calculados clave
- `expected_contribution`: total_contributions_org × (ownership_pct / 100)
- `deviation_contribution`: total_contributed - expected_contribution
- `real_ownership_ratio`: current_balance / org_total_net_capital
- `contribution_status`: `sobre_aportado` | `bajo_aportado` | `equilibrado` | `sin_porcentaje`
- `net_status`: `arriba` | `abajo` | `equilibrado` | `sin_porcentaje`

---

## 3. Triggers

| Tabla | Trigger | Evento | Función |
|-------|---------|--------|---------|
| `partner_contributions` | `trg_update_balance_contribution` | AFTER INSERT/UPDATE/DELETE | `finance.update_partner_balance_after_cap...` |
| `partner_withdrawals` | `trg_update_balance_withdrawal` | AFTER INSERT/UPDATE/DELETE | `finance.update_partner_balance_after_cap...` |
| `capital_adjustments` | `trg_update_balance_adjustment` | AFTER INSERT/UPDATE/DELETE | `finance.update_partner_balance_after_cap...` |
| `capital_adjustments` | `capital_adjustments_set_updated_at` | BEFORE UPDATE | `set_timestamp()` |

---

## 4. RLS Policies

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `capital_participants` | `can_view_org(org_id, 'finance.view')` | `can_mutate_org(org_id, 'finance.manage')` | `can_mutate_org(org_id, 'finance.manage')` | ❌ No existe |
| `partner_contributions` | `can_view_org(org_id, 'finance.view')` | `can_mutate_org(org_id, 'finance.manage')` | `can_mutate_org(org_id, 'finance.manage')` | ❌ No existe |
| `partner_withdrawals` | `can_view_org(org_id, 'finance.view')` | `can_mutate_org(org_id, 'finance.manage')` | `can_mutate_org(org_id, 'finance.manage')` | ❌ No existe |
| `capital_adjustments` | `can_view_org(org_id, 'finance.view')` | `can_mutate_org(org_id, 'finance.manage')` | `can_mutate_org(org_id, 'finance.manage')` | ❌ No existe |
| `partner_capital_balance` | `can_view_org(org_id, 'finance.view')` | `can_mutate_org(org_id, 'finance.manage')` | `can_mutate_org(org_id, 'finance.manage')` | ❌ No existe |

> ⚠️ **Nota**: No hay DELETE policies en ninguna tabla. El soft delete (is_deleted = true via UPDATE) lo cubre, pero habría que agregar DELETE policy si se quiere hard delete desde el trigger.

---

## 5. Archivos Frontend

### Pages
| Archivo | Qué hace |
|---------|----------|
| `src/app/[locale]/(dashboard)/organization/capital/page.tsx` | Server component. Fetch de `capital_ledger_view`, `capital_participants_summary_view`, currencies, contacts. Pasa todo a `CapitalPageView`. |

### Views
| Archivo | Estado | Qué muestra |
|---------|--------|-------------|
| `capital-page-view.tsx` | ✅ | Orquestador client con Tabs (Overview, Participants, Balances, Movements) + DateRange filter |
| `capital-overview-view.tsx` | ✅ | 4 KPIs + Area Chart evolución + Actividad reciente (últimos 5 movimientos) |
| `capital-movements-view.tsx` | ✅ | DataTable con filtros (tipo, estado, fecha) + KPIs + toolbar con acciones |
| `capital-participants-view.tsx` | 🚧 | Solo empty state placeholder |
| `capital-balances-view.tsx` | 🚧 | Solo empty state placeholder |

### Actions
> **No existe** — no hay `src/features/capital/actions.ts`

### Forms
> **No existe** — no hay forms para crear/editar participantes, aportes, retiros ni ajustes

### Types
> **No existe** — todas las interfaces son `any[]`

---

## 6. Cadena de datos completa

```
auth.uid()
  → iam.users.auth_id
    → iam.organization_members.user_id
      → RLS: can_view_org(organization_id, 'finance.view')
        → finance.capital_ledger_view (UNION ALL)
          → partner_contributions WHERE status='confirmed' AND is_deleted=false
          → partner_withdrawals WHERE status='confirmed' AND is_deleted=false
          → capital_adjustments WHERE status='confirmed' AND is_deleted=false
        → finance.capital_participants_summary_view
          → capital_participants WHERE is_deleted=false
          → capital_partner_balances_view (aggregated sums)
```
