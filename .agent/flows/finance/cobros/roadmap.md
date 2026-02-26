# Roadmap: Cobros (Ingresos de Clientes)

> Estado actual, pendientes y visión competitiva (referencia: Procore, Buildertrend, CoConstruct).

---

## ✅ Completado

| Qué | Detalles |
|-----|----------|
| Modelo de datos completo | 3 tablas core: `client_commitments`, `client_payment_schedule`, `client_payments` |
| Vistas SQL | `client_payments_view`, `client_financial_summary_view`, `contract_summary_view` |
| CRUD de clientes | Crear, editar, eliminar, desactivar/reactivar clientes en proyecto |
| CRUD de roles | Crear, editar, eliminar roles de cliente con reemplazo |
| CRUD de compromisos | Crear, editar, eliminar compromisos con método fijo o por unidad |
| CRUD de cobros | Crear, editar, eliminar pagos con vinculación a compromiso y cuota |
| Integración con ledger | Cobros confirmados generan movimiento en `finance.movements` |
| Vista de KPIs | Dashboard de clientes con total comprometido, cobrado, saldo por cobrar |
| Vista de pagos con DataTable | Listado con filtros, ordenamiento, paginación |
| Vista de compromisos con DataTable | Listado con filtros, ordenamiento |
| Adjuntos en cobros | Files vinculados via `media_links` con signed URLs |
| Portal externo | Cliente ve su estado de cuenta, presupuestos, compromisos |
| Soft delete | Todas las tablas con `is_deleted` + `deleted_at` |
| Multi-moneda | Compromisos, cuotas y cobros con currency independiente |
| Vinculación con presupuestos | `commitment.quote_id` vincula a un contrato |
| Optimistic UI en delete | `useOptimisticList` para eliminación instantánea visual |

---

## ⏳ Pendiente: Corto plazo

### P1: Importación masiva de cobros (ALTA)
- **Descripción**: Permitir importar cobros desde CSV/Excel, con el mismo wizard de 5 pasos del sistema de importación
- **Archivos a crear/modificar**:
  - Nuevo: `src/lib/import/importers/client-payments-importer.ts`
  - Modificar: `clients-payments-view.tsx` → agregar botón "Importar" en toolbar actions
  - Nuevo SQL: Función `importClientPaymentsBatch` (o en action con loop)
- **Referencia**: Ya existe para `material_payments`, `labor_payments`, `subcontract_payments`
- **Prioridad**: 🔴 Alta — Los otros 3 tipos de pago ya lo soportan, cobros es el que falta

### P2: Form de cuotas del cronograma (ALTA)
- **Descripción**: Crear un form dedicado para crear/editar cuotas individuales dentro de un compromiso
- **Archivos a crear**:
  - Nuevo: `src/features/clients/forms/clients-schedule-form.tsx`
  - Nuevo: Registrar en `panel-registry.ts`
  - Modificar: `clients-schedules-view.tsx` → agregar toolbar con "Nueva Cuota"
  - Nuevo action: `createScheduleAction()`, `updateScheduleAction()`, `deleteScheduleAction()`
- **Prioridad**: 🔴 Alta — Sin form, las cuotas no se pueden gestionar

### P3: Generación automática de cuotas (MEDIA)
- **Descripción**: Al crear un compromiso, opcionalmente generar N cuotas iguales con fechas mensuales
- **Archivos a modificar**:
  - `clients-commitment-form.tsx` → agregar toggle "Generar cuotas automáticamente" + inputs (cantidad, frecuencia, fecha inicio)
  - `actions.ts` → `createCommitmentAction()` → insertar cuotas bulk
- **Prioridad**: 🟡 Media — Ahorra tiempo, mejora UX

### P4: Vista de cronograma visual (MEDIA)
- **Descripción**: Mostrar las cuotas de un compromiso en una vista tipo timeline o calendario, con indicador de estado (pagada/pendiente/vencida)
- **Archivos a crear**:
  - Evolucionar `clients-schedules-view.tsx` (actualmente 3.3KB, muy básica)
  - Componente de timeline reutilizable o integrar con calendario existente
- **Prioridad**: 🟡 Media — Mejora mucho la UX de seguimiento

### P5: Alertas de cuotas vencidas (MEDIA)
- **Descripción**: Notificar cuando una cuota con status `pending` supera su `due_date`
- **Archivos a crear**:
  - SQL: Trigger o función cron que cambie status a `overdue`
  - SQL: Insertar en `notifications.notifications` cuando una cuota se vence
  - Frontend: Card o badge en el dashboard de cobros
- **Prioridad**: 🟡 Media — Previene pérdida de ingresos

### P6: Comparación comprometido vs cobrado por moneda funcional (MEDIA)
- **Descripción**: Hoy `client_financial_summary_view` agrupa por `currency_id`, lo que impide comparar compromisos USD con cobros ARS
- **Archivos a modificar**:
  - Vista SQL: Crear `client_financial_summary_functional_view` que normalice a moneda funcional
  - Frontend: Mostrar comparación en moneda funcional como opción
- **Prioridad**: 🟡 Media — Crítico para organizaciones bimonetarias

