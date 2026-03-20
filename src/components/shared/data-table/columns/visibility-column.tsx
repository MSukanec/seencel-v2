/**
 * Visibility Column Factory
 * Reusable Client Visibility Column for DataTables
 *
 * Renders Eye/EyeOff icon + label with semantic colors (amount-positive/amount-negative).
 * Supports inline editing via Popover + VisibilityPopoverContent.
 */

"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    VisibilityPopoverContent,
    VisibilityBadge,
    DEFAULT_VISIBILITY_OPTIONS,
    type VisibilityOption,
    type VisibilityLevel,
} from "@/components/shared/popovers/visibility-popover-content";
import { DataTableColumnHeader } from "../data-table-column-header";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────

export interface VisibilityColumnOptions<TData> {
    /** Column accessor key for the boolean field (default: "is_public") */
    accessorKey?: string;
    /** Column header title (default: "Visibilidad") */
    title?: string;
    /** Visibility options (default: Visible cliente / Solo interno) */
    options?: VisibilityOption[];
    /** Enable sorting (default: false) */
    enableSorting?: boolean;
    /** Column width in px (default: 140) */
    size?: number;
    /** Enable inline editing (default: false) */
    editable?: boolean;
    /** Callback when visibility changes (required if editable). Receives the new boolean value. */
    onUpdate?: (row: TData, newValue: boolean) => Promise<void> | void;
}

// ─── Editable Visibility Cell ────────────────────────────

function EditableVisibilityCell<TData>({
    row,
    accessorKey,
    options,
    onUpdate,
}: {
    row: TData;
    accessorKey: string;
    options: VisibilityOption[];
    onUpdate: (row: TData, newValue: boolean) => Promise<void> | void;
}) {
    const [open, setOpen] = React.useState(false);
    const isPublic = !!(row as any)[accessorKey];
    const currentLevel: VisibilityLevel = isPublic ? "public" : "internal";

    const handleSelect = (value: VisibilityLevel) => {
        setOpen(false);
        const newIsPublic = value === "public";
        if (newIsPublic !== isPublic) {
            onUpdate(row, newIsPublic);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "flex items-center cursor-pointer rounded-md px-1 py-0.5 -mx-1 transition-all",
                        "border border-transparent hover:border-dashed hover:border-border hover:bg-[#2a2b2d]",
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    <VisibilityBadge isPublic={isPublic} />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0" align="start" onClick={(e) => e.stopPropagation()}>
                <VisibilityPopoverContent
                    options={options}
                    currentValue={currentLevel}
                    onSelect={handleSelect}
                />
            </PopoverContent>
        </Popover>
    );
}

// ─── Factory ─────────────────────────────────────────────

export function createVisibilityColumn<TData>(
    options: VisibilityColumnOptions<TData> = {}
): ColumnDef<TData, any> {
    const {
        accessorKey = "is_public",
        title = "Visibilidad",
        options: visibilityOptions = DEFAULT_VISIBILITY_OPTIONS,
        enableSorting = false,
        size = 140,
        editable = false,
        onUpdate,
    } = options;

    return {
        accessorKey,
        header: ({ column }) => <DataTableColumnHeader column={column} title={title} />,
        cell: ({ row }) => {
            const isPublic = !!(row.original as any)[accessorKey];

            if (editable && onUpdate) {
                return (
                    <EditableVisibilityCell
                        row={row.original}
                        accessorKey={accessorKey}
                        options={visibilityOptions}
                        onUpdate={onUpdate}
                    />
                );
            }

            // Read-only
            return <VisibilityBadge isPublic={isPublic} />;
        },
        enableSorting,
        size,
    };
}
