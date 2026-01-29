---
name: Seencel Page Layout Standard
description: Estándar OBLIGATORIO para crear nuevas páginas (Page + Views) en Seencel V2. Define arquitectura Server/Client, Tabs en Header, Metadata, Error Handling y Toolbars.
---

# Seencel Page Layout Standard

## 🚨 NAMING CONVENTION: PAGES vs VIEWS (CRÍTICO)

> [!CAUTION]
> Esta convención es **OBLIGATORIA**. No hay excepciones. Si no la seguís, el código se rechaza.

### Estructura en `views/`

```
src/features/[feature]/views/
├── [feature]-page.tsx           # 🎛️ ORQUESTADOR de tabs (Client Component)
├── [feature]-dashboard-view.tsx # 👁️ VISTA del tab "Dashboard"
├── [feature]-payments-view.tsx  # 👁️ VISTA del tab "Pagos"
├── [feature]-concepts-view.tsx  # 👁️ VISTA del tab "Conceptos"
└── [feature]-settings-view.tsx  # 👁️ VISTA del tab "Ajustes"
```

### Naming Pattern

| Tipo de Archivo | Sufijo | Propósito | Ejemplo |
|-----------------|--------|-----------|---------|
| **Orquestador de Tabs** | `-page.tsx` | Contiene `TabsContent`, renderiza las views | `general-costs-page.tsx` |
| **Vista de Tab** | `-view.tsx` | Contenido de UN tab específico | `general-costs-payments-view.tsx` |

### Ejemplo Real: `general-costs`

```
src/features/general-costs/
├── actions.ts
├── types.ts
├── forms/
│   ├── general-costs-payment-form.tsx
│   ├── general-costs-concept-form.tsx
│   └── general-costs-category-form.tsx
└── views/
    ├── general-costs-page.tsx           # Orquesta: DashboardView, PaymentsView, etc.
    ├── general-costs-dashboard-view.tsx # Tab "Visión General"
    ├── general-costs-payments-view.tsx  # Tab "Pagos"
    ├── general-costs-concepts-view.tsx  # Tab "Conceptos"
    └── general-costs-settings-view.tsx  # Tab "Ajustes"
```

### Flujo de Imports

```
app/[locale]/.../page.tsx (Server)
    └── imports → GeneralCostsPageClient from views/general-costs-page.tsx
                      └── imports → GeneralCostsDashboardView from views/general-costs-dashboard-view.tsx
                      └── imports → GeneralCostsPaymentsView from views/general-costs-payments-view.tsx
                      └── imports → GeneralCostsSettingsView from views/general-costs-settings-view.tsx
```

> [!WARNING]
> **NO confundir:**
> - `-page.tsx` en `views/` → Client Component que orquesta tabs
> - `page.tsx` en `app/` → Server Component que hace fetch de datos

---

## 🚨 Reglas de Oro (Resumen Ejecutivo)

1.  **Architecture**: `PAGE.tsx` en `app/` (Server) hace fetch → `[feature]-page.tsx` en `views/` (Client) orquesta tabs → `[feature]-*-view.tsx` contienen UI.
2.  **Tabs**: Siempre van en el **Header** (prop `tabs` de `PageWrapper`), nunca en el body.
3.  **Metadata**: TODA página debe exportar `generateMetadata` (con título y robots).
4.  **Error Handling**: Usar `try/catch` y `<ErrorDisplay>` en el servidor para evitar pantallas blancas.
5.  **Toolbar**: Usar `<Toolbar portalToHeader />` dentro de las Views de Listado/Gestión. **NO usar en Dashboards/Overview**.
6.  **EmptyState**: Responsabilidad de la **View**, prohibido en DataTables.
7.  **Translations**: **NUNCA** dejar claves de traducción faltantes. Asegurar que `es.json` incluya `title`, `detailTitle` (si aplica), `subtitle` y `back`.

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
| `dashboard/` | Componentes de dashboard (DashboardCard, DashboardKpiCard). |

> ⛔ **PROHIBIDO**: Crear carpetas de negocio aquí (ej. `src/components/users`).
> ⛔ **PROHIBIDO**: Usar `src/components/global`. Usar `shared` en su lugar.

### `src/features` (Dominio y Negocio)

Toda la lógica específica de features vive aquí:

