# User Journey: Cobros (Ingresos de Clientes)

> Tutorial paso a paso de cómo un usuario gestiona cobros en Seencel. Desde crear un cliente, definir compromisos, planificar cuotas, hasta registrar los cobros efectivos.

## Escenario

**María** es directora de una constructora. Tiene el proyecto "Torre Mirador". El **cliente "Inversiones Mendoza SRL"** se comprometió a pagar $50,000,000 ARS en 10 cuotas mensuales. María necesita registrar ese acuerdo, planificar los vencimientos y luego registrar cada cobro a medida que llegan.

---

## Paso 1: Crear un Cliente en el Proyecto

**Qué hace María**: Va a la página de Clientes → pestaña "Clientes" → botón "Nuevo Cliente". Selecciona un contacto existente (o crea uno nuevo) y le asigna un rol (ej: "Comitente").

**Tabla**: `projects.project_clients`
- `id`, `project_id`, `contact_id`, `organization_id`, `client_role_id`, `status`
- `contact_id` → FK a `contacts.contacts`
- `client_role_id` → FK a `projects.client_roles`

**Archivos frontend**:
- Form: `src/features/clients/forms/clients-form.tsx`
- Action: `src/features/clients/actions.ts` → `createClientAction()`
- Query: `src/features/clients/queries.ts` → `getClients()`, `getClientsByOrganization()`
- View: `src/features/clients/views/clients-overview-view.tsx`

**Estado**: ✅ Funciona

---

## Paso 2: Crear un Presupuesto / Contrato (opcional)

**Qué hace María**: Antes de definir compromisos, opcionalmente crea un Presupuesto (Quote) de tipo `contract` que define el valor total de la obra. Los items del presupuesto detallan tareas y sus precios unitarios.

**Tabla**: `finance.quotes` y `finance.quote_items`
- `quotes.quote_type` = `'contract'` o `'change_order'`
- `quotes.client_id` → FK a contacto
- `quotes.currency_id`, `tax_pct`, `discount_pct`

**Vista SQL**: `finance.contract_summary_view`
- Muestra: valor original, change orders aprobados/pendientes, valor revisado, valor potencial

**Archivos frontend**:
- Feature separado: `src/features/quotes/`
- Este paso es *previo* a los compromisos, no es estrictamente parte del flujo de cobros pero alimenta el `commitment.quote_id`

**Estado**: ✅ Funciona

---

## Paso 3: Crear un Compromiso (Commitment)

**Qué hace María**: Va a Clientes → pestaña "Compromisos" → botón "Nuevo Compromiso". Define:
- **Proyecto** y **Cliente** (selects)
- **Monto** + **Moneda** + **Tipo de cambio**
- **Método de compromiso**: `fixed` (monto fijo) o `per_unit` (precio por unidad)
- Si `per_unit`: nombre de unidad + concepto
- **Descripción** (opcional)
- **Vinculación a Presupuesto** (opcional, selecciona un quote existente)

**Tabla**: `finance.client_commitments`
- `client_id` → FK a `projects.project_clients.id`
- `currency_id` → FK a `finance.currencies`
- `commitment_method` → enum: `'fixed'` | `'per_unit'`
- `quote_id` → FK a `finance.quotes` (opcional)
- `unit_name`, `concept`, `description` (opcionales)

**Archivos frontend**:
- Form: `src/features/clients/forms/clients-commitment-form.tsx`
- Action: `src/features/clients/actions.ts` → `createCommitmentAction()`
- Query: `src/features/clients/queries.ts` → `getCommitmentsByOrganization()`
- View: `src/features/clients/views/clients-commitments-view.tsx`

**Estado**: ✅ Funciona

---

## Paso 4: Definir Cronograma de Pagos (Schedule)

**Qué hace María**: Dentro de un compromiso, planifica las cuotas. Cada cuota tiene:
- **Fecha de vencimiento** (`due_date`)
- **Monto** de la cuota
- **Moneda** (independiente del compromiso padre)
- **Estado**: `pending`, `paid`, `overdue`, `cancelled`
- **Notas** (opcional)

**Tabla**: `finance.client_payment_schedule`
- `commitment_id` → FK a `client_commitments.id`
- `currency_id` → FK a `currencies.id`
- `status` default `'pending'`
- `paid_at` → timestamp de cuando se pagó
- `payment_method` → medio de pago (texto libre)

**Archivos frontend**:
- View: `src/features/clients/views/clients-schedules-view.tsx`
- Query: `src/features/clients/queries.ts` → `getSchedulesByOrganization()`, `getClientPaymentSchedules()`

**Estado**: ⚠️ Parcial
- La vista existe pero es básica (3.3KB)
- No hay form dedicado para crear/editar cuotas individuales
- Falta gestión visual del cronograma tipo Gantt o timeline

---

## Paso 5: Registrar un Cobro (Payment)

