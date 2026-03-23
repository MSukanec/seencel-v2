---
name: Seencel Page Layout Standard
description: Estándar OBLIGATORIO para crear nuevas páginas (Page + Views) en Seencel V2. Define arquitectura Server/Client, Sidebar-First Navigation, Route Tabs (routeTabs), Metadata, Error Handling y Toolbars.
---

# Seencel Page Layout Standard

## 🚨 NAMING CONVENTION: PAGES vs VIEWS (CRÍTICO)

> [!CAUTION]
> Esta convención es **OBLIGATORIA**. No hay excepciones. Si no la seguís, el código se rechaza.

### Estructura en Feature

```
src/features/[feature]/
├── pages/                               # 🖥️ SERVER COMPONENTS
│   ├── index.ts
│   ├── [feature]-list-page.tsx          # Server: fetch + render lista
│   └── [feature]-detail-page.tsx        # Server: fetch + render detalle
└── views/                               # 👁️ CLIENT COMPONENTS  
    ├── [feature]-list-view.tsx          # Client: UI de lista
    ├── [feature]-overview-view.tsx      # Client: Tab resumen
    ├── [feature]-items-view.tsx         # Client: Tab ítems
    └── [feature]-settings-view.tsx      # Client: Tab settings
```

### Naming Pattern

| Carpeta | Sufijo | Propósito | Ejemplo |
|---------|--------|-----------|---------| 
| **`pages/`** | `-page.tsx` | **Server Component** - Data fetching | `quotes-list-page.tsx` |
| **`views/`** | `-view.tsx` | **Client Component** - UI interactiva | `quotes-list-view.tsx` |

> [!WARNING]
> **⛔ PROHIBIDO:** Usar `-page.tsx` en `views/` - esto causa CONFUSIÓN
> 
> El sufijo `-page` está **RESERVADO** para Server Components en `pages/`

### Ejemplo Real: `quotes`

```
src/features/quotes/
├── pages/
│   ├── index.ts
│   ├── quotes-list-page.tsx       # Server: fetch lista de quotes
│   └── quote-detail-page.tsx      # Server: fetch detalle de quote
├── views/
│   ├── quotes-list-view.tsx       # Client: UI de la lista
│   ├── quote-overview-view.tsx    # Client: Tab resumen
│   ├── quote-base-view.tsx        # Client: Tab ítems
│   └── quote-change-orders-view.tsx # Client: Tab adicionales
└── forms/
    ├── quote-form.tsx
    └── quote-item-form.tsx
```

### Flujo de Imports

```
app/[locale]/.../page.tsx
    └── importa → QuotesListPage from pages/quotes-list-page.tsx (Server)
                       └── importa → QuotesListView from views/quotes-list-view.tsx (Client)
```

> [!IMPORTANT]
> **La separación es clara:**
> - `pages/` = Server Components que hacen fetch y pasan datos
> - `views/` = Client Components con "use client" que manejan interacción

---



## 🚨 Reglas de Oro (Resumen Ejecutivo)

1.  **Architecture**: Páginas con múltiples secciones utilizan **RouteTabs** (cada tab es una página/ruta separada).
2.  **RAIL Navigation**: ⛔ PROHIBIDO usar submenús, drill-downs o `children` en el Sidebar. El Sidebar es estrictamente Nivel 1.
3.  **Route Tabs**: Se DEBE usar la prop `routeTabs` en el componente `PageWrapper` (layout) o `DetailContentTabs` en el header del cliente. ⛔ PROHIBIDO usar el componente `<Tabs>` local de shadcn para navegar secciones enteras en el body.
4.  **Metadata**: TODA página/sub-página debe exportar `generateMetadata` (con título y robots).
5.  **Error Handling**: Usar `try/catch` y `<ErrorDisplay>` en el servidor para evitar pantallas blancas.
6.  **Toolbar**: Usar `ToolbarCard` inline + `PageHeaderActionPortal`. ⛔ NO usar `Toolbar portalToHeader` (legacy).
7.  **EmptyState**: Usar `ViewEmptyState` de `@/components/shared/empty-state`. Responsabilidad de la **View**, prohibido en DataTables.
8.  **Header**: Solo breadcrumb centrado + tabs (si aplica `routeTabs`) + CurrencyModeSelector (si aplica) + DocsButton. SIN avatar, SIN notificaciones.

