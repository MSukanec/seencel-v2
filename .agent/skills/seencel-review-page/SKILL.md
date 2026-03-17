---
name: Seencel Review Page
description: Auditoría pre-lanzamiento exhaustiva de páginas Seencel V2. Verifica arquitectura, layout, toolbar, tablas, forms, empty states, performance, seguridad y documentación.
---

# Seencel Full Audit — Auditoría Pre-Lanzamiento por Feature

> **Cuándo usar:** Cuando el usuario dice "revisemos X" o `/review-page X`.
> Verifica **absolutamente todo** de un feature: DB, RLS, Server Actions, Queries, Frontend, Performance, Seguridad, Cross-feature.

---

## 0. PREPARACIÓN OBLIGATORIA

### A. Leer Skills (SKILL.md de cada uno):
- `seencel-page-layout` — Layout, Server/Client, Sidebar-First
- `seencel-ui-patterns` — EmptyState, Toolbar, DataTable, Toasts
- `seencel-datatable-system` — Column Factories, Inline Editing, Hooks
- `seencel-panel-forms` — Panels, Field Factories, Chips
- `rls-policies-supabase` — RLS, Auditoría, Storage, Server Actions

### B. Ejecutar introspección de DB (OBLIGATORIO primero):

```bash
npm run db:schema
```

Esto ejecuta `scripts/introspect-db.mjs` que conecta a Supabase y genera archivos actualizados en `DB/schema/`.

### C. Leer documentación del feature:

La **fuente de verdad** de la DB es `DB/schema/<schema>/`. Cada schema tiene:
- `tables_N.md` — columnas, tipos, nullable, defaults, constraints (PK, FK, UNIQUE)
- `rls.md` — políticas RLS con USING y WITH CHECK completos
- `triggers.md` — triggers por tabla (set_timestamp, handle_updated_by, audit)
- `indexes.md` — índices (incluyendo parciales `WHERE is_deleted = false`)
- `views.md` — definiciones SQL de vistas
- `functions_N.md` — funciones y procedures con source code
- `enums.md` — enums del schema
- `_index.md` — índice global de todos los schemas

**Identificar el schema del feature:** Buscar la carpeta correspondiente en `DB/schema/`. Ejemplo: proyectos → `DB/schema/projects/`, finanzas → `DB/schema/finance/`.

También leer:
- `features/<feature>/README.md` — contexto funcional (si existe)

### D. Identificar archivos del feature:
- `src/features/<feature>/` — actions, queries, views, tables, forms, components
- `src/app/[locale]/(dashboard)/organization/<feature>/` — pages, layouts
- `src/stores/` — stores relevantes
- `src/hooks/` — hooks relevantes

### E. Crear REPORTE:
Crear un archivo de reporte en `<appDataDir>/brain/<conversation-id>/audit-<feature>.md` usando el template de la sección TEMPLATE DE REPORTE.

---

## CAPA 1: BASE DE DATOS

> **Fuente de verdad:** `DB/schema/<schema>/tables_N.md` y `DB/schema/<schema>/triggers.md`

### 1.1 Columnas Obligatorias (tablas con `organization_id`)

Verificar que CADA tabla del feature tenga:

| Columna | Tipo | Default |
|---------|------|---------|
| `created_at` | `timestamptz NOT NULL` | `DEFAULT now()` |
| `updated_at` | `timestamptz NOT NULL` | `DEFAULT now()` |
| `is_deleted` | `boolean NOT NULL` | `DEFAULT false` |
| `deleted_at` | `timestamptz` | `NULL` |
| `created_by` | `uuid → organization_members(id)` | `ON DELETE SET NULL` |
| `updated_by` | `uuid → organization_members(id)` | `ON DELETE SET NULL` |
| `import_batch_id` | `uuid → import_batches(id)` | `ON DELETE SET NULL` |

### 1.2 Triggers Obligatorios

Cada tabla debe tener:
- [ ] `set_timestamp` — auto-actualiza `updated_at`
- [ ] `handle_updated_by` — auto-resuelve `created_by`/`updated_by` desde `auth.uid()`
- [ ] Trigger de audit log (`log_<entity>_activity`) con `EXCEPTION WHEN OTHERS`

### 1.3 Índices

- [ ] Índice parcial: `WHERE (is_deleted = false)` en columnas frecuentes
- [ ] Índice en `organization_id` si no está cubierto por FK
- [ ] Índices en FKs que se usan en JOINs

### 1.4 Vistas (`*_view`)

