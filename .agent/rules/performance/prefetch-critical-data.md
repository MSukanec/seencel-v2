---
name: Prefetch de Datos Críticos
description: Para navegación predecible, prefetch datos usando mecanismos nativos de Next.js. No llamar server actions en hover sin cache.
severity: recommended
---

# Prefetch de Datos Críticos

## Regla

Para navegación predecible, se deben prefetch datos antes de que el usuario haga click, **usando mecanismos que soporten cache**.

## Patrón Correcto — Next.js Link (Prefetch Nativo)

```tsx
// ✅ CORRECTO: Next.js prefetch nativo — cachea automáticamente
import { Link } from "@/i18n/routing";

<Link href="/organization/projects" prefetch={true}>
    Proyectos
</Link>
```

Este es el mecanismo preferido. Next.js prefetchea el RSC payload de la ruta destino y lo cachea.

## Patrón con Precaución — Server Actions en Hover

```tsx
// ⚠️ CON CUIDADO: Solo si hay un mecanismo de cache
// Sin cache, cada hover = un request nuevo al servidor
const prefetchedRef = useRef(false);
const prefetchProjectData = () => {
    if (prefetchedRef.current) return; // Evitar múltiples calls
    prefetchedRef.current = true;
    void getProjectById(projectId);
};

<Card onMouseEnter={prefetchProjectData}>
    ...
</Card>
```

## Prohibiciones

⛔ **NUNCA** llamar server actions en `onMouseEnter` sin protección contra múltiples calls.

⛔ **NUNCA** asumir que un server action se cachea automáticamente — no lo hace.

## Cuándo Aplicar

- Links de navegación principal (sidebar, breadcrumbs) → `prefetch={true}` en `<Link>`
- Cards que llevan a páginas de detalle → `<Link>` con prefetch nativo
- Datos pre-calentados para modales → ref guard + single call
