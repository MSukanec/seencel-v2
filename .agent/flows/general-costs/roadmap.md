# Roadmap: Gastos Generales

> Estado actual + pendientes accionables organizados por prioridad.

---

## ✅ Completado

| Qué | Detalles |
|-----|----------|
| Modelo de datos completo | 4 tablas + allocations + 3 vistas SQL + RLS + triggers de auditoría |
| CRUD de categorías | Categorías org-owned (migradas de `is_system`). Se crean/editan/eliminan desde dropdow "..." en accordion header. Form panel con `FolderOpen`/sm. Soft delete con guard (no permite eliminar si tiene conceptos) |
| CRUD de conceptos | Con recurrencia (interval + expected_day). Vista Accordion agrupada por categoría con stats de pagos. Click navega a Pagos con filtro |
| CRUD de pagos | Con multi-moneda, billetera, concepto, notas, referencia, attachments |
| Dashboard analítico | 4 KPIs (total, promedio, count, **costos fijos mensuales**) + 2 charts (AreaChart + Donut) + insights + actividad reciente. Sin filtro global de período (datos server-side) |
| Column factories | Todas las columnas usan factories: `createDateColumn`, `createEntityColumn`, `createWalletColumn`, `createMoneyColumn`, `createStatusColumn`, `createTextColumn` |
| Filtros avanzados en pagos | 6 facets: Estado, Concepto, Categoría, Billetera, Moneda + Rango de fechas con presets (Hoy, Ayer, Esta semana, etc.) |
| Delete con confirmación | `useTableActions` tanto para conceptos como categorías. Soft delete estándar |
| Export CSV/Excel | Columnas configuradas con transformaciones |
| Soft delete en toda tabla | `is_deleted` + `deleted_at`. RLS SELECT corregida |
| **Forms migrados a Panel** | Los 3 forms usan `openPanel` + `setPanelMeta` + Field Factories |
| **Import masivo de pagos** | `BulkImportModal` con 8 columnas mapeables. Adapter en `src/lib/import/general-costs-import.ts` |
| **Inline editing real** | Server action `updateGeneralCostPaymentField`. Campos editables: fecha, estado, billetera |
| **Conceptos como Accordion** | Vista agrupada por categoría. Stats: cantidad, total gastado, porcentaje. `GeneralCostListItem` con stats |
| **Concept stats** | `getGeneralCostConceptStats()` — total pagos, monto acumulado, último pago, moneda |
| **Navegación Concepto → Pagos** | Click en concepto navega al tab Pagos con filtro client-side |
| **Categorías en header Accordion** | Dropdown "..." en cada header con Editar/Eliminar. Usa `<div role="button">` (no `<Button>`) para evitar hidratación rota |
| **Settings tab limpia** | Tab Ajustes vaciada de categorías |
| **RLS SELECT fix** | Policies SELECT corregidas: removido `is_deleted = false` |
| **Badges de recurrencia** | Estado calculado (Al día / Pendiente / Vencido) en `GeneralCostListItem` con badge+tooltip basado en `last_payment_date`, `recurrence_interval`, `expected_day` |
| **Date presets en FilterPopover** | Sidebar con presets rápidos (Hoy, Ayer, Esta/Última semana/mes/año, Todo) en el sub-panel de fechas. Componente global reutilizable |
| **Performance optimizada** | `handleInlineUpdate` con `useCallback`, `columns` con `useMemo`, `useEffect` dependency fix. Eliminó re-renders en cascada al filtrar |
| **Dashboard chart fix** | AreaChart ya no desborda la card. `height={260}` explícito, `contentClassName="p-4"` para padding uniforme, `YAxis width={55}`, `margin.right=0` (card padding maneja spacing) |
| **Cards restructuradas** | `src/components/cards/` reorganizado: `base/` (card-base, sparkline) + `presets/` (metric, chart, list, info, insight). Barrel `index.ts` sin cambios en API pública |
| **KPI Gasto Total fix** | Removido `items` del MetricCard que overrideaba el `amount` correcto con la suma de 10 pagos recientes |
| **Monto esperado en recurrentes** | `expected_amount` + `expected_currency_id` en `general_costs`. AmountField + CurrencyField en form de concepto (visibles solo si `is_recurring`). KPI "Costos Fijos Mensuales" reemplaza "Concentración del Gasto" en dashboard. ListItem muestra monto en badge: "Mensual · día 10 · $160.000". Vista SQL actualizada con campos nuevos |

---

## ⏳ Pendiente: Corto plazo (Prioridad Alta)

_No hay items de corto plazo pendientes._

---

## ⏳ Pendiente: Medio plazo (Funcionalidad competitiva)

