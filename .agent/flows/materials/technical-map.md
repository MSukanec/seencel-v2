# Technical Map: Materiales

> Referencia técnica exhaustiva. Para consulta rápida.

---

## 1. Tablas involucradas

### Catálogo (schema: `catalog`)

| Tabla | Columnas clave | Para qué se usa |
|-------|---------------|-----------------|
| `materials` | `id`, `name`, `code`, `unit_id` FK→units, `category_id` FK→material_categories, `organization_id`, `material_type`, `default_provider_id`, `is_system`, `is_deleted`, `import_batch_id` | Catálogo maestro de materiales |
| `material_categories` | `id`, `name`, `parent_id` FK→self | Jerarquía de categorías para sidebar |
| `material_types` | `id`, `organization_id`, `name`, `is_system`, `is_deleted` | Clasificación por tipo (material/insumo) |
| `material_prices` | `id`, `material_id` FK→materials, `organization_id`, `currency_id`, `unit_price`, `valid_from`, `valid_to` | Historial temporal de precios |
| `organization_material_prices` | `id`, `organization_id`, `material_id` FK→materials, `unit_price`, `currency_id`, `is_default` | Precio actual de org (lectura rápida) |
| `task_recipe_materials` | `id`, `recipe_id` FK→task_recipes, `material_id` FK→materials, `quantity`, `unit_id`, `waste_percentage`, `total_quantity`, `organization_id`, `is_deleted` | Receta: cuánto material por unidad de tarea |

### Procurement (schema: `finance`)

| Tabla | Columnas clave | Para qué se usa |
|-------|---------------|-----------------|
| `material_purchase_orders` | `id`, `organization_id`, `project_id`, `provider_id`, `order_date`, `expected_delivery_date`, `status` (draft/sent/quoted/approved/rejected/converted), `currency_id`, `subtotal`, `tax_amount`, `order_number`, `is_deleted` | Órdenes de compra a proveedores |
| `material_purchase_order_items` | `id`, `purchase_order_id` FK→POs, `material_id`, `description`, `quantity`, `unit_price`, `unit_id` | Items de línea de PO |
| `material_invoices` | `id`, `organization_id`, `project_id`, `provider_id`, `invoice_number`, `document_type`, `purchase_date`, `subtotal`, `tax_amount`, `total_amount`, `currency_id`, `exchange_rate`, `status`, `purchase_order_id` FK→POs | Facturas/recibos de proveedor |
| `material_invoice_items` | `id`, `invoice_id` FK→invoices, `material_id`, `description`, `quantity`, `unit_price`, `total_price`, `unit_id` | Items de línea de factura |
| `material_payments` | `id`, `project_id`, `organization_id`, `amount`, `currency_id`, `exchange_rate`, `payment_date`, `wallet_id` FK→wallets, `status`, `purchase_id` FK→invoices, `material_type_id`, `is_deleted`, `import_batch_id` | Pagos realizados a proveedores |

---

## 2. Vistas

| Vista | Schema | Tipo | Propósito |
|-------|--------|------|-----------|
| `materials_view` | catalog | INVOKER | Materiales con precio actual, unidad, categoría (JOIN materials + org_material_prices + units + categories) |
| `material_purchase_orders_view` | finance | INVOKER | POs con nombre de proyecto, proveedor, creador |
| `material_invoices_view` | finance | INVOKER | Facturas con proveedor, proyecto, PO vinculada |
| `material_payments_view` | finance | INVOKER | Pagos con wallet, creador, adjuntos (media_links), proyecto |
| `project_material_requirements_view` | construction | INVOKER | Necesidades calculadas: SUM(task.quantity × recipe_material.amount) agrupado por material |

---

## 3. Funciones SQL

No hay funciones SQL específicas de materiales. La lógica de cálculo de requerimientos está en la vista `project_material_requirements_view`.

---

## 4. Archivos Frontend

### Queries (`src/features/materials/queries.ts`)

| Función | Qué hace |
|---------|----------|
| `getMaterialPayments(projectId)` | Pagos por proyecto |
| `getOrgMaterialPayments(orgId)` | Pagos de toda la org |
| `getOrganizationFinancialData(orgId)` | Wallets + currencies de la org |
| `getMaterialsForOrganization(orgId)` | Catálogo completo con precios |
| `getMaterialCategoriesForCatalog()` | Categorías para dropdown |
| `getUnitsForMaterialCatalog()` | Unidades filtradas por `applicable_to='material'` |
| `getMaterialCategoryHierarchy()` | Categorías para árbol sidebar |
| `getProjectMaterialRequirements(projectId)` | Necesidades por proyecto |
| `getOrgMaterialRequirements(orgId)` | Necesidades de toda la org |
| `getPurchaseOrders(projectId)` | POs por proyecto |
| `getOrgPurchaseOrders(orgId)` | POs de toda la org |
| `getPurchaseOrderById(orderId)` | PO con items detallados |
| `getProvidersForProject(orgId)` | Contactos tipo proveedor |
| `getUnitPresentations()` | ⚠️ DEPRECATED — legacy |

