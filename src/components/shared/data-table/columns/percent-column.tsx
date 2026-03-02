/**
 * Percent Column Factory
 * Standard 19.5 - Reusable Percent Column
 * 
 * Renders a right-aligned percentage value with monospace font.
 * Supports optional color coding and configurable decimal places.
 */

"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../data-table-column-header";
import { cn } from "@/lib/utils";

export interface PercentColumnOptions {
    /** Column accessor key */
    accessorKey: string;
    /** Column header title (default: "Porcentaje") */
    title?: string;
    /** Decimal places (default: 1) */
    decimals?: number;
    /** Suffix (default: "%") */
    suffix?: string;
    /** Value shown when null/undefined (default: "N/A") */
    emptyValue?: string;
    /** Enable sorting (default: true) */
    enableSorting?: boolean;
    /** Column width in px (default: auto) */
    size?: number;
    /** Color mode: 'none' = no color, 'positive-negative' = green/red based on value */
    colorMode?: "none" | "positive-negative";
}

export function createPercentColumn<TData>(
    options: PercentColumnOptions
): ColumnDef<TData, any> {
    const {
        accessorKey,
        title = "Porcentaje",
        decimals = 1,
        suffix = "%",
        emptyValue = "N/A",
        enableSorting = true,
        size,
        colorMode = "none",
    } = options;

    return {
        accessorKey,
        header: ({ column }) => <DataTableColumnHeader column={column} title={title} className="justify-end" />,
        cell: ({ row }) => {
            const value = row.getValue(accessorKey);
            if (value == null) {
                return (
                    <div className="flex justify-end">
                        <span className="text-muted-foreground text-sm">{emptyValue}</span>
                    </div>
                );
            }

            const numValue = Number(value);
            const formatted = `${numValue.toFixed(decimals)}${suffix}`;

            return (
                <div className="flex justify-end">
                    <span className={cn(
                        "font-mono tabular-nums text-sm",
                        colorMode === "positive-negative" && numValue > 0 && "text-amount-positive",
                        colorMode === "positive-negative" && numValue < 0 && "text-amount-negative",
                    )}>
                        {formatted}
                    </span>
                </div>
            );
        },
        enableSorting,
        ...(size && { size }),
    };
}
