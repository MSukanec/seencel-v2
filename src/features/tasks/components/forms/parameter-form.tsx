"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/form-footer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTaskParameter, updateTaskParameter } from "../../actions";
import { TaskParameter, ParameterType } from "../../types";
import { toast } from "sonner";

// ============================================================================
// Types
// ============================================================================

interface ParameterFormProps {
    initialData?: TaskParameter | null;
    onSuccess?: () => void;
    onCancel?: () => void;
}

const PARAMETER_TYPES: { value: ParameterType; label: string }[] = [
    { value: "text", label: "Texto" },
    { value: "number", label: "Número" },
    { value: "select", label: "Selección" },
    { value: "boolean", label: "Sí/No" },
    { value: "material", label: "Material" },
];

// ============================================================================
// Component
// ============================================================================

export function ParameterForm({ initialData, onSuccess, onCancel }: ParameterFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isRequired, setIsRequired] = useState(initialData?.is_required ?? true);
    const isEditing = !!initialData?.id;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.set("is_required", isRequired ? "true" : "false");

        try {
            const result = isEditing
                ? await updateTaskParameter(initialData.id, formData)
                : await createTaskParameter(formData);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(isEditing ? "Parámetro actualizado" : "Parámetro creado");
                onSuccess?.();
            }
        } catch (error) {
            toast.error("Error inesperado");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Label (nombre visible) */}
                    <FormGroup label="Nombre" required>
                        <Input
                            name="label"
                            defaultValue={initialData?.label ?? ""}
                            placeholder="Espesor"
                            required
                        />
                    </FormGroup>

                    {/* Slug (identificador para fórmulas) */}
                    <FormGroup label="Slug" required helpText="Identificador para fórmulas (sin espacios)">
                        <Input
                            name="slug"
                            defaultValue={initialData?.slug ?? ""}
                            placeholder="espesor"
                            pattern="^[a-z][a-z0-9_]*$"
                            title="Solo letras minúsculas, números y guiones bajos"
                            required
                        />
                    </FormGroup>

                    {/* Type */}
                    <FormGroup label="Tipo" required>
                        <Select name="type" defaultValue={initialData?.type ?? "number"}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                {PARAMETER_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormGroup>

                    {/* Order */}
                    <FormGroup label="Orden" helpText="Posición en el formulario">
                        <Input
                            name="order"
                            type="number"
                            defaultValue={initialData?.order ?? ""}
                            placeholder="1"
                            min={1}
                        />
                    </FormGroup>

                    {/* Default Value */}
                    <FormGroup label="Valor por defecto">
                        <Input
                            name="default_value"
                            defaultValue={initialData?.default_value ?? ""}
                            placeholder="10"
                        />
                    </FormGroup>

                    {/* Is Required */}
                    <FormGroup label="¿Obligatorio?">
                        <div className="flex items-center gap-2 h-9">
                            <Switch
                                checked={isRequired}
                                onCheckedChange={setIsRequired}
                            />
                            <span className="text-sm text-muted-foreground">
                                {isRequired ? "Sí" : "No"}
                            </span>
                        </div>
                    </FormGroup>
                </div>

                {/* Description - full width */}
                <div className="mt-4">
                    <FormGroup label="Descripción">
                        <Textarea
                            name="description"
                            defaultValue={initialData?.description ?? ""}
                            placeholder="Descripción del parámetro..."
                            rows={3}
                        />
                    </FormGroup>
                </div>
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isLoading}
                submitLabel={isEditing ? "Guardar Cambios" : "Crear Parámetro"}
                onCancel={onCancel}
            />
        </form>
    );
}
