# Design Decisions: Gastos Generales

> Decisiones de diseño, alternativas descartadas, edge cases y relaciones.

---

## Decisiones de Diseño

### D1: Gastos Generales vs Movimientos Financieros
- **Elegimos**: Módulo separado (`finance.general_costs*`) con su propio CRUD, independiente de `finance.movements`
- **Alternativa descartada**: Usar la tabla `movements` existente con un tipo `general_cost`
- **Razón**: Los gastos generales tienen lógica propia (recurrencia, allocations a proyectos, categorías jerárquicas) que no encaja en el modelo genérico de movimientos. Separar permite evolucionar sin contaminar la tabla de movimientos.

### D2: Categorías con is_system
- **Elegimos**: Categorías system pre-cargadas (`is_system = true`) que el usuario no puede editar/eliminar
- **Alternativa descartada**: Solo categorías custom
- **Razón**: Da un punto de partida útil a organizaciones nuevas sin obligar a configurar desde cero.

### D3: Concepto → Pago (relación 1:N)
- **Elegimos**: Un concepto puede tener muchos pagos. Un pago se vincula a un solo concepto.
- **Alternativa descartada**: Pagos sueltos sin concepto obligatorio
- **Razón**: `general_cost_id` es nullable en pagos, permitiendo pagos sin concepto. Pero el flujo natural es Concepto → Pagos.

### D4: Allocations por porcentaje
- **Elegimos**: Tabla `general_cost_payment_allocations` con `project_id` + `percentage`
- **Alternativa descartada**: Campo `project_id` directo en el pago (vinculación 1:1)
- **Razón**: Un gasto general (ej: alquiler oficina) puede distribuirse entre múltiples proyectos. La tabla de allocations permite N proyectos con % variable.

### D5: Forms en Dialog (legacy, pendiente migración)
- **Elegimos (estado actual)**: Los 3 forms usan `Dialog` (modal)
- **Mejor opción**: Migrar a `Panel` (drawer) según Rule 5 del proyecto
- **Razón del estado actual**: Fueron creados previo al estándar de Panel forms. Migración pendiente.

---

## Edge Cases y Gotchas

### E1: Pago sin concepto vinculado
- **Impacto**: `general_cost_id` es nullable. Un pago puede existir sin concepto. En la UI se muestra "-" en la columna Concepto.
- **Solución futura**: Evaluar si forzar concepto obligatorio o mantener flexibilidad.

### E2: Categorías sin gastos
- **Impacto**: Una categoría puede existir sin conceptos asociados. No rompe nada pero ocupa espacio visual en Ajustes.
- **Solución futura**: Mostrar contador de conceptos por categoría y dar opción de limpiar categorías vacías.

### E3: Recurrencia es solo informativa
- **Impacto**: `is_recurring`, `recurrence_interval` y `expected_day` son campos informativos. **No hay automatización**: el sistema no genera pagos automáticamente ni alerta si un pago recurrente no se registró.
- **Solución futura**: Alertas de "pago vencido" y opcionalmente auto-generación de pagos pendientes.

### E4: Inline editing parcial
- **Impacto**: El handler `handleInlineUpdate` en `payments-view.tsx` existe pero muestra "Edición inline próximamente" (es un TODO). El frontend ya tiene las columnas editables conectadas pero el backend no actualiza el campo.
- **Solución futura**: Implementar `updateGeneralCostPaymentField()` server action para actualizar campos individuales.

### E5: Allocations sin UI
- **Impacto**: La tabla `general_cost_payment_allocations` existe y tiene RLS, pero no hay form, view ni action para gestionarla. La funcionalidad de distribuir gastos entre proyectos no está disponible desde la UI.
- **Solución futura**: Agregar UI de allocations en el form de pago o como sección expandible en el detalle del pago.

---

## Relación con otros Flows

| Flow relacionado | Cómo se conecta |
|------------------|-----------------|
| **Finanzas (Movimientos)** | Los pagos de gastos generales aparecen como movimientos tipo `general_cost` en el ledger unificado. Usan la misma vista SQL `unified_ledger_view`. |
| **Proyectos** | Via `payment_allocations` se pueden distribuir gastos a proyectos. Hoy sin UI. |
| **Billeteras** | Los pagos se vinculan a `organization_wallets` para tracking de salida de dinero. |
| **Multi-moneda** | Cada pago tiene `currency_id` + `exchange_rate`. Dashboard agrega en moneda funcional. |
| **Insights** | `generateGeneralCostsInsights()` analiza patrones, concentración y tendencias de gastos. |
