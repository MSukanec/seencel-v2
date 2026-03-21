"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ConstructionTaskView, ConstructionTaskStatus, STATUS_CONFIG } from "../types";
import { createTextColumn } from "@/components/shared/data-table/columns/text-column";
import { createDateColumn } from "@/components/shared/data-table/columns/date-column";
import { createStatusColumn } from "@/components/shared/data-table/columns/status-column";
import { createPercentColumn } from "@/components/shared/data-table/columns/percent-column";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";

// ============================================================================
// Constants
// ============================================================================

const STATUS_OPTIONS = (Object.keys(STATUS_CONFIG) as ConstructionTaskStatus[]).map((status) => ({
    value: status,
    label: STATUS_CONFIG[status].label,
}));

const STATUS_FILTER_OPTIONS = STATUS_OPTIONS;

// ============================================================================
// Column definitions for Construction Tasks DataTable
// ============================================================================

export function getConstructionTaskColumns(): ColumnDef<ConstructionTaskView, any>[] {
    return [
        // --- Tarea ---
        createTextColumn<ConstructionTaskView>({
            accessorKey: "task_name",
            title: "Tarea",
            truncate: 220,
            subtitle: (row) => row.division_name,
            customRender: (value, row) => {
                const name = value || row.custom_name || "Sin nombre";
                const subtitle = [row.division_name, row.recipe_name ? `Receta: ${row.recipe_name}` : null].filter(Boolean).join(" · ");
                return (
                    <div className="flex flex-col" style={{ maxWidth: "220px" }}>
                        <span className="text-sm font-medium truncate">{name}</span>
                        {subtitle && (
                            <span className="text-xs text-muted-foreground truncate">
                                {subtitle}
                            </span>
                        )}
                    </div>
                );
            },
        }),

        // --- Estado ---
        createStatusColumn<ConstructionTaskView>({
            accessorKey: "status",
            title: "Estado",
            options: STATUS_OPTIONS.map(opt => ({
                value: opt.value,
                label: opt.label,
                variant: opt.value === "completed" ? "positive"
                    : opt.value === "in_progress" ? "info"
                    : opt.value === "paused" ? "warning"
                    : "neutral" as any,
            })),
        }),

        // --- Avance ---
        createPercentColumn<ConstructionTaskView>({
            accessorKey: "progress_percent",
            title: "Avance",
        }),

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
    ];
}

export { STATUS_FILTER_OPTIONS };
