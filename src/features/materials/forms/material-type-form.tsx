"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

import { FormFooter } from "@/components/shared/forms/form-footer";
import { FormGroup } from "@/components/ui/form-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MaterialType } from "@/features/materials/types";
import { createMaterialType, updateMaterialType } from "@/features/materials/actions";

interface MaterialTypeFormDialogProps {
    typeToEdit?: MaterialType;
    organizationId?: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function MaterialTypeFormDialog({
    typeToEdit,
    organizationId,
    onSuccess,
    onCancel
}: MaterialTypeFormDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const isEditing = !!typeToEdit;

    useEffect(() => {
        if (typeToEdit) {
            setName(typeToEdit.name);
            setDescription(typeToEdit.description || "");
        } else {
            setName("");
            setDescription("");
        }
    }, [typeToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error("El nombre es obligatorio");
            return;
        }

        if (!organizationId && !typeToEdit) {
            toast.error("Error: Falta ID de organización");
            return;
        }

        setIsLoading(true);

        try {
            if (isEditing && typeToEdit) {
                await updateMaterialType(typeToEdit.id, { name, description });
                toast.success("Tipo de material actualizado");
            } else {
                await createMaterialType({
                    name,
                    description,
                    organization_id: organizationId!,
                    is_system: false,
                });
                toast.success("Tipo de material creado");
            }
            onSuccess?.();
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar el tipo de material");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto">
                <div className="space-y-4">
                    <FormGroup label="Nombre" required>
                        <Input
                            placeholder="Ej. Construcción, Eléctrico..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </FormGroup>
                    <FormGroup label="Descripción">
                        <Textarea
                            placeholder="Detalles opcionales..."
                            className="resize-none min-h-[80px]"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </FormGroup>
                </div>
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isLoading}
                submitLabel={isEditing ? "Guardar Cambios" : "Crear Tipo"}
                onCancel={onCancel}
            />
        </form>
    );
}