### P7: Refactorizar forms a Field Factories (BAJA)
- **Descripción**: Los forms de clientes (`clients-form.tsx`, `clients-commitment-form.tsx`, `clients-payment-form.tsx`) usan componentes primitivos. Migrar a Field Factories
- **Archivos a modificar**: Los 3 forms
- **Referencia**: Se hizo con `material-payment-form.tsx` — mismo patrón
- **Prioridad**: 🟠 Baja — Funcional pero no estandarizado

### P8: Exportación de cobros a CSV/Excel (BAJA)
- **Descripción**: Botón para exportar los cobros filtrados a un archivo descargable
- **Archivos a modificar**: `clients-payments-view.tsx`
- **Prioridad**: 🟠 Baja

---

## 🔮 Pendiente: Largo plazo (Visión Procore)

### L1: Schedule of Values (SOV) — Certificate-based billing
- **Qué es**: En sistemas como **Procore**, el flujo de cobros usa un "Schedule of Values" donde cada item de la obra tiene un valor asignado. Los certificados de avance (Pay Applications) permiten cobrar basado en el % de avance de cada item, no en cuotas fijas.
- **Cómo llegar**: Vincular `quote_items` (ya existen) como items del SOV. Crear tabla `client_pay_applications` con % avance por item. Calcular monto a cobrar = Σ(item.value × %avance - cobrado_anteriormente).
- **Impacto**: Sería un game-changer para constructoras grandes.

### L2: Retenciones y garantías
- **Qué es**: En la construcción, es común retener un % de cada cobro (ej: 5%) como garantía de cumplimiento. El monto retenido se libera al final de la obra o tras un período de garantía.
- **Cómo llegar**: Agregar `retention_percentage` al compromiso. Al registrar cobro, separar automáticamente `retention_amount`. Crear tabla `client_retentions` para trackear liberación.

### L3: Certificados de avance (Progress Certificates)
- **Qué es**: Documento formal que certifica el avance de obra y justifica el cobro. En **Procore** se llama "Owner Invoice" o "Payment Application".
- **Cómo llegar**: Crear tabla `progress_certificates` con items, % avance, período, y vinculación al cronograma. Generar PDFs desde templates existentes.

### L4: Recargos por mora / intereses
- **Qué es**: Cuando un cliente paga después de la fecha de vencimiento, se puede aplicar un recargo o interés.
- **Cómo llegar**: Agregar `penalty_rate` al compromiso o cuota. Calcular día de diferencia × tasa. Crear movimiento separado en el ledger.

### L5: Aprobaciones multi-nivel para cobros
- **Qué es**: Requerir aprobación de un gerente o director antes de confirmar un cobro (o crear un certificado de avance).
- **Cómo llegar**: Integrar con sistema de aprobaciones (workflow engine). Agregar status `pending_approval` al cobro.

### L6: Conciliación bancaria automática
- **Qué es**: Vincular cobros registrados en Seencel con movimientos bancarios reales, facilitando la reconciliación.
- **Cómo llegar**: Integración con APIs bancarias (Open Banking) o importación de extractos bancarios.

### L7: Dashboard de cobranza con aging report
- **Qué es**: Vista tipo "Aging Report" que muestra cuotas agrupadas por antigüedad: 0-30 días, 31-60 días, 61-90 días, 90+ días.
- **Cómo llegar**: SQL view que calcule días desde `due_date`. Componente visual con barras apiladas por bucket.

### L8: Integración con facturación electrónica
- **Qué es**: Generar facturas electrónicas (AFIP en Argentina, SAT en México) vinculadas a los cobros.
- **Cómo llegar**: Módulo de facturación con integración a proveedores de facturación electrónica.

---

## 📊 Comparativa competitiva

| Feature | Seencel (hoy) | Procore | Buildertrend | CoConstruct |
|---------|:---:|:---:|:---:|:---:|
| Clientes por proyecto | ✅ | ✅ | ✅ | ✅ |
| Compromisos (contratos) | ✅ | ✅ | ✅ | ✅ |
| Cronograma de cuotas | ⚠️ básico | ✅ SOV | ✅ | ✅ |
| Cobros con comprobante | ✅ | ✅ | ✅ | ✅ |
| Multi-moneda | ✅ | ✅ | ❌ | ❌ |
| SOV / Pay Applications | ❌ | ✅ | ⚠️ | ✅ |
| Retenciones | ❌ | ✅ | ❌ | ⚠️ |
| Certificados de avance | ❌ | ✅ | ⚠️ | ✅ |
| Portal externo | ✅ | ✅ | ✅ | ✅ |
| Importación masiva | ❌ | ✅ | ❌ | ❌ |
| Alertas de vencimiento | ❌ | ✅ | ✅ | ✅ |
| Aging report | ❌ | ✅ | ❌ | ❌ |
| Facturación electrónica | ❌ | ⚠️ | ❌ | ❌ |
| Change Orders | ✅ | ✅ | ✅ | ✅ |
| Recargos por mora | ❌ | ⚠️ | ❌ | ❌ |
| Conciliación bancaria | ❌ | ❌ | ❌ | ❌ |
| Ledger unificado | ✅ | ✅ | ✅ | ⚠️ |