### P2: UI de Allocations (distribuir gastos a proyectos)
- **Prioridad**: 🟡 Media — ⏸️ En pausa (usuario decidió postergarlo)
- **Descripción**: Tabla `general_cost_payment_allocations` existe pero no hay UI. Permite distribuir un gasto entre proyectos por %. Competidores como Procore y PlanGrid lo ofrecen.
- **Implementación**: 
  - Sección expandible en form de pago con lista de proyectos + slider de %
  - Server actions: `createAllocation()`, `updateAllocation()`, `deleteAllocation()`
  - Dashboard debería mostrar "gasto asignado a proyectos vs no asignado"

### P3: Alertas de recurrencia y pagos vencidos
- **Prioridad**: 🟡 Media → ⚠️ Fase 1 completada
- **Fase 1 (completada)**: Badges visuales en `GeneralCostListItem` — calcula estado (Al día/Pendiente/Vencido) basado en `last_payment_date` + `recurrence_interval` + `expected_day`. Tooltip con detalle.
- **Fase 2 (pendiente)**: Notificaciones push/in-app. Trigger SQL en `general_costs_payments` que llame `send_notification()` cuando un pago recurrente esté vencido. Widget en Dashboard "Pagos pendientes este mes".

### P4: Vista de detalle de concepto
- **Prioridad**: 🟢 Baja
- **Descripción**: Abrir un panel de detalle con historial de pagos, totales acumulados y gráfico de evolución.
- **Nota**: Click en concepto ya navega al tab Pagos con filtro. Este P4 sería un panel lateral con info más rica.
- **Implementación**: Panel con tabs: Resumen, Pagos, Gráfico

---

## 🔮 Pendiente: Largo plazo (Evolución)

### F1: Presupuesto de gastos generales
- **Concepto**: Definir un presupuesto mensual/anual por categoría y comparar vs gasto real
- **Impacto**: Permite control proactivo de overhead. Dashboard mostraría "% del presupuesto consumido"
- **Requiere**: Nueva tabla `general_cost_budgets` con `category_id`, `period`, `amount`

### F2: Automatización de pagos recurrentes
- **Concepto**: Auto-generar pagos pendientes al inicio de cada mes basándose en conceptos recurrentes
- **Impacto**: Reduce trabajo manual. El usuario solo confirma en vez de crear desde cero
- **Requiere**: Cron job o edge function que corra mensualmente

### F3: Integración con proveedores/contactos
- **Concepto**: Vincular gastos a proveedores (ej: "Fibertel" como contacto → gasto "Internet")
- **Impacto**: Permite análisis por proveedor y tracking de pagos a terceros
- **Requiere**: FK `provider_id → contacts.id` en `general_costs`

### F4: Comprobantes y OCR
- **Concepto**: Adjuntar comprobantes de pago y extraer datos automáticamente (monto, fecha, proveedor)
- **Impacto**: Acelera el registro. El usuario solo sube la foto/PDF y confirma datos.
- **Requiere**: Integración con servicio OCR + almacenamiento de archivos (ya hay attachments parcial)

### F5: Reportes contables exportables
- **Concepto**: Generar reportes con formato contable (IVA discriminado, libro de compras) para presentar al contador
- **Impacto**: Reduce trabajo manual de exportación
- **Requiere**: Templates de exportación con campos contables adicionales

---

## Comparativa Competitiva

| Funcionalidad | Seencel | Procore | CoConstruct | Buildertrend |
|--------------|---------|---------|-------------|-------------|
| CRUD de gastos generales | ✅ | ✅ | ✅ | ✅ |
| Categorías org-owned | ✅ | ✅ (multi-nivel) | ⚠️ | ✅ |
| Recurrencia | ⚠️ Badges visuales (Fase 1) | ✅ Automatizada | ✅ Automatizada | ✅ |
| Allocations a proyectos | 🚧 DB only | ✅ | ✅ | ✅ |
| Presupuesto de overhead | 🚧 No existe | ✅ | ✅ | ✅ |
| Import masivo | ✅ CSV/Excel | ✅ + Banco | ⚠️ | ✅ |
| Dashboard analítico | ✅ | ✅ | ⚠️ | ✅ |
| Alertas de vencimiento | ⚠️ Badges (notif pendiente) | ✅ | ✅ | ✅ |
| Filtros avanzados | ✅ 6 facets + presets | ✅ | ⚠️ | ✅ |
| Multi-moneda | ✅ | ⚠️ | ❌ | ❌ |
| Insights automáticos | ✅ | ❌ | ❌ | ❌ |
| Forms con Panel | ✅ | ✅ | ✅ | ✅ |

**Ventajas competitivas de Seencel**: Multi-moneda nativa + Insights automáticos + Import masivo con resolución FK.
**Gaps principales**: Allocations sin UI, recurrencia no automatizada, sin presupuesto de overhead.
