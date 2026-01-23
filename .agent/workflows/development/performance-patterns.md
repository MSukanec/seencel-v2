---
description: Patrones de performance, optimistic UI y carga diferida
---

# Performance y UX de Alta Velocidad ⚡

## OBLIGATORIO: Todas las features deben seguir estos patrones para feedback instantáneo.

---

## 1. Optimistic UI (Operaciones Delete/Archive)

**Hook:** `@/hooks/use-optimistic-list`

```tsx
import { useOptimisticList } from "@/hooks/use-optimistic-list";

// En el componente
const { optimisticItems, removeOptimistically, isPending } = useOptimisticList(items);

// Al eliminar
const handleDelete = async (id: string) => {
    removeOptimistically(id); // Item desaparece INSTANTÁNEAMENTE
    const result = await deleteAction(id);
    if (!result.success) {
        router.refresh(); // Rollback en error
    }
};

// Renderizar con datos optimistas
<DataTable data={optimisticItems} />
```

> ⚠️ **REGLA**: NUNCA mostrar loading spinner para delete. El item debe desaparecer inmediatamente.

---

## 2. React Query (Caching e Invalidación)

**Provider:** `@/providers/query-provider`

**Hooks:**
- `@/hooks/use-query-patterns` - Query keys estandarizadas
- `@/hooks/use-smart-refresh` - Patrón híbrido de refresh

```tsx
import { useSmartRefresh } from "@/hooks/use-smart-refresh";
import { queryKeys } from "@/hooks/use-query-patterns";

const { invalidate, refresh } = useSmartRefresh();

// Después de mutación:
invalidate(queryKeys.clients(projectId)); // Invalidar cache específico
// O
refresh(); // Refresh completo (legacy, evitar)
```

**Query Keys** (en `use-query-patterns.ts`):
- `queryKeys.clients(projectId)`
- `queryKeys.projects(orgId)`
- `queryKeys.kanbanCards(boardId)`

---

## 3. Lazy Loading (Charts y Componentes Pesados)

**Ubicación:** `@/components/charts/lazy-charts.tsx`

```tsx
// ❌ INCORRECTO - Carga bundle completo de Recharts
import { BaseAreaChart } from "@/components/charts/area/base-area-chart";

// ✅ CORRECTO - Lazy load de ~200KB solo cuando se renderiza
import { LazyAreaChart as BaseAreaChart } from "@/components/charts/lazy-charts";
```

**Componentes Lazy Disponibles:**
- `LazyAreaChart`, `LazyDualAreaChart`
- `LazyBarChart`, `LazyPieChart`, `LazyDonutChart`
- `LazyLineChart`

> **REGLA**: SIEMPRE usar versiones lazy para charts en dashboards.

---

## 4. Navegación de Tabs (Cambio Instantáneo)

**Problema:** `router.replace()` causa re-fetch completo = LENTO.

**Solución:** Estado local + actualización shallow de URL.

```tsx
// ❌ INCORRECTO - Causa re-fetch completo
const handleTabChange = (value: string) => {
    router.replace(`${pathname}?view=${value}`);
};

// ✅ CORRECTO - Cambio de tab instantáneo
const [activeTab, setActiveTab] = useState(defaultTab);

const handleTabChange = (value: string) => {
    setActiveTab(value); // Update UI instantáneo
    window.history.replaceState(null, '', `${pathname}?view=${value}`); // Shallow URL
};

<Tabs value={activeTab} onValueChange={handleTabChange}>
```

---

## 5. Prefetching (Navegación)

**Ubicación:** `@/components/layout/sidebar-button.tsx`

Todos los links del sidebar prefetch on hover via `router.prefetch()`.

```tsx
// Ya implementado en SidebarButton
const handleMouseEnter = useCallback(() => {
    if (href) router.prefetch(href);
}, [href, router]);
```

---

## 6. Duraciones de Animación

**Estándar:** `duration-150` (150ms) para animaciones de sidebar/drawer.

> **REGLA**: NUNCA usar `duration-300` para animaciones de navegación. Se siente lento.

---

## Checklist de Performance

- [ ] ¿Delete usa `useOptimisticList`?
- [ ] ¿Charts usan componentes `Lazy*`?
- [ ] ¿Tab switching usa estado local, no `router.replace()`?
- [ ] ¿Animaciones son `duration-150` o más rápidas?
- [ ] ¿Empty states usan componente `EmptyState`?
