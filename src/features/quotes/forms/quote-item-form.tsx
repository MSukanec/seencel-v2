"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { FormFooter } from "@/components/shared/forms/form-footer";
import {
    TextField,
    AmountField,
    NotesField,
    SelectField,
    type SelectOption,
} from "@/components/shared/forms/fields";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
    onCancel?: () => void;
    onSuccess?: () => void;
}

// ============================================================================
// Cost Scope Options
// ============================================================================

const COST_SCOPE_OPTIONS: SelectOption[] = [
    { value: "materials_and_labor", label: "Materiales + Mano de obra" },
    { value: "materials_only", label: "Sólo materiales" },
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
    tasks,
    initialData,
    onCancel,
    onSuccess,
}: QuoteItemFormProps) {
    const isEditing = mode === "edit";
    const [isLoading, setIsLoading] = useState(false);

    // --- Task Selection ---
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(initialData?.task_id || null);
    const [isCustomTask, setIsCustomTask] = useState(isEditing ? !initialData?.task_id : false);

    // --- Recipe Selection ---
    const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
    const [availableRecipes, setAvailableRecipes] = useState<TaskRecipeView[]>([]);
    const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);

    // --- Form Fields ---
    const [customName, setCustomName] = useState(
        // In edit mode without a task_id, description acts as the custom name
        isEditing && !initialData?.task_id ? (initialData?.description || "") : ""
    );
    const [quantity, setQuantity] = useState(initialData?.quantity?.toString() || "1");
    const [markupPct, setMarkupPct] = useState(initialData?.markup_pct?.toString() || "");
    const [taxPct, setTaxPct] = useState(initialData?.tax_pct?.toString() || "");
    const [costScope, setCostScope] = useState(initialData?.cost_scope || "materials_and_labor");
    const [notes, setNotes] = useState(
        // In edit mode with a task_id, description is notes
        isEditing && initialData?.task_id ? (initialData?.description || "") : ""
    );

    // --- Validation ---
    const [errors, setErrors] = useState<Record<string, string>>({});

    // --- Catalog Task Options ---
    const catalogTaskOptions: SelectOption[] = useMemo(() => {
        return tasks.map((t) => {
            const label = t.name || t.custom_name || "Sin nombre";
            return {
                value: t.id,
                label,
                searchTerms: `${label} ${t.unit_name || ""} ${t.division_name || ""}`,
            };
        });
    }, [tasks]);

    const catalogTaskMap = useMemo(() => {
        const map = new Map<string, TaskView>();
        for (const t of tasks) map.set(t.id, t);
        return map;
    }, [tasks]);

    // Custom render for options in dropdown — muestra unidad y división
    const renderTaskOption = useCallback((option: SelectOption) => {
        const task = catalogTaskMap.get(option.value);
        const badges = [task?.unit_symbol || task?.unit_name, task?.division_name].filter(Boolean);
        return (
            <div className="flex flex-col gap-0.5 py-0.5 min-w-0">
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

    // Unidad de la tarea seleccionada — para mostrar en el campo de cantidad
    const selectedUnitSymbol = useMemo(() => {
        if (!selectedTaskId || isCustomTask) return undefined;
        const task = catalogTaskMap.get(selectedTaskId);
        return task?.unit_symbol || task?.unit_name || undefined;
    }, [selectedTaskId, isCustomTask, catalogTaskMap]);

    // --- Recipe Options ---
    const recipeOptions: SelectOption[] = useMemo(() => {
        return availableRecipes.map((r) => ({
            value: r.id,
            label: r.name || "Receta sin nombre",
            searchTerms: r.name || "",
        }));
    }, [availableRecipes]);

    // Nombre compuesto automático: "Tarea — Receta"
    const composedItemName = useMemo(() => {
        if (!selectedTaskId) return "";
        const task = catalogTaskMap.get(selectedTaskId);
        const taskName = task?.name || task?.custom_name || "";
        if (!selectedRecipeId) return taskName;
        const recipe = availableRecipes.find(r => r.id === selectedRecipeId);
        if (!recipe?.name) return taskName;
        return `${taskName} — ${recipe.name}`;
    }, [selectedTaskId, selectedRecipeId, catalogTaskMap, availableRecipes]);

    // --- Fetch recipes when task is selected ---
    const fetchRecipes = useCallback(async (taskId: string) => {
        setIsLoadingRecipes(true);
        try {
            const recipes = await getRecipesForTask(taskId, organizationId);
            setAvailableRecipes(recipes);
            // Auto-seleccionar si hay solo una receta
            if (recipes.length === 1 && !isEditing) {
                setSelectedRecipeId(recipes[0].id);
            }
        } catch (err) {
            console.error("Error fetching recipes:", err);
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

    // --- Toggle Custom ---
    const handleToggleCustom = () => {
        setIsCustomTask(!isCustomTask);
        setSelectedTaskId(null);
        setSelectedRecipeId(null);
        setAvailableRecipes([]);
        setCustomName("");
        setErrors({});
    };

    // --- Validation ---
    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!isCustomTask && !selectedTaskId) {
            newErrors.task = "Seleccioná una tarea del catálogo";
        }
        if (isCustomTask && !customName.trim()) {
            newErrors.customName = "El nombre del ítem es requerido";
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
        if (!validate()) return;

        setIsLoading(true);

        // Armamos el description: nombre compuesto (catálogo) o nombre custom
        const descriptionValue = isCustomTask
            ? customName.trim()
            : [composedItemName, notes.trim()].filter(Boolean).join(" — ") || null;

        const formData = new FormData();
        formData.append("task_id", isCustomTask ? "" : (selectedTaskId || ""));
        formData.append("description", descriptionValue || "");
        formData.append("quantity", quantity);
        formData.append("unit_price", "0");
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
            }
            onSuccess?.();
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
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto">
                <div className="space-y-4">

                    {/* =========================================== */}
                    {/* SECCIÓN 1: Selección de Tarea               */}
                    {/* =========================================== */}

                    {!isCustomTask ? (
                        <>
                            <div className="flex items-end gap-2">
                                <div className="flex-1">
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
                                        searchPlaceholder="Buscar por nombre, unidad o rubro..."
                                        required
                                        disabled={isEditing}
                                        error={errors.task}
                                        renderOption={renderTaskOption}
                                        emptyState={{ message: "No se encontraron tareas" }}
                                    />
                                </div>

                                {/* Botón "+ tarea personalizada" */}
                                {!isEditing && (
                                    <TooltipProvider delayDuration={0}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="shrink-0 h-9 w-9"
                                                    onClick={handleToggleCustom}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Ítem personalizado</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>

                            {/* Selector de Receta — aparece solo si la tarea tiene recetas */}
                            {selectedTaskId && (availableRecipes.length > 0 || isLoadingRecipes) && (
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
                                    emptyState={{ message: "No se encontraron recetas" }}
                                />
                            )}
                        </>
                    ) : (
                        /* =========================================== */
                        /* Ítem Personalizado (sin catálogo)            */
                        /* =========================================== */
                        <>
                            <TextField
                                value={customName}
                                onChange={setCustomName}
                                label="Nombre del ítem"
                                placeholder="Ej: Traslado de materiales"
                                required
                                autoFocus
                                error={errors.customName}
                            />

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
            </div>

            <FormFooter
                onCancel={onCancel}
                cancelLabel="Cancelar"
                submitLabel={isEditing ? "Guardar Cambios" : "Agregar Ítem"}
                isLoading={isLoading}
                className="-mx-4 -mb-4 mt-6"
            />
        </form>
    );
}
