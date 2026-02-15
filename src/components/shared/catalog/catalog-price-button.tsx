"use client";

import { cn } from "@/lib/utils";
import {
    PricePulsePopover,
    FreshnessDot,
    type PricePulseData,
} from "@/components/shared/price-pulse-popover";

// ============================================================================
// CatalogPriceButton — Dashed-border button that opens PricePulsePopover
// ============================================================================
// Used for displaying editable prices inside list items (materials, labor).
// Visual DNA matches CatalogValueButton: dashed border, same height (h-8),
// click opens the existing PricePulsePopover for editing.
//
// States:
//   has price  → shows freshness dot + formatted price as dashed button
//   no price   → shows "Sin precio" as muted dashed button
//   disabled   → plain text, no border, no interaction
// ============================================================================

export interface CatalogPriceButtonProps {
    /** Optional label shown before the price (e.g. "Precio Unitario") */
    label?: string;
    /** Short label for mobile (e.g. "P.U.") — shown on small screens when label is also provided */
    shortLabel?: string;
    /** Price value (null/undefined = no price set) */
    price: number | null | undefined;
    /** ISO date string for freshness semaphore */
    priceValidFrom?: string | null;
    /** PricePulse data for the popover — required for editing */
    pricePulseData?: PricePulseData | null;
    /** Callback when the price is updated via popover */
    onPriceUpdated?: (materialId: string, newPrice: number) => void;
    /** If true, renders as plain text (read-only, no border) */
    disabled?: boolean;
}

/** Format price with locale */
function formatPrice(n: number): string {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(n);
}

export function CatalogPriceButton({
    label,
    shortLabel,
    price,
    priceValidFrom,
    pricePulseData,
    onPriceUpdated,
    disabled = false,
}: CatalogPriceButtonProps) {
    const hasPrice = price !== null && price !== undefined && price > 0;

    // ── No price ──
    if (!hasPrice) {
        if (disabled) {
            return (
                <span className="text-xs text-muted-foreground/50">Sin precio</span>
            );
        }

        // Editable: dashed button that says "Sin precio" — still clickable to set one
        if (pricePulseData) {
            return (
                <PricePulsePopover data={pricePulseData} onPriceUpdated={onPriceUpdated}>
                    <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                            "inline-flex items-center gap-1.5 px-3 h-9 rounded-md",
                            "border border-dashed border-input",
                            "text-xs text-muted-foreground/60 whitespace-nowrap",
                            "hover:bg-muted/50 hover:border-muted-foreground/30",
                            "transition-colors cursor-pointer select-none"
                        )}
                    >
                        {label && shortLabel ? (
                            <>
                                <span className="text-xs text-muted-foreground font-medium sm:hidden">{shortLabel}</span>
                                <span className="text-xs text-muted-foreground font-medium hidden sm:inline">{label}</span>
                            </>
                        ) : label ? (
                            <span className="text-xs text-muted-foreground font-medium">{label}</span>
                        ) : null}
                        Sin precio
                    </button>
                </PricePulsePopover>
            );
        }

        return (
            <span className="text-xs text-muted-foreground/50">Sin precio</span>
        );
    }

    // ── Disabled: plain text ──
    if (disabled) {
        return (
            <span className="inline-flex items-center gap-1.5 text-sm whitespace-nowrap">
                {priceValidFrom !== undefined && <FreshnessDot validFrom={priceValidFrom} />}
                <span className="font-mono font-medium tabular-nums text-foreground">
                    {formatPrice(price!)}
                </span>
            </span>
        );
    }

    // ── Editable: dashed button that opens PricePulsePopover ──
    const buttonContent = (
        <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className={cn(
                "inline-flex items-center gap-1.5 px-3 h-9 rounded-md",
                "border border-dashed border-input",
                "whitespace-nowrap",
                "hover:bg-muted/50 hover:border-muted-foreground/30",
                "transition-colors cursor-pointer select-none"
            )}
        >
            {label && shortLabel ? (
                <>
                    <span className="text-xs text-muted-foreground font-medium sm:hidden">{shortLabel}</span>
                    <span className="text-xs text-muted-foreground font-medium hidden sm:inline">{label}</span>
                </>
            ) : label ? (
                <span className="text-xs text-muted-foreground font-medium">{label}</span>
            ) : null}
            {priceValidFrom !== undefined && <FreshnessDot validFrom={priceValidFrom} />}
            <span className="font-mono font-semibold tabular-nums text-foreground text-base">
                {formatPrice(price!)}
            </span>
        </button>
    );

    if (pricePulseData) {
        return (
            <PricePulsePopover data={pricePulseData} onPriceUpdated={onPriceUpdated}>
                {buttonContent}
            </PricePulsePopover>
        );
    }

    return buttonContent;
}
