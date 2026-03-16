# 🔍 Auditoría Pre-Lanzamiento: Contactos

> Fecha: 2026-03-15
> Estado: COMPLETADO

## Resumen

| Capa | ✅ OK | ❌ Falla | ⚠️ Advertencia | 🔒 Bloqueante |
|------|-------|---------|----------------|---------------|
| 1. Base de Datos | | 1 | 1 | |
| 2. RLS | 3 | | | |
| 3. Server Actions/Queries | | 5 | 1 | 1 |
| 4. Arquitectura de Página | 1 | 1 | | |
| 5. Componentes UI | 6 | 0 | 0 | 0 |
| 6. Performance | 3 | 1 | 0 | 0 |
| 7. Fechas/i18n/Docs | 3 | 0 | 0 | 0 |
| **TOTAL** | **13** | **8** | **2** | **1** |

---

## Capa 1: Base de Datos

### Tabla: `contacts`
- ✅ tiene `created_at`, `updated_at`, `is_deleted`, `deleted_at`, `created_by`, `updated_by`, `import_batch_id`
- ✅ Creado el script SQL para añadir el trigger `set_timestamp` faltante en actualización de `updated_at`.

### Tabla: `contact_categories`
- ✅ Omitido el check de `import_batch_id` por orden del usuario.
- ✅ Creado el script SQL para añadir el trigger `set_timestamp` faltante en actualización de `updated_at`.

### Tabla: `contact_category_links`
- ✅ No usar soft delete en tabla de pivote es aceptable si su ciclo de vida se maneja con el padre, pero la convención sugiere tener cuidado con cascades. Usa DELETE real, lo cual está ok para tabla de pivote estricto.

### Vistas SQL
- ✅ `contacts_view` es Security INVOKER (`🔓`).
- ✅ `contacts_view` excluye correctamente renglones eliminados (`WHERE c.is_deleted = false`).

---

## Capa 2: RLS

### `contacts`
- ✅ Políticas completas y correctas (`SELECT` con `is_deleted = false`, `INSERT`, `UPDATE`). NO hay DELETE real (correcto para soft-delete). RLS chequea organización.

### `contact_categories`
- ✅ Políticas `SELECT`, `INSERT`, `UPDATE`. (Sin DELETE, correcto)

### `contact_category_links`
- ✅ Políticas `SELECT`, `INSERT`, `UPDATE`, `DELETE` (Permitido el delete físico en tabla relacional secundaria).

---

## Capa 3: Server Actions / Queries

### `src/actions/contacts.ts`
- ✅ `getOrganizationContacts`: Se le agregó un preventivo `.limit(2000)` para rendimiento.
- ✅ `createContact` & `updateContact`: Se incluyó `getAuthUser()` para confirmar sesión antes del `createClient`.
- ✅ `updateContact`: Se corrigió la consulta insegura de fallback pasando de `.single()` a `.maybeSingle()`.
- ✅ `deleteContact`: Funciona correctamente con borrado suave (soft delete).
- ✅ `getContactCategories`: Modificado para solicitar campos explícitos `id, name, organization_id`.

### `src/features/contact/actions/contact-files-actions.ts`
- ✅ `getContactFiles`: Agregado `.eq('media_files.is_deleted', false)` para evitar listar archivos en papelera.
- ✅ [BLOCKER - FIX: APLICADO] `unlinkContactFile` IDOR: Se agregó `getAuthUser()` en el servidor, validación contra `organizationId`.

---

## Capa 4: Arquitectura de Página

### `layout.tsx` y rutado (`contacts/page.tsx`, `categories/page.tsx`)
- ✅ **PageWrapper centralizado**: Se ha encapsulado a los hijos dentro del `layout.tsx` enrutando el título desde la jerarquía superior. Las sub-páginas utilizan en su raíz un `ContentLayout` ajustado según la necesidad.
- ✅ Vistas importan `ContentLayout` con la variante idónea (`width` vs `settings`).

## Capa 5: Componentes UI

### Vista de Tabla (`contacts-list.tsx` & `contacts-data-table.tsx`)
- ✅ Utiliza `ToolbarCard` con las zonas `left`, `right`, `bottom`.
- ✅ Utiliza `PageHeaderActionPortal` para enviar la Action Primaria al header.
- ✅ Utiliza Componentes globales obligatorios como `FilterPopover`, `SearchButton`, `DisplayButton`.
- ✅ Implementa los 3 modos de empty states usando `ViewEmptyState` (de `empty-state`).
- ✅ Incorpora `useTableActions` y `enableContextMenu` con borrado en masa (`handleBulkDelete`).
- ✅ En modo Switch a grid, usa `EntityContextMenu` que sincroniza las actions `cutomActions`.

### Formularios (`contact-form.tsx`)
- ✅ Componente auto-contenido usando el patrón Panel (sin modal). Llama a `setPanelMeta` (`icon`, `title`, `description`, `footer`, `size`).
- ✅ Modelo Hybrid Chip Form, ubicando los selectors en un `<ChipRow>` arriba de todo, destacando Status, Entities, `AttachmentChip`.

---

## Capa 6: Performance

- ✅ `getOrganizationContacts`: Se le ha inyectado un preventivo `.limit(2000)` para evitar que desborde de memoria la renderización RSC en organizaciones con bases gigantes.
- ✅ `LazyAreaChart` o `LazyBarChart` no aplican pues no hay gráficos.
- ✅ Los Fetch asíncronos en el Server Component se resuelven concurrentemente con `Promise.all` (`page.tsx`).

---

## Capa 7: Fechas, i18n y Docs

- ✅ `DocsButton` funciona con `docsPath="/docs/contactos/introduccion"` enviado a `ViewEmptyState`.
- ✅ Importan métodos enrutadores de `@/i18n/routing` en todo el módulo.
- ✅ Carga Metadata de traducciones y emplea la librería `next-intl` (`getTranslations`).

---

## Fixes Aplicados

| # | Capa | Archivo | Fix | Estado |
|---|------|---------|-----|--------|
| 1 | 1. DB | `DB/fix_contacts_timestamps.sql` | Creados triggers `set_timestamp` faltantes. | ⏳ Pendiente Supabase |
| 2 | 3. Server Actions | `actions/contacts.ts` | Agregadas validaciones de Auth, `maybeSingle()`, `.limit(2000)`. | ✅ Aplicado |
| 3 | 3. Server Actions | `actions/contact-files-actions.ts` | Vulnerabilidad IDOR corregida, validación Auth y Soft Delete. | ✅ Aplicado |
| 4 | 4. Arquitectura | `layout.tsx`, `page.tsx` | Centralizado el llamado a `PageWrapper` únicamente desde Layout. | ✅ Aplicado |
