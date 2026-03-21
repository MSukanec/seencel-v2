"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { usePanel } from "@/stores/panel-store";
import { toast } from "sonner";
import { FormGroup } from "@/components/ui/form-group";
import { Input } from "@/components/ui/input";
import { createRecipe, updateRecipe } from "@/features/tasks/actions";
import { Package } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

/** Data for editing an existing recipe */
export interface EditRecipeData {
    recipeId: string;
    name: string;
}

interface TasksRecipeFormProps {
    taskId: string;
    editData?: EditRecipeData;
    formId?: string;
}

// ============================================================================
// Component
// ============================================================================

export function TasksRecipeForm({ taskId, editData, formId }: TasksRecipeFormProps) {
    const router = useRouter();
    const { closePanel, setPanelMeta, setSubmitting } = usePanel();
    const [isLoading, setIsLoading] = useState(false);

    const isEditMode = !!editData;

    // Self-describe panel meta
    useEffect(() => {
        setPanelMeta({
            icon: Package,
            title: isEditMode ? "Editar Receta" : "Nueva Receta",
            description: isEditMode
                ? "Modificá el nombre de la receta."
                : "Definí un nombre para la nueva receta.",
            size: "sm",
            footer: {
                submitLabel: isEditMode ? "Guardar Cambios" : "Crear Receta",
            },
        });
    }, [isEditMode, setPanelMeta]);

    // Form fields
    const [name, setName] = useState(editData?.name || "");

    // ========================================================================
    // Submit
    // ========================================================================

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        setSubmitting(true);
        try {
            if (isEditMode && editData) {
                const result = await updateRecipe(editData.recipeId, {
                    name: name.trim(),
                });
                if (result.success) {
                    toast.success("Receta actualizada");
                    closePanel();
                    router.refresh();
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
                    closePanel();
                    router.refresh();
                } else {
                    toast.error(result.error || "Error al crear la receta");
                }
            }
        } catch {
            toast.error("Error inesperado");
        } finally {
            setIsLoading(false);
            setSubmitting(false);
        }
    };

    // ========================================================================
    // Render
    // ========================================================================

    return (
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
            <FormGroup label="Nombre de la receta" required>
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Receta estándar, Receta económica..."
                    autoFocus
                />
            </FormGroup>
        </form>
    );
}
