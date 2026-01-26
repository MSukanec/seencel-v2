# Feature: Subcontratos - Auditoría de Producto Completa

> Última actualización: 2026-01-26  
> Autor: Antigravity (Product Audit)

---

## 🎯 Resumen Ejecutivo

**Subcontratos es actualmente un MVP funcional** que permite registrar contratos con proveedores y realizar pagos. Sin embargo, **está muy lejos del estándar de la industria** (Procore, Buildertrend, CoConstruct).

### Nivel Actual: ⭐⭐☆☆☆ (2/5)

**Fortalezas:**
- Multi-moneda con functional_amount ✅
- Integración con contactos ✅
- Sistema de pagos funcional ✅
- Soft delete y audit logs ✅
- Vista de detalle por subcontrato ✅

**Brechas Críticas:**
- Sin Schedule of Values (SOV) ❌
- Sin Change Orders ❌
- Sin Retenciones (Retainage) ❌
- Sin documentos adjuntos ❌
- Sin portal de subcontratistas ❌
- Sin licitaciones/bids ❌

---

## 📊 Benchmark vs Competencia

### Tabla Comparativa General

| Feature | Procore | Buildertrend | CoConstruct | **SEENCEL** | Estado |
|---------|:-------:|:------------:|:-----------:|:-----------:|--------|
| **GESTIÓN BÁSICA** |
| Crear subcontratos | ✅ | ✅ | ✅ | ✅ | Completo |
| Vincular a contactos/proveedores | ✅ | ✅ | ✅ | ✅ | Completo |
| Multi-moneda | ✅ | ✅ | ✅ | ✅ | Completo |
| Estados del contrato | ✅ | ✅ | ✅ | ✅ | Completo |
| Notas y descripción | ✅ | ✅ | ✅ | ✅ | Completo |
| **FINANCIERO** |
| Pagos simples | ✅ | ✅ | ✅ | ✅ | Completo |
| **Schedule of Values (SOV)** | ✅ | ✅ | ✅ | ❌ | **CRÍTICO** |
| **Pay Applications** | ✅ | ✅ | ✅ | ❌ | **CRÍTICO** |
| **Retenciones (Retainage)** | ✅ | ✅ | ✅ | ❌ | **CRÍTICO** |
| **Change Orders** | ✅ | ✅ | ✅ | ❌ | **CRÍTICO** |
| Progress billing (% avance) | ✅ | ✅ | ✅ | ⚠️ | Parcial |
| Certified payroll | ✅ | ⚠️ | ❌ | ❌ | Futuro |
| **DOCUMENTOS** |
| Adjuntar contratos PDF | ✅ | ✅ | ✅ | ❌ | Alta prioridad |
| Lien Waivers | ✅ | ✅ | ⚠️ | ❌ | Alta prioridad |
| Insurance certificates | ✅ | ✅ | ✅ | ❌ | Alta prioridad |
| Firma electrónica | ✅ | ✅ | ✅ | ❌ | Media prioridad |
| **LICITACIONES** |
| Bid Requests (solicitar cotizaciones) | ✅ | ✅ | ✅ | ❌ | Media prioridad |
| Comparar ofertas | ✅ | ✅ | ✅ | ❌ | Media prioridad |
| Convertir bid → contrato | ✅ | ✅ | ✅ | ❌ | Media prioridad |
| **PORTAL SUBCONTRATISTA** |
| Acceso externo para subs | ✅ | ✅ | ✅ | ❌ | **DIFERENCIADOR** |
| Subs crean sus invoices | ✅ | ✅ | ✅ | ❌ | **DIFERENCIADOR** |
| Dashboard para subs | ✅ | ✅ | ✅ | ❌ | **DIFERENCIADOR** |
| **INTEGRACIÓN OBRA** |
| Vincular a tasks/schedule | ✅ | ✅ | ✅ | ⚠️ | Placeholder |
| Notificaciones automáticas | ✅ | ✅ | ✅ | ❌ | Media prioridad |
| **ANALÍTICAS** |
| Dashboard Overview | ✅ | ✅ | ✅ | ⚠️ | Vacío |
| Reportes de costos | ✅ | ✅ | ✅ | ❌ | Alta prioridad |
| Cash flow projection | ✅ | ✅ | ⚠️ | ❌ | Media prioridad |

---

## 🔍 Lo Que Tenemos (Estado Actual)

### ✅ Funcionalidades Completas

1. **CRUD de Subcontratos**
   - Crear, editar, eliminar contratos
   - Vincular a contactos existentes
   - Multi-moneda con exchange rate
   - Estados: draft, active, completed, cancelled

2. **Sistema de Pagos**
   - Registrar pagos con fecha, monto, referencia
   - Múltiples monedas
   - Functional amount calculado automáticamente
   - Vincular a wallet/billetera
   - Status: confirmed, pending, rejected, void
   - Soft delete

