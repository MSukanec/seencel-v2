"use client"

import * as React from "react"
import { Check, ListFilter, CalendarDays, X, ChevronRight, Search } from "lucide-react"
import { DateRange } from "react-day-picker"
import { es } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import type { UseTableFiltersReturn } from "@/hooks/use-table-filters"

// ============================================================================
// FILTER POPOVER — Linear-style unified filter + search button
// ============================================================================
// Consumes useTableFilters return directly. No manual mapping needed.
//
// Usage:
//   const filters = useTableFilters({ facets: [...], enableDateRange: true });
//   <FilterPopover filters={filters} searchPlaceholder="Buscar..." />
// ============================================================================

// ─── Types ───────────────────────────────────────────────

export interface FilterPopoverProps {
    /** Direct return from useTableFilters hook */
    filters: UseTableFiltersReturn
    /** Placeholder for integrated search */
    searchPlaceholder?: string
    /** Custom trigger label */
    label?: string
    /** Additional className */
    className?: string
}

// ─── Sub-Panel: Facet Options ────────────────────────────

function FacetSubPanel({
    title,
    options,
    selectedValues,
    onToggle,
    onClear,
}: {
    title: string
    options: { label: string; value: string }[]
    selectedValues: Set<string>
    onToggle: (value: string) => void
    onClear: () => void
}) {
    // Deduplicate by label, group values, sort alphabetically
    const uniqueOptions = React.useMemo(() => {
        const map = new Map<string, string[]>()
        for (const opt of options) {
            const existing = map.get(opt.label)
            if (existing) {
                existing.push(opt.value)
            } else {
                map.set(opt.label, [opt.value])
            }
        }
        return Array.from(map.entries())
            .map(([label, values]) => ({ label, values }))
            .sort((a, b) => a.label.localeCompare(b.label, "es"))
    }, [options])

    const handleToggle = (values: string[]) => {
        // Toggle all values that share this label together
        for (const v of values) {
            onToggle(v)
        }
    }

    return (
        <Command className="focus:ring-0 focus-visible:ring-0 outline-none">
            <CommandInput
                placeholder={`Buscar ${title.toLowerCase()}...`}
                autoFocus={false}
                className="border-none ring-0 focus:ring-0 focus-visible:ring-0 h-9"
            />
            <CommandList className="max-h-[300px]">
                <CommandEmpty>Sin resultados.</CommandEmpty>
                <CommandGroup>
                    {uniqueOptions.map((option) => {
                        const isSelected = option.values.some(v => selectedValues.has(v))
                        return (
                            <CommandItem
                                key={option.label}
                                onSelect={() => handleToggle(option.values)}
                                className="cursor-pointer"
                            >
                                <div
                                    className={cn(
                                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary/30 transition-all duration-150",
                                        isSelected
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "opacity-50 [&_svg]:invisible"
                                    )}
                                >
                                    <Check className={cn(
                                        "h-3 w-3 transition-transform duration-150",
                                        isSelected ? "scale-100" : "scale-0"
                                    )} />
                                </div>
                                <span>{option.label}</span>
                            </CommandItem>
                        )
                    })}
                </CommandGroup>
                {selectedValues.size > 0 && (
                    <>
                        <CommandSeparator className="bg-border/50" />
                        <CommandGroup>
                            <CommandItem
                                onSelect={onClear}
                                className="justify-center text-center cursor-pointer text-muted-foreground hover:text-destructive"
                            >
                                Limpiar
                            </CommandItem>
                        </CommandGroup>
                    </>
                )}
            </CommandList>
        </Command>
    )
}

// ─── Sub-Panel: Date Range ───────────────────────────────

function DateSubPanel({
    dateRange,
    onChange,
}: {
    dateRange?: { from?: Date; to?: Date }
    onChange: (range: { from?: Date; to?: Date } | undefined) => void
}) {
    return (
        <div>
            <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={{ from: dateRange?.from, to: dateRange?.to }}
                onSelect={(range: DateRange | undefined) => {
                    onChange(range ? { from: range.from, to: range.to } : undefined)
                }}
                numberOfMonths={2}
                locale={es}
                className="rounded-md"
            />
            {(dateRange?.from || dateRange?.to) && (
                <div className="border-t border-border/50 p-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-muted-foreground hover:text-destructive"
                        onClick={() => onChange(undefined)}
                    >
                        Limpiar fechas
                    </Button>
                </div>
            )}
        </div>
    )
}

// ─── Main Component ──────────────────────────────────────

