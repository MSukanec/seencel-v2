# 🔍 Auditoría Pre-Lanzamiento: ARCHIVOS

> Fecha: 2026-03-15 (actualizada)
> Fuente DB: `DB/schema/public/` (generado 2026-03-14)
> Estado: **COMPLETA ✅**

## Resumen

| Capa | ✅ OK | ❌ Falla | ⚠️ Aviso | 🔒 Bloqueante |
|------|-------|---------|----------|---------------|
| 1. Base de Datos | 9 | 0 | 0 | 0 |
| 2. RLS | 7 | 0 | 0 | 0 |
| 3. Server Actions/Queries | 14 | 0 | 0 | 0 |
| 4. Arquitectura de Página | 7 | 0 | 0 | 0 |
| 5. Componentes UI | 12 | 0 | 1 | 0 |
| 6. Performance | 7 | 0 | 0 | 0 |
| 7. Fechas/i18n/Docs | 4 | 0 | 0 | 0 |
| **TOTAL** | **60** | **0** | **1** | **0** |

---

## Capa 1: Base de Datos ✅

> Fuente: `DB/schema/public/tables_1.md` + `triggers.md`

### Tablas: `media_files`, `media_links`, `saved_views`

- ✅ `created_at`, `updated_at` (NOT NULL DEFAULT now())
- ✅ `is_deleted`, `deleted_at` (soft delete)
- ✅ `created_by`, `updated_by` → `organization_members(id)`
- ✅ Triggers: `set_timestamp` + `handle_updated_by` + audit log
- ✅ `saved_views` tiene org_id, entity_type, position, filters JSONB

---

## Capa 2: RLS ✅

- ✅ Recurso **cross-feature** — `is_org_member(organization_id)` es correcto
- ✅ No corresponde crear `files.view`/`files.manage` (rompería cross-feature)
- ✅ `saved_views` — RLS `is_org_member(organization_id)` para CRUD

---

## Capa 3: Server Actions / Queries ✅

### [actions.ts](file:///c:/Users/Usuario/Seencel/seencel-v2/src/features/files/actions.ts) (276 líneas, 6 funciones)

- ✅ `"use server"` en archivo
- ✅ Auth: `getAuthUser()` en todas las actions (deleteFile, uploadFiles, createSavedView, updateSavedView, deleteSavedView)
- ✅ Soft delete: `.update({ is_deleted: true, deleted_at })` en deleteFile y deleteSavedView
- ✅ `try/catch` con `{ success, error }` en todas
- ✅ `revalidatePath` en todas

### [queries.ts](file:///c:/Users/Usuario/Seencel/seencel-v2/src/features/files/queries.ts) (168 líneas, 4 funciones)

- ✅ `getFiles` — select explícito, org filter, `is_deleted` filter, `.limit(500)`, **batch signed URLs** (1 call per bucket)
- ✅ `getStorageStats` — select explícito (`file_type, file_size`), org filter, `is_deleted` filter
- ✅ `getSavedViews` — select explícito, org filter, `is_deleted` filter, order by position

---

## Capa 4: Arquitectura de Página ✅

```
app/[locale]/(dashboard)/organization/files/
├── layout.tsx     ← Auth (requireAuthContext) SIN queries SIN ContentLayout ✅
├── page.tsx       ← ContentLayout variant="wide", generateMetadata, Promise.all, try/catch ✅
├── loading.tsx    ← PageSkeleton ✅
└── settings/
    └── page.tsx   ← ContentLayout variant="settings", generateMetadata, Promise.all, try/catch ✅
```

- ✅ Sidebar-first: sub-secciones "Visión General" + "Ajustes" como rutas reales
- ✅ Sidebar navigation definida en `use-sidebar-navigation.ts`
- ✅ Rutas en `src/i18n/routing.ts` con ES/EN

---

## Capa 5: Componentes UI ✅

- ✅ `ToolbarCard` inline (no legacy `Toolbar portalToHeader`)
- ✅ `PageHeaderActionPortal` para acción "Subir Archivo"
- ✅ `ViewsTabs` — tabs de vistas guardadas con context menu  
- ✅ `ViewEditorBar` — editor inline de vistas (Linear-style) con Cancel/Save
- ✅ `ActiveFiltersBar` — segunda fila con pills de filtros activos, "+", "Limpiar"
- ✅ `FilterPopover` con `variant="plus"` para botón "+"
- ✅ `SearchButton` integrado
- ✅ `DisplayButton` con 3 modos (explorar, galería, tabla)
- ✅ `DataTable` con `enableContextMenu`, `customActions` unificado
- ✅ Context menu **idéntico** entre cards y tabla (función `getFileContextActions`)
- ✅ `DeleteConfirmationDialog` (no AlertDialog manual)
- ⚠️ Vista principal ~1195 líneas (recomendable extraer componentes, no bloqueante)

---

## Capa 6: Performance ✅

- ✅ `Promise.all` en page.tsx (4 queries paralelas)
- ✅ Batch signed URLs (1 `createSignedUrls` por bucket, no N+1)
- ✅ `loading.tsx` con PageSkeleton
- ✅ Optimistic updates: create/delete/rename views, delete files
- ✅ YARL lightbox con `dynamic()` lazy load
- ✅ `useTableFilters` con debounce
- ✅ `.limit(500)` en query principal

---

## Capa 7: Fechas / i18n / Docs ✅

- ✅ `parseDateFromDB()` en `formatFileDate`
- ✅ `useRouter` de `@/i18n/routing`
- ✅ Empty state con `docsPath`
- ✅ Textos en español

---

## Pendientes menores (no bloqueantes)

| # | Capa | Descripción | Prioridad |
|---|------|-------------|:---------:|
| UI5 | 5 | Extraer componentes del gallery view (~1195 → ~300 líneas) | Baja |

## Features agregados (sesión 2026-03-15)

| Feature | Componente | Estado |
|---------|-----------|--------|
| Saved Views (CRUD) | `ViewsTabs` + `ViewEditorBar` + actions | ✅ |
| Active Filters Bar | `ActiveFiltersBar` (pills + limpiar + guardar) | ✅ |
| Filter Popover "+" variant | `FilterPopover variant="plus"` | ✅ |
| Context menu unificado | `getFileContextActions()` (cards + tabla) | ✅ |
| Columna thumbnail | `files-columns.tsx` render con preview | ✅ |
| Sidebar-first layout | `layout.tsx` + settings sub-page | ✅ |
| Columna proyecto primer lugar | `files-columns.tsx` reorder | ✅ |
| Nombres corregidos | "Módulo"→"Herramienta", "Clientes"→"Pagos" | ✅ |
| Cincel island CSS fix | Selectores ampliados a 3 niveles | ✅ |
