"use client";

import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { useModal } from "@/stores/modal-store";
import { ConstructionTaskView, CostScope } from "../types";
import { createConstructionTask, updateConstructionTask, getRecipesForTask } from "../actions";
import { formatDateForDB, parseDateFromDB } from "@/lib/timezone-data";
import { FormFooter } from "@/components/shared/forms/form-footer";
import {
    AmountField,
    DateField,
    NotesField,
    SelectField,
    TaskField,
    type SelectOption,
    type UnitOption,
    type CatalogTaskOption,
} from "@/components/shared/forms/fields";

// ============================================================================
// Types
// ============================================================================

interface ConstructionTaskFormProps {
    projectId: string;
    organizationId: string;
    catalogTasks: CatalogTaskOption[];
    units: UnitOption[];
    initialData?: ConstructionTaskView | null;
}

// ============================================================================
// Options
// ============================================================================

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
    units,
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

    // --- Task + Recipe Selection (via TaskField) ---
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(initialData?.task_id || null);
    const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(initialData?.recipe_id || null);

    // Fetch recipes callback for TaskField
    const handleFetchRecipes = useCallback(
        (taskId: string) => getRecipesForTask(taskId, organizationId),
        [organizationId]
    );

    // Derive selected task's unit symbol for the quantity field
    const selectedUnitSymbol = useMemo(() => {
        if (!selectedTaskId) return undefined;
        const task = catalogTasks.find(t => t.id === selectedTaskId);
        return task?.unit_symbol || task?.unit_name || undefined;
    }, [selectedTaskId, catalogTasks]);

    // --- Form Fields ---
    const [quantity, setQuantity] = useState(initialData?.quantity?.toString() || "1");
    const [plannedStartDate, setPlannedStartDate] = useState<Date | undefined>(
        parseDateFromDB(initialData?.planned_start_date) ?? undefined
    );
    const [plannedEndDate, setPlannedEndDate] = useState<Date | undefined>(
        parseDateFromDB(initialData?.planned_end_date) ?? undefined
    );
    const [notes, setNotes] = useState(initialData?.notes || "");
    const [costScope, setCostScope] = useState(initialData?.cost_scope || "materials_and_labor");

    // --- Validation ---
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!selectedTaskId) {
            newErrors.task = "Seleccioná una tarea del catálogo";
        }

        const qty = parseFloat(quantity);
        if (isNaN(qty) || qty <= 0) {
            newErrors.quantity = "La cantidad debe ser mayor a 0";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // --- Handlers ---


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsLoading(true);

        try {
            const payload = {
                task_id: selectedTaskId,
                recipe_id: selectedRecipeId,
                custom_name: null,
                custom_unit: null,
                quantity: parseFloat(quantity),
                planned_start_date: formatDateForDB(plannedStartDate),
                planned_end_date: formatDateForDB(plannedEndDate),
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

                    <TaskField
                        taskValue={selectedTaskId}
                        onTaskChange={(id) => {
                            setSelectedTaskId(id);
                            setErrors(prev => ({ ...prev, task: "" }));
                        }}
                        recipeValue={selectedRecipeId}
                        onRecipeChange={setSelectedRecipeId}
                        catalogTasks={catalogTasks}
                        fetchRecipes={handleFetchRecipes}
                        taskRequired
                        disabled={isEditing}
                        taskError={errors.task}
                    />

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
                            suffix={selectedUnitSymbol}
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
