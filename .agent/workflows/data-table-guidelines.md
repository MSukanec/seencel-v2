---
description: Guidelines for building enterprise-grade data tables in SEENCEL
---

# DataTable Enterprise Guidelines

> **Última actualización**: 9 Enero 2026

---

## 📊 Estado Actual del Sistema

### ✅ Componentes Creados (Fase 1 Completa)

| Componente | Archivo | Funcionalidad |
|------------|---------|---------------|
| ✅ `DataTable` | `/components/ui/data-table/data-table.tsx` | Core component con sorting, filtering, pagination |
| ✅ `DataTableColumnHeader` | `/components/ui/data-table/data-table-column-header.tsx` | Headers sorteables con dropdown |
| ✅ `DataTablePagination` | `/components/ui/data-table/data-table-pagination.tsx` | Controles de paginación |
| ✅ `DataTableToolbar` | `/components/ui/data-table/data-table-toolbar.tsx` | Búsqueda global + slot para actions |
| ✅ `DataTableViewOptions` | `/components/ui/data-table/data-table-view-options.tsx` | Toggle de visibilidad de columnas |
| ✅ `DataTableRowActions` | `/components/ui/data-table/data-table-row-actions.tsx` | Menú de acciones por fila |

### ✅ Páginas Migradas

| Página | Tabla | Estado |
|--------|-------|--------|
| `/organization/projects` | Proyectos | ✅ Migrado a DataTable |
| `/organization/projects` | Tipos de Proyecto | ⏸️ Mantiene Card pattern (OK para tablas pequeñas) |
| `/organization/projects` | Modalidades | ⏸️ Mantiene Card pattern (OK para tablas pequeñas) |

---

## 🔄 Pendiente (Fase 2 y 3)

### Componentes por Crear

| Componente | Prioridad | Descripción |
|------------|-----------|-------------|
| ⬜ `DataTableFacetedFilter` | Alta | Filtros multi-select (ej: filtrar por tipo/estado) |
| ⬜ `DataTableSkeleton` | Media | Loading skeleton dedicado |
| ⬜ `DataTableEmptyState` | Media | Empty state reutilizable con variantes |
| ⬜ `DataTableExport` | Baja | Export a CSV/Excel |
| ⬜ `DataTableDensityToggle` | Baja | Compact/Default/Comfortable spacing |
| ⬜ `DataTableBulkActions` | Media | Toolbar de acciones masivas |

### Páginas por Migrar

| Página | Tabla | Prioridad |
|--------|-------|-----------|
| ⬜ `/organization/contacts` | Contactos | Alta (tiene más datos) |
| ⬜ `/organization/general-costs` | Conceptos | Media |
| ⬜ `/organization/general-costs` | Pagos | Media |
| ⬜ `/organization/members` | Miembros | Baja (tabla simple) |

---

## 💡 Recomendaciones

### Inmediatas (Esta Semana)

1. **Faceted Filters para Proyectos**
   - Agregar filtro por `status` (Activo, Pausado, Completado)
   - Agregar filtro por `project_type_name`
   - Aparecen como chips clickeables al lado del search

2. **Row Selection + Bulk Actions**
   - Checkbox en primera columna
   - Toolbar que aparece: "3 seleccionados → Archivar | Eliminar | Exportar"

3. **Migrar Contactos**
   - Es la tabla con más datos, ideal para probar performance
   - Ya tiene Grid/Table toggle, combinar con DataTable

### Futuras (Este Mes)

4. **Export Functionality**
   - Button "Exportar" en toolbar
   - Formatos: CSV básico, Excel con formato

5. **Saved Views (Guardado de Filtros)**
   - Usuario guarda combinación de filtros/columnas
   - Dropdown: "Mis Proyectos Activos", "Obras en Lima"

6. **Keyboard Navigation**
   - `j/k` para navegar filas
   - `x` para seleccionar
   - `/` para focus en search

---

## 🚨 Cosas que NO hacer

| ❌ No | ✅ Sí |
|-------|-------|
| DataTable para tablas de <5 rows | Usar Card pattern simple |
| DataTable en modals | Tabla básica o lista |
| Demasiadas columnas visibles | Ocultar secundarias por default |
| Pagination para <20 items | Mostrar todos sin paginar |

---

## ✨ Features Detallados

