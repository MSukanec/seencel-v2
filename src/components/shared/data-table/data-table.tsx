"use client";

import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type Table,
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
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { DataTableSkeleton } from "./data-table-skeleton";
import { cn } from "@/lib/utils";
import { DataTableRowActions } from "./data-table-row-actions";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Paperclip, X, Trash2 } from "lucide-react";

import { ToolbarAction } from "@/components/layout/dashboard/shared/toolbar/toolbar-button";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    searchKey?: string;
    searchPlaceholder?: string;
    isLoading?: boolean;
    onRowClick?: (row: TData) => void;
    toolbar?: React.ReactNode | ((props: { table: Table<TData> }) => React.ReactNode);
    pageSize?: number;
    showPagination?: boolean;
    showToolbar?: boolean;
    stickyHeader?: boolean;
    leftActions?: React.ReactNode;
    facetedFilters?: {
        columnId: string;
        title: string;
        options: {
            label: string;
            value: string;
            icon?: React.ComponentType<{ className?: string }>;
        }[];
    }[];
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
    toolbarInHeader?: boolean;
    actions?: ToolbarAction[] | ((args: { table: Table<TData> }) => ToolbarAction[]);
    onClearFilters?: () => void;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    searchKey,
    searchPlaceholder = "Buscar...",
    isLoading = false,
    onRowClick,
    toolbar,
    emptyState,
    pageSize = 10,
    showPagination = true,
    showToolbar = false,  // DEPRECATED: Toolbar se maneja en la View con portalToHeader
    stickyHeader = true,
    leftActions,
    facetedFilters,
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
    toolbarInHeader = false,
    actions,
    onClearFilters,
}: DataTableProps<TData, TValue> & { meta?: any }) {
    const [sorting, setSorting] = React.useState<SortingState>(initialSorting || []);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});
    const [globalFilter, setGlobalFilter] = React.useState("");

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
                        className="translate-y-[2px]"
                    />
                ),
                cell: ({ row }) => (
                    <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                            checked={row.getIsSelected()}
                            onCheckedChange={(value) => row.toggleSelected(!!value)}
                            aria-label="Seleccionar fila"
                            className="translate-y-[2px]"
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
        columns: tableColumns, // Use memoized columns with selection
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

    const resolvedActions = React.useMemo(() => {
        if (typeof actions === 'function') {
            return actions({ table });
        }
        return actions;
    }, [actions, table]);

    return (
        <div className={cn("space-y-4", (data.length === 0 && emptyState) ? "h-full flex flex-col" : "")}>
            {/* Toolbar */}
            {showToolbar && (
                <div className={cn("transition-all", toolbarInHeader ? "contents" : "")}>
                    {/* If toolbarInHeader, we don't render the Card wrapper, or we let the Toolbar handle portal */}
                    {/* Actually, existing code wrapped it in Card. If portaling, we likely want to avoid the Card visual in the body */}
                    {toolbarInHeader ? (
                        <Toolbar
                            table={table}
                            portalToHeader={true}
                            globalFilter={globalFilter}
                            setGlobalFilter={setGlobalFilter}
                            searchPlaceholder={searchPlaceholder}
                            leftActions={leftActions}
                            facetedFilters={facetedFilters}
                            /* bulkActions now handled in Selection Header inside table, not here */
                            actions={resolvedActions}
                            children={
                                typeof toolbar === "function" ? toolbar({ table }) : toolbar
                            }
                        />
                    ) : (
                        <Card className="p-4">
                            <Toolbar
                                table={table}
                                globalFilter={globalFilter}
                                setGlobalFilter={setGlobalFilter}
                                searchPlaceholder={searchPlaceholder}
                                leftActions={leftActions}
                                facetedFilters={facetedFilters}
                                /* bulkActions now handled in Selection Header inside table, not here */
                                actions={resolvedActions}
                            >
                                {typeof toolbar === "function" ? toolbar({ table }) : toolbar}
                            </Toolbar>
                        </Card>
                    )}
                </div>
            )}

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
                                {/* Use standard empty state for No Results (Filtered) vs No Data */}
                                <Card className="flex flex-col items-center justify-center py-12 text-muted-foreground p-8">
                                    {/* ... SVG ... */}
                                    <p className="font-medium">No se encontraron resultados</p>
                                    <p className="text-sm mt-1">Intenta ajustar los filtros o la búsqueda</p>
                                </Card>
                            </div>
                        )}
                    </div>
                ) : (
                    <Card className="overflow-hidden">
                        <div className="relative w-full overflow-auto">
                            <UiTable>
                                { /* ... Header & Body ... */}
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
                                                                // Only hide overflow when NOT selecting and last column
                                                                !(isSelecting && isLast) && "overflow-hidden",
                                                                isFirst ? "px-4" : isLast ? "px-6" : "px-4"
                                                            )}
                                                            style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
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
                                                                        // Last column: anchor to right and let content extend left
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
                                                                        /* Checkbox in first column */
                                                                        <Checkbox
                                                                            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                                                                            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                                                                            aria-label="Seleccionar todo"
                                                                        />
                                                                    ) : index === 1 ? (
                                                                        /* Selection info in second column */
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
                                                                        /* Bulk actions in last column - positioned to extend left */
                                                                        <div className="flex items-center gap-2 whitespace-nowrap">
                                                                            {/* Default Delete Button (if onBulkDelete or onDelete exists) */}
                                                                            {(onBulkDelete || onDelete) && (
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2 whitespace-nowrap"
                                                                                    onClick={() => {
                                                                                        const selectedRows = table.getSelectedRowModel().rows.map(r => r.original);
                                                                                        if (onBulkDelete) {
                                                                                            // Use bulk delete handler (passes array + reset callback)
                                                                                            onBulkDelete(selectedRows, () => table.resetRowSelection());
                                                                                        } else if (onDelete && selectedRows.length === 1) {
                                                                                            // Fallback: single delete if only 1 row selected
                                                                                            onDelete(selectedRows[0]);
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                                                                                    Eliminar
                                                                                </Button>
                                                                            )}
                                                                            {/* Custom bulk actions */}
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
                                    ) : table.getRowModel().rows?.length ? (
                                        table.getRowModel().rows.map((row, rowIndex) => {
                                            const isLastRow = rowIndex === table.getRowModel().rows.length - 1;
                                            const isSelected = row.getIsSelected();

                                            return (
                                                <TableRow
                                                    key={row.id}
                                                    data-state={isSelected && "selected"}
                                                    className={cn(
                                                        "transition-colors",
                                                        onRowClick && "cursor-pointer",
                                                        isSelected && "bg-primary/5 border-l-2 border-l-primary"
                                                    )}
                                                    onClick={(e) => {
                                                        // Don't trigger row click if clicking on interactive elements
                                                        const target = e.target as HTMLElement;
                                                        const isInteractive = target.closest('button, input, [role="checkbox"], [role="menuitem"], [data-radix-collection-item]');
                                                        if (!isInteractive) {
                                                            onRowClick?.(row.original);
                                                        }
                                                    }}
                                                >
                                                    {row.getVisibleCells().map((cell) => (
                                                        <TableCell key={cell.id} className="px-4 py-3">
                                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        // Empty state for FILTERED results (No matches)
                                        <TableRow>
                                            <TableCell colSpan={columns.length} className="h-32 text-center">
                                                <div className="w-full flex flex-col items-center justify-center py-8 text-muted-foreground">
                                                    {/* Same SVG/Message for No Results */}
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
                    </Card>
                )
            )}

            {/* Pagination - only show when rows exceed pageSize */}
            {
                showPagination && !isLoading && table.getFilteredRowModel().rows.length > pageSize && (
                    <DataTablePagination table={table} />
                )
            }
        </div >
    );
}