```
src/features/[feature]/
├── TABLES.md                            # 📋 SOLO LECTURA - Esquema de tablas DB
├── actions.ts                           # Server actions
├── types.ts                             # TypeScript types
├── forms/                               # 📝 Formularios (ver skill seencel-forms-modals)
│   ├── [feature]-[entity]-form.tsx
│   └── [feature]-[other]-form.tsx
├── components/                          # 🧩 (OPCIONAL) Componentes UI auxiliares
└── views/                               # 👁️ TODAS las vistas
    ├── [feature]-page.tsx               # 🎛️ ORQUESTADOR (contiene TabsContent)
    ├── [feature]-dashboard-view.tsx     # Vista tab Dashboard
    ├── [feature]-[tab1]-view.tsx        # Vista tab 1
    ├── [feature]-[tab2]-view.tsx        # Vista tab 2
    └── [feature]-settings-view.tsx      # Vista tab Settings
```

> [!CAUTION]
> **TABLES.md es SOLO LECTURA**. Contiene el esquema de las tablas de la base de datos del feature.
> - ✅ **PERMITIDO**: Leerlo para entender la estructura de datos
> - ⛔ **PROHIBIDO**: Modificarlo. Solo el usuario puede editarlo.

> [!IMPORTANT]
> **Forms:** SIEMPRE van en `src/features/[feature]/forms/`, NO en `components/forms/`.
> Ver skill `seencel-forms-modals` para naming convention de forms.

> [!IMPORTANT]
> **Views:** TODO contenido visual de tabs va en `views/`. El orquestador termina en `-page.tsx`, las vistas individuales en `-view.tsx`.

> [!NOTE]
> **Components:** OPCIONAL. Solo se crea si hay componentes UI reutilizables que las views usan.

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

## 🧱 2. Implementación de `page.tsx` (Gold Standard)

```tsx
// src/app/[locale]/(dashboard)/.../page.tsx
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ErrorDisplay } from "@/components/ui/error-display";
import { PageWrapper } from "@/components/layout/dashboard/shared/page-wrapper";
import { ContentLayout } from "@/components/layout/dashboard/shared/content-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Imports de Views...

// ✅ 1. METADATA OBLIGATORIA
export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const t = await getTranslations({ locale: (await params).locale, namespace: 'Feature' });
    return {
        title: `${t('title')} | SEENCEL`,
        description: t('subtitle'),
        robots: "noindex, nofollow", // 🔒 Dashboard siempre privado
    };
}

export default async function FeaturePage({ params }: Props) {
    const { projectId } = await params;

    // ✅ 2. ERROR BOUNDARY MANUAL (Server Side)
    try {
        // Data Fetching
        const project = await getProject(projectId);
        
        if (!project) return notFound();

        return (
            <Tabs defaultValue="overview" className="h-full flex flex-col">
                <PageWrapper
                    type="page"
                    title="Título Página"
                    icon={<IconoDelSidebar />} 
                    tabs={
                        <TabsList className="bg-transparent p-0 gap-0 h-full flex items-center justify-start">
                            <TabsTrigger value="overview">Visión General</TabsTrigger>
                            <TabsTrigger value="list">Listado</TabsTrigger>
                        </TabsList>
                    }
                >
                    {/* ... TabsContent igual que antes ... */}
                </PageWrapper>
            </Tabs>
        );
    } catch (error) {
        // ✅ 3. MANEJO DE ERRORES AMIGABLE
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Recargar"
                />
            </div>
        );
    }
}
```

---

## 🛠️ 3. Implementación de Views (`views/*.tsx`)

### Naming Convention
**OBLIGATORIO**: Los archivos deben seguir patrones claros:

#### Páginas dentro de Features (`-page.tsx`)
Se usan cuando una feature tiene una "página de detalle" que se importa desde `app/` pero la lógica vive en `features/`:

```
src/features/subcontracts/
├── views/
│   ├── subcontracts-list-view.tsx      # Vista principal (listado)
│   ├── subcontracts-overview-view.tsx  # Vista overview (dashboard)
│   └── details/                        # 📁 Páginas de detalle
│       ├── subcontract-detail-page.tsx # ⭐ PAGE del detalle (Server Component)
│       ├── subcontract-overview-view.tsx
│       ├── subcontract-payments-view.tsx
│       └── subcontract-tasks-view.tsx
```

