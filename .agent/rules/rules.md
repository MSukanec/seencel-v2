---
trigger: always_on
---

# 📐 SEENCEL RULES — Biblia del Agente

> **LEÉ ESTO CADA VEZ QUE TRABAJAS.** Si una regla te pide más contexto, seguí el 📖 link.
> Actualizado: Marzo 2026

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

## 2.5 AUTH — Autenticación Centralizada (auth.ts)

`src/lib/auth.ts` es la **ÚNICA fuente de verdad** para resolver identidad en Server Components, Server Actions y API Routes. Usa `React.cache()` para deduplicar: N llamadas por request = 1 ejecución real.

| Función | Uso | Retorna |
|---------|-----|--------|
| `getAuthUser()` | Solo necesitás el auth user | `User \| null` |
| `getAuthContext()` | Necesitás userId + orgId | `{ authId, userId, orgId } \| null` |
| `requireAuthContext()` | Página que REQUIERE auth + org (redirect si falta) | `{ authId, userId, orgId }` |

### Reglas:
- ⛔ **NUNCA** llamar `supabase.auth.getUser()` directamente en server-side (excepto `middleware.ts` y `auth.ts` mismo)
- ⛔ **NUNCA** importar `getAuthUser` en componentes `"use client"` — rompe el build (`next/headers` es solo server)
- ✅ Client hooks usan `createClient()` de `@/lib/supabase/client` + `supabase.auth.getUser()`
- ✅ Primero resolver auth con `getAuthUser()`, DESPUÉS crear `createClient()` para data queries
- ✅ En Actions: `const user = await getAuthUser(); if (!user) return { error: "..." };`

📖 **Fuente:** `src/lib/auth.ts`

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
|---------|-----------|
| `createDateColumn` | Fecha con avatar, formato localizado, inline DatePicker |
| `createTextColumn` | Texto con truncate, subtitle, customRender, inline Input |
| `createMoneyColumn` | Monto con +/-, colores semánticos, inline Input editable |
| `createStatusColumn` | Badge semántico (positive/negative/warning/neutral), inline Command |
| `createProjectColumn` | Proyecto con avatar, inline Command selector |
| `createEntityColumn` | Tipo/entidad con label mapeado + subtítulo, inline Command editable |
| `createWalletColumn` | Billetera con ícono Wallet, inline Popover editable |
| `createCurrencyColumn` | Moneda con símbolo + nombre, inline Popover editable |
| `createExchangeRateColumn` | Tasa de cambio con font-mono, "—" si =1, inline Input editable |
| `createPeriodColumn` | Período de recurrencia con UnifiedDatePicker, inline Popover editable |
| `createPercentColumn` | Porcentaje alineado a derecha, font-mono |

### Shared Popover Content (🚨 OBLIGATORIO):

Los popovers de selección (billetera, moneda, etc.) usan **Shared Popover Content Components** de `@/components/shared/popovers/`.

| Componente | Uso | Consumidores |
|-----------|-----|-------------|
| `WalletPopoverContent` | Selector de billeteras | `wallet-chip` + `wallet-column` |
| `CurrencyPopoverContent` | Selector de monedas | `currency-chip` |

- ⛔ **NUNCA** duplicar el contenido Command entre chip y column factory
- ⛔ **NUNCA** hardcodear footer actions — viven dentro del componente compartido
- Cada componente incluye footer action integrado ("Gestionar billeteras/monedas") con navegación a Settings > Finanzas

📖 **Más detalle sobre Shared Popovers:** Skill [seencel-datatable-system](../skills/seencel-datatable-system/SKILL.md) sección 6.5

### Prohibiciones:
- ⛔ Definir columnas inline en la vista → extraerlas a `tables/`
- ⛔ Reimplementar AlertDialog para delete → usar `useTableActions`
- ⛔ Crear estados de filtro sueltos → usar `useTableFilters`
- ⛔ Vista de más de 250 líneas
- ⛔ Toolbar controls manuales → usar `FilterPopover`, `SearchButton`, `DisplayButton` de `@/components/shared/toolbar-controls`
- ⛔ Colocar controles estándar manualmente en slots → pasar `filters`, `display` como props a `ToolbarCard`
- ⛔ Duplicar contenido Command entre chip y column → usar Shared Popover Content
- ⛔ **Crear componente separado para "vista cards/grid"** → usar `viewMode="grid"` + `renderGridItem` del DataTable
- ⛔ **Reimplementar filtrado/agrupamiento en un componente de cards** → el DataTable ya lo hace

