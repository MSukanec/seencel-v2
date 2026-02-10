---
name: Seencel UI Patterns Standard
description: Patrones de UI obligatorios para EmptyState, Toolbar, DataTable, Toasts y compresión de imágenes en Seencel V2.
---

# Seencel UI Patterns Standard

## 1. Empty State (`ViewEmptyState`)

**OBLIGATORIO**: Todas las vistas DEBEN usar `ViewEmptyState` para manejar estados vacíos y sin resultados.

**Ubicación:** `@/components/shared/empty-state`

> ⛔ **NUNCA** usar el viejo `EmptyState` de `@/components/ui/empty-state` — es legacy.

### Variante A: Vista Vacía (`mode="empty"`)

```tsx
import { ViewEmptyState } from "@/components/shared/empty-state";
import { Package } from "lucide-react";

if (items.length === 0) {
    return (
        <ViewEmptyState
            mode="empty"
            icon={Package}
            viewName="Materiales e Insumos"
            featureDescription="Los materiales e insumos son los productos físicos y consumibles que utilizás en tus proyectos de construcción."
            onAction={handleCreate}
            actionLabel="Nuevo Material"
            docsPath="/docs/materiales"  // Solo si existe documentación
        />
    );
}
```

### Variante B: Sin Resultados (`mode="no-results"`)

```tsx
<ViewEmptyState
    mode="no-results"
    icon={Package}
    viewName="materiales e insumos"
    filterContext="con esa búsqueda"
    onResetFilters={() => {
        setSearchQuery("");
        setSelectedCategoryId(null);
    }}
/>
```

### Reglas

1. **Full Page Coverage**: `ViewEmptyState` reemplaza TODO el área de contenido
2. **Early Return**: Usar `if (data.length === 0) return <ViewEmptyState />` ANTES del JSX normal
3. **Dos modos obligatorios**: Toda vista debe manejar AMBOS modos (empty + no-results)
4. **Icon Match**: Usar el mismo ícono de la página
5. **docsPath**: Solo si existe documentación para ese feature
6. **Empty Unificado**: Para tabs (ej: Materiales/Insumos), usar UN empty para todos

---

## 2. Toolbar

**OBLIGATORIO**: Todas las páginas de lista/tabla con búsqueda, filtros o acciones DEBEN usar `Toolbar`.

**Ubicación:** `@/components/layout/dashboard/shared/toolbar`

### Uso

```tsx
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";

<Toolbar
    portalToHeader
    searchQuery={searchQuery}
    onSearchChange={setSearchQuery}
    searchPlaceholder="Buscar..."
    leftActions={<Badge>{count} items</Badge>}
    filterContent={<FacetedFilter ... />}
    actions={[
        { label: "Crear", icon: Plus, onClick: handleCreate }
    ]}
/>
```

### Props

| Prop | Tipo | Descripción |
|------|------|-------------|
| `portalToHeader` | boolean | Teleporta toolbar al header |
| `searchQuery` | string | Valor actual de búsqueda |
| `onSearchChange` | function | Handler de cambio |
| `searchPlaceholder` | string | Placeholder |
| `leftActions` | ReactNode | Badges, stats, currency selector |
| `filterContent` | ReactNode | FacetedFilter components |
| `actions` | array | Botones de acción (derecha) |

### Reglas

1. **Siempre usar `portalToHeader`**: Las acciones van en el header, no en el body
2. **NUNCA crear search inputs custom**: Usar search built-in de Toolbar
3. **Stats en leftActions**: Pasar badges/contadores a `leftActions`
4. **Create button en actions array**: Acción primaria va en `actions`

---

## 3. DataTable

**Ubicación:** `@/components/shared/data-table/`

### Uso

```tsx
<DataTable
    columns={columns}  // NO agregar columna "actions" manual
    data={data}
    enableRowActions={true}
    onEdit={handleEdit}
    onDelete={handleDelete}
/>
```

### Cuándo Usar

- ✅ Listas de entidades, > 20 items, sortable/filterable
- ❌ Tablas < 5 filas, dentro de modales

---

## 4. Toasts y Dialogs

### Toasts

- **Sistema**: Sonner (`toast.success()`, `toast.error()`)
- **REGLA**: No usar mensajes inline de success/error

```tsx
import { toast } from "sonner";

toast.success("Guardado exitosamente");
toast.error("Error al guardar");
```

### Dialogs

> ⛔ **NUNCA** usar `window.confirm()`. Siempre usar `AlertDialog`.

```tsx
import { AlertDialog, AlertDialogAction, ... } from "@/components/ui/alert-dialog";
```

---

## 5. Compresión de Imágenes

**CRÍTICO**: Comprimir antes de upload.

```tsx
import { compressImage } from "@/lib/client-image-compression";

const file = await compressImage(rawFile, 'avatar'); // 'avatar' | 'cover' | 'document'
```

---

## Checklist

- [ ] ¿Lista vacía muestra `ViewEmptyState` con ambos modos (empty + no-results)?
- [ ] ¿Toolbar usa `portalToHeader`?
- [ ] ¿DataTable para listas > 20 items?
- [ ] ¿Toasts para feedback, no mensajes inline?
- [ ] ¿Imágenes comprimidas antes de upload?
