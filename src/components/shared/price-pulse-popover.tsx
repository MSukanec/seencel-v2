"use client";

import { useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Loader2, type LucideIcon } from "lucide-react";
import { upsertMaterialPrice } from "@/features/materials/actions";
import { upsertLaborPrice } from "@/features/labor/actions";
import { toast } from "sonner";
import { parseDateFromDB } from "@/lib/timezone-data";

// ============================================================================
// Types
// ============================================================================

export type PriceResourceType = "material" | "labor" | "equipment" | "subcontract" | "external_service";

export interface PricePulseData {
    /** What type of resource this price belongs to */
    resourceType: PriceResourceType;
    /** Resource ID (material_id or labor_type_id) */
    resourceId: string;
    /** Display name */
    resourceName: string;
    /** Optional code */
    resourceCode?: string | null;
    organizationId: string;
    currencyId: string | null;
    effectiveUnitPrice: number;
    /** ISO date string from prices.valid_from */
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
    onPriceUpdated?: (resourceId: string, newPrice: number) => void;
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
            toast.error("No se encontró moneda para este recurso");
            return;
        }

        setIsSaving(true);
        try {
            // Dispatch to the correct action based on resource type
            if (data.resourceType === "labor") {
                await upsertLaborPrice({
                    labor_type_id: data.resourceId,
                    organization_id: data.organizationId,
                    currency_id: data.currencyId,
                    unit_price: price,
                });
            } else {
                await upsertMaterialPrice({
                    material_id: data.resourceId,
                    organization_id: data.organizationId,
                    currency_id: data.currencyId,
                    unit_price: price,
                });
            }
            toast.success(`Precio de ${data.resourceName} actualizado a $${price.toLocaleString("es-AR")}`);
            onPriceUpdated?.(data.resourceId, price);
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
                {/* ── Header — exact modal-provider pattern ── */}
                <div className="flex-none p-3 border-b border-border">
                    <div className="flex items-center gap-3">
                        {Icon && <Icon className="h-5 w-5 text-primary shrink-0" />}
                        <div className="space-y-0.5">
                            <p className="text-sm font-medium text-foreground leading-snug">
                                {data.resourceName}
                            </p>
                            <p className="text-xs text-muted-foreground leading-normal">
                                Precio global
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="p-4 space-y-3">
                    {/* Price Input */}
                    <div>
                        <label className="text-sm font-medium leading-none mb-2 block">
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
                                className="h-9 text-sm font-mono pl-7 pr-14 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                min="0"
                                step="0.01"
                                autoFocus
                            />
                            {data.unitSymbol && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none uppercase">
                                    / {data.unitSymbol}
                                </span>
                            )}
                        </div>
                        {/* Freshness — inline below input */}
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", colors.dot, colors.pulse)} />
                            <p className={cn("text-[11px]", colors.text)}>
                                {label}{dateLabel ? ` · ${dateLabel}` : ""}
                            </p>
                        </div>
                    </div>

                    {/* Info card — global price warning */}
                    <div className="rounded-md border border-dashed border-muted-foreground/25 bg-muted/30 px-3 py-2.5">
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Este es el precio unitario del recurso en tu organización. Al modificarlo se actualizará en <strong>todas las recetas</strong> que lo utilicen.
                        </p>
                    </div>
                </div>

                {/* ── Footer — FormFooter grid-cols-4 (25% / 75%) ── */}
                <div className="p-3 border-t border-border bg-background">
                    <div className="grid grid-cols-4 gap-3">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => setOpen(false)}
                            disabled={isSaving}
                            className="w-full col-span-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full col-span-3"
                        >
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSaving ? "Guardando..." : "Actualizar"}
                        </Button>
                    </div>
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