---

## 📁 0. Arquitectura de Carpetas (Feature-First)

### `src/components` (UI Agnóstico)

Reservado **EXCLUSIVAMENTE** para componentes genéricos:

| Carpeta | Propósito |
|---------|-----------|
| `ui/` | Primitivos atómicos (Button, Input, Select). Componentes Shadcn. |
| `layout/` | Estructura visual (Header, Sidebar, Footer, PageWrapper). |
| `shared/` | Componentes reusables complejos (DeleteModal, FormFooter, DataTable). |
| `charts/` | Componentes de gráficos (BaseBarChart, BasePieChart, etc.). |
| `cards/` | Sistema unificado de cards (MetricCard, ChartCard). |

> ⛔ **PROHIBIDO**: Crear carpetas de negocio aquí (ej. `src/components/users`).
> ⛔ **PROHIBIDO**: Usar `src/components/global`. Usar `shared` en su lugar.

### `src/features` (Dominio y Negocio)

Toda la lógica específica de features vive aquí:

```
src/features/[feature]/
├── TABLES.md                            # 📋 SOLO LECTURA - Esquema de tablas DB
├── actions.ts                           # Server actions
├── queries.ts                           # Server queries (lectura)
├── types.ts                             # TypeScript types
├── forms/                               # 📝 Formularios (ver skill seencel-forms-modals)
│   ├── [feature]-[entity]-form.tsx
│   └── [feature]-[other]-form.tsx
├── tables/                              # 📊 Definiciones de columnas de DataTable
│   └── [entity]-columns.tsx             # Columnas extraídas + constantes
├── pages/                               # 🖥️ SERVER COMPONENTS (data fetching)
│   ├── index.ts                         # Exporta todas las pages
│   ├── [feature]-list-page.tsx          # Server Component: lista
│   └── [feature]-detail-page.tsx        # Server Component: detalle
└── views/                               # 👁️ CLIENT COMPONENTS (UI interactiva)
    ├── [feature]-list-view.tsx          # Client: ORQUESTA hooks + UI (~150-200 líneas)
    ├── [feature]-overview-view.tsx      # Client: Tab resumen/overview
    ├── [feature]-[tab1]-view.tsx        # Client: Tab específico 1
    ├── [feature]-[tab2]-view.tsx        # Client: Tab específico 2
    └── [feature]-settings-view.tsx      # Client: Tab settings
```

> [!CAUTION]
> **TABLES.md es SOLO LECTURA**. Contiene el esquema de las tablas de la base de datos del feature.
> - ✅ **PERMITIDO**: Leerlo para entender la estructura de datos
> - ⛔ **PROHIBIDO**: Modificarlo. Solo el usuario puede editarlo.

> [!IMPORTANT]
> **Pages vs Views - DIFERENCIA CRÍTICA:**
> - `pages/` → **Server Components** que hacen data fetching y pasan props a views
> - `views/` → **Client Components** con "use client" que manejan UI interactiva
>
> **El flujo es:** `app/page.tsx` → importa → `pages/[feature]-*-page.tsx` → importa → `views/[feature]-*-view.tsx`

> [!WARNING]
> **Naming Convention OBLIGATORIA:**
> - `-page.tsx` SOLO en carpeta `pages/` (Server Components)
> - `-view.tsx` SOLO en carpeta `views/` (Client Components)
> - ⛔ **PROHIBIDO**: Usar `-page.tsx` en `views/` - esto causa confusión

> [!IMPORTANT]
> **Forms:** SIEMPRE van en `src/features/[feature]/forms/`, NO en `components/forms/`.
> Ver skill `seencel-forms-modals` para naming convention de forms.

**Regla**: Si un componente importa lógica de negocio (actions, queries) → pertenece a Features.

### Convenciones de Nombrado

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Archivos/Dirs | ✅ kebab-case | `delete-confirmation-modal.tsx` |
| Componentes | ✅ PascalCase | `export function UserProfile()` |
| ❌ Incorrecto | PascalCase en archivos | `DeleteConfirmationModal.tsx` |

