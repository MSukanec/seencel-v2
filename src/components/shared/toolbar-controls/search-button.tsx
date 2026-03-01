"use client"

import * as React from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { UseTableFiltersReturn } from "@/hooks/use-table-filters"

// ============================================================================
// SEARCH BUTTON — Linear-style inline search toggle
// ============================================================================
// Visually identical to FilterPopover: ghost button that expands into an input.
// Consumes useTableFilters return directly.
//
// Usage:
//   const filters = useTableFilters({ ... });
//   <SearchButton filters={filters} placeholder="Buscar movimientos..." />
// ============================================================================

export interface SearchButtonProps {
    /** Direct return from useTableFilters hook */
    filters: UseTableFiltersReturn
    /** Placeholder text */
    placeholder?: string
    /** Button label */
    label?: string
    /** Additional className */
    className?: string
}

export function SearchButton({
    filters,
    placeholder = "Buscar...",
    label = "Buscar",
    className,
}: SearchButtonProps) {
    const [expanded, setExpanded] = React.useState(false)
    const inputRef = React.useRef<HTMLInputElement>(null)

    // Auto-expand if there's already a search query
    React.useEffect(() => {
        if (filters.searchQuery && !expanded) {
            setExpanded(true)
        }
    }, [filters.searchQuery, expanded])

    // Focus input when expanding
    React.useEffect(() => {
        if (expanded) {
            // Small delay to allow animation
            const timeout = setTimeout(() => inputRef.current?.focus(), 50)
            return () => clearTimeout(timeout)
        }
    }, [expanded])

    const handleCollapse = () => {
        if (!filters.searchQuery) {
            setExpanded(false)
        }
    }

    const handleClear = () => {
        filters.setSearchQuery("")
        setExpanded(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            handleClear()
        }
    }

    // ─── Collapsed: just icon button ─────────────────────
    if (!expanded) {
        return (
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(true)}
                className={cn(
                    "h-8 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors",
                    filters.searchQuery && "text-foreground",
                    className
                )}
            >
                <Search className="h-4 w-4" />
                <span>{label}</span>
            </Button>
        )
    }

    // ─── Expanded: inline input ──────────────────────────
    return (
        <div
            className={cn(
                "flex items-center gap-1.5 h-8 rounded-md px-2",
                "bg-muted/50 border border-border/50",
                "transition-all duration-150",
                className
            )}
        >
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
                ref={inputRef}
                type="text"
                value={filters.searchQuery}
                onChange={(e) => filters.setSearchQuery(e.target.value)}
                onBlur={handleCollapse}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 w-[160px]"
            />
            {filters.searchQuery && (
                <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleClear}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                >
                    <X className="h-3 w-3" />
                </button>
            )}
        </div>
    )
}
