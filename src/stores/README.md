# Seencel Stores

> **Auditado:** Febrero 2025 - Nivel Enterprise ✅

## ¿Qué son los Stores?

Los stores son **estado global** manejado con Zustand, accesible sin providers.
Esto los hace ideales para estado que necesita ser accedido desde modales, portales, o cualquier lugar del árbol React.

---

## Stores Disponibles

| Archivo | Propósito | Líneas |
|---------|-----------|--------|
| `organization-store.ts` | Datos de organización, currencies, wallets | 353 |
| `layout-store.ts` | Modo de layout, contexto activo, proyecto | 69 |
| `modal-store.ts` | Stack de modales global | 86 |
| `sidebar-store.ts` | Contenido del sidebar contextual | 98 |
| `theme-store.ts` | Temas personalizados con persistencia | 135 |
| `user-store.ts` | Usuario actual | 69 |
| `panel-store.ts` | Stack de paneles global (Primary Interaction Surface) | ~120 |
| `panel-registry.ts` | Registro de paneles para lazy-loading y URL sync | ~35 |
| `panel-url-sync.tsx` | Sincronización panel ↔ URL | ~95 |
| `modal-registry.ts` | Registro de modales para URL sync | 44 |
| `modal-url-sync.tsx` | Sincronización modal ↔ URL | 86 |

---

## Patrón Correcto para Hooks de Zustand

### ❌ INCORRECTO (causa Infinite Loop)

```typescript
// useShallow con objeto nuevo → nueva referencia cada render → loop
export function useOrganization() {
    return useOrganizationStore(useShallow(state => ({
        activeOrgId: state.activeOrgId,
        preferences: state.preferences,
    })));
}
```

### ✅ CORRECTO (selectores primitivos)

```typescript
// Selectores individuales → referencias estables → sin loop
export function useOrganization() {
    const activeOrgId = useOrganizationStore(state => state.activeOrgId);
    const preferences = useOrganizationStore(state => state.preferences);
    
    return { activeOrgId, preferences };
}
```

---

## Convenciones

### Naming
- Archivo: `kebab-case.ts` (ej: `organization-store.ts`)
- Store: `use[Entity]Store` (ej: `useOrganizationStore`)
- Hooks: `use[Entity]` (ej: `useOrganization`)

### Estructura
```typescript
"use client";

import { create } from 'zustand';

interface MyState {
    value: number;
    setValue: (value: number) => void;
}

export const useMyStore = create<MyState>((set) => ({
    value: 0,
    setValue: (value) => set({ value }),
}));

// Hook conveniente con selectores primitivos
export function useMyValue() {
    return useMyStore(state => state.value);
}
```

### Persistencia
```typescript
import { persist } from 'zustand/middleware';

export const useLayoutStore = create<LayoutState>()(
    persist(
        (set) => ({ ... }),
        {
            name: 'seencel-layout',
            partialize: (state) => ({
                // Solo persistir lo necesario
                layoutMode: state.layoutMode,
            }),
        }
    )
);
```

---

## Hydrators

Para combinar datos de servidor con Zustand:

```typescript
export function MyStoreHydrator(props: ServerData) {
    const hydrated = useRef(false);
    
    useEffect(() => {
        if (hydrated.current) return;
        hydrated.current = true;
        
        useMyStore.getState().hydrate(props);
    }, [props]);
    
    return null;
}
```

---

**Última actualización:** Febrero 2025
