"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/form-footer";
import { createParameterOption, updateParameterOption } from "../../actions";
import { TaskParameterOption } from "../../types";

// ============================================================================
// Types
// ============================================================================

interface Material {
    id: string;
    name: string;
    code?: string | null;
}

interface OptionFormProps {
    parameterId: string;
    initialData?: TaskParameterOption | null;
    materials?: Material[];
    onSuccess?: () => void;
    onCancel?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function OptionForm({ parameterId, initialData, materials = [], onSuccess, onCancel }: OptionFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [materialId, setMaterialId] = useState<string>(initialData?.material_id || "");
    const isEditing = !!initialData;

    // ========================================================================
    // Handlers
    // ========================================================================

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.set("parameter_id", parameterId);

        // Handle material_id (empty string → null)
        if (materialId && materialId !== "none") {
            formData.set("material_id", materialId);
        } else {
            formData.delete("material_id");
        }

        try {
            const result = isEditing
                ? await updateParameterOption(formData)
                : await createParameterOption(formData);

            if (result.error) {
                toast.error(result.error);
                setIsLoading(false);
                return;
            }

            toast.success(isEditing ? "Opción actualizada" : "Opción creada");
            onSuccess?.();
        } catch (error) {
            console.error("Error submitting option:", error);
            toast.error("Error al guardar la opción");
            setIsLoading(false);
        }
    };

    // ========================================================================
    // Render
    // ========================================================================

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto">
                {isEditing && (
                    <input type="hidden" name="id" value={initialData.id} />
                )}

                <div className="grid grid-cols-1 gap-4">
                    {/* Label */}
                    <FormGroup label="Etiqueta" required helpText="Texto que verá el usuario">
                        <Input
                            name="label"
                            placeholder="ej: 10 cm, Ladrillo Hueco"
                            defaultValue={initialData?.label || ""}
                            autoFocus
                        />
                    </FormGroup>

                    {/* Value */}
                    <FormGroup label="Valor" required helpText="Valor interno para cálculos">
                        <Input
                            name="value"
                            placeholder="ej: 0.10, hueco"
                            defaultValue={initialData?.value || ""}
                        />
                    </FormGroup>

                    {/* Short Code */}
                    <FormGroup label="Código Corto" helpText="Se usa para generar códigos de tarea (ej: 10, LH)">
                        <Input
                            name="short_code"
                            placeholder="ej: 10, LH"
                            defaultValue={initialData?.short_code || ""}
                            className="uppercase font-mono"
                            maxLength={10}
                        />
                    </FormGroup>

                    {/* Material (optional) */}
                    {materials.length > 0 && (
                        <FormGroup label="Material Vinculado" helpText="Material sugerido al crear recetas">
                            <Select value={materialId} onValueChange={setMaterialId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sin material vinculado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sin material vinculado</SelectItem>
                                    {materials.map(m => (
                                        <SelectItem key={m.id} value={m.id}>
                                            {m.code && <span className="font-mono text-xs mr-2">{m.code}</span>}
                                            {m.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormGroup>
                    )}
                </div>
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isLoading}
                submitLabel={isEditing ? "Guardar" : "Crear Opción"}
                onCancel={onCancel}
            />
        </form>
    );
}
