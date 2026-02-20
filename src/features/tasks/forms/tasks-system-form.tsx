"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { createConstructionSystem, updateConstructionSystem } from "../actions";
import { TaskConstructionSystem } from "../types";

// ============================================================================
// Types
// ============================================================================

interface TasksSystemFormProps {
    initialData?: TaskConstructionSystem | null;
    onSuccess?: () => void;
    onCancel?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function TasksSystemForm({ initialData, onSuccess, onCancel }: TasksSystemFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!initialData;

    // ========================================================================
    // Handlers
    // ========================================================================

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);

        try {
            const result = isEditing
                ? await updateConstructionSystem(formData)
                : await createConstructionSystem(formData);

            if (result.error) {
                toast.error(result.error);
                setIsLoading(false);
                return;
            }

            toast.success(isEditing ? "Sistema actualizado" : "Sistema creado");
            onSuccess?.();
        } catch (error) {
            console.error("Error submitting construction system:", error);
            toast.error("Error al guardar el sistema constructivo");
            setIsLoading(false);
        }
    };

    // ========================================================================
    // Render
    // ========================================================================

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
                {/* Hidden ID for edit mode */}
                {isEditing && (
                    <input type="hidden" name="id" value={initialData.id} />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <FormGroup label="Nombre" required className="md:col-span-2">
                        <Input
                            name="name"
                            placeholder="ej: Estructura, Mampostería, Revestimientos"
                            defaultValue={initialData?.name || ""}
                            autoFocus
                        />
                    </FormGroup>

                    {/* Code */}
                    <FormGroup label="Código" helpText="Código corto para identificar el sistema">
                        <Input
                            name="code"
                            placeholder="ej: EST, MAM, REV"
                            defaultValue={initialData?.code || ""}
                            className="uppercase font-mono"
                            maxLength={10}
                        />
                    </FormGroup>

                    {/* Category */}
                    <FormGroup label="Categoría" helpText="Agrupación opcional del sistema">
                        <Input
                            name="category"
                            placeholder="ej: Obra Gruesa, Terminaciones"
                            defaultValue={initialData?.category || ""}
                        />
                    </FormGroup>

                    {/* Order */}
                    <FormGroup label="Orden" helpText="Para ordenar en listados">
                        <Input
                            name="order"
                            type="number"
                            placeholder="1"
                            defaultValue={initialData?.order?.toString() || ""}
                            min={0}
                        />
                    </FormGroup>

                    {/* Description */}
                    <FormGroup label="Descripción" className="md:col-span-2">
                        <Textarea
                            name="description"
                            placeholder="Descripción del sistema constructivo..."
                            defaultValue={initialData?.description || ""}
                            rows={3}
                        />
                    </FormGroup>
                </div>
            </div>

            {/* Sticky footer */}
            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isLoading}
                submitLabel={isEditing ? "Guardar Cambios" : "Crear Sistema"}
                onCancel={onCancel}
            />
        </form>
    );
}
