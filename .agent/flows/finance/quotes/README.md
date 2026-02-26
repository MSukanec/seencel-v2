# Presupuestos, Contratos y Adicionales (Quotes)

> **Alcance**: Ciclo de vida completo de cotizaciones, contratos y órdenes de cambio para proyectos de construcción. Incluye creación, edición inline, aprobación, congelamiento de precios (snapshot), conversión a proyecto/contrato y generación de compromisos de pago.

## ¿Qué resuelve?

**María** es project manager en Constructora Seencel. Un cliente le pide un presupuesto para una obra. María:

1. Crea un **Presupuesto** (quote) con items del catálogo de tareas (ej: "Muro de Ladrillos", "Contrapiso")
2. Cada item toma el **costo vivo** de la receta del catálogo (materiales + mano de obra)
3. Aplica un **margen** del 15% por item y un **descuento** global del 5%
4. Envía el presupuesto al cliente → status cambia a `sent` y los **precios se congelan** (snapshot)
5. El cliente aprueba → el presupuesto se convierte en **Contrato** con `original_contract_value` inmutable
6. Durante la obra, surgen cambios → María crea **Adicionales** (Change Orders) vinculados al contrato
7. El `revised_contract_value` del contrato se actualiza automáticamente

## Conceptos clave

| Concepto | Qué es | Tabla/Vista |
|----------|--------|-------------|
| **Quote (Cotización)** | Presupuesto en borrador o enviado | `finance.quotes` (`quote_type = 'quote'`) |
| **Contract (Contrato)** | Quote aprobada, convertida | `finance.quotes` (`quote_type = 'contract'`) |
| **Change Order (Adicional)** | Modificación vinculada a un contrato | `finance.quotes` (`quote_type = 'change_order'`, `parent_quote_id`) |
| **Quote Item** | Línea del presupuesto (tarea + cantidad + costo + margen) | `finance.quote_items` |
| **Effective Unit Price** | Costo vivo (draft) o congelado (sent/approved) | `finance.quotes_items_view.effective_unit_price` |
| **Cost Scope** | Qué incluye el costo: Mat.+M.O. o Solo M.O. | `finance.quote_items.cost_scope` |
| **Snapshot** | Costos congelados al enviar/aprobar | `snapshot_mat_cost`, `snapshot_lab_cost`, `snapshot_ext_cost` |
| **Contract Summary** | Resumen del contrato con COs agregados | `finance.contract_summary_view` |

## Flujo resumido

```
Crear Quote (draft) ──→ Agregar Items ──→ Enviar (sent) ──→ Aprobar ──→ Convertir a Contrato
     │                    │                    │                │              │
     │                    ▼                    ▼                ▼              ▼
     │              Items con costos     Snapshot precios   Crea tareas    Congela
     │              vivos del catálogo   se congelan        de obra        original_value
     │                                                                         │
     │                                                                         ▼
     │                                                              Crear Change Orders
     │                                                              (Adicionales)
     ▼                                                                         │
Generar Compromisos                                                            ▼
(cuotas de pago)                                                     revised_contract_value
```

## Documentos en esta carpeta

| Archivo | Contenido |
|---------|-----------|
| [README.md](file:///c:/Users/Usuario/Seencel/seencel-v2/.agent/flows/finance/quotes/README.md) | Este archivo — overview y conceptos |
| [user-journey.md](file:///c:/Users/Usuario/Seencel/seencel-v2/.agent/flows/finance/quotes/user-journey.md) | Paso a paso del usuario con tablas y archivos |
| [technical-map.md](file:///c:/Users/Usuario/Seencel/seencel-v2/.agent/flows/finance/quotes/technical-map.md) | Referencia técnica exhaustiva |
| [design-decisions.md](file:///c:/Users/Usuario/Seencel/seencel-v2/.agent/flows/finance/quotes/design-decisions.md) | Decisiones, edge cases, relaciones |
| [roadmap.md](file:///c:/Users/Usuario/Seencel/seencel-v2/.agent/flows/finance/quotes/roadmap.md) | Estado completado + pendientes |
