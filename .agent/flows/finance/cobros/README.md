# Cobros (Ingresos de Clientes) — Flow Completo

> **Alcance**: Gestión del ciclo de vida completo de ingresos por clientes: desde el compromiso contractual, pasando por el cronograma de pagos, hasta el cobro efectivo y su reflejo en el ledger financiero unificado.

## ¿Qué resuelve?

**Escenario**: Juan es director de proyectos en una constructora. Tiene 2 obras activas: "Torre Mirador" y "Edificio Central". Para "Torre Mirador", tiene un contrato con el cliente "Inversiones Mendoza SRL" por $50,000,000 ARS. Juan necesita saber:

1. ¿Cuánto comprometió el cliente en total? (monto, moneda, método)
2. ¿Cuáles son las cuotas pactadas y cuándo vencen?
3. ¿Cuánto cobré hasta ahora? ¿Cuánto me deben aún?
4. ¿Cuál es el saldo por cobrar consolidado, por proyecto, por cliente?

El módulo de Cobros conecta el **Presupuesto/Contrato** (cuánto vale la obra) con los **Compromisos** (cuánto se acordó cobrar y cómo) con el **Cronograma** (cuándo se cobra cada cuota) con los **Pagos Efectivos** (cobros reales) y finalmente con el **Ledger Financiero Unificado** (balance global de la organización).

## Conceptos clave

| Concepto | Qué es | Tabla |
|----------|--------|-------|
| Cliente | Contacto vinculado a un proyecto con rol de cliente | `projects.project_clients` |
| Rol de Cliente | Clasificación del cliente (Comitente, Inversor, etc.) | `projects.client_roles` |
| Presupuesto/Contrato | Documento que define el valor de la obra pactado con el cliente | `finance.quotes` (con `quote_type = 'contract'`) |
| Orden de Cambio | Modificación al contrato original | `finance.quotes` (con `quote_type = 'change_order'`) |
| Compromiso | Acuerdo de pago entre org y cliente por un proyecto | `finance.client_commitments` |
| Método de Compromiso | Fijo (monto total) o por unidad (precio × cantidad) | `client_commitments.commitment_method` |
| Cuota (Schedule) | Fecha de vencimiento + monto pactado de una porción del compromiso | `finance.client_payment_schedule` |
| Cobro (Payment) | Registro de un pago efectivamente recibido del cliente | `finance.client_payments` |
| Resumen Financiero | Vista consolidada: comprometido vs cobrado vs saldo | `finance.client_financial_summary_view` |
| Movimiento Financiero | Reflejo del cobro en el ledger unificado de la organización | `finance.movements` |

## Flujo resumido

```
Presupuestos          Clientes            Compromisos           Cobros
────────────────    ────────────────    ────────────────    ────────────────

  quotes (contract)  project_clients    client_commitments   client_payments
       ↓                  ↓                   ↓                   ↓
  quote_items         client_roles      client_payment_      client_payments_
       ↓                                schedule              view
  change_orders                              ↓
       ↓                              client_financial_      movements
  contract_summary_                    summary_view           (ledger)
  view                                       ↓
                                      unified_financial_
                                      movements_view
```

## Relación entre entidades

```
contacts ──→ project_clients ──→ client_commitments ──→ client_payment_schedule
                                        │                        │
                                        ├── quote_id ←── quotes  │
                                        │                        │
                                        └── client_payments ←────┘
                                                │
                                                └── movements (ledger unificado)
```

## Documentos en esta carpeta

| Archivo | Contenido |
|---------|-----------|
| [README.md](./README.md) | Este archivo — overview y conceptos |
| [user-journey.md](./user-journey.md) | Paso a paso de cada funcionalidad |
| [technical-map.md](./technical-map.md) | Referencia técnica exhaustiva |
| [design-decisions.md](./design-decisions.md) | Decisiones de diseño, edge cases y relaciones |
| [roadmap.md](./roadmap.md) | Estado actual, pendientes y visión competitiva |
