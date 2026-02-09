"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ConstructionTaskView, ConstructionTaskStatus, STATUS_CONFIG } from "../types";
import { createTextColumn } from "@/components/shared/data-table/columns/text-column";
import { createDateColumn } from "@/components/shared/data-table/columns/date-column";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { DataTableRowActions } from "@/components/shared/data-table/data-table-row-actions";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// ============================================================================
// Column definitions for Construction Tasks DataTable
// ============================================================================

interface ColumnCallbacks {
    onEdit: (task: ConstructionTaskView) => void;
    onDelete: (task: ConstructionTaskView) => void;
    onStatusChange: (task: ConstructionTaskView, status: string) => void;
}

export function getConstructionTaskColumns(
    callbacks: ColumnCallbacks
): ColumnDef<ConstructionTaskView, any>[] {
    return [
        // --- Tarea ---
        createTextColumn<ConstructionTaskView>({
            accessorKey: "task_name",
            title: "Tarea",
            truncate: 220,
            subtitle: (row) => row.division_name,
            customRender: (value, row) => {
                const name = value || row.custom_name || "Sin nombre";
                return (
                    <div className="flex flex-col" style={{ maxWidth: "220px" }}>
                        <span className="text-sm font-medium truncate">{name}</span>
                        {row.division_name && (
                            <span className="text-xs text-muted-foreground truncate">
                                {row.division_name}
                            </span>
                        )}
                    </div>
                );
            },
        }),

        // --- Estado ---
        {
            accessorKey: "status",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
            cell: ({ row }) => {
                const status = row.getValue("status") as ConstructionTaskStatus;
                const config = STATUS_CONFIG[status];
                return (
                    <Badge
                        variant="outline"
                        className={cn(
                            "text-xs font-medium whitespace-nowrap",
                            config?.color,
                            config?.bgColor
                        )}
                    >
                        {config?.label || status}
                    </Badge>
                );
            },
            enableSorting: true,
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id));
            },
        },

        // --- Avance ---
        {
            accessorKey: "progress_percent",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Avance" />,
            cell: ({ row }) => {
                const progress = (row.getValue("progress_percent") as number) || 0;
                return (
                    <div className="flex items-center gap-2 min-w-[100px]">
                        <Progress value={progress} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground w-8 text-right">
                            {progress}%
                        </span>
                    </div>
                );
            },
            enableSorting: true,
        },

        // --- Fecha inicio ---
        createDateColumn<ConstructionTaskView>({
            accessorKey: "planned_start_date",
            title: "Inicio",
            showAvatar: false,
            relativeMode: "today-only",
        }),

        // --- Fecha fin ---
        createDateColumn<ConstructionTaskView>({
            accessorKey: "planned_end_date",
            title: "Fin",
            showAvatar: false,
            relativeMode: "today-only",
        }),

        // --- Duración ---
        {
            accessorKey: "duration_in_days",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Duración" />,
            cell: ({ row }) => {
                const days = row.getValue("duration_in_days") as number | null;
                if (!days) return <span className="text-muted-foreground">-</span>;
                return (
                    <span className="text-sm">
                        {days} {days === 1 ? "día" : "días"}
                    </span>
                );
            },
            enableSorting: true,
        },

        // --- Fase ---
        createTextColumn<ConstructionTaskView>({
            accessorKey: "phase_name",
            title: "Fase",
            muted: true,
            emptyValue: "-",
        }),

        // --- Cantidad ---
        {
            accessorKey: "quantity",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Cantidad" />,
            cell: ({ row }) => {
                const qty = row.getValue("quantity") as number | null;
                const unit = row.original.unit;
                if (!qty) return <span className="text-muted-foreground">-</span>;
                return (
                    <span className="text-sm">
                        {qty.toLocaleString("es-AR")}
                        {unit && <span className="text-muted-foreground ml-1">{unit}</span>}
                    </span>
                );
            },
            enableSorting: true,
        },

        // --- Acciones ---
        {
            id: "actions",
            cell: ({ row }) => (
                <DataTableRowActions
                    row={row}
                    onEdit={callbacks.onEdit}
                    onDelete={callbacks.onDelete}
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
    ];
}
