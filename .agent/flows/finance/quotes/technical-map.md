# Technical Map: Quotes

> Referencia técnica exhaustiva. Para consulta rápida, no tutorial.

---

## 1. Tablas involucradas

### `finance.quotes`

| Columna | Tipo | FK | Para qué |
|---------|------|----|----------|
| `id` | uuid | PK | Identifica quote/contrato/CO |
| `organization_id` | uuid | | Org owner |
| `project_id` | uuid | FK → `projects.projects` | Proyecto vinculado (nullable) |
| `client_id` | uuid | FK → `contacts.contacts` | Cliente (nullable) |
| `name` | text | UNIQUE | Nombre del presupuesto |
| `description` | text | | Notas/términos |
| `status` | text | | `draft` / `sent` / `approved` / `rejected` |
| `quote_type` | text | | `quote` / `contract` / `change_order` |
| `version` | int4 | UNIQUE | Versión (campo, sin UI real) |
| `currency_id` | uuid | FK → `finance.currencies` | Moneda |
| `exchange_rate` | numeric | | Tipo de cambio (multi-moneda) |
| `tax_pct` | numeric | | % impuesto (IVA) |
| `tax_label` | text | | Label del impuesto |
| `discount_pct` | numeric | | % descuento global |
| `quote_date` | date | | Fecha del presupuesto |
| `valid_until` | date | | Vigencia |
| `approved_at` | timestamptz | | Cuándo se aprobó |
| `approved_by` | uuid | | Quién aprobó |
| `parent_quote_id` | uuid | FK → `finance.quotes` | Para COs: contrato padre |
| `original_contract_value` | numeric | | Valor congelado al aprobar contrato |
| `change_order_number` | int4 | | Numeración secuencial de COs |
| `created_by` | uuid | | Creador |
| `updated_by` | uuid | | Último editor |
| `is_deleted` / `deleted_at` | bool/ts | | Soft delete |

### `finance.quote_items`

| Columna | Tipo | FK | Para qué |
|---------|------|----|----------|
| `id` | uuid | PK | |
| `quote_id` | uuid | FK → `finance.quotes` | Pertenece a |
| `task_id` | uuid | FK → `catalog.tasks` | Tarea del catálogo (nullable) |
| `recipe_id` | uuid | FK → recetas | Receta para costos vivos (nullable) |
| `description` | text | | Descripción custom |
| `quantity` | numeric | | Cantidad |
| `unit_price` | numeric | | Precio unitario (snapshot al enviar) |
| `currency_id` | uuid | FK → `finance.currencies` | Moneda |
| `markup_pct` | numeric | | % de margen |
| `tax_pct` | numeric | | % impuesto por item |
| `cost_scope` | cost_scope_enum | | `materials_and_labor` / `labor_only` |
| `sort_key` | numeric | | Orden de display |
| `snapshot_mat_cost` | numeric | | Costo materiales congelado |
| `snapshot_lab_cost` | numeric | | Costo M.O. congelado |
| `snapshot_ext_cost` | numeric | | Costo extras congelado |
| `is_deleted` / `deleted_at` | bool/ts | | Soft delete |

---

## 2. Vistas SQL

### `finance.quotes_items_view` (🔐 DEFINER)

**Source**: `finance.quote_items` + JOINs a `catalog.tasks`, `catalog.task_divisions`, `catalog.units`, `finance.quotes`, `catalog.task_recipes_view`

**Campos calculados clave**:
- `task_name`, `custom_name`, `division_name`, `division_order`, `recipe_name`
- `unit` → símbolo de unidad (e.g. "m²")
- `live_mat_cost`, `live_lab_cost`, `live_ext_cost` → costos VIVOS de la receta
- `live_unit_price` → según `cost_scope`: mat+lab+ext o lab+ext
- `effective_unit_price` → `CASE WHEN quote.status = 'draft' THEN live_unit_price ELSE unit_price END`

