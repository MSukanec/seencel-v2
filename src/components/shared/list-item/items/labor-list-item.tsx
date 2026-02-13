"use client";

import { memo, useCallback } from "react";
import { ListItem } from "../list-item-base";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, DollarSign, HardHat } from "lucide-react";
import { ResourcePriceDisplay, type PricePulseData } from "@/components/shared/price-pulse-popover";

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
    /** Callback when edit price is clicked */
    onEditPrice?: (laborType: any) => void;
    /** Callback when price is updated via popover */
    onPriceUpdated?: (materialId: string, newPrice: number) => void;
}

// ============================================================================
// Component
// ============================================================================

export const LaborListItem = memo(function LaborListItem({
    laborType,
    selected = false,
    onToggleSelect,
    onEditPrice,
    onPriceUpdated,
}: LaborListItemProps) {
    const unitDisplay = laborType.unit_symbol || laborType.unit_name || null;

    const handleToggle = useCallback(() => {
        onToggleSelect?.(laborType.id);
    }, [onToggleSelect, laborType.id]);

    // Build PricePulse data — for now labor doesn't have the same upsert action,
    // so we only display the semaphore visually without editable popover
    // TODO: When labor has its own upsertLaborPrice action, wire pricePulseData here

    return (
        <ListItem variant="card" selected={selected}>
            {/* Selection Checkbox */}
            {onToggleSelect && (
                <ListItem.Checkbox
                    checked={selected}
                    onChange={handleToggle}
                />
            )}

            {/* Color indicator: system = amber-ish, org = indigo */}
            <ListItem.ColorStrip color={laborType.is_system ? "system" : "indigo"} />

            <ListItem.Content>
                {/* Line 1: Name + (unit symbol) */}
                <ListItem.Title className="text-base">
                    {laborType.name}
                    {unitDisplay && (
                        <span className="text-muted-foreground font-normal text-sm ml-2">
                            ({unitDisplay})
                        </span>
                    )}
                </ListItem.Title>
                {/* Line 2: Badges */}
                <ListItem.Badges>
                    {laborType.category_name && (
                        <Badge variant="secondary" className="text-xs">
                            {laborType.category_name}
                        </Badge>
                    )}
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

            {/* Right side: Price + Unit below */}
            <div className="flex flex-col items-end mr-2 min-w-[100px]" onClick={(e) => e.stopPropagation()}>
                {/* Price with semaphore */}
                <ResourcePriceDisplay
                    price={laborType.current_price}
                    currencySymbol={laborType.currency_symbol || "$"}
                    priceValidFrom={laborType.price_valid_from}
                    onClick={onEditPrice ? () => onEditPrice(laborType) : undefined}
                />
                {/* Unit below */}
                {unitDisplay && (
                    <span className="text-xs text-muted-foreground">
                        {laborType.unit_name || unitDisplay}
                    </span>
                )}
            </div>

            {/* Actions dropdown */}
            {onEditPrice && (
                <ListItem.Actions>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Acciones</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEditPrice(laborType)}>
                                {laborType.current_price != null ? (
                                    <><Pencil className="mr-2 h-4 w-4" /> Editar precio</>
                                ) : (
                                    <><DollarSign className="mr-2 h-4 w-4" /> Establecer precio</>
                                )}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </ListItem.Actions>
            )}
        </ListItem>
    );
});
