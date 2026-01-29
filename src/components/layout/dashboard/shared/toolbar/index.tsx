"use client";

import { Table } from "@tanstack/react-table";
import { Search, X, Plus, MoreHorizontal, LayoutTemplate, Lock } from "lucide-react";
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
import { FeatureGuard } from "@/components/ui/feature-guard";

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

    mobileShowViewToggler?: boolean;
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

    mobileShowViewToggler = true,
    portalToHeader = false,
}: ToolbarProps<TData>) {
    const [mobileSearchOpen, setMobileSearchOpen] = React.useState(false);
    const [mobileViewOpen, setMobileViewOpen] = React.useState(false);
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
                   1. Render children first (e.g., custom toolbar buttons like CreateProjectButton)
                   2. Then render ToolbarSplitButton if 'actions' are provided
                   Both can coexist.
                */}
                {children}
                {actions && actions.length > 0 && (
                    <ToolbarSplitButton
                        mainAction={actions[0]}
                        secondaryActions={actions.slice(1)}
                    />
                )}
            </div>
        </div>
    );

    // Mobile Action Button Renderer
    const renderMobileActionButton = () => {
        // Option 1: Legacy Children - don't render anything in mobile if using legacy children
        if (!actions && children) return null;

        // Option 2: No actions
        if (!primaryAction) return null;

        const Icon = primaryAction.icon ? primaryAction.icon : Plus;
        const isLocked = primaryAction.featureGuard && !primaryAction.featureGuard.isEnabled;

        // FAB button component
        const FABButton = ({ locked, onClick }: { locked: boolean; onClick?: () => void }) => (
            <button
                onClick={onClick}
                className={cn(
                    "pointer-events-auto",
                    "w-14 h-14 rounded-full",
                    locked
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary text-primary-foreground",
                    "flex items-center justify-center",
                    locked
                        ? "shadow-lg shadow-black/10"
                        : "shadow-lg shadow-primary/30",
                    "active:scale-95 transition-transform",
                    "relative"
                )}
            >
                <Icon className="h-6 w-6" />
                {/* Lock badge overlay for locked state */}
                {locked && (
                    <div
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow-md"
                        style={{ backgroundColor: 'var(--plan-pro)' }}
                    >
                        <Lock className="h-3 w-3 text-white" />
                    </div>
                )}
            </button>
        );

        // For single action (not multiple)
        if (!hasMultipleActions) {
            if (isLocked) {
                // Locked: Show HoverCard with upgrade prompt on hover/click
                return (
                    <Sheet>
                        <SheetTrigger asChild>
                            <FABButton locked={true} />
                        </SheetTrigger>
                        <SheetContent side="bottom" className="rounded-t-3xl outline-none">
                            <SheetHeader className="mb-4 text-left px-6 pt-6">
                                <SheetTitle className="flex items-center gap-2">
                                    <Lock className="h-5 w-5" style={{ color: 'var(--plan-pro)' }} />
                                    Función Bloqueada
                                </SheetTitle>
                            </SheetHeader>
                            <div className="px-6 pb-8 space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    {primaryAction.featureGuard?.customMessage ||
                                        `"${primaryAction.featureGuard?.featureName}" requiere el plan ${primaryAction.featureGuard?.requiredPlan || "PRO"}.`}
                                </p>
                                <ToolbarButton
                                    className="w-full h-12"
                                    onClick={() => window.location.href = '/organization/billing/plans'}
                                >
                                    Actualizar a {primaryAction.featureGuard?.requiredPlan || "PRO"}
                                </ToolbarButton>
                            </div>
                        </SheetContent>
                    </Sheet>
                );
            }
            // Not locked: Normal FAB
            return <FABButton locked={false} onClick={primaryAction.onClick} />;
        }

        // Multiple actions: Dropdown menu
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <FABButton locked={!!isLocked} />
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="end" className="w-56 mb-2">
                    <DropdownMenuItem
                        onClick={isLocked ? undefined : primaryAction.onClick}
                        className={cn("font-medium", isLocked && "opacity-50")}
                        disabled={isLocked}
                    >
                        {primaryAction.icon && <primaryAction.icon className="mr-2 h-4 w-4" />}
                        {primaryAction.label}
                        {isLocked && <Lock className="ml-auto h-3 w-3" style={{ color: 'var(--plan-pro)' }} />}
                    </DropdownMenuItem>
                    {actions.slice(1).map((action, idx) => {
                        const actionLocked = action.featureGuard && !action.featureGuard.isEnabled;
                        return (
                            <DropdownMenuItem
                                key={idx}
                                onClick={actionLocked ? undefined : action.onClick}
                                className={actionLocked ? "opacity-50" : ""}
                                disabled={actionLocked}
                            >
                                {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                                {action.label}
                                {actionLocked && <Lock className="ml-auto h-3 w-3" style={{ color: 'var(--plan-pro)' }} />}
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        );
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
                            {/* Left Side: View Toggler + Search/Filters */}
                            <div className="flex items-end gap-3">
                                {/* View Toggler (New) */}
                                {mobileShowViewToggler && leftActions && (
                                    <Sheet open={mobileViewOpen} onOpenChange={setMobileViewOpen}>
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
                                                    mobileViewOpen && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                                                )}
                                            >
                                                <LayoutTemplate className="h-5 w-5 text-foreground" />
                                            </button>
                                        </SheetTrigger>
                                        <SheetContent side="bottom" className="rounded-t-3xl outline-none">
                                            <SheetHeader className="mb-4 text-left px-6 pt-6">
                                                <SheetTitle className="flex items-center gap-2">
                                                    <LayoutTemplate className="h-5 w-5 text-primary" />
                                                    Cambiar Vista
                                                </SheetTitle>
                                            </SheetHeader>
                                            <div className="px-6 pb-8">
                                                {/* Scale up the view toggle buttons for mobile touch */}
                                                <div className="flex justify-center w-full [&_button]:h-12 [&_button]:px-6 [&_button]:text-base">
                                                    {leftActions}
                                                </div>
                                            </div>
                                        </SheetContent>
                                    </Sheet>
                                )}

                                {/* Search or Filters */}
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
                                        <SheetContent side="bottom" className="rounded-t-3xl outline-none">
                                            <SheetHeader className="mb-4 px-6 pt-6 text-left">
                                                <SheetTitle>Buscar y filtrar</SheetTitle>
                                            </SheetHeader>
                                            <div className="space-y-4 px-6 pb-8">
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
                            </div>

                            {/* Spacer if no left buttons */}
                            {!mobileShowSearch && !(mobileShowFilters && hasFilters) && !mobileShowViewToggler && <div />}

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
