# Seencel Hooks

> **Auditado:** Febrero 2025 - Nivel Enterprise ✅

## ¿Qué son los Hooks?

Los hooks son **funciones reutilizables** que encapsulan lógica con estado de React.
Todos los hooks deben usar hooks de React internamente (useState, useEffect, etc).

---

## Hooks Disponibles

| Archivo | Propósito | Líneas |
|---------|-----------|--------|
| `use-money.ts` | Operaciones de dinero, formateo, display mode | 268 |
| `use-optimistic-action.ts` | Updates optimistas con rollback (React 19) | 195 |
| `use-sidebar-navigation.ts` | Items de navegación del sidebar | 312 |
| `use-sidebar-data.ts` | Datos de org/proyectos para sidebar | 270 |
| `use-financial-features.ts` | Flags de features financieros | 47 |

---

## Re-exports

| Archivo | Propósito |
|---------|-----------|
| `use-query-patterns.ts` | Re-exporta `queryKeys` de `/lib/query-keys.ts` |

---

## Convenciones

### Naming
- **SIEMPRE** empezar con `use-`
- Usar kebab-case: `use-my-hook.ts`
- Extensión `.ts` (no `.tsx` a menos que retorne JSX)

### Estructura
```tsx
"use client";

import { useState, useCallback } from "react";

/**
 * Descripción del hook
 */
export function useMyHook() {
    // State
    const [value, setValue] = useState(0);
    
    // Callbacks
    const increment = useCallback(() => {
        setValue(v => v + 1);
    }, []);
    
    // Return
    return { value, increment };
}
```

### Reglas
1. **Máximo ~150 líneas** - Si es más grande, considerar split
2. **Single responsibility** - Un hook, una cosa
3. **Memoización** - `useCallback` para funciones, `useMemo` para cálculos
4. **Tipos explícitos** - Return type documentado

---

## ¿Qué NO va en /hooks/?

| NO | Dónde va |
|----|----------|
| Funciones sin hooks | `/lib/` |
| Constantes/configs | `/lib/` |
| Types/interfaces | `/types/` |
| Server actions | `/actions/` |
| Hooks específicos de feature | `/features/[feature]/hooks/` |

---

## Hooks por Feature

Algunos hooks viven en sus features porque son específicos:

| Hook | Ubicación | Razón |
|------|-----------|-------|
| `useInsightPersistence` | `features/insights/hooks/` | Solo para Insights |
| `useOnboardingProgress` | `features/onboarding/checklist/` | Solo para Onboarding |
| `useProjectHealth` | `features/project-health/hooks/` | Solo para Project Health |

---

## Hooks por Categoría

### 💰 Finanzas
- `use-money.ts` - Operaciones de dinero completas
- `use-financial-features.ts` - Feature flags financieros

### 🔄 Data/Cache
- `use-optimistic-action.ts` - Updates optimistas

### 🎨 UI/Layout
- `use-sidebar-data.ts` - Datos del sidebar
- `use-sidebar-navigation.ts` - Items de navegación

---

**Última actualización:** Febrero 2025
