/**
 * Currency Column Factory
 * Standard 19.8 - Reusable Currency Column
 *
 * Renders a compact column with CircleDollarSign icon + currency name.
 * The currency NAME is resolved from currencyOptions (not the raw DB value).
 * Optionally supports inline editing via Popover + shared CurrencyPopoverContent.
 */

"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { CircleDollarSign } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DataTableColumnHeader } from "../data-table-column-header";
import { CurrencyPopoverContent } from "@/components/shared/popovers";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────

export interface CurrencyOption {
    /** Currency code or ID stored in DB */
    value: string;
    /** Display name (e.g. "Peso Argentino ($)") */
    label: string;
    /** Currency symbol (e.g. "$", "US$") */
    symbol?: string;
}

export interface CurrencyColumnOptions<TData> {
    /** Column accessor key (default: "currency_code") */
    accessorKey?: string;
    /** Column header title (default: "Moneda") */
    title?: string;
    /** Enable sorting (default: true) */
    enableSorting?: boolean;
    /** Column width in px */
    size?: number;
    /** Enable inline editing (default: false) */
    editable?: boolean;
    /** Available currency options (required if editable) */
    currencyOptions?: CurrencyOption[];
    /** Callback when currency changes (required if editable) */
    onUpdate?: (row: TData, newValue: string) => Promise<void> | void;
}

// ─── Editable Currency Cell ──────────────────────────────

function EditableCurrencyCell<TData>({
    row,
    accessorKey,
    displayName,
    currencyOptions,
    onUpdate,
}: {
    row: TData;
    accessorKey: string;
    displayName: string;
    currencyOptions: CurrencyOption[];
    onUpdate: (row: TData, newValue: string) => Promise<void> | void;
}) {
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const currentValue = (row as any)[accessorKey] as string;

    const handleSelect = async (value: string) => {
        if (value === currentValue) {
            setOpen(false);
            return;
        }
        setLoading(true);
        try {
            await onUpdate(row, value);
        } finally {
            setLoading(false);
            setOpen(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "flex items-center gap-1.5 cursor-pointer rounded-md px-1.5 py-1 -mx-1.5 transition-all",
                        "border border-transparent hover:border-dashed hover:border-border hover:bg-[#2a2b2d]",
                        loading && "opacity-50 pointer-events-none"
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    <CircleDollarSign className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium text-foreground whitespace-nowrap">{displayName}</span>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0" align="start" onClick={(e) => e.stopPropagation()}>
                <CurrencyPopoverContent
                    options={currencyOptions}
                    currentValue={currentValue}
                    onSelect={handleSelect}
                    onOpenChange={setOpen}
                />
            </PopoverContent>
        </Popover>
    );
}

// ─── Factory ─────────────────────────────────────────────

export function createCurrencyColumn<TData>(
    options: CurrencyColumnOptions<TData> = {}
): ColumnDef<TData, any> {
    const {
        accessorKey = "currency_code",
        title = "Moneda",
        enableSorting = true,
        size,
        editable = false,
        currencyOptions = [],
        onUpdate,
    } = options;

    return {
        accessorKey,
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={title} />
        ),
        cell: ({ row }) => {
            const value = row.getValue(accessorKey) as string | null | undefined;

            // Resolve display name from options (show name, not code)
            const option = currencyOptions.find(o => o.value === value);
            const displayName = option
                ? (option.symbol ? `${option.symbol}` : option.label)
                : (value || "—");

            if (editable && onUpdate && currencyOptions.length > 0) {
                // For editable, show full name resolved from options
                const editableDisplayName = option?.label || value || "—";
                return (
                    <EditableCurrencyCell
                        row={row.original}
                        accessorKey={accessorKey}
                        displayName={editableDisplayName}
                        currencyOptions={currencyOptions}
                        onUpdate={onUpdate}
                    />
                );
            }

            // Read-only display
            const readOnlyDisplayName = option?.label || value || "—";
            return (
                <div className="flex items-center gap-1.5 px-1.5 whitespace-nowrap">
                    <CircleDollarSign className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium text-foreground">{readOnlyDisplayName}</span>
                </div>
            );
        },
        enableSorting,
        ...(size ? { size } : {}),
        // Context menu metadata for right-click menus
        ...(editable && onUpdate && currencyOptions.length > 0 ? {
            meta: {
                contextMenu: {
                    label: title,
                    icon: CircleDollarSign,
                    options: currencyOptions.map(o => ({
                        value: o.value,
                        label: o.label,
                    })),
                    currentValueKey: accessorKey,
                    onSelect: (row: TData, value: string) => onUpdate(row, value),
                },
            },
        } : {}),
    };
}
