"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useModal } from "@/stores/modal-store";
import { toast } from "sonner";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { Input } from "@/components/ui/input";
import { createRecipe } from "@/features/tasks/actions";

// ============================================================================
// Types
// ============================================================================

interface TasksRecipeFormProps {
    taskId: string;
}

// ============================================================================
// Component
// ============================================================================

export function TasksRecipeForm({ taskId }: TasksRecipeFormProps) {
    const router = useRouter();
    const { closeModal } = useModal();
    const [isLoading, setIsLoading] = useState(false);

    // State
    const [name, setName] = useState("");

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
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                submitLabel="Crear Receta"
                isLoading={isLoading}
                onCancel={handleCancel}
            />
        </form>
    );
}