### 1. Sorting (Ordenamiento)
```tsx
// Click en header para ordenar
// Indicador visual ↑ ↓ ↕
// Multi-column sort con Shift+Click
// Estado: asc → desc → none
```

**UX Tips:**
- Siempre mostrar icono de sort (aunque sea neutro) para indicar que es ordenable
- Highlight sutil en la columna ordenada
- Tooltip "Click para ordenar"

---

### 2. Pagination (Paginación)
```tsx
// Rows per page: 10, 25, 50, 100
// Navegación: First, Prev, 1 2 3 ... 10, Next, Last
// Info: "Mostrando 1-10 de 150 resultados"
// Keyboard shortcuts: ← →
```

**UX Tips:**
- Scroll to top después de cambiar página
- Mantener selección al paginar (opcional)
- Loading state al cambiar página

---

### 3. Column Visibility (Visibilidad de Columnas)
```tsx
// Dropdown con checkboxes
// Drag & drop para reordenar columnas (avanzado)
// Guardar preferencias en localStorage
// "Show all" / "Hide all" buttons
```

**UX Tips:**
- Icono de columnas (Columns2)
- Agrupar columnas por categoría si hay muchas
- Indicar cuántas columnas están ocultas

---

### 4. Filtering (Filtrado)
```tsx
// Global search: busca en todas las columnas
// Column filters: filtro específico por columna
// Faceted filters: checkboxes para valores únicos (ej: status, type)
// Date range filters: para columnas de fecha
// Active filters chips: mostrar filtros activos arriba
```

**UX Tips:**
- Debounce en search (300ms)
- "Clear all filters" visible cuando hay filtros activos
- Highlight de texto que coincide con búsqueda
- Conteo de resultados en tiempo real

---

### 5. Row Selection (Selección de Filas)
```tsx
// Checkbox en primera columna
// Select all (page) / Select all (todos)
// Bulk actions toolbar: aparece al seleccionar
// Acciones: Delete, Export, Assign, etc.
// Keyboard: Space para toggle, Shift+Click para rango
```

**UX Tips:**
- Indicar cuántos seleccionados: "3 seleccionados"
- Confirmar acciones destructivas en bulk
- Deseleccionar al cerrar bulk actions

---

### 6. Loading States
```tsx
// Skeleton rows al cargar inicial
// Overlay spinner al refetch
// Optimistic updates para acciones rápidas
// Error state con retry button
```

**UX Tips:**
- Skeleton debe coincidir con estructura de columnas
- No bloquear toda la UI, solo la tabla
- Messages claros: "Cargando proyectos..."

---

### 7. Empty States
```tsx
// Ilustración/icono relevante
// Mensaje principal: "No hay proyectos"
// Mensaje secundario: "Crea tu primer proyecto"
// CTA button: "+ Nuevo Proyecto"
// Estado cuando filtros no devuelven: "No hay resultados para 'xyz'"
```

---

### 8. Responsive Design
```tsx
// Columnas críticas siempre visibles
// Columnas secundarias ocultas en móvil
// Row expandible para ver detalles en móvil
// Sticky actions column
// Horizontal scroll con fade indicators
```

**Breakpoints:**
- `sm`: Ocultar columnas secundarias
- `md`: Mostrar columnas principales
- `lg`: Mostrar todas las columnas

---

### 9. Row Actions
```tsx
// Dropdown "..." al final de cada fila
// Acciones: View, Edit, Duplicate, Archive, Delete
// Iconos + texto
// Separadores para agrupar acciones
// Colores: Delete en rojo
// Keyboard: Enter para acción primaria
```

---

### 10. Density Toggle
```tsx
// Compact: padding reducido, text-xs, h-8 rows
// Default: padding normal, text-sm, h-10 rows  
// Comfortable: padding amplio, text-base, h-14 rows
// Guardar preferencia en localStorage
```

---

### 11. Export
```tsx
// Formatos: CSV, Excel (xlsx), PDF
// Opciones: Exportar página actual / Exportar todos
// Respetar filtros activos
// Columnas visibles solamente
// Nombre de archivo: "{tabla}_{fecha}.csv"
```

---

### 12. Inline Editing (Avanzado)
```tsx
// Double-click o botón para editar celda
// Input inline con autofocus
// Enter para guardar, Escape para cancelar
// Validación inline
// Optimistic update
```

---

## 🎨 Estética Premium