---

## 🏗️ 1. Estructura de Archivos

```mermaid
graph TD
    P[page.tsx (Server)] -->|Importa| L[Layout Components]
    P -->|Passes Data| V[Views (Client)]
    V -->|Usa| T[Toolbar]
    V -->|Usa| C[Components/Tables]
```

- **`page.tsx`**: Solo fetch de datos iniciales y estructura base (`PageWrapper` + `Tabs`).
- **`views/`**: Componentes cliente (`"use client"`) que manejan la UI real de cada tab.

---

## 🧱 2. Implementación de Páginas con Sub-secciones

> **Decisión RAIL Navigation (Marzo 2026):** Toda la navegación en el Sidebar es PLANA (sin sub-menús). El patrón OBLIGATORIO para navegar sub-secciones es mediante **Tabs en el Header** (rutas reales conectadas mediante la prop `routeTabs` del `PageWrapper`).

### Patrón obligatorio:

```
app/[locale]/(dashboard)/organization/[feature]/
├── layout.tsx      ← Auth + PageWrapper (COMPARTIDO)
├── page.tsx        ← Sub-página raíz + ContentLayout
├── [section1]/
│   └── page.tsx    ← Sub-página 1 + ContentLayout
└── [section2]/
    └── page.tsx    ← Sub-página 2 + ContentLayout
```

### layout.tsx (Gold Standard):

```tsx
// app/[locale]/(dashboard)/organization/[feature]/layout.tsx
import { requireAuthContext } from "@/lib/auth";
import { PageWrapper } from "@/components/layout";
import { FeatureIcon } from "lucide-react";

export default async function FeatureLayout({ children }: { children: React.ReactNode }) {
    await requireAuthContext();
    return (
        <PageWrapper title="NombreFeature" icon={<FeatureIcon />}>
            {children}
        </PageWrapper>
    );
}
```

### Sub-página (Gold Standard):

```tsx
// app/[locale]/(dashboard)/organization/[feature]/[section]/page.tsx
import type { Metadata } from "next";
import { ErrorDisplay } from "@/components/ui/error-display";
import { SectionView } from "@/features/feature/views/section-view";
import { ContentLayout } from "@/components/layout";
import { requireAuthContext } from "@/lib/auth";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Sección | Seencel",
        description: "Descripción de la sección",
        robots: "noindex, nofollow",
    };
}

export default async function SectionPage() {
    try {
        const { orgId } = await requireAuthContext();
        // Fetch data específica de esta sección
        return (
            <ContentLayout variant="wide">
                <SectionView ... />
            </ContentLayout>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
```

### 2.1 Route Tabs (Tabs en Header via routeTabs)

> Para features con pocas sub-secciones que se benefician de tabs visuales en el header.

**`PageWrapper` tiene una prop `routeTabs: RouteTab[]`** que renderiza tabs en el centro del header automáticamente via `DetailContentTabs` (portal). Cada tab navega a una ruta real.

```tsx
// Opción A: routeTabs directamente en PageWrapper (si controlas el PageWrapper)
export default async function FeatureLayout({ children }: { children: React.ReactNode }) {
    await requireAuthContext();
    return (
        <PageWrapper
            title="Feature"
            icon={<FeatureIcon />}
            routeTabs={[
                { value: "main", label: "Principal", href: "/organization/feature" },
                { value: "config", label: "Configuración", href: "/organization/feature/config" },
            ]}
        >
            {children}
        </PageWrapper>
    );
}
```

