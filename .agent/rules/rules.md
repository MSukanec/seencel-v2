---
trigger: always_on
---

# 📐 SEENCEL RULES — Biblia del Agente

> **LEÉ ESTO CADA VEZ QUE TRABAJAS.** Si una regla te pide más contexto, seguí el 📖 link.
> Actualizado: Febrero 2026

---

## 1. CORE — Reglas Inquebrantables

1. Responder **siempre en español**.
2. **No afirmar** que algo fue probado/ejecutado si no se pidió.
3. **Supabase** es la fuente de verdad (permisos, RLS, integridad). El frontend NO reemplaza reglas de la DB.
4. **RLS obligatoria** en toda tabla real (SELECT, INSERT, UPDATE). Sin excepciones.
5. `auth_id` SOLO vincula Auth → `users`. Todas las FK usan `users.id`. Sin excepciones.
6. **No duplicar lógica.** Si existe como SQL/RLS/helper/hook, no reimplementar.
7. **Separación de capas:** DB=permisos+integridad, Backend=orquestación, Frontend=UI+UX.
8. **El modelo de datos manda.** La UI se adapta al modelo, no al revés.
9. **Naming del dominio.** Nombres reales del negocio, no genéricos.
10. **No hacks.** No campos provisorios, no tablas sin diseño, no "después lo arreglamos".

---

## 2. DATABASE — Tablas Nuevas

Antes de crear/modificar tablas: **leer `DB/schema/`**. No presuponer columnas ni tablas.

### Columnas obligatorias (toda tabla con `organization_id`):

| Columna | Tipo | Nota |
|---------|------|------|
| `created_at` / `updated_at` | `timestamptz NOT NULL DEFAULT now()` | |
| `is_deleted` / `deleted_at` | `boolean / timestamptz` | Soft delete SIEMPRE |
| `created_by` / `updated_by` | `uuid → organization_members(id)` | `ON DELETE SET NULL` |
| `import_batch_id` | `uuid → import_batches(id)` | `ON DELETE SET NULL` |

### Reglas clave:
- ⛔ **NUNCA** `.delete()` real. Siempre `.update({ is_deleted: true, deleted_at: now() })`.
- ⛔ **NUNCA** SELECT sin `.eq("is_deleted", false)`.
- Triggers obligatorios: `set_timestamp` + `handle_updated_by` + audit log.
- Índices parciales: `WHERE (is_deleted = false)`.
- RLS: 3 políticas (VEN/CREAN/EDITAN) con `can_view_org` / `can_mutate_org`.
- El agente **NUNCA** ejecuta SQL ni pega SQL en chat. Scripts en carpeta `/DB`.

📖 **Detalle:** Skill [Políticas RLS y Auditoría Supabase](../../.gemini/antigravity/skills/rls-policies-supabase/SKILL.md)

---

## 3. VISTAS CON DATATABLE — Arquitectura Lean

> **Una vista NUNCA supera 200-250 líneas.** Si tiene más, algo está mal.

### Estructura obligatoria:

```
features/[feature]/
├── tables/[entity]-columns.tsx    ← Columnas + constantes
└── views/[feature]-list-view.tsx  ← Solo orquesta (~150-200 líneas)
```

### Hooks globales OBLIGATORIOS:

| Hook | Import | Propósito |
|------|--------|----------|
| `useTableActions` | `@/hooks/use-table-actions` | Delete single/bulk + dialog |
| `useTableFilters` | `@/hooks/use-table-filters` | Search + date + facets |
| `useOptimisticList` | `@/hooks/use-optimistic-action` | Optimistic add/remove/update en listas |

### Column Factories OBLIGATORIOS:

| Factory | Propósito |
|---------|----------|
| `createDateColumn` | Fecha con avatar, formato localizado, inline DatePicker |
| `createTextColumn` | Texto con truncate, subtitle, customRender, inline Input |
| `createMoneyColumn` | Monto con +/-, colores semánticos, exchange rate |
| `createStatusColumn` | Badge semántico (positive/negative/warning/neutral), inline Command |
| `createProjectColumn` | Proyecto con avatar, inline Command selector |
| `createEntityColumn` | Tipo/entidad con label mapeado + subtítulo |
| `createPercentColumn` | Porcentaje alineado a derecha, font-mono |

