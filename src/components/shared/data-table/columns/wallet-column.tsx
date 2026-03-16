/**
 * Wallet Column Factory
 * Standard 19.7 - Reusable Wallet/Account Column
 *
 * Renders a compact column with Wallet icon + name.
 * Auto-sizes to content (NOT fillWidth like text columns).
 * Optionally supports inline editing via Popover + shared WalletPopoverContent.
 */

"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Wallet } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DataTableColumnHeader } from "../data-table-column-header";
import { WalletPopoverContent } from "@/components/shared/popovers";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────

export interface WalletOption {
    /** Wallet ID or value stored in DB */
    value: string;
    /** Display name (e.g. "Efectivo", "Mercado Pago") */
    label: string;
}

export interface WalletColumnOptions<TData> {
    /** Column accessor key (default: "wallet_name") */
    accessorKey?: string;
    /** Column header title (default: "Billetera") */
    title?: string;
    /** Enable sorting (default: true) */
    enableSorting?: boolean;
    /** Column width in px */
    size?: number;
    /** Enable inline editing (default: false) */
    editable?: boolean;
    /** Available wallet options (required if editable) */
    walletOptions?: WalletOption[];
    /** Callback when wallet changes (required if editable) */
    onUpdate?: (row: TData, newValue: string) => Promise<void> | void;
}

// ─── Editable Wallet Cell ────────────────────────────────

function EditableWalletCell<TData>({
    row,
    accessorKey,
    currentLabel,
    walletOptions,
    onUpdate,
}: {
    row: TData;
    accessorKey: string;
    currentLabel: string;
    walletOptions: WalletOption[];
    onUpdate: (row: TData, newValue: string) => Promise<void> | void;
}) {
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const currentValue = (row as any)[accessorKey] as string;

    const handleSelect = (value: string) => {
        setOpen(false);
        if (value !== currentValue) {
            onUpdate(row, value);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "flex items-center gap-2 cursor-pointer rounded-md px-1.5 py-1 -mx-1.5 transition-all",
                        "border border-transparent hover:border-dashed hover:border-border hover:bg-[#2a2b2d]",
                        loading && "opacity-50 pointer-events-none"
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    <Wallet className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium text-foreground whitespace-nowrap">{currentLabel}</span>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0" align="start" onClick={(e) => e.stopPropagation()}>
                <WalletPopoverContent
                    options={walletOptions}
                    currentValue={currentValue}
                    onSelect={handleSelect}
                    onOpenChange={setOpen}
                />
            </PopoverContent>
        </Popover>
    );
}

// ─── Factory ─────────────────────────────────────────────

export function createWalletColumn<TData>(
    options: WalletColumnOptions<TData> = {}
): ColumnDef<TData, any> {
    const {
        accessorKey = "wallet_name",
        title = "Billetera",
        enableSorting = true,
        size,
        editable = false,
        walletOptions = [],
        onUpdate,
    } = options;

    return {
        accessorKey,
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={title} />
        ),
        cell: ({ row }) => {
            const value = row.getValue(accessorKey) as string | null | undefined;
            const displayLabel = value || "Sin billetera";

            if (editable && onUpdate && walletOptions.length > 0) {
                return (
                    <EditableWalletCell
                        row={row.original}
                        accessorKey={accessorKey}
                        currentLabel={displayLabel}
                        walletOptions={walletOptions}
                        onUpdate={onUpdate}
                    />
                );
            }

            // Read-only display
            return (
                <div className="flex items-center gap-2 px-1.5 whitespace-nowrap">
                    <Wallet className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium text-foreground">{displayLabel}</span>
                </div>
            );
        },
        enableSorting,
        ...(size ? { size } : {}),
        // Context menu metadata for right-click menus
        ...(editable && onUpdate && walletOptions.length > 0 ? {
            meta: {
                contextMenu: {
                    label: title,
                    icon: Wallet,
                    options: walletOptions.map(o => ({
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
