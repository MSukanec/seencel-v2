"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ============================================================================
// CatalogValueButton — Dashed-border button that toggles to inline edit
// ============================================================================
// Used for editable numeric values (quantity, waste) inside list items.
// Visual DNA: dashed border like toolbar filter buttons, click-to-edit.
//
// States:
//   idle     → shows label + value + suffix as a clickable dashed button
//   editing  → shows <Input /> (standard) inside the same space
//   disabled → plain text, no border, no interaction
// ============================================================================

export interface CatalogValueButtonProps {
    /** Left label — e.g. "Cant.", "Merma" */
    label: string;
    /** Numeric value */
    value: number;
    /** Right suffix — e.g. "M3", "KG", "%", "H" */
    suffix?: string;
    /** If true, renders as plain text (read-only, no border) */
    disabled?: boolean;
    /** Minimum allowed value (default: 0.001) */
    min?: number;
    /** Allow zero as a valid value */
    allowZero?: boolean;
    /** Callback with the new value after edit */
    onChange: (value: number) => void;
}

/** Format number with locale (2 decimal places when needed) */
function formatNumber(n: number): string {
    return new Intl.NumberFormat("es-AR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(n);
}

export function CatalogValueButton({
    label,
    value,
    suffix,
    disabled = false,
    min = 0.001,
    allowZero = false,
    onChange,
}: CatalogValueButtonProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // When entering edit mode, focus the input
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleClick = useCallback(() => {
        if (disabled) return;
        setEditValue(value.toString());
        setIsEditing(true);
    }, [disabled, value]);

    const handleSave = useCallback(() => {
        const newVal = parseFloat(editValue);
        if (allowZero) {
            onChange(!isNaN(newVal) && newVal >= 0 ? newVal : 0);
        } else if (!isNaN(newVal) && newVal > 0) {
            onChange(newVal);
        }
        setIsEditing(false);
    }, [editValue, allowZero, onChange]);

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

    // ── Disabled: plain text ──
    if (disabled) {
        return (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground whitespace-nowrap">
                <span className="text-xs">{label}</span>
                <span className="font-mono font-medium tabular-nums text-foreground">
                    {formatNumber(value)}
                </span>
                {suffix && (
                    <span className="text-[11px] uppercase">{suffix}</span>
                )}
            </span>
        );
    }

    // ── Editing: inline Input ──
    if (isEditing) {
        return (
            <div className="inline-flex items-center gap-0 rounded-md border border-primary/50 bg-background overflow-hidden shrink-0 ring-2 ring-primary/20">
                <span className="px-2 text-xs text-muted-foreground font-medium whitespace-nowrap select-none h-8 flex items-center">
                    {label}
                </span>
                <Input
                    ref={inputRef}
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    className="h-8 w-20 text-sm text-right font-mono tabular-nums border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                    min={allowZero ? 0 : min}
                    step="0.01"
                />
                {suffix && (
                    <span className="px-2 text-[11px] text-muted-foreground font-medium uppercase whitespace-nowrap select-none h-8 flex items-center">
                        {suffix}
                    </span>
                )}
            </div>
        );
    }

    // ── Idle: dashed button ──
    return (
        <button
            type="button"
            onClick={handleClick}
            className={cn(
                "inline-flex items-center gap-1.5 px-2.5 h-8 rounded-md",
                "border border-dashed border-input",
                "text-sm whitespace-nowrap",
                "hover:bg-muted/50 hover:border-muted-foreground/30",
                "transition-colors cursor-pointer select-none"
            )}
        >
            <span className="text-xs text-muted-foreground font-medium">{label}</span>
            <span className="font-mono font-medium tabular-nums text-foreground">
                {formatNumber(value)}
            </span>
            {suffix && (
                <span className="text-[11px] text-muted-foreground uppercase">{suffix}</span>
            )}
        </button>
    );
}
