"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import type { UseTableFiltersReturn } from "@/hooks/use-table-filters"
import { ToolbarSearch } from "./toolbar-search"
import { ToolbarFilter } from "./toolbar-filter"
import { ToolbarDisplay, type ViewModeOption } from "./toolbar-display"
import { ToolbarToggle, type ToolbarToggleOption } from "./toolbar-toggle"
import type { Table } from "@tanstack/react-table"

// ============================================================================
// TOOLBAR CARD — Standardized toolbar with built-in controls
// ============================================================================
// Controls (Search, Filter, Display) are ALWAYS rendered in the RIGHT slot
// in a fixed order: Search → Filter → Display.
//
// The view decides WHAT to enable, never WHERE things go.
//
// Usage (standard — recommended):
//   <ToolbarCard
//     filters={filters}
//     searchPlaceholder="Buscar movimientos..."
//     display={{ viewMode, onViewModeChange, viewModeOptions }}
//     left={<ViewsTabs ... />}
//     bottom={<ActiveFiltersBar ... />}
//   />
//
// Usage (minimal — only search):
//   <ToolbarCard filters={filters} searchPlaceholder="Buscar..." />
//
// Usage (legacy — manual right slot, backwards compatible):
//   <ToolbarCard right={<CustomContent />} />
// ============================================================================

export interface ToolbarCardDisplayConfig<TData = unknown> {
    /** Current view mode */
    viewMode: string
    /** Callback when view mode changes */
    onViewModeChange: (mode: string) => void
    /** Available view modes (segmented control) */
    viewModeOptions: ViewModeOption[]
    /** TanStack Table instance — enables column visibility toggles in table mode */
    table?: Table<TData>
}

export interface ToolbarCardToggleConfig {
    /** Current value */
    value: string
    /** Callback when value changes */
    onValueChange: (value: string) => void
    /** Available options */
    options: ToolbarToggleOption[]
}

export interface ToolbarCardProps<TData = unknown> {
    // ── Standard controls (rendered automatically in right slot) ──

    /** useTableFilters return → enables ToolbarSearch + ToolbarFilter */
    filters?: UseTableFiltersReturn
    /** Placeholder for the search input (default: "Buscar...") */
    searchPlaceholder?: string
    /** Display config → enables ToolbarDisplay */
    display?: ToolbarCardDisplayConfig<TData>

    // ── Slots ──

    /** Toggle config → enables ToolbarToggle in the very left slot */
    toggle?: ToolbarCardToggleConfig
    /** Left slot — ViewsTabs, ToolbarTabs, custom content */
    left?: React.ReactNode
    /** Right slot — ONLY for legacy/custom use. Ignored if `filters` is provided. */
    right?: React.ReactNode
    /** Bottom slot — ActiveFiltersBar, ViewEditorBar, etc. */
    bottom?: React.ReactNode
    /** Legacy: free-form children (renders as single flex row) */
    children?: React.ReactNode
    className?: string
}

export function ToolbarCard<TData = unknown>({
    filters,
    searchPlaceholder = "Buscar...",
    display,
    toggle,
    left,
    right,
    bottom,
    children,
    className,
}: ToolbarCardProps<TData>) {
    // Determine if using standardized controls
    const hasStandardControls = !!filters || !!display

    // Build the right slot content
    const rightContent = hasStandardControls ? (
        <>
            {filters && <ToolbarSearch filters={filters} placeholder={searchPlaceholder} />}
            {filters && filters.facetConfigs.length > 0 && <ToolbarFilter filters={filters} />}
            {display && (
                <ToolbarDisplay
                    viewMode={display.viewMode}
                    onViewModeChange={display.onViewModeChange}
                    viewModeOptions={display.viewModeOptions}
                    table={display.table}
                />
            )}
        </>
    ) : right

    // Slot-based layout (standard or left/right provided)
    if (toggle !== undefined || left !== undefined || rightContent !== undefined) {
        return (
            <Card
                variant="inset"
                className={cn(
                    "toolbar-inset shrink-0",
                    className
                )}
            >
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        {toggle && (
                            <ToolbarToggle
                                value={toggle.value}
                                onValueChange={toggle.onValueChange}
                                options={toggle.options}
                            />
                        )}
                        {left}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {rightContent}
                    </div>
                </div>
                {bottom}
            </Card>
        )
    }

    // Legacy: children-only mode (backwards compatible)
    return (
        <Card
            variant="inset"
            className={cn(
                "toolbar-inset flex items-center gap-2 shrink-0",
                className
            )}
        >
            {children}
        </Card>
    )
}
