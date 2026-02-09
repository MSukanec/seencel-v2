"use client";

import { memo, useCallback } from "react";
import { ListItem } from "../list-item-base";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Shield } from "lucide-react";

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
    organization_logo_path?: string | null;
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
    /** Callback when selection is toggled */
    onToggleSelect?: (id: string) => void;
    /** Callback when edit is clicked - uses any to allow extended types */
    onEdit?: (material: any) => void;
    /** Callback when delete is clicked - uses any to allow extended types */
    onDelete?: (material: any) => void;
}

// ============================================================================
// Component
// ============================================================================

export const MaterialListItem = memo(function MaterialListItem({
    material,
    canEdit = false,
    selected = false,
    isAdminMode = false,
    onToggleSelect,
    onEdit,
    onDelete
}: MaterialListItemProps) {
    // Format price if available
    const formattedPrice = material.org_unit_price
        ? new Intl.NumberFormat('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(material.org_unit_price)
        : null;

    // Format price date if available
    const formattedPriceDate = material.org_price_valid_from
        ? new Intl.DateTimeFormat('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        }).format(new Date(material.org_price_valid_from))
        : null;

    // Currency symbol based on currency_id
    // Using a simple heuristic: if currency contains "usd" or "dolar" in common currency IDs, use USD
    // For ARS or default, use $
    const currencySymbol = material.org_price_currency_id
        ? (material.org_price_currency_id.toLowerCase().includes('usd') ? 'USD ' : '$')
        : '$';

    // Memoize the toggle handler to avoid creating new function on each render
    const handleToggle = useCallback(() => {
        onToggleSelect?.(material.id);
    }, [onToggleSelect, material.id]);

    return (
        <ListItem variant="card" selected={selected}>
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
                <ListItem.Title className="text-base">
                    {material.code && (
                        <span className="text-muted-foreground font-mono text-sm mr-2">
                            [{material.code}]
                        </span>
                    )}
                    {material.name}
                </ListItem.Title>
                <ListItem.Badges>
                    {material.unit_symbol && (
                        <Badge variant="secondary" className="text-xs">
                            {material.unit_symbol}
                        </Badge>
                    )}
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
                                    {material.organization_logo_path && (
                                        <AvatarImage src={material.organization_logo_path} alt={material.organization_name} />
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

            {/* Sale unit and price display - before actions */}
            <div className="flex flex-col items-end text-sm mr-2 min-w-[100px]">
                {/* Sale unit info: "Lata 1 KG" */}
                {(material.sale_unit_name || material.sale_unit_symbol) && (
                    <span className="text-xs text-muted-foreground">
                        {material.sale_unit_name || material.sale_unit_symbol}
                        {material.default_sale_unit_quantity && (
                            <> {material.default_sale_unit_quantity} {material.unit_symbol || ''}</>
                        )}
                    </span>
                )}
                {/* Price with currency symbol */}
                {formattedPrice && (
                    <>
                        <span className="font-medium">
                            {currencySymbol}{formattedPrice}
                        </span>
                        {formattedPriceDate && (
                            <span className="text-xs text-muted-foreground">{formattedPriceDate}</span>
                        )}
                    </>
                )}
            </div>

            {canEdit && (onEdit || onDelete) && (
                <ListItem.Actions>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Acciones</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {onEdit && (
                                <DropdownMenuItem onClick={() => onEdit(material)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                </DropdownMenuItem>
                            )}
                            {onDelete && (
                                <DropdownMenuItem
                                    onClick={() => onDelete(material)}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </ListItem.Actions>
            )}
        </ListItem>
    );
});
