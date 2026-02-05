

---
name: Seencel Zustand Stores Standard
description: Estándar OBLIGATORIO para estado global. Define qué stores usar, cuándo y cómo.
---

# Zustand Stores Standard

Esta regla define cómo manejar el estado global en Seencel V2.

---

## 1. ÚNICO Sistema de Estado Global (🚨 OBLIGATORIO)

**TODO el estado global DEBE usar Zustand.** Los stores viven en `src/stores/`.

| Store | Propósito |
|-------|-----------|
| `organization-store` | Org, currency, wallets, projects, clients |
| `user-store` | Perfil del usuario actual |
| `layout-store` | UI state (sidebar, context navigation) |
| `modal-store` | Stack de modales |
| `drawer-store` | Drawer lateral global |

> ⛔ **NUNCA** crear React Context para estado global.
> 
> ⛔ **NUNCA** crear un store nuevo sin verificar que no encaja en los existentes.

---

## 2. Cuándo Usar Cada Store

### Para Formularios

```tsx
import { useFormData } from "@/stores/organization-store";

const { wallets, currencies, projects, clients, activeOrgId } = useFormData();
```

### Para Mostrar Montos

```tsx
import { useCurrency } from "@/stores/organization-store";

const { formatAmount, primaryCurrency } = useCurrency();
// formatAmount(1500, 'USD') → "$1.500,00"
```

### Para Usuario Actual

```tsx
import { useUser, useUserRequired } from "@/stores/user-store";

const user = useUser();           // UserProfile | null
const user = useUserRequired();   // UserProfile (throws si null)
```

### Para Modales

```tsx
import { useModal } from "@/stores/modal-store";

const { openModal, closeModal } = useModal();
openModal(<MyForm />, { title: "Crear", size: "lg" });
```

### Para Context de Navegación

```tsx
import { useActiveContext, useLayoutActions } from "@/stores/layout-store";

const context = useActiveContext();  // 'organization' | 'project' | 'admin'
useLayoutActions().setActiveContext('project');
```

---

## 3. Patrones Obligatorios

### Siempre usar useShallow

```tsx
// ✅ CORRECTO
import { useShallow } from 'zustand/react/shallow';

export function useMyData() {
    return useMyStore(useShallow(state => ({
        field1: state.field1,
        field2: state.field2,
    })));
}
```

### Valores Computados FUERA del Selector

```tsx
// ✅ CORRECTO
export function useSomething() {
    const store = useStore(useShallow(state => ({
        items: state.items,
    })));
    
    // Computed FUERA
    const primary = store.items.find(i => i.isPrimary);
    return { ...store, primary };
}

// ❌ INCORRECTO
export function useSomething() {
    return useStore(useShallow(state => ({
        primary: state.getPrimary(),  // MAL - función dentro del selector
    })));
}
```

### Hydration con useEffect

```tsx
// ✅ CORRECTO
export function MyHydrator(props) {
    const hydrated = useRef(false);
    
    useEffect(() => {
        if (hydrated.current) return;
        hydrated.current = true;
        useMyStore.getState().hydrate(props);
    }, [props]);
    
    return null;
}

// ❌ INCORRECTO - Muta durante render
if (!isHydrated) hydrate(props);
```

---

## 4. Creando un Nuevo Store

**Solo si las 3 condiciones son verdaderas:**

1. ✅ Es estado global que necesitan múltiples componentes desconectados
2. ✅ No encaja en ninguno de los 5 stores existentes
3. ✅ Necesita ser accesible desde modales/portales

**Template:**

```tsx
// stores/my-new-store.ts
"use client";

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

interface MyState {
    data: SomeType[];
    isHydrated: boolean;
    
    hydrate: (data: SomeType[]) => void;
    setData: (data: SomeType[]) => void;
}

export const useMyStore = create<MyState>((set) => ({
    data: [],
    isHydrated: false,
    
    hydrate: (data) => set({ data, isHydrated: true }),
    setData: (data) => set({ data }),
}));

// Hook helper con useShallow
export function useMyData() {
    return useMyStore(useShallow(state => ({
        data: state.data,
        isHydrated: state.isHydrated,
    })));
}
```

---

## 5. Violaciones Comunes

| ❌ Violación | ✅ Solución |
|-------------|------------|
| `createContext()` para estado global | Usar store de `/stores/` |
| Store nuevo sin justificación | Verificar si encaja en existentes |
| Selector sin `useShallow` | Agregar `useShallow` |
| Función dentro del selector | Computar FUERA del selector |
| `if (!hydrated) hydrate()` | Usar `useEffect` + `useRef` |
| `persist` para datos del servidor | No persistir datos que el server tiene |

---

## 6. Referencia Rápida de Imports

```tsx
// Organization data
import { useOrganization, useCurrency, useFormData } from "@/stores/organization-store";

// User
import { useUser, useUserRequired } from "@/stores/user-store";

// Layout
import { useLayoutActions, useActiveContext } from "@/stores/layout-store";

// UI Overlays
import { useModal } from "@/stores/modal-store";
import { useDrawer } from "@/stores/drawer-store";
```

> [!IMPORTANT]
> Leer `src/stores/README.md` antes de modificar cualquier store.

