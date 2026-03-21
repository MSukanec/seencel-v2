# Sistema de Inteligencia Artificial — Seencel V2

> **Última actualización**: 20 Marzo 2026  
> **Estado**: ✅ MVP Funcional — Sugerencia de Recetas con IA

---

## ¿Qué resuelve?

Permite que un usuario, al estar editando una **receta de tarea de construcción**, le pida a la IA que sugiera materiales y mano de obra con cantidades estimadas, basándose en:
- Nombre, unidad y rubro de la tarea
- Catálogo real de materiales y mano de obra de la organización
- Contexto libre que el usuario puede agregar (zona climática, tipo de edificación, etc.)

La IA matchea contra el catálogo real y devuelve items con `catalogId` cuando hay coincidencia, listos para agregar con 1 click.

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────────┐
│  FRONTEND (Panel de IA en receta)                       │
│  tasks-recipe-ai-form.tsx → RecipeSuggestionPanel       │
│  Footer dinámico: "Sugerir con IA" → "Agregar todos"    │
└───────────────┬─────────────────────────────────────────┘
                │ Server Action
                ▼
┌─────────────────────────────────────────────────────────┐
│  BACKEND (Server Actions)                               │
│  ai/actions.ts → suggestRecipe()                        │
│  ai/ai-services.ts → checkAIUsageLimits()               │
│  ai/ai-client.ts → chatCompletion() (OpenAI)            │
│  ai/prompts/recipe-suggester.ts → buildRecipePrompt()   │
└───────────────┬─────────────────────────────────────────┘
                │ SQL (via Supabase)
                ▼