> **Fuente:** `DB/schema/<schema>/views.md` — cada vista indica 🔓 INVOKER o 🔐 DEFINER

- [ ] **SECURITY INVOKER** (`🔓`) — OBLIGATORIO para vistas que contienen datos de org. Si dice `🔐 DEFINER` o Supabase muestra "UNRESTRICTED", la vista **bypasea RLS** y es un agujero de seguridad.
- [ ] Excluyen `is_deleted = true` en su definición SQL (verificar WHERE clause)
- [ ] Se usan para lectura, no para esconder malos modelos

> [!CAUTION]
> `CREATE OR REPLACE VIEW` **resetea** `security_invoker` a `false`. Siempre que se recree una vista, agregar después:
> `ALTER VIEW <schema>.<view_name> SET (security_invoker = true);`

### 1.5 FK y Relaciones

- [ ] Cascadas coherentes: `ON DELETE SET NULL` para `created_by`/`updated_by`, `ON DELETE CASCADE` solo donde corresponde
- [ ] No hay FKs huérfanas (apuntando a tablas que no existen)
- [ ] `auth_id` SOLO en tabla `users` — todas las demás FK usan `users.id`

---

## CAPA 2: RLS (ROW LEVEL SECURITY)

> **Fuente de verdad:** `DB/schema/<schema>/rls.md`
> **Referencia:** Skill `rls-policies-supabase`

### 2.1 Verificar por CADA tabla del feature:

- [ ] `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` — RLS habilitado
- [ ] Política SELECT: `can_view_org(organization_id, '<permiso>.view')`
- [ ] Política INSERT: `can_mutate_org(organization_id, '<permiso>.manage')`
- [ ] Política UPDATE: `can_mutate_org(organization_id, '<permiso>.manage')`
- [ ] ⛔ NO política DELETE en tablas con soft delete
- [ ] Naming: `MEMBERS SELECT <TABLE>`, `MEMBERS INSERT <TABLE>`, etc.

### 2.2 Tablas hijas

- [ ] Heredan permisos del padre vía JOIN o subquery
- [ ] No tienen permisos propios inventados

### 2.3 Permisos

- [ ] Existen en tabla `permissions`: `<feature>.view` y `<feature>.manage`
- [ ] Están en `step_assign_org_role_permissions` (ADMIN, EDITOR, LECTOR)
- [ ] Migración ejecutada para ORGs existentes (verificar en TABLES.md)

---

## CAPA 3: SERVER ACTIONS Y QUERIES

> Ubicación: `src/features/<feature>/actions.ts` y `src/features/<feature>/queries.ts`

### 3.1 Server Actions — CADA acción:

- [ ] Tiene `"use server"` al inicio del archivo
- [ ] Valida autenticación: usa `getAuthUser()` o `getAuthContext()` de `@/lib/auth`
- [ ] ⛔ NUNCA llama `supabase.auth.getUser()` directo (excepto en `auth.ts`)
- [ ] Valida ownership/membership antes de mutar
- [ ] Filtra por `organization_id` en toda operación
- [ ] Usa `.eq("is_deleted", false)` en SELECTs
- [ ] Soft delete: usa `.update({ is_deleted: true, deleted_at: new Date().toISOString() })`, NUNCA `.delete()`
- [ ] Maneja errores: `try/catch` con retorno `{ error: "mensaje" }` o `{ success: true }`
- [ ] No expone datos sensibles en respuesta de error
- [ ] Usa `revalidatePath` o retorna data para optimistic update

### 3.2 Queries (Server Components) — CADA query:

- [ ] Filtra por `organization_id` — NUNCA query sin filtro de org
- [ ] Filtra por `.eq("is_deleted", false)` — NUNCA SELECT sin este filtro
- [ ] Usa `.select("campo1, campo2, ...")` explícito, NUNCA `select("*")` sin control
- [ ] Tiene `.limit()` si retorna listas potencialmente grandes
- [ ] Las queries complejas usan vistas SQL en vez de JOINs masivos en JS
- [ ] ⛔ NO usa `.single()` sin manejar el caso null
- [ ] Funciones de query en `queries.ts`, NO inline en la page

### 3.3 Schema correcto

- [ ] Queries a tablas en schemas custom usan `.schema('nombre_schema')`
- [ ] No hay queries hardcodeadas al schema `public` para tablas migradas

---

## CAPA 4: FRONTEND — ARQUITECTURA DE PÁGINA

> **Decisión de Marzo 2026:** Tabs en header eliminadas. Sidebar-first + rutas reales.

