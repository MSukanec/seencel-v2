---
name: No prefetch monolítico de widgets
description: Prohibido hacer un Promise.all gigante que bloquee el render del dashboard para pre-cargar todos los widgets.
severity: high
---

# ⛔ Prohibido: Prefetch Monolítico de Widgets

## Regla

**NUNCA** crear una función que ejecute N queries en `Promise.all` para pre-cargar datos de todos los widgets de un dashboard, si esa función bloquea el render de la página.

## Patrón prohibido

```tsx
// ❌ PROHIBIDO: Un bloque gigante que bloquea todo
export default async function DashboardPage() {
    const widgetData = await prefetchAllWidgets(orgId); // 14 queries, bloquea render
    return <Dashboard data={widgetData} />;
}
```

## Patrón correcto

Cada widget carga sus propios datos de forma independiente con Suspense:

```tsx
// ✅ CORRECTO: Cada widget es autónomo
export default function DashboardPage() {
    return (
        <DashboardGrid>
            <Suspense fallback={<ActivitySkeleton />}>
                <ActivityWidget />     {/* Carga sus propios datos */}
            </Suspense>
            <Suspense fallback={<GallerySkeleton />}>
                <GalleryWidget />      {/* Carga sus propios datos */}
            </Suspense>
            <Suspense fallback={<MapSkeleton />}>
                <MapWidget />          {/* Carga sus propios datos */}
            </Suspense>
        </DashboardGrid>
    );
}
```

## Por qué

Un prefetch monolítico significa que el dashboard NO se renderiza hasta que **el widget más lento** termina de cargar. Si la galería tarda 3s y el activity feed 200ms, el usuario espera 3s para ver todo — incluyendo el feed que ya estaba listo.

Con Suspense, cada widget aparece tan pronto como sus datos están listos.