3. **Vistas Implementadas**
   - Lista de subcontratos con KPIs
   - Detalle de subcontrato individual
   - Tab de pagos funcional

4. **Datos Calculados (Vista SQL)**
   - `paid_amount` - Total pagado
   - `remaining_amount` - Saldo pendiente
   - `progress_percentage` - % de avance

### ⚠️ Funcionalidades Parciales

1. **Vista de Tareas** - Solo placeholder, no vincula con construcción
2. **Overview Dashboard** - Muestra "próximamente"
3. **Detalle Overview** - KPIs básicos, sin gráficos

### ❌ Funcionalidades Faltantes

Ver tabla comparativa arriba.

---

## 🗄️ Estructura de Base de Datos

### Tablas Actuales

| Tabla | Propósito | Estado |
|-------|-----------|--------|
| `subcontracts` | Contratos principales | ✅ |
| `subcontract_payments` | Pagos realizados | ✅ |
| `subcontracts_view` | Vista con cálculos | ✅ |

### Tablas Propuestas (No Existen)

| Tabla | Propósito | Prioridad |
|-------|-----------|-----------|
| `subcontract_sov_items` | Schedule of Values | 🔴 CRÍTICA |
| `subcontract_pay_applications` | Solicitudes de pago | 🔴 CRÍTICA |
| `subcontract_change_orders` | Órdenes de cambio | 🔴 CRÍTICA |
| `subcontract_documents` | Docs adjuntos | 🟡 Alta |
| `subcontract_bids` | Ofertas recibidas | 🟡 Alta |
| `subcontract_lien_waivers` | Renuncias de gravamen | 🟡 Alta |

---

## 📁 Estructura de Archivos Actual

```
src/features/subcontracts/
├── actions.ts              # ✅ CRUD completo
├── queries.ts              # ✅ 3 queries
├── TABLES.md               # ✅ Esquema DB
├── FEATURE.md              # ✅ Este archivo
└── components/
    ├── cards/
    │   └── subcontract-card.tsx       # ✅ Card para lista
    ├── forms/
    │   ├── subcontracts-subcontract-form.tsx   # ✅ Form principal
    │   └── subcontract-payment-form.tsx        # ✅ Form de pagos
    ├── tables/
    │   ├── subcontracts-columns.tsx            # ✅ Columnas tabla
    │   └── subcontracts-payments-columns.tsx   # ✅ Columnas pagos
    └── views/
        ├── subcontracts-list-view.tsx          # ✅ Lista con KPIs
        ├── subcontracts-overview-view.tsx      # ⚠️ VACÍO
        ├── subcontracts-payments-view.tsx      # ✅ Tab pagos
        ├── subcontract-detail-overview-view.tsx # ⚠️ Básico
        └── subcontract-tasks-view.tsx          # ⚠️ VACÍO
```

---

## 🚀 Roadmap Propuesto

### Fase 1: SOV (Schedule of Values) - CRÍTICO
**Objetivo:** Permitir desglosar el contrato en líneas individuales para facturación progresiva.

**Por qué es crítico:** Es el estándar de la industria. Sin SOV, no hay forma profesional de gestionar el avance de pagos. Procore y Buildertrend lo consideran feature fundamental.

- [ ] Crear tabla `subcontract_sov_items`
  ```sql
  - id, subcontract_id
  - description (Item de trabajo)
  - scheduled_value (Monto programado)
  - completed_to_date (% completado)
  - stored_materials (materiales en sitio)
  - retention_held (retención retenida)
  ```
- [ ] Vista de SOV en detalle de subcontrato
- [ ] Cálculo automático de totales
- [ ] Importar desde CSV/Excel

**Valor para el usuario:** "Ver exactamente cuánto le debo al contratista por cada rubro"

---

### Fase 2: Pay Applications - CRÍTICO
**Objetivo:** El subcontratista solicita pagos basados en avance.

**Por qué es crítico:** Flujo estándar en construcción. El sub presenta su "Application for Payment" con el avance del período.

- [ ] Crear tabla `subcontract_pay_applications`
  ```sql
  - id, subcontract_id, period_start, period_end
  - application_number (secuencial)
  - status: submitted, approved, rejected, paid
  - submitted_by, approved_by, approved_date
  ```
- [ ] `subcontract_pay_app_items` (items del SOV con avance del período)
- [ ] Workflow: Sub envía → Admin revisa → Aprueba → Genera pago
- [ ] Cálculo de retención

**Valor para el usuario:** "El contratista me envía su certificado y yo lo apruebo o rechazo"

---

### Fase 3: Retenciones (Retainage) - ALTO
**Objetivo:** Retener un % de cada pago para garantía.

**Por qué es importante:** Práctica estándar (5-10% retención) para proteger al GC.

