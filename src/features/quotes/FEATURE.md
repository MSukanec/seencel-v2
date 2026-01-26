# Feature: Presupuestos (Quotes) - Auditoría de Producto Completa

> Última actualización: 2026-01-26  
> Autor: Antigravity (Product Audit)

---

## 🎯 Resumen Ejecutivo

**Quotes es un feature bastante desarrollado** que permite crear cotizaciones, contratos y adicionales. Sin embargo, tiene una **arquitectura incorrecta para Change Orders** y le faltan features críticos como SOV y facturación progresiva.

### Nivel Actual: ⭐⭐⭐☆☆ (3/5)

**Fortalezas:**
- CRUD completo de presupuestos ✅
- Editor de items con tareas del catálogo ✅
- Multi-moneda con exchange rate ✅
- Generación de PDF ✅
- Aprobación con creación de tareas de obra ✅
- Generación de compromisos (cuotas) ✅
- Conversión a proyecto ✅
- Soft delete y audit logs ✅

**Brechas Críticas:**
- ❌ Change Orders NO vinculados al contrato padre
- ❌ Sin "Original Contract Value" vs "Revised Contract Value"
- ❌ Sin Schedule of Values (SOV)
- ❌ Sin Owner Invoices / Progress Billing
- ❌ Sin retenciones
- ❌ Sin versionado real del contrato

---

## 📊 Benchmark vs Competencia

### 🔴 EL PROBLEMA FUNDAMENTAL: Change Orders

**Cómo funciona en Procore (industria estándar):**

```
Prime Contract (Contrato Original)     $1,000,000
    │
    ├── PCCO #1: Agregar baños         +$50,000
    ├── PCCO #2: Quitar muro           -$10,000
    ├── PCCO #3: Cambiar puerta        +$2,000
    │
    └── REVISED CONTRACT VALUE:        $1,042,000

    Original Contract Value: $1,000,000 (INMUTABLE)
    Approved Changes:        +$42,000
    Revised Contract Value:  $1,042,000
```

**Cómo funciona en SEENCEL (actualmente):**

```
Quote tipo "contract"    $1,000,000   (Contrato)
Quote tipo "change_order" $50,000     (INDEPENDIENTE!! ❌)
Quote tipo "change_order" -$10,000    (INDEPENDIENTE!! ❌)

❌ NO hay vínculo entre ellos
❌ NO hay "Revised Contract Value"
❌ NO hay tracking del contrato original
```

### Tabla Comparativa General

