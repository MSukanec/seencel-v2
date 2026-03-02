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
// DISPLAY BUTTON — Linear-style column visibility toggle
// ============================================================================
// Shows/hides DataTable columns via a popover with switches.
// Visually identical to FilterPopover and SearchButton.
//
// Usage:
//   <DisplayButton table={table} />
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

export interface DisplayButtonProps<TData> {
    /** TanStack Table instance */
    table: Table<TData>
    /** Custom label */
    label?: string
    /** Additional className */
    className?: string
}

export function DisplayButton<TData>({
    table,
    label = "Display",
    className,
}: DisplayButtonProps<TData>) {
    const columns = table.getAllColumns().filter(
        (column) => typeof column.accessorFn !== "undefined" && column.getCanHide()
    )

    const hiddenCount = columns.filter((column) => !column.getIsVisible()).length

    if (columns.length === 0) return null

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-8 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors",
                        hiddenCount > 0 && "text-foreground",
                        className
                    )}
                >
                    <SlidersHorizontal className="h-4 w-4" />
                    <span>{label}</span>
                    {hiddenCount > 0 && (
                        <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="p-0 w-[220px] bg-popover/95 backdrop-blur-xl border-border/80 shadow-xl"
                align="start"
            >
                {/* Header */}
                <div className="px-3 py-2 border-b border-border/50">
                    <p className="text-xs font-medium text-muted-foreground">Propiedades visibles</p>
                </div>

                {/* Column toggles */}
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
            </PopoverContent>
        </Popover>
    )
}
