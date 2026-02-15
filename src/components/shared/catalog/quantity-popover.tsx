"use client";

import { useState, useCallback } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Loader2, type LucideIcon } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export interface QuantityPopoverData {
    /** Resource display name */
    resourceName: string;
    /** Icon for the header */
    icon?: LucideIcon;
    /** Unit symbol (e.g. "UD", "M3", "KG", "H") */
    unitSymbol?: string | null;
    /** Current quantity */
    quantity: number;
    /** Current waste percentage (null = no waste field, i.e. labor) */
    wastePercentage?: number | null;
}

export interface QuantityPopoverProps {
    data: QuantityPopoverData;
    children: React.ReactNode;
    onSave: (quantity: number, wastePercentage?: number) => void;
}

// ============================================================================
// Helpers
// ============================================================================

function formatNumber(n: number): string {
    return new Intl.NumberFormat("es-AR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(n);
}

// ============================================================================
// QuantityPopover
// ============================================================================

export function QuantityPopover({
    data,
    children,
    onSave,
}: QuantityPopoverProps) {
    const [open, setOpen] = useState(false);
    const [qty, setQty] = useState<string>(data.quantity.toString());
    const [waste, setWaste] = useState<string>(
        data.wastePercentage != null ? data.wastePercentage.toString() : "0"
    );

    const hasWaste = data.wastePercentage != null;
    const Icon = data.icon;

    // Sync state when popover opens
    const handleOpenChange = useCallback((nextOpen: boolean) => {
        if (nextOpen) {
            setQty(data.quantity.toString());
            setWaste(data.wastePercentage != null ? data.wastePercentage.toString() : "0");
        }
        setOpen(nextOpen);
    }, [data.quantity, data.wastePercentage]);

    // Calculate total
    const parsedQty = parseFloat(qty) || 0;
    const parsedWaste = hasWaste ? (parseFloat(waste) || 0) : 0;
    const total = parsedQty * (1 + parsedWaste / 100);

    const handleSave = useCallback(() => {
        const newQty = parseFloat(qty);
        if (isNaN(newQty) || newQty <= 0) return;

        if (hasWaste) {
            const newWaste = parseFloat(waste);
            onSave(newQty, isNaN(newWaste) ? 0 : Math.max(0, newWaste));
        } else {
            onSave(newQty);
        }
        setOpen(false);
    }, [qty, waste, hasWaste, onSave]);

    const unit = data.unitSymbol?.toUpperCase() || "";

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="end" sideOffset={8}>
                {/* ── Header — modal pattern ── */}
                <div className="flex-none p-3 border-b border-border">
                    <div className="flex items-center gap-3">
                        {Icon && <Icon className="h-5 w-5 text-primary shrink-0" />}
                        <div className="space-y-0.5">
                            <p className="text-sm font-medium text-foreground leading-snug">
                                {data.resourceName}
                            </p>
                            <p className="text-xs text-muted-foreground leading-normal">
                                Cantidad en receta
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="p-4 space-y-3">
                    {/* Quantity */}
                    <div>
                        <label className="text-sm font-medium leading-none mb-2 block">
                            Cantidad
                        </label>
                        <div className="relative">
                            <Input
                                type="number"
                                value={qty}
                                onChange={(e) => setQty(e.target.value)}
                                className="h-9 text-sm font-mono pr-14 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                min="0.001"
                                step="0.01"
                                autoFocus
                            />
                            {unit && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none uppercase">
                                    {unit}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Waste (materials only) */}
                    {hasWaste && (
                        <div>
                            <label className="text-sm font-medium leading-none mb-2 block">
                                Merma
                            </label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    value={waste}
                                    onChange={(e) => setWaste(e.target.value)}
                                    className="h-9 text-sm font-mono pr-10 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    min="0"
                                    step="0.5"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none">
                                    %
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Total — always shown */}
                    <div className="flex items-center justify-between pt-1 border-t border-dashed border-muted-foreground/20">
                        <span className="text-xs text-muted-foreground">
                            Total{hasWaste ? " (con merma)" : ""}
                        </span>
                        <span className="text-sm font-mono font-semibold tabular-nums text-foreground">
                            {formatNumber(total)} {unit}
                        </span>
                    </div>
                </div>

                {/* ── Footer — FormFooter grid-cols-4 (25% / 75%) ── */}
                <div className="p-3 border-t border-border bg-background">
                    <div className="grid grid-cols-4 gap-3">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => setOpen(false)}
                            className="w-full col-span-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSave}
                            disabled={parsedQty <= 0}
                            className="w-full col-span-3"
                        >
                            Actualizar
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