### Actions (`src/features/materials/actions.ts`)

| Función | Qué hace |
|---------|----------|
| `createMaterialPaymentAction(input)` | Crear pago + media + functional_amount |
| `updateMaterialPaymentAction(input)` | Editar pago |
| `deleteMaterialPaymentAction(id)` | Soft delete pago |
| `getMaterialPurchasesAction(projectId)` | Helper: facturas por proyecto |
| `getOrgMaterialPurchasesAction(orgId)` | Helper: facturas de toda la org |
| `createMaterial(formData, isAdminMode)` | Crear material + precio |
| `updateMaterial(formData, isAdminMode)` | Editar material + precio |
| `deleteMaterial(id, replacementId, isAdminMode)` | Soft delete con reemplazo |
| `deleteMaterialsBulk(ids, isAdminMode)` | Bulk soft delete |
| `createPurchaseOrder(input)` | Crear PO + items |
| `updatePurchaseOrder(input)` | Editar PO + sync items |
| `updatePurchaseOrderStatus(orderId, status)` | Cambiar estado de PO con validación de transiciones |
| `deletePurchaseOrder(orderId)` | Soft delete PO + items |
| `getMaterialTypes(orgId)` | Listar tipos de material |
| `createMaterialType(data)` | Crear tipo |
| `updateMaterialType(id, data)` | Editar tipo |
| `deleteMaterialType(id)` | Soft delete tipo |
| `upsertMaterialPrice(input)` | Crear/actualizar precio con historial |
| `getMaterialCurrentPrice(materialId, orgId)` | Precio actual de un material |

### Forms (`src/features/materials/forms/`)

| Archivo | Qué hace |
|---------|----------|
| `material-form.tsx` (14KB) | Form de material: tipo, código, nombre, categoría, unidad, descripción, proveedor, precio |
| `material-payment-form.tsx` (15KB) | Form de pago: proyecto, monto, moneda, TC, wallet, factura vinculada, adjuntos |
| `material-type-form.tsx` (4KB) | Form simple: nombre + descripción de tipo |
| `purchase-order-form.tsx` (26KB) | Form complejo: proveedor, proyecto, items con selector de materiales, totales |
| `requirements-selector.tsx` (7KB) | Selector de materiales desde necesidades para vincular a PO |

### Views (`src/features/materials/views/`)

| Archivo | Qué muestra |
|---------|-------------|
| `materials-catalog-view.tsx` (34KB) | Catálogo con sidebar de categorías, búsqueda, CRUD, import/export |
| `materials-orders-view.tsx` (13KB) | Lista de POs con status, acciones, detalle |
| `materials-overview-view.tsx` (13KB) | Dashboard: KPIs (total pagado multi-moneda), últimos pagos, gráfico tendencia |
| `materials-payments-view.tsx` (19KB) | Lista de pagos con filtros, wallet, adjuntos, acciones CRUD |
| `materials-requirements-view.tsx` (10KB) | Tabla de necesidades calculadas con materiales, cantidades, tareas |
| `materials-settings-view.tsx` (10KB) | CRUD de Material Types con alertas de eliminación |

### Pages

| Archivo | Ruta |
|---------|------|
| `src/app/[locale]/organization/materials/page.tsx` | `/organization/materials` — Server Component con tabs |
| `src/app/[locale]/organization/projects/[projectId]/page.tsx` | Tab "Materiales" en página de proyecto |

---

## 5. Cadena de datos completa

```
auth.uid()
  → iam.get_user_id_by_auth_id() 
    → iam.organization_members (user pertenece a org)
      → catalog.materials (WHERE organization_id = org_id OR is_system)
        → catalog.materials_view (JOIN prices, units, categories)
          → UI: MaterialsCatalogView
      → finance.material_purchase_orders (WHERE organization_id)
        → finance.material_purchase_orders_view
          → UI: MaterialsOrdersView
      → finance.material_payments (WHERE organization_id)
        → finance.material_payments_view (JOIN wallets, creators, media)
          → UI: MaterialsPaymentsView + MaterialsOverviewView
```
