"use client";

import { useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AlertTriangle, type LucideIcon } from "lucide-react";
import { upsertMaterialPrice } from "@/features/materials/actions";
import { toast } from "sonner";
import { parseDateFromDB } from "@/lib/timezone-data";

// ============================================================================
// Types
// ============================================================================

export interface PricePulseData {
    materialId: string;
    materialName: string;
    materialCode?: string | null;
    organizationId: string;
    currencyId: string | null;
    effectiveUnitPrice: number;
    /** ISO date string from material_prices.valid_from */
    priceValidFrom?: string | null;
    unitSymbol?: string | null;
    /** Icon to show in the popover header */
    icon?: LucideIcon;
}

type FreshnessLevel = "fresh" | "aging" | "stale";

// ============================================================================
// Helpers (exported for reuse)
// ============================================================================

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
// PricePulsePopover — clickable popover to view/edit price
// ============================================================================

export function PricePulsePopover({
    data,
    children,
    onPriceUpdated,
}: {
    data: PricePulseData;
    children: React.ReactNode;
    onPriceUpdated?: (materialId: string, newPrice: number) => void;
}) {
    const [open, setOpen] = useState(false);
    const [newPrice, setNewPrice] = useState<string>(data.effectiveUnitPrice.toFixed(2));
    const [isSaving, setIsSaving] = useState(false);

    const { level, label, dateLabel } = getFreshness(data.priceValidFrom);
    const colors = FRESHNESS_COLORS[level];

    const Icon = data.icon;

    const handleSave = useCallback(async () => {
        const price = parseFloat(newPrice);
        if (isNaN(price) || price < 0) {
            toast.error("El precio debe ser un número válido");
            return;
        }

        if (!data.currencyId) {
            toast.error("No se encontró moneda para este material");
            return;
        }

        setIsSaving(true);
        try {
            await upsertMaterialPrice({
                material_id: data.materialId,
                organization_id: data.organizationId,
                currency_id: data.currencyId,
                unit_price: price,
            });
            toast.success(`Precio de ${data.materialName} actualizado a $${price.toLocaleString("es-AR")}`);
            onPriceUpdated?.(data.materialId, price);
            setOpen(false);
        } catch {
            toast.error("Error al actualizar el precio");
        } finally {
            setIsSaving(false);
        }
    }, [newPrice, data, onPriceUpdated]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
                {/* Header with icon */}
                <div className="px-4 pt-4 pb-3 border-b flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{data.materialName}</p>
                        {data.materialCode && (
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">{data.materialCode}</p>
                        )}
                    </div>
                </div>

                {/* Body */}
                <div className="p-4 space-y-4">
                    {/* Price Input */}
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                            Precio unitario
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                                $
                            </span>
                            <Input
                                type="number"
                                value={newPrice}
                                onChange={(e) => setNewPrice(e.target.value)}
                                className="h-10 text-base font-mono pl-7 pr-14 text-right"
                                min="0"
                                step="0.01"
                                autoFocus
                            />
                            {data.unitSymbol && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none uppercase">
                                    / {data.unitSymbol}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Freshness */}
                    <div className="flex items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full shrink-0", colors.dot, colors.pulse)} />
                        <div className="min-w-0">
                            <p className={cn("text-xs font-medium", colors.text)}>{label}</p>
                            {dateLabel && (
                                <p className="text-[11px] text-muted-foreground">{dateLabel}</p>
                            )}
                        </div>
                    </div>

                    {/* Warning — simple text, not a card */}
                    <p className="text-[11px] text-muted-foreground leading-relaxed flex items-start gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                        Este precio es <strong>global</strong>. Modificarlo afecta a todas las recetas que usen este recurso.
                    </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-4 py-3 border-t bg-muted/30">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setOpen(false)}
                        disabled={isSaving}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? "Guardando..." : "Actualizar Precio"}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

// ============================================================================
// FreshnessDot — standalone indicator
// ============================================================================

export function FreshnessDot({ validFrom }: { validFrom?: string | null }) {
    const { level } = getFreshness(validFrom);
    const colors = FRESHNESS_COLORS[level];

    return (
        <span
            className={cn("inline-block h-1.5 w-1.5 rounded-full shrink-0", colors.dot, colors.pulse)}
            title={level === "fresh" ? "Precio actualizado" : level === "aging" ? "Precio desactualizado" : "Precio obsoleto"}
        />
    );
}

// ============================================================================
// ResourcePriceDisplay — reusable: semaphore dot + formatted price
// Wraps PricePulsePopover when editable. Shows "Sin precio" otherwise.
// ============================================================================

export interface ResourcePriceDisplayProps {
    /** Price value (null = no price set) */
    price: number | null | undefined;
    /** Currency symbol (default: "$") */
    currencySymbol?: string;
    /** Unit symbol to show in the popover (e.g. "KG") */
    unitSymbol?: string | null;
    /** Unit name for label (e.g. "por Hora") */
    unitName?: string | null;
    /** Date the price was last updated (ISO string) */
    priceValidFrom?: string | null;
    /** PricePulse data for the popover — if provided, price is clickable/editable */
    pricePulseData?: PricePulseData | null;
    /** Callback when price is updated */
    onPriceUpdated?: (materialId: string, newPrice: number) => void;
    /** Generic click handler — makes the price clickable without needing pricePulseData */
    onClick?: () => void;
    /** Additional className for the container */
    className?: string;
}

export function ResourcePriceDisplay({
    price,
    currencySymbol = "$",
    unitSymbol,
    unitName,
    priceValidFrom,
    pricePulseData,
    onPriceUpdated,
    onClick,
    className,
}: ResourcePriceDisplayProps) {
    const hasPrice = price !== null && price !== undefined && price > 0;

    if (!hasPrice) {
        return (
            <span className={cn("text-xs text-muted-foreground", className)}>
                Sin precio
            </span>
        );
    }

    const formattedPrice = new Intl.NumberFormat("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(price!);

    const isClickable = !!pricePulseData || !!onClick;

    const priceContent = (
        <span className={cn(
            "flex items-center gap-1.5",
            isClickable && "cursor-pointer hover:opacity-80 transition-opacity",
        )}>
            {priceValidFrom !== undefined && <FreshnessDot validFrom={priceValidFrom} />}
            <span className={cn("font-medium text-lg", className)}>
                {currencySymbol}{formattedPrice}
            </span>
        </span>
    );

    // Editable popover for materials
    if (pricePulseData) {
        return (
            <PricePulsePopover data={pricePulseData} onPriceUpdated={onPriceUpdated}>
                <button
                    type="button"
                    className="text-left"
                    onClick={(e) => e.stopPropagation()}
                >
                    {priceContent}
                </button>
            </PricePulsePopover>
        );
    }

    // Generic click handler (e.g. open modal for labor)
    if (onClick) {
        return (
            <button
                type="button"
                className="text-left"
                onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                }}
            >
                {priceContent}
            </button>
        );
    }

    return priceContent;
}
