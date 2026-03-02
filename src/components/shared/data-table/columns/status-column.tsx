/**
 * Status Column Factory
 * Standard 19.4 - Reusable Status Column (Linear-style)
 * 
 * Renders a colored dot + plain text label.
 * Supports inline editing via Popover + Command.
 * Uses semantic CSS variables from globals.css for consistent theming.
 */

"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Check, CheckCircle2, Clock, XCircle, Circle } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Command,
    CommandInput,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { DataTableColumnHeader } from "../data-table-column-header";
import { cn } from "@/lib/utils";

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
    /** Column width in px (default: 110) */
    size?: number;
    /** Enable inline editing (default: false) */
    editable?: boolean;
    /** Callback when status changes (required if editable) */
    onUpdate?: (row: TData, newValue: string) => Promise<void> | void;
}

// ─── Variant → Icon + Color ──────────────────────────────

const VARIANT_ICON: Record<StatusVariant, { icon: React.ElementType; className: string }> = {
    positive: { icon: CheckCircle2, className: "text-amount-positive" },
    negative: { icon: XCircle, className: "text-amount-negative" },
    warning: { icon: Clock, className: "text-semantic-warning" },
    neutral: { icon: Circle, className: "text-muted-foreground" },
};

function StatusIcon({ variant, className }: { variant: StatusVariant; className?: string }) {
    const { icon: Icon, className: colorClass } = VARIANT_ICON[variant];
    return <Icon className={cn("h-4 w-4", colorClass, className)} />;
}

// ─── Editable Status Cell ────────────────────────────────

function EditableStatusCell<TData>({
    row,
    accessorKey,
    options,
    onUpdate,
}: {
    row: TData;
    accessorKey: string;
    options: StatusOption[];
    onUpdate: (row: TData, newValue: string) => Promise<void> | void;
}) {
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const currentValue = (row as any)[accessorKey] as string;
    const config = options.find(o => o.value === currentValue);
    const label = config?.label || currentValue;
    const variant = config?.variant || "neutral";

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
                        "flex items-center gap-2 cursor-pointer rounded-md px-1.5 py-1 -mx-1.5 transition-all",
                        "border border-transparent hover:border-dashed hover:border-border hover:bg-[#2a2b2d]",
                        loading && "opacity-50 pointer-events-none"
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    <StatusIcon variant={variant} />
                    <span className="text-xs font-[450] text-foreground">{label}</span>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0" align="start" onClick={(e) => e.stopPropagation()}>
                <Command>
                    <CommandInput placeholder="Cambiar estado..." className="h-8 text-xs" />
                    <CommandList>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={() => handleSelect(option.value)}
                                    className="flex items-center gap-2 text-xs"
                                >
                                    <StatusIcon variant={option.variant} />
                                    <span className="flex-1">{option.label}</span>
                                    {currentValue === option.value && (
                                        <Check className="h-3.5 w-3.5 text-muted-foreground" />
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

// ─── Read-only Status Display ────────────────────────────

function ReadOnlyStatusDisplay({ status, options }: { status: string; options: StatusOption[] }) {
    const config = options.find(o => o.value === status);
    const label = config?.label || status;
    const variant = config?.variant || "neutral";

    return (
        <div className="flex items-center gap-2 px-1.5">
            <StatusIcon variant={variant} />
            <span className="text-xs text-foreground">{label}</span>
        </div>
    );
}

// ─── Factory ─────────────────────────────────────────────

export function createStatusColumn<TData>(
    options: StatusColumnOptions<TData>
): ColumnDef<TData, any> {
    const {
        accessorKey = "status",
        title = "Estado",
        options: statusOptions,
        enableSorting = false,
        enableFiltering = true,
        size = 110,
        editable = false,
        onUpdate,
    } = options;

    return {
        accessorKey,
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={title} />
        ),
        cell: ({ row }) => {
            const status = (row.original as any)[accessorKey] as string;

            if (editable && onUpdate) {
                return (
                    <EditableStatusCell
                        row={row.original}
                        accessorKey={accessorKey}
                        options={statusOptions}
                        onUpdate={onUpdate}
                    />
                );
            }

            return <ReadOnlyStatusDisplay status={status} options={statusOptions} />;
        },
        enableSorting,
        size,
        ...(enableFiltering ? {
            filterFn: (row: any, id: string, value: string[]) => {
                return value.includes(row.getValue(id));
            },
        } : {}),
    };
}
