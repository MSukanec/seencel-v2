/**
 * Status Column Factory
 * Standard 19.4 - Reusable Status Column (Linear-style)
 * 
 * Renders a colored dot + plain text label.
 * Supports inline editing via Popover + StatusPopoverContent (shared).
 * Uses semantic CSS variables from globals.css for consistent theming.
 */

"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, Clock, XCircle, Circle, CircleDot } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { StatusPopoverContent } from "@/components/shared/popovers";
import { DataTableColumnHeader } from "../data-table-column-header";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────

export type StatusVariant = "positive" | "negative" | "warning" | "neutral" | "info";

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
    /** Column width in px (default: 50, or 120 if showLabel) */
    size?: number;
    /** Enable inline editing (default: false) */
    editable?: boolean;
    /** Callback when status changes (required if editable) */
    onUpdate?: (row: TData, newValue: string) => Promise<void> | void;
    /** Show label text next to icon (default: false — icon only) */
    showLabel?: boolean;
}

// ─── Variant → Color Mapping ────────────────────────────

const VARIANT_CONFIG: Record<StatusVariant, { icon: React.ElementType; className: string }> = {
    positive: { icon: CheckCircle2, className: "text-amount-positive" },
    negative: { icon: XCircle, className: "text-amount-negative" },
    warning: { icon: Clock, className: "text-semantic-warning" },
    neutral: { icon: Circle, className: "text-muted-foreground/50" },
    info: { icon: CircleDot, className: "text-blue-400" },
};

function StatusDot({ variant, className }: { variant: StatusVariant; className?: string }) {
    const { icon: Icon, className: colorClass } = VARIANT_CONFIG[variant];
    return <Icon className={cn("h-4 w-4", colorClass, className)} />;
}

// ─── Editable Status Cell ────────────────────────────────

function EditableStatusCell<TData>({
    row,
    accessorKey,
    options,
    onUpdate,
    showLabel = false,
}: {
    row: TData;
    accessorKey: string;
    options: StatusOption[];
    onUpdate: (row: TData, newValue: string) => Promise<void> | void;
    showLabel?: boolean;
}) {
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const currentValue = (row as any)[accessorKey] as string;
    const config = options.find(o => o.value === currentValue);
    const label = config?.label || currentValue;
    const variant = config?.variant || "neutral";

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
                        "flex items-center cursor-pointer rounded-md px-1.5 py-1 -mx-1 transition-all",
                        showLabel ? "gap-2" : "justify-center",
                        "border border-transparent hover:border-dashed hover:border-border hover:bg-[#2a2b2d]",
                        loading && "opacity-50 pointer-events-none"
                    )}
                    onClick={(e) => e.stopPropagation()}
                    title={label}
                >
                    <StatusDot variant={variant} />
                    {showLabel && <span className="text-xs font-[450] text-foreground">{label}</span>}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0" align="start" onClick={(e) => e.stopPropagation()}>
                <StatusPopoverContent
                    options={options}
                    currentValue={currentValue}
                    onSelect={handleSelect}
                />
            </PopoverContent>
        </Popover>
    );
}

// ─── Read-only Status Display ────────────────────────────

function ReadOnlyStatusDisplay({ status, options, showLabel = false }: { status: string; options: StatusOption[]; showLabel?: boolean }) {
    const config = options.find(o => o.value === status);
    const label = config?.label || status;
    const variant = config?.variant || "neutral";

    if (showLabel) {
        return (
            <div className="flex items-center gap-2 px-1.5">
                <StatusDot variant={variant} />
                <span className="text-xs text-foreground">{label}</span>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center justify-center px-1.5">
                        <StatusDot variant={variant} />
                    </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                    <p>{label}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
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
        size: customSize,
        editable = false,
        onUpdate,
        showLabel = false,
    } = options;

    const size = customSize ?? (showLabel ? 120 : 50);

    return {
        accessorKey,
        header: showLabel
            ? ({ column }) => <DataTableColumnHeader column={column} title={title} />
            : () => null,
        cell: ({ row }) => {
            const status = (row.original as any)[accessorKey] as string;

            if (editable && onUpdate) {
                return (
                    <EditableStatusCell
                        row={row.original}
                        accessorKey={accessorKey}
                        options={statusOptions}
                        onUpdate={onUpdate}
                        showLabel={showLabel}
                    />
                );
            }

            return <ReadOnlyStatusDisplay status={status} options={statusOptions} showLabel={showLabel} />;
        },
        enableSorting,
        size,
        // Context menu metadata for right-click menus
        ...(editable && onUpdate ? {
            meta: {
                contextMenu: {
                    label: title,
                    icon: Circle,
                    options: statusOptions.map(o => ({
                        value: o.value,
                        label: o.label,
                        icon: <StatusDot variant={o.variant} />,
                    })),
                    currentValueKey: accessorKey,
                    onSelect: (row: TData, value: string) => onUpdate(row, value),
                },
            },
        } : {}),
        ...(enableFiltering ? {
            filterFn: (row: any, id: string, value: string[]) => {
                return value.includes(row.getValue(id));
            },
        } : {}),
    };
}
