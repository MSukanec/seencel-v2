---
description: Migrar una página con Tabs en Header al nuevo patrón Sidebar-First con rutas reales y sidebar drill-down.
---

# /migrate-tabs-to-sidebar — Migración Tabs → Sidebar-First

Este workflow se ejecuta cuando el usuario quiere migrar una página que usa `<Tabs>` en el header al nuevo patrón **sidebar-first** con rutas reales.

> **Decisión de Marzo 2026:** Todas las tabs en header se eliminan. La navegación de secciones se resuelve con rutas reales + sidebar drill-down (estilo Vercel).

---

## REFERENCIA IMPLEMENTADA

Antes de empezar, revisar estas implementaciones gold standard:

| Página | Layout | Sub-páginas |
|--------|--------|-------------|
| **Gastos Generales** | `general-costs/layout.tsx` | `page.tsx` (Visión General), `payments/`, `concepts/`, `settings/` |
| **Configuración** | `settings/layout.tsx` | `page.tsx` (Información), `members/`, `permissions/`, `location/`, `billing/`, `finance/` |
| **Avanzado** | `advanced/layout.tsx` | `page.tsx` (Documentos PDF), `indices/` |

---

## PASOS DE MIGRACIÓN

### 1. Identificar las Tabs actuales

Leer el `page.tsx` actual e identificar:
- Cada `<TabsTrigger>` = una futura sub-página
- Cada `<TabsContent>` = el contenido de esa sub-página
- Los datos que se fetchean en el page.tsx actual

### 2. Registrar rutas i18n

En `src/i18n/routing.ts`, agregar las nuevas rutas:

```typescript
'/organization/[feature]/[section]': {
    en: '/organization/[feature]/[section]',
    es: '/organizacion/[feature-es]/[section-es]'
},
```

### 3. Crear `layout.tsx` compartido

```tsx
// app/[locale]/(dashboard)/organization/[feature]/layout.tsx
import { requireAuthContext } from "@/lib/auth";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { IconName } from "lucide-react";

export default async function FeatureLayout({ children }: { children: React.ReactNode }) {
    await requireAuthContext();
    return (
        <PageWrapper title="NombreFeature" icon={<IconName />}>
            <ContentLayout variant="wide">
                {children}
            </ContentLayout>
        </PageWrapper>
    );
}
```

### 4. Crear sub-páginas

Para CADA tab anterior, crear un `page.tsx` en su carpeta:

```tsx
// app/[locale]/(dashboard)/organization/[feature]/[section]/page.tsx
import type { Metadata } from "next";
import { ErrorDisplay } from "@/components/ui/error-display";
// importar la view correspondiente

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "NombreSeccion | Seencel",
        description: "Descripción",
        robots: "noindex, nofollow",
    };
}

export default async function SectionPage() {
    try {
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

### 5. Actualizar Sidebar Navigation

En `src/hooks/use-sidebar-navigation.ts`:

```typescript
getItemStatus('sidebar_feature', {
    title: 'NombreFeature',
    href: '/organization/feature',
    icon: FeatureIcon,
    children: [
        { title: 'Sub-página 1', href: '/organization/feature' },
        { title: 'Sub-página 2', href: '/organization/feature/section2' },
        { title: 'Sub-página 3', href: '/organization/feature/section3' },
    ],
}),
```

### 6. Eliminar Tabs del page.tsx original

- Eliminar imports de `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`
- El `page.tsx` raíz ahora solo renderiza el contenido de la primera sección
- Eliminar el `loading.tsx` antiguo si existe (cada sub-página puede tener su propio loading)

### 7. Verificar

- [ ] Cada sub-página carga correctamente
- [ ] El sidebar muestra drill-down `← NombreFeature` con sub-páginas
- [ ] El breadcrumb centrado muestra `Feature / SubPágina`
- [ ] El header NO tiene tabs
- [ ] Las rutas i18n funcionan en ES y EN
- [ ] El `loading.tsx` por defecto no se usaba o se movió

---

## CHECKLIST FINAL

- [ ] Rutas registradas en `routing.ts`
- [ ] `layout.tsx` creado con Auth + PageWrapper + ContentLayout
- [ ] Cada tab convertida a sub-página con `generateMetadata`
- [ ] `children` definidos en `use-sidebar-navigation.ts`
- [ ] Imports de Tabs eliminados del page.tsx original
- [ ] SettingsClient o similar descompuesto (si existía wrapper client)
- [ ] Verificado en browser
