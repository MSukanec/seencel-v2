"use client";

import { type ColumnDef } from "@tanstack/react-table";
import {
    createStatusColumn,
    createEntityColumn,
    createUnitColumn,
    type StatusOption,
} from "@/components/shared/data-table/columns";
import { EDITABLE_CELL_CLASS } from "@/components/shared/data-table/columns/column-styles";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { type TaskView, type TaskDivision, type Unit } from "@/features/tasks/types";
import { Ruler } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Status Config ──────────────────────────────────────
export const TASK_STATUS_CONFIG: StatusOption[] = [
    { value: "active", label: "Activa", variant: "positive" },
    { value: "draft", label: "Borrador", variant: "neutral" },
    { value: "archived", label: "Archivada", variant: "warning" },
];

export const TASK_STATUS_OPTIONS = TASK_STATUS_CONFIG.map(
    ({ value, label }) => ({ label, value })
);



// ─── Task Name Cell (inline editable) ───────────────────

import * as React from "react";

function TaskNameCell({
    name,
    code,
    onUpdate,
}: {
    name: string;
    code: string | null | undefined;
    onUpdate: (newName: string) => Promise<void> | void;
}) {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState(name);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleStartEditing = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditValue(name);
        setIsEditing(true);
        setTimeout(() => inputRef.current?.select(), 10);
    };

    const handleSave = () => {
        setIsEditing(false);
        if (editValue !== name && editValue.trim()) {
            onUpdate(editValue.trim());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") { e.preventDefault(); handleSave(); }
        if (e.key === "Escape") { setIsEditing(false); }
    };

    if (isEditing) {
        return (
            <div className="flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
                <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSave}
                    placeholder="Nombre de la tarea..."
                    className={cn(
                        "h-7 px-2 text-sm bg-background border border-border rounded-md",
                        "focus:outline-none focus:ring-1 focus:ring-ring",
                    )}
                />
                {code && (
                    <span className="text-xs text-muted-foreground font-mono px-2">{code}</span>
                )}
            </div>
        );
    }

    return (
        <button
            className={cn("flex flex-col gap-0 text-left", EDITABLE_CELL_CLASS)}
            onClick={handleStartEditing}
        >
            <span className="text-sm font-medium truncate">{name}</span>
            {code && (
                <span className="text-xs text-muted-foreground font-mono">{code}</span>
            )}
        </button>
    );
}

// ─── Column Factory ─────────────────────────────────────

interface TaskColumnsOptions {
    divisions?: TaskDivision[];
    activeDivisionKey?: "division_name" | "system_division_name";
    units?: Unit[];
    onStatusChange?: (task: TaskView, status: string) => void;
    onInlineUpdate?: (task: TaskView, updates: Record<string, any>) => Promise<void> | void;
}

export function getTaskColumns(
    options: TaskColumnsOptions = {}
): ColumnDef<TaskView>[] {
    const { divisions = [], activeDivisionKey = "division_name", units = [], onStatusChange, onInlineUpdate } = options;

    // Build division options for entity column
    const divisionOptions = divisions
        .filter(d => !d.parent_id)
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
        .map(d => ({
            value: d.name,
            label: d.order != null ? `${d.order}. ${d.name}` : d.name,
        }));

    return [
        // 1. Nombre — con subtítulo del código, editable inline
        {
            accessorKey: "name",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
            size: 300,
            enableHiding: false,
            enableSorting: true,
            meta: { fillWidth: true },
            cell: ({ row }) => {
                const task = row.original;
                const name = task.name || task.custom_name || "Sin nombre";
                const code = task.code;

                if (onInlineUpdate && !task.is_system) {
                    return (
                        <TaskNameCell
                            name={name}
                            code={code}
                            onUpdate={(newName) => onInlineUpdate(task, { name: newName, custom_name: newName })}
                        />
                    );
                }

                return (
                    <div className="flex flex-col gap-0">
                        <span className="text-sm font-medium truncate">{name}</span>
                        {code && (
                            <span className="text-xs text-muted-foreground font-mono">{code}</span>
                        )}
                    </div>
                );
            },
        },

        // 2. Rubro — entity column, editable inline
        createEntityColumn<TaskView>({
            accessorKey: activeDivisionKey,
            title: "Rubro",
            emptyValue: "Sin rubro",
            entityOptions: divisionOptions,
            size: 180,
            editable: !!onInlineUpdate,
            editSearchPlaceholder: "Buscar rubro...",
            emptySearchMessage: "No hay rubros creados.",
            onUpdate: onInlineUpdate
                ? (row, newValue) => onInlineUpdate(row, { [activeDivisionKey]: newValue })
                : undefined,
        }),

        // 3. Unidad — unit column, editable inline
        createUnitColumn<TaskView>({
            accessorKey: "unit_name",
            title: "Unidad",
            size: 140,
            editable: !!onInlineUpdate,
            unitOptions: units.map(u => ({
                value: u.id,
                label: u.name,
                symbol: u.symbol || undefined,
            })),
            onUpdate: onInlineUpdate
                ? (row, newValue) => {
                    const unit = units.find(u => u.id === newValue);
                    if (unit) onInlineUpdate(row, { unit_id: unit.id, unit_symbol: unit.symbol, unit_name: unit.name });
                }
                : undefined,
        }),



        // 5. Precio (si disponible)
        {
            accessorKey: "total_price",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Precio" />,
            size: 120,
            enableSorting: true,
            cell: ({ row }) => {
                const value = row.original.total_price;
                if (value == null || value === 0) {
                    return <span className="text-xs text-muted-foreground">Sin precio</span>;
                }
                return (
                    <span className="text-sm font-mono tabular-nums text-right">
                        {value.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                );
            },
        },

        // 6. Estado (última columna)
        createStatusColumn<TaskView>({
            accessorKey: "status",
            title: "Estado",
            options: TASK_STATUS_CONFIG,
            showLabel: true,
            editable: !!onStatusChange,
            onUpdate: onStatusChange
                ? (row, newValue) => onStatusChange(row, newValue)
                : undefined,
            size: 110,
        }),
    ];
}
