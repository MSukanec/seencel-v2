"use client";

import { ColumnDef } from "@tanstack/react-table";
import { createTextColumn } from "@/components/shared/data-table/columns";
import { GeneralCost } from "@/features/general-costs/types";

// ─── Column Factory ─────────────────────────────────────

export function getGeneralCostConceptColumns(): ColumnDef<GeneralCost>[] {
    return [
        // 1. Nombre
        createTextColumn<GeneralCost>({
            accessorKey: "name",
            title: "Nombre",
        }),
        // 2. Categoría — uses customRender to access nested object
        createTextColumn<GeneralCost>({
            accessorKey: "category",
            title: "Categoría",
            muted: true,
            emptyValue: "Sin categoría",
            customRender: (_value, row) => row.category?.name ?? null,
        }),
        // 3. Recurrencia — computed from is_recurring + recurrence_interval
        createTextColumn<GeneralCost>({
            accessorKey: "is_recurring",
            title: "Recurrencia",
            muted: true,
            customRender: (_value, row) => {
                if (!row.is_recurring) return "Único";
                const interval = row.recurrence_interval === "monthly" ? "Mensual" : row.recurrence_interval;
                return row.expected_day ? `${interval} (Día ${row.expected_day})` : interval ?? "Recurrente";
            },
        }),
        // 4. Descripción
        createTextColumn<GeneralCost>({
            accessorKey: "description",
            title: "Descripción",
            secondary: true,
            emptyValue: "-",
        }),
    ];
}
