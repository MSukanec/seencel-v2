# Design Decisions: Cobros (Ingresos de Clientes)

> Decisiones de diseño, alternativas descartadas, edge cases y relaciones con otros flows.

---

## Decisiones de Diseño

### D1: Cliente es un vínculo proyecto-contacto, no una entidad independiente

- **Elegimos**: `project_clients` vincula un `contact_id` con un `project_id`. Un mismo contacto puede ser cliente en múltiples proyectos.
- **Alternativa descartada**: Crear una tabla `clients` independiente con datos propios.
- **Razón**: Los contactos ya centralizan la info de personas/empresas. El "cliente" es un *rol* dentro de un proyecto, no una entidad diferente. Esto evita duplicar datos (nombre, email, teléfono) y permite que un contacto sea proveedor en un proyecto y cliente en otro.

### D2: Compromisos multi-método (fijo vs por unidad)

- **Elegimos**: El campo `commitment_method` con enum `'fixed'` | `'per_unit'` permite modelar tanto contratos por monto fijo como contratos por medición (precio × cantidad).
- **Alternativa descartada**: Dos tablas distintas para compromisos fijos y compromisos por unidad.
- **Razón**: La mayoría de campos son compartidos. El `commitment_method` solo afecta cómo se interpreta el monto y si se muestran `unit_name`/`concept`. El enfoque columnar es más simple.

### D3: Vinculación opcional entre pagos, compromisos y cuotas

- **Elegimos**: `client_payments.commitment_id` y `client_payments.schedule_id` son opcionales (nullable). Un cobro puede existir sin compromiso ni cuota.
- **Alternativa descartada**: Forzar siempre la vinculación cobro→compromiso→cuota.
- **Razón**: En la realidad, muchos clientes pagan "a cuenta" sin un cronograma formal. Forzar la vinculación obligaría a crear compromisos artificiales. La flexibilidad permite desde clientes informales hasta clientes con cronogramas formales tipo SOV.

### D4: Cobros crean movimientos en el ledger unificado

- **Elegimos**: Al crear un cobro confirmado, la `createPaymentAction` inserta también un registro en `finance.movements` con amount positivo (ingreso).
- **Alternativa descartada**: Calcular ingresos on-the-fly sumando `client_payments`.
- **Razón**: El ledger unificado (`movements`) es el "source of truth" para el balance financiero. Todos los tipos de transacciones (cobros, pagos de materiales, mano de obra, gastos generales, subcontratos) se unifican ahí para calcular KPIs globales. Sin el movimiento, el balance no refleja los ingresos.

### D5: Schedule y Commitment con currency independiente

- **Elegimos**: Cada cuota (`client_payment_schedule`) tiene su propio `currency_id`. El compromiso también tiene el suyo.
- **Alternativa descartada**: Heredar la moneda del compromiso padre.
- **Razón**: En Argentina, es común tener compromisos en USD con cuotas en ARS (al TC del día). La independencia de monedas da flexibilidad para países con economías bimonetarias.

### D6: Portal externo del cliente (acceso limitado)

- **Elegimos**: Los clientes pueden ser invitados a un portal externo donde ven su estado de cuenta, presupuestos y compromisos. El acceso se gestiona via `project_access` con permisos limitados.
- **Archivos**: `invite-client-portal-form.tsx`, `views/external/`
- **Razón**: Transparencia con el cliente sin darle acceso al dashboard completo.

---

## Edge Cases y Gotchas

### E1: Cobro sin compromiso → balance_due incorrecto

- **Escenario**: Un cliente paga $1,000,000 pero no tiene compromisos registrados.
- **Impacto**: El `client_financial_summary_view` muestra `total_committed = 0`, `total_paid = 1,000,000`, `balance_due = -1,000,000`. El balance negativo indica "pagó más de lo comprometido".
- **Solución futura**: Agregar un indicador visual tipo "Pagos sin compromiso" en la vista de resumen. Hoy no se advierte al usuario.

### E2: Cuota pagada parcialmente

- **Escenario**: La cuota es de $5,000,000 pero el cliente paga $3,000,000 y otro día $2,000,000.
- **Impacto**: Solo un cobro puede vincularse a una cuota (`schedule_id`). El segundo cobro quedaría sin vincular, o se vincula al mismo `schedule_id` (la relación NO es 1:1, es N:1).
- **Solución futura**: Calcular "monto pendiente de cuota" como `cuota.amount - SUM(pagos vinculados)`. Hoy no se hace este cálculo.

### E3: Cambio de moneda entre compromiso y cobro

- **Escenario**: Compromiso en USD, cobro en ARS.
- **Impacto**: El `client_financial_summary_view` agrupa por `currency_id`. Si compromiso y cobro usan monedas distintas, aparecen en filas separadas y no se comparan directamente.
- **Solución futura**: Normalizar a moneda funcional usando `exchange_rate` para comparación. Hoy solo se compara same-currency.

### E4: Borrado de compromiso con cuotas y pagos vinculados

- **Escenario**: Se borra (soft delete) un compromiso que tiene cuotas y pagos vinculados.
- **Impacto**: Las cuotas y pagos mantienen el `commitment_id` del compromiso borrado. La vista filtra `commitments.is_deleted = false` así que el compromiso desaparece del resumen, pero los pagos siguen existiendo como ingresos en el ledger.
- **Solución futura**: Cascade de soft delete o advertencia al borrar un compromiso con pagos vinculados.

### E5: Importación masiva de cobros

- **Escenario**: Se importan muchos cobros via CSV/Excel.
- **Impacto**: Cada cobro importado requiere crear un movimiento en `movements`. El `import_batch_id` permite auditar y revertir lotes completos.
- **Estado**: ⚠️ No implementado aún para cobros de clientes (sí existe para pagos de materiales, mano de obra y subcontratos).

---

## Relación con otros Flows

| Flow relacionado | Cómo se conecta |
|------------------|-----------------|
| **Presupuestos / Quotes** | Los compromisos pueden vincularse a un presupuesto (`quote_id`). El `contract_summary_view` muestra valor total del contrato + change orders. |
| **Finanzas (Ledger)** | Cada cobro confirmado genera un movimiento positivo en `finance.movements`. El `unified_financial_movements_view` y `fn_financial_kpi_summary` incluyen estos ingresos en los KPIs globales. |
| **Contactos** | Los clientes son contactos vinculados a proyectos. Los datos del contacto (nombre, email, avatar) se leen de `contacts.contacts`. |
| **Proyectos** | Los clientes, compromisos y cobros están scoped a un proyecto. El filtro de proyecto activo aplica a todas las vistas. |
| **Portal Externo** | Los clientes con acceso al portal pueden ver presupuestos, compromisos y estado de cuenta. Se gestiona via `project_access` y el form de invitación. |
| **Materiales / Subcontratos / Mano de Obra** | No hay relación directa, pero comparten el ledger unificado (`movements`). Los cobros de clientes son ingresos; los pagos de materiales/subcontratos/MO son egresos. El balance se calcula consolidando todo. |
| **Gastos Generales** | Mismo patrón: comparte el ledger unificado. Los gastos generales son egresos que reducen el balance. |
| **Capital / Socios** | Los aportes de capital también son ingresos en el ledger, pero vienen del módulo de Capital, no de Cobros. Son flujos paralelos que conviven en el mismo dashboard financiero. |