```tsx
// Opción B: Client layout con DetailContentTabs (si el PageWrapper vive en un layout padre)
"use client";
import { DetailContentTabs } from "@/components/shared/detail-content-tabs";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { usePathname, useRouter } from "@/i18n/routing";

const TABS = [
    { value: "tasks", label: "Tareas", href: "/organization/catalog/tasks" },
    { value: "divisions", label: "Rubros", href: "/organization/catalog/tasks/divisions" },
];

export default function FeatureTabsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    // Detect active tab by longest matching href
    const sorted = [...TABS].sort((a, b) => b.href.length - a.href.length);
    const active = sorted.find(t => pathname === t.href || pathname.startsWith(t.href + '/'))?.value ?? TABS[0].value;

    return (
        <>
            <DetailContentTabs>
                <TabsPrimitive.Root value={active} onValueChange={v => {
                    const tab = TABS.find(t => t.value === v);
                    if (tab) router.push(tab.href as any);
                }}>
                    <TabsList>
                        {TABS.map(t => (
                            <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
                        ))}
                    </TabsList>
                </TabsPrimitive.Root>
            </DetailContentTabs>
            {children}
        </>
    );
}
```

**Referencia implementada (Route Tabs):**
- **Tareas+Rubros**: `catalog/tasks/layout.tsx` (client) — 2 tabs portadas al header, cada sub-ruta tiene su `page.tsx`
- **Curso (Estudiante)**: `academy/my-courses/[slug]/layout.tsx` — 6 tabs portadas al header
- **Detalle Proyecto**: `projects/[projectId]/page.tsx` — tabs inline con `DetailContentTabs` (patrón legacy, migrar a rutas)

### 2.2 Sidebar Navigation (RAIL):

En `use-sidebar-navigation.ts`, configurar el ítem directamente:

```typescript
getItemStatus('sidebar_feature', {
    title: 'NombreFeature',
    href: '/organization/feature',
    icon: FeatureIcon,
    // ⛔ NO SE PERMITE USAR `children` AQUÍ. Sidebar plano.
}),
```

### Header:
- Breadcrumb centrado (`Feature / Sección`)
- Route Tabs en el centro (si usa `routeTabs` o `DetailContentTabs`)
- CurrencyModeSelector si aplica
- DocsButton
- ⛔ **SIN avatar, SIN notificaciones** (viven en sidebar bottom)

### Referencia implementada (Sidebar-First):
- **Gastos Generales**: `general-costs/layout.tsx` + `page.tsx`, `payments/page.tsx`, `concepts/page.tsx`
- **Configuración**: `settings/layout.tsx` + 6 sub-páginas
- **Avanzado**: `advanced/layout.tsx` + 2 sub-páginas

---

## 🛠️ 3. Implementación de Views (`views/*.tsx`)

### 🚨 ARQUITECTURA LEAN: Hooks Globales + Columnas Extraídas

> [!CAUTION]
> **Una vista NUNCA debería superar las 200-250 líneas.** Si tu vista tiene más de 300 líneas, algo está mal.
> La vista solo ORQUESTA: conecta hooks con UI. No contiene lógica de negocio.

#### Estructura de una vista con DataTable:

```
features/[feature]/
├── tables/
│   └── [entity]-columns.tsx       # Columnas + constantes (type labels, etc)
├── views/
│   └── [feature]-list-view.tsx    # Solo orquesta (~150-200 líneas)
```

#### Hooks Globales OBLIGATORIOS:

| Hook | Ubicación | Propósito |
|------|-----------|----------|
| `useTableActions` | `@/hooks/use-table-actions` | Delete single/bulk + dialog confirmación |
| `useTableFilters` | `@/hooks/use-table-filters` | Search + date range + faceted filters |

#### Ejemplo de referencia (Gold Standard):

