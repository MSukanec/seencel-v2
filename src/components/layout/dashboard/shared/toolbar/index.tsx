"use client";

import { Table } from "@tanstack/react-table";
import { Search, X, Plus, MoreHorizontal } from "lucide-react";
import * as React from "react";
import { createPortal } from "react-dom";
import { DataTableFacetedFilter } from "./toolbar-faceted-filter";
import { FacetedFilter } from "./toolbar-faceted-filter"; // Generic filter for non-table use
import { ToolbarButton, ToolbarSplitButton, ToolbarAction } from "./toolbar-button";
import { ToolbarSearch } from "./toolbar-search";

// Note: Removed DataTableViewOptions as requested by user.
import { DataTableBulkActions } from "@/components/shared/data-table/data-table-bulk-actions";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ToolbarProps<TData> {
    // Generic Mode
    searchQuery?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;

    // Slots
    filterContent?: React.ReactNode;

    // Actions - New Prop for consolidated actions
    /** List of unified actions. If >1, they are grouped into a split button or menu. */
    actions?: ToolbarAction[];

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
    /** @deprecated Use `actions` prop instead for split-button support */
    children?: React.ReactNode;
    leftActions?: React.ReactNode; // Left side actions (before search)
    bulkActions?: React.ReactNode;
    className?: string;

    // Mobile-specific
    // mobileActionIcon -> Derived from first action icon if not provided
    // mobileActionClick -> Derived from first action onClick if not provided
    mobileShowSearch?: boolean;
    mobileShowFilters?: boolean;
    portalToHeader?: boolean;
}

export function Toolbar<TData>({
    table,
    globalFilter,
    setGlobalFilter,
    searchQuery,
    onSearchChange,
    searchPlaceholder = "Buscar...",
    children, // Legacy action support
    actions,  // New unified actions support
    leftActions,
    facetedFilters,
    bulkActions,
    filterContent,
    className,
    mobileShowSearch = true,
    mobileShowFilters = true,
    portalToHeader = false,
}: ToolbarProps<TData>) {
    const [mobileSearchOpen, setMobileSearchOpen] = React.useState(false);
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

    // Resolve Main Action for Mobile
    // If 'actions' provided, use the first one as primary. If 'children', we can't easily extract logic.
    const primaryAction = actions && actions.length > 0 ? actions[0] : null;
    const hasMultipleActions = actions && actions.length > 1;

    if (isSelectionMode && bulkActions && table) {
        return (
            <DataTableBulkActions table={table}>
                {bulkActions}
            </DataTableBulkActions>
        );
    }

    // Desktop Toolbar Content
    const desktopToolbar = (
        <div className={cn("hidden md:flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", className)}>
            {/* Left side: Actions + Filters + Search */}
            <div className="flex flex-1 items-center gap-2 overflow-x-auto no-scrollbar mask-linear-fade max-w-full">
                {leftActions}

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

                {/* Global Search - Moved to Right as requested */}
                <ToolbarSearch
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={onSearch}
                    className="shrink-0"
                />

                {/* Filter indicator */}
                {isFiltered && (
                    <ToolbarButton
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
                    </ToolbarButton>
                )}
            </div>

            {/* Right side: Actions */}
            <div className="flex items-center gap-2 shrink-0">
                {/* 
                   Strategy:
                   1. If 'actions' prop is provided, use ToolbarSplitButton.
                   2. If 'children' provided, render it (legacy).
                */}
                {actions && actions.length > 0 ? (
                    <ToolbarSplitButton
                        mainAction={actions[0]}
                        secondaryActions={actions.slice(1)}
                    />
                ) : (
                    children
                )}
            </div>
        </div>
    );

    // Mobile Action Button Renderer
    const renderMobileActionButton = () => {
        // Option 1: Legacy Children (or singular Mobile handler prop which we are deprecating in favor of 'actions')
        if (!actions && children) return children; // Fallback, though likely rendered weirdly in mobile portal

        // Option 2: No actions
        if (!primaryAction) return null;

        const Icon = primaryAction.icon ? primaryAction.icon : Plus;

        return (
            <>
                {hasMultipleActions ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className={cn(
                                    "pointer-events-auto",
                                    "w-14 h-14 rounded-full",
                                    "bg-primary text-primary-foreground",
                                    "flex items-center justify-center",
                                    "shadow-lg shadow-primary/30",
                                    "active:scale-95 transition-transform"
                                )}
                            >
                                <Icon className="h-6 w-6" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="top" align="end" className="w-56 mb-2">
                            {/* Render MAIN action as the first item too, or keep it separate? 
                                 User said: "el boton '+' abriria un popover si hay mas de una opciion disponible"
                                 Usually clicking FAB does main, long press does menu? 
                                 Or clicking FAB opens menu with ALL options?
                                 User said: "el boton '+' abriria un popover" -> implies menu trigger.
                             */}
                            <DropdownMenuItem onClick={primaryAction.onClick} className="font-medium">
                                {primaryAction.icon && <primaryAction.icon className="mr-2 h-4 w-4" />}
                                {primaryAction.label}
                            </DropdownMenuItem>
                            {actions.slice(1).map((action, idx) => (
                                <DropdownMenuItem key={idx} onClick={action.onClick}>
                                    {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                                    {action.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <button
                        onClick={primaryAction.onClick}
                        className={cn(
                            "pointer-events-auto",
                            "w-14 h-14 rounded-full",
                            "bg-primary text-primary-foreground",
                            "flex items-center justify-center",
                            "shadow-lg shadow-primary/30",
                            "active:scale-95 transition-transform"
                        )}
                    >
                        <Icon className="h-6 w-6" />
                    </button>
                )}
            </>
        )
    }

    return (
        <>
            {/* DESKTOP TOOLBAR - Rendered via Portal or Inline */}
            {mounted && portalToHeader && document.getElementById('toolbar-portal-root')
                ? createPortal(desktopToolbar, document.getElementById('toolbar-portal-root')!)
                : desktopToolbar
            }
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
                                                        <ToolbarButton
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                                            onClick={() => onSearch("")}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </ToolbarButton>
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
                                                <ToolbarButton
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
                                                </ToolbarButton>
                                            )}
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            )}

                            {/* Spacer if no left button */}
                            {!mobileShowSearch && !(mobileShowFilters && hasFilters) && <div />}

                            {/* Right Button: Primary Action (Context Aware) */}
                            {renderMobileActionButton()}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
