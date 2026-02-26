# User Journey: Presupuestos, Contratos y Adicionales

> Tutorial paso a paso del ciclo de vida completo de un presupuesto de construcción en Seencel.

## Escenario

**María** (project manager, rol `admin`) de "Constructora Seencel" necesita presupuestar una obra para su cliente **Carlos Rodríguez**. La obra incluye albañilería (muro de ladrillos) y carpintería (puerta de madera). María quiere cotizar, aprobar, convertir a contrato, y luego agregar un adicional.

---

## Paso 1: Crear Presupuesto ✅

**Qué hace**: María va a Presupuestos → "Agregar Presupuesto" → llena nombre, cliente, proyecto, moneda.

| Dato | Detalle |
|------|---------|
| **Tabla** | `finance.quotes` → INSERT |
| **Columnas clave** | `name`, `client_id`, `project_id`, `currency_id`, `quote_type = 'quote'`, `status = 'draft'` |
| **Action** | `createQuote(formData)` → `src/features/quotes/actions.ts` |
| **Form** | `QuoteForm` → `src/features/quotes/forms/quote-form.tsx` |
| **Page** | `src/app/[locale]/(dashboard)/organization/quotes/page.tsx` |
| **View** | `QuotesListView` → `src/features/quotes/views/quotes-list-view.tsx` |
| **Estado** | ✅ Funciona |

---

## Paso 2: Agregar Items al Presupuesto ✅

**Qué hace**: En el detalle del presupuesto → tab "Ítems" → "Agregar Ítem" → selecciona tarea del catálogo, receta, cantidad, markup.

| Dato | Detalle |
|------|---------|
| **Tabla** | `finance.quote_items` → INSERT |
| **Columnas clave** | `quote_id`, `task_id`, `recipe_id`, `quantity`, `unit_price`, `markup_pct`, `cost_scope` |
| **Vista SQL** | `finance.quotes_items_view` → calcula `effective_unit_price`, `live_mat_cost`, `live_lab_cost`, `live_ext_cost` |
| **Action** | `createQuoteItem(formData)` → `actions.ts` |
| **Form** | `QuoteItemForm` → `src/features/quotes/forms/quote-item-form.tsx` |
| **View** | `QuoteBaseView` → `src/features/quotes/views/quote-base-view.tsx` |
| **Estado** | ✅ Funciona |

### Inline Editing (reciente)

Los campos **Cantidad**, **Margen %** y **Alcance** son editables inline directamente en la tabla usando `InlineEditableCell` (borde punteado dashed).

| Dato | Detalle |
|------|---------|
| **Action** | `updateQuoteItemField(id, field, value)` → whitelist de campos: `quantity`, `markup_pct`, `cost_scope` |
| **Componente** | `InlineEditableCell` → `src/components/shared/data-table/inline-editable-cell.tsx` |
| **Optimistic** | `useOptimisticList` → actualización instantánea antes de respuesta del server |
| **Estado** | ✅ Funciona |

### Cómo se calcula el precio

```
effective_unit_price (vista SQL):
  - Si quote.status = 'draft' → costo VIVO del catálogo (live_unit_price)
  - Si quote.status ≠ 'draft' → costo CONGELADO snapshot (unit_price)

live_unit_price (vista SQL):
  - cost_scope = 'materials_and_labor' → mat_cost + lab_cost + ext_cost
  - cost_scope = 'labor_only' → lab_cost + ext_cost

subtotal_item = quantity × effective_unit_price × (1 + markup_pct / 100)
```

### Columnas de la tabla (orden profesional)

```
Nro → Tarea → Alcance → Cant. → Ud. → Costo Unit. → Margen → Subtotal → Inc. %
```

---

## Paso 3: Editar Términos del Documento ✅

**Qué hace**: En la vista "Resumen", María edita nombre, descripción, IVA, descuento, tipo de cambio, fechas.

| Dato | Detalle |
|------|---------|
| **Action** | `updateQuoteDocumentTerms(quoteId, updates)` → actualiza campos no estructurales |
| **Campos editables** | `name`, `description`, `tax_pct`, `tax_label`, `discount_pct`, `exchange_rate`, `valid_until`, `quote_date`, `client_id`, `project_id` |
| **View** | `QuoteOverviewView` → `src/features/quotes/views/quote-overview-view.tsx` |
| **Estado** | ✅ Funciona |

---

## Paso 4: Enviar al Cliente ✅

**Qué hace**: María cambia status a "Enviado" → los precios se congelan.

| Dato | Detalle |
|------|---------|
| **Tabla** | `finance.quotes` → UPDATE `status = 'sent'` |
| **Action** | `updateQuoteStatus(id, 'sent')` → `actions.ts` |
| **Efecto** | Al pasar de `draft` → `sent`, la vista `quotes_items_view` empieza a usar `unit_price` (snapshot) en vez de `live_unit_price` |
| **Gotcha** | ⚠️ Los costs del snapshot (`snapshot_mat_cost`, etc.) se congelan al enviar via trigger/action |
| **Estado** | ✅ Funciona |

---

## Paso 5: Aprobar Presupuesto ✅

**Qué hace**: El cliente acepta → María aprueba el presupuesto.

