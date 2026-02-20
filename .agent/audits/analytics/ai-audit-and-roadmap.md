# Auditoría IA — Estado Real + Roadmap

## 1. Tablas `ia_*` en DB (ya existen en `public`)

| Tabla | Propósito |
|-------|-----------|
| `ia_context_snapshots` | Snapshots de contexto del usuario/org para la IA |
| `ia_import_mapping_patterns` | Aprende cómo el usuario mapea columnas en imports (org-level) |
| `ia_import_value_patterns` | Aprende equivalencias de valores en imports (ej: "materiales" → material_id) |
| `ia_messages` | Historial de mensajes del chat IA (user/assistant) |
| `ia_usage_logs` | Log de tokens y costo por llamada (provider, model, tokens, cost_usd) |
| `ia_user_greetings` | Saludos personalizados generados por IA por período |
| `ia_user_preferences` | Preferencias del usuario (tono, idioma, personalidad) |
| `ia_user_usage_limits` | Límites de uso por usuario (plan, daily_limit, prompts_used_today) |

> Todas estas tablas están en el schema `public`. La migración al schema `ai` sería el Paso 1.

### Schema detallado de tablas clave

**`ia_messages`**
```
id, user_id → users, role (user/assistant), content, context_type, created_at
```

**`ia_usage_logs`**
```
id, user_id → users, provider ('openai'), model ('gpt-4o'),
prompt_tokens, completion_tokens, total_tokens, cost_usd,
context_type, created_at
```

**`ia_user_usage_limits`**
```
user_id → users, plan ('free'), daily_limit (3), prompts_used_today,
last_prompt_at, last_reset_at
```

**`ia_user_preferences`**
```
user_id → users, display_name, tone ('amistoso'), language ('es'),
personality, updated_at
```

**`ia_context_snapshots`**
```
id, user_id → users, organization_id → organizations,
type, content (text), created_at
```

**`ia_import_mapping_patterns`** (inteligencia colectiva de imports)
```
id, organization_id, entity, source_header, target_field,
usage_count, last_used_at, created_at
```

---

## 2. Feature `src/features/ai` — Código actual

| Archivo | Propósito |
|---------|-----------|
| `ai-client.ts` | Singleton OpenAI, `chatCompletion` genérico |
| `actions.ts` | Solo: `analyzeExcelStructure` (para importación bulk) |
| `types.ts` | `AIAnalyzedTask`, `AIAnalysisResult`, `AIActionResult` |
| `prompts/import-analyzer.ts` | Prompt para detección de estructura Excel |

**Brecha detectada:** Las tablas `ia_*` existen en DB pero el feature de código NO las usa para nada. No hay actions que lean ni escriban a `ia_messages`, `ia_usage_logs`, `ia_user_preferences`, etc.

---

## 3. Lo que está preparado vs lo que falta

| Capacidad | DB | Código |
|-----------|----|----|
| Chat con historial | ✅ `ia_messages` | ❌ No hay action de chat |
| Límites de uso | ✅ `ia_user_usage_limits` | ❌ No se verifica |
| Preferencias personales | ✅ `ia_user_preferences` | ❌ No se leen |
| Log de costo/tokens | ✅ `ia_usage_logs` | ❌ No se loguea |
| Contexto del usuario | ✅ `ia_context_snapshots` | ❌ No se usa |
| Aprendizaje de imports | ✅ `ia_import_mapping_patterns` | ❌ Parcialmente |
| Sugerencia de recetas | ❌ No hay tabla | ❌ No hay action |
| Análisis Excel | ✅ (indirecto) | ✅ `analyzeExcelStructure` |

---

## 4. Plan: Migración al Schema `ai`

Según el workflow `create-db-schema.md`, tablas a mover con `ALTER TABLE SET SCHEMA`:

### Orden de migración (por dependencias)

```sql
-- Sin dependencias entre sí (todas FK a public.users / public.organizations)
ALTER TABLE public.ia_user_preferences SET SCHEMA ai;
ALTER TABLE public.ia_user_usage_limits SET SCHEMA ai;
ALTER TABLE public.ia_user_greetings SET SCHEMA ai;
ALTER TABLE public.ia_usage_logs SET SCHEMA ai;
ALTER TABLE public.ia_context_snapshots SET SCHEMA ai;
ALTER TABLE public.ia_messages SET SCHEMA ai;
ALTER TABLE public.ia_import_mapping_patterns SET SCHEMA ai;
ALTER TABLE public.ia_import_value_patterns SET SCHEMA ai;
```

### Archivo SQL: `DB/029_create_ai_schema.sql`

### Actualizar introspector
```js
const SCHEMAS = ['public', 'iam', 'construction', 'ai'];
```

---

## 5. Roadmap: AI Recipe Assistant

### Fase 1 — MVP: Sugerencia por contexto de tarea

Botón "✨ Sugerí receta con IA" en el modal de receta. La IA propone materiales + mano de obra en base a nombre de tarea, unidad y rubro.

**Nuevos en código:**
- `prompts/recipe-suggester.ts`
- `suggestRecipe(taskId, orgId)` en `actions.ts`
- `RecipeSuggestionPanel` en el modal de receta
- Escribir a `ia_usage_logs` + verificar `ia_user_usage_limits`

**Output JSON:**
```json
{
  "confidence": "high",
  "materials": [{ "name": "Arena fina", "unit": "m³", "quantity": 0.02 }],
  "labor": [{ "name": "Oficial albañil", "unit": "h", "quantity": 0.5 }]
}
```

---

### Fase 2 — Matching con catálogo real

La IA conoce el catálogo de la org. Propone items que ya existen (con ID real), listos para agregar con 1 click.

1. Fetchar catálogo de la org antes de llamar a OpenAI
2. Incluirlo como contexto en el prompt
3. La IA devuelve `materialId` / `laborId` cuando hay match

---

### Fase 3 — Inteligencia Colectiva

Aprovechar `ia_import_mapping_patterns` (ya existe) como modelo para algo similar en recetas.

- Nueva tabla `ai.recipe_patterns`: registra qué materiales se usan más para qué tipo de tarea
- El prompt incluye: "Para tareas de tipo X en la misma rubro, otros usuarios típicamente usan: {top items}"

---

## 6. Primeros Pasos

| # | Paso | Quién |
|---|------|-------|
| 1 | Crear `DB/029_create_ai_schema.sql` | Agente |
| 2 | Ejecutar SQL en Supabase | Usuario |
| 3 | Agregar `'ai'` al introspector + `npm run db:schema` | Ambos |
| 4 | Conectar `analyzeExcelStructure` a `ia_usage_logs` | Agente |
| 5 | Crear `prompts/recipe-suggester.ts` | Agente |
| 6 | Agregar `suggestRecipe()` a `actions.ts` | Agente |
| 7 | UI: `RecipeSuggestionPanel` en modal de receta | Agente |
