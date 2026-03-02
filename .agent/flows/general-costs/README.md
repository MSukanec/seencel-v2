# Gastos Generales — Gestión de Gastos Operativos

> **Alcance**: Registrar, categorizar y analizar gastos generales de la organización (overhead) que no están asociados a proyectos específicos (luz, alquileres, seguros, etc.), con soporte para recurrencia, multi-moneda y allocations a proyectos.

## ¿Qué resuelve?

**Escenario**: Constructora Patagonia tiene gastos fijos mensuales — alquiler de oficina ($200.000 ARS), seguro ($45.000 ARS), y servicios como internet y telefonía. Carlos, el administrador, necesita:
1. Definir esos conceptos de gasto como recurrentes
2. Registrar cada pago mensual vinculándolo al concepto, la billetera y la moneda
3. Ver KPIs: cuánto se gasta por mes, cuál es la tendencia, qué categoría consume más
4. Filtrar pagos por fecha, estado y concepto
5. Exportar datos a Excel para el contador

Sin Gastos Generales, Carlos lleva todo en una planilla aparte y no tiene visibilidad del overhead real de la organización.

## Conceptos clave

| Concepto | Qué es | Tabla |
|----------|--------|-------|
| **Categoría** | Agrupación de gastos (ej: "Servicios", "Seguros") | `finance.general_cost_categories` |
| **Concepto** | Gasto específico recurrente o eventual (ej: "Alquiler Oficina") | `finance.general_costs` |
| **Pago** | Registro de un pago concreto vinculado a un concepto | `finance.general_costs_payments` |
| **Allocación** | Distribución porcentual de un pago a proyectos | `finance.general_cost_payment_allocations` |
| **Recurrencia** | Intervalo esperado del gasto (mensual, trimestral, etc.) | `general_costs.recurrence_interval` |
| **Día esperado** | Día del mes en que se espera el pago | `general_costs.expected_day` |

## Flujo resumido

```
Crear Categorías → Definir Conceptos → Registrar Pagos → Dashboard KPIs + Análisis
       ↓                 ↓                    ↓                    ↓
  general_cost      general_costs      general_costs        Vistas SQL:
  _categories     (is_recurring,       _payments          - payments_view
                  expected_day)      (wallet, moneda,     - monthly_summary
                                      estado, monto)      - by_category
                                          ↓
                                   payment_allocations
                                   (% por proyecto)
```

## Documentos en esta carpeta

| Archivo | Contenido |
|---------|-----------|
| [README.md](./README.md) | Este archivo — overview y conceptos |
| [user-journey.md](./user-journey.md) | Paso a paso del usuario con tablas y archivos |
| [technical-map.md](./technical-map.md) | Referencia técnica exhaustiva |
| [design-decisions.md](./design-decisions.md) | Decisiones, edge cases y relaciones |
| [roadmap.md](./roadmap.md) | Estado completado + pendientes accionables |