| Feature | Procore | Buildertrend | **SEENCEL** | Estado |
|---------|:-------:|:------------:|:-----------:|--------|
| **GESTIÓN BÁSICA** |
| Crear cotizaciones | ✅ | ✅ | ✅ | Completo |
| Crear contratos | ✅ | ✅ | ✅ | Completo |
| Vincular a cliente | ✅ | ✅ | ✅ | Completo |
| Vincular a proyecto | ✅ | ✅ | ✅ | Completo |
| Multi-moneda | ✅ | ✅ | ✅ | Completo |
| Descuentos y markup | ✅ | ✅ | ✅ | Completo |
| Impuestos (IVA) | ✅ | ✅ | ✅ | Completo |
| PDF generation | ✅ | ✅ | ✅ | Completo |
| **CHANGE ORDERS** |
| Crear Change Orders | ✅ | ✅ | ⚠️ | Incorrecto |
| **Vincular CO a contrato padre** | ✅ | ✅ | ❌ | **CRÍTICO** |
| **Original vs Revised Value** | ✅ | ✅ | ❌ | **CRÍTICO** |
| **Historial de cambios** | ✅ | ✅ | ❌ | **CRÍTICO** |
| Numeración automática (CO #1, #2) | ✅ | ✅ | ❌ | Alta |
| Aprobación workflow | ✅ | ✅ | ⚠️ | Parcial |
| Impacto en SOV | ✅ | ✅ | ❌ | N/A (sin SOV) |
| **SCHEDULE OF VALUES (SOV)** |
| Desglose del contrato en items | ✅ | ✅ | ⚠️ | En quote_items |
| Progress billing por item | ✅ | ✅ | ❌ | **CRÍTICO** |
| % completado por item | ✅ | ✅ | ❌ | Alta |
| Retenciones por item | ✅ | ✅ | ❌ | Alta |
| **OWNER INVOICES** |
| Crear invoice al cliente | ✅ | ✅ | ❌ | **CRÍTICO** |
| Invoice basado en SOV | ✅ | ✅ | ❌ | **CRÍTICO** |
| Billing periods | ✅ | ✅ | ❌ | Alta |
| Application for Payment (AIA G702) | ✅ | ⚠️ | ❌ | Media |
| **VERSIONADO** |
| Versiones del contrato | ✅ | ✅ | ⚠️ | Solo campo |
| Comparar versiones | ✅ | ✅ | ❌ | Baja |
| **CONVERSIÓN** |
| Quote → Contract | ✅ | ✅ | ✅ | Completo |
| Contract → Construction Tasks | ✅ | ✅ | ✅ | Completo |
| Quote → Project | N/A | N/A | ✅ | Extra |
| Contract → Commitments | ✅ | ✅ | ✅ | Completo |
| **DOCUMENTOS** |
| Adjuntar documentos | ✅ | ✅ | ❌ | Media |
| Firma electrónica | ✅ | ✅ | ❌ | Media |

---

## 🔍 Estado Actual del Feature

### ✅ Funcionalidades Completas

1. **CRUD de Quotes**
   - Crear, editar, eliminar presupuestos
   - Tipos: `quote`, `contract`, `change_order`
   - Estados: `draft`, `sent`, `approved`, `rejected`
   
2. **Editor de Items**
   - Agregar items desde catálogo de tareas
   - Items personalizados (sin task_id)
   - Cantidad, precio unitario, markup
   - Categorías (division_name)
   - Drag & drop para ordenar

3. **Cálculos**
   - Subtotal
   - Subtotal con markup
   - Descuento global
   - Impuestos (IVA)
   - Total final

4. **Generación PDF**
   - PDF profesional con membrete
   - Desglose por categorías
   - Términos y condiciones

5. **Aprobación**
   - Marca como aprobado
   - Crea `construction_tasks` desde items
   - Snapshot de materiales

6. **Generación de Compromisos**
   - Crear cuotas (adelanto + saldo)
   - Vincula a cliente

7. **Conversión a Proyecto**
   - Crear proyecto desde quote standalone

### ⚠️ Funcionalidades Incorrectas

1. **Change Orders como Quotes Independientes**
   - Se crean como quotes sueltos
   - NO hay `parent_quote_id`
   - NO suman al contrato original
   - NO hay "Revised Contract Value"

2. **Versionado Solo Nominal**
   - El campo `version` existe pero no hay UI
   - No se pueden comparar versiones
   - No hay historial

### ❌ Funcionalidades Faltantes

- Schedule of Values (SOV) propio
- Owner Invoices / Progress Billing
- Retenciones
- Billing Periods
- Documentos adjuntos
- Firma electrónica

---

## 🗄️ Estructura de Base de Datos

### Tablas Actuales

| Tabla | Propósito | Estado |
|-------|-----------|--------|
| `quotes` | Presupuestos/Contratos | ✅ |
| `quote_items` | Items del presupuesto | ✅ |
| `quotes_view` | Vista con cálculos | ✅ |
| `quote_items_view` | Vista de items | ✅ |

### Campos Actuales de `quotes`

| Campo | Tipo | Propósito |
|-------|------|-----------|
| `quote_type` | text | quote/contract/change_order |
| `version` | int | Versión (no usado) |
| `parent_quote_id` | ❌ NO EXISTE | Debería vincular CO a contrato |
| `original_value` | ❌ NO EXISTE | Valor original inmutable |

### Tablas Propuestas (No Existen)

| Tabla | Propósito | Prioridad |
|-------|-----------|-----------|
| `quote_change_orders` | Change orders vinculados | 🔴 CRÍTICA |
| `quote_sov_lines` | SOV con progress billing | 🔴 CRÍTICA |
| `owner_invoices` | Facturas al cliente | 🔴 CRÍTICA |
| `owner_invoice_items` | Items de factura | 🔴 CRÍTICA |

---

## 📁 Estructura de Archivos

```
src/features/quotes/
├── actions.ts                  # ✅ Server actions completas
├── queries.ts                  # ✅ Queries
├── types.ts                    # ✅ Types (incluye change_order)
├── TABLES.MD                   # ✅ Esquema DB
├── FEATURE.md                  # ✅ Este archivo
├── components/
│   ├── editor/
│   │   ├── quote-editor.tsx          # ✅ Editor principal
│   │   ├── quote-item-row.tsx        # ✅ Fila de item
│   │   └── quote-item-dialog.tsx     # ✅ Modal agregar item
│   ├── forms/
│   │   └── quote-form.tsx            # ✅ Form creación/edición
│   ├── lists/
│   │   └── quotes-list.tsx           # ✅ Lista de quotes
│   ├── quote-pdf-generator.tsx       # ✅ PDF
│   └── quotes-page-client.tsx        # ✅ Client wrapper
└── views/
    ├── index.ts
    └── quotes-page-view.tsx          # ✅ Vista principal
```

---

## 🚀 Roadmap Propuesto

### Fase 1: Arquitectura Change Orders - CRÍTICO
**Objetivo:** Vincular Change Orders correctamente al contrato padre.

**Por qué es crítico:** Sin esto, no hay forma de trackear el "Revised Contract Value". Es el estándar de la industria.

#### Opción A: Campo `parent_quote_id` (Recomendado)
```sql
ALTER TABLE quotes ADD COLUMN parent_quote_id UUID REFERENCES quotes(id);
ALTER TABLE quotes ADD COLUMN original_contract_value NUMERIC(15,2);
```

- [ ] Agregar `parent_quote_id` a la tabla `quotes`
- [ ] Agregar `original_contract_value` (se congela al aprobar)
- [ ] Agregar `change_order_number` (secuencial por contrato)
- [ ] Crear vista `contract_summary_view`:
  ```sql
  SELECT 
    parent.id,
    parent.name,
    parent.original_contract_value,
    SUM(CASE WHEN co.status = 'approved' THEN co.total END) as approved_changes,
    parent.original_contract_value + COALESCE(approved_changes, 0) as revised_contract_value
  FROM quotes parent
  LEFT JOIN quotes co ON co.parent_quote_id = parent.id
  WHERE parent.quote_type = 'contract'
  GROUP BY parent.id
  ```

#### Cambios de UI
- [ ] En detalle de contrato, mostrar:
  - Original Contract Value: $1,000,000
  - Approved Changes: +$42,000
  - Revised Contract Value: $1,042,000
- [ ] Tab/sección "Change Orders" dentro del contrato
- [ ] Botón "Nuevo Adicional" que crea CO vinculado
- [ ] Numeración automática: CO #1, CO #2, etc.

**Valor para el usuario:** "Ver cuánto vale mi contrato HOY vs cuánto era al inicio"

---

### Fase 2: Schedule of Values (SOV) - CRÍTICO
**Objetivo:** Convertir los `quote_items` en un SOV facturable.

**Por qué es crítico:** Sin SOV, no hay forma profesional de facturar avance. Procore y AIA G702 lo requieren.

- [ ] Extender `quote_items` o crear `quote_sov_lines`:
  ```sql
  ALTER TABLE quote_items ADD COLUMN scheduled_value NUMERIC(15,2);
  ALTER TABLE quote_items ADD COLUMN work_completed_previous NUMERIC(15,2) DEFAULT 0;
  ALTER TABLE quote_items ADD COLUMN work_completed_current NUMERIC(15,2) DEFAULT 0;
  ALTER TABLE quote_items ADD COLUMN stored_materials NUMERIC(15,2) DEFAULT 0;
  ALTER TABLE quote_items ADD COLUMN total_completed NUMERIC(15,2) GENERATED ALWAYS AS (...);
  ALTER TABLE quote_items ADD COLUMN percent_complete NUMERIC(6,2) GENERATED ALWAYS AS (...);
  ALTER TABLE quote_items ADD COLUMN balance_to_finish NUMERIC(15,2) GENERATED ALWAYS AS (...);
  ALTER TABLE quote_items ADD COLUMN retention_held NUMERIC(15,2) DEFAULT 0;
  ```
- [ ] Vista de SOV tabulada
- [ ] Edición de avance por período

**Valor para el usuario:** "Facturar exactamente lo que avancé cada mes"

---

### Fase 3: Owner Invoices (Facturación al Cliente) - CRÍTICO
**Objetivo:** Generar certificados/facturas basados en el SOV.

- [ ] Crear tabla `owner_invoices`:
  ```sql
  CREATE TABLE owner_invoices (
    id UUID PRIMARY KEY,
    quote_id UUID REFERENCES quotes(id), -- El contrato
    invoice_number INT,
    billing_period_start DATE,
    billing_period_end DATE,
    status TEXT DEFAULT 'draft', -- draft, submitted, approved, paid
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    ...
  );
  ```
- [ ] Crear tabla `owner_invoice_items` (refleja SOV del período)
- [ ] Generar PDF estilo AIA G702/G703
- [ ] Workflow de aprobación
- [ ] Integración con pagos de clientes

**Valor para el usuario:** "Enviar certificados mensuales profesionales al cliente"

---

### Fase 4: Retenciones - ALTO
**Objetivo:** Retener un % de cada factura.

- [ ] Campo `retention_percent` en contrato (default 5-10%)
- [ ] Cálculo automático en cada invoice
- [ ] Vista de retenciones acumuladas
- [ ] Liberación al completar

**Valor para el usuario:** "Protegerme reteniendo un % hasta que terminen"

---

### Fase 5: Versionado Real - MEDIO
**Objetivo:** Poder ver versiones anteriores del presupuesto.

- [ ] Crear tabla `quote_versions` o usar snapshots JSON
- [ ] UI para comparar versiones
- [ ] Historial de cambios

---

### Fase 6: Documentos y Firma - BAJO
**Objetivo:** Adjuntar contratos y firmar digitalmente.

- [ ] Usar Supabase Storage
- [ ] Integración con DocuSign/HelloSign
- [ ] Tracking de firma

---

## 💡 Modelo de Datos Propuesto (Change Orders)

```
Quote (type=contract) ─────────────────┐
│ id: uuid                             │
│ name: "Contrato Casa Rodriguez"      │
│ original_contract_value: $1,000,000  │ ← Se congela al aprobar
│ parent_quote_id: NULL                │
└──────────────────────────────────────┘
         │
         │ parent_quote_id
         ▼
Quote (type=change_order) ─────────────┐
│ id: uuid                             │
│ name: "CO #1: Agregar baño"          │
│ parent_quote_id: [contract_id]       │ ← VÍNCULO!
│ change_order_number: 1               │
│ total: +$50,000                      │
└──────────────────────────────────────┘
         │
         ▼
Quote (type=change_order) ─────────────┐
│ id: uuid                             │
│ name: "CO #2: Quitar muro"           │
│ parent_quote_id: [contract_id]       │
│ change_order_number: 2               │
│ total: -$10,000                      │
└──────────────────────────────────────┘

VISTA contract_summary:
┌─────────────────────────────────────────┐
│ Original Contract:      $1,000,000      │
│ Approved Change Orders: +$40,000        │
│ Pending Change Orders:  +$5,000         │
│ REVISED CONTRACT VALUE: $1,040,000      │
│ Contract incl. Pending: $1,045,000      │
└─────────────────────────────────────────┘
```

---

## 📝 Notas de Arquitectura

### Flujo Completo Propuesto

```
1. COTIZACIÓN (quote)
   └── Cliente solicita presupuesto
   └── Se envía, se negocia
   
2. CONTRATO (contract) 
   └── Quote aprobada se convierte en contrato
   └── original_contract_value se CONGELA
   └── Se crean construction_tasks
   
3. CHANGE ORDERS (change_order)
   └── Durante la obra, surgen cambios
   └── Se crea CO vinculado al contrato
   └── revised_contract_value se actualiza
   
4. SCHEDULE OF VALUES (SOV)
   └── El contrato se desglosa en items facturables
   └── Cada período se actualiza el avance
   
5. OWNER INVOICES
   └── Cada mes se genera factura basada en SOV
   └── Cliente aprueba y paga
```

### Terminología

| Término SEENCEL | Término Procore | Descripción |
|-----------------|-----------------|-------------|
| Quote (quote) | Bid/Proposal | Cotización inicial |
| Quote (contract) | Prime Contract | Contrato firmado |
| Quote (change_order) | PCCO | Orden de cambio |
| client_payment | Owner Invoice | Factura al cliente |
| N/A | SOV | Schedule of Values |
| N/A | Application for Payment | AIA G702 |

---

## ✅ Checklist de Implementación

### Corto Plazo (Sprint 1-2) - CHANGE ORDERS
- [ ] Agregar `parent_quote_id` a tabla quotes
- [ ] Agregar `original_contract_value` a tabla quotes
- [ ] Agregar `change_order_number` a tabla quotes
- [ ] Crear vista `contract_with_cos_view`
- [ ] UI: Tab "Adicionales" en detalle de contrato
- [ ] UI: Botón "Nuevo Adicional" vinculado
- [ ] UI: KPIs de Original/Revised Value

### Mediano Plazo (Sprint 3-6) - SOV + INVOICES
- [ ] Extender quote_items con campos SOV
- [ ] Vista SOV en detalle de contrato
- [ ] Crear tabla owner_invoices
- [ ] Workflow de facturación mensual
- [ ] PDF estilo AIA G702

### Largo Plazo (Sprint 7+)
- [ ] Retenciones
- [ ] Versionado completo
- [ ] Firma electrónica
- [ ] Portal de clientes

---

## 🔗 Referencias

- [Procore Prime Contracts](https://support.procore.com/products/online/user-guide/project-level/prime-contracts)
- [Procore Change Orders](https://support.procore.com/products/online/user-guide/project-level/change-orders)
- [AIA G702 Application for Payment](https://www.aiacontracts.com/contract-documents/6017619-g702-2017)
- [Buildertrend Contracts](https://buildertrend.net/blog/managing-contracts/)

---

> **Conclusión:** El feature Quotes tiene buena base pero necesita urgentemente:
> 1. **Vincular Change Orders al contrato padre** (arquitectura actual es incorrecta)
> 2. **SOV y Owner Invoices** para facturación profesional
> 
> Sin estos dos cambios, no estamos al nivel de Procore/Buildertrend.
