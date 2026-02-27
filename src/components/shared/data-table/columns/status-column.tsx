/**
 * Status Column Factory
 * Standard 19.4 - Reusable Status Badge Column
 * 
 * Creates a standardized status column with Badge component.
 * Uses semantic CSS variables from globals.css for consistent theming:
 * - semantic-positive → confirmed/completed/paid
 * - semantic-negative → rejected/cancelled  
 * - semantic-warning  → pending
 * - semantic-neutral  → void/unknown
 */

"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "../data-table-column-header";

// ─── Types ───────────────────────────────────────────────

export type StatusVariant = "positive" | "negative" | "warning" | "neutral";

export interface StatusOption {
    /** Value stored in DB (e.g. "confirmed") */
    value: string;
    /** Display label (e.g. "Confirmado") */
    label: string;
    /** Semantic variant for color */
    variant: StatusVariant;
}

export interface StatusColumnOptions<TData> {
    /** Column accessor key (default: "status") */
    accessorKey?: string;
    /** Column header title (default: "Estado") */
    title?: string;
    /** Map of status values to display config */
    options: StatusOption[];
    /** Enable sorting (default: false) */
    enableSorting?: boolean;
    /** Enable filtering (default: true) */
    enableFiltering?: boolean;
}

// ─── Variant → CSS classes (using semantic variables) ────
// All classes reference globals.css semantic variables:
// text-amount-positive → var(--semantic-positive)
// bg-amount-positive/10 → color-mix(var(--semantic-positive) 10%)
// etc.

const VARIANT_CLASSES: Record<StatusVariant, string> = {
    positive: "bg-amount-positive/10 text-amount-positive border-amount-positive/20",
    negative: "bg-amount-negative/10 text-amount-negative border-amount-negative/20",
    warning: "bg-semantic-warning/10 text-semantic-warning border-semantic-warning/20",
    neutral: "bg-muted text-muted-foreground border-border",
};

// ─── Factory ─────────────────────────────────────────────

/**
 * Creates a status badge column with semantic colors.
 * 
 * Usage:
 * ```tsx
 * createStatusColumn({
 *     options: [
 *         { value: "confirmed", label: "Confirmado", variant: "positive" },
 *         { value: "pending",   label: "Pendiente",  variant: "warning" },
 *         { value: "rejected",  label: "Rechazado",  variant: "negative" },
 *         { value: "void",      label: "Anulado",    variant: "neutral" },
 *     ],
 * })
 * ```
 */
export function createStatusColumn<TData>(
    options: StatusColumnOptions<TData>
): ColumnDef<TData, any> {
    const {
        accessorKey = "status",
        title = "Estado",
        options: statusOptions,
        enableSorting = false,
        enableFiltering = true,
    } = options;

    // Build a lookup map for O(1) access
    const optionsMap = new Map(
        statusOptions.map(opt => [opt.value, opt])
    );

    return {
        accessorKey,
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={title} />
        ),
        cell: ({ row }) => {
            const status = (row.original as any)[accessorKey] as string;
            const config = optionsMap.get(status);

            // Fallback for unknown status values
            const label = config?.label || status;
            const variantClass = config
                ? VARIANT_CLASSES[config.variant]
                : VARIANT_CLASSES.neutral;

            return (
                <Badge variant="outline" className={variantClass}>
                    {label}
                </Badge>
            );
        },
        enableSorting,
        ...(enableFiltering ? {
            filterFn: (row: any, id: string, value: string[]) => {
                return value.includes(row.getValue(id));
            },
        } : {}),
    };
}