### Prohibiciones:
- ⛔ Definir columnas inline en la vista → extraerlas a `tables/`
- ⛔ Reimplementar AlertDialog para delete → usar `useTableActions`
- ⛔ Crear estados de filtro sueltos → usar `useTableFilters`
- ⛔ Vista de más de 250 líneas
- ⛔ Toolbar controls manuales → usar `FilterPopover`, `SearchButton`, `DisplayButton` de `@/components/shared/toolbar-controls`

📖 **Detalle COMPLETO (LEER SIEMPRE):** Skill [seencel-datatable-system](../skills/seencel-datatable-system/SKILL.md)
📖 **Referencia estándar:** Finanzas > Movimientos (`finance/views/finances-movements-view.tsx` + `finance/tables/movements-columns.tsx`)

---

## 4. PÁGINAS — Estructura Obligatoria

- `page.tsx` = Server Component. Fetch + `PageWrapper` + Tabs.
- `generateMetadata` obligatorio con `robots: "noindex, nofollow"`.
- `try/catch` con `ErrorDisplay` en toda página con fetch.
- `ContentLayout variant="wide"` en page.tsx, **NO** en la View.
- `ViewEmptyState` de `@/components/shared/empty-state` (NUNCA el viejo).
- `TabsContent` con clases: `flex-1 m-0 overflow-hidden data-[state=inactive]:hidden`.

### Layout Pattern (GOTCHA):
```
PageWrapper → ContentLayout variant="wide" → View (Fragment)
                                               ├── Toolbar portalToHeader
                                               └── DataTable | ViewEmptyState
```
- `ContentLayout` SIEMPRE en `page.tsx`, NUNCA en la View.
- `ViewEmptyState` en early return con Fragment, SIN div wrapper.

📖 **Detalle:** Skill [seencel-page-layout](../skills/seencel-page-layout/SKILL.md)

---

## 5. FORMS — Panels, No Modals

- Forms se abren con `openPanel`, **NUNCA** con `openModal`.
- Modales solo para confirmaciones/alertas.
- Field Factories OBLIGATORIOS: `TextField`, `AmountField`, `SelectField`, etc.
- ⛔ NUNCA usar `<Input>`, `<Select>`, `<Textarea>` raw si existe Field Factory.
- Form define su presentación con `setPanelMeta` (icon, title, description, size, footer).

📖 **Detalle:** Skill [seencel-panel-forms](../skills/seencel-panel-forms/SKILL.md)

---

## 6. CARDS & CHARTS

| Componente | Uso | Import |
|-----------|-----|--------|
| `MetricCard` | KPIs numéricos | `@/components/cards` |
| `ChartCard` | Wrapper para gráficos | `@/components/cards` |

- ⛔ **LEGACY — NO USAR:** `DashboardKpiCard`, `DashboardCard`, Cards manuales de shadcn.
- `size="default"` en TODAS las MetricCards.
- Charts siempre con componentes `Lazy*` (LazyAreaChart, LazyBarChart, etc).
- Colores HEX directos, NUNCA `hsl(var(--chart-X))`.

📖 **Detalle:** Skill [seencel-page-layout](../skills/seencel-page-layout/SKILL.md) sección 11

---

## 7. STORES — Zustand

| Store | Propósito |
|-------|----------|
| `organization-store` | Org, monedas, billeteras, proyectos |
| `user-store` | Usuario actual |
| `layout-store` | UI state (sidebar, context) |
| `panel-store` | Stack de panels (forms, detalles) |
| `modal-store` | Solo confirmaciones/alertas (legacy) |

### Reglas:
- ⛔ NUNCA `createContext()` para estado global.
- Siempre `useShallow` en selectores.
- Valores computados FUERA del selector.
- Hydration con `useEffect` + `useRef`, NUNCA durante render.

📖 **Detalle:** `src/stores/README.md`

---

## 8. FECHAS Y ZONAS HORARIAS (GOTCHA)

`new Date("2026-01-30")` = UTC midnight → en Argentina muestra el día anterior.

