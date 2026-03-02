"use client";

import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    ExpandedState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getExpandedRowModel,
    useReactTable,
    type Table,
    type Row,
} from "@tanstack/react-table";
import * as React from "react";

import {
    Table as UiTable,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableSkeleton } from "./data-table-skeleton";
import { cn } from "@/lib/utils";
import { DataTableRowActions } from "./data-table-row-actions";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Paperclip, X, Trash2, ChevronRight, ChevronDown } from "lucide-react";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    isLoading?: boolean;
    onRowClick?: (row: TData) => void;
    pageSize?: number;
    showPagination?: boolean;
    stickyHeader?: boolean;
    viewMode?: "table" | "grid";
    renderGridItem?: (item: TData) => React.ReactNode;
    gridClassName?: string;
    emptyState?: React.ReactNode | ((props: { table: Table<TData> }) => React.ReactNode);
    enableRowSelection?: boolean;
    bulkActions?: React.ReactNode | ((props: { table: Table<TData> }) => React.ReactNode);
    initialSorting?: SortingState;
    enableRowActions?: boolean;
    enableAttachmentIndicator?: boolean;
    onView?: (row: TData) => void;
    onEdit?: (row: TData) => void;
    onDuplicate?: (row: TData) => void;
    onDelete?: (row: TData) => void;
    onBulkDelete?: (rows: TData[], resetSelection: () => void) => void;
    customActions?: {
        label: string;
        icon?: React.ReactNode;
        onClick: (data: TData) => void;
        variant?: "default" | "destructive";
    }[];
    /** External global filter value (controlled by parent/Toolbar) */
    globalFilter?: string;
    /** Callback when global filter changes (controlled by parent/Toolbar) */
    onGlobalFilterChange?: (value: string) => void;
    /** Callback when filters should be cleared */
    onClearFilters?: () => void;

    // =========================================================================
    // ROW GROUPING PROPS
    // =========================================================================
    /** Column ID to group rows by. When set, rows are grouped and group headers are shown */
    groupBy?: string;
    /** Custom render function for group header row. Receives group value and all rows in the group */
    renderGroupHeader?: (groupValue: string, rows: TData[], isExpanded: boolean) => React.ReactNode;
    /** Whether groups start expanded. Default: true */
    defaultGroupsExpanded?: boolean;
    /** Accessor function to get the grouping value from a row (useful for nested objects) */
    getGroupValue?: (row: TData) => string;
    /** Accessor function to calculate a summary value for the group (e.g., subtotal). Displayed in penultimate column */
    groupSummaryAccessor?: (rows: TData[]) => string | number;
    /** Column ID where the group summary should be displayed. If not set, defaults to the last data column before actions */
    groupSummaryColumnId?: string;
    /** Accessor function to calculate incidencia % for the group (% of total) */
    groupIncidenciaAccessor?: (rows: TData[]) => string | number;
    /** Column ID where the group incidencia should be displayed */
    groupIncidenciaColumnId?: string;
    /** Accessor function to get the formatted number prefix for this group (e.g., "01", "02") */
    groupNumberAccessor?: (groupValue: string, groupIndex: number) => string;
    /** Hide the column used for grouping (since it's redundant when grouped). Default: true */
    hideGroupColumn?: boolean;
    /** Label for item count in group header. Default: 'ítem' / 'ítems' */
    groupItemLabel?: { singular: string; plural: string };

    // =========================================================================
    // COLUMN VISIBILITY PROPS
    // =========================================================================
    /** Automatically hide columns where all values are empty/null/undefined. Default: false */
    autoHideEmptyColumns?: boolean;
    /** Column IDs to exclude from auto-hide check (e.g., always show even if empty) */
    autoHideExcludeColumns?: string[];

    // =========================================================================
    // EMBEDDED TOOLBAR — Renders toolbar inside the card, above the table
    // =========================================================================
    /** Toolbar rendered as first row inside the DataTable card. Receives table instance for column visibility controls */
    embeddedToolbar?: React.ReactNode | ((table: Table<TData>) => React.ReactNode);

    // =========================================================================
    // DEPRECATED PROPS - Accepted for backward compatibility but NOT rendered
    // The toolbar should be managed at the Page/View level using the Toolbar component
    // =========================================================================
    /** @deprecated Use Toolbar component at Page/View level instead */
    searchPlaceholder?: string;
    /** @deprecated Use Toolbar component at Page/View level instead */
    searchKey?: string;
    /** @deprecated Use Toolbar component at Page/View level instead */
    showToolbar?: boolean;
    /** @deprecated Use Toolbar component at Page/View level instead */
    toolbarInHeader?: boolean;
    /** @deprecated Use Toolbar component at Page/View level instead */
    toolbar?: React.ReactNode | ((props: { table: Table<TData> }) => React.ReactNode);
    /** @deprecated Use Toolbar component at Page/View level instead */
    leftActions?: React.ReactNode;
    /** @deprecated Use Toolbar component at Page/View level instead */
    actions?: any[] | ((props: { table: Table<TData> }) => any[]);
    /** @deprecated Use Toolbar component at Page/View level instead */
    facetedFilters?: any[];
}