**Qué hace María**: Va a Clientes → pestaña "Pagos" → botón "Nuevo Cobro". Registra:
- **Proyecto** + **Cliente** → selects vinculados
- **Compromiso** (opcional, vincula el cobro a un acuerdo)
- **Cuota del cronograma** (opcional, vincula el cobro a una cuota específica)
- **Monto** + **Moneda** + **Tipo de cambio**
- **Billetera** donde ingresa el dinero
- **Fecha de pago**
- **Estado**: `confirmed`, `pending`, `rejected`, `void`
- **Referencia** + **Notas** (opcionales)
- **Comprobante** (archivo adjunto)

**Tabla**: `finance.client_payments`
- `client_id` → FK a `projects.project_clients.id`
- `commitment_id` → FK a `client_commitments.id` (opcional)
- `schedule_id` → FK a `client_payment_schedule.id` (opcional)
- `wallet_id` → FK a `organization_wallets.id`
- `currency_id` → FK a `currencies.id`
- `import_batch_id` → para pagos importados masivamente

**Acción en cascada**: Al crear un cobro confirmado, la action también:
1. Crea un registro en `finance.movements` (ledger unificado) con `amount > 0` (ingreso)
2. Si el cobro está vinculado a una cuota (`schedule_id`), actualiza el status de la cuota a `'paid'`

**Archivos frontend**:
- Form: `src/features/clients/forms/clients-payment-form.tsx`
- Action: `src/features/clients/actions.ts` → `createPaymentAction()`, `updatePaymentAction()`
- Query: `src/features/clients/queries.ts` → `getPaymentsByOrganization()`, `enrichPaymentsWithMedia()`
- View: `src/features/clients/views/clients-payments-view.tsx`

**Estado**: ✅ Funciona

---

## Paso 6: Ver Resumen Financiero de Clientes

**Qué hace María**: En la pestaña "Resumen" de Clientes, ve tarjetas KPI que muestran:
- Total comprometido (por moneda)
- Total cobrado vs saldo por cobrar
- Cantidad de clientes activos / pagos recibidos

**Vista SQL**: `finance.client_financial_summary_view`
- Cruza `client_commitments` (comprometido) con `client_payments` (cobrado)
- Calcula: `total_committed_amount`, `total_paid_amount`, `balance_due`
- Agrupado por `client_id` + `currency_id`

**Archivos frontend**:
- View: `src/features/clients/views/clients-overview-view.tsx`
- Query: `src/features/clients/queries.ts` → `getFinancialSummaryByOrganization()`, `getClientFinancialSummary()`
- Types: `ClientFinancialSummary` en `types.ts`

**Estado**: ✅ Funciona

---

## Paso 7: Reflejo en Finanzas (Ledger Unificado)

**Qué sucede**: Cuando se registra un cobro confirmado, se crea automáticamente un movimiento financiero en `finance.movements`. Este movimiento:
- Aparece en la vista unificada `unified_financial_movements_view`
- Se refleja en los KPIs del dashboard financiero (`fn_financial_kpi_summary`)
- Es visible en Finanzas → Movimientos

**Vista SQL**: `finance.unified_financial_movements_view` (vista que unifica todos los tipos de movimientos)

**Archivos frontend**:
- View: `src/features/finance/views/finances-movements-view.tsx`
- View: `src/features/finance/views/finances-overview-view.tsx`

**Estado**: ✅ Funciona

---

## Diagrama completo

```
         Contacto                      Proyecto
            │                              │
            ▼                              ▼
    ┌───────────────┐            ┌──────────────────┐
    │   contacts    │            │    projects       │
    └───────┬───────┘            └────────┬─────────┘
            │                             │
            ▼                             ▼
    ┌─────────────────────────────────────────┐
    │          project_clients                │
    │   (contact_id, project_id, role_id)     │
    └───────────────────┬─────────────────────┘
                        │
          ┌─────────────┼──────────────┐
          ▼             ▼              ▼
    ┌───────────┐ ┌───────────┐  ┌──────────┐
    │ client_   │ │ client_   │  │ quotes   │
    │commitments│ │ payments  │  │(contract)│
    │           │←┤           │  │          │
    │ quote_id ─┼─┼───────────┼──┤          │
    └─────┬─────┘ └─────┬─────┘  └──────────┘
          │             │
          ▼             │
    ┌───────────┐       │
    │ client_   │       │
    │ payment_  │       │
    │ schedule  │       │
    └─────┬─────┘       │
          │             │
          └──────►──────┘
                  │
                  ▼
          ┌───────────────┐
          │   movements   │
          │  (ledger)     │
          └───────────────┘
                  │
                  ▼
          ┌───────────────────────────┐
          │ unified_financial_        │
          │ movements_view            │
          │ → Dashboard KPIs         │
          └───────────────────────────┘
```
