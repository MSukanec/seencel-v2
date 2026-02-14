---
name: Virtualización de listas largas
description: Listas y tablas con 50+ items visibles deben usar virtualización para evitar renderizar cientos de nodos DOM.
severity: critical
---

# ⛔ Obligatorio: Virtualización para listas largas

## Regla

Toda lista o tabla que pueda mostrar **50+ items simultáneos** en el DOM debe usar virtualización. Sin virtualización, React renderiza TODOS los nodos aunque solo 15-20 sean visibles en pantalla.

## Impacto

| Items en DOM | Sin virtualización | Con virtualización |
|-------------|-------------------|-------------------|
| 50 | Aceptable | No necesario |
| 200 | ~100ms re-render | ~5ms re-render |
| 1000 | ~500ms re-render, janky | ~5ms re-render, fluido |

## Patrón

```tsx
// ✅ CORRECTO: Solo renderiza los items visibles (~15-20 nodos DOM)
import { useVirtualizer } from "@tanstack/react-virtual";

const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 48, // altura estimada de cada row
});

<div ref={scrollRef} className="h-[500px] overflow-auto">
    <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
            <Row key={items[virtualItem.index].id} item={items[virtualItem.index]} />
        ))}
    </div>
</div>

// ❌ INCORRECTO: 500 items = 500 nodos DOM
{items.map(item => <Row key={item.id} {...item} />)}
```

## Cuándo aplicar

| Componente | Virtualizar si... |
|-----------|-------------------|
| DataTable | Puede tener 100+ rows sin paginación |
| Listados de actividad | Feed con scroll infinito |
| Selectores (combobox) | >50 opciones visibles |
| Gantt chart listas | Muchas tareas visibles simultáneamente |

## Cuándo NO aplicar

- Listas paginadas con <50 items por página (ya limitadas por diseño)
- Grids con pocos items (ej: dashboard widgets, 4-8 cards)
- DataTables que ya usan componentes de tabla con virtualización interna

## Librería recomendada

`@tanstack/react-virtual` — liviana (~5KB), sin opiniones de UI, composable.
