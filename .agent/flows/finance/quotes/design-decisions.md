# Design Decisions: Quotes

> Decisiones de diseño, alternativas descartadas, edge cases y relaciones con otros flows.

---

## Decisiones de Diseño

### D1: Tabla unificada para Quotes, Contratos y Change Orders

**Elegimos**: Una sola tabla `finance.quotes` con `quote_type` discriminador (`quote`, `contract`, `change_order`).

**Alternativa descartada**: Tablas separadas `contracts`, `change_orders`, etc.

**Razón**: Los tres tipos comparten el 95% de la estructura (items, status, montos, cliente, proyecto). Usar `quote_type` simplifica queries, vistas y RLS. Los COs se vinculan via `parent_quote_id` → self-FK. Esta es la misma arquitectura que usa Procore internamente.

---

### D2: Effective Unit Price dual (live vs snapshot)

**Elegimos**: La vista `quotes_items_view` calcula `effective_unit_price` como `CASE WHEN quote.status = 'draft' THEN live_unit_price ELSE unit_price END`.

**Alternativa descartada**: Copiar siempre el precio al crear el item y requerir "actualizar precios" manualmente.

**Razón**: En draft, los precios deben reflejar el catálogo actual (si actualizás el precio del ladrillo, todos los presupuestos en borrador se actualizan automáticamente). Al enviar/aprobar, los precios se congelan para que el contrato sea inmutable. Este es el patrón estándar de la industria.

---

### D3: Cost Scope a nivel de item

**Elegimos**: Cada `quote_item` tiene su propio `cost_scope` (`materials_and_labor` o `labor_only`).

**Alternativa descartada**: Un `cost_scope` global para todo el presupuesto.

**Razón**: En construcción, algunos items solo requieren M.O. (ej: limpieza, demolición) mientras otros requieren materiales + M.O. (ej: albañilería). Tener granularidad por item permite presupuestos más precisos.

---

### D4: Inline editing con optimistic updates

**Elegimos**: `InlineEditableCell` (borde dashed) + `useOptimisticList` para Cantidad, Margen y Alcance.

**Alternativa descartada**: Abrir panel/modal para cada edición.

**Razón**: En presupuestos de 50+ items, abrir un panel por cada cambio de cantidad o margen es extremadamente lento. El inline editing con `dashed border` (patrón de `CatalogValueButton`) permite flujo rápido. El optimistic update garantiza que los subtotales, incidencias y KPIs se recalculen al instante.

---

### D5: Grouping por Rubro en la tabla de items

**Elegimos**: DataTable con `groupBy="division"` + `getGroupValue` custom para agrupar items por `division_name`.

**Alternativa descartada**: Tabla plana sin agrupación.

**Razón**: En presupuestos de construcción, los items siempre se agrupan por rubro/división (Albañilería, Carpintería, etc.). El group header muestra el subtotal y la incidencia (%) de cada rubro vs el total.

---

### D6: Snapshot de costos al enviar (no al aprobar)

**Elegimos**: Los costos se congelan en `unit_price`, `snapshot_mat_cost`, `snapshot_lab_cost`, `snapshot_ext_cost` al cambiar estado a `sent`.

**Alternativa descartada**: Congelar al aprobar.

**Razón**: Al enviar al cliente, el precio debe quedar fijo — si el catálogo cambia mientras el cliente evalúa, sería inconsistente. La aprobación posterior no modifica precios, solo confirma.

---

### D7: Change Orders como self-referencing FK

**Elegimos**: `parent_quote_id` FK → `quotes.id` + `change_order_number` secuencial.

**Alternativa descartada**: Tabla separada `change_orders` con relación M:1 a `quotes`.

**Razón**: Un CO es esencialmente un mini-presupuesto con la misma estructura. Reusamos toda la infra de quotes (items, vistas, cálculos, PDF, aprobación). El `parent_quote_id` permite calcular `revised_contract_value` en `contract_summary_view` con un simple subquery.

---

### D8: Vistas SECURITY DEFINER

