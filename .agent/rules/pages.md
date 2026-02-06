---
trigger: always_on
---

---
name: Seencel Page Checklist
description: Checklist OBLIGATORIO de elementos que TODAS las páginas deben cumplir en Seencel V2.
---

# Page Compliance Checklist

Esta regla define los elementos **OBLIGATORIOS** que toda página debe cumplir antes de considerarse completa.

---

## 0. Arquitectura de Páginas (🚨 OBLIGATORIO)

### Pattern A: Server Page + Views Directas (✅ ESTÁNDAR)

Las páginas DEBEN seguir esta arquitectura:

```
page.tsx (Server Component)
├── Fetches data on server
├── Renderiza PageWrapper + Tabs
└── Importa y renderiza Views directamente dentro de TabsContent
    ├── <MovementsView data={data} />
    └── <AnalyticsView data={otherData} />
```

```tsx
// page.tsx (Server Component)
import { PageWrapper } from "@/components/shared/page-wrapper";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MovementsView } from "@/features/finance/views/finances-movements-view";
import { AnalyticsView } from "@/features/finance/views/finances-analytics-view";

export default async function FinancePage() {
    // Data fetching en el server
    const [movements, analytics] = await Promise.all([
        getMovements(orgId),
        getAnalytics(orgId),
    ]);
    
    return (
        <PageWrapper icon={DollarSign} title="Finanzas">
            <Tabs defaultValue="movements">
                <TabsList className="portal-to-header">
                    <TabsTrigger value="movements">Movimientos</TabsTrigger>
                    <TabsTrigger value="analytics">Analíticas</TabsTrigger>
                </TabsList>
                
                <TabsContent value="movements" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                    <MovementsView movements={movements} currencies={currencies} />
                </TabsContent>
                
                <TabsContent value="analytics" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                    <AnalyticsView data={analytics} />
                </TabsContent>
            </Tabs>
        </PageWrapper>
    );
}
```

### Pattern B: Con Orchestrador Client (❌ DEPRECADO)

```
page.tsx (Server) → finances-page.tsx (Client) → Views
                    ↑ ELIMINAR ESTE PASO
```

> ⛔ **NUNCA** crear un componente `*-page.tsx` client que solo pase props a las Views.
> 
> ⛔ **NUNCA** tener un archivo intermediario solo para orquestar tabs si no agrega lógica client significativa.

### Cuándo SÍ usar un Client Orchestrator

Solo si hay lógica client significativa compartida entre tabs:
- Estado complejo compartido entre todas las Views
- WebSockets o subscripciones realtime
- Animaciones complejas entre tabs

### Checklist de Arquitectura

- [ ] ¿`page.tsx` es Server Component?
- [ ] ¿Las Views se importan directamente en `page.tsx`?
- [ ] ¿No hay `*-page.tsx` client intermediario innecesario?
- [ ] ¿Los tabs se renderizan en el Server Component?


## 1. ViewEmptyState Global (🚨 OBLIGATORIO)

**TODA vista DEBE usar `ViewEmptyState`** de `@/components/shared/empty-state` con dos variantes:

### Variante A: Vista Vacía (`mode="empty"`)

Cuando **no hay datos** en la página (onboarding state).

```tsx
import { ViewEmptyState } from "@/components/shared/empty-state";
import { Package } from "lucide-react";

<ViewEmptyState
    mode="empty"
    icon={Package}
    viewName="Materiales e Insumos"
    featureDescription="Los materiales e insumos son los productos físicos y consumibles que utilizás en tus proyectos de construcción."
    onAction={handleCreateMaterial}
    actionLabel="Nuevo Material"
    docsPath="/docs/materiales"  // Solo si existe documentación
/>
```

### Variante B: Sin Resultados (`mode="no-results"`)

Cuando **filtros aplicados** no encuentran coincidencias.

```tsx
<ViewEmptyState
    mode="no-results"
    icon={Package}
    viewName="materiales e insumos"
    filterContext="con esa búsqueda"
    onResetFilters={() => {
        setSearchQuery("");
        setSelectedCategoryId(null);
    }}
/>
```

### Reglas Clave

| Regla | Descripción |
|-------|-------------|
| **Título (empty)** | Nombre de la vista, NO "Sin resultados" |
| **Título (no-results)** | "Sin resultados" (automático) |
| **Descripción (empty)** | Explicación extensa del feature |
| **Botón Acción** | Mismo ícono (+) y label que el header |
| **Botón Documentación** | Solo si existe docs, abre en nueva pestaña |
| **Empty Unificado** | Para tabs (ej: Materiales/Insumos), usar UN empty para todos |

### Props del ViewEmptyState

| Prop | Tipo | Modo | Descripción |
|------|------|------|-------------|
| `mode` | `"empty"` \| `"no-results"` | Ambos | Variante a mostrar |
| `icon` | LucideIcon | Ambos | Ícono de la página |
| `viewName` | string | Ambos | Nombre de la vista |
| `featureDescription` | string | empty | Descripción extensa |
| `onAction` | () => void | empty | Callback de acción |
| `actionLabel` | string | empty | Label del botón |
| `actionIcon` | LucideIcon | empty | Ícono (default: Plus) |
| `docsPath` | string | empty | Ruta i18n a docs |
| `onResetFilters` | () => void | no-results | Limpiar filtros |
| `filterContext` | string | no-results | Contexto adicional |

