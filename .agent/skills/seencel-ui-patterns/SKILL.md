---
name: Seencel UI Patterns Standard
description: Patrones de UI obligatorios para EmptyState, Toolbar, DataTable, Toasts y compresión de imágenes en Seencel V2.
---

# Seencel UI Patterns Standard

## 1. Empty State

**OBLIGATORIO**: Todas las listas/tablas DEBEN mostrar `EmptyState` cuando no hay datos.

**Ubicación:** `@/components/ui/empty-state`

### Uso

```tsx
import { EmptyState } from "@/components/ui/empty-state";
import { FileText, Plus } from "lucide-react";

// Early return ANTES de renderizar la UI completa
if (items.length === 0) {
    return (
        <EmptyState
            icon={FileText}
            title="Sin elementos"
            description="Creá tu primer elemento para comenzar."
            action={
                <Button onClick={handleCreate} size="lg">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Elemento
                </Button>
            }
        />
    );
}

// Renderizado normal DESPUÉS del check
return (
    <div>
        <Toolbar>...</Toolbar>
        <DataTable data={items} />
    </div>
);
```

### Reglas

1. **Full Page Coverage**: EmptyState reemplaza TODO el área de contenido
2. **Early Return**: Usar `if (data.length === 0) return <EmptyState />` ANTES del JSX normal
3. **Action Button**: Si la vista tiene botón "Crear", pasarlo al prop `action`
4. **Icon Match**: Usar ícono relevante a la entidad

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

- [ ] ¿Lista vacía muestra `EmptyState`?
- [ ] ¿Toolbar usa `portalToHeader`?
- [ ] ¿DataTable para listas > 20 items?
- [ ] ¿Toasts para feedback, no mensajes inline?
- [ ] ¿Imágenes comprimidas antes de upload?