| Tipo | Sufijo | Responsabilidad | Ejemplo |
|------|--------|-----------------|---------|
| Page | `-page.tsx` | Server Component, fetch de datos, estructura Tabs | `subcontract-detail-page.tsx` |
| View | `-view.tsx` | Client Component, UI interactiva, Toolbar | `subcontracts-list-view.tsx` |

#### Reglas de Nombrado
*   ✅ `subcontracts-list-view.tsx` (Vista de listado)
*   ✅ `subcontract-detail-page.tsx` (Página de detalle - singular!)
*   ✅ `subcontract-payments-view.tsx` (Vista dentro del detalle)
*   ❌ `list-view.tsx` (falta prefijo de feature)
*   ❌ `overview.tsx` (falta sufijo -view)
*   ❌ `subcontracts-detail-view.tsx` (las pages NO terminan en -view)

> [!IMPORTANT]
> **Páginas de detalle**: Cuando una entidad tiene su propia página de detalle (`/subcontracts/[id]`), crear una carpeta `views/details/` con el `-page.tsx` y sus `-view.tsx` internos.

### Toolbar y Actions (🚨 CRÍTICO)

**TODAS las acciones de creación ("Crear X", "Nuevo X") DEBEN ir en el `<Toolbar portalToHeader />`.**

NUNCA pongas botones de acción directamente en el body de la View. El Toolbar se teleporta al header de la página.

```tsx
// src/features/[feature]/views/[feature]-list-view.tsx
"use client";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { EmptyState } from "@/components/ui/empty-state";

export function ListView({ data }) {
    const handleCreate = () => { /* ... */ };

    // ✅ CORRECTO: EmptyState SIN action + Toolbar en paralelo
    // La acción de crear ya está en el Toolbar, NO duplicar en EmptyState
    if (data.length === 0) {
        return (
            <>
                <Toolbar
                    portalToHeader
                    actions={[
                        { label: "Crear", icon: Plus, onClick: handleCreate }
                    ]}
                />
                <div className="h-full flex items-center justify-center">
                    <EmptyState
                        icon={ListIcon}
                        title="Sin elementos"
                        description="Creá tu primer elemento."
                        // ⚠️ NO usar action por defecto - ya está en Toolbar
                        // Solo agregar action si el usuario lo pide explícitamente
                    />
                </div>
            </>
        );
    }

    // ✅ CORRECTO: Toolbar siempre presente cuando hay data
    return (
        <>
            <Toolbar
                portalToHeader
                actions={[
                    { label: "Crear", icon: Plus, onClick: handleCreate }
                ]}
            />
            <DataTable data={data} />
        </>
    );
}
```

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

1.  **Tabs en Body**: Poner `<TabsList>` dentro de `ContentLayout` o debajo del header manualmente.
2.  **Toolbars Manuales**: Crear un `div className="flex justify-between..."` con botones.
3.  **Botones como Children**: `<Toolbar><Button>...</Button></Toolbar>`. Rompe el diseño mobile.
4.  **Toolbar en Overview Vacío**: Poner una `<Toolbar actions={[]} />` vacía en un Dashboard. Simplemente no la pongas.
5.  **EmptyState Oculto**: Poner el `EmptyState` dentro de un componente `DataTable`.
6.  **Hardcoded Strings**: No usar textos quemados en el código. Usar `useTranslations` o `getTranslations`.
7.  **Link de next/link**: Usar `import Link from "next/link"` en lugar de `import { Link } from "@/i18n/routing"`. 🚨
8.  **hrefs con locale**: Escribir hrefs como `/${locale}/ruta` en lugar de solo `/ruta`.

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

### 10.3 Navegación de Tabs (Cambio Instantáneo)

**Problema:** `router.replace()` causa re-fetch completo = LENTO.

```tsx
// ❌ INCORRECTO - Causa re-fetch completo
const handleTabChange = (value: string) => {
    router.replace(`${pathname}?view=${value}`);
};

// ✅ CORRECTO - Cambio de tab instantáneo
const [activeTab, setActiveTab] = useState(defaultTab);

const handleTabChange = (value: string) => {
    setActiveTab(value); // Update UI instantáneo
    window.history.replaceState(null, '', `${pathname}?view=${value}`); // Shallow URL
};

<Tabs value={activeTab} onValueChange={handleTabChange}>
```

### 10.4 React Query (Caching)

**Hooks:**
- `@/hooks/use-query-patterns` - Query keys estandarizadas
- `@/hooks/use-smart-refresh` - Patrón híbrido de refresh

