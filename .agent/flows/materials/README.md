# Materiales — Flow Completo

> **Alcance**: Gestión del ciclo de vida completo de materiales de construcción: desde el catálogo técnico hasta el pago a proveedores, pasando por cálculo de necesidades, órdenes de compra y facturación.

## ¿Qué resuelve?

**Escenario**: María es directora de proyectos en una constructora. Tiene 3 obras activas. Para la obra "Torre Mirador", necesita saber:
1. ¿Qué materiales requiere cada tarea de obra? (cemento, hierro, etc.)
2. ¿Cuánto cuesta cada material y a quién comprarlo?
3. ¿Ya pedí lo necesario? ¿Cuánto me falta?
4. ¿Cuánto llevo pagado en materiales vs lo presupuestado?

El módulo de Materiales conecta el **catálogo técnico** (qué materiales existen), con las **recetas de tareas** (cuánto se necesita por tarea), con el **procurement** (POs → facturas → pagos), y con el **dashboard analítico** (KPIs financieros).

## Conceptos clave

| Concepto | Qué es | Tabla |
|----------|--------|-------|
| Material | Item físico del catálogo (cemento, hierro, etc.) | `catalog.materials` |
| Categoría | Agrupación jerárquica de materiales | `catalog.material_categories` |
| Tipo de Material | Clasificación por uso (Material, Insumo) | `catalog.material_types` |
| Precio de Catálogo | Precio base de un material para una org | `catalog.organization_material_prices` |
| Precio Histórico | Registro temporal de cambios de precio | `catalog.material_prices` |
| Receta de Material | Cantidad de material por unidad de tarea | `catalog.task_recipe_materials` |
| Requerimiento | Necesidad calculada: receta × cantidad de tarea de obra | Vista: `construction.project_material_requirements_view` |
| Orden de Compra (PO) | Solicitud formal de materiales a un proveedor | `finance.material_purchase_orders` |
| Item de PO | Línea de detalle de una PO | `finance.material_purchase_order_items` |
| Factura | Documento recibido del proveedor | `finance.material_invoices` |
| Item de Factura | Línea de detalle de factura | `finance.material_invoice_items` |
| Pago de Material | Registro de pago al proveedor | `finance.material_payments` |

## Flujo resumido

```
Catálogo Técnico         Obra/Proyecto          Procurement              Finanzas
─────────────────    ─────────────────    ─────────────────    ─────────────────
                                                              
  materials          construction_tasks   purchase_orders      material_payments
       ↓                    ↓                   ↓                    ↓
  task_recipe_       material_snapshots   purchase_order_      material_payments_
  materials                ↓             items                 view
       ↓             requirements_             ↓
  materials_view     view                material_invoices
                                               ↓
                                         invoice_items
```

## Documentos en esta carpeta

| Archivo | Contenido |
|---------|-----------|
| [README.md](./README.md) | Este archivo — overview y conceptos |
| [user-journey.md](./user-journey.md) | Paso a paso de cada funcionalidad |
| [technical-map.md](./technical-map.md) | Referencia técnica exhaustiva |
| [design-decisions.md](./design-decisions.md) | Decisiones de diseño, edge cases y relaciones |
| [roadmap.md](./roadmap.md) | Estado actual, pendientes y visión competitiva |
