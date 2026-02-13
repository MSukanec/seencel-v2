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
import { ResourcePriceDisplay } from "@/components/shared/price-pulse-popover";

// ============================================================================
// Types
// ============================================================================

export interface TaskListItemData {
    id: string;
    name: string | null;
    custom_name: string | null;
    code: string | null;
    description: string | null;
    unit_name?: string | null;
    unit_symbol?: string | null;
    division_name?: string | null;
    is_system: boolean;
    is_published: boolean;
    is_deleted: boolean;
    task_division_id: string | null;
    // Optional: parametric fields
    is_parametric?: boolean;
    action_name?: string | null;
    element_name?: string | null;
    // Optional: price info (from recipes)
    total_price?: number | null;
    currency_symbol?: string | null;
    price_valid_from?: string | null;
}

export interface TaskListItemProps {
    /** The task data to display */
    task: TaskListItemData;
    /** Whether this task can be edited/deleted (false for system tasks) */
    canEdit?: boolean;
    /** Whether this item is selected */
    selected?: boolean;
    /** Whether we're in admin mode */
    isAdminMode?: boolean;
    /** Callback when selection is toggled */
    onToggleSelect?: (id: string) => void;
    /** Callback when the item is clicked (e.g., navigate to detail) */
    onClick?: (task: any) => void;
    /** Callback when edit is clicked */
    onEdit?: (task: any) => void;
    /** Callback when delete is clicked */
    onDelete?: (task: any) => void;
}

// ============================================================================
// Component
// ============================================================================

export const TaskListItem = memo(function TaskListItem({
    task,
    canEdit,
    selected = false,
    isAdminMode = false,
    onToggleSelect,
    onClick,
    onEdit,
    onDelete,
}: TaskListItemProps) {
    // System tasks are NEVER editable — they are immutable by design
    const isEditable = canEdit ?? !task.is_system;
    const displayName = task.name || task.custom_name || "Sin nombre";
    const unitDisplay = task.unit_symbol || task.unit_name || null;

    const handleToggle = useCallback(() => {
        onToggleSelect?.(task.id);
    }, [onToggleSelect, task.id]);

    const handleClick = useCallback(() => {
        onClick?.(task);
    }, [onClick, task]);

    return (
        <ListItem
            variant="card"
            selected={selected}
            onClick={onClick ? handleClick : undefined}
        >
            {/* Selection Checkbox */}
            {onToggleSelect && (
                <ListItem.Checkbox
                    checked={selected}
                    onChange={handleToggle}
                />
            )}

            {/* Color indicator: system = amber-ish, org = indigo */}
            <ListItem.ColorStrip color={task.is_system ? "system" : "indigo"} />

            <ListItem.Content>
                {/* Line 1: Name + (unit symbol) */}
                <ListItem.Title className="text-base">
                    {displayName}
                    {unitDisplay && (
                        <span className="text-muted-foreground font-normal text-sm ml-2">
                            ({unitDisplay})
                        </span>
                    )}
                </ListItem.Title>
                {/* Line 2: Code + Badges */}
                <ListItem.Badges>
                    {/* Division (Rubro) badge */}
                    {task.division_name && (
                        <Badge variant="secondary" className="text-xs">
                            {task.division_name}
                        </Badge>
                    )}
                    {/* Code badge */}
                    {task.code && (
                        <Badge variant="secondary" className="text-xs">
                            {task.code}
                        </Badge>
                    )}
                    {/* Element badge (parametric tasks) */}
                    {task.element_name && (
                        <Badge variant="outline" className="text-xs">
                            {task.element_name}
                        </Badge>
                    )}
                    {/* Action badge (parametric tasks) */}
                    {task.action_name && (
                        <Badge variant="outline" className="text-xs">
                            {task.action_name}
                        </Badge>
                    )}
                    {/* Draft badge */}
                    {!task.is_published && (
                        <Badge variant="secondary" className="text-xs text-muted-foreground">
                            Borrador
                        </Badge>
                    )}
                </ListItem.Badges>
            </ListItem.Content>

            {/* Right side: Price + Unit below */}
            <div className="flex flex-col items-end mr-2 min-w-[100px]">
                <ResourcePriceDisplay
                    price={task.total_price}
                    currencySymbol={task.currency_symbol || "$"}
                    priceValidFrom={task.price_valid_from}
                />
                {unitDisplay && (
                    <span className="text-xs text-muted-foreground">
                        {task.unit_name || unitDisplay}
                    </span>
                )}
            </div>

            {/* Actions dropdown */}
            {isEditable && (onEdit || onDelete) && (
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
                                <DropdownMenuItem onClick={() => onEdit(task)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                </DropdownMenuItem>
                            )}
                            {onDelete && (
                                <DropdownMenuItem
                                    onClick={() => onDelete(task)}
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
