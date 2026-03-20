/**
 * Price Column Factory
 * Standard 19.8 - Reusable Price Column
 *
 * Renders a price column with freshness semaphore dot:
 * - 🟢 Fresh (≤30d) — green, pulses
 * - 🟡 Aging (31-90d) — amber, static
 * - 🔴 Stale (>90d) — red, pulses
 *
 * Supports inline editing via Popover with PricePopoverContent.
 */

"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../data-table-column-header";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    PricePopoverContent,
    FreshnessDot,
    getFreshness,
    FRESHNESS_COLORS,
} from "@/components/shared/popovers/price-popover-content";
import { useMoney } from "@/hooks/use-money";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────

export interface PriceColumnOptions<TData> {
    /** Column accessor key for the price value (default: "current_price") */
    accessorKey?: string;
    /** Column header title (default: "Precio") */
    title?: string;
    /** Key for currency symbol in row data (default: "currency_symbol") */
    currencyKey?: string;
    /** Key for valid_from date in row data (default: "price_valid_from") */
    validFromKey?: string;
    /** Key for unit symbol in row data (default: "unit_symbol") */
    unitSymbolKey?: string;
    /** Key for resource name (for popover header) (default: "name") */
    nameKey?: string;
    /** Enable inline editing (default: false) */
    editable?: boolean;
    /** Callback when price is saved (required if editable) */
    onUpdate?: (row: TData, newPrice: number) => Promise<void>;
    /** Column width in px (default: 150) */
    size?: number;
    /** Enable sorting (default: true) */
    enableSorting?: boolean;
    /** Show "Sin precio" when null (default: true) */
    showEmpty?: boolean;
}

// ─── Editable Price Cell ────────────────────────────────

function EditablePriceCell<TData>({
    row,
    options,
}: {
    row: { original: TData };
    options: PriceColumnOptions<TData>;
}) {
    const money = useMoney();
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const {
        accessorKey = "current_price",
        currencyKey = "currency_symbol",
        validFromKey = "price_valid_from",
        unitSymbolKey = "unit_symbol",
        nameKey = "name",
        onUpdate,
    } = options;

    const amount = Number((row.original as any)[accessorKey]) || 0;
    const currencySymbol = (row.original as any)[currencyKey] || money.config.functionalCurrencySymbol;
    const validFrom = (row.original as any)[validFromKey] as string | null | undefined;
    const unitSymbol = (row.original as any)[unitSymbolKey] as string | null | undefined;
    const resourceName = (row.original as any)[nameKey] as string | undefined;
    const hasPrice = amount > 0;

    const { level } = getFreshness(validFrom);
    const colors = FRESHNESS_COLORS[level];

    const formattedPrice = hasPrice
        ? amount.toLocaleString("es-AR", {
              minimumFractionDigits: money.config.decimalPlaces,
              maximumFractionDigits: money.config.decimalPlaces,
          })
        : null;

    const handleSave = async (newPrice: number) => {
        if (!onUpdate) return;
        setLoading(true);
        try {
            await onUpdate(row.original, newPrice);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "flex items-center gap-1.5 cursor-pointer rounded-md px-1.5 py-0.5 -mx-1.5 transition-all text-right ml-auto",
                        "border border-transparent hover:border-dashed hover:border-border hover:bg-[#2a2b2d]",
                        loading && "opacity-50 pointer-events-none"
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    {hasPrice ? (
                        <>
                            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", colors.dot, colors.pulse)} />
                            <span className="text-sm font-medium whitespace-nowrap">
                                {currencySymbol} {formattedPrice}
                            </span>
                        </>
                    ) : (
                        <span className="text-xs text-muted-foreground italic">Sin precio</span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
                <PricePopoverContent
                    currentPrice={amount}
                    currencySymbol={currencySymbol}
                    unitSymbol={unitSymbol}
                    priceValidFrom={validFrom}
                    resourceName={resourceName}
                    onSave={handleSave}
                    onOpenChange={setOpen}
                />
            </PopoverContent>
        </Popover>
    );
}

// ─── Read-Only Price Cell ───────────────────────────────

function ReadOnlyPriceCell<TData>({
    row,
    options,
}: {
    row: { original: TData };
    options: PriceColumnOptions<TData>;
}) {
    const money = useMoney();

    const {
        accessorKey = "current_price",
        currencyKey = "currency_symbol",
        validFromKey = "price_valid_from",
        showEmpty = true,
    } = options;

    const amount = Number((row.original as any)[accessorKey]) || 0;
    const currencySymbol = (row.original as any)[currencyKey] || money.config.functionalCurrencySymbol;
    const validFrom = (row.original as any)[validFromKey] as string | null | undefined;
    const hasPrice = amount > 0;

    if (!hasPrice && showEmpty) {
        return <span className="text-xs text-muted-foreground italic">Sin precio</span>;
    }

    if (!hasPrice) return null;

    const { level } = getFreshness(validFrom);
    const colors = FRESHNESS_COLORS[level];

    const formattedPrice = amount.toLocaleString("es-AR", {
        minimumFractionDigits: money.config.decimalPlaces,
        maximumFractionDigits: money.config.decimalPlaces,
    });

    return (
        <div className="flex items-center gap-1.5 justify-end">
            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", colors.dot, colors.pulse)} />
            <span className="text-sm font-medium whitespace-nowrap">
                {currencySymbol} {formattedPrice}
            </span>
        </div>
    );
}

// ─── Factory ─────────────────────────────────────────────

export function createPriceColumn<TData>(
    options: PriceColumnOptions<TData> = {}
): ColumnDef<TData, any> {
    const {
        accessorKey = "current_price",
        title = "Precio",
        enableSorting = true,
        size = 150,
        editable = false,
        onUpdate,
    } = options;

    return {
        accessorKey,
        header: ({ column }) => (
            <DataTableColumnHeader
                column={column}
                title={title}
                className="justify-end"
            />
        ),
        cell: ({ row }) => {
            if (editable && onUpdate) {
                return <EditablePriceCell row={row} options={options} />;
            }
            return <ReadOnlyPriceCell row={row} options={options} />;
        },
        enableSorting,
        size,
    };
}
