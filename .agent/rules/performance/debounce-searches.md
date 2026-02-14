---
name: Debounce en Búsquedas Obligatorio
description: Toda búsqueda y filtro debe usar debounce para evitar llamadas excesivas al servidor.
severity: critical
---

# ⛔ Obligatorio: Debounce en TODA búsqueda

## Regla

**TODA búsqueda debe usar debounce** para evitar llamadas excesivas al servidor.

## Patrón

```tsx
import { useDebouncedCallback } from "use-debounce";

const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearchQuery(value);
}, 300);

<Input 
    onChange={(e) => debouncedSearch(e.target.value)}
    placeholder="Buscar..."
/>
```

## Tiempos Estándar

| Tipo de Input | Debounce |
|---------------|----------|
| Búsqueda en tabla | 300ms |
| Filtros complejos | 500ms |
| Autocompletado | 200ms |
| Guardado automático | 1000ms |

## Prohibición

⛔ **NUNCA** hacer fetch en cada `onChange` sin debounce.
