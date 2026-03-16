"use client";

import { memo, useMemo } from "react";
import { ListItem, type ListItemContextMenuAction } from "../list-item-base";
import { Pencil, Trash2 } from "lucide-react";
import { SiteLogType } from "@/features/sitelog/types";

// ============================================================================
// Types
// ============================================================================

export interface SiteLogTypeListItemProps {
    /** The site log type data */
    type: SiteLogType;
    /** Whether this item can be edited/deleted (false for system types) */
    canEdit?: boolean;
    /** Callback when edit is clicked */
    onEdit?: (type: SiteLogType) => void;
    /** Callback when delete is clicked */
    onDelete?: (type: SiteLogType) => void;
}

// ============================================================================
// Component
// ============================================================================

export const SiteLogTypeListItem = memo(function SiteLogTypeListItem({
    type,
    canEdit = false,
    onEdit,
    onDelete,
}: SiteLogTypeListItemProps) {

    // Build context menu actions (only for editable types)
    const contextMenuActions = useMemo((): ListItemContextMenuAction[] | undefined => {
        if (!canEdit || (!onEdit && !onDelete)) return undefined;
        const actions: ListItemContextMenuAction[] = [];
        if (onEdit) {
            actions.push({
                label: "Editar",
                icon: <Pencil className="h-3.5 w-3.5" />,
                onClick: () => onEdit(type),
            });
        }
        if (onDelete) {
            actions.push({
                label: "Eliminar",
                icon: <Trash2 className="h-3.5 w-3.5" />,
                onClick: () => onDelete(type),
                variant: "destructive",
            });
        }
        return actions;
    }, [canEdit, onEdit, onDelete, type]);

    return (
        <ListItem variant="row" contextMenuActions={contextMenuActions}>
            {/* Color strip: system = gray, custom = indigo */}
            <ListItem.ColorStrip color={type.is_system ? "system" : "indigo"} />

            <ListItem.Content>
                {/* Line 1: Name */}
                <ListItem.Title className="text-base">
                    {type.name}
                </ListItem.Title>

                {/* Line 2: Description */}
                <ListItem.Badges>
                    {type.description && (
                        <span className="text-xs text-muted-foreground">
                            {type.description}
                        </span>
                    )}
                </ListItem.Badges>
            </ListItem.Content>
        </ListItem>
    );
});
