"use client";

import { memo, useCallback, useMemo } from "react";
import { ListItem, type ListItemContextMenuAction } from "../list-item-base";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Pencil, Trash2, Shield, Package } from "lucide-react";
import { ResourcePriceDisplay, type PricePulseData } from "@/components/shared/price-pulse-popover";

// ============================================================================
// Types
// ============================================================================

export interface MaterialListItemData {
    id: string;
    name: string;
    code?: string | null;
    material_type?: string;
    unit_id?: string | null;
    unit_name?: string | null;
    unit_symbol?: string | null;
    category_id?: string | null;
    category_name?: string | null;
    organization_id?: string | null;
    is_system?: boolean;
    // Sale unit info
    default_sale_unit_id?: string | null;
    default_sale_unit_quantity?: number | null;
    sale_unit_name?: string | null;
    sale_unit_symbol?: string | null;
    // Price info
    org_unit_price?: number | null;
    org_price_currency_id?: string | null;
    org_price_valid_from?: string | null;
    // Organization info (admin mode)
    organization_name?: string | null;
    organization_logo_url?: string | null;
}

export interface MaterialListItemProps {
    /** The material data to display */
    material: MaterialListItemData;
    /** Whether this material can be edited/deleted */
    canEdit?: boolean;
    /** Whether this item is selected */
    selected?: boolean;
    /** Whether we're in admin mode (shows org info) */
    isAdminMode?: boolean;
    /** Organization ID for price editing */
    organizationId?: string;
    /** Callback when selection is toggled */
    onToggleSelect?: (id: string) => void;
    /** Callback when edit is clicked - uses any to allow extended types */
    onEdit?: (material: any) => void;
    /** Callback when delete is clicked - uses any to allow extended types */
    onDelete?: (material: any) => void;
    /** Callback when price is updated */
    onPriceUpdated?: (materialId: string, newPrice: number) => void;
}

// ============================================================================
// Component
// ============================================================================

export const MaterialListItem = memo(function MaterialListItem({
    material,
    canEdit = false,
    selected = false,
    isAdminMode = false,
    organizationId,
    onToggleSelect,
    onEdit,
    onDelete,
    onPriceUpdated,
}: MaterialListItemProps) {
    // Memoize the toggle handler to avoid creating new function on each render
    const handleToggle = useCallback(() => {
        onToggleSelect?.(material.id);
    }, [onToggleSelect, material.id]);

    // Sale unit display
    const saleUnitDisplay = material.sale_unit_name || material.sale_unit_symbol;
    const saleUnitFull = saleUnitDisplay
        ? `${saleUnitDisplay}${material.default_sale_unit_quantity ? ` ${material.default_sale_unit_quantity} ${material.unit_symbol || ''}` : ''}`
        : material.unit_symbol || material.unit_name || null;

    // Build PricePulse data for popover
    const pricePulseData: PricePulseData | null =
        material.org_unit_price != null && organizationId && material.org_price_currency_id
            ? {
                resourceType: "material",
                resourceId: material.id,
                resourceName: material.name,
                resourceCode: material.code,
                organizationId,
                currencyId: material.org_price_currency_id,
                effectiveUnitPrice: material.org_unit_price,
                priceValidFrom: material.org_price_valid_from,
                unitSymbol: material.unit_symbol,
                icon: Package,
            }
            : null;

    // Build context menu actions
    const contextMenuActions = useMemo((): ListItemContextMenuAction[] | undefined => {
        if (!canEdit || (!onEdit && !onDelete)) return undefined;
        const actions: ListItemContextMenuAction[] = [];
        if (onEdit) {
            actions.push({
                label: "Editar",
                icon: <Pencil className="h-3.5 w-3.5" />,
                onClick: () => onEdit(material),
            });
        }
        if (onDelete) {
            actions.push({
                label: "Eliminar",
                icon: <Trash2 className="h-3.5 w-3.5" />,
                onClick: () => onDelete(material),
                variant: "destructive",
            });
        }
        return actions;
    }, [canEdit, onEdit, onDelete, material]);

    return (
        <ListItem variant="card" selected={selected} contextMenuActions={contextMenuActions}>
            {/* Selection Checkbox */}
            {onToggleSelect && (
                <ListItem.Checkbox
                    checked={selected}
                    onChange={handleToggle}
                />
            )}

            {/* Color indicator for system vs custom */}
            <ListItem.ColorStrip color={material.is_system ? "system" : "indigo"} />

            <ListItem.Content>
                {/* Line 1: Name + (unit symbol) */}
                <ListItem.Title className="text-base">
                    {material.name}
                    {material.unit_symbol && (
                        <span className="text-muted-foreground font-normal text-sm ml-2">
                            ({material.unit_symbol})
                        </span>
                    )}
                </ListItem.Title>
                {/* Line 2: Badges */}
                <ListItem.Badges>
                    {material.category_name && (
                        <Badge variant="secondary" className="text-xs">
                            {material.category_name}
                        </Badge>
                    )}
                    {/* Admin mode: show organization info or system badge */}
                    {isAdminMode && (
                        material.is_system ? (
                            <Badge variant="outline" className="text-xs gap-1 border-amber-500/30 text-amber-500">
                                <Shield className="h-3 w-3" />
                                Sistema
                            </Badge>
                        ) : material.organization_name ? (
                            <Badge variant="outline" className="text-xs gap-1.5 pl-1">
                                <Avatar className="h-4 w-4">
                                    {material.organization_logo_url && (
                                        <AvatarImage src={material.organization_logo_url} alt={material.organization_name} />
                                    )}
                                    <AvatarFallback className="text-[8px]">
                                        {material.organization_name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                {material.organization_name}
                            </Badge>
                        ) : null
                    )}
                </ListItem.Badges>
            </ListItem.Content>

            {/* Right side: Price + Unit below */}
            <div className="flex flex-col items-end mr-2 min-w-[100px]" onClick={(e) => e.stopPropagation()}>
                {/* Price with semaphore */}
                <ResourcePriceDisplay
                    price={material.org_unit_price}
                    priceValidFrom={material.org_price_valid_from}
                    pricePulseData={pricePulseData}
                    onPriceUpdated={onPriceUpdated}
                />
                {/* Unit of sale below */}
                {saleUnitFull && (
                    <span className="text-xs text-muted-foreground">
                        {saleUnitFull}
                    </span>
                )}
            </div>
        </ListItem>
    );
});