### 4.1 Estructura de archivos:

```
app/[locale]/(dashboard)/organization/<feature>/
├── layout.tsx         ← Auth + PageWrapper (SIN ContentLayout, SIN queries)
├── page.tsx           ← ContentLayout variant="wide" (lista)
├── settings/
│   └── page.tsx       ← ContentLayout variant="narrow"
└── [entityId]/
    └── page.tsx       ← Detail page con parentLabel + DetailContentTabs
```

### 4.2 Checklist de página:

- [ ] `layout.tsx` = Auth + `PageWrapper` con title/icon. **NO queries, NO ContentLayout**
- [ ] `ContentLayout` en cada sub-página (permite variantes distintas)
- [ ] `generateMetadata({ robots: "noindex, nofollow" })` en cada page
- [ ] `try/catch` con `ErrorDisplay` para data fetching
- [ ] Queries paralelas con `Promise.all`
- [ ] ⛔ NO `<Tabs>` / `<TabsContent>` para secciones de página
- [ ] Sub-secciones definidas en `use-sidebar-navigation.ts`
- [ ] Rutas en `src/i18n/routing.ts` con ES/EN
- [ ] Detail pages usan `parentLabel` + `DetailContentTabs`

### 4.3 Views:

- [ ] Archivos en `features/<feature>/views/`
- [ ] ≤ 250 líneas cada vista
- [ ] `"use client"` solo en vistas interactivas
- [ ] Errores de rendering tienen fallback

---

## CAPA 5: FRONTEND — COMPONENTES UI

### 5.1 Empty State (`ViewEmptyState`)

- [ ] Usa `ViewEmptyState` de `@/components/shared/empty-state`
- [ ] ⛔ NO usa `EmptyState` de `ui/` ni `DataTableEmptyState`
- [ ] 3 modos: `empty`, `no-results`, `context-empty`
- [ ] `icon` = mismo ícono que sidebar
- [ ] `docsPath` apunta a doc correcta
- [ ] Usa lista optimista (`optimisticItems`), NO `initialItems`
- [ ] `no-results` solo cuando `filters.hasActiveFilters`
- [ ] **Centrado vertical:** Empty state devuelve early return con `<div className="h-full flex items-center justify-center">` — NO anidado dentro del render normal
- [ ] **Toolbar condicional:** En modos `empty` y `context-empty` la toolbar NO se muestra. Solo se muestra en `no-results` y render normal
- [ ] **Patrón de early returns:** Separar empty/context-empty/no-results como returns independientes (ver `ProjectsListView`), NO ternarios anidados

### 5.2 Toolbar — ToolbarCard Inline

- [ ] Usa `ToolbarCard` de `@/components/shared/toolbar-controls`
- [ ] **Left slot:** `ViewsTabs` (si el feature tiene vistas guardadas) + `SearchButton`
- [ ] **Right slot:** `FilterPopover` + `DisplayButton` (si hay múltiples modos de vista)
- [ ] **Bottom slot:** `ViewEditorBar` (cuando se crea/edita vista) + `ActiveFiltersBar` (cuando hay filtros activos)
- [ ] Acción primaria via `PageHeaderActionPortal`
- [ ] ⛔ NO usa `Toolbar` con `portalToHeader`
- [ ] ⛔ NO inputs de búsqueda custom

### 5.3 DataTable — Columnas y Context Menu

- [ ] Columnas en `features/<feature>/tables/<entity>-columns.tsx` — NO inline
- [ ] Columnas usan Column Factories (`createTextColumn`, `createDateColumn`, etc.)
- [ ] Context Menu habilitado (`enableContextMenu`)
- [ ] **Context Menu UNIFICADO via `EntityContextMenu`** (`@/components/shared/entity-context-menu`):
  - **4 zonas fijas** en este orden: Estándar → Parámetros → Custom → Eliminar
  - **Zona 1 (Estándar):** `onView`, `onEdit`, `onDuplicate` — labels/íconos fijos, props booleanas
  - **Zona 2 (Parámetros):** `parameters` — submenús con opciones (Estado, Tipo, Categoría)
  - **Zona 3 (Custom):** `customActions` — acciones específicas (Llamar, Adjuntar, Enviar email)
  - **Zona 4 (Delete):** `onDelete` — siempre último, gris, separado automáticamente
  - Separadores entre zonas son automáticos — NO se agregan manualmente
  - "Eliminar" es **gris como el resto** — NO rojo/destructive
  - Grid/Cards: usar `EntityContextMenu` directo
  - Tabla: `DataTableContextMenuWrapper` delega a `EntityContextMenu` internamente
  - ⛔ NUNCA definir acciones manualmente (con `ContextMenuContent` inline) — SIEMPRE usar `EntityContextMenu`
  - ⛔ NUNCA duplicar acciones entre vista grid y vista tabla
