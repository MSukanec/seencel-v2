/**
 * Unit Column Factory
 * Standard 19.7 - Reusable Unit Column
 *
 * Renders a compact column with Ruler icon + name.
 * Auto-sizes to content.
 * Optionally supports inline editing via Popover + shared UnitPopoverContent.
 */

"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Ruler } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DataTableColumnHeader } from "../data-table-column-header";
import { UnitPopoverContent, type UnitPopoverOption } from "@/components/shared/popovers";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────

export interface UnitColumnOptions<TData> {
    /** Column accessor key (default: "unit_name") */
    accessorKey?: string;
    /** Column header title (default: "Unidad") */
    title?: string;
    /** Enable sorting (default: true) */
    enableSorting?: boolean;
    /** Column width in px */
    size?: number;
    /** Enable inline editing (default: false) */
    editable?: boolean;
    /** Available unit options (required if editable) */
    unitOptions?: UnitPopoverOption[];
    /** Callback when unit changes (required if editable) */
    onUpdate?: (row: TData, newValue: string) => Promise<void> | void;
}

// ─── Editable Unit Cell ────────────────────────────────

function EditableUnitCell<TData>({
    row,
    accessorKey,
    currentLabel,
    currentSymbol,
    unitOptions,
    onUpdate,
}: {
    row: TData;
    accessorKey: string;
    currentLabel: string;
    currentSymbol?: string | null;
    unitOptions: UnitPopoverOption[];
    onUpdate: (row: TData, newValue: string) => Promise<void> | void;
}) {
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    
    // In many cases, accessorKey points to `unit_name`, but the ID needed for update
    // is often `unit_id`. For maximum flexibility, the value passed to currentLabel might be the name,
    // but we need to identify which option it is to highlight the selection.
    // If we only have name, we match by label.
    const currentValueMatch = unitOptions.find(o => o.label === currentLabel);
    const currentValueId = currentValueMatch?.value || "";

    const handleSelect = async (value: string) => {
        setOpen(false);
        if (value !== currentValueId) {
            setLoading(true);
            try {
                await onUpdate(row, value);
            } finally {
                setLoading(false);
            }
        }
    };

    const iconNode = currentSymbol ? (
        <span className="text-[10px] font-mono font-medium text-muted-foreground w-4 text-center shrink-0">
            {currentSymbol}
        </span>
    ) : (
        <Ruler className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "flex items-center gap-2 cursor-pointer rounded-md px-1.5 py-1 -mx-1.5 transition-all text-left",
                        "border border-transparent hover:border-dashed hover:border-border hover:bg-[#2a2b2d]",
                        loading && "opacity-50 pointer-events-none"
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    {iconNode}
                    <span className="text-sm font-medium text-foreground whitespace-nowrap">{currentLabel}</span>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0" align="start" onClick={(e) => e.stopPropagation()}>
                <UnitPopoverContent
                    options={unitOptions}
                    currentValue={currentValueId}
                    onSelect={handleSelect}
                    onOpenChange={setOpen}
                />
            </PopoverContent>
        </Popover>
    );
}

// ─── Factory ─────────────────────────────────────────────

export function createUnitColumn<TData>(
    options: UnitColumnOptions<TData> = {}
): ColumnDef<TData, any> {
    const {
        accessorKey = "unit_name",
        title = "Unidad",
        enableSorting = true,
        size,
        editable = false,
        unitOptions = [],
        onUpdate,
    } = options;

    return {
        accessorKey,
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={title} />
        ),
        cell: ({ row }) => {
            const value = row.getValue(accessorKey) as string | null | undefined;
            const displayLabel = value || "Sin unidad";
            
            // To find the symbol, check in row original first (if it's `unit_symbol`), or look it up in options
            const symbolFromRow = (row.original as any)["unit_symbol"] as string | undefined;
            const symbolFromOption = unitOptions.find(o => o.label === displayLabel)?.symbol;
            const currentSymbol = symbolFromRow || symbolFromOption;

            if (editable && onUpdate && unitOptions.length > 0) {
                return (
                    <EditableUnitCell
                        row={row.original}
                        accessorKey={accessorKey}
                        currentLabel={displayLabel}
                        currentSymbol={currentSymbol}
                        unitOptions={unitOptions}
                        onUpdate={onUpdate}
                    />
                );
            }

            // Read-only display
            const iconNode = currentSymbol ? (
                <span className="text-[10px] font-mono font-medium text-muted-foreground w-4 text-center shrink-0">
                    {currentSymbol}
                </span>
            ) : (
                <Ruler className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            );

            return (
                <div className="flex items-center gap-2 px-1.5 whitespace-nowrap">
                    {iconNode}
                    <span className="text-sm font-medium text-foreground">{displayLabel}</span>
                </div>
            );
        },
        enableSorting,
        ...(size ? { size } : {}),
        // Context menu metadata for right-click menus
        ...(editable && onUpdate && unitOptions.length > 0 ? {
            meta: {
                contextMenu: {
                    label: title,
                    icon: Ruler,
                    options: unitOptions.map(o => ({
                        value: o.value,
                        label: o.label,
                    })),
                    currentValueKey: accessorKey,
                    // If the context menu relies on the value to select, it passes `o.value`.
                    onSelect: (row: TData, value: string) => onUpdate(row, value),
                },
            },
        } : {}),
    };
}