export function DataTable<TData, TValue>({
    columns,
    data,
    isLoading = false,
    onRowClick,
    emptyState,
    pageSize = 100,
    showPagination = true,
    stickyHeader = true,
    viewMode = "table",
    renderGridItem,
    gridClassName = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
    enableRowSelection = false,
    bulkActions,
    initialSorting,
    meta,
    enableRowActions = false,
    enableAttachmentIndicator = true,
    onView,
    onEdit,
    onDuplicate,
    onDelete,
    onBulkDelete,
    customActions,
    globalFilter: externalGlobalFilter,
    onGlobalFilterChange,
    onClearFilters,
    // Row Grouping props
    groupBy,
    renderGroupHeader,
    defaultGroupsExpanded = true,
    getGroupValue,
    groupSummaryAccessor,
    groupSummaryColumnId,
    groupIncidenciaAccessor,
    groupIncidenciaColumnId,
    groupNumberAccessor,
    hideGroupColumn = true,
    groupItemLabel = { singular: 'ítem', plural: 'ítems' },
    // Column visibility props
    autoHideEmptyColumns = false,
    autoHideExcludeColumns = [],
    // Embedded toolbar
    embeddedToolbar,
}: DataTableProps<TData, TValue> & { meta?: any }) {
    const [sorting, setSorting] = React.useState<SortingState>(initialSorting || []);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});
    // Stable reference for column count to avoid infinite loops
    const columnsLength = columns.length;

    // Auto-hide the groupBy column and empty columns
    React.useEffect(() => {
        const newVisibility: VisibilityState = {};

        // Hide groupBy column
        if (groupBy && hideGroupColumn) {
            newVisibility[groupBy] = false;
        }

        // Auto-hide empty columns
        if (autoHideEmptyColumns && data.length > 0) {
            columns.forEach(col => {
                const columnId = (col as any).accessorKey || (col as any).id;
                if (!columnId) return;

                // Skip excluded columns
                if (autoHideExcludeColumns.includes(columnId)) return;

                // Skip system columns
                if (['select', 'actions'].includes(columnId)) return;

                // Check if all values in this column are empty
                const hasAnyValue = data.some(row => {
                    const value = (row as any)[columnId];
                    // Consider empty: null, undefined, empty string, 0, "-"
                    return value !== null &&
                        value !== undefined &&
                        value !== '' &&
                        value !== 0 &&
                        value !== '-';
                });

                if (!hasAnyValue) {
                    newVisibility[columnId] = false;
                }
            });
        }

        if (Object.keys(newVisibility).length > 0) {
            setColumnVisibility(newVisibility);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groupBy, hideGroupColumn, autoHideEmptyColumns, columnsLength, data.length]);

    // Use internal state if not controlled externally
    const [internalGlobalFilter, setInternalGlobalFilter] = React.useState("");
    const globalFilter = externalGlobalFilter ?? internalGlobalFilter;
    const setGlobalFilter = onGlobalFilterChange ?? setInternalGlobalFilter;

    // Row grouping state - tracks which groups are expanded
    const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>(() => {
        if (!groupBy) return {};
        // Initialize all groups as expanded or collapsed based on defaultGroupsExpanded
        const groups: Record<string, boolean> = {};
        data.forEach((row) => {
            const groupValue = getGroupValue ? getGroupValue(row) : String((row as any)[groupBy] ?? "Sin categoría");
            groups[groupValue] = defaultGroupsExpanded;
        });
        return groups;
    });

    // Toggle group expansion
    const toggleGroup = (groupValue: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupValue]: !prev[groupValue]
        }));
    };

    // Group data if groupBy is provided
    const groupedData = React.useMemo(() => {
        if (!groupBy) return null;

        const groups: Record<string, TData[]> = {};
        data.forEach((row) => {
            const groupValue = getGroupValue ? getGroupValue(row) : String((row as any)[groupBy] ?? "Sin categoría");
            if (!groups[groupValue]) {
                groups[groupValue] = [];
            }
            groups[groupValue].push(row);
        });
        return groups;
    }, [data, groupBy, getGroupValue]);


    const tableColumns = React.useMemo(() => {
        const baseColumns = [...columns];

        if (enableRowSelection) {
            const selectionColumn: ColumnDef<TData, TValue> = {
                id: "select",
                header: ({ table }) => (
                    <Checkbox
                        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label="Seleccionar todo"
                        className="translate-y-[2px] border-muted-foreground/50 data-[state=checked]:border-primary"
                    />
                ),
                cell: ({ row }) => (
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className={`transition-opacity duration-150 ${row.getIsSelected() ? "opacity-100" : "opacity-0 group-hover/row:opacity-100"}`}
                    >
                        <Checkbox
                            checked={row.getIsSelected()}
                            onCheckedChange={(value) => row.toggleSelected(!!value)}
                            aria-label="Seleccionar fila"
                            className="translate-y-[2px] border-muted-foreground/50 data-[state=checked]:border-primary"
                        />
                    </div>
                ),
                enableSorting: false,
                enableHiding: false,
                size: 40,
            };
            baseColumns.unshift(selectionColumn);
        }

        if (enableRowActions) {
            baseColumns.push({
                id: "actions",
                header: () => <span className="sr-only">Acciones</span>,
                cell: ({ row }: { row: any }) => {
                    // Check for attachments automatically
                    const hasAttachments = enableAttachmentIndicator && (
                        row.original.has_attachments === true ||
                        (Array.isArray(row.original.attachments) && row.original.attachments.length > 0) ||
                        (Array.isArray(row.original.media_links) && row.original.media_links.length > 0) ||
                        (Array.isArray(row.original.files) && row.original.files.length > 0) ||
                        (typeof row.original.image_url === 'string' && row.original.image_url.length > 0 && row.original.image_url.startsWith('http'))
                    );

                    return (
                        <div className="flex justify-end items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {hasAttachments && (
                                <Paperclip className="h-3.5 w-3.5 text-muted-foreground/70" />
                            )}
                            <DataTableRowActions
                                row={row}
                                onView={onView}
                                onEdit={onEdit}
                                onDuplicate={onDuplicate}
                                onDelete={onDelete}
                                customActions={customActions}
                            />
                        </div>
                    );
                },
                size: 50,
                enableHiding: false,
            } as any);
        }

        return baseColumns;
    }, [columns, enableRowSelection, enableRowActions, onView, onEdit, onDuplicate, onDelete, customActions]);

    const table = useReactTable({
        data,
        columns: tableColumns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: "includesString",
        meta,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            globalFilter,
        },
        initialState: {
            pagination: {
                pageSize,
            },
        },
    });

    return (
        <div className={cn("space-y-4", (data.length === 0 && emptyState) ? "h-full flex flex-col" : "")}>
            {/* Table Container */}
            {data.length === 0 && emptyState ? (
                // Full Page Empty State (No Table Structure)
                <div className="flex-1 flex flex-col h-full">
                    {typeof emptyState === "function"
                        ? (emptyState as (props: { table: Table<TData> }) => React.ReactNode)({ table })
                        : emptyState}
                </div>
            ) : (
                viewMode === "grid" && renderGridItem ? (
                    <div className={gridClassName}>
                        {table.getRowModel().rows.map((row) => (
                            <div key={row.id}>
                                {renderGridItem(row.original)}
                            </div>
                        ))}
                        {table.getRowModel().rows.length === 0 && (
                            <div className="col-span-full">
                                <Card className="flex flex-col items-center justify-center py-12 text-muted-foreground p-8">
                                    <p className="font-medium">No se encontraron resultados</p>
                                    <p className="text-sm mt-1">Intenta ajustar los filtros o la búsqueda</p>
                                </Card>
                            </div>
                        )}
                    </div>
                ) : (
                    <Card className="overflow-hidden">
                        {/* Embedded Toolbar — integrated header */}
                        {embeddedToolbar && (
                            <div className="px-4 py-2.5 border-b border-border/50">
                                {typeof embeddedToolbar === 'function'
                                    ? embeddedToolbar(table)
                                    : embeddedToolbar
                                }
                            </div>
                        )}
                        <div className="relative w-full overflow-auto">
                            <UiTable>
                                <TableHeader
                                    className={cn(
                                        stickyHeader && "sticky top-0 z-10 bg-card/95 backdrop-blur-sm",
                                        "overflow-hidden"
                                    )}
                                >
                                    {table.getHeaderGroups().map((headerGroup) => {
                                        const isSelecting = enableRowSelection && table.getSelectedRowModel().rows.length > 0;

                                        return (
                                            <TableRow
                                                key={headerGroup.id}
                                                className={cn(
                                                    "hover:bg-transparent border-b-2 transition-colors duration-200",
                                                    isSelecting && "bg-primary/5"
                                                )}
                                            >
                                                {headerGroup.headers.map((header, index) => {
                                                    const isFirst = index === 0;
                                                    const isLast = index === headerGroup.headers.length - 1;

                                                    return (
                                                        <TableHead
                                                            key={header.id}
                                                            className={cn(
                                                                "h-11 text-[11px] font-medium text-muted-foreground relative",
                                                                !(isSelecting && isLast) && "overflow-hidden",
                                                                isFirst ? "px-4" : isLast ? "px-6" : "px-4"
                                                            )}
                                                            style={{
                                                                // Linear-style: primary column fills remaining space,
                                                                // compact columns auto-shrink to content
                                                                width: header.column.columnDef.enableHiding === false
                                                                    && header.id !== 'select' && header.id !== 'actions'
                                                                    ? '100%'
                                                                    : header.getSize() !== 150 ? header.getSize() : undefined
                                                            }}
                                                        >
                                                            {/* Normal header content - slides out */}
                                                            <div
                                                                className={cn(
                                                                    "transition-all duration-300 ease-out",
                                                                    isSelecting
                                                                        ? "opacity-0 translate-x-8"
                                                                        : "opacity-100 translate-x-0"
                                                                )}
                                                            >
                                                                {header.isPlaceholder
                                                                    ? null
                                                                    : flexRender(header.column.columnDef.header, header.getContext())}
                                                            </div>

                                                            {/* Selection content - slides in */}
                                                            {enableRowSelection && (
                                                                <div
                                                                    className={cn(
                                                                        "absolute flex items-center transition-all duration-300 ease-out",
                                                                        isLast
                                                                            ? "right-0 top-0 bottom-0 px-6"
                                                                            : "inset-0",
                                                                        isFirst ? "px-4" : !isLast && "px-4",
                                                                        isSelecting
                                                                            ? "opacity-100 translate-x-0"
                                                                            : "opacity-0 -translate-x-8"
                                                                    )}
                                                                >
                                                                    {isFirst ? (
                                                                        <Checkbox
                                                                            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                                                                            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                                                                            aria-label="Seleccionar todo"
                                                                        />
                                                                    ) : index === 1 ? (
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="text-sm font-medium text-foreground whitespace-nowrap">
                                                                                {table.getSelectedRowModel().rows.length} seleccionado(s)
                                                                            </span>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => table.resetRowSelection()}
                                                                                className="text-muted-foreground hover:text-foreground h-7 px-2"
                                                                            >
                                                                                <X className="h-3.5 w-3.5 mr-1" />
                                                                                Deseleccionar
                                                                            </Button>
                                                                        </div>
                                                                    ) : isLast ? (
                                                                        <div className="flex items-center gap-2 whitespace-nowrap">
                                                                            {(onBulkDelete || onDelete) && (
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2 whitespace-nowrap"
                                                                                    onClick={() => {
                                                                                        const selectedRows = table.getSelectedRowModel().rows.map(r => r.original);
                                                                                        if (onBulkDelete) {
                                                                                            onBulkDelete(selectedRows, () => table.resetRowSelection());
                                                                                        } else if (onDelete && selectedRows.length === 1) {
                                                                                            onDelete(selectedRows[0]);
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                                                                                    Eliminar
                                                                                </Button>
                                                                            )}
                                                                            {typeof bulkActions === "function"
                                                                                ? bulkActions({ table })
                                                                                : bulkActions}
                                                                        </div>
                                                                    ) : null}
                                                                </div>
                                                            )}
                                                        </TableHead>
                                                    );
                                                })}
                                            </TableRow>
                                        );
                                    })}
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <DataTableSkeleton columnCount={columns.length} rowCount={pageSize} />
                                    ) : groupBy && groupedData ? (
                                        // GROUPED MODE: Render group headers + rows
                                        Object.entries(groupedData).map(([groupValue, groupRows]) => {
                                            const isExpanded = expandedGroups[groupValue] ?? defaultGroupsExpanded;
                                            const colSpan = tableColumns.length;

                                            return (
                                                <React.Fragment key={groupValue}>
                                                    {/* Group Header Row - styled with primary background */}
                                                    <TableRow
                                                        className="bg-primary/10 hover:bg-primary/15 cursor-pointer border-b"
                                                        onClick={() => toggleGroup(groupValue)}
                                                    >
                                                        {renderGroupHeader ? (
                                                            // Custom render - uses colSpan for full control
                                                            <TableCell colSpan={colSpan} className="px-4 py-3 bg-primary/10">
                                                                {renderGroupHeader(groupValue, groupRows, isExpanded)}
                                                            </TableCell>
                                                        ) : (
                                                            // Default render - celdas individuales alineadas con columnas visibles
                                                            <>
                                                                {table.getVisibleLeafColumns().map((column, colIdx, allColumns) => {
                                                                    const columnId = column.id;
                                                                    const isFirstColumn = colIdx === 0;
                                                                    const isLastColumn = colIdx === allColumns.length - 1;
                                                                    const isSummaryColumn = groupSummaryColumnId
                                                                        ? columnId === groupSummaryColumnId
                                                                        : false;
                                                                    const isIncidenciaColumn = groupIncidenciaColumnId
                                                                        ? columnId === groupIncidenciaColumnId
                                                                        : false;

                                                                    return (
                                                                        <TableCell key={columnId} className="px-4 py-3 bg-primary/10">
                                                                            {isFirstColumn && groupNumberAccessor ? (
                                                                                // First cell: only the group number
                                                                                <span className="font-mono font-semibold text-foreground">
                                                                                    {groupNumberAccessor(groupValue, Object.keys(groupedData).indexOf(groupValue) + 1)}
                                                                                </span>
                                                                            ) : colIdx === 1 ? (
                                                                                // Second cell: group name + count (this is typically the "Tarea" column)
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="font-semibold text-base text-foreground">{groupValue}</span>
                                                                                    <span className="text-muted-foreground text-sm">
                                                                                        ({groupRows.length} {groupRows.length === 1 ? groupItemLabel.singular : groupItemLabel.plural})
                                                                                    </span>
                                                                                </div>
                                                                            ) : isSummaryColumn && groupSummaryAccessor ? (
                                                                                // Summary column: show group subtotal (aligned right like items)
                                                                                <div className="flex justify-end">
                                                                                    <span className="font-semibold font-mono text-foreground">
                                                                                        {groupSummaryAccessor(groupRows)}
                                                                                    </span>
                                                                                </div>
                                                                            ) : isIncidenciaColumn && groupIncidenciaAccessor ? (
                                                                                // Incidencia column: show group % of total (aligned right like items)
                                                                                <div className="flex justify-end">
                                                                                    <span className="font-semibold font-mono text-foreground">
                                                                                        {groupIncidenciaAccessor(groupRows)}
                                                                                    </span>
                                                                                </div>
                                                                            ) : isLastColumn ? (
                                                                                // Last cell: chevron (aligned with actions column)
                                                                                <div className="flex justify-end">
                                                                                    {isExpanded ? (
                                                                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                                                    ) : (
                                                                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                                                    )}
                                                                                </div>
                                                                            ) : null}
                                                                        </TableCell>
                                                                    );
                                                                })}
                                                            </>
                                                        )}
                                                    </TableRow>

                                                    {/* Group Rows (only if expanded) */}
                                                    {isExpanded && table.getRowModel().rows
                                                        .filter(row => {
                                                            const rowGroupValue = getGroupValue
                                                                ? getGroupValue(row.original)
                                                                : String((row.original as any)[groupBy] ?? "Sin categoría");
                                                            return rowGroupValue === groupValue;
                                                        })
                                                        .map((row) => {
                                                            const isSelected = row.getIsSelected();
                                                            return (
                                                                <TableRow
                                                                    key={row.id}
                                                                    data-state={isSelected && "selected"}
                                                                    className={cn(
                                                                        "group/row transition-colors hover:bg-transparent",
                                                                        onRowClick && "cursor-pointer"
                                                                    )}
                                                                    onClick={(e) => {
                                                                        const target = e.target as HTMLElement;
                                                                        const isInteractive = target.closest('button, input, [role="checkbox"], [role="menuitem"], [data-radix-collection-item]');
                                                                        if (!isInteractive) {
                                                                            onRowClick?.(row.original);
                                                                        }
                                                                    }}
                                                                >
                                                                    {row.getVisibleCells().map((cell) => {
                                                                        const isFill = (cell.column.columnDef.meta as any)?.fillWidth;
                                                                        return (
                                                                            <TableCell
                                                                                key={cell.id}
                                                                                className={cn("px-4 py-3", isFill && "overflow-hidden max-w-0")}
                                                                                style={isFill ? { width: '100%' } : undefined}
                                                                            >
                                                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                                            </TableCell>
                                                                        );
                                                                    })}
                                                                </TableRow>
                                                            );
                                                        })
                                                    }
                                                </React.Fragment>
                                            );
                                        })
                                    ) : table.getRowModel().rows?.length ? (
                                        // NORMAL MODE: Render rows without grouping
                                        table.getRowModel().rows.map((row) => {
                                            const isSelected = row.getIsSelected();

                                            return (
                                                <TableRow
                                                    key={row.id}
                                                    data-state={isSelected && "selected"}
                                                    className={cn(
                                                        "group/row transition-colors",
                                                        onRowClick && "cursor-pointer"
                                                    )}
                                                    onClick={(e) => {
                                                        const target = e.target as HTMLElement;
                                                        const isInteractive = target.closest('button, input, [role="checkbox"], [role="menuitem"], [data-radix-collection-item]');
                                                        if (!isInteractive) {
                                                            onRowClick?.(row.original);
                                                        }
                                                    }}
                                                >
                                                    {row.getVisibleCells().map((cell) => {
                                                        const isFill = (cell.column.columnDef.meta as any)?.fillWidth;
                                                        return (
                                                            <TableCell
                                                                key={cell.id}
                                                                className={cn("px-4 py-3", isFill && "overflow-hidden max-w-0")}
                                                                style={isFill ? { width: '100%' } : undefined}
                                                            >
                                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                            </TableCell>
                                                        );
                                                    })}
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={columns.length} className="h-32 text-center">
                                                <div className="w-full flex flex-col items-center justify-center py-8 text-muted-foreground">
                                                    <p className="font-medium">No hay resultados</p>
                                                    <p className="text-sm mt-1">Intenta ajustar los filtros.</p>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="mt-4"
                                                        onClick={() => {
                                                            table.resetColumnFilters();
                                                            setGlobalFilter("");
                                                            onClearFilters?.();
                                                        }}
                                                    >
                                                        <X className="mr-2 h-4 w-4" />
                                                        Limpiar filtros
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </UiTable>
                        </div>
                        {/* Show More — inside card when toolbar is embedded */}
                        {embeddedToolbar && showPagination && !isLoading && table.getCanNextPage() && (
                            <div className="border-t border-border/50 px-4 py-3 flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                    Mostrando {table.getRowModel().rows.length} de {table.getFilteredRowModel().rows.length}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs h-7 text-muted-foreground hover:text-foreground"
                                    onClick={() => table.setPageSize(table.getState().pagination.pageSize + 100)}
                                >
                                    Mostrar más
                                </Button>
                            </div>
                        )}
                    </Card>
                )
            )}

            {/* Show More — outside card (legacy, when no embedded toolbar) */}
            {
                !embeddedToolbar && showPagination && !isLoading && table.getCanNextPage() && (
                    <div className="flex items-center justify-between px-2">
                        <span className="text-xs text-muted-foreground">
                            Mostrando {table.getRowModel().rows.length} de {table.getFilteredRowModel().rows.length}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 text-muted-foreground hover:text-foreground"
                            onClick={() => table.setPageSize(table.getState().pagination.pageSize + 100)}
                        >
                            Mostrar más
                        </Button>
                    </div>
                )
            }
        </div>
    );
}