### Grid/Cards View — Headless Unificado (Marzo 2026):
- El `DataTable` es el **único componente** para renderizar datos, tanto en tabla como en tarjetas
- Modo table/cards se controla con `viewMode="table" | "grid"` + `renderGridItem={(row) => <MiTarjeta />}`
- El agrupamiento (`groupBy`) funciona **idéntico** en ambos modos: mismos headers, mismos acordeones
- ⛔ **NUNCA** crear un componente monolítico tipo `XxxCatalog` que reimplemente filtros, sorts y groups
- ✅ Referencia: `tasks-catalog-view.tsx` + `TaskListItem`

📖 **Detalle COMPLETO (LEER SIEMPRE):** Skill [seencel-datatable-system](../skills/seencel-datatable-system/SKILL.md) sección 9
📖 **Referencia estándar:** Finanzas > Movimientos (`finance/views/finances-movements-view.tsx` + `finance/tables/movements-columns.tsx`)

---

## 4. PÁGINAS — Estructura y Navegación (RAIL Standard)

> **Decisión RAIL Navigation (Marzo 2026):** El sidebar NO permite submenús ni drill-downs. Toda la navegación del sidebar es **Nivel 1 (RAIL)**. Para navegar sub-secciones dentro de un área, se debe **utilizar `<Tabs>` en la página** (ya sea en el header o en la vista, igual que en el reproductor del curso o Proyectos).

### Patrón para páginas con múltiples secciones:

```
app/[locale]/(dashboard)/organization/[feature]/
├── layout.tsx      ← Auth + PageWrapper (SIN ContentLayout)
├── page.tsx        ← ContentLayout variant="wide" + Sub-página raíz
├── [section1]/
│   └── page.tsx    ← ContentLayout variant según necesidad
└── [section2]/
    └── page.tsx    ← ContentLayout variant="narrow" (si es config)
```

### Reglas:
- `layout.tsx` = Auth + `PageWrapper` con title/icon. **SIN** `ContentLayout` (va en cada sub-página).
- Cada sub-página es un `page.tsx` Server Component independiente con `generateMetadata`.
- `generateMetadata` obligatorio con `robots: "noindex, nofollow"`.
- `try/catch` con `ErrorDisplay` en toda página con fetch.
- `ViewEmptyState` de `@/components/shared/empty-state` con 3 modos (`empty`, `no-results`, `context-empty`).
  - ⛔ **NUNCA** usar `EmptyState` de `ui/` ni `DataTableEmptyState` — fueron eliminados.
- **Icon Match**: El ícono DEBE coincidir con el del sidebar.
  - **Fail-safe totalCount**: Siempre pasar `totalCount={allItems.length}` — si `mode="empty"` pero `totalCount > 0`, auto-corrige a `context-empty`.
- ✅ **USAR TABS**: Es **OBLIGATORIO** usar `<Tabs>` o `routeTabs` para separar contextos y vistas dentro de una página, ya que el sidebar es exclusivo para navegación top-level.

### Sidebar Navigation (Exclusivo RAIL):
- El Sidebar debe ser **PLANO**.
- ⛔ **PROHIBIDO** el uso de `children` (drill-down, chevrons, submenús) en el Sidebar.

### Header:
- El header solo contiene: breadcrumb centrado (`Página / SubPágina`), CurrencyModeSelector (si aplica), DocsButton.
- ⛔ **SIN tabs, SIN avatar, SIN notificaciones** en el header.
- Avatar y notificaciones están en el bottom del sidebar.

### Referencia implementada:
- **Proyectos**: `projects/layout.tsx` (solo PageWrapper) + `projects/page.tsx` (variant="wide") + `projects/settings/page.tsx` (variant="narrow") — ContentLayout desacoplado
- **Gastos Generales**: `general-costs/layout.tsx` + `page.tsx`, `payments/page.tsx`, `concepts/page.tsx`
- **Configuración**: `settings/layout.tsx` + 6 sub-páginas
- **Avanzado**: `advanced/layout.tsx` + 2 sub-páginas