```tsx
"use client";
import { useTableActions } from "@/hooks/use-table-actions";
import { useTableFilters } from "@/hooks/use-table-filters";
import { getEntityColumns, ENTITY_TYPE_OPTIONS, ENTITY_STATUS_OPTIONS } from "../tables/entity-columns";

export function EntityListView({ items, wallets, organizationId }: Props) {
    // 1. Hooks globales
    const filters = useTableFilters({
        facets: [
            { key: "type", title: "Tipo", options: ENTITY_TYPE_OPTIONS },
            { key: "status", title: "Estado", options: ENTITY_STATUS_OPTIONS },
        ],
    });

    const { handleDelete, handleBulkDelete, DeleteConfirmDialog } = useTableActions({
        onDelete: (item) => deleteEntity(item.id),
        entityName: "elemento",
    });

    // 2. Filtrado
    const filtered = useMemo(() =>
        items.filter(item => {
            if (filters.facetValues.type?.size > 0 && !filters.facetValues.type.has(item.type)) return false;
            if (filters.facetValues.status?.size > 0 && !filters.facetValues.status.has(item.status)) return false;
            return true;
        }),
    [items, filters.facetValues]);

    // 3. Columnas desde archivo separado
    const columns = getEntityColumns({ wallets });

    // 4. Render: toolbar inline + acción en header + table + dialog
    return (
        <div className="space-y-4">
            {/* Acción primaria vía portal al header */}
            <PageHeaderActionPortal>
                <Button onClick={handleCreate} size="sm" className="gap-2">
                    <Plus className="h-4 w-4" /> Crear
                </Button>
            </PageHeaderActionPortal>

            {/* Toolbar inline con filtros y búsqueda — ToolbarCard API estandarizada */}
            <ToolbarCard
                filters={filters}
                searchPlaceholder="Buscar..."
                display={{ viewMode, onViewModeChange, viewModeOptions }}
            />

            <DataTable
                columns={columns}
                data={filtered}
                onDelete={handleDelete}
                onBulkDelete={handleBulkDelete}
                onClearFilters={filters.clearAll}
            />
            <DeleteConfirmDialog />
        </div>
    );
}
```

> [!IMPORTANT]
> **¿Por qué extraer columnas?** Porque en las mejores apps (Stripe, Linear), las columnas son definiciones declarativas separadas de la lógica de la vista. Esto permite:
> - Reutilizar columnas en múltiples vistas
> - Testear columnas independientemente
> - Mantener la vista bajo 200 líneas

#### Archivo de Columnas (`tables/entity-columns.tsx`):

```tsx
import { createDateColumn, createTextColumn, createMoneyColumn } from "@/components/shared/data-table/columns";

// Constantes exportadas para filtros facetados
export const ENTITY_TYPE_OPTIONS = [
    { label: "Tipo A", value: "type_a" },
    { label: "Tipo B", value: "type_b" },
];

export function getEntityColumns(options: { wallets: any[] }) {
    return [
        createDateColumn({ accessorKey: "created_at" }),
        createTextColumn({ accessorKey: "name", title: "Nombre" }),
        createMoneyColumn({ accessorKey: "amount", prefix: "auto", colorMode: "auto" }),
        // Status con badge (custom — no hay factory aún)
        { accessorKey: "status", ... },
    ];
}
```

### Naming Convention

| Tipo | Sufijo | Responsabilidad | Ejemplo |
|------|--------|-----------------|---------|
| Page | `-page.tsx` | Server Component, fetch de datos, estructura Tabs | `subcontract-detail-page.tsx` |
| View | `-view.tsx` | Client Component, UI interactiva, Toolbar | `subcontracts-list-view.tsx` |
| Columns | `-columns.tsx` | Definición de columnas de DataTable | `movements-columns.tsx` |

> [!WARNING]
> **⛔ PROHIBIDO en vistas:**
> - Definir columnas inline (extraerlas a `tables/`)
> - Reimplementar delete/bulk delete (usar `useTableActions`)
> - Reimplementar estados de filtro (usar `useTableFilters`)
> - Superar 250 líneas

### ❌ Anti-patrón: Botones en Body
```tsx
// ❌ INCORRECTO: Nunca hagas esto
return (
    <div className="space-y-4">
        <div className="flex justify-between">
            <h3>Título</h3>
            <Button onClick={handleCreate}>Crear</Button>  {/* ❌ NO — va en PageHeaderActionPortal */}
        </div>
        <DataTable />
    </div>
);
```

### ❌ Anti-patrón: Toolbar Legacy
```tsx
// ❌ INCORRECTO: Toolbar con portalToHeader es LEGACY
<Toolbar portalToHeader actions={[...]} searchQuery={...} />

// ✅ CORRECTO: ToolbarCard estandarizado + acción en header
<PageHeaderActionPortal>
    <Button size="sm">Crear</Button>
</PageHeaderActionPortal>
<ToolbarCard
    filters={filters}
    searchPlaceholder="Buscar..."
/>
```

