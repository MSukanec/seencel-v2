"use client";

import { memo, useCallback } from "react";
import { ListItem } from "../list-item-base";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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

    const handleEdit = useCallback(() => onEdit?.(type), [onEdit, type]);
    const handleDelete = useCallback(() => onDelete?.(type), [onDelete, type]);

    return (
        <ListItem variant="card">
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

            {/* Actions: only for non-system types */}
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
                                <DropdownMenuItem onClick={handleEdit}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                </DropdownMenuItem>
                            )}
                            {onDelete && (
                                <DropdownMenuItem
                                    onClick={handleDelete}
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