| Operación | Función |
|-----------|---------|
| Leer de DB | `parseDateFromDB(row.date)` |
| Guardar a DB | `formatDateForDB(dateObj)` |
| Guardar timestamp | `formatDateTimeForDB(dateObj)` |

- ⛔ NUNCA `new Date(dateString)` para fechas de DB.
- ⛔ NUNCA `date.toISOString()` para columnas DATE.
- Si se detecta `new Date(someStringFromDB)` → es un bug, corregir inmediatamente.

📖 **Fuente:** `@/lib/timezone-data`

---

## 9. AUTO-SAVE

Para vistas de edición inline (nombre, descripción, etc): usar `useAutoSave` de `@/hooks/use-auto-save`.

- ⛔ NUNCA `useRef` + `setTimeout` manual para debounce de save.
- ⛔ NUNCA indicadores inline "Guardando..." → usa toast de Sonner automático del hook.
- Formularios con botón "Guardar" = submit explícito, NO autosave.

---

## 10. i18n — URLs y Traducciones

- `Link` y `useRouter` SIEMPRE de `@/i18n/routing`, NUNCA de `next/link`.
- hrefs sin prefijo de locale: `/organization/catalog`, NO `/${locale}/organizacion/catalogo`.
- Toda ruta nueva debe registrarse en `src/i18n/routing.ts` con ES/EN.
- Textos visibles en `messages/es.json`.

---

## 11. PERFORMANCE — Reglas Consolidadas

| Regla | Qué hacer | Qué NO hacer |
|-------|-----------|-------------|
| **Layout shift** | Reservar espacio con altura fija + Skeleton | Altura dinámica sin skeleton |
| **Debounce** | Debounce en búsquedas (300ms) | Llamar API en cada keystroke |
| **Heavy libs** | `dynamic(() => import(...))` para Recharts, etc | Import directo de libs >100KB |
| **Data fetching** | Server Component fetch (RSC) | `useEffect` + fetch en cliente |
| **force-dynamic** | Solo si datos son realmente time-sensitive | `export const dynamic = "force-dynamic"` en todo |
| **Layout queries** | Queries solo en `page.tsx`, NO en layouts | Fetch en `layout.tsx` |
| **Monolithic prefetch** | Queries paralelas con `Promise.all` | Un mega-query que trae todo |
| **Imágenes** | `compressImage()` antes de upload | Subir originales |
| **Auth redundante** | Una sola verificación por request | `getUser()` en cada componente |
| **Queries ilimitadas** | Paginar o limitar resultados | `.select("*")` sin `.limit()` |
| **Optimistic updates** | Actualizar UI inmediatamente, rollback en error | Esperar respuesta para actualizar |
| **Prefetch** | Prefetch en hover/viewport para rutas frecuentes | Sin prefetch |
| **Skeletons** | Skeleton que replica la forma del contenido | Spinner genérico |
| **Navigation** | `startTransition` para navegación | `router.push` sin transition |
| **Long lists** | Virtualizar si >100 items | Renderizar 1000+ items en DOM |
| **Tab switching** | Estado local, NO `router.replace` | Re-fetch en cada cambio de tab |
| **Animations** | `duration-150` o más rápidas | `duration-300` para navegación |

---

## 12. TOOLBAR — Reglas

- `<Toolbar portalToHeader />` SIEMPRE.
- Acciones en `actions={[{ label, icon, onClick }]}`, NUNCA botones custom.
- Búsqueda built-in del Toolbar, NUNCA input custom.
- Stats/badges en `leftActions`.
- Currency selector en `leftActions` para Overview views.

📖 **Detalle:** Skill [seencel-ui-patterns](../skills/seencel-ui-patterns/SKILL.md)

---

## 13. PROCESO AL TRABAJAR EN UN FEATURE

1. **Leer** `features/<feature>/TABLES.md` → esquema real de DB.
2. **Leer** `features/<feature>/README.md` → contexto funcional.
3. **Verificar** que la vista cumple las reglas de este archivo.
4. Si se detecta código legacy o violación → **avisar al usuario**.
5. Si se hace un cambio importante → actualizar `README.md` del feature.
