"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/form-footer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTaskElement, updateTaskElement } from "../../actions";
import { TaskElement, Unit } from "../../types";

// ============================================================================
// Types
// ============================================================================

interface ElementFormProps {
    initialData?: TaskElement | null;
    units?: Unit[];
    onSuccess?: () => void;
    onCancel?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function ElementForm({ initialData, units = [], onSuccess, onCancel }: ElementFormProps) {
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
                ? await updateTaskElement(formData)
                : await createTaskElement(formData);

            if (result.error) {
                toast.error(result.error);
                setIsLoading(false);
                return;
            }

            toast.success(isEditing ? "Elemento actualizado" : "Elemento creado");
            onSuccess?.();
        } catch (error) {
            console.error("Error submitting element:", error);
            toast.error("Error al guardar el elemento");
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
                            placeholder="ej: Muro, Cañería, Tomacorriente"
                            defaultValue={initialData?.name || ""}
                            autoFocus
                        />
                    </FormGroup>

                    {/* Code */}
                    <FormGroup label="Código" helpText="Se usará para generar códigos de tarea">
                        <Input
                            name="code"
                            placeholder="ej: MUR, CAN, TOM"
                            defaultValue={initialData?.code || ""}
                            className="uppercase font-mono"
                            maxLength={10}
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

                    {/* Default Unit */}
                    {units.length > 0 && (
                        <FormGroup label="Unidad por defecto" helpText="Unidad predeterminada para tareas">
                            <Select name="default_unit_id" defaultValue={(initialData as any)?.default_unit_id || ""}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar unidad..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {units.map((unit) => (
                                        <SelectItem key={unit.id} value={unit.id}>
                                            {unit.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormGroup>
                    )}

                    {/* Description */}
                    <FormGroup label="Descripción" className="md:col-span-2">
                        <Textarea
                            name="description"
                            placeholder="Descripción opcional del elemento..."
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
                submitLabel={isEditing ? "Guardar Cambios" : "Crear Elemento"}
                onCancel={onCancel}
            />
        </form>
    );
}
