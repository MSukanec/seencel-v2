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
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

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
    org_unit_price?: number | null;
    org_price_currency_id?: string | null;
}

export interface MaterialListItemProps {
    /** The material data to display */
    material: MaterialListItemData;
    /** Whether this material can be edited/deleted */
    canEdit?: boolean;
    /** Whether this item is selected */
    selected?: boolean;
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
                    {formattedPrice && (
                        <Badge variant="outline" className="text-xs font-medium">
                            ${formattedPrice}
                        </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                        {material.is_system ? 'Sistema' : 'Propio'}
                    </Badge>
                </ListItem.Badges>
            </ListItem.Content>

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