| Dato | Detalle |
|------|---------|
| **Action** | `approveQuote(quoteId)` → llama RPC `finance.approve_quote_and_create_tasks` |
| **Acciones atómicas** | 1) Valida que no esté aprobado 2) Crea `construction_tasks` desde items 3) Marca `status = 'approved'` 4) Para contratos: congela `original_contract_value` |
| **Tabla destino** | `projects.construction_tasks` → tareas de obra con cantidades y costos |
| **Page** | `src/app/[locale]/(dashboard)/organization/quotes/[quoteId]/page.tsx` |
| **Estado** | ✅ Funciona |

---

## Paso 6: Convertir a Contrato ✅

**Qué hace**: María convierte el presupuesto aprobado a Contrato.

| Dato | Detalle |
|------|---------|
| **Action** | `convertQuoteToContract(quoteId)` → UPDATE `quote_type = 'contract'`, congela `original_contract_value` |
| **Form** | `QuoteConvertContractForm` → `src/features/quotes/forms/quote-convert-contract-form.tsx` |
| **Tabla** | `finance.quotes` → UPDATE |
| **Estado** | ✅ Funciona |

---

## Paso 7: Crear Adicional (Change Order) ✅

**Qué hace**: Durante la obra, surgen cambios → María crea un adicional vinculado al contrato.

| Dato | Detalle |
|------|---------|
| **Action** | `createChangeOrder(contractId, data)` → crea quote con `quote_type = 'change_order'`, `parent_quote_id = contractId` |
| **Numeración** | `getNextChangeOrderNumber(contractId)` → secuencial automático |
| **Tabla** | `finance.quotes` → INSERT con `parent_quote_id`, `change_order_number` |
| **Query** | `getChangeOrdersByContract(contractId)` → lista COs del contrato |
| **View** | `QuoteChangeOrdersView` → `src/features/quotes/views/quote-change-orders-view.tsx` |
| **Estado** | ✅ Funciona |

### Contract Summary

| Dato | Detalle |
|------|---------|
| **Vista SQL** | `finance.contract_summary_view` → agrega `original_contract_value` + COs aprobados/pendientes |
| **Campos clave** | `revised_contract_value = original + approved_changes`, `potential_contract_value = original + approved + pending` |
| **Query** | `getContractSummary(contractId)` |
| **Estado** | ✅ Funciona |

---

## Paso 8: Generar Compromisos de Pago ✅

**Qué hace**: María genera cuotas de pago para el cliente basadas en el total del presupuesto.

| Dato | Detalle |
|------|---------|
| **Action** | `generateCommitmentsFromQuote(quoteId, options)` |
| **Opciones** | `clientId`, `numberOfPayments`, `advancePercentage`, `concept` |
| **Tabla destino** | `finance.client_commitments` + `finance.client_payment_schedule` |
| **Estado** | ✅ Funciona |

---

## Paso 9: Convertir Quote a Proyecto ✅

**Qué hace**: Para quotes standalone (sin proyecto), María puede crear un proyecto nuevo a partir del presupuesto.

| Dato | Detalle |
|------|---------|
| **Action** | `convertQuoteToProject(quoteId, projectName?)` → crea proyecto + vincula quote |
| **Tabla destino** | `projects.projects` → INSERT, `finance.quotes` → UPDATE `project_id` |
| **Estado** | ✅ Funciona |

---

## Paso 10: Duplicar Presupuesto ✅

**Qué hace**: María duplica un presupuesto existente para usarlo como base de otro.

| Dato | Detalle |
|------|---------|
| **Action** | `duplicateQuote(id)` → copia quote + todos los quote_items |
| **Estado** | ✅ Funciona |

---

## Diagrama completo

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CICLO DE VIDA COMPLETO                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐       │
│  │  DRAFT   │────→│   SENT   │────→│ APPROVED │────→│ CONTRACT │       │
│  │          │     │          │     │          │     │          │       │
│  │ Costos   │     │ Costos   │     │ Crea     │     │ Congela  │       │
│  │ VIVOS    │     │ SNAPSHOT │     │ tareas   │     │ original │       │
│  └──────────┘     └──────────┘     └──────────┘     │ value    │       │
│       │                │                             └────┬─────┘       │
│       │                │                                  │             │
│       ▼                ▼                                  ▼             │
│  ┌──────────┐     ┌──────────┐                    ┌──────────┐         │
│  │ Editar   │     │ Rechazar │                    │ Change   │         │
│  │ inline   │     │          │                    │ Orders   │         │
│  │ (cant,   │     └──────────┘                    │ (CO #1,  │         │
│  │ margen,  │                                     │  CO #2)  │         │
│  │ alcance) │                                     └──────────┘         │
│  └──────────┘                                          │               │
│                                                        ▼               │
│                                                 revised_contract_      │
│                                                 value se actualiza     │
│                                                                         │
│  EXTRAS:                                                                │
│  ┌──────────────┐  ┌─────────────────┐  ┌─────────────┐               │
│  │ Duplicar     │  │ Convertir a     │  │ Generar     │               │
│  │ Quote        │  │ Proyecto        │  │ Compromisos │               │
│  └──────────────┘  └─────────────────┘  └─────────────┘               │
└─────────────────────────────────────────────────────────────────────────┘
```
