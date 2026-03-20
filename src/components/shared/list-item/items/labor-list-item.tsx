"use client";

import { memo, useCallback, useState } from "react";
import { ListItem } from "../list-item-base";
import { Badge } from "@/components/ui/badge";
import { Pencil, DollarSign } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    FreshnessDot,
    PricePopoverContent,
} from "@/components/shared/popovers/price-popover-content";

// ============================================================================
// Types
// ============================================================================

export interface LaborListItemData {
    id: string;
    name: string;
    unit_name?: string | null;
    unit_symbol?: string | null;
    category_name?: string | null;
    level_name?: string | null;
    role_name?: string | null;
    is_system?: boolean;
    labor_category_id?: string | null;
    // Price info
    current_price?: number | null;
    currency_symbol?: string | null;
    currency_code?: string | null;
    currency_id?: string | null;
    price_valid_from?: string | null;
    organization_id?: string | null;
}

export interface LaborListItemProps {
    /** The labor type data to display */
    laborType: LaborListItemData;
    /** Whether this item is selected */
    selected?: boolean;
    /** Callback when selection is toggled */
    onToggleSelect?: (id: string) => void;
    /** Callback when edit price is clicked (context menu) */
    onEditPrice?: (laborType: any) => void;
    /** Callback when price is saved from inline popover */
    onPriceSave?: (laborType: any, newPrice: number) => Promise<void>;
}

// ============================================================================
// Component
// ============================================================================

export const LaborListItem = memo(function LaborListItem({
    laborType,
    selected = false,
    onToggleSelect,
    onEditPrice,
    onPriceSave,
}: LaborListItemProps) {
    const unitDisplay = laborType.unit_symbol || laborType.unit_name || null;
    const [priceOpen, setPriceOpen] = useState(false);

    const handleToggle = useCallback(() => {
        onToggleSelect?.(laborType.id);
    }, [onToggleSelect, laborType.id]);

    const handlePriceSave = useCallback(async (newPrice: number) => {
        if (onPriceSave) {
            await onPriceSave(laborType, newPrice);
        }
    }, [onPriceSave, laborType]);

    const hasPrice = laborType.current_price != null && laborType.current_price > 0;
    const formattedPrice = hasPrice
        ? new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(laborType.current_price!)
        : null;

    return (
        <ListItem variant="card" selected={selected} contextMenuActions={
            onEditPrice ? [{
                label: hasPrice ? "Editar precio" : "Establecer precio",
                icon: hasPrice
                    ? <Pencil className="h-3.5 w-3.5" />
                    : <DollarSign className="h-3.5 w-3.5" />,
                onClick: () => onEditPrice(laborType),
            }] : undefined
        }>
            {/* Selection Checkbox */}
            {onToggleSelect && (
                <ListItem.Checkbox
                    checked={selected}
                    onChange={handleToggle}
                />
            )}

            {/* Color indicator */}
            <ListItem.ColorStrip color={laborType.is_system ? "system" : "indigo"} />

            <ListItem.Content>
                {/* Line 1: Name + (unit) */}
                <ListItem.Title className="text-base">
                    {laborType.name}
                    {unitDisplay && (
                        <span className="text-muted-foreground font-normal text-sm ml-2">
                            ({unitDisplay})
                        </span>
                    )}
                </ListItem.Title>
                {/* Line 2: Chips (Nivel + Rol) — sin Oficio: ya lo muestra el groupBy/sidebar */}
                <ListItem.Badges>
                    {laborType.level_name && (
                        <Badge variant="secondary" className="text-xs">
                            {laborType.level_name}
                        </Badge>
                    )}
                    {laborType.role_name && (
                        <Badge variant="secondary" className="text-xs">
                            {laborType.role_name}
                        </Badge>
                    )}
                </ListItem.Badges>
            </ListItem.Content>

            {/* Right side: Price with inline editing */}
            <div className="flex flex-col items-end mr-2 min-w-[100px]" onClick={(e) => e.stopPropagation()}>
                {onPriceSave ? (
                    <Popover open={priceOpen} onOpenChange={setPriceOpen}>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity text-left"
                            >
                                <FreshnessDot validFrom={laborType.price_valid_from} />
                                <span className="font-medium text-lg">
                                    {hasPrice
                                        ? `${laborType.currency_symbol || "$"}${formattedPrice}`
                                        : <span className="text-xs text-muted-foreground">Sin precio</span>
                                    }
                                </span>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-0" align="end" sideOffset={8}>
                            <PricePopoverContent
                                currentPrice={laborType.current_price || 0}
                                currencySymbol={laborType.currency_symbol || "$"}
                                unitSymbol={unitDisplay}
                                priceValidFrom={laborType.price_valid_from}
                                resourceName={laborType.name}
                                onSave={handlePriceSave}
                                onOpenChange={setPriceOpen}
                            />
                        </PopoverContent>
                    </Popover>
                ) : (
                    /* Read-only price display */
                    <span className="flex items-center gap-1.5">
                        <FreshnessDot validFrom={laborType.price_valid_from} />
                        <span className="font-medium text-lg">
                            {hasPrice
                                ? `${laborType.currency_symbol || "$"}${formattedPrice}`
                                : <span className="text-xs text-muted-foreground">Sin precio</span>
                            }
                        </span>
                    </span>
                )}
                {/* Unit below */}
                {unitDisplay && (
                    <span className="text-xs text-muted-foreground">
                        {laborType.unit_name || unitDisplay}
                    </span>
                )}
            </div>
        </ListItem>
    );
});
