"use client";

import { Table } from "@tanstack/react-table";
import { Search, X } from "lucide-react";
import * as React from "react";
import { DataTableFacetedFilter } from "@/components/shared/data-table/data-table-faceted-filter";
import { DataTableBulkActions } from "@/components/shared/data-table/data-table-bulk-actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "@/components/shared/data-table/data-table-view-options";
import { cn } from "@/lib/utils";

export interface ToolbarProps<TData> {
    // Generic Mode
    searchQuery?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;

    // Slots
    filterContent?: React.ReactNode;
    viewOptions?: React.ReactNode;

    // Data Table Mode (Legacy/Auto-wired)
    table?: Table<TData>;
    globalFilter?: string;
    setGlobalFilter?: (value: string) => void;
    facetedFilters?: {
        columnId: string;
        title: string;
        options: {
            label: string;
            value: string;
            icon?: React.ComponentType<{ className?: string }>;
        }[];
    }[];

    // Common
    children?: React.ReactNode; // Right side actions
    leftActions?: React.ReactNode; // Left side actions (before search)
    bulkActions?: React.ReactNode;
    className?: string;
}

export function Toolbar<TData>({
    table,
    globalFilter,
    setGlobalFilter,
    searchQuery,
    onSearchChange,
    searchPlaceholder = "Buscar...",
    children,
    leftActions,
    facetedFilters,
    bulkActions,
    filterContent,
    viewOptions,
    className,
}: ToolbarProps<TData>) {
    // Resolve search state (Table vs Generic)
    const searchValue = globalFilter ?? searchQuery ?? "";
    const onSearch = setGlobalFilter ?? onSearchChange ?? (() => { });

    const isFiltered = searchValue.length > 0;

    // Selection mode only applies if table is present
    const isSelectionMode = table ? table.getFilteredSelectedRowModel().rows.length > 0 : false;

    if (isSelectionMode && bulkActions && table) {
        return (
            <DataTableBulkActions table={table}>
                {bulkActions}
            </DataTableBulkActions>
        );
    }

    return (
        <div className={cn("flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", className)}>
            {/* Left side: Actions + Search + Filters */}
            <div className="flex flex-1 items-center gap-2 overflow-x-auto no-scrollbar mask-linear-fade max-w-full">
                {leftActions}

                {/* Global Search */}
                <div className="relative w-full sm:w-64 lg:w-80 shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onChange={(e) => onSearch(e.target.value)}
                        className="pl-9 pr-8 h-9"
                    />
                    {isFiltered && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                            onClick={() => onSearch("")}
                        >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Limpiar búsqueda</span>
                        </Button>
                    )}
                </div>

                {/* Table Faceted Filters */}
                {table && facetedFilters?.map((filter) => (
                    table.getColumn(filter.columnId) && (
                        <DataTableFacetedFilter
                            key={filter.columnId}
                            column={table.getColumn(filter.columnId)}
                            title={filter.title}
                            options={filter.options}
                        />
                    )
                ))}

                {/* Generic Filter Content */}
                {filterContent}

                {/* Filter indicator (Only checks search for now if table missing) */}
                {isFiltered && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            onSearch("");
                            table?.resetColumnFilters();
                        }}
                        className="h-8 px-2 lg:px-3"
                    >
                        Limpiar filtros
                        <X className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Right side: Actions + View Options */}
            <div className="flex items-center gap-2 shrink-0">
                {table ? <DataTableViewOptions table={table} /> : viewOptions}
                {children}
            </div>
        </div>
    );
}
