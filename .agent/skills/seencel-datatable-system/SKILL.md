---
name: Seencel DataTable System
description: Arquitectura completa del sistema de DataTable, Column Factories, Toolbar Controls, Hooks globales e Inline Editing. Referencia estándar = Finanzas > Movimientos.
---

# Seencel DataTable System — Referencia Operativa Completa

> **Gold Standard**: [finances-movements-view.tsx](file:///c:/Users/Usuario/Seencel/seencel-v2/src/features/finance/views/finances-movements-view.tsx) + [movements-columns.tsx](file:///c:/Users/Usuario/Seencel/seencel-v2/src/features/finance/tables/movements-columns.tsx)

---

## 1. Arquitectura General

```
features/[feature]/
├── tables/[entity]-columns.tsx   ← Columnas + constantes + export columns
└── views/[feature]-list-view.tsx ← Orquesta hooks + toolbar + DataTable (~200 líneas)

src/components/shared/
├── data-table/
│   ├── data-table.tsx              ← Componente DataTable principal
│   ├── columns/                    ← 7 Column Factories
│   │   ├── date-column.tsx         ← createDateColumn
│   │   ├── text-column.tsx         ← createTextColumn
│   │   ├── money-column.tsx        ← createMoneyColumn
│   │   ├── status-column.tsx       ← createStatusColumn
│   │   ├── project-column.tsx      ← createProjectColumn
│   │   ├── entity-column.tsx       ← createEntityColumn
│   │   ├── percent-column.tsx      ← createPercentColumn
│   │   ├── column-builder.ts       ← createColumns (utility)
│   │   └── index.ts                ← Re-exports
│   ├── data-table-column-header.tsx ← Sorting dropdown
│   ├── data-table-row-actions.tsx   ← ⋯ menu (Edit/Delete/View)
│   ├── data-table-avatar-cell.tsx   ← Avatar + title + subtitle
│   ├── data-table-bulk-actions.tsx  ← Bulk selection bar
│   ├── data-table-export.tsx        ← Legacy export (NO USAR)
│   ├── data-table-pagination.tsx    ← Paginación
│   ├── data-table-skeleton.tsx      ← Loading skeleton
│   ├── inline-editable-cell.tsx     ← Dashed-border numeric cells
│   └── index.ts
├── toolbar-controls/
│   ├── filter-button.tsx            ← FilterPopover (facets + dates)
│   ├── search-button.tsx            ← SearchButton (expandible)
│   ├── display-button.tsx           ← DisplayButton (column visibility)
│   └── index.ts

src/hooks/
├── use-table-actions.tsx            ← Delete single/bulk + dialog
├── use-table-filters.ts             ← Search + date + facets state
├── use-optimistic-action.ts         ← useOptimisticList (add/remove/update)
```

---

## 2. Column Factories — Inventario Completo

Importar SIEMPRE desde:
```tsx
import { createDateColumn, createTextColumn, createMoneyColumn, createStatusColumn, createProjectColumn, createEntityColumn, createPercentColumn } from "@/components/shared/data-table/columns";
import type { StatusOption, ProjectOption } from "@/components/shared/data-table/columns";
```

### 2.1 `createDateColumn<TData>(options)`

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `accessorKey` | `string` | — | Campo de fecha |
| `title` | `string` | `"Fecha"` | Título columna |
| `showTime` | `boolean` | `false` | Mostrar hora debajo |
| `relativeMode` | `"today-only"│"full"│"none"` | `"today-only"` | "Hoy", "Ayer", etc. |
| `showAvatar` | `boolean` | `true` | Avatar del creador |
| `avatarUrlKey` | `string` | `"creator_avatar_url"` | Key para avatar URL |
| `avatarFallbackKey` | `string` | `"creator_full_name"` | Key para fallback |
| `editable` | `boolean` | `false` | DatePicker popover |
| `onUpdate` | `(row, newDate) => void` | — | Callback al editar |
| `size` | `number` | `140` | Ancho en px |

**Visual**: Avatar 32x32 + fecha "23 ene 2026" (o "Hoy"). Si `editable`, borde dashed on hover + Calendar popover.

### 2.2 `createTextColumn<TData>(options)`

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `accessorKey` | `string` | — | Campo de texto |
| `title` | `string` | — | Título columna |
| `truncate` | `boolean│number` | `false` | `true`=180px, `number`=custom |
| `muted` | `boolean` | `false` | Color `text-muted-foreground` |
| `secondary` | `boolean` | `false` | `text-xs font-[450]` (estilo Linear) |
| `subtitle` | `(row) => string` | — | Subtítulo debajo |
| `customRender` | `(value, row) => ReactNode` | — | Override completo |
| `editable` | `boolean` | `false` | Input popover |
| `onUpdate` | `(row, newValue) => void` | — | Callback |
| `size` | `number` | auto | Ancho |

### 2.3 `createMoneyColumn<TData>(options)`

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `accessorKey` | `string` | — | Campo de monto |
| `title` | `string` | `"Monto"` | Título |
| `prefix` | `"+"│"-"│"auto"│"none"` | `"none"` | Prefijo antes del monto |
| `colorMode` | `"positive"│"negative"│"auto"│"none"` | `"none"` | Color semántico |
| `currencyKey` | `string` | `"currency_symbol"` | Key del símbolo moneda |
| `signKey` | `string` | — | Key para determinar signo |
| `signPositiveValue` | `string│number` | — | Valor que indica positivo |
| `showExchangeRate` | `boolean` | `true` | Subtítulo "Cot: X.XX" |
| `align` | `"left"│"right"` | `"right"` | Alineación |
| `size` | `number` | `130` | Ancho |

**Notas**:
- Usa `useMoney()` para respetar decimales de la organización
- Colores: `text-amount-positive` y `text-amount-negative` (CSS vars)
- Con `signKey` + `signPositiveValue`, un valor `0` se trata como **neutral** (sin color ni prefijo)

### 2.4 `createStatusColumn<TData>(options)`

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `accessorKey` | `string` | `"status"` | Campo |
| `title` | `string` | `"Estado"` | Título |
| `options` | `StatusOption[]` | — | **OBLIGATORIO**. Config de estados |
| `editable` | `boolean` | `false` | Command popover |
| `onUpdate` | `(row, newValue) => void` | — | Callback |
| `size` | `number` | `110` | Ancho |

**StatusOption**: `{ value: string, label: string, variant: "positive"│"negative"│"warning"│"neutral" }`

**Visual**: Icono semántico (CheckCircle2/XCircle/Clock/Circle) + texto `text-xs font-[450]`.

### 2.5 `createProjectColumn<TData>(options)`

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `accessorKey` | `string` | `"project_name"` | Campo |
| `getImageUrl` | `(row) => string` | `row.project_image_url` | Imagen |
| `getColor` | `(row) => string` | `row.project_color` | Color fallback |
| `getProjectId` | `(row) => string` | `row.project_id` | ID actual |
| `editable` | `boolean` | `false` | Command popover |
| `projectOptions` | `ProjectOption[]` | `[]` | Opciones para editar |
| `onUpdate` | `(row, newProjectId) => void` | — | Callback |
| `emptyValue` | `string` | `"Sin proyecto"` | Texto vacío |
| `size` | `number` | `160` | Ancho |

**ProjectOption**: `{ value: string, label: string, color?: string, imageUrl?: string }`

### 2.6 `createEntityColumn<TData>(options)`

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `accessorKey` | `string` | — | Campo |
| `title` | `string` | `"Tipo"` | Título |
| `labels` | `Record<string, string>` | — | Map valor→label |
| `getSubtitle` | `(row) => string` | — | Subtítulo |
| `showAvatar` | `boolean` | `false` | Con `DataTableAvatarCell` |
| `size` | `number` | — | Ancho |

**Ideal para**: Columnas "Tipo" que muestran label mapeado + concepto como subtítulo.

### 2.7 `createPercentColumn<TData>(options)`

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `accessorKey` | `string` | — | Campo |
| `title` | `string` | `"Porcentaje"` | Título |
| `decimals` | `number` | `1` | Decimales |
| `colorMode` | `"none"│"positive-negative"` | `"none"` | Verde/rojo |
| `suffix` | `string` | `"%"` | Sufijo |
| `size` | `number` | auto | Ancho |

Siempre alineado a la derecha, `font-mono tabular-nums`.

---

## 3. Hooks Globales — OBLIGATORIOS

### 3.1 `useTableFilters(options)`

```tsx
import { useTableFilters } from "@/hooks/use-table-filters";

const filters = useTableFilters({
  facets: [
    { key: "type", title: "Tipo", icon: Tags, options: TYPE_OPTIONS },
    { key: "status", title: "Estado", icon: CircleDot, options: STATUS_OPTIONS },
  ],
  enableDateRange: true,
});
```

**Retorna**: `searchQuery`, `setSearchQuery`, `dateRange`, `setDateRange`, `facetValues`, `toggleFacet`, `clearFacet`, `clearAll`, `hasActiveFilters`, `facetConfigs`, `enableDateRange`.

**⛔ Prohibido**: Crear estados de filtro sueltos (`useState` para search, status, etc).

### 3.2 `useTableActions<T>(options)`

```tsx
import { useTableActions } from "@/hooks/use-table-actions";

const { handleDelete, handleBulkDelete, DeleteConfirmDialog } = useTableActions<any>({
  onDelete: async (item) => {
    await deleteAction(item.id);
    return { success: true };
  },
  entityName: "movimiento",
  entityNamePlural: "movimientos",
});
```

**Retorna**: `handleDelete`, `handleBulkDelete`, `isDeleting`, `DeleteConfirmDialog` (componente FC — renderizar al final del JSX).

**⛔ Prohibido**: Reimplementar AlertDialog para borrado.

### 3.3 `useOptimisticList<T>(options)`

```tsx
import { useOptimisticList } from "@/hooks/use-optimistic-action";

const { optimisticItems, removeItem, updateItem } = useOptimisticList({
  items: serverData,
  getItemId: (m) => m.id,
});
```

**Retorna**: `optimisticItems`, `addItem`, `removeItem`, `updateItem`, `isPending`.

**Uso con delete**:
```tsx
optimisticRemove(item.id, async () => {
  await deleteAction(item.id);
});
```

**Uso con inline update**:
```tsx
optimisticUpdate(row.id, fields, async () => {
  await updateAction(row.id, dbFields);
});
```

---

## 4. Toolbar Controls — OBLIGATORIOS

Importar SIEMPRE desde:
```tsx
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { FilterPopover, SearchButton, DisplayButton } from "@/components/shared/toolbar-controls";
import { getStandardToolbarActions } from "@/lib/toolbar-actions";
```

### 4.1 `FilterPopover`

- Consume `useTableFilters` directamente: `<FilterPopover filters={filters} />`
- Muestra categorías (facets + fechas) con sub-panel hover
- Badge con contador de filtros activos
- Deduplicación automática + orden alfabético

### 4.2 `SearchButton`

- Consume `useTableFilters`: `<SearchButton filters={filters} placeholder="Buscar..." />`
- Ghost button que expande a inline input
- Colapsa al perder foco si no hay query
- ESC para limpiar y cerrar

### 4.3 `DisplayButton`

- Consume TanStack Table: `<DisplayButton table={table} />`
- Toggle de visibilidad de columnas con Switch
- Agnostic (no depende de useTableFilters)

### 4.4 `getStandardToolbarActions(options)`

```tsx
const toolbarActions = [
  { label: "Nuevo X", onClick: openNew, icon: Plus },
  ...getStandardToolbarActions({
    onExportCSV: handleExportCSV,
    onExportExcel: handleExportExcel,
    onImport: handleImport, // opcional
  }),
];
```

Genera acciones estándar: Importar → Historial → PDF (PRO) → CSV → Excel.

---

## 5. Embedded Toolbar Pattern

La toolbar se renderiza **dentro** del card de DataTable usando `embeddedToolbar`:

```tsx
const embeddedToolbar = (table: any) => (
  <Toolbar
    leftActions={
      <>
        <FilterPopover filters={filters} />
        <DisplayButton table={table} />
        <SearchButton filters={filters} placeholder="Buscar..." />
      </>
    }
    actions={toolbarActions}
  />
);

<DataTable embeddedToolbar={embeddedToolbar} ... />
```

**Para Empty y No-Results**, la toolbar se renderiza con `portalToHeader`:
```tsx
<Toolbar portalToHeader actions={toolbarActions} />              // empty state
<Toolbar portalToHeader leftActions={...} actions={toolbarActions} />  // no-results
```

---

## 6. Inline Editing — Patrón Linear-style

### 6.1 Columnas con edición inline

Cada Column Factory soporta `editable` + `onUpdate`. El estilo visual es:
- **Idle**: Borde transparente
- **Hover**: Borde dashed + fondo `#2a2b2d`
- **Active**: Popover (Calendar, Input, Command según tipo)

### 6.2 Handler centralizado

```tsx
// Llave UI-only que NO se envían al server
const UI_ONLY_KEYS = new Set(['project_name', 'project_image_url', 'project_color']);

const handleInlineUpdate = (row: any, fields: Record<string, any>) => {
  // 1. Optimistic update con TODOS los fields (incluye UI-only)
  optimisticUpdate(row.id, fields, async () => {
    // 2. Filtrar UI-only keys antes de enviar al server
    const dbFields = Object.fromEntries(
      Object.entries(fields).filter(([key]) => !UI_ONLY_KEYS.has(key))
    );
    const result = await updateAction(row.id, row.type, dbFields);
    if (!result.success) toast.error(result.error);
    router.refresh();
  });
};
```

### 6.3 Columnas que pasan el handler

```tsx
const columns = getMovementColumns({
  getWalletName,
  projectOptions,
  showProjectColumn,
  onInlineUpdate: handleInlineUpdate,
});
```

Dentro de la factory, cada columna decide cómo mapear:
```tsx
createDateColumn({
  editable: !!onInlineUpdate,
  onUpdate: onInlineUpdate
    ? (row, newDate) => onInlineUpdate(row, { payment_date: newDate })
    : undefined,
});
```

### 6.4 `InlineEditableCell` (componente standalone)

Para celdas numéricas con sufijo (%, m², etc.) que NO usan Column Factories:

```tsx
import { InlineEditableCell } from "@/components/shared/data-table/inline-editable-cell";

<InlineEditableCell
  value={42.5}
  onSave={(val) => handleSave(val)}
  suffix="%"
  type="number"
  align="right"
/>
```

---

## 7. Columns File — Estructura del archivo `tables/[entity]-columns.tsx`

```tsx
"use client";

// ─── Imports ─────────────────────────────────────────
import { ColumnDef } from "@tanstack/react-table";
import { createDateColumn, createTextColumn, ... } from "@/components/shared/data-table/columns";
import type { StatusOption, ProjectOption, ExportColumn } from "...";

// ─── Constants ───────────────────────────────────────
export const TYPE_LABELS: Record<string, string> = { ... };
export const TYPE_OPTIONS = Object.entries(TYPE_LABELS).map(([value, label]) => ({ label, value }));

export const STATUS_CONFIG: StatusOption[] = [
  { value: "confirmed", label: "Confirmado", variant: "positive" },
  { value: "pending", label: "Pendiente", variant: "warning" },
];
export const STATUS_OPTIONS = STATUS_CONFIG.map(({ value, label }) => ({ label, value }));

// ─── Column Factory ──────────────────────────────────
interface ColumnsOptions {
  getWalletName: (id: string) => string;
  projectOptions?: ProjectOption[];
  onInlineUpdate?: (row: any, fields: Record<string, any>) => void;
}

export function getColumns(options: ColumnsOptions): ColumnDef<any>[] {
  return [
    createDateColumn({ accessorKey: "date", editable: !!options.onInlineUpdate, ... }),
    createEntityColumn({ accessorKey: "type", labels: TYPE_LABELS, ... }),
    createTextColumn({ accessorKey: "description", truncate: true, secondary: true }),
    createMoneyColumn({ accessorKey: "amount", prefix: "auto", colorMode: "auto" }),
    createStatusColumn({ options: STATUS_CONFIG, editable: !!options.onInlineUpdate, ... }),
  ];
}

// ─── Export Columns ──────────────────────────────────
export const EXPORT_COLUMNS: ExportColumn<any>[] = [
  { key: "date", header: "Fecha", transform: (val) => ... },
  { key: "type", header: "Tipo", transform: (val) => TYPE_LABELS[val] || val },
  ...
];
```

---

## 8. View File — Estructura del archivo `views/[feature]-list-view.tsx`

```tsx
"use client";

// ─── Imports ─────────────────────────────────────────
import { DataTable } from "@/components/shared/data-table/data-table";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { FilterPopover, SearchButton, DisplayButton } from "@/components/shared/toolbar-controls";
import { useTableActions } from "@/hooks/use-table-actions";
import { useTableFilters } from "@/hooks/use-table-filters";
import { useOptimisticList } from "@/hooks/use-optimistic-action";
import { getStandardToolbarActions } from "@/lib/toolbar-actions";
import { usePanel } from "@/stores/panel-store";
import { getColumns, TYPE_OPTIONS, STATUS_OPTIONS, EXPORT_COLUMNS } from "../tables/columns";

// ─── Types ───────────────────────────────────────────
interface Props { data: any[]; /* ... */ }

// ─── Component (~200 líneas max) ─────────────────────
export function ListView({ data, ...props }: Props) {
  const { openPanel, closePanel } = usePanel();
  const router = useRouter();

  // 1. Optimistic UI
  const { optimisticItems, removeItem, updateItem } = useOptimisticList({ items: data, getItemId: (m) => m.id });

  // 2. Filters  
  const filters = useTableFilters({ facets: [...], enableDateRange: true });

  // 3. Delete actions
  const { handleDelete, handleBulkDelete, DeleteConfirmDialog } = useTableActions({ ... });

  // 4. Filter data
  const filteredData = useMemo(() => optimisticItems.filter(m => { ... }), [...]);

  // 5. Columns
  const columns = getColumns({ onInlineUpdate: handleInlineUpdate, ... });

  // 6. Toolbar actions
  const toolbarActions = [
    { label: "Nuevo", onClick: openNew, icon: Plus },
    ...getStandardToolbarActions({ onExportCSV, onExportExcel }),
  ];

  // 7. Empty state (no data)
  if (optimisticItems.length === 0) return (
    <>
      <Toolbar portalToHeader actions={toolbarActions} />
      <ViewEmptyState mode="empty" icon={...} viewName="..." ... />
    </>
  );

  // 8. No-results state (filters applied)
  if (filteredData.length === 0) return (
    <>
      <Toolbar portalToHeader leftActions={<><FilterPopover .../><SearchButton .../></>} actions={toolbarActions} />
      <ViewEmptyState mode="no-results" onAction={filters.clearAll} ... />
    </>
  );

  // 9. Embedded toolbar
  const embeddedToolbar = (table) => (
    <Toolbar leftActions={<><FilterPopover .../><DisplayButton .../><SearchButton .../></>} actions={toolbarActions} />
  );

  // 10. Render
  return (
    <>
      <DataTable
        columns={columns}
        data={filteredData}
        enableRowSelection
        enableRowActions
        onRowClick={handleRowClick}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
        initialSorting={[{ id: "date", desc: true }]}
        globalFilter={filters.searchQuery}
        onGlobalFilterChange={filters.setSearchQuery}
        onClearFilters={filters.clearAll}
        embeddedToolbar={embeddedToolbar}
      />
      <DeleteConfirmDialog />
    </>
  );
}
```

---

## 9. DataTable Props — Referencia Rápida

| Prop | Tipo | Descripción |
|------|------|-------------|
| `columns` | `ColumnDef[]` | Desde Column Factory |
| `data` | `TData[]` | Datos filtrados |
| `enableRowSelection` | `boolean` | Checkboxes para selección |
| `enableRowActions` | `boolean` | Menú ⋯ por fila |
| `onRowClick` | `(row) => void` | Click en fila (abre detail panel) |
| `onEdit` | `(row) => void` | Acción Editar del menú ⋯ |
| `onDelete` | `(row) => void` | Acción Eliminar (de `useTableActions`) |
| `onBulkDelete` | `(items, resetSelection) => void` | Bulk delete |
| `initialSorting` | `SortingState` | Orden inicial |
| `globalFilter` | `string` | Búsqueda global (de `useTableFilters`) |
| `onGlobalFilterChange` | `(value) => void` | Setter búsqueda |
| `onClearFilters` | `() => void` | Limpiar filtros (de `useTableFilters`) |
| `embeddedToolbar` | `(table) => ReactNode` | Toolbar embebida |
| `pageSize` | `number` | Default: `100` |
| `showPagination` | `boolean` | Default: `true` |
| `stickyHeader` | `boolean` | Default: `true` |
| `autoHideEmptyColumns` | `boolean` | Ocultar columnas vacías |

---

## 10. Prohibiciones y Anti-Patrones

| ⛔ Prohibido | ✅ Correcto |
|-------------|-------------|
| Definir columnas inline en la vista | Extraer a `tables/[entity]-columns.tsx` |
| Reimplementar AlertDialog para delete | Usar `useTableActions` |
| Crear estados de filtro sueltos | Usar `useTableFilters` |
| Vista de más de 250 líneas | Delegar a hooks, tables/, helpers |
| `<Input>` raw para search | `SearchButton` de toolbar-controls |
| Filtros custom manuales | `FilterPopover` + `useTableFilters` |
| Colores hex hardcoded en montos | `text-amount-positive` / `text-amount-negative` |
| `new Date(dateFromDB)` sin parsear | `parseDateFromDB()` de `@/lib/timezone-data` |
| Toolbar duplicada en header y tabla | `embeddedToolbar` para tabla, `portalToHeader` para empty/no-results |
| Export legacy (`DataTableExport`) | `exportToCSV` / `exportToExcel` de `@/lib/export` |

---

## 11. Checklist para Nuevas Vistas con DataTable

- [ ] Crear `tables/[entity]-columns.tsx` con constantes, factory y export columns
- [ ] Usar TODAS las Column Factories correspondientes (nunca columnas manuales)
- [ ] Implementar `useTableFilters` con facets relevantes
- [ ] Implementar `useTableActions` para delete single/bulk
- [ ] Implementar `useOptimisticList` si hay operaciones inline
- [ ] Toolbar con `FilterPopover` + `SearchButton` + `DisplayButton`
- [ ] Acciones toolbar con `getStandardToolbarActions`
- [ ] Empty state con `ViewEmptyState mode="empty"` + toolbar `portalToHeader`
- [ ] No-results state con `ViewEmptyState mode="no-results"` + filtros en toolbar
- [ ] `embeddedToolbar` para el estado normal con datos
- [ ] `DeleteConfirmDialog` renderizado al final del JSX
- [ ] Vista ≤ 250 líneas