```tsx
import { useSmartRefresh } from "@/hooks/use-smart-refresh";
import { queryKeys } from "@/hooks/use-query-patterns";

const { invalidate, refresh } = useSmartRefresh();

// Después de mutación:
invalidate(queryKeys.clients(projectId)); // Invalidar cache específico
```

### 10.5 Duraciones de Animación

**Estándar:** `duration-150` (150ms) para animaciones de sidebar/drawer.

> **REGLA**: NUNCA usar `duration-300` para animaciones de navegación. Se siente lento.

---

## 📊 11. Dashboard Components & Charts (OBLIGATORIO)

### 11.1 Componentes de Dashboard

Cuando construyas vistas con KPIs o gráficos, **SIEMPRE** usar los componentes estándar del dashboard:

| Componente | Uso | Import |
|-----------|-----|--------|
| `DashboardKpiCard` | Mostrar un KPI numérico (monto, porcentaje, count) | `@/components/dashboard/dashboard-kpi-card` |
| `DashboardCard` | Wrapper para gráficos, tablas o contenido complejo | `@/components/dashboard/dashboard-card` |

```tsx
// ❌ INCORRECTO - Usar Card manual para KPIs
<Card>
    <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
            Saldo Pendiente
        </CardTitle>
    </CardHeader>
    <CardContent>
        <p className="text-2xl font-mono font-bold">{formatMoney(value)}</p>
    </CardContent>
</Card>

// ✅ CORRECTO - Usar DashboardKpiCard
<DashboardKpiCard
    title="Saldo Pendiente"
    value={formatMoney(value)}
    icon={<DollarSign className="h-5 w-5" />}
    description="Monto restante por pagar"
    compact={true}
    size="large"
/>
```

### 11.2 DashboardKpiCard Props

| Prop | Tipo | Descripción |
|------|------|-------------|
| `title` | string | Título del KPI |
| `value` | string \| number | Valor principal |
| `icon` | ReactNode | Icono decorativo |
| `trend` | object | `{ value, label, direction: 'up'|'down'|'neutral' }` |
| `description` | string | Texto secundario debajo del valor |
| `currencyBreakdown` | array | Para KPIs bi-monetarios |
| `compact` | boolean | Si usar notación compacta (31.4M en vez de 31.431.097) |
| `size` | 'default' \| 'large' \| 'hero' | Tamaño del valor |

### 11.3 DashboardCard para Gráficos

```tsx
// ❌ INCORRECTO - Card manual para gráficos
<Card>
    <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Evolución
        </CardTitle>
        <CardDescription>Descripción</CardDescription>
    </CardHeader>
    <CardContent>
        <BaseDualAreaChart ... />
    </CardContent>
</Card>

// ✅ CORRECTO - DashboardCard
<DashboardCard
    title="Evolución"
    description="Descripción"
    icon={<TrendingUp className="h-4 w-4" />}
>
    <BaseDualAreaChart ... />
</DashboardCard>
```

### 11.4 Colores de Charts (🚨 CRÍTICO)

> [!CAUTION]
> **NUNCA usar variables CSS `hsl(var(--chart-X))` en props de colores de Recharts.**
> Las variables CSS no se parsean correctamente. Usar valores HEX directos.

```tsx
// ❌ INCORRECTO - Variables CSS no funcionan
<BaseDualAreaChart
    primaryColor="hsl(var(--chart-2))"
    secondaryColor="hsl(var(--chart-5))"
/>

// ✅ CORRECTO - Valores HEX directos
<BaseDualAreaChart
    primaryColor="#22c55e"  // Verde
    secondaryColor="#8B5CF6" // Violeta
/>
```

**Paleta de colores estándar (HEX):**

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
- [ ] `page.tsx` exporta `generateMetadata`
- [ ] Tabs en prop `tabs` de PageWrapper
- [ ] Views en archivos `*-view.tsx`
- [ ] Toolbar con `portalToHeader` en vistas de listado

### i18n
- [ ] Textos en `messages/es.json`
- [ ] Link importado de `@/i18n/routing`
- [ ] hrefs sin prefijo de locale
- [ ] Rutas registradas en `routing.ts`

### Performance
- [ ] Delete usa `useOptimisticList`
- [ ] Charts usan componentes `Lazy*`
- [ ] Tab switching usa estado local
- [ ] Animaciones `duration-150` o más rápidas