### ContentLayout desacoplado:
- `ContentLayout` se aplica **en cada sub-página**, NO en el layout compartido
- Permite `variant="wide"` para listas/tablas y `variant="narrow"` para config en el mismo feature
- ⛔ PROHIBIDO poner `ContentLayout` en `layout.tsx` — cada sub-página define su propia variante

📖 **Detalle:** Skill [seencel-page-layout](../skills/seencel-page-layout/SKILL.md)

---

## 5. FORMS — Panels + Chips

- Forms se abren con `openPanel`, **NUNCA** con `openModal`.
- Modales solo para confirmaciones/alertas.
- Field Factories OBLIGATORIOS: `TextField`, `AmountField`, `SelectField`, etc.
- ⛔ NUNCA usar `<Input>`, `<Select>`, `<Textarea>` raw si existe Field Factory.
- Form define su presentación con `setPanelMeta` (icon, title, description, size, footer).
- ⛔ NUNCA usar viejos componentes como `<FormFooter>` o pasar acciones dentro del panel manualmente, ya que el footer es manejado globalmente por el PanelProvider.
- Para el estado de carga al enviar: extraer `setSubmitting` desde `usePanel()` en vez de definir un prop `isLoading` o usar useState localmente.
- Revisar y cumplir el skill: 📖 **Detalle:** Skill [seencel-panel-forms](../skills/seencel-panel-forms/SKILL.md) para más detalles de arquitectura.

### Chips (metadata selectors en forms)

Los forms usan **Chips** (`@/components/shared/chips`) para selectores de metadata (fecha, billetera, moneda, estado, concepto).

| Chip | Import | Uso |
|------|--------|-----|
| `DateChip` | `@/components/shared/chips` | Selector de fecha |
| `WalletChip` | `@/components/shared/chips` | Selector de billetera |
| `CurrencyChip` | `@/components/shared/chips` | Selector de moneda |
| `StatusChip` | `@/components/shared/chips` | Selector de estado |
| `SelectChip` | `@/components/shared/chips` | Selector genérico (conceptos, categorías) |
| `PeriodChip` | `@/components/shared/chips` | Selector de período |
| `AttachmentChip` | `@/components/shared/chips` | Adjuntos |

- Los chips de **billetera y moneda** usan Shared Popover Content (`WalletPopoverContent`, `CurrencyPopoverContent`)
- ⛔ **NUNCA** hardcodear Command content dentro de un chip si existe Shared Popover Content
- El footer action ("Gestionar billeteras/monedas") viene integrado en el componente compartido

### Hybrid Chip Form Pattern

Forms como `general-costs-payment-form.tsx` usan el patrón **Hybrid Chip Form** (Linear-style):
```
┌─ HEADER ─────────────────────┐  ← icon + título + descripción
├─ BODY ───────────────────────┤
│  Amount field (grande)       │  ← Input principal
│  Description (textarea)      │  ← Descripción
│  ChipRow:                    │  ← Fila de chips
│    DateChip SelectChip       │
│    StatusChip WalletChip     │
│    CurrencyChip              │
├─ FOOTER ─────────────────────┤  ← Cancelar + Submit
└──────────────────────────────┘
```

📖 **Detalle:** Skill [seencel-panel-forms](../skills/seencel-panel-forms/SKILL.md)
📖 **Referencia:** `general-costs/forms/general-costs-payment-form.tsx`

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
| **Auth redundante** | `getAuthUser()` de `@/lib/auth` (cached por request) | `supabase.auth.getUser()` directo en server-side |
| **Queries ilimitadas** | Paginar o limitar resultados | `.select("*")` sin `.limit()` |
| **Optimistic updates** | Actualizar UI inmediatamente, rollback en error | Esperar respuesta para actualizar |
| **Prefetch** | Prefetch en hover/viewport para rutas frecuentes | Sin prefetch |
| **Skeletons** | Skeleton que replica la forma del contenido | Spinner genérico |
| **Navigation** | `startTransition` para navegación | `router.push` sin transition |
| **Long lists** | Virtualizar si >100 items | Renderizar 1000+ items en DOM |
| **Tab switching** | Estado local, NO `router.replace` | Re-fetch en cada cambio de tab |
| **Animations** | `duration-150` o más rápidas | `duration-300` para navegación |

---

## 12. TOOLBAR — ToolbarCard Estandarizado + Header Actions

> **Decisión de Marzo 2026:** El `Toolbar` con `portalToHeader` es legacy. Se reemplaza por `ToolbarCard` inline + `PageHeaderActionPortal`.

