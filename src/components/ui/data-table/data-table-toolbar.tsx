"use client";

import { Table } from "@tanstack/react-table";
import { Search, X } from "lucide-react";
import * as React from "react";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { DataTableBulkActions } from "./data-table-bulk-actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";

interface DataTableToolbarProps<TData> {
    table: Table<TData>;
    globalFilter: string;
    setGlobalFilter: (value: string) => void;
    searchPlaceholder?: string;
    children?: React.ReactNode;
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
}

export function DataTableToolbar<TData>({
    table,
    globalFilter,
    setGlobalFilter,
    searchPlaceholder = "Buscar...",
    children,
    leftActions,
    facetedFilters,
    bulkActions,
}: DataTableToolbarProps<TData> & { bulkActions?: React.ReactNode }) {
    const isFiltered = globalFilter.length > 0;
    const isSelectionMode = table.getFilteredSelectedRowModel().rows.length > 0;

    if (isSelectionMode && bulkActions) {
        return (
            <DataTableBulkActions table={table}>
                {bulkActions}
            </DataTableBulkActions>
        );
    }

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Left side: Search + Filters */}
            <div className="flex flex-1 items-center gap-2">
                {leftActions}
                {/* Global Search */}
                <div className="relative w-full sm:w-64 lg:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={searchPlaceholder}
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="pl-9 pr-8 h-9"
                    />
                    {isFiltered && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                            onClick={() => setGlobalFilter("")}
                        >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Limpiar búsqueda</span>
                        </Button>
                    )}
                </div>

                {facetedFilters?.map((filter) => (
                    table.getColumn(filter.columnId) && (
                        <DataTableFacetedFilter
                            key={filter.columnId}
                            column={table.getColumn(filter.columnId)}
                            title={filter.title}
                            options={filter.options}
                        />
                    )
                ))}

                {/* Filter indicator */}
                {isFiltered && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setGlobalFilter("");
                            table.resetColumnFilters();
                        }}
                        className="h-8 px-2 lg:px-3"
                    >
                        Limpiar filtros
                        <X className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Right side: Actions + View Options */}
            <div className="flex items-center gap-2">
                <DataTableViewOptions table={table} />
                {children}
            </div>
        </div>
    );
}
