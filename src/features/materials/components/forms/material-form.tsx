"use client";

import { useState } from "react";
import { FormFooter } from "@/components/shared/form-footer";
import { FormGroup } from "@/components/ui/form-group";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createMaterial, updateMaterial } from "@/features/materials/actions";
import { useModal } from "@/providers/modal-store";

// Re-use types from admin queries for now
export interface MaterialCategory {
    id: string;
    name: string;
    parent_id: string | null;
}

export interface Unit {
    id: string;
    name: string;
    abbreviation: string;
}

export interface Material {
    id: string;
    name: string;
    unit_id: string | null;
    category_id: string | null;
    material_type: string;
    is_system: boolean;
    organization_id: string | null;
}

interface MaterialFormProps {
    mode: "create" | "edit";
    organizationId: string;
    units: Unit[];
    categories: MaterialCategory[];
    isAdminMode?: boolean;
    initialData?: Material | null;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function MaterialForm({
    mode,
    organizationId,
    units,
    categories,
    isAdminMode = false,
    initialData,
    onSuccess,
    onCancel
}: MaterialFormProps) {
    const { closeModal } = useModal();
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = mode === "edit";

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const toastId = toast.loading(isEditing ? "Guardando cambios..." : "Creando material...");

        try {
            const formData = new FormData(e.currentTarget);

            // Add organization_id for non-admin mode
            if (!isAdminMode) {
                formData.append("organization_id", organizationId);
            }

            if (isEditing && initialData?.id) {
                formData.append("id", initialData.id);
            }

            const result = isEditing
                ? await updateMaterial(formData, isAdminMode)
                : await createMaterial(formData, isAdminMode);

            if (result.error) {
                toast.error(result.error, { id: toastId });
            } else {
                toast.success(isEditing ? "¡Material actualizado!" : "¡Material creado!", { id: toastId });
                onSuccess?.();
            }
        } catch (error: any) {
            console.error("Material form error:", error);
            toast.error("Error inesperado: " + error.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        onCancel?.();
        closeModal();
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Nombre: Full width */}
                    <div className="md:col-span-2">
                        <FormGroup label="Nombre del Material" htmlFor="name" required>
                            <Input
                                id="name"
                                name="name"
                                placeholder="Ej: Cemento Portland"
                                defaultValue={initialData?.name || ""}
                                required
                            />
                        </FormGroup>
                    </div>

                    {/* Unidad */}
                    <FormGroup label="Unidad de Medida" htmlFor="unit_id">
                        <Select name="unit_id" defaultValue={initialData?.unit_id || undefined}>
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

                    {/* Categoría */}
                    <FormGroup label="Categoría" htmlFor="category_id">
                        <Select name="category_id" defaultValue={initialData?.category_id || undefined}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sin categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormGroup>

                    {/* Tipo de Material: Full width */}
                    <div className="md:col-span-2">
                        <FormGroup label="Tipo" htmlFor="material_type">
                            <Select name="material_type" defaultValue={initialData?.material_type || "material"}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="material">Material</SelectItem>
                                    <SelectItem value="consumable">Consumible</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormGroup>
                    </div>

                </div>
            </div>

            <FormFooter
                onCancel={handleCancel}
                cancelLabel="Cancelar"
                submitLabel={isLoading
                    ? (isEditing ? "Guardando..." : "Creando...")
                    : (isEditing ? "Guardar Cambios" : "Crear Material")
                }
                isLoading={isLoading}
                className="-mx-4 -mb-4 mt-6"
            />
        </form>
    );
}
