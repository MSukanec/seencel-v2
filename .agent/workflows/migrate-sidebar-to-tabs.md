---
description: Migrar una página con secciones en Sidebar (Drill-down) al nuevo patrón RAIL con Tabs.
---

# /migrate-sidebar-to-tabs — Migración Sidebar Drill-down → Tabs en Página

Este workflow se ejecuta cuando el usuario quiere migrar una página que (erróneamente bajo el nuevo estándar RAIL) expone sus sub-secciones en el Sidebar usando la propiedad `children`, y debe ser transformada en un solo link principal que usa `<Tabs>` locales en la vista para navegar.

> **Decisión RAIL Navigation (Marzo 2026):** El sidebar es plano. Todas las sub-secciones de una entidad deben navegarse internamente usando `<Tabs>` o `routeTabs` en lugar de apilar `children` en el sidebar.

---

## REFERENCIA IMPLEMENTADA

Antes de empezar, revisar estas implementaciones gold standard:

| Página | Forma de Navegar |
|--------|------------------|
| **Cursos (Academia)** | Usa `DetailContentTabs` (tabs montadas directo en la vista cliente) |
| **Proyectos** | Usa `<Tabs/>` base para cambiar la sección inferior de la vista |

---

## PASOS DE MIGRACIÓN

### 1. Actualizar Sidebar Navigation (Eliminar children)

En `src/hooks/use-sidebar-navigation.ts` u origen similar:
Eliminar el uso de `children` y hacer que el ítem apunte a una ruta raíz nivel 1.

```typescript
// ANTES (INCORRECTO BAJO RAIL)
getItemStatus('sidebar_feature', {
    title: 'NombreFeature',
    href: '/organization/feature',
    icon: FeatureIcon,
    children: [
        { title: 'Sub-página 1', href: '/organization/feature' },
        { title: 'Sub-página 2', href: '/organization/feature/section2' },
    ],
}),

// AHORA (CORRECTO - RAIL PLANO)
getItemStatus('sidebar_feature', {
    title: 'NombreFeature',
    href: '/organization/feature',
    icon: FeatureIcon,
}),
```

### 2. Consolidar el page.tsx o layout.tsx

Tomar las páginas que estaban en `/organization/feature/sectionX/page.tsx` y centralizarlas en una sola página raíz `/organization/feature/page.tsx`, o bien mantenerlas como rutas separadas pero orquestar la navegación usando el componente `<Tabs>` con `onValueChange={() => router.push(...)}` (RouteTabs).

Ejemplo de RouteTabs:

```tsx
"use client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "@/i18n/routing";

export function FeatureTabsLayout({ activeTab, children }) {
    const router = useRouter();

    return (
        <div className="space-y-6">
            <Tabs 
                value={activeTab} 
                onValueChange={(val) => router.push(`/organization/feature/${val === 'main' ? '' : val}`)}
            >
                <TabsList>
                    <TabsTrigger value="main">Principal</TabsTrigger>
                    <TabsTrigger value="config">Configuración</TabsTrigger>
                </TabsList>
            </Tabs>
            {children}
        </div>
    );
}
```

### 3. Verificar

- [ ] El sidebar ya no despliega flechas de sub-menú (desaparece el acordeón de esa sección).
- [ ] Al hacer clic en el nombre de la feature en el sidebar, lleva a la vista con Tabs.
- [ ] Las Tabs cambian el contenido inferior correctamente.
