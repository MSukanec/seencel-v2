# Roadmap: Capital

---

## ✅ Completado

| Qué | Detalles |
|-----|---------|
| **Modelo de datos** *(DB)* | 5 tablas: `capital_participants`, `partner_contributions`, `partner_withdrawals`, `capital_adjustments`, `partner_capital_balance` |
| **Views SQL** *(DB)* | 5 views: ledger_view, organization_totals, partner_balances, participants_summary, partner_kpi |
| **Triggers de balance** *(DB)* | 3 triggers que mantienen `partner_capital_balance` sincronizado automáticamente |
| **RLS Policies** *(DB)* | SELECT/INSERT/UPDATE en las 5 tablas con `finance.view`/`finance.manage` |
| **Page con data fetch** *(Frontend)* | `page.tsx` conectada a `capital_ledger_view` y `capital_participants_summary_view` |
| **Overview Dashboard** *(Frontend)* | `capital-overview-view.tsx` con 4 KPIs + Area Chart + Actividad Reciente |
| **Movements DataTable** *(Frontend)* | `capital-movements-view.tsx` con filtros por tipo, estado y fecha + KPIs de resumen |

---

## ⏳ Pendiente: Corto plazo

### P1: CRUD de Participantes 🔴 CRÍTICO
**Prioridad**: 🔴 Alta — Sin esto no se puede usar Capital
**Descripción**: Crear form + action para agregar/editar participantes

**Archivos a crear/modificar**:
- `src/features/capital/actions.ts` — [NEW] `createCapitalParticipant()`, `updateCapitalParticipant()`, `deleteCapitalParticipant()`
- `src/features/capital/forms/capital-participant-form.tsx` — [NEW] Form con ContactField + NumberField para ownership_percentage + NotesField
- `src/features/capital/views/capital-participants-view.tsx` — [MODIFY] Reemplazar empty state con DataTable de participantes

**Campos del form**:
- Contacto (ContactField, requerido)
- % Participación (NumberField, 0-100, opcional)
- Notas (NotesField, opcional)
- Estado (SelectField: activo/inactivo)

---

### P2: CRUD de Movimientos (Aportes/Retiros) 🔴 CRÍTICO
**Prioridad**: 🔴 Alta — Sin esto no se puede registrar capital
**Descripción**: Crear form + action para registrar aportes y retiros

**Archivos a crear/modificar**:
- `src/features/capital/actions.ts` — [ADD] `createPartnerContribution()`, `createPartnerWithdrawal()`, `updateCapitalMovement()`, `deleteCapitalMovement()`
- `src/features/capital/forms/capital-movement-form.tsx` — [NEW] Form unificado con toggle tipo (Aporte/Retiro)
- `src/features/capital/views/capital-movements-view.tsx` — [MODIFY] Conectar botón "Nuevo Movimiento" al form + row actions (edit/delete)

**Campos del form**:
- Tipo (Toggle: Aporte / Retiro)
- Participante (SelectField, requerido)
- Monto (MoneyField, requerido)
- Moneda (CurrencyField, requerido)
- Tipo de cambio (NumberField, si moneda ≠ funcional)
- Billetera (WalletField, requerido)
- Fecha (DateField, requerido)
- Referencia (TextField, opcional)
- Notas (NotesField, opcional)
- Proyecto (ProjectField, opcional)

---

### P3: Vista de Balances por Socio 🟡 MEDIA
**Prioridad**: 🟡 Media — Funcionalidad diferenciadora
**Descripción**: Implementar la vista de balances usando la data de `capital_partner_kpi_view`

**Archivos a modificar**:
- `src/features/capital/views/capital-balances-view.tsx` — [MODIFY] Reemplazar empty state con tabla de balances

**Columnas de la tabla**:
- Participante (avatar + nombre)
- % Esperado (ownership_percentage)
- Aportes Totales
- Retiros Totales
- Balance Actual
- % Real (real_ownership_ratio)
- Desviación (deviation_contribution)
- Estado (Badge: sobre-aportado 🟢 / equilibrado ⚪ / bajo-aportado 🔴)

---

### P4: Fix multi-moneda en views de balance 🟡 MEDIA
**Prioridad**: 🟡 Media — Bug si usan 2+ monedas
**Descripción**: Las views suman `amount` directo sin convertir a moneda funcional. Si hay aportes en USD y ARS, los totales son incorrectos.

**Archivos a modificar**:
- SQL: `capital_partner_balances_view`, `capital_organization_totals_view` — usar `amount * exchange_rate` para functional_amount
- `page.tsx` — pasar moneda funcional para el mapeo

---

### P5: Types estrictos 🟢 BAJA
**Prioridad**: 🟢 Baja — Calidad de código
**Descripción**: Crear archivo de types con interfaces reales en vez de `any[]`

**Archivos a crear**:
- `src/features/capital/types.ts` — [NEW] `CapitalParticipant`, `CapitalMovement`, `CapitalBalance`, etc.

---

### P6: Agregar DELETE RLS policies 🟢 BAJA
**Prioridad**: 🟢 Baja — Solo necesario si hard delete
**Descripción**: Las 4 tablas de capital no tienen DELETE policy. Agregar con `can_mutate_org(org_id, 'finance.manage')`.

**Script SQL**: Crear en `DB/` con 4 ALTER TABLE ... ADD POLICY

---

## 🔮 Pendiente: Largo plazo

### L1: Importación masiva de movimientos
Importar aportes/retiros desde Excel. Reutilizar infra de Standard 3.5 (Universal Import).

### L2: CRUD de Ajustes de Capital
Form específico para ajustes con campo `reason`. Separado de aportes/retiros.

### L3: Integración con Movimientos Financieros
Vincular aportes/retiros de capital con `finance.movements` para tener un ledger financiero unificado.

### L4: Distribución de utilidades
Calcular distribución de ganancias basada en % de ownership. Generar propuesta de distribución.

### L5: Historial de cambios de ownership
Trackear cuándo cambia el % de un socio. Útil para auditoría y reportes históricos.

### L6: Dashboard comparativo
Gráfico radar o bar chart comparando aportes reales vs esperados por socio. Widget para el dashboard principal de finanzas.

### L7: Exportar a PDF/Excel
Reporte de estado de capital por socio, con detalle de movimientos y balance.
