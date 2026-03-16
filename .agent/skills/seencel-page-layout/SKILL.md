---
name: Seencel Page Layout Standard
description: Estándar OBLIGATORIO para crear nuevas páginas (Page + Views) en Seencel V2. Define arquitectura Server/Client, Sidebar-First Navigation (sin Tabs en Header), Metadata, Error Handling y Toolbars.
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

1.  **Architecture**: Páginas con múltiples secciones usan `layout.tsx` + sub-rutas reales (sidebar-first, sin Tabs en Header).
2.  **Sidebar-First**: Toda navegación de secciones usa **rutas reales** + **sidebar drill-down** (estilo Vercel). ⛔ PROHIBIDO usar `<Tabs>` para secciones de página.
3.  **Metadata**: TODA página/sub-página debe exportar `generateMetadata` (con título y robots).
4.  **Error Handling**: Usar `try/catch` y `<ErrorDisplay>` en el servidor para evitar pantallas blancas.
5.  **Toolbar**: Usar `<Toolbar portalToHeader />` dentro de las Views de Listado/Gestión. **NO usar en Dashboards/Overview**.
6.  **EmptyState**: Usar `ViewEmptyState` de `@/components/shared/empty-state`. Responsabilidad de la **View**, prohibido en DataTables.
7.  **Header**: Solo breadcrumb centrado + CurrencyModeSelector (si aplica) + DocsButton. SIN tabs, SIN avatar, SIN notificaciones.

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

## 🧱 2. Implementación de Páginas con Sub-secciones (Sidebar-First)

> **Decisión de Marzo 2026:** Las tabs en header se eliminan. Toda navegación de secciones se resuelve con **rutas reales** + **sidebar drill-down**.

### Patrón obligatorio:

```
app/[locale]/(dashboard)/organization/[feature]/
├── layout.tsx      ← Auth + PageWrapper + ContentLayout (COMPARTIDO)
├── page.tsx        ← Sub-página raíz
├── [section1]/
│   └── page.tsx    ← Sub-página 1
└── [section2]/
    └── page.tsx    ← Sub-página 2
```

### layout.tsx (Gold Standard):

```tsx
// app/[locale]/(dashboard)/organization/[feature]/layout.tsx
import { requireAuthContext } from "@/lib/auth";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { FeatureIcon } from "lucide-react";

export default async function FeatureLayout({ children }: { children: React.ReactNode }) {
    await requireAuthContext();
    return (
        <PageWrapper title="NombreFeature" icon={<FeatureIcon />}>
            <ContentLayout variant="wide">
                {children}
            </ContentLayout>
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
        return <SectionView ... />;
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

### Sidebar Navigation:

En `use-sidebar-navigation.ts`, definir `children` para el item:

```typescript
getItemStatus('sidebar_feature', {
    title: 'NombreFeature',
    href: '/organization/feature',
    icon: FeatureIcon,
    children: [
        { title: 'Visión General', href: '/organization/feature' },
        { title: 'Sección 1', href: '/organization/feature/section1' },
        { title: 'Sección 2', href: '/organization/feature/section2' },
    ],
}),
```

### Header:
- Solo breadcrumb centrado (`Feature / Sección`)
- CurrencyModeSelector si aplica
- DocsButton
- ⛔ **SIN tabs, SIN avatar, SIN notificaciones**

### Referencia implementada:
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

    // 4. Render: solo toolbar + table + dialog
    return (
        <div className="space-y-4">
            <Toolbar
                portalToHeader
                searchQuery={filters.searchQuery}
                onSearchChange={filters.setSearchQuery}
                filterContent={
                    <div className="flex items-center gap-2">
                        {facetConfigs.map(f => (
                            <FacetedFilter
                                key={f.key} title={f.title} options={f.options}
                                selectedValues={filters.facetValues[f.key]}
                                onSelect={val => filters.toggleFacet(f.key, val)}
                                onClear={() => filters.clearFacet(f.key)}
                            />
                        ))}
                    </div>
                }
                actions={[{ label: "Crear", icon: Plus, onClick: handleCreate }]}
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
            <Button onClick={handleCreate}>Crear</Button>  {/* ❌ NO */}
        </div>
        <DataTable />
    </div>
);
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

1.  **Tabs para Secciones**: Usar `<Tabs>` / `<TabsContent>` para secciones de página. Usar rutas reales + sidebar drill-down.
2.  **Toolbars Manuales**: Crear un `div className="flex justify-between..."` con botones.
3.  **Botones como Children**: `<Toolbar><Button>...</Button></Toolbar>`. Rompe el diseño mobile.
4.  **Toolbar en Overview Vacío**: Poner una `<Toolbar actions={[]} />` vacía en un Dashboard. Simplemente no la pongas.
5.  **EmptyState Oculto**: Poner el `EmptyState` dentro de un componente `DataTable`.
6.  **Hardcoded Strings**: No usar textos quemados en el código. Usar `useTranslations` o `getTranslations`.
7.  **Link de next/link**: Usar `import Link from "next/link"` en lugar de `import { Link } from "@/i18n/routing"`. 🚨
8.  **hrefs con locale**: Escribir hrefs como `/${locale}/ruta` en lugar de solo `/ruta`.
9.  **Avatar/Notificaciones en Header**: El avatar y notificaciones viven en el bottom del sidebar, NO en el header.

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

### 10.3 Navegación de Secciones (Sidebar-First)

**Patrón antiguo (DEPRECADO):** `<Tabs>` en header con `router.replace()` o estado local.

**Patrón nuevo (OBLIGATORIO):** Rutas reales + sidebar drill-down.

```tsx
// ❌ DEPRECADO - Tabs en header
<Tabs defaultValue="overview">
    <TabsList>...</TabsList>
    <TabsContent value="overview">...</TabsContent>
</Tabs>

// ✅ CORRECTO - Rutas reales con layout compartido
// layout.tsx → PageWrapper + ContentLayout (compartido)
// page.tsx → Sección raíz
// payments/page.tsx → Sub-sección
// concepts/page.tsx → Sub-sección
```

> Las tabs de `<Tabs>` solo son válidas para controles DENTRO de una vista (ej: currency selector, toggle de modo), NO para secciones de página.

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
