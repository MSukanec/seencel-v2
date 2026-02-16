"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { useModal } from "@/stores/modal-store";
import { ConstructionTaskView, ConstructionTaskStatus, CostScope } from "../types";
import { createConstructionTask, updateConstructionTask, getRecipesForTask } from "../actions";
import { formatDateForDB, parseDateFromDB } from "@/lib/timezone-data";
import type { TaskRecipeView } from "@/features/tasks/types";
import { FormFooter } from "@/components/shared/forms/form-footer";
import {
    TextField,
    AmountField,
    DateField,
    NotesField,
    SelectField,
    type SelectOption,
} from "@/components/shared/forms/fields";

// ============================================================================
// Types
// ============================================================================

interface CatalogTask {
    id: string;
    name: string | null;
    custom_name: string | null;
    unit_name?: string;
    division_name?: string;
    code: string | null;
}

interface ConstructionTaskFormProps {
    projectId: string;
    organizationId: string;
    catalogTasks: CatalogTask[];
    initialData?: ConstructionTaskView | null;
}

// ============================================================================
// Options
// ============================================================================

const STATUS_OPTIONS: SelectOption[] = [
    { value: "pending", label: "Pendiente" },
    { value: "in_progress", label: "En Progreso" },
    { value: "completed", label: "Completada" },
    { value: "paused", label: "Pausada" },
];

const COST_SCOPE_OPTIONS: SelectOption[] = [
    { value: "materials_and_labor", label: "Materiales + Mano de Obra" },
    { value: "materials_only", label: "Solo Materiales" },
    { value: "labor_only", label: "Solo Mano de Obra" },
];

// ============================================================================
// Component
// ============================================================================