### `finance.quotes_view` (🔐 DEFINER)

**Source**: `finance.quotes` + JOINs a currencies, projects, contacts, parent quote + subquery `quotes_items_view`

**Campos calculados clave**:
- `currency_name`, `currency_symbol`, `project_name`, `client_name`, `parent_contract_name`
- `item_count` → COUNT items
- `subtotal` → SUM(quantity × effective_unit_price)
- `subtotal_with_markup` → SUM(quantity × effective_unit_price × (1 + markup_pct / 100))
- `total_after_discount` → subtotal_with_markup × (1 - discount_pct / 100)
- `total_with_tax` → total_after_discount × (1 + tax_pct / 100)

### `finance.contract_summary_view` (🔐 DEFINER)

**Source**: `finance.quotes` (contratos) + subquery de COs

**Campos clave**:
- `original_contract_value`
- `change_order_count`, `approved_change_order_count`, `pending_change_order_count`
- `approved_changes_value`, `pending_changes_value`
- `revised_contract_value` = original + approved
- `potential_contract_value` = original + approved + pending

---

## 3. Funciones SQL

### `finance.approve_quote_and_create_tasks(quote_id uuid)`

Llamada via RPC desde `approveQuote()`. Acciones atómicas:
1. Valida que el quote no esté ya aprobado
2. Crea `projects.construction_tasks` desde los `quote_items`
3. Marca `status = 'approved'`
4. Para contratos: congela `original_contract_value` con el total actual

---

## 4. Archivos Frontend

### Queries (`src/features/quotes/queries.ts`)

| Función | Qué hace |
|---------|----------|
| `getOrganizationQuotes(orgId)` | Lista quotes (excl. COs, excl. deleted) |
| `getProjectQuotes(projectId)` | Quotes de un proyecto |
| `getQuote(quoteId)` | Single quote desde `quotes_view` |
| `getQuoteItems(quoteId)` | Items desde `quotes_items_view` |
| `getChangeOrdersByContract(contractId)` | COs de un contrato |
| `getContractSummary(contractId)` | Resumen desde `contract_summary_view` |
| `getContractWithChangeOrders(contractId)` | Contract + COs + summary (paralelo) |
| `getNextChangeOrderNumber(contractId)` | Siguiente número de CO |

### Actions (`src/features/quotes/actions.ts`)

| Función | Qué hace |
|---------|----------|
| `createQuote(formData)` | Crear presupuesto |
| `updateQuote(formData)` | Actualizar presupuesto completo |
| `deleteQuote(id)` | Soft delete |
| `updateQuoteStatus(id, status)` | Cambiar estado (+ snapshot al enviar) |
| `approveQuote(quoteId)` | Aprobar + crear tareas de obra |
| `duplicateQuote(id)` | Duplicar quote + items |
| `createChangeOrder(contractId, data)` | Crear CO vinculado con `parent_quote_id` |
| `convertQuoteToContract(quoteId)` | Quote → Contract (congela `original_contract_value`) |
| `convertQuoteToProject(quoteId, name?)` | Quote sin proyecto → crear proyecto |
| `generateCommitmentsFromQuote(quoteId, opts)` | Generar cuotas de pago |
| `updateQuoteDocumentTerms(quoteId, updates)` | Editar nombre, IVA, descuento, etc. |
| `createQuoteItem(formData)` | Agregar item |
| `updateQuoteItem(id, formData)` | Actualizar item |
| `updateQuoteItemField(id, field, value)` | Inline edit parcial (whitelist: quantity, markup_pct, cost_scope) |
| `deleteQuoteItem(id, quoteId?)` | Soft delete item |

### Forms (`src/features/quotes/forms/`)

| Archivo | Qué hace |
|---------|----------|
| `quote-form.tsx` | Crear/editar quote (nombre, cliente, proyecto, moneda, impuesto, descuento) |
| `quote-item-form.tsx` | Agregar/editar item (tarea, receta, cantidad, precio, markup, alcance) |
| `quote-convert-contract-form.tsx` | Convertir quote a contrato |

