# Design Decisions: Materiales

> Por qué se hizo así, alternativas descartadas, edge cases y relaciones.

---

## Decisiones de Diseño

### D1: Doble tabla de precios (organization_material_prices + material_prices)
- **Elegimos**: `organization_material_prices` para lectura rápida del precio actual, `material_prices` para historial temporal con `valid_from`/`valid_to`
- **Alternativa descartada**: Una sola tabla con precio "vigente" (sin historial)
- **Razón**: El historial de precios es crítico para auditoría y para comparar presupuesto vs real. `organization_material_prices` evita queries complejas de "precio vigente" en cada listado

### D2: Materiales compartidos (is_system) vs organizacionales
- **Elegimos**: Los materiales pueden ser `is_system=true` (visibles para todos, solo admin crea) o por organización
- **Alternativa descartada**: Solo materiales por organización
- **Razón**: Una constructora nueva necesita un catálogo base de materiales comunes (cemento Portland, hierro 4.2mm, etc.) sin tener que crearlos desde cero

### D3: Snapshot pattern para recetas en obra
- **Elegimos**: Al crear una tarea de obra, las cantidades de materiales se "congelan" en `construction_task_material_snapshots`
- **Alternativa descartada**: Siempre leer en vivo desde `task_recipe_materials`
- **Razón**: Si alguien actualiza la receta de una tarea en el catálogo, las obras ya en curso NO deben verse afectadas. El presupuesto se hizo con las cantidades del snapshot

### D4: Precios solo en catálogo, no en snapshots
- **Elegimos**: Los snapshots guardan solo CANTIDADES. Los precios vienen de `quote_items.unit_price` (presupuesto) y `material_payments.amount` (real)
- **Alternativa descartada**: Guardar precio congelado en el snapshot
- **Razón**: El precio al momento del presupuesto puede ser distinto al precio al momento de comprar. Son dos datos con ciclos de vida diferentes

### D5: PO → Invoice → Payment como cadena opcional
- **Elegimos**: La cadena es opcional en cada eslabón. Puedes crear un pago sin factura, o una factura sin PO
- **Alternativa descartada**: Cadena obligatoria (no pago sin factura, no factura sin PO)
- **Razón**: Muchos proveedores de construcción en LATAM trabajan informalmente. Exigir la cadena completa bloquearía a usuarios reales. A futuro, el 3-way match será opcional pero recomendado

### D6: Material Types como tabla separada (no enum)
- **Elegimos**: `material_types` como tabla con `organization_id` (cada org define sus tipos)
- **Alternativa descartada**: Enum en DB o columna `material_type` (text)
- **Razón**: Nota: AMBOS existen. `materials.material_type` (text, legacy: 'material'/'insumo') y `material_types` (tabla extensible). La tabla permite que cada org personalice su clasificación

### D7: Catálogo distribuido (visible desde proyectos)
- **Elegimos**: El catálogo técnico se muestra como read-only tab dentro de la vista de proyecto
- **Alternativa descartada**: Solo accesible desde `/organization/materials`
- **Razón**: Los project managers necesitan consultar materiales disponibles mientras están gestionando un proyecto, sin navegar a otra página

### D8: functional_amount en pagos de materiales
- **Elegimos**: Al crear un pago, se calcula `functional_amount = amount × exchange_rate` en la moneda funcional de la org
- **Alternativa descartada**: Solo guardar amount y currency, calcular functional al mostrar
- **Razón**: Alineamiento con el ledger de costos generales. Los KPIs del dashboard necesitan sumar montos en una sola moneda sin recalcular TC en cada render

### D9: Precios de materiales de sistema (inteligencia colectiva)
- **Elegimos**: Cada organización puede ponerle SU propio precio a cualquier material de sistema. Los materiales de sistema aparecen mezclados con los de la org en el catálogo.
- **Alternativa descartada**: Los materiales de sistema son read-only sin precio. Si querés preciarlos, copiá a tu catálogo.
- **Razón**: Habilita la **inteligencia colectiva de precios**. A futuro, Seencel puede calcular un "Precio promedio Seencel" por material, indexado por región/fecha. Esto es un diferenciador competitivo: ningún competidor ofrece crowdsourced pricing para construcción.
- **Impacto técnico**: La vista `materials_view` necesita buscar precios por `organization_id del usuario`, no `m.organization_id` (que es NULL para system materials). La tabla `material_prices` ya soporta esto (tiene `organization_id` como columna propia).

---

## Edge Cases y Gotchas

### E1: Materiales sin categoría
- **Escenario**: Materiales importados masivamente pueden no tener categoría asignada
- **Impacto**: El sidebar muestra un nodo "Sin categoría" con conteo
- **Solución**: Funciona hoy. A futuro: sugerir categoría por AI según nombre

### E2: Duplicación en imports masivos
- **Escenario**: Import de 200 materiales y 30 ya existen con el mismo nombre/código
- **Impacto**: El sistema detecta conflictos y pregunta: crear nuevo, reemplazar, o ignorar
- **Solución**: Funciona hoy via Import System (Standard 3.5)

### E3: Eliminación de material usado en recetas
- **Escenario**: Se intenta borrar un material que está vinculado a `task_recipe_materials`
- **Impacto**: Soft delete. Si se proporciona `replacementId`, las referencias se actualizan
- **Solución**: `deleteMaterial(id, replacementId)` maneja el reemplazo

### E4: PO sin items
- **Escenario**: Se crea una PO vacía (como borrador) para completar después
- **Impacto**: La PO se guarda con `status=draft` y `subtotal=0`
- **Solución**: Funciona hoy. El status `draft` indica que no está lista

### E5: Moneda inconsistente entre PO y pago
- **Escenario**: PO en USD, pago en ARS
- **Impacto**: Hoy NO se valida. Ambos registros tienen su propio `currency_id`
- **Solución futura**: El 3-way match debería alertar inconsistencias de moneda

### E6: Precios con vencimiento
- **Escenario**: `material_prices.valid_to` ya pasó, pero es la última entrada
- **Impacto**: La vista `materials_view` podría mostrar un precio desactualizado
- **Solución futura**: Alerta visual de "precio vencido" en el catálogo

### E7: Cross-schema en queries
- **Escenario**: Queries que necesitan datos de `catalog.materials` + `finance.material_payments`
- **Impacto**: PostgREST no soporta embeds cross-schema
- **Solución**: Queries separadas por schema con enrichment manual (patrón aplicado en Feb 2026)

---

## Relación con otros Flows

| Flow relacionado | Cómo se conecta |
|-----------------|-----------------|
| **Catálogo de Tareas** | `task_recipe_materials` vincula materiales a recetas de tareas |
| **Construcción/Obras** | `construction_task_material_snapshots` congela cantidades de materiales al crear tareas de obra |
| **Contactos** | `default_provider_id` en materials y `provider_id` en POs/facturas referencian contactos |
| **Finanzas** | Pagos de materiales son movimientos financieros con wallet, moneda y TC |
| **Cotizaciones/Quotes** | `quote_items` pueden incluir costos de materiales por tarea |
| **Import System** | Importación masiva de materiales via Excel |
| **Multi-moneda** | Precios, POs, facturas y pagos soportan múltiples monedas con TC |
