# User Journey: Materiales

> Tutorial paso a paso de cada funcionalidad del módulo de Materiales.

## Escenario

**María** (Directora de proyectos) trabaja en una constructora que usa Seencel. Tiene el proyecto "Torre Mirador" en curso. Necesita gestionar materiales desde el catálogo hasta los pagos.

---

## Flujo 1: Gestión del Catálogo de Materiales

### Paso 1: Ver catálogo de materiales
- **Acción**: María va a `/organization/materials` → tab "Catálogo"
- **Qué ve**: Lista de materiales con sidebar de categorías, búsqueda, y precios
- **Tabla**: `catalog.materials` (JOIN con `catalog.materials_view`)
- **Frontend**: `views/materials-catalog-view.tsx` → `queries.ts:getMaterialsForOrganization()`
- **Estado**: ✅ Funcional

### Paso 2: Crear un material
- **Acción**: Click en "+ Nuevo Material" en el Toolbar
- **Formulario**: Tipo, Código, Nombre, Categoría, Unidad, Descripción, Proveedor Default, Moneda, Precio
- **Tablas**: 
  - `catalog.materials` → INSERT (material base)
  - `catalog.organization_material_prices` → INSERT (precio de org)
- **Frontend**: `forms/material-form.tsx` → `actions.ts:createMaterial()`
- **Estado**: ✅ Funcional

### Paso 3: Importar materiales masivamente
- **Acción**: Click en menú dropdown → "Importar"
- **Flujo**: Upload Excel → Mapeo columnas → Validación → Conflictos → Resultado
- **Tablas**: `catalog.materials` + `catalog.organization_material_prices` (batch insert)
- **Frontend**: Universal Import System (Standard 3.5)
- **Estado**: ✅ Funcional

### Paso 4: Organizar por categorías
- **Acción**: Sidebar izquierdo muestra árbol de categorías con contadores
- **Tabla**: `catalog.material_categories` (jerárquica con `parent_id`)
- **Frontend**: `queries.ts:getMaterialCategoryHierarchy()` → ContextSidebar
- **Estado**: ✅ Funcional

### Paso 5: Filtrar por tipo (Material vs Insumo)
- **Acción**: Tab interno en catálogo filtra por `material_type`
- **Tabla**: `catalog.material_types` (clasificación de la org)
- **Frontend**: `materials-catalog-view.tsx` → filter por `material_type`
- **Estado**: ✅ Funcional

---

## Flujo 2: Recetas y Requerimientos

### Paso 6: Vincular material a receta de tarea
- **Acción**: En el catálogo de tareas → editar receta → agregar material con cantidad y desperdicio
- **Tabla**: `catalog.task_recipe_materials` (cantidad + `waste_percentage` + `total_quantity`)
- **Frontend**: Desde feature de tareas (no desde materiales)
- **Estado**: ✅ Funcional

### Paso 7: Ver requerimientos calculados
- **Acción**: Tab "Necesidades" en página de materiales
- **Qué ve**: Tabla con: material, unidad, total requerido, N° de tareas que lo usan
- **Vista**: `construction.project_material_requirements_view` (calc: `construction_tasks.quantity × task_materials.amount`)
- **Frontend**: `views/materials-requirements-view.tsx` → `queries.ts:getOrgMaterialRequirements()`
- **Estado**: ✅ Funcional

---

## Flujo 3: Procurement (Órdenes de Compra)

### Paso 8: Crear Orden de Compra (PO)
- **Acción**: Tab "Órdenes" → "+ Nueva Orden de Compra"
- **Formulario**: Proyecto, Proveedor, Fecha, Items (con selector de materiales desde necesidades)
- **Tablas**:
  - `finance.material_purchase_orders` → INSERT (cabecera)
  - `finance.material_purchase_order_items` → INSERT (items)
- **Frontend**: `forms/purchase-order-form.tsx` + `forms/requirements-selector.tsx` → `actions.ts:createPurchaseOrder()`
- **Estado**: ✅ Funcional