- [ ] ⛔ `column.meta.contextMenu` NO genera ítems de context menu — inline editing en celdas es independiente
- [ ] Shared Popover Content para wallet/currency

### 5.4 Forms — Panels

- [ ] Forms con `openPanel()`, NUNCA `openModal()`
- [ ] Panel registrado en `panel-registry.ts`
- [ ] `setPanelMeta({ icon, title, description, size, footer })` en `useEffect`
- [ ] Footer container-managed: `footer: { submitLabel }` en `setPanelMeta`
- [ ] ⛔ NUNCA `<FormFooter>` manual — el container lo maneja
- [ ] ⛔ NUNCA `handleCancel` manual — el container llama `closePanel` automáticamente
- [ ] Recibe `formId` prop (inyectado por PanelProvider)
- [ ] `<form id={formId}>` — vincula con el botón submit del footer container
- [ ] ⛔ NUNCA `<form className="flex flex-col h-full">` — el container maneja scroll/layout
- [ ] Field Factories: `TextField`, `AmountField`, `SelectField`, etc.
- [ ] ⛔ NUNCA `<Input>`, `<Select>`, `<Textarea>` raw
- [ ] Chips: `DateChip`, `WalletChip`, `CurrencyChip`, `StatusChip`, etc.
- [ ] Billetera/Moneda usan Shared Popover Content

### 5.5 Cards y Charts

- [ ] `MetricCard` para KPIs, `ContentCard` para gráficos/contenido visual
- [ ] ⛔ LEGACY NO USAR: `DashboardKpiCard`, `DashboardCard`, `BentoCard`, `Widget*`
- [ ] Componentes visuales de feature usan `ContentCard` como wrapper (NO crear presets en `@/components/cards/presets`)
- [ ] Charts con `Lazy*` (LazyAreaChart, etc.)
- [ ] Colores HEX directos, NUNCA `hsl(var(--chart-X))`

### 5.6 Diálogos

- [ ] Confirmaciones = `Dialog` estilizado (gradiente, rounded-xl, shadow-2xl)
- [ ] Eliminaciones = `DeleteConfirmationDialog`
- [ ] ⛔ Forms = Panel. Diálogos = Dialog. NUNCA al revés.

### 5.7 Saved Views — ViewsTabs + ViewEditorBar (si aplica)

> **Aplica** a features con toolbar que tengan múltiples modos/filtros (listas, galerías, tablas). NO aplica a páginas simples como Settings o dashboards.

- [ ] `ViewsTabs` en el left slot de `ToolbarCard` — tab "Todos" + saved views + "+ Nueva vista"
- [ ] `ViewEditorBar` en el bottom slot (cuando `editingView !== null`) — input de nombre + Cancel/Save
- [ ] `ActiveFiltersBar` en el bottom slot (cuando `editingView === null` y hay filtros activos) — pills + "+" + "Limpiar" + "Guardar vista"
- [ ] "+ Nueva vista" → abre `ViewEditorBar` (NO crea vista inline en los tabs)
- [ ] "Guardar vista" → llama `handleCreateView` con filtros actuales + viewMode
- [ ] Context menu de tabs: "Editar vista" → abre `ViewEditorBar` precargado, "Renombrar", "Actualizar filtros", "Eliminar"
- [ ] CRUD actions: `createSavedView`, `updateSavedView`, `deleteSavedView` con **optimistic updates**
- [ ] Saved views query: `getSavedViews(orgId, entityType)` con `.eq('is_deleted', false)`
- [ ] `saved_views` table: `organization_id`, `entity_type`, `name`, `filters` (JSONB), `view_mode`, `position`
- [ ] ⛔ NUNCA input inline en la fila de tabs para crear — siempre `ViewEditorBar` en bottom

### 5.8 Context Menu Parity — Acciones idénticas entre vistas

> **Regla fundamental:** El context menu de un item NUNCA debe variar según el modo de visualización (tabla, grid, cards, kanban). La misma entidad = las mismas acciones.

