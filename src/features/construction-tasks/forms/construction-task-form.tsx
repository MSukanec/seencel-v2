"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { useModal } from "@/stores/modal-store";
import { ConstructionTaskView, ConstructionTaskStatus, CostScope } from "../types";
import { createConstructionTask, updateConstructionTask, getRecipesForTask } from "../actions";
import { formatDateForDB, parseDateFromDB } from "@/lib/timezone-data";
import type { TaskRecipeView } from "@/features/tasks/types";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DateField, NotesField } from "@/components/shared/forms/fields";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";

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

    // Build Combobox options for recipes
    const recipeOptions: ComboboxOption[] = useMemo(() => {
        return availableRecipes.map((r) => {
            const label = r.name || "Receta sin nombre";
            const details = [
                r.item_count > 0 ? `${r.item_count} ítems` : null,
                r.is_public ? "Pública" : "Propia",
            ].filter(Boolean).join(" · ");
            return {
                value: r.id,
                label,
                searchTerms: `${label} ${r.org_name || ""}`,
                content: (
                    <div className="flex flex-col">
                        <span className="text-sm font-medium truncate">{label}</span>
                        {details && (
                            <span className="text-xs text-muted-foreground">{details}</span>
                        )}
                    </div>
                ),
            };
        });
    }, [availableRecipes]);

    // Build Combobox options from catalog tasks
    const catalogTaskOptions: ComboboxOption[] = useMemo(() => {
        return catalogTasks.map((t) => {
            const label = t.name || t.custom_name || "Sin nombre";
            const subtitle = [t.code, t.unit_name, t.division_name].filter(Boolean).join(" · ");
            return {
                value: t.id,
                label,
                searchTerms: `${label} ${t.code || ""} ${t.division_name || ""}`,
                content: (
                    <div className="flex flex-col">
                        <span className="text-sm font-medium truncate">{label}</span>
                        {subtitle && (
                            <span className="text-xs text-muted-foreground">{subtitle}</span>
                        )}
                    </div>
                ),
            };
        });
    }, [catalogTasks]);

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
                            <FormGroup
                                label="Tarea del Catálogo"
                                htmlFor="task_selector"
                                required
                                error={errors.task}
                            >
                                <Combobox
                                    value={selectedTaskId || ""}
                                    onValueChange={(v) => {
                                        setSelectedTaskId(v || null);
                                        setErrors(prev => ({ ...prev, task: "" }));
                                    }}
                                    options={catalogTaskOptions}
                                    placeholder="Seleccionar tarea..."
                                    searchPlaceholder="Buscar por nombre, código o división..."
                                    emptyMessage="No se encontraron tareas"
                                    disabled={isEditing}
                                />

                                {/* Toggle a tarea custom */}
                                {!isEditing && (
                                    <button
                                        type="button"
                                        onClick={handleToggleCustom}
                                        className="text-xs text-primary hover:underline mt-1"
                                    >
                                        Crear tarea personalizada (sin catálogo)
                                    </button>
                                )}
                            </FormGroup>

                            {/* Recipe Selector — only when task has recipes */}
                            {selectedTaskId && availableRecipes.length > 0 && (
                                <FormGroup
                                    label="Receta"
                                    htmlFor="recipe_selector"
                                >
                                    <Combobox
                                        value={selectedRecipeId || ""}
                                        onValueChange={(v) => setSelectedRecipeId(v || null)}
                                        options={recipeOptions}
                                        placeholder={isLoadingRecipes ? "Cargando recetas..." : "Seleccionar receta (opcional)"}
                                        searchPlaceholder="Buscar receta..."
                                        emptyMessage="No se encontraron recetas"
                                        disabled={isLoadingRecipes}
                                    />
                                </FormGroup>
                            )}
                        </>
                    ) : (
                        /* Tarea Custom */
                        <>
                            <FormGroup
                                label="Nombre de la tarea"
                                htmlFor="custom_name"
                                required
                                error={errors.customName}
                            >
                                <Input
                                    id="custom_name"
                                    placeholder="Ej: Limpieza general de obra"
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                    autoFocus
                                />
                            </FormGroup>

                            <FormGroup label="Unidad" htmlFor="custom_unit">
                                <Input
                                    id="custom_unit"
                                    placeholder="m², ml, un, gl"
                                    value={customUnit}
                                    onChange={(e) => setCustomUnit(e.target.value)}
                                />
                            </FormGroup>

                            {/* Toggle a catálogo */}
                            {!isEditing && (
                                <button
                                    type="button"
                                    onClick={handleToggleCustom}
                                    className="text-xs text-primary hover:underline"
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
                        <FormGroup
                            label="Cantidad"
                            htmlFor="quantity"
                            required
                            error={errors.quantity}
                        >
                            <Input
                                id="quantity"
                                type="number"
                                step="0.01"
                                placeholder="100"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                            />
                        </FormGroup>

                        {/* Alcance de Costos */}
                        <FormGroup label="Alcance de Costos" htmlFor="cost_scope">
                            <Select value={costScope} onValueChange={(v) => setCostScope(v as CostScope)}>
                                <SelectTrigger id="cost_scope">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="materials_and_labor">Materiales + Mano de Obra</SelectItem>
                                    <SelectItem value="materials_only">Solo Materiales</SelectItem>
                                    <SelectItem value="labor_only">Solo Mano de Obra</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormGroup>

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
                        <FormGroup label="Estado" htmlFor="status">
                            <Select
                                value={status}
                                onValueChange={(v) => setStatus(v as ConstructionTaskStatus)}
                            >
                                <SelectTrigger id="status">
                                    <SelectValue placeholder="Seleccionar estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pendiente</SelectItem>
                                    <SelectItem value="in_progress">En Progreso</SelectItem>
                                    <SelectItem value="completed">Completada</SelectItem>
                                    <SelectItem value="paused">Pausada</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormGroup>

                        {/* Progreso */}
                        <FormGroup
                            label="Progreso (%)"
                            htmlFor="progress_percent"
                            error={errors.progressPercent}
                        >
                            <Input
                                id="progress_percent"
                                type="number"
                                min={0}
                                max={100}
                                placeholder="0"
                                value={progressPercent}
                                onChange={(e) => setProgressPercent(e.target.value)}
                            />
                        </FormGroup>
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
