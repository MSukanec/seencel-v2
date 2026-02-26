# Roadmap: Materiales — Nivel Internacional

> Objetivo: llevar el módulo de Materiales al nivel de Procore/Buildertrend.
> Organizado por FASES, cada fase se trabaja vista por vista.

---

## Estado Actual vs Competencia

| Feature | Procore | Buildertrend | Seencel Hoy | Target |
|---------|---------|--------------|-------------|--------|
| Catálogo de materiales | ✅ | ✅ | ✅ | — |
| Categorías jerárquicas | ✅ | ✅ | ✅ | — |
| Importación masiva | ✅ | ✅ | ✅ | — |
| Precios multi-moneda | ✅ | ✅ | ✅ | — |
| Cálculo de necesidades | ✅ | ✅ | ⚠️ vista rudimentaria | DataTable profesional |
| Purchase Orders | ✅ | ✅ | ⚠️ funcional pero crudo | Detalle, export, aprobación |
| PO → PDF/Email | ✅ | ✅ | ❌ | Fase 3 |
| Facturas | ✅ | ✅ | ❌ frontend | Fase 2 |
| Pagos de materiales | ✅ | ✅ | ✅ funcional | Pulir UX |
| Dashboard analítico | ✅ | ✅ | ⚠️ solo pagos | KPIs cruzados |
| Columna Proyecto (sin filtro) | ✅ | ✅ | ❌ ninguna vista | Todas las vistas |
| Exportación CSV/Excel | ✅ | ✅ | ❌ | Fase 3 |
| Recepciones de material | ✅ | ✅ | ❌ | Fase 4 |
| 3-Way Match | ✅ | ⚠️ | ❌ | Fase 4 |

---

## FASE 1: Pulir Vistas Existentes (Sprint actual)

> Principio: cada vista debe estar a nivel profesional antes de agregar features nuevos.

### 1.1 — Tab "Necesidades" (Refactoring completo)

**Estado actual**: Cards con poca info, 100% read-only, sin acciones.

| Cambio | Tipo | Detalle |
|--------|------|---------|
| Cambiar de Cards a DataTable | 🔴 Crítico | Columnas: Material, Categoría, Unidad, Requerido, Tareas Origen |
| Agregar columna "Proyecto" | 🔴 Crítico | Visible solo cuando no hay filtro de proyecto activo (`!activeProjectId`) |
| Agregar costo estimado | 🟡 Media | `total_required × precio_catálogo`. Requiere JOIN con `organization_material_prices` o traer precios al frontend |
| Agregar acción "Crear Orden de Compra" | 🟡 Media | Botón en toolbar que abre form de PO pre-llenada con materiales filtrados/seleccionados |
| Selección múltiple → Crear PO | 🟡 Media | Checkbox en DataTable → "Crear PO con N materiales seleccionados" |
| Filtro facetado por Categoría | 🟢 Baja | Filtro lateral o faceted filter en la DataTable |
| KPIs mejorados | 🟢 Baja | Agregar: Costo Estimado Total, mantener Materiales/Tareas/Categorías |
| Empty state contextual | 🟢 Baja | Diferenciar "sin tareas con materiales" vs "este proyecto no tiene materiales" |

**Archivos a modificar**:
- `views/materials-requirements-view.tsx` — Refactoring completo
- `queries.ts` — Posiblemente agregar precio estimado al query o traer precios por separado
- DB: posiblemente enriquecer la vista SQL con precio de catálogo

---

### 1.2 — Tab "Órdenes de Compra" (Mejoras)

**Estado actual**: DataTable funcional pero con UX limitada.

| Cambio | Tipo | Detalle |
|--------|------|---------|
| Agregar columna "Proyecto" | 🔴 Crítico | Visible cuando `!activeProjectId` |
| Mejorar acciones de fila | 🟡 Media | Hoy el dropdown es custom. Estandarizar con `onEdit`/`onDelete` de DataTable |
| Vista de detalle de PO | 🟡 Media | Al hacer click en una PO, mostrar modal/panel con items, totales, historial de status |
| Indicador visual de urgencia | 🟢 Baja | Semáforo por `expected_delivery_date` vs hoy |
| KPIs de POs | 🟢 Baja | Total en POs pendientes, POs aprobadas, POs vencidas |

**Archivos a modificar**:
- `views/materials-orders-view.tsx`
- `types.ts` — Agregar campos si faltan

---

### 1.3 — Tab "Pagos" (Mejoras)

**Estado actual**: Lo más completo. DataTable con KPIs, multi-moneda, optimistic UI.

| Cambio | Tipo | Detalle |
|--------|------|---------|
| Agregar columna "Proyecto" | 🔴 Crítico | Visible cuando `!activeProjectId` |
| Vincular al proveedor de contactos | 🟢 Baja | Click en proveedor → navegar a contacto |
| Drill-down en tipo de material | 🟢 Baja | Filtro rápido por tipo desde el badge |

**Archivos a modificar**:
- `views/materials-payments-view.tsx`

---

### 1.4 — Tab "Visión General" (Enriquecer)

**Estado actual**: Solo KPIs y charts de pagos. Dashboard pobre.