**Elegimos**: `quotes_view`, `quotes_items_view` y `contract_summary_view` son `SECURITY DEFINER`.

**Alternativa descartada**: `SECURITY INVOKER` con RLS en todas las tablas referenciadas.

**Razón**: Las vistas hacen JOINs cross-schema (catalog, projects, contacts, finance). Con INVOKER, cada JOIN requeriría RLS en cada tabla referenciada, complicando la cadena de permisos. Con DEFINER, las vistas acceden a las tablas directamente y el filtrado de seguridad se aplica a nivel de `organization_id` en las queries del frontend.

> ⚠️ **Gotcha**: Esto significa que la seguridad depende 100% de que los queries filtren por `organization_id`. Si algún query olvida este filtro, podría exponer datos de otras organizaciones.

---

## Edge Cases y Gotchas

### E1: autoHideEmptyColumns oculta columna Margen

**Escenario**: Todos los items tienen `markup_pct = 0` → la DataTable oculta la columna automáticamente.

**Impacto**: La columna Margen desaparece del UI sin aviso.

**Solución aplicada**: Agregar `"markup_pct"` a `autoHideExcludeColumns` en el DataTable del `quote-base-view.tsx`.

**Lección**: Siempre agregar columnas editables a `autoHideExcludeColumns` cuando se usa `autoHideEmptyColumns`.

---

### E2: Subtotal usa row.original en vez de accessorFn

**Escenario**: Al usar `createMoneyColumn` con `accessorFn`, la celda renderiza el valor de `row.original[accessorKey]` ignorando el `accessorFn`.

**Impacto**: El Subtotal mostraba el costo unitario en vez de `quantity × cost × (1 + margin)`.

**Solución aplicada**: Columna custom con `cell` que llama a `getItemSubtotal()` directamente.

**Lección**: `createMoneyColumn` no soporta `accessorFn` — para campos calculados, crear columna custom.

---

### E3: Timezone en fechas (quote_date, valid_until)

**Escenario**: Si se guarda con `new Date("2026-01-30")`, en timezone Argentina (UTC-3) muestra el día anterior.

**Impacto**: Fechas off-by-one.

**Solución**: Usar `parseDateFromDB()` y `formatDateForDB()` de `@/lib/timezone-data` (ver regla `dates-and-timezones.md`).

---

### E4: FEATURE.md desactualizado

**Escenario**: El `FEATURE.md` en `src/features/quotes/FEATURE.md` fue escrito antes de implementar Change Orders. Marca `parent_quote_id`, `original_contract_value` y `change_order_number` como "NO EXISTE" cuando ya existen en la DB y el frontend.

**Impacto**: Confusión si se lee como referencia.

**Solución futura**: Actualizar o reemplazar `FEATURE.md` con este flow como fuente de verdad.

---

### E5: Vistas DEFINER implican riesgo de seguridad

**Escenario**: Si un query no filtra por `organization_id`, las vistas DEFINER devuelven datos de todas las organizaciones.

**Impacto**: Filtración de datos cross-org.

**Solución futura**: Migrar vistas a `SECURITY INVOKER` y asegurar RLS en todas las tablas referenciadas.

---

## Relación con otros Flows

| Flow relacionado | Cómo se conecta |
|------------------|-----------------|
| **Catálogo de Tareas** | `quote_items.task_id` → `catalog.tasks`, `recipe_id` → recetas. Los costos vivos vienen de `catalog.task_recipes_view` |
| **Cobros de Clientes** | `generateCommitmentsFromQuote()` crea `finance.client_commitments` + schedule |
| **Tareas de Obra** | `approveQuote()` crea `projects.construction_tasks` desde items |
| **Proyectos** | `convertQuoteToProject()` crea proyecto desde el quote |
| **Finanzas** | `client_commitments.quote_id` FK → `finance.quotes` para trazabilidad pagos ↔ presupuesto |
| **Contactos** | `quotes.client_id` FK → `contacts.contacts` para vincular al cliente |