┌─────────────────────────────────────────────────────────┐
│  DATABASE (Schema: ai)                                  │
│  ai_organization_usage_limits → Límites por plan        │
│  ai_usage_logs → Log de tokens y costos                 │
│  ai_import_mapping_patterns → Patrones de imports       │
│  ai_import_value_patterns → Equivalencias de valores    │
└─────────────────────────────────────────────────────────┘
```

---

## Tablas (Schema `ai`)

| Tabla | Propósito | Estado |
|-------|-----------|--------|
| `ai_organization_usage_limits` | Límites de requests/tokens por org según plan | ✅ Activa |
| `ai_usage_logs` | Log de cada llamada (tokens, costo USD, tipo) | ✅ Activa |
| `ai_import_mapping_patterns` | Inteligencia colectiva de imports (org-level) | ✅ Activa |
| `ai_import_value_patterns` | Equivalencias de valores en imports | ✅ Activa |

### Detalle: `ai_organization_usage_limits`
- FK: `organization_id → organizations`
- `plan`: slug del plan (free/starter/professional/enterprise)
- `daily_requests_limit` + `requests_used_today`: rate limiting diario
- `monthly_tokens_limit` + `tokens_used_this_month`: cuota mensual
- Auto-reset diario vía lógica en `checkAIUsageLimits()`
- Los límites se obtienen del JSON `features` del plan en `plans.features.ai_daily_requests_limit` y `ai_monthly_tokens_limit`
- `-1` = sin límite (enterprise)

### RLS
- `SELECT`: owner ve su org, admin puede ver todo
- `INSERT`: la policy permite insertar en `ai_usage_logs` a usuarios autenticados con org match

---

## Archivos Frontend

### Feature `src/features/ai/`

| Archivo | Propósito |
|---------|-----------|
| `ai-client.ts` | Singleton OpenAI, función `chatCompletion()` genérica |
| `ai-services.ts` | `checkAIUsageLimits()` — valida rate limits, lee plan, auto-reset diario |
| `actions.ts` | Server Actions: `suggestRecipe()`, `analyzeExcelStructure()` |
| `ai-catalog-actions.ts` | `getOrganizationCatalogs()` — fetch paralelo de materiales + MO para el prompt |
| `types.ts` | Tipos: `AIRecipeSuggestion`, `AIRecipeSuggestedMaterial`, `AIRecipeSuggestedLabor` |
| `prompts/recipe-suggester.ts` | `buildRecipePrompt()` — construye el prompt con catálogo + parámetros |
| `prompts/import-analyzer.ts` | Prompt para análisis de estructura Excel (import bulk) |
| `components/recipe-suggestion-panel.tsx` | Panel de UI con items de sugerencia (forwardRef, expone `suggest()`) |
| `views/ai-settings-view.tsx` | Vista de configuración de IA en Settings |

### Form de IA en Tareas

| Archivo | Propósito |
|---------|-----------|
| `tasks/forms/tasks-recipe-ai-form.tsx` | Panel dedicado de IA, registrado como `recipe-ai-form` |
| `tasks/views/detail/tasks-recipe-detail-view.tsx` | Vista de receta que tiene el botón Sparkles que abre el panel |

---

## User Journey: Sugerencia de Receta

### Escenario
María, coordinadora de proyectos, está editando la receta de "Contrapiso de hormigón" (unidad: M2). Quiere que la IA sugiera qué materiales y mano de obra necesita.

### Paso 1: Abrir panel de IA
- Click en botón ✨ (Sparkles) en la cabecera de la receta
- Se abre panel con: texto explicativo + textarea de contexto + footer "Sugerir con IA"
- **Archivo**: `tasks-recipe-detail-view.tsx` → `openPanel("recipe-ai-form", { recipeId, taskContext })`

### Paso 2: Agregar contexto (opcional)
- María escribe: "Zona costera, alta humedad"
- Es un textarea libre, no hay form ni label pesado

### Paso 3: Sugerir con IA
- Click en footer "Sugerir con IA" → dispara `panelRef.current.suggest()`
- `RecipeSuggestionPanel` llama a `suggestRecipe()` (server action)
- **Flujo del action**:
  1. `checkAIUsageLimits()` → valida que no exceda límite diario/mensual
  2. `buildRecipePrompt()` → construye prompt con catálogo real de la org
  3. `chatCompletion()` → llama a OpenAI (modelo gpt-4o-mini)
  4. Parsea response JSON → devuelve `AIRecipeSuggestion`
  5. Registra uso en `ai_usage_logs` + incrementa `requests_used_today`

### Paso 4: Revisar sugerencia
- Panel muestra secciones de Materiales y Mano de Obra
- Cada item indica: nombre, cantidad (con unidad en mayúsculas), % desperdicio, match/no match
- Items con match muestran botón verde ✓ para agregar individualmente
- Items sin match muestran botón "Crear" para crear en catálogo y agregar

### Paso 5: Agregar todos
- Footer cambia a "Agregar todos a la receta"
- Click → agrega todos los items matcheados vía `addRecipeMaterial()` / `addRecipeLabor()`
- Cierra el panel → receta se actualiza

---

## Decisiones de Diseño

### D1: Límites por organización (no por usuario)
- **Elegimos**: `ai_organization_usage_limits` con FK a `organizations`
- **Alternativa descartada**: Límites por usuario (`ia_user_usage_limits`, tabla legacy eliminada)
- **Razón**: El plan se suscribe por organización, no por usuario. Dos usuarios de la misma org comparten cuota.

### D2: Modelo gpt-4o-mini para recetas
- **Elegimos**: `gpt-4o-mini` (rápido, barato: ~$0.001 por request)
- **Alternativa descartada**: `gpt-4o` (10x más caro)
- **Razón**: La sugerencia de recetas no requiere razonamiento complejo, solo matching de catálogo y sentido común constructivo.

### D3: Footer dinámico en vez de botón inline
- **Elegimos**: Footer del panel cambia de "Sugerir con IA" a "Agregar todos a la receta"
- **Alternativa descartada**: Botón inline en el body del panel
- **Razón**: Patrón consistente con otros panels de Seencel. Un solo punto de acción principal.

### D4: Catálogo real en el prompt
- **Elegimos**: Pasar catálogo completo de materiales + MO como contexto al prompt
- **Alternativa descartada**: Solo nombres genéricos y matchear después
- **Razón**: La IA puede devolver `catalogId` directamente, permitiendo agregar en 1 click sin matching post-hoc.

### D5: forwardRef para trigger externo
- **Elegimos**: `RecipeSuggestionPanel` usa `forwardRef` + `useImperativeHandle` para exponer `suggest()`
- **Razón**: El footer del panel (manejado por el form padre) necesita disparar la sugerencia. Sin ref, habría que subir todo el estado de la IA al padre.

---

## Edge Cases y Gotchas

### E1: Unidades inventadas por la IA
- **Impacto**: La IA puede devolver unidades que no coinciden con las del catálogo (ej: "hh" en vez de "H")
- **Solución actual**: `.toUpperCase()` en el render para normalizar visualmente
- **Solución futura**: Usar la unidad real del catálogo matcheado en vez de la que inventa la IA

### E2: Rate limit exhausto
- **Impacto**: `checkAIUsageLimits()` retorna error con mensaje claro
- **Comportamiento**: Se muestra en panel como error, usuario no puede sugerir hasta reset

### E3: Sin suscripción activa
- **Impacto**: Si no hay suscripción, se usan defaults (free: 10 daily, 50000 tokens)
- **Comportamiento**: Funciona con límites free

### E4: Catálogo vacío
- **Impacto**: La IA sugiere items genéricos sin `catalogId`
- **Comportamiento**: Items aparecen como "No encontrado" con opción de crear

---

## SQL Scripts Ejecutados

| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `DB/03_ai_organization_tracking.sql` | Crear tabla `ai_organization_usage_limits` | ✅ Ejecutado |
| `DB/40_ai_clean_up.sql` | Limpiar tablas legacy (ia_user_*, ia_messages, etc.) | ✅ Ejecutado |
| `DB/42_ai_usage_logs_rls_insert.sql` | Agregar RLS INSERT en `ai_usage_logs` | ✅ Ejecutado |
| `DB/43_ai_org_limits_cleanup.sql` | Cleanup final de rows de test | ✅ Ejecutado |

---

## Configuración: Settings > IA

La página de settings de IA (`/settings/ai`) muestra:
- Dashboard de uso (requests hoy, tokens usados este mes)
- Límites del plan actual
- Link desde el panel de sugerencia: "Ver consumo y límites"

**Archivo**: `src/features/ai/views/ai-settings-view.tsx`

---

## Tabla de Relaciones con Otros Flows

| Flow | Relación |
|------|----------|
| Tareas / Recetas | El panel de IA se abre desde la receta de una tarea |
| Materiales (Catálogo) | El prompt incluye el catálogo completo de materiales |
| Mano de Obra (Catálogo) | El prompt incluye el catálogo de tipos de MO |
| Plans / Suscripciones | Los límites de IA se leen del JSON `features` del plan |
| Imports | `analyzeExcelStructure()` usa IA para detectar estructura de Excel |

---

## Roadmap

### ✅ Completado (Marzo 2026)
- Schema `ai` con 4 tablas migradas
- `suggestRecipe()` con matching contra catálogo real
- `RecipeSuggestionPanel` con items de material y MO
- Footer dinámico (Sugerir → Agregar todos)
- Rate limiting por organización según plan
- Logging de uso y tokens en `ai_usage_logs`
- Cleanup de tablas legacy (ia_user_*, ia_messages, ia_context_snapshots, ia_user_greetings)
- Settings page con dashboard de uso
- Panel UI: unidades uppercase, orden cantidad+desperdicio, texto explicativo

### ⏳ Pendiente: Corto plazo
1. **Usar unidad real del catálogo** en vez de la que inventa la IA → modificar `recipe-suggestion-panel.tsx` para tomar `unit_symbol` del catálogo matcheado
2. **Regenerar con contexto editado** → permitir re-sugerir sin cerrar y reabrir el panel
3. **Feedback loop** → guardar aceptaciones/rechazos para mejorar futuras sugerencias

### 🔮 Pendiente: Largo plazo
1. **Chat IA general** — Interfaz conversacional completa para consultas de obra
2. **Inteligencia colectiva de recetas** — Tabla `ai.recipe_patterns` que registre qué materiales se usan más para cada tipo de tarea
3. **Auto-sugerencia** — Sugerir receta automáticamente al crear una tarea nueva
4. **Preview de costos** — Mostrar costo estimado total de la receta sugerida antes de aceptar
