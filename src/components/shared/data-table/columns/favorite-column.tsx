/**
 * Favorite Column Factory
 * Toggle column — star icon that toggles on click.
 *
 * States:
 * - Active: Star filled yellow (fill-yellow-500 text-yellow-500)
 * - Inactive: Star outline grey (text-muted-foreground/30)
 *
 * No header title — just a star icon header.
 * No popover needed — direct click toggles the value.
 */

"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Star } from "lucide-react";

import { DataTableColumnHeader } from "../data-table-column-header";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────

export interface FavoriteColumnOptions<TData> {
    /** Column accessor key for the boolean field (default: "is_favorite") */
    accessorKey?: string;
    /** Enable sorting (default: false) */
    enableSorting?: boolean;
    /** Column width in px (default: 50) */
    size?: number;
    /** Enable inline toggle (default: false) */
    editable?: boolean;
    /** Callback when favorite toggles (required if editable). Receives the new boolean value. */
    onUpdate?: (row: TData, newValue: boolean) => Promise<void> | void;
}

// ─── Toggle Cell ─────────────────────────────────────────

function FavoriteToggleCell<TData>({
    row,
    accessorKey,
    isFavorite,
    onUpdate,
}: {
    row: TData;
    accessorKey: string;
    isFavorite: boolean;
    onUpdate: (row: TData, newValue: boolean) => Promise<void> | void;
}) {
    const [loading, setLoading] = React.useState(false);

    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (loading) return;
        setLoading(true);
        try {
            await onUpdate(row, !isFavorite);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            className={cn(
                "flex items-center justify-center rounded-md p-1 transition-all cursor-pointer",
                "hover:bg-muted/50",
                loading && "opacity-50 pointer-events-none",
            )}
            onClick={handleClick}
        >
            <Star
                className={cn(
                    "h-4 w-4 transition-colors",
                    isFavorite
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-muted-foreground/30 hover:text-muted-foreground/60"
                )}
            />
        </button>
    );
}

// ─── Factory ─────────────────────────────────────────────

export function createFavoriteColumn<TData>(
    options: FavoriteColumnOptions<TData> = {}
): ColumnDef<TData, any> {
    const {
        accessorKey = "is_favorite",
        enableSorting = false,
        size = 50,
        editable = false,
        onUpdate,
    } = options;

    return {
        accessorKey,
        header: () => (
            <div className="flex justify-center">
                <Star className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
        ),
        cell: ({ row }) => {
            const isFavorite = !!(row.original as any)[accessorKey];

            if (editable && onUpdate) {
                return (
                    <FavoriteToggleCell
                        row={row.original}
                        accessorKey={accessorKey}
                        isFavorite={isFavorite}
                        onUpdate={onUpdate}
                    />
                );
            }

            // Read-only
            if (!isFavorite) return null;
            return (
                <div className="flex justify-center">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                </div>
            );
        },
        enableSorting,
        size,
        enableHiding: false,
    };
}