- [ ] Campo `retainage_percent` en subcontracts
- [ ] Cálculo automático en cada pay application
- [ ] Vista de retenciones acumuladas
- [ ] Liberación de retención al completar

**Valor para el usuario:** "Asegurarme de que el sub complete antes de pagarle todo"

---

### Fase 4: Change Orders - ALTO
**Objetivo:** Gestionar cambios al alcance/precio original.

**Por qué es importante:** Los proyectos cambian. Sin COs, no hay trazabilidad.

- [ ] Crear tabla `subcontract_change_orders`
  ```sql
  - id, subcontract_id, change_order_number
  - description, reason
  - amount (+ o -)
  - status: pending, approved, rejected
  - linked_to (change event del proyecto)
  ```
- [ ] Vista de Change Orders por subcontrato
- [ ] Impacto en SOV
- [ ] Aprobaciones y workflow

**Valor para el usuario:** "Documentar y aprobar cambios antes de que impacten el presupuesto"

---

### Fase 5: Documentos Adjuntos - MEDIO
**Objetivo:** Adjuntar contratos PDF, seguros, lien waivers.

- [ ] Usar `subcontract_documents` con Storage
- [ ] Tipos: contract, insurance, lien_waiver, other
- [ ] Vencimientos (insurance expiry)
- [ ] Alertas de documentos vencidos

**Valor para el usuario:** "Tener todo en un solo lugar, no en emails"

---

### Fase 6: Dashboard Overview - MEDIO
**Objetivo:** Vista general con métricas clave.

- [ ] KPIs: Total contratado, pagado, pendiente, retención
- [ ] Gráfico: Distribución por estado
- [ ] Gráfico: Pagos por mes
- [ ] Lista: Próximos vencimientos
- [ ] Lista: Subs con pagos pendientes

---

### Fase 7: Bid Management - BAJO (Diferenciador)
**Objetivo:** Solicitar y comparar cotizaciones antes de contratar.

- [ ] Crear alcance de trabajo
- [ ] Enviar invitación a múltiples proveedores
- [ ] Recibir ofertas (con portal externo)
- [ ] Comparador de ofertas
- [ ] Convertir bid ganador → subcontrato

---

### Fase 8: Portal de Subcontratistas - BAJO (Gran Diferenciador)
**Objetivo:** Los subs acceden con su propio login.

**Potencial diferenciador ENORME.** Pocas plataformas LatAm tienen esto bien.

- [ ] Login separado para contactos tipo "proveedor"
- [ ] Dashboard del sub: sus contratos, pagos, documentos
- [ ] El sub crea sus Pay Applications
- [ ] Notificaciones y mensajes

---

## 💡 Oportunidades de Diferenciación

1. **Multi-moneda real** - Ya lo tenemos, expandir UX
2. **Portal en español para LatAm** - Procore es muy "gringo"
3. **Pricing accesible** - Procore cuesta $$$, nosotros podemos ser competitivos
4. **Mobile-first** - Experiencia móvil superior para el campo
5. **IA para predicción de pagos** - Cuándo va a pagar el cliente vs cuándo debemos pagar

---

## 📝 Notas de Arquitectura

### Relación con Otros Features

- **Contactos:** El `contact_id` es el proveedor
- **Proyectos:** Cada subcontrato pertenece a un proyecto
- **Finanzas:** Los pagos afectan el flujo de caja general
- **Construcción (futuro):** Vincular a tasks del schedule

### Patrón de Datos

```
Subcontrato (header)
    └── SOV Items (líneas del contrato)
        └── Pay Application Items (avance por período)
            └── Payment (pago real)
    └── Change Orders (modificaciones)
    └── Documents (adjuntos)
```

---

## ✅ Checklist de Implementación

### Corto Plazo (Sprint 1-2)
- [ ] Implementar SOV básico
- [ ] Mejorar Overview Dashboard
- [ ] Agregar adjuntos de documentos
- [ ] Conectar con sistema de notificaciones

### Mediano Plazo (Sprint 3-6)
- [ ] Pay Applications completo
- [ ] Change Orders
- [ ] Retenciones
- [ ] Reportes básicos

### Largo Plazo (Sprint 7+)
- [ ] Bid Management
- [ ] Portal de Subcontratistas
- [ ] IA Insights
- [ ] Integración con calendario

---

## 🔗 Referencias

- [Procore Commitments](https://www.procore.com/en-us/platform/financials/commitments)
- [Buildertrend Sub Portal](https://buildertrend.com/features/sub-portal/)
- [CoConstruct Trade Management](https://www.coconstruct.com/features/trade-partners)

---

> **Conclusión:** SEENCEL tiene una base sólida, pero necesita SO
V, Pay Applications y Change Orders para competir seriamente. 
> El portal de subcontratistas podría ser nuestro gran diferenciador en LatAm.
