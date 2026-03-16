---
name: Seencel UI Patterns Standard
description: Patrones de UI obligatorios para EmptyState, Toolbar, DataTable, Toasts y compresión de imágenes en Seencel V2.
---

# Seencel UI Patterns Standard

## 1. Empty State (`ViewEmptyState`)

**OBLIGATORIO**: Todas las vistas DEBEN usar `ViewEmptyState` para manejar estados vacíos y sin resultados.

**Ubicación:** `@/components/shared/empty-state`

> ⛔ **NUNCA** usar `EmptyState` de `@/components/ui/` ni `DataTableEmptyState` — fueron eliminados.

### Visual (2026 Redesign)

- Dot grid pattern de fondo (sutil, adapta a theme)
- Radial glow con `--primary` desde el centro
- Ícono en glassmorphic card con rotating gradient border
- Sin dashed borders, sin diagonal hatching, sin bounce animation

### Variante A: Vista Vacía (`mode="empty"`) + Quick Start Packs

```tsx
import { ViewEmptyState, type QuickStartPack } from "@/components/shared/empty-state";
import { Tag, Zap } from "lucide-react";

const quickStartPacks: QuickStartPack[] = [
    {
        id: "services",
        icon: Zap,
        label: "Pack Servicios",
        description: "Luz, Gas, Internet, Agua, Teléfono",
        onApply: async () => {
            // Crear categoría + conceptos
            const cat = await createCategory({ name: "Servicios" });
            await Promise.all(["Luz", "Gas"].map(name => createItem({ category_id: cat.id, name })));
            toast.success("Pack creado");
        },
    },
];

<ViewEmptyState
    mode="empty"
    icon={Tag}                    // ⚠️ MISMO ícono que el sidebar
    viewName="Conceptos de Gasto"
    featureDescription="Definí los tipos de gastos..."
    quickStartPacks={quickStartPacks}  // Opcional — templates de inicio rápido
    onAction={handleCreate}
    actionLabel="Crear concepto manualmente"
    docsPath="/docs/finanzas"     // Smart: solo muestra botón si la doc existe
/>
```

### `QuickStartPack` — Tipo escalable

```ts
interface QuickStartPack {
    id: string;                           // Identificador único
    icon: LucideIcon;                     // Ícono del pack
    label: string;                        // "Pack Servicios"
    description: string;                  // "Luz, Gas, Internet, Agua"
    onApply: () => Promise<void>;         // Crea los items y muestra toast
}
```

Cada feature define sus propios packs. El componente es genérico — no sabe de features específicos.

### Variante B: Sin Resultados (`mode="no-results"`)

UI minimal: ícono pequeño en `bg-muted`, sin dot grid, sin glow. Solo info + botón.

```tsx
<ViewEmptyState
    mode="no-results"
    icon={Tag}
    viewName="conceptos"
    onResetFilters={filters.clearAll}
/>
```

> ⚠️ **IMPORTANTE**: Solo mostrar `mode="no-results"` cuando hay filtros ACTIVOS:
> ```tsx
> if (filteredData.length === 0 && filters.hasActiveFilters) { ... }
> ```
> Si `data.length === 0` sin filtros y hay categorías, mostrar el accordion normal con categorías vacías.

### Variante C: Proyecto sin datos (`mode="context-empty"`)

```tsx
<ViewEmptyState
    mode="context-empty"
    icon={FolderOpen}
    viewName="documentos"
    projectName="Centro de Día Caldén"
    onAction={handleCreate}
    actionLabel="Subir Documento"
    onSwitchToOrg={() => setActiveProjectId(null)}
/>
```

### Reglas CRÍTICAS

1. **Icon Match**: El ícono DEBE ser el mismo que usa el sidebar para esa página (ver `use-sidebar-navigation.ts`)
2. **Smart Docs Button**: Pasa `docsPath` siempre que quieras. El componente verifica en `@/lib/docs-registry.ts` si la doc existe antes de mostrar el botón
3. **No-results guard**: NUNCA mostrar "Sin resultados" si no hay filtros activos → usar `filters.hasActiveFilters`
4. **Quick Start Packs**: Definirlos en la vista, no en el componente. Cada pack crea categoría + items en un `onApply` async
5. **Docs Registry**: Al crear nueva documentación en `content/docs/es/X/`, agregar `"/docs/X"` al `Set` en `@/lib/docs-registry.ts`

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

### Column Factories (OBLIGATORIO)

Usar los column factories estándar en vez de definir `ColumnDef` manualmente:

```tsx
import { createDateColumn, createTextColumn, createMoneyColumn } from "@/components/shared/data-table/columns";

const columns = [
    createDateColumn({ accessorKey: "payment_date", avatarFallbackKey: "creator_name" }),
    createTextColumn({ accessorKey: "name", title: "Nombre", truncate: true }),
    createMoneyColumn({ accessorKey: "amount", prefix: "auto", colorMode: "auto" }),
];
```

| Factory | Propósito |
|---------|-----------|
| `createDateColumn` | Fecha con avatar del creador, formato localizado |
| `createTextColumn` | Texto con truncate, subtitle, customRender |
| `createMoneyColumn` | Monto con auto +/-, colores, exchange rate |
| `createStatusColumn` | Badge semántico con inline Command editable |
| `createProjectColumn` | Proyecto con avatar de color/imagen |
| `createEntityColumn` | Tipo/entidad con label + subtítulo, inline Command editable |
| `createWalletColumn` | Billetera con ícono Wallet, inline Popover (`WalletPopoverContent`) |

### Columnas Separadas (OBLIGATORIO)

> ⛔ **NUNCA** definir columnas inline dentro de la vista. Extraerlas a `feature/tables/*-columns.tsx`.

### Uso de DataTable

```tsx
<DataTable
    columns={columns}
    data={data}
    enableRowActions={true}
    onEdit={handleEdit}
    onDelete={handleDelete}        // ← viene de useTableActions
    onBulkDelete={handleBulkDelete} // ← viene de useTableActions
    onClearFilters={filters.clearAll}  // ← viene de useTableFilters
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

### Dialogs de Confirmación (Delete)

> ⛔ **NUNCA** reimplementar `AlertDialog` para delete. Usar `useTableActions`.

```tsx
import { useTableActions } from "@/hooks/use-table-actions";

const { handleDelete, handleBulkDelete, DeleteConfirmDialog } = useTableActions({
    onDelete: (item) => deleteAction(item.id),
    entityName: "material",
    entityNamePlural: "materiales",
});

// En el DataTable:
<DataTable onDelete={handleDelete} onBulkDelete={handleBulkDelete} />

// Al final del JSX:
<DeleteConfirmDialog />
```

> ⛔ **NUNCA** usar `window.confirm()`.

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
- [ ] ¿DataTable con columnas en archivo `tables/*-columns.tsx`?
- [ ] ¿Column Factories (`createDateColumn`, `createTextColumn`, `createMoneyColumn`, `createWalletColumn`, etc.)?
- [ ] ¿Delete usa `useTableActions` (NO AlertDialog manual)?
- [ ] ¿Filtros usan `useTableFilters`?
- [ ] ¿Toasts para feedback, no mensajes inline?
- [ ] ¿Imágenes comprimidas antes de upload?
- [ ] ¿Popovers de selección usan Shared Popover Content (`@/components/shared/popovers/`) cuando aplica?