export function ConstructionTaskForm({
    projectId,
    organizationId,
    catalogTasks,
    initialData,
}: ConstructionTaskFormProps) {
    const router = useRouter();
    const { closeModal } = useModal();
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!initialData;

    // Internal lifecycle callbacks (semi-autonomous pattern)
    const handleSuccess = () => {
        closeModal();
        router.refresh();
    };

    const handleCancel = () => {
        closeModal();
    };

    // --- Task Selection ---
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(initialData?.task_id || null);
    const [isCustomTask, setIsCustomTask] = useState(
        isEditing ? !initialData?.task_id : false
    );

    // --- Recipe Selection ---
    const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(initialData?.recipe_id || null);
    const [availableRecipes, setAvailableRecipes] = useState<TaskRecipeView[]>([]);
    const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);

    // Fetch recipes when a catalog task is selected
    const fetchRecipes = useCallback(async (taskId: string) => {
        setIsLoadingRecipes(true);
        try {
            const recipes = await getRecipesForTask(taskId, organizationId);
            setAvailableRecipes(recipes);
            // Auto-select if only one recipe
            if (recipes.length === 1 && !isEditing) {
                setSelectedRecipeId(recipes[0].id);
            }
        } catch (error) {
            console.error("Error fetching recipes:", error);
            setAvailableRecipes([]);
        } finally {
            setIsLoadingRecipes(false);
        }
    }, [organizationId, isEditing]);

    useEffect(() => {
        if (selectedTaskId && !isCustomTask) {
            fetchRecipes(selectedTaskId);
        } else {
            setAvailableRecipes([]);
            setSelectedRecipeId(null);
        }
    }, [selectedTaskId, isCustomTask, fetchRecipes]);

    // Build SelectField options for catalog tasks
    const catalogTaskOptions: SelectOption[] = useMemo(() => {
        return catalogTasks.map((t) => {
            const label = t.name || t.custom_name || "Sin nombre";
            const subtitle = [t.code, t.unit_name, t.division_name].filter(Boolean).join(" · ");
            return {
                value: t.id,
                label: subtitle ? `${label} — ${subtitle}` : label,
                searchTerms: `${label} ${t.code || ""} ${t.division_name || ""}`,
            };
        });
    }, [catalogTasks]);

    // Build SelectField options for recipes
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

    // --- Form Fields ---
    const [customName, setCustomName] = useState(initialData?.custom_name || "");
    const [customUnit, setCustomUnit] = useState(initialData?.custom_unit || "");
    const [quantity, setQuantity] = useState(initialData?.quantity?.toString() || "1");
    const [plannedStartDate, setPlannedStartDate] = useState<Date | undefined>(
        parseDateFromDB(initialData?.planned_start_date) ?? undefined
    );
    const [plannedEndDate, setPlannedEndDate] = useState<Date | undefined>(
        parseDateFromDB(initialData?.planned_end_date) ?? undefined
    );
    const [status, setStatus] = useState<ConstructionTaskStatus>(initialData?.status || "pending");
    const [progressPercent, setProgressPercent] = useState(initialData?.progress_percent?.toString() || "0");
    const [notes, setNotes] = useState(initialData?.notes || "");
    const [costScope, setCostScope] = useState(initialData?.cost_scope || "materials_and_labor");

    // --- Validation ---
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};

        // Must either select a catalog task or provide a custom name
        if (!isCustomTask && !selectedTaskId) {
            newErrors.task = "Seleccioná una tarea del catálogo";
        }
        if (isCustomTask && !customName.trim()) {
            newErrors.customName = "El nombre es requerido";
        }

        const qty = parseFloat(quantity);
        if (isNaN(qty) || qty <= 0) {
            newErrors.quantity = "La cantidad debe ser mayor a 0";
        }

        const progress = parseInt(progressPercent);
        if (isNaN(progress) || progress < 0 || progress > 100) {
            newErrors.progressPercent = "El progreso debe ser entre 0 y 100";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // --- Handlers ---

    const handleToggleCustom = () => {
        setIsCustomTask(!isCustomTask);
        setSelectedTaskId(null);
        setSelectedRecipeId(null);
        setAvailableRecipes([]);
        setCustomName("");
        setCustomUnit("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsLoading(true);

        try {
            const payload = {
                task_id: isCustomTask ? null : selectedTaskId,
                recipe_id: isCustomTask ? null : selectedRecipeId,
                custom_name: isCustomTask ? customName.trim() : null,
                custom_unit: isCustomTask ? (customUnit.trim() || null) : null,
                quantity: parseFloat(quantity),
                planned_start_date: formatDateForDB(plannedStartDate),
                planned_end_date: formatDateForDB(plannedEndDate),
                status: status,
                progress_percent: parseInt(progressPercent),
                notes: notes.trim() || null,
                cost_scope: costScope as "materials_and_labor" | "materials_only" | "labor_only",
            };

            const result = isEditing
                ? await updateConstructionTask(initialData.id, projectId, payload)
                : await createConstructionTask(projectId, organizationId, payload);

            if (result.success) {
                toast.success(isEditing ? "Tarea actualizada" : "Tarea creada");
                handleSuccess();
            } else {
                toast.error(result.error || "Error al guardar la tarea");
            }
        } catch (error) {
            toast.error("Error inesperado");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Render ---

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            {/* Contenido scrolleable */}
            <div className="flex-1 overflow-y-auto">
                <div className="space-y-4">

                    {/* =================================== */}
                    {/* SECCIÓN 1: Selección de Tarea       */}
                    {/* =================================== */}

                    {!isCustomTask ? (
                        <>
                            <SelectField
                                value={selectedTaskId || ""}
                                onChange={(v) => {
                                    setSelectedTaskId(v || null);
                                    setErrors(prev => ({ ...prev, task: "" }));
                                }}
                                options={catalogTaskOptions}
                                label="Tarea del Catálogo"
                                placeholder="Seleccionar tarea..."
                                searchable
                                searchPlaceholder="Buscar por nombre, código o división..."
                                required
                                disabled={isEditing}
                                error={errors.task}
                                emptyState={{
                                    message: "No se encontraron tareas",
                                }}
                            />

                            {/* Toggle a tarea custom */}
                            {!isEditing && (
                                <button
                                    type="button"
                                    onClick={handleToggleCustom}
                                    className="text-xs text-primary hover:underline -mt-2"
                                >
                                    Crear tarea personalizada (sin catálogo)
                                </button>
                            )}

                            {/* Recipe Selector — only when task has recipes */}
                            {selectedTaskId && availableRecipes.length > 0 && (
                                <SelectField
                                    value={selectedRecipeId || ""}
                                    onChange={(v) => setSelectedRecipeId(v || null)}
                                    options={recipeOptions}
                                    label="Receta"
                                    placeholder={isLoadingRecipes ? "Cargando recetas..." : "Seleccionar receta (opcional)"}
                                    searchable
                                    searchPlaceholder="Buscar receta..."
                                    required={false}
                                    disabled={isLoadingRecipes}
                                    loading={isLoadingRecipes}
                                    emptyState={{
                                        message: "No se encontraron recetas",
                                    }}
                                />
                            )}
                        </>
                    ) : (
                        /* Tarea Custom */
                        <>
                            <TextField
                                value={customName}
                                onChange={setCustomName}
                                label="Nombre de la tarea"
                                placeholder="Ej: Limpieza general de obra"
                                required
                                autoFocus
                                error={errors.customName}
                            />

                            <TextField
                                value={customUnit}
                                onChange={setCustomUnit}
                                label="Unidad"
                                placeholder="m², ml, un, gl"
                                required={false}
                            />

                            {/* Toggle a catálogo */}
                            {!isEditing && (
                                <button
                                    type="button"
                                    onClick={handleToggleCustom}
                                    className="text-xs text-primary hover:underline -mt-2"
                                >
                                    ← Seleccionar del catálogo
                                </button>
                            )}
                        </>
                    )}

                    {/* =================================== */}
                    {/* SECCIÓN 2: Datos de Ejecución       */}
                    {/* =================================== */}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                        {/* Cantidad */}
                        <AmountField
                            value={quantity}
                            onChange={setQuantity}
                            label="Cantidad"
                            placeholder="100"
                            min={0}
                            step={0.01}
                        />

                        {/* Alcance de Costos */}
                        <SelectField
                            value={costScope}
                            onChange={(v) => setCostScope(v as CostScope)}
                            options={COST_SCOPE_OPTIONS}
                            label="Alcance de Costos"
                            required={false}
                        />

                        {/* Fecha inicio planificada */}
                        <DateField
                            value={plannedStartDate}
                            onChange={setPlannedStartDate}
                            label="Inicio planificado"
                            required={false}
                        />

                        {/* Fecha fin planificada */}
                        <DateField
                            value={plannedEndDate}
                            onChange={setPlannedEndDate}
                            label="Fin planificado"
                            required={false}
                        />

                        {/* Estado */}
                        <SelectField
                            value={status}
                            onChange={(v) => setStatus(v as ConstructionTaskStatus)}
                            options={STATUS_OPTIONS}
                            label="Estado"
                            required={false}
                        />

                        {/* Progreso */}
                        <AmountField
                            value={progressPercent}
                            onChange={setProgressPercent}
                            label="Progreso (%)"
                            placeholder="0"
                            min={0}
                            step={1}
                        />
                    </div>

                    {/* =================================== */}
                    {/* SECCIÓN 3: Notas                    */}
                    {/* =================================== */}

                    <NotesField
                        value={notes}
                        onChange={setNotes}
                        label="Observaciones"
                        placeholder="Notas adicionales sobre la tarea..."
                    />
                </div>
            </div>

            {/* Footer sticky */}
            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isLoading}
                submitLabel={isEditing ? "Guardar Cambios" : "Agregar Tarea"}
                onCancel={handleCancel}
            />
        </form>
    );
}