### Colores y Estados
| Estado | Background | Border |
|--------|------------|--------|
| Default | `transparent` | `border-b` |
| Hover | `muted/50` | - |
| Selected | `primary/10` | `border-primary/20` |
| Disabled | `muted/30` | - |

### Header Styling
```css
/* Header sticky con blur */
.table-header {
  position: sticky;
  top: 0;
  background: hsl(var(--background) / 0.8);
  backdrop-filter: blur(8px);
  z-index: 10;
}
```

### Animaciones
- Row hover: `transition-colors duration-150`
- Select checkbox: scale animation
- Sort icon: rotate transition
- Pagination: fade in/out

---

## 🔧 API Design

### Props del DataTable
```tsx
interface DataTableProps<TData, TValue> {
  // Core
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  
  // Pagination
  pagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  
  // Features
  sorting?: boolean;
  filtering?: boolean;
  columnVisibility?: boolean;
  rowSelection?: boolean;
  
  // Customization
  toolbar?: React.ReactNode;
  emptyState?: React.ReactNode;
  loadingState?: React.ReactNode;
  
  // Events
  onRowClick?: (row: TData) => void;
  onSelectionChange?: (selected: TData[]) => void;
  
  // State (controlled)
  isLoading?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}
```

---

## 📁 Estructura de Archivos

```
src/components/ui/data-table/
├── index.ts                        # Exports
├── data-table.tsx                  # Main component
├── data-table-column-header.tsx    # Sortable header
├── data-table-pagination.tsx       # Pagination controls
├── data-table-toolbar.tsx          # Search + filters + actions
├── data-table-view-options.tsx     # Column visibility
├── data-table-faceted-filter.tsx   # Multi-select filter
├── data-table-row-actions.tsx      # Row dropdown menu
├── data-table-skeleton.tsx         # Loading skeleton
├── data-table-empty-state.tsx      # Empty state
├── data-table-export.tsx           # Export functionality
└── data-table-density-toggle.tsx   # Density switcher
```

---

## 🚀 Orden de Implementación

### Fase 1: Core (MVP)
1. [ ] Instalar `@tanstack/react-table`
2. [ ] `DataTable` básico
3. [ ] `DataTableColumnHeader` con sorting
4. [ ] `DataTablePagination`
5. [ ] `DataTableToolbar` con search

### Fase 2: Enhanced
6. [ ] `DataTableViewOptions` (column visibility)
7. [ ] Row selection + bulk actions
8. [ ] `DataTableFacetedFilter`
9. [ ] `DataTableSkeleton`
10. [ ] `DataTableEmptyState`

### Fase 3: Premium
11. [ ] Export (CSV/Excel)
12. [ ] Density toggle
13. [ ] Responsive columns
14. [ ] Keyboard navigation
15. [ ] localStorage persistence

### Fase 4: Migración
16. [ ] Migrar `contacts-list.tsx` a DataTable
17. [ ] Migrar `concepts-table.tsx`
18. [ ] Migrar `payments-table.tsx`
19. [ ] Migrar cualquier otra tabla

---

## 💡 Innovaciones Sugeridas

### 1. Quick Preview (Row Peek)
- Hover sobre fila → preview panel lateral con más info
- Como Gmail preview pane

### 2. Keyboard Shortcuts
- `j/k` para navegar filas
- `x` para seleccionar
- `/` para focus en search
- `?` para mostrar shortcuts

### 3. Smart Columns
- Auto-detect column types (date, number, currency)
- Formateo automático
- Alignment automático (números a la derecha)

### 4. Saved Views
- Guardar combinación de filtros/columnas/ordenamiento
- "Mis vistas": "Proyectos activos", "Pagos pendientes"

### 5. Real-time Updates
- Supabase realtime para nuevas filas
- Highlight de filas nuevas/modificadas
- "2 registros nuevos" badge

### 6. Column Resizing
- Drag para redimensionar columnas
- Double-click para auto-fit

### 7. Row Virtualization
- Para tablas con 1000+ filas
- Render solo filas visibles
- Smooth scroll

---

## 📋 Checklist de Calidad

Antes de dar por terminado el DataTable:

- [ ] Funciona en todos los breakpoints (mobile, tablet, desktop)
- [ ] Loading states implementados
- [ ] Empty state implementado
- [ ] Error handling
- [ ] Keyboard accessible
- [ ] Rendimiento con 100+ filas
- [ ] TypeScript types completos
- [ ] Documentación de uso
- [ ] Ejemplo de implementación en una página real