### API estandarizada de ToolbarCard:
`ToolbarCard` tiene **props dedicadas** para controles estándar. La vista decide **QUÉ** habilitar, **nunca DÓNDE** van:

```tsx
<ToolbarCard
    filters={filters}                    // UseTableFiltersReturn → habilita SearchButton + FilterPopover
    searchPlaceholder="Buscar..."        // Placeholder del search (default: "Buscar...")
    display={{                           // Si se pasa → muestra DisplayButton
        viewMode, onViewModeChange, viewModeOptions, table?
    }}
    left={<ViewsTabs ... />}             // Slot libre: ViewsTabs, ToolbarTabs
    bottom={<ActiveFiltersBar ... />}    // Slot libre: barras inferiores
/>
```

### Reglas internas:
- Si `filters` presente → renderiza `SearchButton` + `FilterPopover` **automáticamente a la derecha**
- Si `display` presente → renderiza `DisplayButton` **automáticamente a la derecha**
- Orden fijo e invariable: **Search → Filter → Display** (siempre right slot)
- Acción primaria ("Nuevo X") se porta al header con `PageHeaderActionPortal`

### Prohibiciones:
- ⛔ NO usar `Toolbar` con `portalToHeader` — es el patrón viejo
- ⛔ NO crear inputs de búsqueda custom — usar `SearchButton` vía prop `filters`
- ⛔ NO colocar `SearchButton`, `FilterPopover` o `DisplayButton` manualmente en slots — ToolbarCard los renderiza internamente
- ⛔ NO usar el `right` slot para controles estándar — solo para custom (backwards compat)

### Context Menu (Right-Click) OBLIGATORIO en DataTables:
- `enableContextMenu` en `<DataTable>`
- Callbacks: `onView` (navegar), `onEdit` (abrir panel), `onDelete` (confirmar)
- "Eliminar" en context menu es **gris como el resto** — NO rojo/destructive
- Si hay vista grid/cards: wrappear cada card con `ContextMenu` de shadcn con las mismas acciones

### Dialog estilizado como Panel:
- `Dialog` comparte estética con Panels: gradiente sidebar, `border-border/50`, `rounded-xl`, `shadow-2xl`
- ⛔ NO usar `Dialog` para forms — solo para confirmaciones/alertas

📖 **Detalle:** Skill [seencel-ui-patterns](../skills/seencel-ui-patterns/SKILL.md)

---

## 12.5. SIDEBAR — Estética

> **Decisión de Marzo 2026:** Sidebar limpio y minimalista, sin efectos volumétricos.

### Reglas de estilo:
- **Accordion groups**: Labels en `uppercase`, `text-[11px]`, `font-semibold`, color `muted-foreground/60`. Sin bordes, sin fondo, sin sombras.
- **Nav items activos**: Solo `bg-secondary text-foreground`. SIN gradientes, SIN `box-shadow`, SIN `border-left` de color, SIN animaciones de reflejo.
- **Nav items inactivos**: `text-muted-foreground`, hover con `bg-muted`.
- **"Visión General"**: Es un `SidebarNavButton` normal, SIN wrapper card.
- ⛔ **PROHIBIDO**: `bg-sidebar-accent`, `boxShadow: inset`, `borderLeftColor: var(--plan-border)`, gradientes `linear-gradient` en nav items.
- ⛔ **PROHIBIDO**: Animaciones `plan-border-reflection`, efectos `glow`.

### Estructura del sidebar:
- **Top**: Org selector
- **Navegación**: Menú **RAIL** (solo botones principales, sin sub-niveles).
- **Bottom**: Admin + Volver al Hub → Avatar + Notificaciones

---

## 13. PROCESO AL TRABAJAR EN UN FEATURE

1. **Ejecutar** `npm run db:schema` → actualizar archivos en `DB/schema/`.
2. **Leer** `DB/schema/<schema>/` → tablas, RLS, triggers, índices, vistas (fuente de verdad).
3. **Leer** `features/<feature>/README.md` → contexto funcional (si existe).
4. **Verificar** que la vista cumple las reglas de este archivo.
5. Si se detecta código legacy o violación → **avisar al usuario**.
6. Si se hace un cambio importante con lógica de negocio compleja → documentar en `README.md` del feature (opcional).