### 🚨 Regla para Overview / Dashboard Views

**TODAS las vistas (incluyendo Overview) DEBEN usar `<Toolbar portalToHeader ... />` cuando tienen:**
- Currency selector (tabs para cambiar modo de moneda)
- Date range filter
- Botones de exportar o acciones secundarias

```tsx
// ✅ CORRECTO - Overview con Toolbar para currency selector y export
export function SomeOverviewView() {
    const { primaryCurrency, secondaryCurrency, setDisplayCurrency } = useCurrency();
    const { showCurrencySelector } = useFinancialFeatures();
    const [currencyMode, setCurrencyMode] = useState<CurrencyViewMode>('mix');

    const currencyModeSelector = showCurrencySelector && secondaryCurrency ? (
        <Tabs
            value={currencyMode}
            onValueChange={(v) => handleCurrencyModeChange(v as CurrencyViewMode)}
            className="h-9"
        >
            <TabsList className="h-9 grid grid-cols-3 w-auto">
                <TabsTrigger value="mix" className="text-xs px-3">Mix</TabsTrigger>
                <TabsTrigger value="primary" className="text-xs px-3">{primaryCurrency?.code}</TabsTrigger>
                <TabsTrigger value="secondary" className="text-xs px-3">{secondaryCurrency.code}</TabsTrigger>
            </TabsList>
        </Tabs>
    ) : null;

    return (
        <>
            <Toolbar
                portalToHeader
                leftActions={currencyModeSelector}  // Currency selector a la izquierda
                actions={[
                    { label: "Exportar", icon: Download, onClick: handleExport, variant: "secondary" }
                ]}
            />
            <div className="space-y-6">
                {/* Dashboard content */}
            </div>
        </>
    );
}
```

**La única excepción** es si la vista NO tiene ningún filtro ni acción - en ese caso no se necesita Toolbar.

---

## 🔒 4. Internationalization (i18n)

Asegúrate de que TODOS los textos visibles estén en `messages/es.json`.
1.  **Feature Namespace**: Crea una clave raíz para tu feature (ej. `Subcontracts`).
2.  **Required Keys**:
    *   `title`: Título principal.
    *   `subtitle`: Descripción corta.
    *   `detailTitle`: Título para páginas de detalle (ej. "Detalle de Subcontrato").
    *   `back`: Etiqueta para el botón de volver.

---

## 🌐 9. i18n URLs (CRÍTICO)

> [!CAUTION]
> **SIEMPRE** usar el `Link` de `@/i18n/routing`, **NUNCA** de `next/link`. Esto aplica a absolutamente todas las páginas y componentes.

### 9.1 Reglas de Imports

```tsx
// ✅ CORRECTO - Siempre usar este import
import { Link } from "@/i18n/routing";

// ❌ INCORRECTO - Nunca usar next/link directamente
import Link from "next/link";
```

### 9.2 Reglas de hrefs

```tsx
// ✅ CORRECTO - Solo la ruta interna SIN prefijo de locale
<Link href="/academy/my-courses">Mis Cursos</Link>
<Link href="/organization/projects">Proyectos</Link>

// ❌ INCORRECTO - No incluir manualmente el locale
<Link href={`/${locale}/academy/my-courses`}>Mis Cursos</Link>
<Link href="/es/organizacion/proyectos">Proyectos</Link>
```

### 9.3 Registro en routing.ts

**TODA nueva ruta** debe registrarse en `src/i18n/routing.ts` con su traducción:

```ts
// src/i18n/routing.ts
pathnames: {
    // Ruta base (key) siempre en inglés
    "/academy/my-courses": {
        es: "/academia/mis-cursos",
        en: "/academy/my-courses"
    },
    "/academy/my-courses/[slug]": {
        es: "/academia/mis-cursos/[slug]",
        en: "/academy/my-courses/[slug]"
    },
    // ... todas las sub-rutas también
}
```

### 9.4 Checklist para Nuevas Páginas

- [ ] Agregar ruta a `routing.ts` con traducciones ES/EN
- [ ] Usar `import { Link } from "@/i18n/routing"`
- [ ] hrefs sin prefijo de locale (ej: `/organization`, no `/es/organizacion`)
- [ ] Verificar que funcione cambiando de idioma en la URL

