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
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Link2, Circle } from "lucide-react";
import { ResourcePriceDisplay } from "@/components/shared/price-pulse-popover";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

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
    status?: string | null; // 'draft' | 'active' | 'archived'
    // Optional: parametric fields
    is_parametric?: boolean;
    action_name?: string | null;
    element_name?: string | null;
    // Optional: price info (from recipes)
    total_price?: number | null;
    currency_symbol?: string | null;
    price_valid_from?: string | null;
    // Optional: usage info
    usage_count?: number;
    quote_usage_count?: number;
    construction_usage_count?: number;
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
    /** Callback when status changes (quick-change from menu) */
    onStatusChange?: (task: any, status: "draft" | "active" | "archived") => void;
    /** Hide the division badge (used when tasks are grouped by division with section headers) */
    hideDivisionBadge?: boolean;
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
        badgeClass: null, // No badge for active — it's the default visible state
    },
    archived: {
        label: "Archivada",
        dotClass: "fill-muted-foreground text-muted-foreground",
        badgeClass: "text-muted-foreground",
    },
} as const;

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
    onStatusChange,
    hideDivisionBadge = false,
}: TaskListItemProps) {
    // System tasks are NEVER editable — they are immutable by design
    const isEditable = canEdit ?? !task.is_system;
    const displayName = task.name || task.custom_name || "Sin nombre";
    const unitDisplay = task.unit_symbol || task.unit_name || null;

    const currentStatus = (task.status ?? "active") as "draft" | "active" | "archived";

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
                    {/* Division (Rubro) badge — hidden when using grouped section headers */}
                    {!hideDivisionBadge && task.division_name && (
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
                    {/* Legacy fallback: is_published=false without new status column */}
                    {!task.is_published && !task.status && (
                        <Badge variant="secondary" className="text-xs text-muted-foreground">
                            Borrador
                        </Badge>
                    )}
                    {/* Status badge — only shown for non-active states */}
                    {task.status && task.status !== "active" && (
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

            {/* Right side: Usage badge + Price */}
            <div className="flex items-center gap-3 mr-2">
                {/* Usage indicator */}
                {(task.usage_count ?? 0) > 0 && (
                    <TooltipProvider delayDuration={200}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge
                                    variant="outline"
                                    className="text-xs gap-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 cursor-default shrink-0"
                                >
                                    <Link2 className="h-3 w-3" />
                                    En uso · {task.usage_count}
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="text-xs">
                                <div className="flex flex-col gap-0.5">
                                    {(task.quote_usage_count ?? 0) > 0 && (
                                        <span>{task.quote_usage_count} {task.quote_usage_count === 1 ? 'presupuesto' : 'presupuestos'}</span>
                                    )}
                                    {(task.construction_usage_count ?? 0) > 0 && (
                                        <span>{task.construction_usage_count} {task.construction_usage_count === 1 ? 'obra' : 'obras'}</span>
                                    )}
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}

                {/* Price + Unit */}
                <div className="flex flex-col items-end min-w-[100px]">
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
                            {/* Editar */}
                            {onEdit && (
                                <DropdownMenuItem onClick={() => onEdit(task)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                </DropdownMenuItem>
                            )}

                            {/* Estado — submenú con radio al estilo GPT */}
                            {onStatusChange && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>
                                            <Circle
                                                className={`mr-2 h-3 w-3 ${STATUS_CONFIG[currentStatus].dotClass}`}
                                            />
                                            Estado
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent>
                                            <DropdownMenuRadioGroup
                                                value={currentStatus}
                                                onValueChange={(val) =>
                                                    onStatusChange(task, val as "draft" | "active" | "archived")
                                                }
                                            >
                                                <DropdownMenuRadioItem value="draft">
                                                    <Circle className="mr-2 h-3 w-3 fill-amber-500 text-amber-500" />
                                                    Borrador
                                                </DropdownMenuRadioItem>
                                                <DropdownMenuRadioItem value="active">
                                                    <Circle className="mr-2 h-3 w-3 fill-emerald-500 text-emerald-500" />
                                                    Activa
                                                </DropdownMenuRadioItem>
                                                <DropdownMenuRadioItem value="archived">
                                                    <Circle className="mr-2 h-3 w-3 fill-muted-foreground text-muted-foreground" />
                                                    Archivada
                                                </DropdownMenuRadioItem>
                                            </DropdownMenuRadioGroup>
                                        </DropdownMenuSubContent>
                                    </DropdownMenuSub>
                                </>
                            )}

                            {/* Eliminar */}
                            {onDelete && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => onDelete(task)}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Eliminar
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </ListItem.Actions>
            )}
        </ListItem>
    );
});