### Views (`src/features/quotes/views/`)

| Archivo | Qué muestra |
|---------|-------------|
| `quotes-list-view.tsx` | Lista de presupuestos con filtros, badges de status/type |
| `quote-base-view.tsx` | Tab "Ítems" — tabla agrupada por rubro con inline editing, KPIs (subtotal, IVA, total) |
| `quote-overview-view.tsx` | Tab "Resumen" — datos generales, términos, cliente, proyecto |
| `quote-change-orders-view.tsx` | Tab "Adicionales" — lista de COs con KPIs de revised value |
| `quote-analytics-view.tsx` | Tab "Analítica" — gráficos y análisis del presupuesto |

### Pages (`src/app/[locale]/(dashboard)/organization/quotes/`)

| Archivo | Qué fetchea |
|---------|-------------|
| `page.tsx` | Lista: `getOrganizationQuotes(orgId)` |
| `[quoteId]/page.tsx` | Detalle: `getQuote`, `getQuoteItems`, `getContractWithChangeOrders` (si contract) |

### Types (`src/features/quotes/types.ts`)

| Tipo | Uso |
|------|-----|
| `Quote` | Tabla raw |
| `QuoteView` | Vista con joins (currency, project, client, totals) |
| `QuoteItem` | Tabla raw |
| `QuoteItemView` | Vista con live/snapshot costs + effective_unit_price |
| `ContractSummary` | Contract summary view |
| `QuoteFormData` | Form data para crear/editar |
| `QuoteStatus` | `'draft' / 'sent' / 'approved' / 'rejected'` |
| `QuoteType` | `'quote' / 'contract' / 'change_order'` |
| `CostScope` | `'materials_and_labor' / 'labor_only'` |

---

## 5. SQL Scripts pendientes

| Archivo | Qué hace | Estado |
|---------|----------|--------|
| `DB/08_add_recipe_name_to_view.sql` | Agrega `recipe_name` a `quotes_items_view`, cambia `u.name → u.symbol`, recrea vistas dependientes | ⚠️ Pendiente ejecución |

---

## 6. Índices

| Índice | Columnas |
|--------|----------|
| `idx_quotes_org` | `organization_id` |
| `idx_quotes_project` | `project_id` |
| `idx_quotes_client` | `client_id` |
| `idx_quotes_status` | `status` |
| `idx_quotes_type` | `quote_type` |
| `idx_quotes_parent_quote` | `parent_quote_id` |
| `idx_quotes_not_deleted` | `is_deleted` |
| `idx_quotes_org_active` | `organization_id` (filtrado) |
| `idx_quotes_created` | `created_by` |
| `idx_quotes_updated_by` | `updated_by` |
| `ux_quotes_project_name_version` | UNIQUE `project_id, name, version` |

---

## 7. Cadena de datos: Auth → Quote Item

```
auth.uid()
  → iam.get_user_id()  →  users.id
  → iam.get_active_org_id()  →  organization_members.organization_id
  → RLS: quote.organization_id = active_org
  → finance.quotes  (quote_type, status, parent_quote_id)
  → finance.quote_items  (task_id → catalog.tasks, recipe_id → catalog.task_recipes_view)
  → finance.quotes_items_view  (effective_unit_price calculado)
  → finance.quotes_view  (subtotal, total_with_tax calculados)
  → finance.contract_summary_view  (revised_contract_value para contratos)
```

---

## 8. RLS

> ⚠️ Las vistas `quotes_view`, `quotes_items_view` y `contract_summary_view` son `SECURITY DEFINER`, lo que significa que bypasean RLS de las tablas subyacentes. La seguridad depende de los filtros `organization_id` en las queries del frontend.

Las tablas base (`finance.quotes`, `finance.quote_items`) tienen RLS habilitado con políticas basadas en `organization_id` via `iam.get_active_org_id()`.