| Cambio | Tipo | Detalle |
|--------|------|---------|
| Agregar KPI: Total en POs pendientes | 🔴 Crítico | Requiere pasar datos de POs al Overview |
| Agregar KPI: Materiales sin cobertura | 🟡 Media | Necesidades sin PO asociada |
| Widget: POs próximas a vencer | 🟡 Media | Tabla compacta con POs por `expected_delivery_date` |
| Widget: Top 5 materiales por gasto | 🟡 Media | Chart o lista compacta |
| Mejorar el chart de evolución | 🟢 Baja | Agregar línea de POs encima de la de pagos |

**Archivos a modificar**:
- `views/materials-overview-view.tsx`
- `page.tsx` — Pasar más datos al Overview (POs, requirements)

---

### 1.5 — Tab "Catálogo" (Mantenimiento menor)

**Estado actual**: Sólido. CRUD, import, categorías, sidebar.

| Cambio | Tipo | Detalle |
|--------|------|---------|
| Indicador de "precio vencido" | 🟢 Baja | Si `valid_to` ya pasó, mostrar alerta visual |
| Contador de "usado en N recetas" | 🟢 Baja | Info útil para el usuario |

---

### 1.6 — Tab "Ajustes" (Sin cambios)

**Estado actual**: Completo. CRUD de Material Types.

No requiere cambios en esta fase.

---

## FASE 2: Features Faltantes (Sprints siguientes)

### 2.1 — Tab "Facturas" (NUEVO)

**Backend ya existe** (`finance.material_invoices`, `material_invoices_view`).

| Ítem | Detalle |
|------|---------|
| Ubicación | Tab nuevo entre "Órdenes de Compra" y "Pagos" |
| Componentes a crear | `invoice-form.tsx`, agregar vista a page.tsx |
| Campos del form | Proveedor, Nº factura, Tipo doc, Fecha, Items (material + cantidad + precio), PO vinculada |
| Columnas DataTable | Fecha, Nº Factura, Proveedor, PO vinculada, Total, Estado |
| Tipos a agregar | `Invoice`, `InvoiceView`, `InvoiceItem` |
| Queries a crear | `getInvoices()`, `getInvoiceById()` |
| Actions a crear | `createInvoice()`, `updateInvoice()`, `deleteInvoice()` |

---

### 2.2 — Aprobación de PO por roles

**Hoy**: Cualquier miembro cambia el status de una PO.
**Target**: Solo roles con permiso `manage_purchase_orders` pueden aprobar.

| Ítem | Detalle |
|------|---------|
| DB | Validación en `updatePurchaseOrderStatus()` vía RLS o función SQL |
| Frontend | Mostrar/ocultar botones de status según permisos del usuario |

---

## FASE 3: Profesionalización (Sprint +2)

### 3.1 — Export de PO a PDF

| Ítem | Detalle |
|------|---------|
| Librería | `@react-pdf/renderer` o HTML→PDF server-side |
| Template | Header org, detalle de items, totales, T&C |
| Botón | "Descargar PDF" y "Enviar por email" en detalle de PO |

### 3.2 — Exportación de datos

| Vista | Formato |
|-------|---------|
| Catálogo | CSV / Excel |
| Necesidades | CSV / Excel |
| Pagos | CSV / Excel |
| Órdenes | CSV / Excel |

### 3.3 — Vista de detalle de PO

| Ítem | Detalle |
|------|---------|
| Tipo | Panel lateral o modal grande |
| Muestra | Items con cantidades y precios, status timeline, facturas vinculadas, pagos asociados |
| Acciones | Cambiar status, agregar items, vincular factura |

---

## FASE 4: Diferenciación (v3+)

### 4.1 — Recepciones de Material
- Registrar llegada de materiales a obra
- Comparar recibido vs ordenado
- Tablas: `material_receipts` + `material_receipt_items`

### 4.2 — 3-Way Match (PO ↔ Recepción ↔ Factura)
- Dashboard de discrepancias con alertas
- Feature premium que Buildertrend no tiene completo

### 4.3 — Inventario básico por proyecto
- Stock por ubicación/proyecto
- Alertas de bajo inventario
- Depende de Recepciones

### 4.4 — AI Insights
- Predicción de necesidades
- Sugerencia de proveedor óptimo
- Detección de precios anómalos

### 4.5 — Portal de Proveedor
- Proveedores ven sus POs y confirman precios
- Upload de facturas directo

---

## Orden de ejecución recomendado

```
AHORA   → 1.1  Necesidades (refactoring a DataTable)
        → 1.2  Órdenes de Compra (columna proyecto + detalle)
        → 1.3  Pagos (columna proyecto)
        → 1.4  Overview (KPIs cruzados)
SPRINT 2→ 2.1  Tab Facturas (nuevo)
        → 2.2  Aprobación PO por roles
SPRINT 3→ 3.1  Export PDF de PO
        → 3.2  Export CSV/Excel todas las vistas
        → 3.3  Vista detalle de PO
FUTURO  → 4.x  Recepciones, 3-Way Match, Inventario, AI
```

---

## Progreso

| Vista / Feature | Estado | Última actualización |
|----------------|--------|---------------------|
| Necesidades (1.1) | ⏳ Pendiente | — |
| Órdenes de Compra (1.2) | ⏳ Pendiente | — |
| Pagos (1.3) | ⏳ Pendiente | — |
| Overview (1.4) | ⏳ Pendiente | — |
| Catálogo (1.5) | ⏳ Pendiente | — |
| Tab Facturas (2.1) | ⏳ Pendiente | — |
| Aprobación PO (2.2) | ⏳ Pendiente | — |
| Filtro por proyecto activo | ✅ Completo | Feb 25, 2026 |
