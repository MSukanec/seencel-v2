---
name: No force-dynamic en layouts
description: Prohibido usar export const dynamic = 'force-dynamic' en layouts del dashboard.
severity: critical
---

# ⛔ Prohibido: `export const dynamic = 'force-dynamic'` en Layouts

## Regla

**NUNCA** usar `export const dynamic = 'force-dynamic'` en archivos `layout.tsx` del dashboard.

## Por qué

`force-dynamic` desactiva el caché de Request Deduplication de Next.js. Esto significa que:
- Cada navegación re-ejecuta TODAS las queries del layout
- No hay caché entre requests del mismo render pass
- El layout bloquea el renderizado de páginas hijas hasta que termina

Next.js detecta automáticamente que un Server Component es dinámico cuando usa `cookies()`, `headers()`, o `searchParams`. Supabase usa cookies para autenticación, por lo que el layout ya es dinámico sin necesidad de forzarlo.

## Detección

```tsx
// ❌ PROHIBIDO en layout.tsx
export const dynamic = 'force-dynamic';

// ✅ CORRECTO: No poner nada. Next.js lo detecta automáticamente.
```

## Excepción

Solo se permite en `page.tsx` específicas donde se necesite que la página **nunca** se cachee (por ejemplo, páginas con datos extremadamente sensibles al tiempo real). Incluso en esos casos, considerar alternativas como `revalidate = 0` o `unstable_noStore()`.