---

## ❌ Anti-Patrones (Lo que NO debes hacer)

1.  **Tabs inline para Secciones**: Usar `<Tabs>` / `<TabsContent>` para secciones de página con estado local. Usar rutas reales + sidebar drill-down o `routeTabs`.
2.  **Toolbar portalToHeader (legacy)**: Usar `<Toolbar portalToHeader />`. Reemplazar con `ToolbarCard` inline + `PageHeaderActionPortal`.
3.  **Toolbars Manuales**: Crear un `div className="flex justify-between..."` con botones.
4.  **Toolbar en Overview Vacío**: Poner una `<Toolbar actions={[]} />` vacía en un Dashboard. Simplemente no la pongas.
5.  **EmptyState Oculto**: Poner el `EmptyState` dentro de un componente `DataTable`.
6.  **Hardcoded Strings**: No usar textos quemados en el código. Usar `useTranslations` o `getTranslations`.
7.  **Link de next/link**: Usar `import Link from "next/link"` en lugar de `import { Link } from "@/i18n/routing"`. 🚨
8.  **hrefs con locale**: Escribir hrefs como `/${locale}/ruta` en lugar de solo `/ruta`.
9.  **Avatar/Notificaciones en Header**: El avatar y notificaciones viven en el bottom del sidebar, NO en el header.
10.  **Modal para Forms**: Usar `openModal()` para formularios. Siempre `openPanel()`. Modales solo para confirmaciones/alertas.

---

## ⚡ 10. Performance Patterns (OBLIGATORIO)

### 10.1 Optimistic UI (Delete/Archive)

**Hook:** `@/hooks/use-optimistic-list`

```tsx
import { useOptimisticList } from "@/hooks/use-optimistic-list";

const { optimisticItems, removeOptimistically } = useOptimisticList(items);

const handleDelete = async (id: string) => {
    removeOptimistically(id); // Item desaparece INSTANTÁNEAMENTE
    const result = await deleteAction(id);
    if (!result.success) router.refresh(); // Rollback en error
};

<DataTable data={optimisticItems} />
```

> ⚠️ **REGLA**: NUNCA mostrar loading spinner para delete. El item debe desaparecer inmediatamente.

### 10.2 Lazy Loading (Charts)

**Ubicación:** `@/components/charts/lazy-charts.tsx`

```tsx
// ❌ INCORRECTO - Carga bundle completo de Recharts
import { BaseAreaChart } from "@/components/charts/area/base-area-chart";

// ✅ CORRECTO - Lazy load de ~200KB solo cuando se renderiza
import { LazyAreaChart as BaseAreaChart } from "@/components/charts/lazy-charts";
```

**Componentes Lazy Disponibles:**
- `LazyAreaChart`, `LazyDualAreaChart`
- `LazyBarChart`, `LazyPieChart`, `LazyDonutChart`
- `LazyLineChart`

> **REGLA**: SIEMPRE usar versiones lazy para charts en dashboards.

**Patrón VÁLIDO y OBLIGATORIO:**
- Sidebar RAIL (sin `children`)
- Navegación de sección mediante **RouteTabs en el Header** (Layout compartido + Sub-páginas para cada Tab).

### 10.4 Data Refresh

Después de una mutación, usar `router.refresh()` como fallback combinado con optimistic updates.

> ⛔ **NUNCA** usar `router.refresh()` como ÚNICO mecanismo de update. Siempre combinarlo con updates optimistas.

### 10.5 Duraciones de Animación

**Estándar:** `duration-150` (150ms) para animaciones de sidebar/drawer.

> **REGLA**: NUNCA usar `duration-300` para animaciones de navegación. Se siente lento.

---

## 📊 11. Cards & Charts (OBLIGATORIO)

### 11.1 Sistema Unificado de Cards

Todos los KPIs y gráficos usan el sistema unificado en `@/components/cards`:

| Componente | Uso | Import |
|-----------|-----|--------|
| `MetricCard` | KPI numérico (monto, porcentaje, count) | `@/components/cards` |
| `ChartCard` | Wrapper para gráficos con header estandarizado | `@/components/cards` |

