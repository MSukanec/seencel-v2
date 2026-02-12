# List Items — Variantes y Sistema de Multi-Selección

## Arquitectura

Cada archivo en esta carpeta es una **variante especializada** del componente base `ListItem` (`../list-item-base.tsx`).

Todas las variantes usan los mismos slots composables del base y DEBEN seguir el contrato de multi-selección explicado abajo.

```
items/
├── file-list-item.tsx       # Archivos (media_files)
├── material-list-item.tsx   # Materiales del catálogo técnico
├── member-list-item.tsx     # Miembros de organización
├── recipe-list-item.tsx     # Recetas de tareas (collapsible)
├── task-list-item.tsx       # Tareas del catálogo técnico
└── README.md                # Este archivo
```

---

## Sistema de Multi-Selección

### Flujo completo

```
Vista (View)
├── useMultiSelect({ items, getItemId })
│   → selectedIds, isSelected, toggle, selectAll, clearSelection, hasSelection
│
├── Toolbar
│   └── hasSelection ? <BulkActions> : <NormalToolbar>
│
└── Lista de items
    └── <XxxListItem
            selected={isSelected(id)}
            onToggleSelect={toggle}
        />
```

### Contrato obligatorio para multi-select

Toda variante que soporte selección múltiple DEBE:

1. Aceptar las props `selected?: boolean` y `onToggleSelect?: (id: string) => void`
2. Pasar `selected` al root `<ListItem selected={selected}>`
3. Renderizar `<ListItem.Checkbox>` condicionalmente cuando `onToggleSelect` existe
4. Memoizar el handler con `useCallback`

#### Ejemplo mínimo

```tsx
import { memo, useCallback } from "react";
import { ListItem } from "../list-item-base";

interface MyItemListItemProps {
    item: { id: string; name: string };
    selected?: boolean;
    onToggleSelect?: (id: string) => void;
    // ...otras props
}

export const MyItemListItem = memo(function MyItemListItem({
    item,
    selected = false,
    onToggleSelect,
}: MyItemListItemProps) {
    const handleToggle = useCallback(() => {
        onToggleSelect?.(item.id);
    }, [onToggleSelect, item.id]);

    return (
        <ListItem variant="card" selected={selected}>
            {onToggleSelect && (
                <ListItem.Checkbox
                    checked={selected}
                    onChange={handleToggle}
                />
            )}
            <ListItem.Content>
                <ListItem.Title>{item.name}</ListItem.Title>
            </ListItem.Content>
        </ListItem>
    );
});
```

### Hook: `useMultiSelect<T>`

Ubicación: `@/hooks/use-multi-select.ts`

```tsx
const {
    selectedIds,       // Set<string> — IDs seleccionados
    selectedCount,     // number — cantidad seleccionada
    isSelected,        // (id: string) => boolean
    toggle,            // (id: string) => void — toggle individual
    select,            // (id: string) => void — seleccionar uno solo
    selectMany,        // (ids: string[]) => void
    selectAll,         // () => void — seleccionar todos
    clearSelection,    // () => void — limpiar selección
    getSelectedItems,  // () => T[] — obtener items seleccionados
    hasSelection,      // boolean — hay algo seleccionado?
    allSelected,       // boolean — todos seleccionados?
} = useMultiSelect({
    items: filteredItems,
    getItemId: (item) => item.id,
});
```

### En la Vista (View)

```tsx
// 1. Instanciar hook
const multiSelect = useMultiSelect({ items: files, getItemId: (f) => f.id });

// 2. Toolbar cambia según selección
<Toolbar
    portalToHeader
    searchQuery={query}
    onSearchChange={setQuery}
    actions={multiSelect.hasSelection
        ? [
            { label: `Eliminar (${multiSelect.selectedCount})`, icon: Trash2, onClick: handleBulkDelete },
            { label: "Descargar", icon: Download, onClick: handleBulkDownload },
        ]
        : [
            { label: "Subir archivos", icon: Plus, onClick: handleUpload },
        ]
    }
/>

// 3. Pasar a cada item
{files.map(file => (
    <FileListItem
        key={file.id}
        item={file}
        selected={multiSelect.isSelected(file.id)}
        onToggleSelect={multiSelect.toggle}
    />
))}
```

---

## Estado de cada variante

| Variante | Multi-select | `selected` | `onToggleSelect` | `Checkbox` | Notas |
|----------|:---:|:---:|:---:|:---:|-------|
| `MaterialListItem` | ✅ | ✅ | ✅ | ✅ | Referencia completa |
| `TaskListItem` | ✅ | ✅ | ✅ | ✅ | Igual que Material |
| `FileListItem` | ✅ | ✅ | ✅ | ✅ | Agregado Feb 2026 |
| `MemberListItem` | ❌ | — | — | — | Por diseño: cada miembro tiene acciones únicas (owner, rol) |
| `RecipeListItem` | ❌ | — | — | — | No aplica: es Collapsible, no ListItem estándar |

### ¿Cuándo NO aplica multi-select?

- **MemberListItem**: Cada miembro tiene permisos y roles distintos. Las acciones bulk no tienen sentido.
- **RecipeListItem**: Es un componente Collapsible complejo, no un ListItem plano.

---

## Reglas

- **SIEMPRE** memoizar con `memo()` cada variante para evitar re-renders innecesarios
- **SIEMPRE** memoizar `handleToggle` con `useCallback` para estabilidad de referencia
- **NUNCA** crear un checkbox custom — usar `<ListItem.Checkbox>` del base
- **NUNCA** omitir `selected` en el `<ListItem>` root — es lo que aplica el borde visual `border-primary`
- **NUNCA** acoplar lógica de selección dentro del item — el item solo recibe y emite, la vista controla
