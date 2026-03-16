/**
 * DataTableContextMenu — Thin wrapper that adapts DataTable props to EntityContextMenu
 *
 * DataTable passes onView/onEdit/onDuplicate/onDelete/parameters/customActions as individual props.
 * This wrapper maps them to EntityContextMenu's structured API.
 *
 * For direct usage outside DataTable, use EntityContextMenu instead.
 */

"use client";

import * as React from "react";
import { type Table, type Row } from "@tanstack/react-table";
import {
    EntityContextMenu,
    type EntityCustomAction,
    type EntityParameter,
} from "@/components/shared/entity-context-menu";

// ─── Types (kept for backward compatibility) ─────────────

export interface ContextMenuOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
}

export interface ColumnContextMenuConfig<TData = any> {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    type?: "submenu" | "action";
    options?: ContextMenuOption[];
    currentValueKey?: string;
    onSelect?: (row: TData, value: string) => void;
    onAction?: (row: TData) => void;
}

export interface DataTableContextMenuProps<TData> {
    row: Row<TData>;
    table: Table<TData>;
    children: React.ReactNode;
    onEdit?: (data: TData) => void;
    onView?: (data: TData) => void;
    onDuplicate?: (data: TData) => void;
    onDelete?: (data: TData) => void;
    /** Entity parameter submenus (Zone 2) */
    parameters?: EntityParameter<TData>[];
    /** Custom actions (Zone 3) */
    customActions?: EntityCustomAction<TData>[];
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
    parameters,
    customActions,
}: DataTableContextMenuProps<TData>) {
    return (
        <EntityContextMenu
            data={row.original}
            onView={onView}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            parameters={parameters}
            customActions={customActions}
        >
            {children}
        </EntityContextMenu>
    );
}

