# Design Decisions: Gastos Generales

> Decisiones de diseño, alternativas descartadas, edge cases y relaciones.

---

## Decisiones de Diseño

### D1: Gastos Generales vs Movimientos Financieros
- **Elegimos**: Módulo separado (`finance.general_costs*`) con su propio CRUD, independiente de `finance.movements`
- **Alternativa descartada**: Usar la tabla `movements` existente con un tipo `general_cost`
- **Razón**: Los gastos generales tienen lógica propia (recurrencia, allocations a proyectos, categorías jerárquicas) que no encaja en el modelo genérico de movimientos. Separar permite evolucionar sin contaminar la tabla de movimientos.

### D2: Categorías org-owned (sin is_system)
- **Elegimos**: Categorías pertenecen a la organización. Se migró de `is_system=true` a org-owned (Marzo 2026)
- **Anterior**: Categorías system pre-cargadas que el usuario no podía editar/eliminar
- **Razón**: Simplifica el modelo, da control total al usuario. Las categorías iniciales se migran una vez a la org.

### D3: Concepto → Pago (relación 1:N)
- **Elegimos**: Un concepto puede tener muchos pagos. Un pago se vincula a un solo concepto.
- **Alternativa descartada**: Pagos sueltos sin concepto obligatorio
- **Razón**: `general_cost_id` es nullable en pagos, permitiendo pagos sin concepto. Pero el flujo natural es Concepto → Pagos.

### D4: Allocations por porcentaje
- **Elegimos**: Tabla `general_cost_payment_allocations` con `project_id` + `percentage`
- **Alternativa descartada**: Campo `project_id` directo en el pago (vinculación 1:1)
- **Razón**: Un gasto general (ej: alquiler oficina) puede distribuirse entre múltiples proyectos. La tabla de allocations permite N proyectos con % variable.

### D5: Forms en Panel ✅
- **Estado**: Los 3 forms usan `openPanel` + `setPanelMeta` + Field Factories (Marzo 2026)
- Categoría → `FolderOpen` / sm
- Concepto → `FileText` / md
- Pago → `Receipt` / lg con attachments

### D6: Navegación cross-tab Concepto → Pagos (client-side)
- **Elegimos**: Click programático en tab trigger + `CustomEvent` (`general-costs:navigate-payments`) para comunicar el search query al `PaymentsView`
- **Alternativa descartada**: `window.location.href` con recarga completa de página
- **Razón**: Evita round-trip al servidor, transición instantánea. El `PaymentsView` escucha el evento y setea `filters.setSearchQuery()`.

### D7: Conceptos como Accordion (no DataTable)
- **Elegimos**: Accordion por categoría con `GeneralCostListItem` mostrando stats de pago
- **Alternativa descartada**: DataTable plano con columnas
- **Razón**: Los conceptos se entienden mejor agrupados por categoría. El accordion muestra resumen visual (total por categoría, %) y permite crear conceptos dentro de cada sección.

### D8: Categorías desde toolbar de Conceptos (no Settings)
- **Elegimos**: Split button en toolbar de Conceptos: acción principal "Nuevo Concepto" + popover "..." con "Nueva Categoría"
- **Anterior**: Gestión de categorías en tab Ajustes con `SettingsSection` + `CategoryListItem`
- **Razón**: Las categorías se usan directamente al crear conceptos. Tenerlas en el mismo lugar reduce fricción. Tab Ajustes queda libre para configuraciones futuras.

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

### E4: Inline editing ✅
- **Estado**: Implementado con `updateGeneralCostPaymentField()` server action (Marzo 2026)
- Campos editables: fecha (DatePicker), estado (Command), billetera (Command con resolución wallet_name → wallet_id)

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
