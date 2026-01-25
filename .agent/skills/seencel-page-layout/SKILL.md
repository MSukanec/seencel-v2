---
name: Seencel Page Layout Standard
description: Estándar OBLIGATORIO para crear nuevas páginas (Page + Views) en Seencel V2. Define arquitectura Server/Client, Tabs en Header, Metadata, Error Handling y Toolbars.
---

# Seencel Page Layout Standard

## 🚨 Reglas de Oro (Resumen Ejecutivo)

1.  **Architecture**: `PAGE.tsx` (Server) orquesta layouts → `VIEWS` (Client) contienen lógica.
2.  **Tabs**: Siempre van en el **Header** (prop `tabs` de `PageWrapper`), nunca en el body.
3.  **Metadata**: TODA página debe exportar `generateMetadata` (con título y robots).
4.  **Error Handling**: Usar `try/catch` y `<ErrorDisplay>` en el servidor para evitar pantallas blancas.
5.  **Toolbar**: Usar `<Toolbar portalToHeader />` dentro de las Views de Listado/Gestión. **NO usar en Dashboards/Overview**.
6.  **EmptyState**: Responsabilidad de la **View**, prohibido en DataTables.
7.  **Translations**: **NUNCA** dejar claves de traducción faltantes. Asegurar que `es.json` incluya `title`, `detailTitle` (si aplica), `subtitle` y `back`.

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
**OBLIGATORIO**: Los archivos de vistas deben seguir el patrón `[feature]-[name]-view.tsx`.
*   ✅ `subcontracts-list-view.tsx`
*   ✅ `subcontracts-overview-view.tsx`
*   ❌ `list-view.tsx`
*   ❌ `overview.tsx`

### Toolbar y Actions
Las acciones de creación ("Nuevo X") van en la Toolbar del View correspondiente.

```tsx
// src/features/[feature]/views/[feature]-list-view.tsx
"use client";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";

export function ListView({ data }) {
    return (
        <div className="space-y-4">
            <Toolbar
                portalToHeader
                // ✅ Acciones de creación AQUI
                actions={[
                    { label: "Crear", icon: Plus, onClick: handleCreate }
                ]}
            />
            <DataTable data={data} />
        </div>
    );
}
```

### 🚨 Excepción: Dashboards / Overview
En las vistas de **"Visión General"** (Dashboards):
*   **NO** usar Toolbar para acciones de creación (no se crean cosas en el dashboard).
*   Se puede usar Toolbar **SOLO** si hay filtros globales importantes (ej. Rango de Fechas), pero por defecto **suele ir limpia**.

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

## ❌ Anti-Patrones (Lo que NO debes hacer)

1.  **Tabs en Body**: Poner `<TabsList>` dentro de `ContentLayout` o debajo del header manualmente.
2.  **Toolbars Manuales**: Crear un `div className="flex justify-between..."` con botones.
3.  **Botones como Children**: `<Toolbar><Button>...</Button></Toolbar>`. Rompe el diseño mobile.
4.  **Toolbar en Overview Vacío**: Poner una `<Toolbar actions={[]} />` vacía en un Dashboard. Simplemente no la pongas.
5.  **EmptyState Oculto**: Poner el `EmptyState` dentro de un componente `DataTable`.
6.  **Hardcoded Strings**: No usar textos quemados en el código. Usar `useTranslations` o `getTranslations`.
