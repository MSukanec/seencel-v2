# Seencel Providers

> **Auditado:** Febrero 2025 - Nivel Enterprise ✅

## ¿Qué son los Providers?

Los providers son **wrappers de React** que envuelven la aplicación para proveer funcionalidad de librerías externas.
NO manejan estado global (eso va en `/stores/`).

---

## Providers Disponibles

| Archivo | Propósito | Líneas |
|---------|-----------|--------|
| `query-provider.tsx` | React Query client | 39 |
| `theme-provider.tsx` | next-themes wrapper (dark/light) | 13 |
| `feature-flags-provider.tsx` | Feature flags O(1) lookup | 58 |
| `modal-provider.tsx` | Renderiza stack de modales | 164 |
| `presence-provider.tsx` | Telemetría/heartbeat | 243 |

---

## Uso

### query-provider
```tsx
// Wrapper de React Query - ya está en layout-switcher
<QueryProvider>
    {children}
</QueryProvider>
```

### theme-provider
```tsx
// Wrapper de next-themes para Dark/Light mode
<ThemeProvider attribute="class" defaultTheme="system">
    {children}
</ThemeProvider>
```

### feature-flags-provider
```tsx
import { useFeatureFlags } from "@/providers/feature-flags-provider";

const { flags, statuses, isAdmin, isBetaTester } = useFeatureFlags();
if (flags["paypal_enabled"]) { ... }
```

### modal-provider
```tsx
// Renderiza los modales del stack (definido en stores/modal-store.ts)
// Ya está configurado en el layout
<ModalProvider />
```

### presence-provider
```tsx
// Trackea: heartbeat, navegación, visibilidad de tab
// Ya está en layout-switcher
<PresenceProvider userId={user.id}>
    {children}
</PresenceProvider>
```

---

## Diferencia: Providers vs Stores

| Providers | Stores |
|-----------|--------|
| Wrappers de librerías externas | Estado global Zustand |
| Necesitan envolver componentes | Accesibles desde cualquier lugar |
| `/providers/` (5 archivos) | `/stores/` (9 archivos) |

---

## ¿Cuándo crear un nuevo Provider?

Solo si necesitás **wrapper de una librería externa**.

✅ **Ejemplos válidos:** mapas, SDKs, analytics
❌ **NO para:** estado de la app, datos compartidos, UI state

---

**Última actualización:** Febrero 2025