- [ ] **Fuente única:** Las acciones del context menu se definen en UNA función/array compartido (ej. `getFileContextActions()`) y se consumen en TODAS las vistas
- [ ] **DataTable:** acciones pasan via `customActions` prop + `onView`/`onDelete` callbacks
- [ ] **Cards/Grid:** acciones renderizan como `ContextMenuItem` usando la misma función
- [ ] **Kanban (si aplica):** mismo patrón
- [ ] ⛔ NUNCA definir acciones de context menu inline distintas por modo de vista
- [ ] ⛔ NUNCA omitir acciones en un modo que existen en otro (ej. "Copiar link" en cards pero no en tabla)
- [ ] "Eliminar" siempre es la ÚLTIMA acción, separada por `ContextMenuSeparator`, color gris (NO rojo)

---

## CAPA 6: PERFORMANCE Y RESILIENCIA

### 6.1 Server Side

- [ ] Queries paralelas con `Promise.all` en `page.tsx`
- [ ] NO hay queries en `layout.tsx`
- [ ] No hay N+1 (una query por cada item en un loop)
- [ ] Queries con `.limit()` para listas que pueden crecer
- [ ] `getAuthUser()` de `@/lib/auth` (cached), NO `supabase.auth.getUser()` directo

### 6.2 Client Side

- [ ] `loading.tsx` con skeleton apropiado
- [ ] CRUD con optimistic updates (`useOptimisticList`)
- [ ] Búsqueda con debounce (via `useTableFilters`, 300ms)
- [ ] `startTransition` para navegación
- [ ] Heavy libs (Recharts, Google Maps) con `dynamic(() => import(...), { ssr: false })`
- [ ] Store selectors con `useShallow`
- [ ] No hay re-renders masivos (verificar con React DevTools si aplica)
- [ ] Imágenes comprimidas con `compressImage()` antes de upload

### 6.3 Soft Delete CORRECTO

- [ ] TODA operación de delete es soft delete: `.update({ is_deleted: true, deleted_at: now() })`
- [ ] ⛔ NUNCA `.delete()` real
- [ ] Todas las queries excluyen `is_deleted = true`
- [ ] Las vistas SQL excluyen `is_deleted = true`

---

## CAPA 7: FECHAS, i18n Y DOCUMENTACIÓN

### 7.1 Fechas

- [ ] `parseDateFromDB()` para leer fechas de DB
- [ ] `formatDateForDB()` para guardar fechas
- [ ] ⛔ NUNCA `new Date(stringFromDB)` directo
- [ ] Columnas de fecha con `createDateColumn`

### 7.2 i18n

- [ ] Rutas en `src/i18n/routing.ts` con ES/EN
- [ ] `Link` y `useRouter` de `@/i18n/routing` (NO `next/link`)
- [ ] NO construye URLs con template strings + locale
- [ ] Textos visibles en `messages/es.json`

### 7.3 Documentación

- [ ] MDX del feature en `content/docs/` (si aplica)
- [ ] `docsPath` en `ViewEmptyState` funciona (si usa docs)
- [ ] Botón docs del header funciona (`pushOverlay` → ContextSidebar)
- [ ] *(Opcional)* `features/<feature>/README.md` si hay lógica de negocio compleja no documentada en otro lado

---

## PROCESO DE EJECUCIÓN

### Fase 1: INVENTARIO (automático)

1. Listar TODOS los archivos del feature:
   - `src/features/<feature>/` (acciones, queries, views, forms, tables, components)
   - `src/app/[locale]/(dashboard)/organization/<feature>/` (pages)
   - `features/<feature>/TABLES.md` (esquema DB)
2. Contar: tablas, actions, queries, views, forms, pages

### Fase 2: AUDITORÍA POR CAPA

Para cada capa (1-7), recorrer CADA archivo relevante y verificar TODOS los checks.

**Orden de revisión:**
1. **DB** (Capa 1) — leer `TABLES.md`, verificar columnas/triggers/índices
2. **RLS** (Capa 2) — verificar políticas en `TABLES.md` o SQL scripts
3. **Backend** (Capa 3) — leer `actions.ts`, `queries.ts` línea por línea
4. **Páginas** (Capa 4) — leer `layout.tsx`, cada `page.tsx`
5. **Componentes** (Capa 5) — leer views, forms, tables
6. **Performance** (Capa 6) — verificar patrones
7. **Fechas/i18n/Docs** (Capa 7) — verificar estándares

### Fase 3: REPORTE

