"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import { usePanel } from "@/stores/panel-store";
import {
    TextField,
    AmountField,
    NotesField,
    SelectField,
    type SelectOption,
} from "@/components/shared/forms/fields";
import { TaskField, type CatalogTaskOption } from "@/components/shared/forms/fields/task-field";
import { createQuoteItem, updateQuoteItem } from "../actions";
import { getRecipesForTask } from "@/features/construction-tasks/actions";
import type { TaskView, TaskRecipeView } from "@/features/tasks/types";

// ============================================================================
// Types
// ============================================================================

interface QuoteItemFormProps {
    mode: "create" | "edit";
    quoteId: string;
    organizationId: string;
    projectId: string | null;
    currencyId: string;
    tasks: TaskView[];
    initialData?: any;
    onSuccess?: (data?: any) => void;
    formId?: string; // ← lo pasa el PanelProvider automáticamente
}

// ============================================================================
// Cost Scope Options
// ============================================================================

const COST_SCOPE_OPTIONS: SelectOption[] = [
    { value: "materials_and_labor", label: "Materiales + Mano de obra" },
    { value: "labor_only", label: "Sólo mano de obra" },
];

// ============================================================================
// Component
// ============================================================================

export function QuoteItemForm({
    mode,
    quoteId,
    organizationId,
    projectId,
    currencyId,
    tasks = [],
    initialData,
    onSuccess,
    formId,
}: QuoteItemFormProps) {
    const isEditing = mode === "edit";
    const { closePanel, setPanelMeta } = usePanel();
    const [isLoading, setIsLoading] = useState(false);

    // 🚨 OBLIGATORIO: Self-describe panel meta
    useEffect(() => {
        setPanelMeta({
            icon: FileText,
            title: isEditing ? "Editar Ítem" : "Agregar Ítem",
            description: isEditing
                ? "Modifica los datos del ítem del presupuesto"
                : "Seleccioná una tarea del catálogo y definí cantidad y precio",
            size: "md",
            footer: {
                submitLabel: isEditing ? "Guardar Cambios" : "Agregar Ítem",
            },
        });
    }, [isEditing, setPanelMeta]);

    // --- Task Selection ---
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(initialData?.task_id || null);

    // --- Recipe Selection ---
    const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

    // --- Form Fields ---
    const [quantity, setQuantity] = useState(initialData?.quantity?.toString() || "1");
    const [markupPct, setMarkupPct] = useState(initialData?.markup_pct?.toString() || "");
    const [taxPct, setTaxPct] = useState(initialData?.tax_pct?.toString() || "");
    const [costScope, setCostScope] = useState(initialData?.cost_scope || "materials_and_labor");
    const [notes, setNotes] = useState(initialData?.description || "");

    // --- Validation ---
    const [errors, setErrors] = useState<Record<string, string>>({});

    // --- Catalog Task Options (para TaskField) ---
    const catalogTaskOptions: CatalogTaskOption[] = useMemo(() => {
        return tasks
            .filter((t) => t.status === "active" || t.id === initialData?.task_id)
            .map((t) => ({
                id: t.id,
                name: t.name,
                custom_name: t.custom_name,
                unit_name: t.unit_name || undefined,
                unit_symbol: t.unit_symbol || undefined,
                division_name: t.division_name || undefined,
                code: t.code,
                status: t.status,
            }));
    }, [tasks, initialData?.task_id]);

    const catalogTaskMap = useMemo(() => {
        const map = new Map<string, TaskView>();
        for (const t of tasks) map.set(t.id, t);
        return map;
    }, [tasks]);

    // Unidad de la tarea seleccionada
    const selectedUnitSymbol = useMemo(() => {
        if (!selectedTaskId) return undefined;
        const task = catalogTaskMap.get(selectedTaskId);
        return task?.unit_symbol || task?.unit_name || undefined;
    }, [selectedTaskId, catalogTaskMap]);

    // Nombre compuesto automático: "Tarea — Receta"
    const composedItemName = useMemo(() => {
        if (!selectedTaskId) return "";
        const task = catalogTaskMap.get(selectedTaskId);
        const taskName = task?.name || task?.custom_name || "";
        return taskName;
    }, [selectedTaskId, catalogTaskMap]);

    // --- Fetch recipes callback for TaskField ---
    const handleFetchRecipes = useCallback(async (taskId: string): Promise<TaskRecipeView[]> => {
        try {
            return await getRecipesForTask(taskId, organizationId);
        } catch (err) {
            console.error("Error fetching recipes:", err);
            return [];
        }
    }, [organizationId]);

    // --- Validation ---
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

    // --- Submit ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading) return; // Guard: prevent double-submit
        if (!validate()) return;

        setIsLoading(true);

        const descriptionValue = [composedItemName, notes.trim()].filter(Boolean).join(" — ") || null;

        const formData = new FormData();
        formData.append("task_id", selectedTaskId || "");
        formData.append("recipe_id", selectedRecipeId || "");
        formData.append("description", descriptionValue || "");
        formData.append("quantity", quantity);
        formData.append("markup_pct", markupPct);
        formData.append("tax_pct", taxPct);
        formData.append("cost_scope", costScope);

        try {
            if (isEditing && initialData?.id) {
                const result = await updateQuoteItem(initialData.id, formData);
                if (result.error) {
                    toast.error(result.error);
                    return;
                }
                toast.success("¡Ítem actualizado!");
                closePanel();
                onSuccess?.(result.data);
            } else {
                formData.append("quote_id", quoteId);
                formData.append("organization_id", organizationId);
                if (projectId) formData.append("project_id", projectId);
                formData.append("currency_id", currencyId);

                const result = await createQuoteItem(formData);
                if (result.error) {
                    toast.error(result.error);
                    return;
                }
                toast.success("¡Ítem agregado!");
                closePanel();
                onSuccess?.(result.data);
            }
        } catch (error: any) {
            console.error("Quote item form error:", error);
            toast.error("Error al guardar: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // ============================================================================
    // Render
    // ============================================================================

    return (
        <form id={formId} onSubmit={handleSubmit}>
            <div className="space-y-4">

                {/* =========================================== */}
                {/* SECCIÓN 1: Selección de Tarea               */}
                {/* =========================================== */}

                {/* Task + Recipe Selector — full width */}
                <TaskField
                    taskValue={selectedTaskId}
                    onTaskChange={(taskId) => {
                        setSelectedTaskId(taskId);
                        setErrors(prev => ({ ...prev, task: "" }));
                    }}
                    recipeValue={selectedRecipeId}
                    onRecipeChange={setSelectedRecipeId}
                    catalogTasks={catalogTaskOptions}
                    fetchRecipes={handleFetchRecipes}
                    taskLabel="Tarea del Catálogo"
                    taskPlaceholder="Seleccionar tarea..."
                    recipePlaceholder="Seleccionar receta (opcional)"
                    taskRequired
                    recipeRequired={false}
                    disabled={isEditing}
                    taskError={errors.task}
                />

                {/* =========================================== */}
                {/* SECCIÓN 2: Alcance, Cantidad, Margen, IVA   */}
                {/* =========================================== */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                    <SelectField
                        value={costScope}
                        onChange={(v) => setCostScope(v)}
                        options={COST_SCOPE_OPTIONS}
                        label="Alcance de Costo"
                        required={false}
                    />

                    <AmountField
                        value={quantity}
                        onChange={setQuantity}
                        label="Cantidad"
                        placeholder="100"
                        min={0}
                        step={0.001}
                        suffix={selectedUnitSymbol}
                        helpText={errors.quantity}
                    />

                    <AmountField
                        value={markupPct}
                        onChange={setMarkupPct}
                        label="Margen %"
                        placeholder="15"
                        min={0}
                        step={0.01}
                        suffix="%"
                    />

                    <AmountField
                        value={taxPct}
                        onChange={setTaxPct}
                        label="Impuesto %"
                        placeholder="21"
                        min={0}
                        step={0.01}
                        suffix="%"
                    />
                </div>

                <NotesField
                    value={notes}
                    onChange={setNotes}
                    label="Notas"
                    placeholder="Especificaciones, aclaraciones..."
                />

            </div>
        </form>
    );
}
