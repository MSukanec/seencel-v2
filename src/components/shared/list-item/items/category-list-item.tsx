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

    const handleEdit = useCallback(() => onEdit?.(category), [onEdit, category]);
    const handleDelete = useCallback(() => onDelete?.(category), [onDelete, category]);

    return (
        <ListItem variant="card">
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

            {/* Actions: only for non-system categories */}
            {canEdit && (onEdit || onDelete) && (
                <ListItem.Actions>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Acciones</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            {onEdit && (
                                <DropdownMenuItem onClick={handleEdit} className="text-xs gap-2">
                                    <Pencil className="h-3.5 w-3.5" />
                                    Editar
                                </DropdownMenuItem>
                            )}
                            {onDelete && (
                                <DropdownMenuItem
                                    onClick={handleDelete}
                                    className="text-xs gap-2 text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
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
