# User Journey: Gastos Generales

> Tutorial paso a paso de cómo un usuario gestiona gastos generales (overhead) en Seencel.

## Escenario

**Carlos** es administrador de "Constructora Patagonia". Quiere registrar y trackear los gastos fijos de la empresa: alquiler, seguros, servicios, etc.

---

## Paso 1: Crear Categorías (desde Conceptos)

**Qué hace**: En `Gastos Generales > Conceptos`, usa el botón "..." del toolbar para crear categorías como "Servicios", "Seguros", "Alquileres".

- **Tabla**: `finance.general_cost_categories` → columnas: `name`, `description`, `organization_id`
- **Action**: `createGeneralCostCategory()` en `features/general-costs/actions.ts`
- **Form**: `GeneralCostsCategoryForm` (Panel sm) en `features/general-costs/forms/general-costs-category-form.tsx`
- **Toolbar**: Split button en `GeneralCostsConceptsView` — acción secundaria "Nueva Categoría" (FolderPlus)
- **Estado**: ✅ Funciona — Categorías son org-owned (migradas de `is_system`). Se crean/editan desde el popover "..." del toolbar en la tab Conceptos.

---

## Paso 2: Definir Conceptos de Gasto

**Qué hace**: Va a `Gastos Generales > Conceptos` y define cada gasto: "Alquiler Oficina Central", "Internet Fibertel", etc. Marca cuáles son recurrentes y con qué frecuencia.

- **Tabla**: `finance.general_costs` → columnas: `name`, `description`, `category_id`, `is_recurring`, `recurrence_interval`, `expected_day`
- **Action**: `createGeneralCost()` / `updateGeneralCost()` / `deleteGeneralCost()` en `actions.ts`
- **Form**: `GeneralCostsConceptForm` (Panel md) en `forms/general-costs-concept-form.tsx`
- **View**: `GeneralCostsConceptsView` en `views/general-costs-concepts-view.tsx`
- **List Item**: `GeneralCostListItem` en `components/shared/list-item/items/general-cost-list-item.tsx`
- **Stats**: `getGeneralCostConceptStats()` — total pagos, monto acumulado, último pago por concepto
- **Estado**: ✅ Funciona — Accordion por categoría con `GeneralCostListItem`. Cada concepto muestra stats de pago (total, monto, último pago). Click en concepto navega al tab Pagos con filtro client-side (sin recarga). Toolbar con búsqueda y "Nuevo Concepto".

---

## Paso 3: Registrar Pagos

**Qué hace**: Va a `Gastos Generales > Pagos` y registra cada pago: selecciona concepto, billetera, monto, moneda, fecha, estado.

- **Tabla**: `finance.general_costs_payments` → columnas: `amount`, `currency_id`, `exchange_rate`, `payment_date`, `wallet_id`, `general_cost_id`, `status`, `notes`, `reference`
- **Vista SQL**: `finance.general_costs_payments_view` → JOIN con `general_costs`, `general_cost_categories`, `currencies`, `organization_wallets`, `users`
- **Action**: `createGeneralCostPayment()` / `updateGeneralCostPayment()` / `deleteGeneralCostPayment()` en `actions.ts`
- **Form**: `GeneralCostsPaymentForm` (Panel lg) en `forms/general-costs-payment-form.tsx`
- **View**: `GeneralCostsPaymentsView` en `views/general-costs-payments-view.tsx`
- **Columns**: `getGeneralCostPaymentColumns()` en `tables/general-costs-payment-columns.tsx`
- **Estado**: ✅ Funciona — Column factories (date, entity, text, wallet, money, status). Filtros (estado, fecha, búsqueda). Delete bulk. Export CSV/Excel. Import masivo.

### Flujo de inline editing en tabla de pagos:
- **Fecha**: Editable via inline DatePicker (`createDateColumn` con `editable: true`)
- **Estado**: Editable via Popover+Command (`createStatusColumn` con `editable: true`)
- **Billetera**: Editable via Popover+Command (`createWalletColumn` con `editable: true`)
- **Estado**: ✅ Funcional — `updateGeneralCostPaymentField()` con resolución wallet_name → wallet_id

---

## Paso 4: Asignar pagos a proyectos (Allocations)

**Qué hace**: Distribuye un pago general entre proyectos por porcentaje (ej: 60% Obra Norte, 40% Obra Sur).

- **Tabla**: `finance.general_cost_payment_allocations` → columnas: `payment_id`, `project_id`, `percentage`
- **Estado**: 🚧 **Tabla existe en DB pero NO hay UI para gestionarla**. No hay form, view ni action para allocations.

---

## Paso 5: Analizar con Dashboard

**Qué hace**: Va a `Gastos Generales > Visión General` y ve KPIs, gráficos de evolución mensual, distribución por categoría, insights automáticos y actividad reciente.

- **Vistas SQL**: `finance.general_costs_monthly_summary_view` + `finance.general_costs_by_category_view`
- **Action**: `getGeneralCostsDashboard()` en `actions.ts` — calcula KPIs, trends, charts, insights
- **View**: `GeneralCostsDashboardView` en `views/general-costs-dashboard-view.tsx`
- **Insights**: `generateGeneralCostsInsights()` en `features/insights/logic/general-costs.ts`
- **Estado**: ✅ Funciona — 4 MetricCards (KPIs), 2 ChartCards (evolución + distribución), tabla de actividad reciente, filtro de rango de fechas.

---

## Paso 6: Exportar datos

**Qué hace**: En la tabla de pagos, usa el botón de export para generar CSV o Excel.

- **Export config**: `GENERAL_COST_EXPORT_COLUMNS` en `tables/general-costs-payment-columns.tsx`
- **Libs**: `exportToCSV()` / `exportToExcel()` de `@/lib/export`
- **Estado**: ✅ Funciona — Export completo con transformaciones de fecha, status labels, etc.

---

## Diagrama completo

```
   ┌──────────────┐       ┌──────────────────┐       ┌────────────────────┐
   │  CATEGORÍAS  │←──────│    CONCEPTOS     │←──────│      PAGOS         │
   │  (Ajustes)   │  FK   │  (Conceptos)     │  FK   │  (Pagos)           │
   │              │       │                  │       │                    │
   │  name        │       │  name            │       │  amount            │
   │  is_system   │       │  is_recurring    │       │  payment_date      │
   │  description │       │  expected_day    │       │  status            │
   └──────────────┘       │  recurrence_ivl  │       │  wallet_id → 💰   │
                          └──────────────────┘       │  currency_id → 💱 │
                                                     │  notes, reference  │
                                                     └─────────┬──────────┘
                                                               │
                                                     ┌─────────▼──────────┐
                                                     │   ALLOCATIONS      │
                                                     │  (🚧 sin UI)      │
                                                     │  project_id        │
                                                     │  percentage        │
                                                     └────────────────────┘
                                                               │
                                                     ┌─────────▼──────────┐
                                                     │    DASHBOARD       │
                                                     │  KPIs + Charts     │
                                                     │  + Insights        │
                                                     │  + Activity Feed   │
                                                     └────────────────────┘
```
