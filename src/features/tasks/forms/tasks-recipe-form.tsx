"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useModal } from "@/stores/modal-store";
import { toast } from "sonner";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { Input } from "@/components/ui/input";
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
    catalogMaterials?: { id: string; name: string; unit_symbol?: string | null }[];
    catalogLaborTypes?: { id: string; name: string; unit_symbol?: string | null }[];
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

                {/* AI Suggestion Panel — solo en modo crear y con contexto disponible */}
                {!isEditMode && taskContext && (
                    <RecipeSuggestionPanel
                        taskName={taskContext.name}
                        taskUnit={taskContext.unit}
                        taskDivision={taskContext.division}
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
