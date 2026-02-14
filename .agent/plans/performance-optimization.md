---
name: Performance Optimization Roadmap
description: Plan de 6 pasos para lograr navegación instantánea (<200ms) y dashboard progresivo en Seencel V2.
created: 2026-02-14
status: pendiente
---

# Performance Optimization Roadmap

**Meta**: Click en sidebar cambia la vista instantáneamente (<200ms visual). Dashboard renderiza estructura de inmediato, widgets se llenan progresivamente.

**Diagnóstico completo**: Ver auditoría en `C:\Users\Usuario\.gemini\antigravity\brain\1689bd61-28e1-4726-9c59-da34ce4ef7eb\implementation_plan.md`

---

## Paso 1 — Layout Caching ✴️ MAYOR IMPACTO

**Archivo**: `src/app/[locale]/(dashboard)/layout.tsx`

**Cambio**:
- Eliminar `export const dynamic = 'force-dynamic'`
- Next.js detecta automáticamente que el layout usa cookies (Supabase) y lo hace dinámico sin forzarlo
- `force-dynamic` desactiva el caché de Request Deduplication de Next.js, forzando re-fetch completo en cada navegación

**Impacto esperado**: -1.5s en navegación (elimina re-ejecución innecesaria del layout)

**Estado**: [x] Completado (2026-02-14) — Navegación ~300ms vs ~2.5-3s previo

---

## Paso 2 — Layout Minimal

**Archivos**: `src/app/[locale]/(dashboard)/layout.tsx`, `src/features/organization/queries.ts`

**Cambio**:
- Reducir queries del layout a lo estrictamente necesario: `getUserProfile()` + `getActiveOrganizationId()` + permisos mínimos
- Mover `getOrganizationFinancialData()` fuera del layout → al contexto financiero (solo donde se usa)
- Mover `getOrganizationProjects()` fuera del layout → a las páginas que lo necesitan
- Mover `getClientsByOrganization()` fuera del layout → a las páginas que lo necesitan
- Paralelizar las queries restantes con `Promise.all`

**Impacto esperado**: -0.5s en navegación

**Estado**: [x] Completado (2026-02-14) — Layout ahora hace 4 queries paralelas en vez de ~8 secuenciales. Datos pesados cargados lazy.

---

## Paso 3 — Dashboard No Bloqueante

**Archivos**: `src/app/[locale]/(dashboard)/organization/page.tsx`, widgets individuales

**Cambio**:
- Eliminar `prefetchOrgWidgetData()` como bloque monolítico
- Cada widget carga sus propios datos de forma autónoma (ya lo hacen como fallback, convertirlo en patrón principal)
- Usar `<Suspense fallback={<WidgetSkeleton />}>` para cada widget
- El dashboard renderiza la grilla de widgets inmediatamente, cada uno muestra skeleton y luego se llena

**Impacto esperado**: Dashboard visible en <200ms, widgets aparecen progresivamente en 0.5-1s

**Estado**: [x] Completado (2026-02-14) — Eliminado prefetch monolítico de 14 queries. Widgets cargan datos autónomamente con skeletons.

---

## Paso 4 — LIMIT + Queries Seguras 🔧 Requiere SQL

**Archivos SQL** (crear en `/DB`):
- `fn_financial_kpi_summary.sql` — Función SQL con `SUM()` para ingresos/egresos en vez de traer todos los registros
- `fn_storage_overview.sql` — Función SQL con `SUM(file_size)` + `GROUP BY file_type` en vez de traer todos los archivos

**Archivos TS**:
- `src/actions/widget-actions.ts` — Agregar `LIMIT` a queries sin límite:
  - `project_data` JOIN `projects` → `.limit(50)`
  - Reemplazar query JS de movimientos financieros por RPC call a la función SQL
  - Reemplazar query JS de storage por RPC call a la función SQL

**⚠️ Requiere que el usuario ejecute los .sql en Supabase antes de los cambios TS**

**Estado**: [/] TS implementado (2026-02-14) — Esperando ejecución de SQL en Supabase para activar RPC calls.

---

## Paso 5 — Galería Rápida

**Archivos**: `src/components/widgets/files/recent-files-widget.tsx`, `src/actions/widget-actions.ts`

**Cambio**:
- Usar Supabase Image Transformations para generar thumbnails on-the-fly: `?width=256&height=256&resize=cover`
- O bien generar thumbnails al momento de subir archivos
- Reducir `MAX_ITEMS` de 36 a 12 para el widget (el resto se ve en la galería completa)
- Cachear signed URLs en el state del widget (no regenerar en cada render)

**Impacto esperado**: -2-5s en carga de galería, -90% ancho de banda

**Estado**: [x] Completado (2026-02-14) — MAX_ITEMS reducido de 36 a 12, thumbnails 256px con Supabase Storage Transformations.

---

## Paso 6 — Mapa sin Duplicación

**Archivo**: `src/components/widgets/organization/overview-widget.tsx`

**Cambio**:
- Eliminar el fallback client-side que re-ejecuta 5 queries si `initialData` falta
- Si `initialData` está vacío, mostrar estado vacío en vez de re-fetchar
- Lazy load de Google Maps JS solo si hay ubicaciones (dynamic import)

**Impacto esperado**: -200KB JS bundle, eliminación de queries duplicadas

**Estado**: [x] Completado (2026-02-14) — fetchHeroData client-side (115 líneas, 5+ queries) reemplazado por server action getOverviewHeroData.

---

## Orden de Ejecución

```
Paso 1 (Layout Caching)     → Solo frontend, mayor impacto
  ↓
Paso 2 (Layout Minimal)     → Solo frontend, segundo mayor impacto
  ↓
Paso 3 (Dashboard Progresivo) → Solo frontend, mejora UX
  ↓
Paso 4 (SQL + LIMIT)        → Requiere SQL en Supabase
  ↓
Paso 5 (Galería)             → Depende de Supabase Image Transforms
  ↓
Paso 6 (Mapa)                → Cleanup final
```
