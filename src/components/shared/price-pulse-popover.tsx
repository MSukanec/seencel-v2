/**
 * Price Pulse Popover — LEGACY COMPATIBILITY WRAPPER
 *
 * This file re-exports types and wraps the new PricePopoverContent
 * to maintain backwards compatibility with existing consumers:
 * - MaterialListItem, LaborListItem, TaskListItem, RecipeListItem
 * - RecipeResourceListItem, CatalogPriceButton
 *
 * The canonical source of truth for freshness logic is now:
 * @/components/shared/popovers/price-popover-content
 */

"use client";

import { type LucideIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Re-export canonical freshness helpers
export {
    getFreshness,
    FRESHNESS_COLORS,
    FreshnessDot,
    type FreshnessLevel,
} from "@/components/shared/popovers/price-popover-content";
import {
    getFreshness,
    FRESHNESS_COLORS,
    FreshnessDot,
    PricePopoverContent,
} from "@/components/shared/popovers/price-popover-content";

// Legacy actions — still needed by PricePulsePopover wrapper
import { upsertMaterialPrice } from "@/features/materials/actions";
import { upsertLaborPrice } from "@/features/labor/actions";

// ============================================================================
// Types (unchanged — kept for backwards compat)
// ============================================================================

export type PriceResourceType = "material" | "labor" | "equipment" | "subcontract" | "external_service";

export interface PricePulseData {
    resourceType: PriceResourceType;
    resourceId: string;
    resourceName: string;
    resourceCode?: string | null;
    organizationId: string;
    currencyId: string | null;
    effectiveUnitPrice: number;
    priceValidFrom?: string | null;
    unitSymbol?: string | null;
    icon?: LucideIcon;
}

// ============================================================================
// PricePulsePopover — LEGACY WRAPPER around PricePopoverContent
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

    const handleSave = useCallback(async (newPrice: number) => {
        if (!data.currencyId) {
            toast.error("No se encontró moneda para este recurso");
            throw new Error("No currency");
        }

        if (data.resourceType === "labor") {
            await upsertLaborPrice({
                labor_type_id: data.resourceId,
                organization_id: data.organizationId,
                currency_id: data.currencyId,
                unit_price: newPrice,
            });
        } else {
            await upsertMaterialPrice({
                material_id: data.resourceId,
                organization_id: data.organizationId,
                currency_id: data.currencyId,
                unit_price: newPrice,
            });
        }
        toast.success(`Precio de ${data.resourceName} actualizado a $${newPrice.toLocaleString("es-AR")}`);
        onPriceUpdated?.(data.resourceId, newPrice);
    }, [data, onPriceUpdated]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
                <PricePopoverContent
                    currentPrice={data.effectiveUnitPrice}
                    currencySymbol="$"
                    unitSymbol={data.unitSymbol}
                    priceValidFrom={data.priceValidFrom}
                    resourceName={data.resourceName}
                    onSave={handleSave}
                    onOpenChange={setOpen}
                />
            </PopoverContent>
        </Popover>
    );
}

// ============================================================================
// ResourcePriceDisplay — LEGACY WRAPPER (kept unchanged for consumers)
// ============================================================================

export interface ResourcePriceDisplayProps {
    price: number | null | undefined;
    currencySymbol?: string;
    unitSymbol?: string | null;
    unitName?: string | null;
    priceValidFrom?: string | null;
    pricePulseData?: PricePulseData | null;
    onPriceUpdated?: (materialId: string, newPrice: number) => void;
    onClick?: () => void;
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

    // Editable popover
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

    // Generic click handler
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
