# Roadmap: Gastos Generales

> Estado actual + pendientes accionables organizados por prioridad.

---

## ✅ Completado

| Qué | Detalles |
|-----|----------|
| Modelo de datos completo | 4 tablas + allocations + 3 vistas SQL + RLS + triggers de auditoría |
| CRUD de categorías | Con protección de categorías `is_system`, usando `SettingsSection` + `CategoryListItem` |
| CRUD de conceptos | Con recurrencia (interval + expected_day), DataTable con column factories |
| CRUD de pagos | Con multi-moneda, billetera, concepto, notas, referencia, attachments |
| Dashboard analítico | 4 KPIs (total, promedio, count, concentración) + 2 charts + insights + actividad reciente |
| Column factories | Todas las columnas usan factories: `createDateColumn`, `createEntityColumn`, `createWalletColumn`, `createMoneyColumn`, `createStatusColumn`, `createTextColumn` |
| Filtros en tabla de pagos | Filtro por estado (facet), rango de fechas, búsqueda por texto |
| Delete con confirmación | `useTableActions` con bulk delete y dialog de confirmación |
| Export CSV/Excel | Columnas configuradas con transformaciones |
| Soft delete en toda tabla | `is_deleted` + `deleted_at` con filtros automáticos |
| Settings view refactoreada | Usa `SettingsSection` + `CategoryListItem` en vez de DataTable |
| **Forms migrados a Panel** | Los 3 forms usan `openPanel` + `setPanelMeta` + Field Factories (categoría=FolderOpen/sm, concepto=FileText/md, pago=Receipt/lg) |
| **Import masivo de pagos** | `BulkImportModal` con 8 columnas mapeables (fecha, concepto FK, monto, moneda FK, billetera FK, cotización, notas, referencia). Adapter en `src/lib/import/general-costs-import.ts` |
| **Inline editing real** | Server action `updateGeneralCostPaymentField` con resolución wallet_name→wallet_id. Campos editables: fecha, estado, billetera |

---

## ⏳ Pendiente: Corto plazo (Prioridad Alta)

_No hay items de corto plazo pendientes._

---

## ⏳ Pendiente: Medio plazo (Funcionalidad competitiva)

### P2: UI de Allocations (distribuir gastos a proyectos)
- **Prioridad**: 🟡 Media
- **Descripción**: Tabla `general_cost_payment_allocations` existe pero no hay UI. Permite distribuir un gasto entre proyectos por %. Competidores como Procore y PlanGrid lo ofrecen.
- **Implementación**: 
  - Sección expandible en form de pago con lista de proyectos + slider de %
  - Server actions: `createAllocation()`, `updateAllocation()`, `deleteAllocation()`
  - Dashboard debería mostrar "gasto asignado a proyectos vs no asignado"

### P3: Alertas de recurrencia y pagos vencidos
- **Prioridad**: 🟡 Media
- **Descripción**: Los campos `is_recurring`, `recurrence_interval`, `expected_day` son informativos. No hay alertas si un pago recurrente no se registró a tiempo.
- **Implementación**:
  - Widget en Dashboard: "Pagos recurrentes pendientes este mes"
  - Badge en tabla de conceptos: "Último pago: hace X días" vs "Esperado: día 15"
  - Notificación push (integrar con sistema de notificaciones existente)

### P4: Vista de detalle de concepto
- **Prioridad**: 🟢 Baja
- **Descripción**: Hacer click en un concepto debería abrir un panel de detalle con historial de pagos, totales acumulados, y gráfico de evolución.
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
| Categorías con hierarchy | ✅ (1 nivel) | ✅ (multi-nivel) | ⚠️ | ✅ |
| Recurrencia | ⚠️ Informativa | ✅ Automatizada | ✅ Automatizada | ✅ |
| Allocations a proyectos | 🚧 DB only | ✅ | ✅ | ✅ |
| Presupuesto de overhead | 🚧 No existe | ✅ | ✅ | ✅ |
| Import masivo | ✅ CSV/Excel | ✅ + Banco | ⚠️ | ✅ |
| Dashboard analítico | ✅ | ✅ | ⚠️ | ✅ |
| Alertas de vencimiento | 🚧 No existe | ✅ | ✅ | ✅ |
| Comprobantes/OCR | ⚠️ Attachments basic | ✅ OCR | ⚠️ | ✅ |
| Multi-moneda | ✅ | ⚠️ | ❌ | ❌ |
| Insights automáticos | ✅ | ❌ | ❌ | ❌ |
| Forms con Panel | ✅ | ✅ | ✅ | ✅ |

**Ventajas competitivas de Seencel**: Multi-moneda nativa + Insights automáticos + Import masivo con resolución FK.
**Gaps principales**: Allocations sin UI, recurrencia no automatizada, sin presupuesto de overhead.
