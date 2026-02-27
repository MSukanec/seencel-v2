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

---

## ⏳ Pendiente: Corto plazo

### ~~P1: Ejecutar SQL de `recipe_name` y símbolo de unidad~~ ✅
**Estado**: Completado — SQL ejecutado, introspección actualizada.

### P2: Migrar vistas de DEFINER a INVOKER
**Prioridad**: 🟡 Media
**Descripción**: `quotes_view`, `quotes_items_view` y `contract_summary_view` son `SECURITY DEFINER`, lo que bypasea RLS. Migrar a `SECURITY INVOKER` requiere asegurar que todas las tablas referenciadas (catalog.tasks, catalog.task_divisions, catalog.units, contacts.contacts, projects.projects) tengan RLS adecuada.
**Archivos afectados**: SQL scripts para migrar vistas + verificar RLS en tablas cross-schema
**Impacto**: Mejora seguridad, evita riesgo de filtración cross-org

### ~~P3: Actualizar FEATURE.md desactualizado~~ ✅
**Estado**: Completado — `FEATURE.md` eliminado por el usuario. Este flow es ahora la fuente de verdad.

### P4: Agregar precio de venta visible
**Prioridad**: 🟡 Media
**Descripción**: Actualmente el usuario ve Costo Unit. + Margen % → Subtotal. Agregar una columna "Precio Venta" = Costo × (1 + Margen%) para que sea más transparente cómo el margen afecta el costo por unidad antes de multiplicar por la cantidad.
**Archivos**: `src/features/quotes/views/quote-base-view.tsx`

### P5: PDF generation review
**Prioridad**: 🟡 Media
**Descripción**: El PDF generation existe pero necesita revisión para asegurar que refleje los nuevos campos (recipe_name, símbolo de unidad, margen).
**Archivos**: Componentes de generación PDF

---

## 🔮 Pendiente: Largo plazo

### L1: Schedule of Values (SOV) — CRÍTICO
**Descripción**: Convertir los `quote_items` de un contrato en un SOV facturable con progress billing. Cada período se actualiza el % completado, materiales almacenados, retención. Requiere extender `quote_items` o crear tabla `quote_sov_lines`.
**Impacto**: Sin SOV, no hay facturación profesional de avance de obra.
**Referencia**: AIA G702/G703, patrón Procore SOV.

### L2: Owner Invoices / Progress Billing — CRÍTICO
**Descripción**: Generar certificados/facturas mensuales basados en el SOV. Tabla `owner_invoices` + `owner_invoice_items`. Workflow: draft → submitted → approved → paid.
**Dependencia**: Requiere L1 (SOV) implementado.

### L3: Retenciones
**Descripción**: Retener un % de cada factura (típico 5-10%). Campo `retention_percent` en contrato, cálculo automático en cada invoice, vista de retenciones acumuladas, liberación al completar.
**Dependencia**: Requiere L2 (Owner Invoices) implementado.

### L4: Versionado real del presupuesto (historial de versiones)
**Prioridad**: 🟡 Media
**Descripción**: El auto-incremento de versión al re-enviar ya fue implementado (Feb 2026). Sin embargo, actualmente no se guarda historial: al volver a borrador y re-enviar, la versión anterior se sobreescribe. El siguiente paso es crear una tabla `quote_versions` (o snapshots JSON) que capture el estado completo del presupuesto + items en cada envío, y una UI de comparación para ver diferencias entre versiones.
**Impacto**: Permite tracking de cambios y negociaciones con el cliente. Crítico para auditoría y transparencia comercial.

### L5: Documentos adjuntos y firma electrónica
**Descripción**: Adjuntar contratos firmados (Supabase Storage). Integración con DocuSign/HelloSign para firma digital.
**Impacto**: Elimina papeles y agiliza el ciclo de contratación.

### L6: Portal de clientes para presupuestos
**Descripción**: Permitir al cliente ver, comentar y aprobar presupuestos desde un portal externo sin necesidad de cuenta Seencel.
**Dependencia**: Requiere sistema de acceso externo (external-access flow).

### L7: Billing Periods
**Descripción**: Definir períodos de facturación mensuales/quincenales con tracking de avance acumulado vs período actual.
**Dependencia**: Requiere L1 (SOV) y L2 (Owner Invoices).
