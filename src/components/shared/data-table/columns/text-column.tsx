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
    /** Whether this column should fill remaining space (default: true) */
    fillWidth?: boolean;
    /** Show full text wrapping across multiple lines (default: false). Mutually exclusive with truncate. */
    multiline?: boolean;
    /** Max number of visible lines when multiline (uses CSS line-clamp). Omit for unlimited. */
    maxLines?: number;
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
    multiline,
}: {
    row: TData;
    accessorKey: string;
    value: string | null;
    muted: boolean;
    secondary: boolean;
    emptyValue: string;
    onUpdate: (row: TData, newValue: string) => Promise<void> | void;
    placeholder?: string;
    multiline?: boolean;
}) {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState(value || "");
    const inputRef = React.useRef<HTMLInputElement>(null);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    const handleStartEditing = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditValue(value || "");
        setIsEditing(true);
        if (multiline) {
            setTimeout(() => textareaRef.current?.focus(), 10);
        } else {
            setTimeout(() => inputRef.current?.select(), 10);
        }
    };

    const handleSave = () => {
        setIsEditing(false);
        if (editValue !== (value || "")) {
            onUpdate(row, editValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            setIsEditing(false);
        }
        // Single-line: Enter saves
        if (!multiline && e.key === "Enter") {
            e.preventDefault();
            handleSave();
        }
        // Multiline: Ctrl/Cmd+Enter saves
        if (multiline && e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleSave();
        }
    };

    if (isEditing) {
        if (multiline) {
            return (
                <div onClick={(e) => e.stopPropagation()}>
                    <textarea
                        ref={textareaRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleSave}
                        placeholder={placeholder || "Escribir..."}
                        rows={3}
                        className={cn(
                            "w-full px-2 py-1.5 text-xs bg-background border border-border rounded-md resize-y",
                            "focus:outline-none focus:ring-1 focus:ring-ring",
                        )}
                    />
                </div>
            );
        }
        return (
            <div onClick={(e) => e.stopPropagation()}>
                <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSave}
                    placeholder={placeholder || "Escribir..."}
                    className={cn(
                        "w-full h-7 px-2 text-sm bg-background border border-border rounded-md",
                        "focus:outline-none focus:ring-1 focus:ring-ring",
                    )}
                />
            </div>
        );
    }

    // Display mode
    const textStyle = secondary
        ? "text-xs font-[450] text-muted-foreground"
        : muted ? "text-muted-foreground" : "font-medium";

    return (
        <button
            className={cn(
                "text-left cursor-pointer rounded-md px-1.5 py-0.5 -mx-1.5 transition-all max-w-full",
                "border border-transparent hover:border-dashed hover:border-border hover:bg-[#2a2b2d]",
                multiline ? "whitespace-pre-wrap break-words" : "truncate block",
                textStyle,
                !value && "text-muted-foreground italic"
            )}
            onClick={handleStartEditing}
        >
            {value || emptyValue}
        </button>
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
        fillWidth: shouldFill = true,
        multiline = false,
        maxLines,
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
                        multiline={multiline}
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

            // Multiline mode: wrap text naturally across rows
            if (multiline) {
                const lineClampStyle = maxLines ? {
                    display: '-webkit-box' as const,
                    WebkitLineClamp: maxLines,
                    WebkitBoxOrient: 'vertical' as const,
                    overflow: 'hidden',
                } : undefined;

                return (
                    <div className="flex flex-col overflow-hidden">
                        <span
                            className={cn("whitespace-pre-wrap break-words", plainTextClass)}
                            style={lineClampStyle}
                            title={maxLines && shouldShowTooltip ? displayValue : undefined}
                        >
                            {displayValue}
                        </span>
                        {subtitleValue && (
                            <span className="text-xs text-muted-foreground font-[450] mt-0.5">
                                {subtitleValue}
                            </span>
                        )}
                    </div>
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
        meta: { fillWidth: shouldFill },
        ...(size ? { size } : {}),
    };
}
