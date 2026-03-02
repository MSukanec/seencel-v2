/**
 * Text Column Factory
 * Standard 19.2 - Reusable Text Column
 * 
 * Creates a standardized text column with:
 * - Optional truncation with tooltip
 * - Optional subtitle
 * - Muted styling option
 * - Inline editing via Popover with Input (Linear-style)
 */

"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../data-table-column-header";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface TextColumnOptions<TData> {
    /** Column accessor key */
    accessorKey: string;
    /** Column header title */
    title: string;
    /** Truncate text with max-width (true = 180px, number = custom px) */
    truncate?: boolean | number;
    /** Show full text in tooltip on hover (default: true when truncate is enabled) */
    showTooltip?: boolean;
    /** Use muted-foreground color (default: false) */
    muted?: boolean;
    /** Value to show when null/undefined (default: "-") */
    emptyValue?: string;
    /** Function to get subtitle text from row */
    subtitle?: (row: TData) => string | null | undefined;
    /** Enable sorting (default: true) */
    enableSorting?: boolean;
    /** Custom cell renderer override */
    customRender?: (value: string | null, row: TData) => React.ReactNode;
    /** Column width in px (default: auto — fills remaining space) */
    size?: number;
    /** Enable inline editing (default: false) */
    editable?: boolean;
    /** Callback when text changes (required if editable) */
    onUpdate?: (row: TData, newValue: string) => Promise<void> | void;
    /** Placeholder for editable input */
    editPlaceholder?: string;
    /** Secondary style: 12px font-[450] (Linear-style for plain text columns like Description) */
    secondary?: boolean;
}

// ─── Editable Text Cell ──────────────────────────────────

function EditableTextCell<TData>({
    row,
    accessorKey,
    value,
    muted,
    secondary,
    emptyValue,
    onUpdate,
    placeholder,
}: {
    row: TData;
    accessorKey: string;
    value: string | null;
    muted: boolean;
    secondary: boolean;
    emptyValue: string;
    onUpdate: (row: TData, newValue: string) => Promise<void> | void;
    placeholder?: string;
}) {
    const [open, setOpen] = React.useState(false);
    const [editValue, setEditValue] = React.useState(value || "");
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (open) {
            setEditValue(value || "");
            // Focus input after popover opens
            setTimeout(() => inputRef.current?.select(), 50);
        }
    }, [open, value]);

    const handleSave = async () => {
        if (editValue !== (value || "")) {
            await onUpdate(row, editValue);
        }
        setOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSave();
        }
        if (e.key === "Escape") {
            setOpen(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "text-left cursor-pointer rounded px-1 -mx-1 transition-colors hover:bg-muted/50",
                        secondary
                            ? "text-xs font-[450] text-muted-foreground"
                            : muted ? "text-muted-foreground" : "font-medium",
                        !value && "text-muted-foreground italic"
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    {value || emptyValue}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start" onClick={(e) => e.stopPropagation()}>
                <Input
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSave}
                    placeholder={placeholder || "Escribir..."}
                    className="h-8 text-sm"
                />
            </PopoverContent>
        </Popover>
    );
}

// ─── Factory ─────────────────────────────────────────────

export function createTextColumn<TData>(
    options: TextColumnOptions<TData>
): ColumnDef<TData, any> {
    const {
        accessorKey,
        title,
        truncate = false,
        showTooltip,
        muted = false,
        emptyValue = "-",
        subtitle,
        enableSorting = true,
        customRender,
        size,
        editable = false,
        onUpdate,
        editPlaceholder,
        secondary = false,
    } = options;

    // Resolved text classes
    const textClass = secondary
        ? "text-xs font-[450] text-muted-foreground"
        : muted ? "text-muted-foreground" : "text-sm font-medium";
    const plainTextClass = secondary
        ? "text-xs font-[450] text-muted-foreground"
        : muted ? "text-sm text-muted-foreground" : "text-sm";

    const maxWidth = truncate === true ? 180 : typeof truncate === "number" ? truncate : undefined;
    const shouldShowTooltip = showTooltip ?? !!truncate;

    return {
        accessorKey,
        header: ({ column }) => <DataTableColumnHeader column={column} title={title} />,
        cell: ({ row }) => {
            const value = row.getValue(accessorKey) as string | null | undefined;
            const displayValue = value || emptyValue;
            const subtitleValue = subtitle ? subtitle(row.original) : null;

            // Custom render override
            if (customRender) {
                return customRender(value ?? null, row.original);
            }

            // Editable mode
            if (editable && onUpdate) {
                return (
                    <EditableTextCell
                        row={row.original}
                        accessorKey={accessorKey}
                        value={value ?? null}
                        muted={muted}
                        secondary={secondary}
                        emptyValue={emptyValue}
                        onUpdate={onUpdate}
                        placeholder={editPlaceholder}
                    />
                );
            }

            // Empty state
            if (!value) {
                return (
                    <span className="text-muted-foreground italic">
                        {emptyValue}
                    </span>
                );
            }

            // With explicit maxWidth truncation
            if (maxWidth) {
                return (
                    <div
                        className="flex flex-col overflow-hidden"
                        style={{ maxWidth: `${maxWidth}px` }}
                        title={shouldShowTooltip ? displayValue : undefined}
                    >
                        <span className={cn("truncate", textClass)}>
                            {displayValue}
                        </span>
                        {subtitleValue && (
                            <span className="text-xs text-muted-foreground font-[450] truncate">
                                {subtitleValue}
                            </span>
                        )}
                    </div>
                );
            }

            // Default: fill remaining space, truncate overflow
            if (subtitle) {
                return (
                    <div className="flex flex-col overflow-hidden">
                        <span className={cn("truncate", textClass)}>
                            {displayValue}
                        </span>
                        {subtitleValue && (
                            <span className="text-xs text-muted-foreground font-[450] truncate">
                                {subtitleValue}
                            </span>
                        )}
                    </div>
                );
            }

            return (
                <span className={cn("truncate block overflow-hidden", plainTextClass)}>
                    {displayValue}
                </span>
            );
        },
        enableSorting,
        meta: { fillWidth: true },
        ...(size ? { size } : {}),
    };
}
