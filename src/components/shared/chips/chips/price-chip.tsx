/**
 * PriceChip — Price selector chip for forms
 *
 * Shows current price with freshness semaphore dot.
 * Click opens popover with PricePopoverContent for editing.
 */

"use client";

import * as React from "react";
import { DollarSign } from "lucide-react";
import { ChipBase } from "../chip-base";
import {
    PricePopoverContent,
    getFreshness,
    FRESHNESS_COLORS,
} from "@/components/shared/popovers/price-popover-content";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────

export interface PriceChipProps {
    /** Current price value (null = not set) */
    price: number | null;
    /** Currency symbol (default: "$") */
    currencySymbol?: string;
    /** Unit symbol for the popover */
    unitSymbol?: string | null;
    /** ISO date string for freshness calculation */
    priceValidFrom?: string | null;
    /** Resource name for popover header */
    resourceName?: string;
    /** Agnostic save callback */
    onSave: (newPrice: number) => Promise<void>;
    /** Additional className */
    className?: string;
}

// ─── Component ───────────────────────────────────────────

export function PriceChip({
    price,
    currencySymbol = "$",
    unitSymbol,
    priceValidFrom,
    resourceName,
    onSave,
    className,
}: PriceChipProps) {
    const [open, setOpen] = React.useState(false);

    const hasPrice = price !== null && price > 0;

    // Freshness
    const { level } = getFreshness(priceValidFrom);
    const colors = FRESHNESS_COLORS[level];

    // Format price
    const displayLabel = hasPrice
        ? `${currencySymbol} ${price!.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : "Sin precio";

    return (
        <ChipBase
            icon={hasPrice ? (
                <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", colors.dot, colors.pulse)} />
            ) : (
                <DollarSign className="h-3 w-3" />
            )}
            label={displayLabel}
            hasValue={hasPrice}
            popoverWidth={320}
            open={open}
            onOpenChange={setOpen}
            className={className}
        >
            <PricePopoverContent
                currentPrice={price || 0}
                currencySymbol={currencySymbol}
                unitSymbol={unitSymbol}
                priceValidFrom={priceValidFrom}
                resourceName={resourceName}
                onSave={onSave}
                onOpenChange={setOpen}
            />
        </ChipBase>
    );
}
