"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ============================================================================
// InlineEditableCell — Dashed-border cell that toggles to inline input
// ============================================================================
// Used in DataTable cells for quick inline editing without opening a form.
// Visual DNA: dashed border button (same as CatalogValueButton) in idle state,
//             inline input in edit state.
//
// States:
//   idle     → dashed border button with value + suffix (cursor pointer)
//   editing  → <Input /> inline with ring focus
//   disabled → plain text, no border, no interaction
// ============================================================================

export interface InlineEditableCellProps {
    /** Current display value */
    value: string | number;
    /** Callback with the new value after edit */
    onSave: (value: string) => void;
    /** Type of input (default: "number") */
    type?: "number" | "text";
    /** Suffix to display after the value (e.g. "%", "m²") */
    suffix?: string;
    /** If true, renders as plain text (read-only) */
    disabled?: boolean;
    /** Minimum value for number inputs */
    min?: number;
    /** Step for number inputs */
    step?: number;
    /** Text alignment (default: "right") */
    align?: "left" | "right";
    /** Additional className for the idle display */
    className?: string;
    /** Format function for the display value */
    formatValue?: (value: string | number) => string;
}

/** Format number with locale (up to 2 decimal places) */
function formatNumber(n: number): string {
    return new Intl.NumberFormat("es-AR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(n);
}

export function InlineEditableCell({
    value,
    onSave,
    type = "number",
    suffix,
    disabled = false,
    min,
    step = 0.01,
    align = "right",
    className,
    formatValue,
}: InlineEditableCellProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleClick = useCallback(() => {
        if (disabled) return;
        setEditValue(String(value));
        setIsEditing(true);
    }, [disabled, value]);

    const handleSave = useCallback(() => {
        const trimmed = editValue.trim();
        if (trimmed !== String(value)) {
            onSave(trimmed);
        }
        setIsEditing(false);
    }, [editValue, value, onSave]);

    const handleCancel = useCallback(() => {
        setIsEditing(false);
    }, []);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handleSave();
            } else if (e.key === "Escape") {
                e.preventDefault();
                handleCancel();
            }
        },
        [handleSave, handleCancel]
    );

    const displayValue = formatValue
        ? formatValue(value)
        : typeof value === "number"
            ? formatNumber(value)
            : String(value);

    // ── Disabled: plain text ──
    if (disabled) {
        return (
            <div className={cn("flex", align === "right" ? "justify-end" : "justify-start")}>
                <span className={cn(
                    "inline-flex items-center gap-1 px-2 h-7",
                    "font-mono font-medium tabular-nums text-muted-foreground text-sm",
                    className
                )}>
                    {displayValue}
                    {suffix && <span className="text-[11px] uppercase">{suffix}</span>}
                </span>
            </div>
        );
    }

    // ── Editing: inline input ──
    if (isEditing) {
        return (
            <div className={cn("flex", align === "right" ? "justify-end" : "justify-start")}>
                <div className="inline-flex items-center gap-0 rounded-md border border-primary/50 bg-background overflow-hidden shrink-0 ring-2 ring-primary/20">
                    <Input
                        ref={inputRef}
                        type={type}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className="h-7 w-20 text-sm text-right font-mono tabular-nums border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent px-2"
                        min={min}
                        step={step}
                    />
                    {suffix && (
                        <span className="pr-2 text-[11px] text-muted-foreground font-medium uppercase whitespace-nowrap select-none h-7 flex items-center">
                            {suffix}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    // ── Idle: dashed border button (same as CatalogValueButton) ──
    return (
        <div className={cn("flex", align === "right" ? "justify-end" : "justify-start")}>
            <button
                type="button"
                onClick={handleClick}
                className={cn(
                    "inline-flex items-center gap-1 px-2 h-7 rounded-md",
                    "border border-dashed border-input",
                    "text-sm whitespace-nowrap",
                    "hover:bg-muted/50 hover:border-muted-foreground/30",
                    "transition-colors cursor-pointer select-none",
                    className
                )}
            >
                <span className="font-mono font-medium tabular-nums text-foreground">
                    {displayValue}
                </span>
                {suffix && (
                    <span className="text-[11px] text-muted-foreground uppercase">{suffix}</span>
                )}
            </button>
        </div>
    );
}