> [!CAUTION]
> **⛔ LEGACY — NO USAR:**
> - `DashboardKpiCard` → usar `MetricCard`
> - `DashboardCard` → usar `ChartCard`
> - Cards manuales con `<Card>` de shadcn → usar `MetricCard` o `ChartCard`

```tsx
// ❌ INCORRECTO - Componentes legacy
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { DashboardCard } from "@/components/dashboard/dashboard-card";

// ✅ CORRECTO - Sistema unificado
import { MetricCard, ChartCard } from "@/components/cards";

<MetricCard
    title="Saldo Pendiente"
    amount={value}
    icon={<DollarSign className="h-5 w-5" />}
    description="Monto restante por pagar"
    size="default"
/>

<ChartCard
    title="Evolución"
    description="Últimos 12 meses"
    icon={<TrendingUp className="h-4 w-4" />}
>
    <LazyDualAreaChart ... />
</ChartCard>
```

### 11.2 MetricCard Props

| Prop | Tipo | Descripción |
|------|------|-------------|
| `title` | string | Título del KPI |
| `value` | string | Valor principal (texto libre) |
| `amount` | number | Valor numérico (formateado automáticamente) |
| `icon` | ReactNode | Icono decorativo |
| `description` | string | Texto secundario |
| `size` | `'default'` \| `'large'` | Tamaño del valor (usar `default` siempre) |

> [!IMPORTANT]
> **Usar `size="default"` en TODAS las MetricCards** para mantener consistencia visual entre vistas.

### 11.3 Colores de Charts (🚨 CRÍTICO)

> [!CAUTION]
> **NUNCA usar variables CSS `hsl(var(--chart-X))` en props de colores de Recharts.**
> Las variables CSS no se parsean correctamente. Usar valores HEX directos.

**Paleta estándar:**

| Nombre | HEX | Uso típico |
|--------|-----|------------|
| Verde | `#22c55e` | Pagado, positivo, ingreso |
| Violeta | `#8B5CF6` | Saldo, pendiente, secundario |
| Azul | `#3b82f6` | Primary, destacado |
| Ámbar | `#f59e0b` | Warning, variación positiva |
| Rosa | `#ec4899` | Terciario, accent |
| Cian | `#06b6d4` | Info, neutral |

---

## ✅ Checklist Final

### Estructura
- [ ] Páginas con secciones usan `layout.tsx` + sub-rutas (sidebar-first)
- [ ] `layout.tsx` contiene Auth + PageWrapper + ContentLayout
- [ ] Sub-páginas exportan `generateMetadata`
- [ ] Views en archivos `*-view.tsx` (~150-200 líneas máx)
- [ ] Columnas extraídas en `tables/*-columns.tsx`
- [ ] Toolbar con `portalToHeader` en vistas de listado
- [ ] Children definidos en `use-sidebar-navigation.ts`
- [ ] Rutas registradas en `routing.ts` con ES/EN

### Hooks Globales
- [ ] Delete usa `useTableActions` (NO reimplementar AlertDialog)
- [ ] Filtros usan `useTableFilters` (NO crear estados sueltos)
- [ ] Column Factories (`createDateColumn`, `createTextColumn`, `createMoneyColumn`)

### Cards & Charts
- [ ] KPIs usan `MetricCard` de `@/components/cards` (NO `DashboardKpiCard`)
- [ ] Gráficos usan `ChartCard` (NO `DashboardCard`)
- [ ] Charts usan componentes `Lazy*`

### i18n
- [ ] Textos en `messages/es.json`
- [ ] Link importado de `@/i18n/routing`
- [ ] hrefs sin prefijo de locale
- [ ] Rutas registradas en `routing.ts`

### Performance
- [ ] Secciones de página usan rutas reales (NO tabs con estado local)
- [ ] Animaciones `duration-150` o más rápidas

### Sidebar-First
- [ ] Header solo tiene breadcrumb centrado + acciones contextuales
- [ ] Avatar y notificaciones en el bottom del sidebar
- [ ] Sidebar drill-down funciona correctamente
