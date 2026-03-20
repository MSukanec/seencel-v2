"use client";

/**
 * recipes-columns.tsx — Column definitions for recipe list DataTable
 *
 * Used in the "Recetas" tab of the Task Detail view.
 * Columns: Nombre | Materiales | Mano de Obra | Servicios Ext. | Costo Total | Estado
 */

import { type ColumnDef } from "@tanstack/react-table";
import {
    createStatusColumn,
    createMoneyColumn,
    createTextColumn,
    type StatusOption,
} from "@/components/shared/data-table/columns";
import type { TaskRecipeView } from "@/features/tasks/types";

// ─── Status Config ──────────────────────────────────────
export const RECIPE_STATUS_CONFIG: StatusOption[] = [
    { value: "active", label: "Activa", variant: "positive" },
    { value: "draft", label: "Borrador", variant: "neutral" },
    { value: "archived", label: "Archivada", variant: "warning" },
];

// ─── Column Factory ─────────────────────────────────────

interface RecipeColumnsOptions {
    organizationId: string;
    onStatusChange?: (recipe: TaskRecipeView, status: string) => void;
    onNameChange?: (recipe: TaskRecipeView, newName: string) => void;
}

export function getRecipeColumns(
    options: RecipeColumnsOptions = { organizationId: "" }
): ColumnDef<TaskRecipeView>[] {
    const { onStatusChange, onNameChange } = options;

    return [
        // 1. Nombre — editable inline text
        createTextColumn<TaskRecipeView>({
            accessorKey: "name",
            title: "Nombre",
            size: 300,
            fillWidth: true,
            editable: !!onNameChange,
            onUpdate: onNameChange
                ? (row, newValue) => onNameChange(row, newValue)
                : undefined,
            editPlaceholder: "Nombre de la receta...",
            emptyValue: "Sin nombre",
        }),

        // 2. Materiales
        createMoneyColumn<TaskRecipeView>({
            accessorKey: "mat_cost",
            title: "Materiales",
            size: 120,
        }),

        // 3. Mano de Obra
        createMoneyColumn<TaskRecipeView>({
            accessorKey: "lab_cost",
            title: "Mano de Obra",
            size: 120,
        }),

        // 4. Servicios Ext.
        createMoneyColumn<TaskRecipeView>({
            accessorKey: "ext_cost",
            title: "Servicios Ext.",
            size: 120,
        }),

        // 5. Costo Total
        createMoneyColumn<TaskRecipeView>({
            accessorKey: "total_cost",
            title: "Costo Total",
            size: 130,
        }),

        // 6. Estado
        createStatusColumn<TaskRecipeView>({
            accessorKey: "status",
            title: "Estado",
            options: RECIPE_STATUS_CONFIG,
            showLabel: true,
            editable: !!onStatusChange,
            onUpdate: onStatusChange
                ? (row, newValue) => onStatusChange(row, newValue)
                : undefined,
            size: 110,
        }),
    ];
}

