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
import { DataTableToolbar } from "./data-table-toolbar";
import { DataTableSkeleton } from "./data-table-skeleton";
import { cn } from "@/lib/utils";

import { Checkbox } from "@/components/ui/checkbox";

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
    showToolbar = true,
    stickyHeader = true,
    leftActions,
    facetedFilters,
    viewMode = "table",
    renderGridItem,
    gridClassName = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
    enableRowSelection = false,
    bulkActions,
    initialSorting,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>(initialSorting || []);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});
    const [globalFilter, setGlobalFilter] = React.useState("");

    const tableColumns = React.useMemo(() => {
        if (!enableRowSelection) return columns;

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

        return [selectionColumn, ...columns];
    }, [columns, enableRowSelection]);

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
        <div className="space-y-4">
            {/* Toolbar */}
            {showToolbar && (
                <Card className="p-4">
                    <DataTableToolbar
                        table={table}
                        globalFilter={globalFilter}
                        setGlobalFilter={setGlobalFilter}
                        searchPlaceholder={searchPlaceholder}
                        leftActions={leftActions}
                        facetedFilters={facetedFilters}
                        bulkActions={typeof bulkActions === "function" ? bulkActions({ table }) : bulkActions}
                    >
                        {typeof toolbar === "function" ? toolbar({ table }) : toolbar}
                    </DataTableToolbar>
                </Card>
            )}

            {/* Table Container */}
            {viewMode === "grid" && renderGridItem ? (
                <div className={gridClassName}>
                    {table.getRowModel().rows.map((row) => (
                        <div key={row.id}>
                            {renderGridItem(row.original)}
                        </div>
                    ))}
                    {table.getRowModel().rows.length === 0 && (
                        <div className="col-span-full">
                            {typeof emptyState === "function"
                                ? (emptyState as (props: { table: Table<TData> }) => React.ReactNode)({ table })
                                : (emptyState || (
                                    <Card className="flex flex-col items-center justify-center py-12 text-muted-foreground p-8">
                                        <svg
                                            className="h-12 w-12 mb-4 opacity-50"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                            />
                                        </svg>
                                        <p className="font-medium">No se encontraron resultados</p>
                                        <p className="text-sm mt-1">Intenta ajustar los filtros o la búsqueda</p>
                                    </Card>
                                ))}
                        </div>
                    )}
                </div>
            ) : (
                <Card className="overflow-hidden">
                    <div className="relative w-full overflow-auto">
                        <UiTable>
                            <TableHeader
                                className={cn(
                                    stickyHeader && "sticky top-0 z-10 bg-card/95 backdrop-blur-sm"
                                )}
                            >
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id} className="hover:bg-transparent border-b-2">
                                        {headerGroup.headers.map((header) => (
                                            <TableHead
                                                key={header.id}
                                                className="h-11 px-4 text-[11px] font-medium text-muted-foreground"
                                                style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(header.column.columnDef.header, header.getContext())}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <DataTableSkeleton columnCount={columns.length} rowCount={pageSize} />
                                ) : table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && "selected"}
                                            className={cn(
                                                "transition-colors",
                                                onRowClick && "cursor-pointer",
                                                row.getIsSelected() && "bg-primary/5 border-l-2 border-l-primary"
                                            )}
                                            onClick={() => onRowClick?.(row.original)}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id} className="px-4 py-3">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    // Empty state
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-32 text-center">
                                            {typeof emptyState === "function"
                                                ? (emptyState as (props: { table: Table<TData> }) => React.ReactNode)({ table })
                                                : (emptyState || (
                                                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                                        <svg
                                                            className="h-12 w-12 mb-4 opacity-50"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={1.5}
                                                                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                                            />
                                                        </svg>
                                                        <p className="font-medium">No hay datos</p>
                                                        <p className="text-sm mt-1">No se encontraron registros</p>
                                                    </div>
                                                ))}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </UiTable>
                    </div>
                </Card>
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
