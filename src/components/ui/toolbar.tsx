"use client";

import { Table } from "@tanstack/react-table";
import { Search, X, Plus, Filter } from "lucide-react";
import * as React from "react";
import { createPortal } from "react-dom";
import { DataTableFacetedFilter } from "@/components/shared/data-table/data-table-faceted-filter";
import { DataTableBulkActions } from "@/components/shared/data-table/data-table-bulk-actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "@/components/shared/data-table/data-table-view-options";
import { cn } from "@/lib/utils";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

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
    children?: React.ReactNode; // Right side actions (main action button)
    leftActions?: React.ReactNode; // Left side actions (before search)
    bulkActions?: React.ReactNode;
    className?: string;

    // Mobile-specific
    /** Icon for the mobile primary action button (defaults to Plus) */
    mobileActionIcon?: React.ReactNode;
    /** Callback for mobile primary action (if not provided, renders children in a sheet) */
    mobileActionClick?: () => void;
    /** Whether to show search on mobile (opens in sheet) */
    mobileShowSearch?: boolean;
    /** Whether to show filters on mobile (opens in sheet) */
    mobileShowFilters?: boolean;
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
    mobileActionIcon,
    mobileActionClick,
    mobileShowSearch = true,
    mobileShowFilters = true,
}: ToolbarProps<TData>) {
    const [mobileSearchOpen, setMobileSearchOpen] = React.useState(false);
    const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);

    // Mount state for Portal (avoid SSR hydration issues)
    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Resolve search state (Table vs Generic)
    const searchValue = globalFilter ?? searchQuery ?? "";
    const onSearch = setGlobalFilter ?? onSearchChange ?? (() => { });

    const isFiltered = searchValue.length > 0;

    // Selection mode only applies if table is present
    const isSelectionMode = table ? table.getFilteredSelectedRowModel().rows.length > 0 : false;

    // Check if we have filters to show
    const hasFilters = filterContent || (facetedFilters && facetedFilters.length > 0);

    if (isSelectionMode && bulkActions && table) {
        return (
            <DataTableBulkActions table={table}>
                {bulkActions}
            </DataTableBulkActions>
        );
    }

    return (
        <>
            {/* ============================================ */}
            {/* DESKTOP TOOLBAR - Hidden on mobile */}
            {/* ============================================ */}
            <div className={cn("hidden md:flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", className)}>
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

                    {/* Filter indicator */}
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

            {/* ============================================ */}
            {/* MOBILE FLOATING ACTION BAR - iOS Style */}
            {/* Rendered via Portal to escape scroll containers */}
            {/* ============================================ */}
            {mounted && createPortal(
                <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
                    {/* Safe area padding for iPhone home indicator */}
                    <div className="pb-[env(safe-area-inset-bottom)]">
                        <div className="flex justify-between items-end px-6 py-4">
                            {/* Left Button: Search or Filters */}
                            {(mobileShowSearch || (mobileShowFilters && hasFilters)) && (
                                <Sheet open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
                                    <SheetTrigger asChild>
                                        <button
                                            className={cn(
                                                "pointer-events-auto",
                                                "w-14 h-14 rounded-full",
                                                "bg-background/80 backdrop-blur-xl",
                                                "border border-border/50",
                                                "flex items-center justify-center",
                                                "shadow-lg shadow-black/10",
                                                "active:scale-95 transition-transform",
                                                isFiltered && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                                            )}
                                        >
                                            <Search className="h-5 w-5 text-foreground" />
                                        </button>
                                    </SheetTrigger>
                                    <SheetContent side="bottom" className="rounded-t-3xl">
                                        <SheetHeader className="mb-4">
                                            <SheetTitle>Buscar y filtrar</SheetTitle>
                                        </SheetHeader>
                                        <div className="space-y-4">
                                            {/* Mobile Search Input */}
                                            {mobileShowSearch && (
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder={searchPlaceholder}
                                                        value={searchValue}
                                                        onChange={(e) => onSearch(e.target.value)}
                                                        className="pl-9 pr-8 h-12 text-base"
                                                        autoFocus
                                                    />
                                                    {isFiltered && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                                            onClick={() => onSearch("")}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            )}

                                            {/* Mobile Filters */}
                                            {mobileShowFilters && hasFilters && (
                                                <div className="space-y-3">
                                                    <p className="text-sm font-medium text-muted-foreground">Filtros</p>
                                                    <div className="flex flex-wrap gap-2">
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
                                                        {filterContent}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Clear filters button */}
                                            {isFiltered && (
                                                <Button
                                                    variant="outline"
                                                    className="w-full h-12"
                                                    onClick={() => {
                                                        onSearch("");
                                                        table?.resetColumnFilters();
                                                        setMobileSearchOpen(false);
                                                    }}
                                                >
                                                    Limpiar todo
                                                    <X className="ml-2 h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            )}

                            {/* Spacer if no left button */}
                            {!mobileShowSearch && !(mobileShowFilters && hasFilters) && <div />}

                            {/* Right Button: Primary Action */}
                            {(children || mobileActionClick) && (
                                <button
                                    onClick={mobileActionClick}
                                    className={cn(
                                        "pointer-events-auto",
                                        "w-14 h-14 rounded-full",
                                        "bg-primary text-primary-foreground",
                                        "flex items-center justify-center",
                                        "shadow-lg shadow-primary/30",
                                        "active:scale-95 transition-transform"
                                    )}
                                >
                                    {mobileActionIcon || <Plus className="h-6 w-6" />}
                                </button>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
