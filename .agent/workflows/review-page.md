---
description: Workflow para revisar una página antes de lanzamiento. Se activa cuando el usuario dice "revisemos X página".
---

# /review-page — Revisión Pre-Lanzamiento de Página

Este workflow se ejecuta **cada vez** que el usuario dice "revisemos X página".
El objetivo es verificar que la página cumple con TODOS los estándares de Seencel antes de lanzar.

---

## ANTES DE EMPEZAR

1. **Leer las rules y skills relevantes** al feature:
   - Leer el skill `seencel-page-layout` → `c:\Users\Usuario\Seencel\seencel-v2\.agent\skills\seencel-page-layout\SKILL.md`
   - Leer el skill `seencel-ui-patterns` → `c:\Users\Usuario\Seencel\seencel-v2\.agent\skills\seencel-ui-patterns\SKILL.md`
   - Leer el skill `seencel-forms-modals` → `c:\Users\Usuario\Seencel\seencel-v2\.agent\skills\seencel-forms-modals\SKILL.md`
   - Leer el skill `seencel-architecture` → `C:\Users\Usuario\.gemini\antigravity\skills\seencel-architecture\SKILL.md`

2. **Leer la documentación del feature**:
   - Leer `features/<feature>/TABLES.md` para entender el esquema de datos
   - Leer `features/<feature>/README.md` si existe, para contexto funcional

3. **Abrir la página en el browser** para ver el estado visual actual

---

## CHECKLIST DE REVISIÓN

Para cada página, verificar los siguientes puntos en orden. NO pasar al siguiente paso hasta completar todos.

### 1. ARQUITECTURA DE PÁGINA (`page.tsx`)

- [ ] `page.tsx` es Server Component (sin `"use client"`)
- [ ] Las Views se importan directamente en `page.tsx` (sin `*-page.tsx` intermediario client)
- [ ] No existe `*-page.tsx` client intermediario innecesario (Pattern B deprecado)
- [ ] `generateMetadata` exportada con `robots: "noindex, nofollow"`
- [ ] `try/catch` con `ErrorDisplay` para data fetching
- [ ] Si tiene tabs, se renderizan en el Server Component
- [ ] Usa `PageWrapper` con `icon` y `title`

### 2. TABS Y VISTAS

- [ ] Cada `TabsContent` tiene clases: `flex-1 m-0 overflow-hidden data-[state=inactive]:hidden`
- [ ] Los tabs se renderizan en el header vía `portal-to-header` o equivalente
- [ ] Cada vista/tab existe como componente separado en `views/`

### 3. EMPTY STATE (`ViewEmptyState`)

- [ ] Usa `ViewEmptyState` de `@/components/shared/empty-state` (NO el viejo de `@/components/ui/empty-state`)
- [ ] Tiene variante `mode="empty"` con:
  - `icon` (mismo ícono de la página)
  - `viewName` (nombre de la vista)
  - `featureDescription` (descripción extensa del feature, **~4 líneas visibles** con `max-w-lg` — no agobiar al usuario)
  - `onAction` + `actionLabel` (botón de acción principal)
  - `docsPath` (ruta a la documentación — ver paso de DOCUMENTACIÓN)
- [ ] Tiene variante `mode="no-results"` con:
  - `onResetFilters` (limpiar filtros)
  - `filterContext` (contexto adicional)
- [ ] Para vistas con tabs, se usa UN empty unificado (no uno por tab)

### 4. TOOLBAR

- [ ] Usa `Toolbar` con `portalToHeader={true}`
- [ ] Usa `actions={[...]}` (array de objetos con `label`, `icon`, `onClick`)
- [ ] NO tiene dropdowns custom hardcodeados
- [ ] NO usa `children` del Toolbar para botones custom
- [ ] Búsqueda tiene debounce (300ms mínimo)

### 5. DATATABLES

- [ ] Si la vista tiene tablas, las columnas usan Column Factories de `@/components/shared/data-table/columns`
- [ ] Columnas de fecha usan `createDateColumn` (NO formato inline con `formatDistanceToNow`)
- [ ] Columnas de texto usan `createTextColumn` (con `customRender` si necesitan render especial)
- [ ] Columnas de dinero usan `createMoneyColumn`
- [ ] Si necesitan `filterFn` custom, se usa spread: `{ ...createTextColumn({...}), filterFn: ... }`
- [ ] Columnas con renders muy custom (ej: avatar + rol) pueden quedar inline, documentar por qué

### 6. FORMULARIOS Y MODALES

