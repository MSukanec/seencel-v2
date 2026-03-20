"use client";

import { memo, useCallback, useMemo } from "react";
import { ListItem, type ListItemContextMenuAction } from "../list-item-base";
import { Badge } from "@/components/ui/badge";
import {
    Pencil, Trash2, Circle, ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskRecipeView } from "@/features/tasks/types";

// ============================================================================
// Types
// ============================================================================

export interface RecipeListItemProps {
    /** The recipe data */
    recipe: TaskRecipeView;
    /** Current organization ID — to detect own vs public */
    organizationId: string;
    /** Callback when the item is clicked */
    onClick?: (recipe: TaskRecipeView) => void;
    /** Callback to edit */
    onEdit?: (recipe: TaskRecipeView) => void;
    /** Callback to delete */
    onDelete?: (recipe: TaskRecipeView) => void;
    /** Callback to change status */
    onStatusChange?: (recipe: TaskRecipeView, status: string) => void;
}

// ============================================================================
// Helpers
// ============================================================================

const STATUS_CONFIG = {
    draft: {
        label: "Borrador",
        dotClass: "fill-amber-500 text-amber-500",
        badgeClass: "text-amber-600 dark:text-amber-400 border-amber-500/30",
    },
    active: {
        label: "Activa",
        dotClass: "fill-emerald-500 text-emerald-500",
        badgeClass: null,
    },
    archived: {
        label: "Archivada",
        dotClass: "fill-muted-foreground text-muted-foreground",
        badgeClass: "text-muted-foreground",
    },
} as const;

function formatCurrency(value: number): string {
    return "$" + value.toLocaleString("es-AR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
}

// ============================================================================
// Component
// ============================================================================

export const RecipeListItem = memo(function RecipeListItem({
    recipe,
    organizationId,
    onClick,
    onEdit,
    onDelete,
    onStatusChange,
}: RecipeListItemProps) {
    const isOwn = recipe.organization_id === organizationId;
    const displayName = recipe.name
        || (isOwn ? "Receta sin nombre" : recipe.org_name || "Receta Anónima");
    const currentStatus = (recipe.status ?? "active") as "draft" | "active" | "archived";

    // Resource composition label
    const compositionLabel = useMemo(() => {
        const parts: string[] = [];
        if (recipe.mat_cost > 0) parts.push("mat.");
        if (recipe.lab_cost > 0) parts.push("m.o.");
        if (recipe.ext_cost > 0) parts.push("serv.");
        if (parts.length === 0) return "Sin recursos";
        return parts.join(" · ");
    }, [recipe.mat_cost, recipe.lab_cost, recipe.ext_cost]);

    const handleClick = useCallback(() => {
        onClick?.(recipe);
    }, [onClick, recipe]);

    // Context menu actions
    const contextMenuActions = useMemo((): ListItemContextMenuAction[] | undefined => {
        if (!onEdit && !onDelete && !onStatusChange) return undefined;
        const actions: ListItemContextMenuAction[] = [];

        if (onEdit) {
            actions.push({
                label: "Editar",
                icon: <Pencil className="h-3.5 w-3.5" />,
                onClick: () => onEdit(recipe),
            });
        }

        if (onStatusChange) {
            const statuses: Array<{ key: "draft" | "active" | "archived"; label: string }> = [
                { key: "draft", label: "Borrador" },
                { key: "active", label: "Activa" },
                { key: "archived", label: "Archivada" },
            ];
            statuses
                .filter(s => s.key !== currentStatus)
                .forEach(s => {
                    actions.push({
                        label: `Estado: ${s.label}`,
                        icon: <Circle className={`h-3 w-3 ${STATUS_CONFIG[s.key].dotClass}`} />,
                        onClick: () => onStatusChange(recipe, s.key),
                    });
                });
        }

        if (onDelete) {
            actions.push({
                label: "Eliminar",
                icon: <Trash2 className="h-3.5 w-3.5" />,
                onClick: () => onDelete(recipe),
                variant: "destructive",
            });
        }

        return actions;
    }, [onEdit, onDelete, onStatusChange, recipe, currentStatus]);

    return (
        <ListItem
            variant="card"
            onClick={onClick ? handleClick : undefined}
            contextMenuActions={contextMenuActions}
        >
            {/* Origin icon */}
            <ListItem.Leading>
                <div className={cn(
                    "flex items-center justify-center h-9 w-9 rounded-lg",
                    isOwn ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                    <ScrollText className="h-4.5 w-4.5" />
                </div>
            </ListItem.Leading>

            <ListItem.Content>
                <ListItem.Title>
                    {displayName}
                </ListItem.Title>
                {recipe.region && (
                    <ListItem.Description>{recipe.region}</ListItem.Description>
                )}
                <ListItem.Badges>
                    {/* Resource type badges */}
                    {recipe.mat_cost > 0 && (
                        <Badge variant="secondary" className="text-xs">Materiales</Badge>
                    )}
                    {recipe.lab_cost > 0 && (
                        <Badge variant="secondary" className="text-xs">Mano de Obra</Badge>
                    )}
                    {recipe.ext_cost > 0 && (
                        <Badge variant="secondary" className="text-xs">Servicios</Badge>
                    )}
                    {recipe.mat_cost === 0 && recipe.lab_cost === 0 && recipe.ext_cost === 0 && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">Sin recursos</Badge>
                    )}
                    {/* Status badge — only non-active */}
                    {currentStatus !== "active" && (
                        <Badge
                            variant="secondary"
                            className={`text-xs gap-1 ${STATUS_CONFIG[currentStatus]?.badgeClass ?? ""}`}
                        >
                            <Circle className="h-2 w-2 fill-current" />
                            {STATUS_CONFIG[currentStatus]?.label}
                        </Badge>
                    )}
                </ListItem.Badges>
            </ListItem.Content>

            {/* Trailing: cost */}
            <ListItem.Trailing>
                <ListItem.Value>
                    {recipe.total_cost > 0 ? formatCurrency(recipe.total_cost) : "—"}
                </ListItem.Value>
                {recipe.item_count > 0 && (
                    <ListItem.ValueSubtext>
                        {recipe.item_count} {recipe.item_count === 1 ? "recurso" : "recursos"}
                    </ListItem.ValueSubtext>
                )}
            </ListItem.Trailing>
        </ListItem>
    );
});