Generar el reporte en `<appDataDir>/brain/<conversation-id>/audit-<feature>.md` con:
- ✅ Check que pasa
- ❌ Check que falla (con archivo + línea + fix propuesto)
- ⚠️ Advertencia (no bloqueante pero recomendable)
- 🔒 Bloqueante (NO se puede lanzar sin arreglar)

**IMPORTANTE:** El reporte se presenta al usuario vía `notify_user` con `BlockedOnUser=true` para que revise y apruebe qué fixes aplicar.

### Fase 4: CORRECCIONES

Aplicar SOLO los fixes aprobados por el usuario. Ir actualizando el reporte conforme se corrigen.

### Fase 5: RE-VERIFICACIÓN

Volver a correr los checks FALLIDOS para confirmar que están resueltos.

### Fase 6: PERSISTENCIA (OBLIGATORIO)

Una vez que la auditoría está **COMPLETA** (todos los fixes aplicados y re-verificados):

1. **Copiar el reporte final** a `.agent/audits/features/<feature>.md`
   - Ejemplo: `.agent/audits/features/projects.md`, `.agent/audits/features/general-costs.md`
   - El archivo debe contener el estado final (con todos los fixes marcados como ✅)
2. **No borrar** el reporte del brain de conversación — queda como respaldo temporal
3. **Informar al usuario** que la auditoría fue persistida

> [!IMPORTANT]
> Los artefactos en `<appDataDir>/brain/<conversation-id>/` son efímeros y se pierden entre conversaciones.
> `.agent/audits/features/` es la ubicación permanente y accesible desde cualquier conversación futura.

---

## TEMPLATE DE REPORTE

```markdown
# 🔍 Auditoría Pre-Lanzamiento: [FEATURE]

> Fecha: [fecha]
> Estado: EN PROGRESO | COMPLETO

## Resumen

| Capa | ✅ OK | ❌ Falla | ⚠️ Advertencia | 🔒 Bloqueante |
|------|-------|---------|----------------|---------------|
| 1. Base de Datos | X | X | X | X |
| 2. RLS | X | X | X | X |
| 3. Server Actions/Queries | X | X | X | X |
| 4. Arquitectura de Página | X | X | X | X |
| 5. Componentes UI | X | X | X | X |
| 6. Performance | X | X | X | X |
| 7. Fechas/i18n/Docs | X | X | X | X |
| **TOTAL** | **X** | **X** | **X** | **X** |

---

## Capa 1: Base de Datos

### Tabla: `nombre_tabla`
- ✅ tiene `created_at`, `updated_at`
- ❌ falta `import_batch_id` → [FIX: agregar columna en `/DB/fix_xxx.sql`]
- ...

## Capa 2: RLS
...

## Capa 3: Server Actions / Queries

### `actions.ts`
- ✅ `createProject` — auth OK, soft delete OK, filtro org OK
- ❌ `deleteProject` — usa `.delete()` real en línea 145 → 🔒 BLOQUEANTE
- ...

### `queries.ts`
- ✅ `getOrganizationProjects` — filtra org + is_deleted
- ❌ `getProjectById` — no filtra `is_deleted` → [FIX: agregar `.eq("is_deleted", false)`]
- ...

## Capa 4-7: ...
(mismo formato)

---

## Fixes Aplicados

| # | Capa | Archivo | Fix | Estado |
|---|------|---------|-----|--------|
| 1 | 3 | actions.ts:145 | `.delete()` → soft delete | ✅ Aplicado |
| 2 | ... | ... | ... | ⏳ Pendiente |
```

---

## ORDEN DE REVISIÓN DE FEATURES

### Organización
1. ~~Visión General~~ ✅
2. ~~Planificación~~ ✅
3. ~~Documentación~~ ✅
4. Presupuestos
5. Finanzas
6. ~~Proyectos~~ ✅
7. Catálogo Técnico
8. ~~Contactos~~ ✅
9. Capital
10. ~~Gastos Generales~~ ✅
11. Informes
12. ~~Equipo~~ ✅ (migrada a Configuración > Miembros)
13. ~~Configuración~~ ✅
14. ~~Avanzado~~ ✅

### Proyecto
15. ~~Visión General del Proyecto~~ (Dashboard)
16. Planificación del Proyecto
17. ~~Documentación del Proyecto~~ ✅
18. Presupuestos del Proyecto
19. Finanzas del Proyecto
20. ~~Información~~ ✅
21. Salud
22. Tareas
23. Materiales
24. Mano de Obra
25. Subcontratos
26. Bitácora
27. Compromisos y Pagos
28. Portal de Clientes