- [ ] Modales usan `ModalWrapper` del modal-store (NO `Dialog` directo)
- [ ] Forms tienen footer sticky con `FormFooter`
- [ ] Validación con feedback visual (no solo toast)
- [ ] Campos obligatorios marcados con `required`
- [ ] Operaciones de borrado tienen confirmación con `AlertModal`

### 7. NAVEGACIÓN RÁPIDA

- [ ] Existe `loading.tsx` en la carpeta de la ruta con skeleton apropiado
- [ ] Las queries en `page.tsx` usan `Promise.all` para fetch paralelo (no secuencial)
- [ ] Los `<Link>` de navegación principales tienen `prefetch` habilitado

### 8. PERFORMANCE

- [ ] Operaciones CRUD usan optimistic updates (`useOptimisticList` o equivalente)
- [ ] NO se usa `router.refresh()` como único mecanismo de update post-mutación
- [ ] Búsqueda tiene debounce
- [ ] Vista muestra skeletons o loading states durante carga

### 9. INTERNACIONALIZACIÓN

- [ ] Ruta definida en `src/i18n/routing.ts` con ambos idiomas (es/en)
- [ ] Usa `Link` y `useRouter` de `@/i18n/routing` (NO de `next/link` o `next/navigation`)
- [ ] NO construye URLs manualmente con template strings y locale

### 10. FECHAS Y TIMEZONES

- [ ] Usa `parseDateFromDB()` para leer fechas de la base de datos
- [ ] Usa `formatDateForDB()` para guardar fechas
- [ ] NO usa `new Date(stringFromDB)` directo

### 11. SEGURIDAD Y RLS

- [ ] Las queries del server leen datos a través de vistas o queries con filtro `organization_id`
- [ ] No hay queries sin filtro de organización (evitar data leakage)
- [ ] Las acciones (mutations) validan ownership o membership antes de operar

### 12. DOCUMENTACIÓN DEL FEATURE

> ⚠️ Este paso se deja para el FINAL de la revisión de TODAS las páginas.

- [ ] Existe la documentación MDX del feature en el sistema de docs
- [ ] El `docsPath` en el `ViewEmptyState` apunta a la documentación correcta
- [ ] El botón de documentación funciona correctamente (abre en nueva tab)

---

## PROCESO DE EJECUCIÓN

Para cada página, seguir este flujo:

1. **Abrir la página en el browser** → tomar screenshot
2. **Revisar `page.tsx`** → puntos 1 y 2 del checklist
3. **Revisar cada view** → puntos 3, 4, 5 del checklist
4. **Revisar forms/modales** → punto 5 del checklist
5. **Revisar navegación** → punto 6 del checklist (`loading.tsx`, `Promise.all`, prefetch)
6. **Revisar performance** → punto 7 del checklist (optimistic, debounce)
7. **Revisar routing** → punto 8 del checklist
8. **Revisar queries/actions** → puntos 9 y 10 del checklist
9. **Reportar al usuario**:
   - ✅ Qué cumple
   - ❌ Qué no cumple (con fix propuesto)
   - 🔒 Qué hay que bloquear (feature incompleto)
10. **Aplicar fixes** aprobados por el usuario
11. **Marcar la documentación como pendiente** (punto 11 — se hace al final de todo)

---

## AL TERMINAR TODAS LAS PÁGINAS

1. Preguntar al usuario qué quiere incluir en la documentación de cada feature
2. Crear los archivos MDX de documentación
3. Conectar los `docsPath` en los empty states y toolbars
4. Verificar que todo funcione

---

## ORDEN DE REVISIÓN

### Organización
1. ~~Visión General (`/organization`)~~ ✅
2. ~~Agenda / Planner (`/organization/planner`)~~ ✅
3. Archivos (`/organization/files`)
4. Presupuestos (`/organization/quotes`)
5. Finanzas (`/organization/finance`)
6. Proyectos (`/organization/projects`)
7. Identidad (`/organization/identity`)
8. Catálogo Técnico (`/organization/catalog`)
9. Contactos (`/organization/contacts`)
10. Capital (`/organization/capital`)
11. Gastos Generales (`/organization/general-costs`)
12. Informes (`/organization/reports`)
13. Avanzado (`/organization/advanced`)
14. Configuración (`/organization/settings`)

### Proyecto
15. Visión General del Proyecto
16. Agenda del Proyecto
17. Archivos del Proyecto
18. Presupuestos del Proyecto
19. Finanzas del Proyecto
20. Información
21. Salud
22. Tareas
23. Materiales
24. Mano de Obra
25. Subcontratos
26. Bitácora
27. Compromisos y Pagos
28. Portal de Clientes
