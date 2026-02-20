"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useModal } from "@/stores/modal-store";
import { toast } from "sonner";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createRecipe, updateRecipe, addRecipeMaterial, addRecipeLabor } from "@/features/tasks/actions";
import { RecipeSuggestionPanel } from "@/features/ai/components/recipe-suggestion-panel";
import type { AIRecipeSuggestedMaterial, AIRecipeSuggestedLabor } from "@/features/ai/types";
import { Sparkles, ChevronDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

/** Data for editing an existing recipe */
export interface EditRecipeData {
    recipeId: string;
    name: string;
}

/** Context about the parent task — used to power AI suggestions */
export interface TaskContext {
    name: string;
    unit?: string | null;
    division?: string | null;
    organizationId?: string | null;
    action?: string | null;
    element?: string | null;
    parameterValues?: Record<string, string | number | boolean>;
    catalogMaterials?: {
        id: string;
        name: string;
        unit_symbol?: string | null;
        unit_price?: number | null;
        currency_symbol?: string | null;
    }[];
    catalogLaborTypes?: {
        id: string;
        name: string;
        unit_symbol?: string | null;
        unit_price?: number | null;
        currency_symbol?: string | null;
    }[];
}

interface TasksRecipeFormProps {
    taskId: string;
    editData?: EditRecipeData;
    taskContext?: TaskContext;
}

// Items aceptados del panel de IA — tienen catalogId garantizado
interface PendingMaterial {
    catalogId: string;
    quantity: number;
    wastePercentage: number;
}

interface PendingLabor {
    catalogId: string;
    quantity: number;
}

// ============================================================================
// Component
// ============================================================================

export function TasksRecipeForm({ taskId, editData, taskContext }: TasksRecipeFormProps) {
    const router = useRouter();
    const { closeModal } = useModal();
    const [isLoading, setIsLoading] = useState(false);

    const isEditMode = !!editData;
    const hasAI = !isEditMode && !!taskContext;

    // Form fields
    const [name, setName] = useState(editData?.name || "");
    const [userContext, setUserContext] = useState("");

    // Acordeón IA
    const [aiExpanded, setAiExpanded] = useState(false);

    // ── Items aceptados del panel de IA ───────────────────────────────────────
    const [pendingMaterials, setPendingMaterials] = useState<PendingMaterial[]>([]);
    const [pendingLabor, setPendingLabor] = useState<PendingLabor[]>([]);

    // ========================================================================
    // Callbacks de IA — recolectan items aceptados en el form state
    // ========================================================================

    const handleAcceptMaterial = (material: AIRecipeSuggestedMaterial) => {
        if (!material.catalogId) return;
        setPendingMaterials((prev) => {
            // Evitar duplicados
            if (prev.some((m) => m.catalogId === material.catalogId)) return prev;
            return [...prev, {
                catalogId: material.catalogId!,
                quantity: material.quantity,
                wastePercentage: material.wastePercentage,
            }];
        });
    };

    const handleAcceptLabor = (labor: AIRecipeSuggestedLabor) => {
        if (!labor.catalogId) return;
        setPendingLabor((prev) => {
            if (prev.some((l) => l.catalogId === labor.catalogId)) return prev;
            return [...prev, {
                catalogId: labor.catalogId!,
                quantity: labor.quantity,
            }];
        });
    };

    const handleMaterialCreated = (catalogId: string, _name: string, original: AIRecipeSuggestedMaterial) => {
        setPendingMaterials((prev) => {
            if (prev.some((m) => m.catalogId === catalogId)) return prev;
            return [...prev, {
                catalogId,
                quantity: original.quantity,
                wastePercentage: original.wastePercentage,
            }];
        });
    };

    const handleLaborCreated = (catalogId: string, _name: string, original: AIRecipeSuggestedLabor) => {
        setPendingLabor((prev) => {
            if (prev.some((l) => l.catalogId === catalogId)) return prev;
            return [...prev, {
                catalogId,
                quantity: original.quantity,
            }];
        });
    };

    // ========================================================================
    // Callbacks internos (semi-autónomo)
    // ========================================================================

    const handleSuccess = () => {
        closeModal();
        router.refresh();
    };

    const handleCancel = () => {
        closeModal();
    };

    // ========================================================================
    // Submit
    // ========================================================================

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        try {
            if (isEditMode && editData) {
                // ── Edit mode: solo actualiza el nombre ──
                const result = await updateRecipe(editData.recipeId, {
                    name: name.trim(),
                });
                if (result.success) {
                    toast.success("Receta actualizada");
                    handleSuccess();
                } else {
                    toast.error(result.error || "Error al actualizar la receta");
                }
            } else {
                // ── Create mode ──

                // 1. Crear la receta
                const result = await createRecipe({
                    task_id: taskId,
                    name: name.trim(),
                    is_public: false,
                    region: null,
                });

                if (!result.success || !result.data?.id) {
                    toast.error(result.error || "Error al crear la receta");
                    return;
                }

                const recipeId = result.data.id;

                // 2. Insertar materiales aceptados (en paralelo)
                const hasPending = pendingMaterials.length > 0 || pendingLabor.length > 0;

                if (hasPending) {
                    const inserts = [
                        ...pendingMaterials.map((m) =>
                            addRecipeMaterial({
                                recipe_id: recipeId,
                                material_id: m.catalogId,
                                quantity: m.quantity,
                                waste_percentage: m.wastePercentage,
                                unit_id: null,
                                notes: null,
                            })
                        ),
                        ...pendingLabor.map((l) =>
                            addRecipeLabor({
                                recipe_id: recipeId,
                                labor_type_id: l.catalogId,
                                quantity: l.quantity,
                                unit_id: null,
                                notes: null,
                            })
                        ),
                    ];

                    const insertResults = await Promise.all(inserts);
                    const failures = insertResults.filter((r) => !r.success);

                    if (failures.length > 0) {
                        toast.warning("Receta creada, pero algunos recursos no se pudieron agregar", {
                            description: `${failures.length} ítem(s) fallaron. Podés agregarlos manualmente.`,
                        });
                    } else {
                        const totalItems = pendingMaterials.length + pendingLabor.length;
                        toast.success("Receta creada con recursos de IA", {
                            description: `${totalItems} ítem${totalItems > 1 ? "s" : ""} agregado${totalItems > 1 ? "s" : ""} exitosamente.`,
                        });
                    }
                } else {
                    toast.success("Receta creada");
                }

                handleSuccess();
            }
        } catch {
            toast.error("Error inesperado");
        } finally {
            setIsLoading(false);
        }
    };

    // ========================================================================
    // Render
    // ========================================================================

    const pendingCount = pendingMaterials.length + pendingLabor.length;

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto space-y-4">

                {/* Nombre */}
                <FormGroup label="Nombre de la receta" required>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Receta estándar, Receta económica..."
                        autoFocus
                    />
                </FormGroup>

                {/* Acordeón de IA — solo en modo crear con contexto */}
                {hasAI && (
                    <div className="rounded-lg border border-dashed border-border overflow-hidden">

                        {/* Trigger */}
                        <button
                            type="button"
                            onClick={() => setAiExpanded((v) => !v)}
                            className={cn(
                                "w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors",
                                "hover:bg-muted/50",
                                aiExpanded && "bg-muted/30"
                            )}
                        >
                            <span className="flex items-center gap-2 text-violet-400">
                                <Sparkles className="h-4 w-4" />
                                Sugerir receta con IA
                                {pendingCount > 0 && !aiExpanded && (
                                    <span className="ml-1 rounded-full bg-violet-500/20 text-violet-300 text-xs px-2 py-0.5 font-normal">
                                        {pendingCount} ítem{pendingCount > 1 ? "s" : ""} seleccionado{pendingCount > 1 ? "s" : ""}
                                    </span>
                                )}
                            </span>
                            <ChevronDown
                                className={cn(
                                    "h-4 w-4 text-muted-foreground transition-transform duration-200",
                                    aiExpanded && "rotate-180"
                                )}
                            />
                        </button>

                        {/* Panel expandible */}
                        {aiExpanded && (
                            <div className="border-t border-dashed border-border px-4 pt-3 pb-4 space-y-3">

                                {/* Aviso de tokens */}
                                <div className="flex items-start gap-2 rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                                    <p className="text-xs text-amber-300/90 leading-relaxed">
                                        Esta función utiliza créditos de IA. Cada sugerencia consume tokens de tu plan.
                                    </p>
                                </div>

                                {/* Contexto libre */}
                                <FormGroup
                                    label="Contexto para la IA (opcional)"
                                    helpText="Describí zona geográfica, tipo de proyecto, nivel de calidad o condiciones ambientales."
                                >
                                    <Textarea
                                        value={userContext}
                                        onChange={(e) => setUserContext(e.target.value)}
                                        placeholder="Ej: Zona costera, alta humedad. Edificio de departamentos en altura..."
                                        className="resize-none text-sm"
                                        rows={3}
                                    />
                                </FormGroup>

                                {/* Panel de sugerencia — callbacks conectados al form state */}
                                <RecipeSuggestionPanel
                                    taskName={taskContext!.name}
                                    taskUnit={taskContext!.unit}
                                    taskDivision={taskContext!.division}
                                    taskAction={taskContext!.action}
                                    taskElement={taskContext!.element}
                                    parameterValues={taskContext!.parameterValues}
                                    userContext={userContext || null}
                                    organizationId={taskContext!.organizationId}
                                    catalogMaterials={taskContext!.catalogMaterials}
                                    catalogLaborTypes={taskContext!.catalogLaborTypes}
                                    onAcceptMaterial={handleAcceptMaterial}
                                    onAcceptLabor={handleAcceptLabor}
                                    onMaterialCreated={handleMaterialCreated}
                                    onLaborCreated={handleLaborCreated}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                submitLabel={
                    isEditMode
                        ? "Guardar Cambios"
                        : pendingCount > 0
                            ? `Crear Receta con ${pendingCount} ítem${pendingCount > 1 ? "s" : ""}`
                            : "Crear Receta"
                }
                isLoading={isLoading}
                onCancel={handleCancel}
            />
        </form>
    );
}
