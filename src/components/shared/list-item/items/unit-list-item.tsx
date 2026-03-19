"use client";

import { memo, useMemo } from "react";
import { ListItem, type ListItemContextMenuAction } from "../list-item-base";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CatalogUnit } from "@/features/units/queries";

// ============================================================================
// Types
// ============================================================================

export interface UnitListItemProps {
    /** The unit data */
    unit: CatalogUnit;
    /** Whether this item can be edited/deleted (false for system units if not admin) */
    canEdit?: boolean;
    /** Callback when edit is clicked */
    onEdit?: (unit: CatalogUnit) => void;
    /** Callback when delete is clicked */
    onDelete?: (unit: CatalogUnit) => void;
}

// ============================================================================
// Component
// ============================================================================

export const UnitListItem = memo(function UnitListItem({
    unit,
    canEdit = false,
    onEdit,
    onDelete,
}: UnitListItemProps) {

    // Build context menu actions
    const contextMenuActions = useMemo((): ListItemContextMenuAction[] | undefined => {
        if (!canEdit || (!onEdit && !onDelete)) return undefined;
        
        const actions: ListItemContextMenuAction[] = [];
        
        if (onEdit) {
            actions.push({
                label: "Editar",
                icon: <Pencil className="h-3.5 w-3.5" />,
                onClick: () => onEdit(unit),
            });
        }
        
        if (onDelete) {
            actions.push({
                label: "Eliminar",
                icon: <Trash2 className="h-3.5 w-3.5" />,
                onClick: () => onDelete(unit),
                variant: "destructive",
            });
        }
        
        return actions;
    }, [canEdit, onEdit, onDelete, unit]);

    return (
        <ListItem variant="row" contextMenuActions={contextMenuActions}>
            <ListItem.Content>
                <ListItem.Title suffix={unit.symbol ? `(${unit.symbol})` : undefined}>
                    {unit.name}
                </ListItem.Title>
                
                <ListItem.Badges className="mt-1.5">
                    {unit.applicable_to?.includes("task") && (
                        <Badge variant="outline" className="font-normal shadow-none">Tareas</Badge>
                    )}
                    {unit.applicable_to?.includes("material") && (
                        <Badge variant="outline" className="font-normal shadow-none">Materiales</Badge>
                    )}
                    {unit.applicable_to?.includes("labor") && (
                        <Badge variant="outline" className="font-normal shadow-none">Mano de Obra</Badge>
                    )}
                    {(!unit.applicable_to || unit.applicable_to.length === 0) && (
                        <span className="text-xs text-muted-foreground">No aplicable</span>
                    )}
                </ListItem.Badges>
            </ListItem.Content>

            <ListItem.Trailing>
                {unit.is_system ? (
                    <Badge variant="system">Sistema</Badge>
                ) : (
                    <Badge variant="organization">Propia</Badge>
                )}
            </ListItem.Trailing>
        </ListItem>
    );
});