export function FilterPopover({
    filters,
    searchPlaceholder = "Buscar...",
    label = "Filtrar",
    className,
}: FilterPopoverProps) {
    const [open, setOpen] = React.useState(false)
    const [hoveredKey, setHoveredKey] = React.useState<string | null>(null)
    const hoverTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

    // Build filter categories from hook data (automatic)
    const categories = React.useMemo(() => {
        const items: {
            key: string
            label: string
            icon?: React.ComponentType<{ className?: string }>
            type: "facet" | "date-range"
            options?: { label: string; value: string }[]
        }[] = []

        // Date range (if enabled)
        if (filters.enableDateRange) {
            items.push({
                key: "_dateRange",
                label: "Fechas",
                icon: CalendarDays,
                type: "date-range",
            })
        }

        // Facets (from configs)
        for (const facet of filters.facetConfigs) {
            items.push({
                key: facet.key,
                label: facet.title,
                icon: facet.icon,
                type: "facet",
                options: facet.options,
            })
        }

        return items
    }, [filters.facetConfigs, filters.enableDateRange])

    // Count total active filters
    const activeCount = React.useMemo(() => {
        let count = 0
        for (const set of Object.values(filters.facetValues)) {
            count += set.size
        }
        if (filters.dateRange?.from || filters.dateRange?.to) count++
        return count
    }, [filters.facetValues, filters.dateRange])

    // Reset hover when popover closes
    React.useEffect(() => {
        if (!open) setHoveredKey(null)
    }, [open])

    // Cleanup timeout on unmount
    React.useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
        }
    }, [])

    const handleMouseEnter = (key: string) => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
        setHoveredKey(key)
    }

    const handleMouseLeave = () => {
        hoverTimeoutRef.current = setTimeout(() => {
            setHoveredKey(null)
        }, 200)
    }

    const handleSubPanelEnter = () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    }

    const getCountForCategory = (key: string, type: string) => {
        if (type === "date-range") {
            return (filters.dateRange?.from || filters.dateRange?.to) ? 1 : 0
        }
        return filters.facetValues[key]?.size || 0
    }

    const hoveredCategory = hoveredKey ? categories.find(c => c.key === hoveredKey) : null

    // ─── Render ──────────────────────────────────────────

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-8 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors",
                        filters.hasActiveFilters && "text-foreground",
                        className
                    )}
                >
                    <ListFilter className="h-4 w-4" />
                    <span>{label}</span>
                    {activeCount > 0 && (
                        <Badge
                            variant="secondary"
                            className="rounded-full px-1.5 py-0 text-[10px] font-medium bg-primary/15 text-primary min-w-[18px] flex items-center justify-center"
                        >
                            {activeCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="p-0 w-[240px] bg-popover/95 backdrop-blur-xl border-border/80 shadow-xl overflow-visible"
                align="start"
            >
                <div className="relative" onMouseLeave={handleMouseLeave}>
                    {/* ── Filter categories ───────────────────────── */}
                    <div className="py-1">
                        {categories.map((cat) => {
                            const count = getCountForCategory(cat.key, cat.type)
                            const Icon = cat.icon
                            const isHovered = hoveredKey === cat.key

                            return (
                                <div
                                    key={cat.key}
                                    className={cn(
                                        "flex items-center justify-between px-3 py-1.5 cursor-pointer transition-colors text-sm",
                                        isHovered ? "bg-muted/80 text-foreground" : "text-foreground/80 hover:bg-muted/50"
                                    )}
                                    onMouseEnter={() => handleMouseEnter(cat.key)}
                                    onClick={() => setHoveredKey(cat.key)}
                                >
                                    <div className="flex items-center gap-2">
                                        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                                        <span>{cat.label}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {count > 0 && (
                                            <Badge
                                                variant="secondary"
                                                className="rounded-sm px-1.5 py-0 text-[10px] font-normal bg-primary/10 text-primary"
                                            >
                                                {count}
                                            </Badge>
                                        )}
                                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* ── Clear all ───────────────────────────────── */}
                    {filters.hasActiveFilters && (
                        <div className="border-t border-border/50 py-1">
                            <div
                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 cursor-pointer text-sm text-muted-foreground hover:text-destructive transition-colors"
                                onClick={() => {
                                    filters.clearAll()
                                    setOpen(false)
                                }}
                            >
                                <X className="h-3.5 w-3.5" />
                                <span>Limpiar todos los filtros</span>
                            </div>
                        </div>
                    )}

                    {/* ── Sub-panel (positioned to the right) ────── */}
                    {hoveredCategory && (
                        <div
                            className={cn(
                                "absolute left-full top-0 ml-1 bg-popover/95 backdrop-blur-xl border border-border/80 rounded-md shadow-xl z-50",
                                hoveredCategory.type === "facet" ? "w-[260px]" : "w-auto"
                            )}
                            onMouseEnter={handleSubPanelEnter}
                            onMouseLeave={handleMouseLeave}
                        >
                            {hoveredCategory.type === "facet" && hoveredCategory.options ? (
                                <FacetSubPanel
                                    title={hoveredCategory.label}
                                    options={hoveredCategory.options}
                                    selectedValues={filters.facetValues[hoveredCategory.key] || new Set()}
                                    onToggle={(val) => filters.toggleFacet(hoveredCategory.key, val)}
                                    onClear={() => filters.clearFacet(hoveredCategory.key)}
                                />
                            ) : hoveredCategory.type === "date-range" ? (
                                <DateSubPanel
                                    dateRange={filters.dateRange}
                                    onChange={filters.setDateRange}
                                />
                            ) : null}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
