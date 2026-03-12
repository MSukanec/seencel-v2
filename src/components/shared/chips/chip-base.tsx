/**
 * ChipBase — Componente fundacional del sistema de Chips
 *
 * Renderiza un trigger tipo pill/badge que abre un Popover con
 * contenido arbitrario. Es el building block de todos los chips
 * concretos (StatusChip, WalletChip, DateChip, etc.)
 *
 * Funciona en:
 * - Forms (dentro de ChipRow)
 * - Tablas (inline editing)
 * - Detail panels
 */

"use client";

import * as React from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────

export interface ChipBaseProps {
    /** Icon rendered at the start of the chip */
    icon?: React.ReactNode;
    /** Display label */
    label: string;
    /** Whether a value is selected (affects text color: muted when false) */
    hasValue?: boolean;
    /** Visual variant */
    variant?: "default" | "muted" | "ghost";
    /** Popover content (the selector/picker that opens on click) */
    children: React.ReactNode;
    /** Popover width (default: 200) */
    popoverWidth?: number;
    /** Popover alignment (default: "start") */
    popoverAlign?: "start" | "center" | "end";
    /** Disabled state */
    disabled?: boolean;
    /** Loading state (waiting for async update) */
    loading?: boolean;
    /** Read-only mode (no popover, just display) */
    readOnly?: boolean;
    /** Extra className for the trigger */
    className?: string;
    /** Controlled open state */
    open?: boolean;
    /** Controlled open change */
    onOpenChange?: (open: boolean) => void;
}

// ─── Component ───────────────────────────────────────────

export function ChipBase({
    icon,
    label,
    hasValue = true,
    variant = "default",
    children,
    popoverWidth = 200,
    popoverAlign = "start",
    disabled = false,
    loading = false,
    readOnly = false,
    className,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
}: ChipBaseProps) {
    const [internalOpen, setInternalOpen] = React.useState(false);

    const open = controlledOpen ?? internalOpen;
    const setOpen = controlledOnOpenChange ?? setInternalOpen;

    // Read-only: just render the pill, no popover
    if (readOnly || disabled) {
        return (
            <div
                className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors select-none",
                    "border",
                    hasValue ? "border-border/40" : "border-dashed border-border/40",
                    "text-muted-foreground",
                    disabled && "opacity-50",
                    className
                )}
            >
                {icon && <span className="shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>}
                <span className="truncate max-w-[120px]">{label}</span>
            </div>
        );
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer transition-all select-none",
                        // Border — always visible, like Linear
                        "border",
                        hasValue ? "border-border/60" : "border-dashed border-border/40",
                        "hover:border-border hover:bg-muted/50",
                        // Text color — muted when no value, foreground when has value
                        hasValue ? "text-foreground" : "text-muted-foreground",
                        loading && "opacity-50 pointer-events-none",
                        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                        className
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    {icon && <span className="shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>}
                    <span className="truncate max-w-[150px]">{label}</span>
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="p-0"
                style={{ width: popoverWidth }}
                align={popoverAlign}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </PopoverContent>
        </Popover>
    );
}
