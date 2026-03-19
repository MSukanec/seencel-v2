"use client"

import * as React from "react"
import { SlidersHorizontal } from "lucide-react"
import { Table } from "@tanstack/react-table"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"

// ============================================================================
// DISPLAY BUTTON — Unified display popover (Linear-style)
// ============================================================================
// Combines view mode switching + mode-specific options in a single popover.
//
// Features:
//   1. View mode selector (Table, Cards, Board) — segmented control at top
//   2. Mode-specific options below (e.g., column toggles for Table mode)
//
// Usage:
//   <ToolbarDisplay
//     viewMode="table"
//     onViewModeChange={setViewMode}
//     viewModeOptions={[
//       { value: "cards", icon: LayoutGrid, label: "Tarjetas" },
//       { value: "table", icon: Table2, label: "Tabla" },
//     ]}
//     table={table}  // optional, for column toggles when in table mode
//   />
// ============================================================================

// Map of column IDs to human-readable Spanish labels
const COLUMN_LABELS: Record<string, string> = {
    payment_date: "Fecha",
    movement_type: "Tipo",
    project_name: "Proyecto",
    concept_name: "Descripción",
    wallet_name: "Billetera",
    amount: "Monto",
    functional_amount: "Monto funcional",
    status: "Estado",
    contact_name: "Contacto",
    category_name: "Categoría",
    notes: "Notas",
    reference: "Referencia",
    created_at: "Creación",
    creator_name: "Creador",
}

export interface ViewModeOption {
    value: string
    icon: React.ComponentType<{ className?: string }>
    label: string
}

export interface ToolbarDisplayProps<TData = unknown> {
    /** Current view mode */
    viewMode?: string
    /** Callback when view mode changes */
    onViewModeChange?: (mode: string) => void
    /** Available view modes (segmented control) */
    viewModeOptions?: ViewModeOption[]
    /** TanStack Table instance — enables column visibility toggles in table mode */
    table?: Table<TData>
    /** Custom label for the button */
    label?: string
    /** Additional className */
    className?: string
}

export function ToolbarDisplay<TData>({
    viewMode,
    onViewModeChange,
    viewModeOptions = [],
    table,
    label = "Display",
    className,
}: ToolbarDisplayProps<TData>) {
    // Column visibility (only in table mode or when table is provided)
    const columns = table?.getAllColumns().filter(
        (column) => typeof column.accessorFn !== "undefined" && column.getCanHide()
    ) ?? []

    const hiddenCount = columns.filter((column) => !column.getIsVisible()).length
    const hasViewModes = viewModeOptions.length > 1
    const isTableMode = viewMode === "table" || viewMode === "list"
    const showColumnToggles = table && columns.length > 0 && isTableMode

    // Determine if button should show active indicator
    const isActive = hiddenCount > 0

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-8 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors",
                        isActive && "text-foreground",
                        className
                    )}
                >
                    <SlidersHorizontal className="h-4 w-4" />
                    <span>{label}</span>
                    {isActive && (
                        <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="p-0 w-[260px] bg-popover/95 backdrop-blur-xl border-border/80 shadow-xl"
                align="end"
            >
                {/* View Mode Selector — segmented control */}
                {hasViewModes && (
                    <div className="p-3 border-b border-border/50">
                        <div
                            className={cn(
                                "inline-flex items-center gap-1 p-1 rounded-lg w-full",
                                "bg-black/15 border border-white/[0.04]",
                                "shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.25),inset_0_0.5px_1px_rgba(0,0,0,0.15)]",
                            )}
                        >
                            {viewModeOptions.map((option) => {
                                const isSelected = viewMode === option.value
                                const Icon = option.icon

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => onViewModeChange?.(option.value)}
                                        className={cn(
                                            "inline-flex items-center justify-center gap-1.5 px-2.5 h-7 text-xs rounded-md transition-all flex-1",
                                            isSelected
                                                ? "bg-[var(--background)] text-foreground font-medium shadow-[0_1px_3px_rgba(0,0,0,0.25),0_1px_1px_rgba(0,0,0,0.15)] border border-white/[0.06]"
                                                : "text-muted-foreground hover:text-foreground cursor-pointer"
                                        )}
                                    >
                                        <Icon className="h-3.5 w-3.5 shrink-0" />
                                        <span>{option.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Column Toggles — shown when in table mode and table is provided */}
                {showColumnToggles && (
                    <>
                        <div className="px-3 py-2 border-b border-border/50">
                            <p className="text-xs font-medium text-muted-foreground">Columnas visibles</p>
                        </div>
                        <div className="py-1 max-h-[300px] overflow-y-auto">
                            {columns.map((column) => {
                                const columnLabel = COLUMN_LABELS[column.id] || column.id.replace(/_/g, " ")
                                return (
                                    <div
                                        key={column.id}
                                        className="flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => column.toggleVisibility()}
                                    >
                                        <span className="text-sm capitalize">{columnLabel}</span>
                                        <Switch
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                            className="scale-75"
                                        />
                                    </div>
                                )
                            })}
                        </div>

                        {/* Show all button when columns are hidden */}
                        {hiddenCount > 0 && (
                            <div className="border-t border-border/50 py-1">
                                <div
                                    className="flex items-center justify-center px-3 py-1.5 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={() => {
                                        columns.forEach(col => col.toggleVisibility(true))
                                    }}
                                >
                                    Mostrar todas
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Placeholder for future mode-specific options */}
                {!showColumnToggles && (
                    <div className="px-3 py-4 text-center">
                        <p className="text-xs text-muted-foreground">
                            Sin opciones adicionales
                        </p>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}
