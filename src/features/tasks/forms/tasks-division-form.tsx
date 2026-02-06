"use client";

import { useState } from "react";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { FormGroup } from "@/components/ui/form-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createTaskDivision, updateTaskDivision } from "../actions";
import { TaskDivision } from "../types";

interface TasksDivisionFormProps {
    initialData?: TaskDivision | null;
    divisions: TaskDivision[]; // For parent selection
    onCancel?: () => void;
    onSuccess?: () => void;
}

export function TasksDivisionForm({
    initialData,
    divisions,
    onCancel,
    onSuccess
}: TasksDivisionFormProps) {
    const isEditing = !!initialData;

    // Filter out current division and its children from parent options
    const parentOptions = divisions.filter(d => {
        if (!initialData) return true;
        // Can't be its own parent
        if (d.id === initialData.id) return false;
        // Can't select a child as parent (would create circular ref)
        // For simplicity, we just check direct parent_id
        return d.parent_id !== initialData.id;
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);

        // Handle "_none" value for parent_id
        if (formData.get("parent_id") === "_none") {
            formData.set("parent_id", "");
        }

        if (isEditing && initialData?.id) {
            formData.append("id", initialData.id);
        }

        // ✅ OPTIMISTIC: Close and show success immediately
        onSuccess?.();
        toast.success(isEditing ? "¡Rubro actualizado!" : "¡Rubro creado!");

        // 🔄 BACKGROUND: Submit to server
        try {
            const result = isEditing
                ? await updateTaskDivision(formData)
                : await createTaskDivision(formData);

            if (result.error) {
                toast.error(result.error);
            }
        } catch (error: any) {
            console.error("Division form error:", error);
            toast.error("Error al guardar: " + error.message);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                    {/* Nombre: 8 cols */}
                    <div className="md:col-span-8">
                        <FormGroup label="Nombre del Rubro" htmlFor="name">
                            <Input
                                id="name"
                                name="name"
                                placeholder="Ej: Mampostería"
                                defaultValue={initialData?.name || ""}
                                required
                            />
                        </FormGroup>
                    </div>

                    {/* Código: 4 cols */}
                    <div className="md:col-span-4">
                        <FormGroup label="Código" htmlFor="code">
                            <Input
                                id="code"
                                name="code"
                                placeholder="Ej: MAM"
                                defaultValue={initialData?.color || ""} // Using color as code placeholder
                            />
                        </FormGroup>
                    </div>

                    {/* Orden: 6 cols */}
                    <div className="md:col-span-6">
                        <FormGroup label="Orden de Visualización" htmlFor="order">
                            <Input
                                id="order"
                                name="order"
                                type="number"
                                min={1}
                                placeholder="Ej: 1"
                                defaultValue={initialData?.order?.toString() || ""}
                            />
                        </FormGroup>
                    </div>

                    {/* Rubro Padre: 6 cols */}
                    <div className="md:col-span-6">
                        <FormGroup label="Rubro Padre (opcional)" htmlFor="parent_id">
                            <Select name="parent_id" defaultValue={initialData?.parent_id || "_none"}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sin padre (raíz)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_none">Sin padre (raíz)</SelectItem>
                                    {parentOptions.map((division) => (
                                        <SelectItem key={division.id} value={division.id}>
                                            {division.order ? `${division.order}. ` : ""}{division.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormGroup>
                    </div>

                    {/* Descripción: 12 cols */}
                    <div className="md:col-span-12">
                        <FormGroup label="Descripción" htmlFor="description">
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Descripción del rubro..."
                                defaultValue={initialData?.description || ""}
                                rows={3}
                            />
                        </FormGroup>
                    </div>

                </div>
            </div>

            <FormFooter
                onCancel={onCancel}
                cancelLabel="Cancelar"
                submitLabel={isEditing ? "Guardar Cambios" : "Crear Rubro"}
                className="-mx-4 -mb-4 mt-6"
            />
        </form>
    );
}
