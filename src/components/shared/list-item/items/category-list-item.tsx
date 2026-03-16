"use client";

import { memo, useMemo } from "react";
import { ListItem, type ListItemContextMenuAction } from "../list-item-base";
import { Pencil, Trash2 } from "lucide-react";
import { GeneralCostCategory } from "@/features/general-costs/types";

// ============================================================================
// Types
// ============================================================================

export interface CategoryListItemProps {
    /** The category data */
    category: GeneralCostCategory;
    /** Whether this item can be edited/deleted (false for system categories) */
    canEdit?: boolean;
    /** Callback when edit is clicked */
    onEdit?: (category: GeneralCostCategory) => void;
    /** Callback when delete is clicked */
    onDelete?: (category: GeneralCostCategory) => void;
}

// ============================================================================
// Component
// ============================================================================

export const CategoryListItem = memo(function CategoryListItem({
    category,
    canEdit = false,
    onEdit,
    onDelete,
}: CategoryListItemProps) {

    // Build context menu actions (only for editable categories)
    const contextMenuActions = useMemo((): ListItemContextMenuAction[] | undefined => {
        if (!canEdit || (!onEdit && !onDelete)) return undefined;
        const actions: ListItemContextMenuAction[] = [];
        if (onEdit) {
            actions.push({
                label: "Editar",
                icon: <Pencil className="h-3.5 w-3.5" />,
                onClick: () => onEdit(category),
            });
        }
        if (onDelete) {
            actions.push({
                label: "Eliminar",
                icon: <Trash2 className="h-3.5 w-3.5" />,
                onClick: () => onDelete(category),
                variant: "destructive",
            });
        }
        return actions;
    }, [canEdit, onEdit, onDelete, category]);

    return (
        <ListItem variant="card" contextMenuActions={contextMenuActions}>
            {/* Color strip: system = gray, custom = indigo */}
            <ListItem.ColorStrip color={category.is_system ? "system" : "indigo"} />

            <ListItem.Content>
                {/* Line 1: Name */}
                <ListItem.Title className="text-base">
                    {category.name}
                </ListItem.Title>

                {/* Line 2: Description */}
                {category.description && (
                    <ListItem.Badges>
                        <span className="text-xs text-muted-foreground">
                            {category.description}
                        </span>
                    </ListItem.Badges>
                )}
            </ListItem.Content>
        </ListItem>
    );
});
