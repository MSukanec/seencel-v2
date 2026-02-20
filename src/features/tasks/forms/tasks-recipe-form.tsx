"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useModal } from "@/stores/modal-store";
import { toast } from "sonner";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createRecipe, updateRecipe } from "@/features/tasks/actions";
import { RecipeSuggestionPanel } from "@/features/ai/components/recipe-suggestion-panel";

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
    /** Acción técnica (ej: "Revocar", "Ejecutar") */
    action?: string | null;
    /** Elemento constructivo (ej: "Pared", "Losa") */
    element?: string | null;
    /** Parámetros seleccionados por el usuario */
    parameterValues?: Record<string, string | number | boolean>;
    /** Materiales del catálogo con precios para matching e inferencia económica */
    catalogMaterials?: {
        id: string;
        name: string;
        unit_symbol?: string | null;
        unit_price?: number | null;
        currency_symbol?: string | null;
    }[];
    /** Tipos de MO del catálogo con precios */
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
    /** When provided, the form operates in edit mode */
    editData?: EditRecipeData;
    /** Task context used to power AI recipe suggestions (only in create mode) */
    taskContext?: TaskContext;
}

// ============================================================================
// Component
// ============================================================================

export function TasksRecipeForm({ taskId, editData, taskContext }: TasksRecipeFormProps) {
    const router = useRouter();
    const { closeModal } = useModal();
    const [isLoading, setIsLoading] = useState(false);

    const isEditMode = !!editData;

    // State — initialized from editData when editing
    const [name, setName] = useState(editData?.name || "");

    // Contexto libre del profesional para la IA
    const [userContext, setUserContext] = useState("");

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
                const result = await createRecipe({
                    task_id: taskId,
                    name: name.trim(),
                    is_public: false,
                    region: null,
                });

                if (result.success) {
                    toast.success("Receta creada");
                    handleSuccess();
                } else {
                    toast.error(result.error || "Error al crear la receta");
                }
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

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 gap-4">
                    <FormGroup label="Nombre de la receta" required>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Receta estándar, Receta económica..."
                            autoFocus
                        />
                    </FormGroup>
                </div>

                {/* Contexto libre para la IA — solo en modo crear */}
                {!isEditMode && taskContext && (
                    <div className="mt-4">
                        <FormGroup
                            label="Contexto para la IA (opcional)"
                            helpText="Describí zona geográfica, tipo de proyecto, nivel de calidad o condiciones ambientales. La IA lo tendrá en cuenta al sugerir materiales."
                        >
                            <Textarea
                                value={userContext}
                                onChange={(e) => setUserContext(e.target.value)}
                                placeholder="Ej: Zona costera, alta humedad. Edificio de departamentos en altura. Terminaciones de nivel medio-alto..."
                                className="resize-none text-sm"
                                rows={3}
                            />
                        </FormGroup>
                    </div>
                )}

                {/* AI Suggestion Panel — solo en modo crear y con contexto disponible */}
                {!isEditMode && taskContext && (
                    <RecipeSuggestionPanel
                        taskName={taskContext.name}
                        taskUnit={taskContext.unit}
                        taskDivision={taskContext.division}
                        taskAction={taskContext.action}
                        taskElement={taskContext.element}
                        parameterValues={taskContext.parameterValues}
                        userContext={userContext || null}
                        organizationId={taskContext.organizationId}
                        catalogMaterials={taskContext.catalogMaterials}
                        catalogLaborTypes={taskContext.catalogLaborTypes}
                    />
                )}
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                submitLabel={isEditMode ? "Guardar Cambios" : "Crear Receta"}
                isLoading={isLoading}
                onCancel={handleCancel}
            />
        </form>
    );
}
