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
import { MoreHorizontal, Pencil, Trash2, Shield } from "lucide-react";

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
    division_name?: string | null;
    is_system: boolean;
    is_published: boolean;
    is_deleted: boolean;
    task_division_id: string | null;
    // Optional: parametric fields
    is_parametric?: boolean;
    action_name?: string | null;
    element_name?: string | null;
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
                <ListItem.Title className="text-base">
                    {task.code && (
                        <span className="text-muted-foreground font-mono text-sm mr-2">
                            [{task.code}]
                        </span>
                    )}
                    {displayName}
                </ListItem.Title>
                <ListItem.Badges>
                    {/* Unit badge */}
                    {task.unit_name && (
                        <Badge variant="secondary" className="text-xs">
                            {task.unit_name}
                        </Badge>
                    )}
                    {/* Division (Rubro) badge */}
                    {task.division_name && (
                        <Badge variant="secondary" className="text-xs">
                            {task.division_name}
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
                    {/* System badge — always visible for system tasks */}
                    {task.is_system ? (
                        <Badge variant="outline" className="text-xs gap-1 border-amber-500/30 text-amber-500">
                            <Shield className="h-3 w-3" />
                            Sistema
                        </Badge>
                    ) : (
                        <Badge variant="secondary" className="text-xs">
                            Propia
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
