/**
 * Exchange Rate Column Factory
 * Standard 19.9 - Reusable Exchange Rate Column
 *
 * Renders a compact column showing exchange/conversion rate.
 * Shows "—" when rate is 1 (same currency).
 * Supports inline editing via click-to-input.
 * Font: mono, muted, small. Aligned right.
 */

"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../data-table-column-header";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────

export interface ExchangeRateColumnOptions<TData> {
    /** Column accessor key (default: "exchange_rate") */
    accessorKey?: string;
    /** Column header title (default: "TC") */
    title?: string;
    /** Enable sorting (default: false) */
    enableSorting?: boolean;
    /** Column width in px (default: 80) */
    size?: number;
    /** Minimum fraction digits for display (default: 2) */
    minDecimals?: number;
    /** Maximum fraction digits for display (default: 2) */
    maxDecimals?: number;
    /** Enable inline editing (default: false) */
    editable?: boolean;
    /** Callback when rate changes (required if editable) */
    onUpdate?: (row: TData, newValue: number) => Promise<void> | void;
}

// ─── Editable Exchange Rate Cell ─────────────────────────

function EditableExchangeRateCell<TData>({
    row,
    accessorKey,
    minDecimals,
    maxDecimals,
    onUpdate,
}: {
    row: TData;
    accessorKey: string;
    minDecimals: number;
    maxDecimals: number;
    onUpdate: (row: TData, newValue: number) => Promise<void> | void;
}) {
    const rate = Number((row as any)[accessorKey]) || 1;
    const [isEditing, setIsEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState("");
    const inputRef = React.useRef<HTMLInputElement>(null);

    const formattedRate = rate.toLocaleString('es-AR', {
        minimumFractionDigits: minDecimals,
        maximumFractionDigits: maxDecimals,
    });

    const handleStartEditing = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditValue(rate.toString());
        setIsEditing(true);
        setTimeout(() => inputRef.current?.select(), 10);
    };

    const handleSave = () => {
        setIsEditing(false);
        const parsed = parseFloat(editValue.replace(/\./g, '').replace(',', '.'));
        if (!isNaN(parsed) && parsed > 0 && parsed !== rate) {
            onUpdate(row, parsed);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSave();
        }
        if (e.key === "Escape") {
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                <input
                    ref={inputRef}
                    type="text"
                    inputMode="decimal"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSave}
                    className={cn(
                        "w-20 h-7 px-2 text-xs font-mono text-right bg-background border border-border rounded-md",
                        "focus:outline-none focus:ring-1 focus:ring-ring",
                    )}
                />
            </div>
        );
    }

    // Show "—" for rate of 1 (same currency, no conversion)
    if (rate === 1) {
        return (
            <div className="text-right">
                <button
                    className={cn(
                        "cursor-pointer rounded-md px-1.5 py-0.5 -mx-1.5 transition-all",
                        "border border-transparent hover:border-dashed hover:border-border hover:bg-[#2a2b2d]",
                        "text-xs text-muted-foreground/40"
                    )}
                    onClick={handleStartEditing}
                >
                    —
                </button>
            </div>
        );
    }

    return (
        <div className="text-right">
            <button
                className={cn(
                    "cursor-pointer rounded-md px-1.5 py-0.5 -mx-1.5 transition-all",
                    "border border-transparent hover:border-dashed hover:border-border hover:bg-[#2a2b2d]",
                    "text-xs text-muted-foreground font-mono"
                )}
                onClick={handleStartEditing}
            >
                {formattedRate}
            </button>
        </div>
    );
}

// ─── Factory ─────────────────────────────────────────────

export function createExchangeRateColumn<TData>(
    options: ExchangeRateColumnOptions<TData> = {}
): ColumnDef<TData, any> {
    const {
        accessorKey = "exchange_rate",
        title = "TC",
        enableSorting = false,
        size = 80,
        minDecimals = 2,
        maxDecimals = 2,
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
            const rate = Number((row.original as any)[accessorKey]) || 1;

            // Editable mode
            if (editable && onUpdate) {
                return (
                    <EditableExchangeRateCell
                        row={row.original}
                        accessorKey={accessorKey}
                        minDecimals={minDecimals}
                        maxDecimals={maxDecimals}
                        onUpdate={onUpdate}
                    />
                );
            }

            // Read-only: show "—" for rate of 1
            if (rate === 1) {
                return (
                    <div className="text-right">
                        <span className="text-xs text-muted-foreground/40">—</span>
                    </div>
                );
            }

            return (
                <div className="text-right">
                    <span className="text-xs text-muted-foreground font-mono">
                        {rate.toLocaleString('es-AR', {
                            minimumFractionDigits: minDecimals,
                            maximumFractionDigits: maxDecimals,
                        })}
                    </span>
                </div>
            );
        },
        enableSorting,
        size,
    };
}
