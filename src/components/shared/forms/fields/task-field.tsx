/**
 * Task Field Factory
 * Double-Select: Catalog Task + Recipe Selector
 *
 * Features:
 * - Filters only active tasks (status = 'active')
 * - Shows task badges (unit, code, division)
 * - Recipe selector always visible, disabled until task is selected
 * - Auto-selects recipe when only one is available
 * - Full width layout, no label on recipe (just placeholder)
 */

"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { SelectField, type SelectOption } from "./select-field";
import type { TaskRecipeView } from "@/features/tasks/types";

// ============================================================================
// Types
// ============================================================================

export interface CatalogTaskOption {
    id: string;
    name: string | null;
    custom_name: string | null;
    unit_name?: string;
    unit_symbol?: string;
    division_name?: string;
    code: string | null;
    status?: string | null;
}

export interface TaskFieldProps {
    /** Selected task ID */
    taskValue: string | null;
    /** Callback when task value changes */
    onTaskChange: (taskId: string | null) => void;
    /** Selected recipe ID */
    recipeValue: string | null;
    /** Callback when recipe value changes */
    onRecipeChange: (recipeId: string | null) => void;
    /** Available catalog tasks (will be filtered to active only) */
    catalogTasks: CatalogTaskOption[];
    /** Function to fetch recipes for a given task */
    fetchRecipes: (taskId: string) => Promise<TaskRecipeView[]>;
    /** Task field label */
    taskLabel?: string;
    /** Task placeholder */
    taskPlaceholder?: string;
    /** Recipe placeholder */
    recipePlaceholder?: string;
    /** Require task selection */
    taskRequired?: boolean;
    /** Require recipe selection */
    recipeRequired?: boolean;
    /** Disable the entire component */
    disabled?: boolean;
    /** Error message for task field */
    taskError?: string;
    /** Error message for recipe field */
    recipeError?: string;
}

// ============================================================================
// Component
// ============================================================================

export function TaskField({
    taskValue,
    onTaskChange,
    recipeValue,
    onRecipeChange,
    catalogTasks,
    fetchRecipes,
    taskLabel = "Tarea del Catálogo",
    taskPlaceholder = "Seleccionar tarea...",
    recipePlaceholder = "Seleccionar receta (opcional)",
    taskRequired = true,
    recipeRequired = false,
    disabled = false,
    taskError,
    recipeError,
}: TaskFieldProps) {
    // --- Recipe state ---
    const [availableRecipes, setAvailableRecipes] = useState<TaskRecipeView[]>([]);
    const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);

    // --- Filter active tasks only ---
    const activeTasks = useMemo(() =>
        catalogTasks.filter(t => t.status === 'active'),
        [catalogTasks]
    );

    // --- Build SelectField options for catalog tasks ---
    const catalogTaskOptions: SelectOption[] = useMemo(() => {
        return activeTasks.map((t) => {
            const label = t.name || t.custom_name || "Sin nombre";
            return {
                value: t.id,
                label,
                searchTerms: `${label} ${t.code || ""} ${t.unit_name || ""} ${t.division_name || ""}`,
            };
        });
    }, [activeTasks]);

    // --- Map for quick lookup of task metadata ---
    const catalogTaskMap = useMemo(() => {
        const map = new Map<string, CatalogTaskOption>();
        for (const t of activeTasks) {
            map.set(t.id, t);
        }
        return map;
    }, [activeTasks]);

    // --- Custom render for catalog task options ---
    const renderCatalogTaskOption = useCallback((option: SelectOption) => {
        const task = catalogTaskMap.get(option.value);
        const badges = [
            task?.unit_symbol || task?.unit_name,
            task?.code,
            task?.division_name,
        ].filter(Boolean);

        return (
            <div className="flex flex-col gap-1 py-0.5 min-w-0">
                <span className="text-sm truncate">{option.label}</span>
                {badges.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                        {badges.map((badge, i) => (
                            <span
                                key={i}
                                className="inline-flex items-center px-1.5 py-0 rounded text-[10px] font-medium bg-primary/90 text-primary-foreground leading-4"
                            >
                                {badge}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        );
    }, [catalogTaskMap]);

    // --- Fetch recipes when task is selected ---
    useEffect(() => {
        if (taskValue) {
            setIsLoadingRecipes(true);
            fetchRecipes(taskValue)
                .then((recipes) => {
                    setAvailableRecipes(recipes);
                    // Auto-select if only one recipe and no current selection
                    if (recipes.length === 1 && !recipeValue) {
                        onRecipeChange(recipes[0].id);
                    }
                })
                .catch((error) => {
                    console.error("Error fetching recipes:", error);
                    setAvailableRecipes([]);
                })
                .finally(() => {
                    setIsLoadingRecipes(false);
                });
        } else {
            setAvailableRecipes([]);
            onRecipeChange(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [taskValue]);

    // --- Build recipe options ---
    const recipeOptions: SelectOption[] = useMemo(() => {
        return availableRecipes.map((r) => {
            const label = r.name || "Receta sin nombre";
            const details = [
                r.item_count > 0 ? `${r.item_count} ítems` : null,
                r.is_public ? "Pública" : "Propia",
            ].filter(Boolean).join(" · ");
            return {
                value: r.id,
                label: details ? `${label} — ${details}` : label,
                searchTerms: `${label} ${r.org_name || ""}`,
            };
        });
    }, [availableRecipes]);

    // --- Handle task change ---
    const handleTaskChange = useCallback((value: string) => {
        const newTaskId = value || null;
        onTaskChange(newTaskId);
        // Reset recipe when task changes
        if (newTaskId !== taskValue) {
            onRecipeChange(null);
        }
    }, [onTaskChange, onRecipeChange, taskValue]);

    // --- Compute recipe placeholder ---
    const computedRecipePlaceholder = !taskValue
        ? "Primero seleccioná una tarea"
        : isLoadingRecipes
            ? "Cargando recetas..."
            : availableRecipes.length === 0
                ? "Sin recetas disponibles"
                : recipePlaceholder;

    // --- Render ---
    return (
        <div className="w-full space-y-1">
            {/* Task Selector */}
            <SelectField
                value={taskValue || ""}
                onChange={handleTaskChange}
                options={catalogTaskOptions}
                label={taskLabel}
                placeholder={taskPlaceholder}
                searchable
                searchPlaceholder="Buscar por nombre, código o división..."
                required={taskRequired}
                disabled={disabled}
                error={taskError}
                renderOption={renderCatalogTaskOption}
                emptyState={{
                    message: "No se encontraron tareas activas",
                }}
            />

            {/* Recipe Selector — always visible, disabled without task */}
            <SelectField
                value={recipeValue || ""}
                onChange={(v) => onRecipeChange(v || null)}
                options={recipeOptions}
                placeholder={computedRecipePlaceholder}
                searchable
                searchPlaceholder="Buscar receta..."
                required={recipeRequired}
                disabled={disabled || !taskValue || isLoadingRecipes || availableRecipes.length === 0}
                loading={isLoadingRecipes}
                error={recipeError}
                emptyState={{
                    message: "No se encontraron recetas",
                }}
            />
        </div>
    );
}
