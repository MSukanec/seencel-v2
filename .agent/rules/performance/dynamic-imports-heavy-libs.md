---
name: Dynamic Imports para librerías pesadas
description: Las librerías pesadas (mapas, charts, editores) deben cargarse con next/dynamic para no inflar el bundle inicial.
severity: critical
---

# ⛔ Obligatorio: Dynamic Imports para librerías pesadas

## Regla

**Toda librería pesada de cliente** debe cargarse con `next/dynamic` y `{ ssr: false }` para no inflar el bundle inicial del dashboard.

## Librerías que SIEMPRE requieren dynamic import

| Librería | Bundle aprox. | Componentes afectados |
|----------|--------------|----------------------|
| `@react-google-maps/api` | ~200KB | Mapa del overview widget |
| `recharts` / `chart.js` | ~150KB | Gráficos de finanzas, analytics |
| Editores rich text (Tiptap, Slate) | ~300KB | Editores de contenido |
| PDF viewers | ~500KB | Visualización de documentos |
| DatePicker / Calendar complejos | ~80KB | Solo si son librerías externas pesadas |

## Patrón

```tsx
import dynamic from "next/dynamic";

// ✅ CORRECTO: Se carga solo cuando se renderiza, con skeleton de placeholder
const MapWidget = dynamic(
    () => import("@/components/widgets/organization/overview-widget"),
    { 
        ssr: false,
        loading: () => <Skeleton className="h-full w-full rounded-xl" />
    }
);

// ❌ INCORRECTO: Import directo infla el bundle
import { OverviewHeroWidget } from "@/components/widgets/organization/overview-widget";
```

## Dónde aplicar

- **Widget Grid**: los widgets pesados (mapa, charts) deben registrarse con `dynamic()`
- **Modales con editores**: el modal carga el editor solo al abrirse
- **Páginas con analytics**: charts se cargan en el `TabsContent` correspondiente

## Excepción

Componentes livianos de UI (`Button`, `Input`, `Skeleton`, `Tabs`) **NO** necesitan dynamic import. Solo aplica a librerías que agregan >50KB al bundle.

## Detección

Si un import directo agrega >50KB al bundle chunk de una página, debe moverse a `next/dynamic`.
