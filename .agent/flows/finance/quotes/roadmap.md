# Roadmap: Presupuestos, Contratos y Adicionales

> Estado actual y pendientes accionables.

---

## ✅ Completado

| Feature | Detalles |
|---------|----------|
| **CRUD de Quotes** | Crear, editar, eliminar (soft delete) presupuestos |
| **Tipos: quote/contract/change_order** | Discriminador `quote_type` en tabla unificada |
| **Estados: draft/sent/approved/rejected** | Lifecycle completo con transiciones |
| **Multi-moneda** | `currency_id` + `exchange_rate` por quote |
| **Items desde catálogo** | `task_id` + `recipe_id` → costos vivos del catálogo |
| **Cost Scope por item** | `materials_and_labor` / `labor_only` con inline toggle |
| **Inline editing** | Cantidad, Margen %, Alcance editables inline con `InlineEditableCell` (borde dashed) |
| **Optimistic updates** | `useOptimisticList` para recálculo instantáneo de subtotales, KPIs, incidencia |
| **Tabla profesional** | Orden: Nro → Tarea → Alcance → Cant. → Ud. → Costo Unit. → Margen → Subtotal → Inc. % |
| **Grouping por rubro** | Items agrupados por división con subtotal e incidencia por grupo |
| **Snapshot de costos** | `effective_unit_price` dual: live (draft) / snapshot (sent/approved) |
| **Aprobación atómica** | RPC `approve_quote_and_create_tasks`: crea tareas de obra + marca approved |
| **Conversión Quote → Contract** | `convertQuoteToContract()` con congelamiento de `original_contract_value` |
| **Conversión Quote → Proyecto** | `convertQuoteToProject()` para quotes standalone |
| **Change Orders vinculados** | `parent_quote_id` + `change_order_number` secuencial |
| **Contract Summary View** | `revised_contract_value` = original + approved, `potential = original + approved + pending` |
| **Generación de Compromisos** | Cuotas de pago con adelanto + saldo |
| **Duplicar presupuesto** | Copia quote + todos los items |
| **Descuento global + IVA** | `discount_pct` y `tax_pct` aplicados en cascada |
| **Edición de términos** | Nombre, descripción, IVA, descuento, TC, cliente, proyecto editables inline |
| **Vista Recursos** *(Feb 2026)* | Tab "Recursos" con desglose de materiales, mano de obra y servicios externos desde recetas |
| **Bloqueo de Items en estados no-draft** *(Feb 2026)* | Botones, acciones de fila e inline editing bloqueados cuando `status !== 'draft'` |
| **Banner de documento bloqueado** *(Feb 2026)* | Alerta visible en tabs Resumen e Items cuando el presupuesto está bloqueado |
| **Fix approve_quote project_id** *(Feb 2026)* | Corregido uso de `v_quote.project_id` en función SQL (antes usaba `qi.project_id` nullable) |
| **Fix tasks default en QuoteItemForm** *(Feb 2026)* | Guard defensivo `tasks = []` para evitar crash en `filter` |

---

## ⏳ Pendiente: Corto plazo

### P1: Exportar a Excel en vista lista
**Prioridad**: 🟢 Baja
**Descripción**: El botón "Exportar" en la lista de presupuestos dice "Próximamente". Ya tenemos la infra de Excel instalada.
**Archivos**: `quotes-list-view.tsx`

### P2: Agregar precio de venta visible
**Prioridad**: 🟡 Media
**Descripción**: Agregar columna "Precio Venta" = Costo × (1 + Margen%) para transparencia.
**Archivos**: `quote-base-view.tsx`

### P3: PDF generation review
**Prioridad**: 🟡 Media
**Descripción**: Revisar que el PDF refleje campos actuales (recipe_name, símbolo unidad, margen, recursos).
**Archivos**: Componentes de generación PDF

### P4: Revisión completa de página (/review-page)
**Prioridad**: 🟡 Media
**Descripción**: Ejecutar checklist de página completo (metadata, error handling, empty states, toolbar, etc.)
**Archivos**: Todos los archivos del feature

---

## 🔮 Pendiente: Largo plazo

### L1: Schedule of Values (SOV) — CRÍTICO
**Descripción**: Convertir `quote_items` de un contrato en SOV facturable con progress billing.
**Impacto**: Sin SOV, no hay facturación profesional de avance de obra.

### L2: Owner Invoices / Progress Billing — CRÍTICO
**Descripción**: Certificados/facturas mensuales basados en SOV.
**Dependencia**: L1

### L3: Retenciones
**Descripción**: Retener % de cada factura, liberar al completar.
**Dependencia**: L2

### L4: Versionado real del presupuesto
**Descripción**: Historial de versiones con comparación. Tabla `quote_versions` o snapshots JSON.

### L5: Documentos adjuntos y firma electrónica
**Descripción**: Adjuntar contratos firmados. Integración DocuSign/HelloSign.

### L6: Portal de clientes para presupuestos
**Descripción**: Portal externo sin cuenta Seencel.

### L7: Billing Periods
**Descripción**: Períodos de facturación con tracking acumulado.
**Dependencia**: L1, L2