> ⛔ **NUNCA** usar el EmptyState viejo de `@/components/ui/empty-state`.
>
> ⛔ **NUNCA** crear un empty diferente por cada tab de la misma vista.
>
> ⛔ **NUNCA** incluir `docsPath` si no existe documentación para ese feature.

---

## 2. TabsContent Clases (🚨 OBLIGATORIO)

**TODOS los TabsContent DEBEN tener estas clases:**

```tsx
<TabsContent 
    value="tab-name" 
    className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden"
>
```

| Clase | Propósito |
|-------|-----------|
| `flex-1` | Ocupa espacio disponible |
| `m-0` | Sin margin extra |
| `overflow-hidden` | Previene scroll en contenedor |
| `data-[state=inactive]:hidden` | Oculta tabs inactivos |

---

## 3. generateMetadata (🚨 OBLIGATORIO)

**TODA página DEBE exportar `generateMetadata`:**

```tsx
export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'MyPage' });
    
    return {
        title: `Mi Página | SEENCEL`,
        description: t('subtitle'),
        robots: "noindex, nofollow", // Dashboard siempre privado
    };
}
```

---

## 4. Error Handling (🚨 OBLIGATORIO)

**TODA página con data fetching DEBE tener `try/catch` con `ErrorDisplay`:**

```tsx
try {
    const data = await fetchData();
    // ... render normal
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
```

---

## 5. Toolbar con portalToHeader (🚨 OBLIGATORIO)

**TODA página con acciones/filtros DEBE usar Toolbar con `portalToHeader`:**

```tsx
<Toolbar
    portalToHeader
    searchQuery={searchQuery}
    onSearchChange={setSearchQuery}
    actions={[{ label: "Crear", icon: Plus, onClick: handleCreate }]}
/>
```

> ⛔ **NUNCA** colocar botones de acción directamente en el body de la página.

---

## Checklist de Página

Antes de marcar una página como completa:

- [ ] ¿Usa `ViewEmptyState` de `@/components/shared/empty-state`?
- [ ] ¿TabsContent tiene clases `flex-1 m-0 overflow-hidden data-[state=inactive]:hidden`?
- [ ] ¿Exporta `generateMetadata` con robots noindex?
- [ ] ¿Tiene `try/catch` con `ErrorDisplay`?
- [ ] ¿Toolbar usa `portalToHeader`?
- [ ] ¿Usa `PageWrapper` con icon y title?

---

## Violaciones Comunes

| ❌ Violación | ✅ Solución |
|-------------|------------|
| EmptyState custom | Usar `ViewEmptyState` de `@/components/shared/empty-state` |
| TabsContent sin clases | Agregar `flex-1 m-0 overflow-hidden data-[state=inactive]:hidden` |
| Sin Metadata | Agregar `generateMetadata` |
| Sin error handling | Agregar `try/catch` + `ErrorDisplay` |
| Botones en body | Mover a `Toolbar portalToHeader` |

---

## 6. Internacionalización de URLs (🚨 OBLIGATORIO)

**TODAS las páginas del dashboard DEBEN tener rutas traducidas** en `src/i18n/routing.ts`.

### Regla Principal

Cada nueva página del dashboard requiere:

1. **Definición en routing.ts** con rutas en español e inglés
2. **Uso de `Link` de `@/i18n/routing`** para navegación (NO de `next/link`)
3. **Uso de `router` de `@/i18n/routing`** para navegación programática

### Patrón Obligatorio

```ts
// En src/i18n/routing.ts
pathnames: {
    // ✅ CORRECTO: Ruta con traducciones
    '/organization/catalog': {
        en: '/organization/catalog',
        es: '/organizacion/catalogo'
    },
    '/organization/catalog/task/[taskId]': {
        en: '/organization/catalog/task/[taskId]',
        es: '/organizacion/catalogo/tarea/[taskId]'
    },
}
```

### Navegación

```tsx
// ✅ CORRECTO: Usar Link/router de @/i18n/routing
import { Link, useRouter } from "@/i18n/routing";

<Link href="/organization/catalog">Catálogo</Link>

// ❌ INCORRECTO: Usar next/link directo o rutas hardcodeadas
import Link from "next/link";
<Link href={`/${locale}/organization/catalog`}>Catálogo</Link>
```

### Convención de Nombres de Rutas

| Inglés | Español |
|--------|---------|
| `organization` | `organizacion` |
| `catalog` | `catalogo` |
| `task` | `tarea` |
| `tasks` | `tareas` |
| `planner` | `planificador` |
| `materials` | `materiales` |
| `labor` | `mano-de-obra` |
| `equipment` | `equipos` |
| `subcontracts` | `subcontratos` |
| `finance` | `finanzas` |
| `settings` | `configuracion` |
| `division` | `division` |
| `element` | `elemento` |
| `project` | `proyecto` |
| `projects` | `proyectos` |
| `team` | `equipo` |
| `contacts` | `contactos` |
| `billing` | `facturacion` |
| `reports` | `informes` |

### Checklist de Nueva Página

- [ ] ¿Está definida la ruta en `routing.ts` con ambos idiomas?
- [ ] ¿Las rutas con parámetros dinámicos (`[id]`) están definidas?
- [ ] ¿Se usa `Link` y `useRouter` de `@/i18n/routing`?
- [ ] ¿Las rutas hijas también están traducidas?

> ⛔ **NUNCA** construir URLs manualmente con template strings y el locale.
> 
> ⛔ **NUNCA** crear una página sin agregarla a `routing.ts`.
> 
> ⛔ **NUNCA** usar `next/link` o `next/navigation` directamente para rutas del dashboard.

