/**
 * DataTableContextMenu — Right-click context menu for DataTable rows (Linear-style)
 *
 * Reads `column.columnDef.meta.contextMenu` from visible columns to dynamically
 * generate menu items with submenus for editable fields.
 *
 * Usage: Wrap each TableRow with <ContextMenu>/<ContextMenuTrigger>
 * The DataTable component handles this automatically when `enableContextMenu` is true.
 */

"use client";

import * as React from "react";
import { Check, Pencil, Copy, Trash2, Eye } from "lucide-react";
import { type Table, type Row } from "@tanstack/react-table";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";

// ─── Types ───────────────────────────────────────────────

export interface ContextMenuOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
}

export interface ColumnContextMenuConfig<TData = any> {
    /** Display label in the context menu (e.g. "Estado", "Billetera") */
    label: string;
    /** Icon to show next to the label */
    icon?: React.ComponentType<{ className?: string }>;
    /** Type: "submenu" renders options as submenu, "action" renders a single clickable item */
    type?: "submenu" | "action";
    /** Available options for the submenu (only for type="submenu") */
    options?: ContextMenuOption[];
    /** Accessor key to get the current value from the row */
    currentValueKey?: string;
    /** Callback when an option is selected (for submenu items) */
    onSelect?: (row: TData, value: string) => void;
    /** Callback when the action item is clicked (for type="action") */
    onAction?: (row: TData) => void;
}

export interface DataTableContextMenuProps<TData> {
    /** The row being right-clicked */
    row: Row<TData>;
    /** The table instance (to read column metadata) */
    table: Table<TData>;
    /** Children (the TableRow content) */
    children: React.ReactNode;
    /** Edit handler */
    onEdit?: (data: TData) => void;
    /** View handler */
    onView?: (data: TData) => void;
    /** Duplicate handler */
    onDuplicate?: (data: TData) => void;
    /** Delete handler */
    onDelete?: (data: TData) => void;
    /** Custom actions from DataTable */
    customActions?: {
        label: string;
        icon?: React.ReactNode;
        onClick: (data: TData) => void;
        variant?: "default" | "destructive";
    }[];
}

// ─── Component ───────────────────────────────────────────

export function DataTableContextMenuWrapper<TData>({
    row,
    table,
    children,
    onEdit,
    onView,
    onDuplicate,
    onDelete,
    customActions,
}: DataTableContextMenuProps<TData>) {
    const data = row.original;

    // Collect context menu configs from column metadata
    const contextMenuItems: ColumnContextMenuConfig<TData>[] = [];
    for (const column of table.getVisibleLeafColumns()) {
        const meta = column.columnDef.meta as any;
        if (meta?.contextMenu) {
            contextMenuItems.push(meta.contextMenu);
        }
    }

    const hasStandardActions = onEdit || onView || onDuplicate;
    const hasColumnMenus = contextMenuItems.length > 0;
    const hasCustomActions = customActions && customActions.length > 0;

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                {children}
            </ContextMenuTrigger>
            <ContextMenuContent className="w-56">
                {/* Standard actions: View, Edit, Duplicate */}
                {onView && (
                    <ContextMenuItem
                        onSelect={() => onView(data)}
                        className="gap-2 text-xs"
                    >
                        <Eye className="h-3.5 w-3.5" />
                        Ver detalle
                    </ContextMenuItem>
                )}
                {onEdit && (
                    <ContextMenuItem
                        onSelect={() => onEdit(data)}
                        className="gap-2 text-xs"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                    </ContextMenuItem>
                )}
                {onDuplicate && (
                    <ContextMenuItem
                        onSelect={() => onDuplicate(data)}
                        className="gap-2 text-xs"
                    >
                        <Copy className="h-3.5 w-3.5" />
                        Duplicar
                    </ContextMenuItem>
                )}

                {/* Column-based submenus (Status, Wallet, Currency, etc.) */}
                {hasColumnMenus && (
                    <>
                        {hasStandardActions && <ContextMenuSeparator />}
                        {contextMenuItems.map((item, index) => {
                            const Icon = item.icon;

                            // Type "action" — single clickable item (e.g. date pickers)
                            if (item.type === "action") {
                                return (
                                    <ContextMenuItem
                                        key={index}
                                        onSelect={() => item.onAction?.(data)}
                                        className="gap-2 text-xs"
                                    >
                                        {Icon && <Icon className="h-3.5 w-3.5" />}
                                        {item.label}
                                    </ContextMenuItem>
                                );
                            }

                            // Type "submenu" (default) — submenu with options
                            const currentValue = item.currentValueKey ? (data as any)[item.currentValueKey] : undefined;

                            return (
                                <ContextMenuSub key={index}>
                                    <ContextMenuSubTrigger className="gap-2 text-xs">
                                        {Icon && <Icon className="h-3.5 w-3.5" />}
                                        {item.label}
                                    </ContextMenuSubTrigger>
                                    <ContextMenuSubContent className="w-48">
                                        {(item.options || []).map((option) => (
                                            <ContextMenuItem
                                                key={option.value}
                                                onSelect={() => item.onSelect?.(data, option.value)}
                                                className="gap-2 text-xs"
                                            >
                                                {option.icon && (
                                                    <span className="flex-shrink-0">{option.icon}</span>
                                                )}
                                                <span className="flex-1">{option.label}</span>
                                                {currentValue === option.value && (
                                                    <Check className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                                                )}
                                            </ContextMenuItem>
                                        ))}
                                    </ContextMenuSubContent>
                                </ContextMenuSub>
                            );
                        })}
                    </>
                )}

                {/* Custom actions */}
                {hasCustomActions && (
                    <>
                        {(hasStandardActions || hasColumnMenus) && <ContextMenuSeparator />}
                        {customActions!.map((action, index) => (
                            <ContextMenuItem
                                key={index}
                                onSelect={() => action.onClick(data)}
                                className={`gap-2 text-xs ${action.variant === "destructive" ? "text-destructive focus:text-destructive" : ""}`}
                            >
                                {action.icon}
                                {action.label}
                            </ContextMenuItem>
                        ))}
                    </>
                )}

                {/* Delete — always last, always destructive */}
                {onDelete && (
                    <>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                            onSelect={() => onDelete(data)}
                            variant="destructive"
                            className="gap-2 text-xs"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Eliminar
                        </ContextMenuItem>
                    </>
                )}
            </ContextMenuContent>
        </ContextMenu>
    );
}
