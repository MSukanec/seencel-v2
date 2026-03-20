/**
 * PricePopoverContent — Shared popover content for price editing
 *
 * Used by: price-chip (forms), price-column (tables), catalog-price-button
 * Single source of truth for the price editing UI.
 *
 * Features:
 * - Numeric input with currency symbol prefix
 * - Freshness semaphore dot (green/amber/red)
 * - Cancel / Save footer
 * - AGNOSTIC: receives `onSave` callback, does NOT import any actions
 */

"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { parseDateFromDB } from "@/lib/timezone-data";

// ============================================================================
// Freshness Helpers (canonical source of truth — replaces price-pulse-popover)
// ============================================================================

export type FreshnessLevel = "fresh" | "aging" | "stale";

export function getFreshness(validFrom: string | null | undefined): {
    level: FreshnessLevel;
    daysAgo: number;
    label: string;
    dateLabel: string;
} {
    if (!validFrom) {
        return { level: "stale", daysAgo: 999, label: "Sin fecha de precio", dateLabel: "" };
    }

    const date = parseDateFromDB(validFrom);
    if (!date) {
        return { level: "stale", daysAgo: 999, label: "Fecha inválida", dateLabel: "" };
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const daysAgo = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const label = `Actualizado ${formatDistanceToNow(date, { locale: es, addSuffix: true })}`;
    const dateLabel = date.toLocaleDateString("es-AR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    if (daysAgo <= 30) return { level: "fresh", daysAgo, label, dateLabel };
    if (daysAgo <= 90) return { level: "aging", daysAgo, label, dateLabel };
    return { level: "stale", daysAgo, label, dateLabel };
}

export const FRESHNESS_COLORS: Record<FreshnessLevel, { dot: string; text: string; pulse: string }> = {
    fresh: {
        dot: "bg-emerald-500",
        text: "text-emerald-600 dark:text-emerald-400",
        pulse: "animate-pulse",
    },
    aging: {
        dot: "bg-amber-500",
        text: "text-amber-600 dark:text-amber-400",
        pulse: "",
    },
    stale: {
        dot: "bg-red-500",
        text: "text-red-600 dark:text-red-400",
        pulse: "animate-pulse",
    },
};

// ============================================================================
// FreshnessDot — standalone indicator
// ============================================================================

export function FreshnessDot({ validFrom, className }: { validFrom?: string | null; className?: string }) {
    const { level } = getFreshness(validFrom);
    const colors = FRESHNESS_COLORS[level];

    return (
        <span
            className={cn("inline-block h-1.5 w-1.5 rounded-full shrink-0", colors.dot, colors.pulse, className)}
            title={level === "fresh" ? "Precio actualizado" : level === "aging" ? "Precio desactualizado" : "Precio obsoleto"}
        />
    );
}

// ============================================================================
// PricePopoverContent — Inner content for price editing popover
// ============================================================================

export interface PricePopoverContentProps {
    /** Current price value */
    currentPrice: number;
    /** Currency symbol (default: "$") */
    currencySymbol?: string;
    /** Unit symbol for the "/ unit" label */
    unitSymbol?: string | null;
    /** ISO date string for freshness calculation */
    priceValidFrom?: string | null;
    /** Resource name to show in the header */
    resourceName?: string;
    /** Agnostic save callback */
    onSave: (newPrice: number) => Promise<void>;
    /** Called to close the popover */
    onOpenChange?: (open: boolean) => void;
    /** Info text shown in the footer card */
    infoText?: string;
}

export function PricePopoverContent({
    currentPrice,
    currencySymbol = "$",
    unitSymbol,
    priceValidFrom,
    resourceName,
    onSave,
    onOpenChange,
    infoText = "Este es el precio unitario del recurso en tu organización. Al modificarlo se actualizará en todas las recetas que lo utilicen.",
}: PricePopoverContentProps) {
    const [newPrice, setNewPrice] = useState<string>(currentPrice.toFixed(2));
    const [isSaving, setIsSaving] = useState(false);

    const { level, label, dateLabel } = getFreshness(priceValidFrom);
    const colors = FRESHNESS_COLORS[level];

    const handleSave = useCallback(async () => {
        const price = parseFloat(newPrice);
        if (isNaN(price) || price < 0) {
            toast.error("El precio debe ser un número válido");
            return;
        }

        setIsSaving(true);
        try {
            await onSave(price);
            onOpenChange?.(false);
        } catch {
            toast.error("Error al actualizar el precio");
        } finally {
            setIsSaving(false);
        }
    }, [newPrice, onSave, onOpenChange]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSave();
        }
        if (e.key === "Escape") {
            onOpenChange?.(false);
        }
    };

    return (
        <div onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            {resourceName && (
                <div className="px-3 pt-3 pb-2">
                    <p className="text-xs font-medium text-foreground leading-snug">
                        {resourceName}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                        Precio global
                    </p>
                </div>
            )}

            {/* Body */}
            <div className="px-3 pb-3 space-y-2">
                {/* Price Input */}
                <div>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                            {currencySymbol}
                        </span>
                        <Input
                            type="number"
                            value={newPrice}
                            onChange={(e) => setNewPrice(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="h-9 text-sm font-mono pl-7 pr-14 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            min="0"
                            step="0.01"
                            autoFocus
                        />
                        {unitSymbol && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none uppercase">
                                / {unitSymbol}
                            </span>
                        )}
                    </div>
                    {/* Freshness indicator */}
                    <div className="flex items-start gap-1.5 mt-1.5">
                        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0 mt-1", colors.dot, colors.pulse)} />
                        <div>
                            <p className={cn("text-[11px] leading-tight", colors.text)}>
                                {label}
                            </p>
                            {dateLabel && (
                                <p className="text-[11px] text-muted-foreground leading-tight">
                                    {dateLabel}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-3 pb-3 flex items-center gap-2">
                <Button
                    variant="outline"
                    type="button"
                    size="sm"
                    onClick={() => onOpenChange?.(false)}
                    disabled={isSaving}
                    className="h-8 text-xs flex-1"
                >
                    Cancelar
                </Button>
                <Button
                    type="button"
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="h-8 text-xs flex-[3]"
                >
                    {isSaving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                    {isSaving ? "Guardando..." : "Actualizar"}
                </Button>
            </div>
        </div>
    );
}