### Paso 9: Gestionar ciclo de vida de PO
- **Acción**: Cambiar status: `draft` → `sent` → `quoted` → `approved` → `converted`
- **Tabla**: `finance.material_purchase_orders.status` → UPDATE
- **Frontend**: `actions.ts:updatePurchaseOrderStatus()` → botones en vista de detalle
- **Estado**: ✅ Funcional

---

## Flujo 4: Facturas

### Paso 10: Registrar factura del proveedor
- **Acción**: Vincular factura a una PO o crear independiente
- **Tablas**:
  - `finance.material_invoices` → INSERT (cabecera con `purchase_order_id`)
  - `finance.material_invoice_items` → INSERT (items)
- **Vista**: `finance.material_invoices_view`
- **Frontend**: ⚠️ **Backend listo pero NO hay frontend de facturas**
- **Estado**: ⚠️ Parcial (solo backend)

---

## Flujo 5: Pagos de Materiales

### Paso 11: Registrar pago
- **Acción**: Tab "Pagos" → "+ Nuevo Pago"
- **Formulario**: Proyecto, Monto, Moneda, TC, Fecha, Wallet, Factura vinculada, Adjuntos
- **Tablas**:
  - `finance.material_payments` → INSERT
  - `public.media_files` + `public.media_links` → INSERT (si hay adjuntos)
- **Frontend**: `forms/material-payment-form.tsx` → `actions.ts:createMaterialPaymentAction()`
- **Estado**: ✅ Funcional

### Paso 12: Ver pagos con adjuntos
- **Acción**: Lista de pagos con columnas: fecha, monto, wallet, factura, estado, adjuntos
- **Vista**: `finance.material_payments_view` (JOIN con wallets, creators, media)
- **Frontend**: `views/materials-payments-view.tsx` → `queries.ts:getOrgMaterialPayments()`
- **Estado**: ✅ Funcional

---

## Flujo 6: Dashboard Overview

### Paso 13: Ver resumen financiero
- **Acción**: Tab "Overview" → KPIs y gráficos
- **Qué ve**: Total pagado (multi-moneda), últimos pagos, tendencia mensual
- **Frontend**: `views/materials-overview-view.tsx` (client-side con `useMoney().sum()`)
- **Estado**: ✅ Funcional (solo pagos, NO incluye POs ni presupuesto)

---

## Flujo 7: Configuración

### Paso 14: Gestionar Tipos de Material
- **Acción**: Tab "Configuración" → CRUD de tipos/categorías
- **Tabla**: `catalog.material_types` → CRUD
- **Frontend**: `views/materials-settings-view.tsx` → `actions.ts:createMaterialType()`, etc.
- **Estado**: ✅ Funcional

---

## Diagrama completo

```
┌─────────────────────────────────────────────────────────────────┐
│                     CATÁLOGO TÉCNICO                            │
│  materials ← material_categories                                │
│  materials ← material_types                                     │
│  materials ← organization_material_prices                       │
│  materials ← material_prices (histórico)                        │
│           └→ task_recipe_materials (receta)                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   OBRA / PROYECTO                               │
│  construction_tasks × task_recipe_materials                     │
│           = construction_task_material_snapshots                 │
│           → project_material_requirements_view (calc)            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PROCUREMENT                                 │
│  material_purchase_orders ← material_purchase_order_items       │
│           ↓ (status: draft→sent→quoted→approved→converted)      │
│  material_invoices ← material_invoice_items                     │
│           ↓ (vinculada a PO via purchase_order_id)              │
│  material_payments (monto, wallet, adjuntos)                    │
└─────────────────────────────────────────────────────────────────┘
```

## Caso multi-proyecto

María tiene 3 proyectos. La página `/organization/materials` muestra datos **cross-proyecto** (toda la org). Cada proyecto también tiene su propia vista en `/organization/projects/[projectId]` con tab de materiales que filtra por `project_id`.

Los materiales del **catálogo son compartidos** entre proyectos (son de la org), pero los POs, facturas y pagos son **por proyecto**.
