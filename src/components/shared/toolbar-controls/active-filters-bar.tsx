"use client"

import * as React from "react"
import { X, Plus, Search as SearchIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { UseTableFiltersReturn } from "@/hooks/use-table-filters"

// ============================================================================
// ACTIVE FILTERS BAR — Linear-style second toolbar row
// ============================================================================
// Shows active filter pills when any filter is applied.
// Each pill can be individually dismissed. Has "+" to add filters,
// "Limpiar" to clear all, and optional "Guardar vista" to save as view.
//
// Usage:
//   <ActiveFiltersBar
//     filters={filters}
//     addFilterSlot={<FilterPopover filters={filters} />}
//     onSaveView={() => handleCreateView("Vista 1")}
//   />
// ============================================================================

export interface ActiveFiltersBarProps {
    /** Direct return from useTableFilters hook */
    filters: UseTableFiltersReturn
    /** Slot for the add-filter button (typically a FilterPopover) */
    addFilterSlot?: React.ReactNode
    /** Callback to create a saved view from current filters */
    onSaveView?: () => void
}

export function ActiveFiltersBar({
    filters,
    addFilterSlot,
    onSaveView,
}: ActiveFiltersBarProps) {
    const {
        searchQuery,
        setSearchQuery,
        dateRange,
        setDateRange,
        facetValues,
        facetConfigs,
        clearFacet,
        clearAll,
        hasActiveFilters,
    } = filters

    // Don't render if no active filters
    if (!hasActiveFilters) return null

    // Build pills
    const pills: React.ReactNode[] = []

    // 1. Search pill
    if (searchQuery) {
        pills.push(
            <FilterPill
                key="search"
                icon={<SearchIcon className="h-3 w-3" />}
                label={`"${searchQuery}"`}
                onRemove={() => setSearchQuery("")}
            />
        )
    }

    // 2. Facet pills
    for (const config of facetConfigs) {
        const values = facetValues[config.key]
        if (!values || values.size === 0) continue

        // Map values to their labels
        const labels = Array.from(values).map(v => {
            const opt = config.options.find(o => o.value === v)
            return opt?.label || v
        })

        pills.push(
            <FilterPill
                key={`facet-${config.key}`}
                label={`${config.title}: ${labels.join(", ")}`}
                icon={config.icon ? <config.icon className="h-3 w-3" /> : undefined}
                onRemove={() => clearFacet(config.key)}
            />
        )
    }

    // 3. Date range pill
    if (dateRange?.from || dateRange?.to) {
        const fromStr = dateRange.from
            ? format(dateRange.from, "d MMM", { locale: es })
            : "..."
        const toStr = dateRange.to
            ? format(dateRange.to, "d MMM", { locale: es })
            : "..."
        const label = dateRange.from && dateRange.to
            ? `${fromStr} — ${toStr}`
            : dateRange.from
                ? `Desde ${fromStr}`
                : `Hasta ${toStr}`

        pills.push(
            <FilterPill
                key="date-range"
                label={label}
                onRemove={() => setDateRange(undefined)}
            />
        )
    }

    if (pills.length === 0) return null

    return (
        <div
            className={cn(
                "flex items-center gap-1.5 px-3 py-1.5",
                "border-t border-border/30",
                "animate-in slide-in-from-top-1 duration-150"
            )}
        >
            {/* Filter pills + add button */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0 flex-wrap">
                {pills}
                {addFilterSlot}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                    Limpiar
                </Button>
                {onSaveView && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onSaveView}
                        className="h-6 px-2 text-xs text-primary hover:text-primary"
                    >
                        Guardar vista
                    </Button>
                )}
            </div>
        </div>
    )
}

// ─── Filter Pill ─────────────────────────────────────────

interface FilterPillProps {
    icon?: React.ReactNode
    label: string
    onRemove: () => void
}

function FilterPill({ icon, label, onRemove }: FilterPillProps) {
    return (
        <div
            className={cn(
                "inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md",
                "bg-muted/80 text-xs text-foreground/80",
                "border border-border/30",
                "transition-colors hover:bg-muted"
            )}
        >
            {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
            <span className="truncate max-w-[200px]">{label}</span>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    onRemove()
                }}
                className="ml-0.5 p-0.5 rounded-sm text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors"
            >
                <X className="h-3 w-3" />
            </button>
        </div>
    )
}
