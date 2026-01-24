# Feature: Materials - Documentación Completa

> Última actualización: 2026-01-24

Este documento contiene la auditoría, roadmap y checklist del feature de Materiales.

---

## 📊 Estado Actual vs Competidores

### Comparativa con Procore / Buildertrend

| Feature | Procore | Buildertrend | Seencel | Estado |
|---------|---------|--------------|---------|--------|
| Catálogo de materiales | ✅ | ✅ | ✅ | Completo |
| Cálculo de necesidades | ✅ | ✅ | ✅ | Completo |
| Snapshot de recetas | ✅ | ✅ | ✅ | Completo |
| Pagos de materiales | ✅ | ✅ | ✅ | Completo |
| Multi-moneda | ✅ | ✅ | ✅ | Completo |
| **Purchase Orders (POs)** | ✅ | ✅ | ✅ | Implementado |
| **Facturas/Invoices** | ✅ | ✅ | ⚠️ | Backend listo, falta frontend |
| **Vínculo PO ↔ Invoice** | ✅ | ✅ | ✅ | Implementado |
| Dashboard Overview | ✅ | ✅ | ❌ | Vista vacía |
| Inventario real-time | ✅ | ✅ | ❌ | No implementado |
| Recepción de materiales | ✅ | ✅ | ❌ | No implementado |
| 3-way match | ✅ | ✅ | ❌ | No implementado |
| QR/RFID tracking | ✅ | ⚠️ | ❌ | No implementado |
| AI insights | ✅ | ❌ | ❌ | Futuro |

---

## 🗄️ Estructura de Base de Datos

### Tablas Principales

| Tabla | Propósito | Estado |
|-------|-----------|--------|
| `materials` | Catálogo de materiales | ✅ |
| `material_categories` | Categorías jerárquicas | ✅ |
| `task_materials` | Receta técnica (viva) | ✅ |
| `construction_task_material_snapshots` | Snapshot congelado | ✅ |
| `material_purchase_orders` | Órdenes de compra | ✅ |
| `material_purchase_order_items` | Items de PO | ✅ |
| `material_invoices` | Facturas/recibos | ✅ |
| `material_invoice_items` | Items de factura | ✅ |
| `material_payments` | Pagos realizados | ✅ |
| `material_inventory` | Stock por ubicación | ❌ Pendiente |
| `material_receipts` | Recepciones | ❌ Pendiente |

### Vistas

| Vista | Propósito | Estado |
|-------|-----------|--------|
| `project_material_requirements_view` | Necesidades desde snapshots | ✅ |
| `material_purchase_orders_view` | POs con proveedor/proyecto | ✅ |
| `material_invoices_view` | Facturas con PO vinculado | ✅ |

---

## 📁 Estructura de Archivos

```
src/features/materials/
├── actions.ts           # Server actions (CRUD)
├── queries.ts           # Queries de lectura
├── types.ts             # Types y schemas
├── FEATURE.md           # Este archivo
├── components/
│   ├── forms/
│   │   ├── material-form.tsx
│   │   ├── material-payment-form.tsx
│   │   ├── purchase-order-form.tsx     # ✅ Con selector de necesidades
│   │   └── requirements-selector.tsx   # ✅ NUEVO - Selector de materiales
│   └── tables/
│       ├── material-payments-columns.tsx
│       ├── material-payments-data-table.tsx
│       ├── purchase-orders-columns.tsx  # ✅ NUEVO
│       └── purchase-orders-data-table.tsx # ✅ NUEVO
└── views/
    ├── index.ts
    ├── materials-page-view.tsx      # Layout con tabs
    ├── materials-overview-view.tsx  # ❌ VACÍO
    ├── materials-requirements-view.tsx  # ✅ Funcional
    ├── materials-orders-view.tsx    # ✅ IMPLEMENTADO
    ├── materials-payments-view.tsx  # ✅ Funcional
    ├── materials-settings-view.tsx  # ❌ VACÍO
    ├── material-catalog-view.tsx    # ✅ Catálogo org
    └── materials-catalog-view.tsx   # ✅ Catálogo admin
```

---

## ✅ TODO / Checklist

### Fase 1: Órdenes de Compra (Frontend)
- [x] Crear `components/forms/purchase-order-form.tsx`
- [x] Crear `components/tables/purchase-orders-columns.tsx`
- [x] Crear `components/tables/purchase-orders-data-table.tsx`
- [x] Implementar `views/materials-orders-view.tsx`
- [x] Actions: `createPurchaseOrder`, `updatePurchaseOrder`, `updatePurchaseOrderStatus`, `deletePurchaseOrder`
- [x] Queries: `getPurchaseOrders`, `getPurchaseOrderById`, `getProvidersForProject`

### Fase 2: Facturas/Recibos (Frontend)
- [ ] Crear `components/forms/invoice-form.tsx`
- [ ] Vista de facturas con vínculo a PO
- [ ] Actions: `createInvoice`, `updateInvoice`
- [ ] Queries: `getInvoices`, `getInvoiceById`

### Fase 3: Dashboard Overview
- [ ] Implementar `views/materials-overview-view.tsx`
- [ ] KPI: Total presupuestado
- [ ] KPI: Total ordenado (POs)
- [ ] KPI: Total pagado
- [ ] Gráfico: Gastos por categoría
- [ ] Lista: Últimas órdenes
- [ ] Lista: Pendientes de entrega

### Fase 4: Inventario
- [ ] Crear tabla `material_inventory`
- [ ] Crear tabla `material_receipts`
- [ ] Trigger: Actualizar inventario al recibir
- [ ] Vista de stock por proyecto
- [ ] Alertas de stock bajo

### Fase 5: Settings
- [ ] Implementar `views/materials-settings-view.tsx`
- [ ] Configuración de categorías
- [ ] Configuración de proveedores preferidos
- [ ] Umbrales de alerta

### Fase 6: Extras (Futuro)
- [ ] 3-way match: PO ↔ Receipt ↔ Invoice
- [ ] QR codes para materiales
- [ ] Takeoffs (mediciones desde planos)
- [ ] AI insights

---

## 🔧 Migraciones Aplicadas

| Fecha | Archivo | Descripción |
|-------|---------|-------------|
| 2026-01-24 | `20260124_construction_task_material_snapshots.sql` | Sistema de snapshots |
| 2026-01-24 | `20260124_fix_material_purchase_system.sql` | Corrección PO/Invoice |

---

## 📝 Notas de Arquitectura

### Snapshot Pattern
Los materiales de obra se "congelan" al crear `construction_tasks`:
- Cambios en `task_materials` NO afectan obras existentes
- Ver skill: `.agent/skills/obra-snapshot-pattern/SKILL.md`

### Precios vs Cantidades
- **Snapshots** guardan CANTIDADES, no precios
- **Precios presupuestados**: `quote_items.unit_price`
- **Precios reales**: `material_payments.amount`

### Flujo de Compras
```
Purchase Order (PO)     →    Invoice/Factura    →    Payment/Pago
(lo que PIDO)                (lo que RECIBO)         (lo que PAGO)
```
