"use client";

import { useState } from "react";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { FormGroup } from "@/components/ui/form-group";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createTask, updateTask } from "../actions";
import { Task, Unit, TaskDivision } from "../types";

interface TasksFormProps {
    mode: "create" | "edit";
    initialData?: Task;
    organizationId: string;
    units: Unit[];
    divisions: TaskDivision[];
    isAdminMode?: boolean;
    defaultDivisionId?: string | null;
    onCancel?: () => void;
    onSuccess?: () => void;
}

export function TasksForm({ mode, initialData, organizationId, units, divisions, isAdminMode = false, defaultDivisionId, onCancel, onSuccess }: TasksFormProps) {
    const [isPublished, setIsPublished] = useState(initialData?.is_published ?? false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        formData.set("is_published", isPublished.toString());

        if (mode === "edit" && initialData?.id) {
            formData.append("id", initialData.id);
        }

        // ✅ OPTIMISTIC: Close and show success immediately
        onSuccess?.();
        toast.success(mode === "create" ? "¡Tarea creada!" : "¡Cambios guardados!");

        // 🔄 BACKGROUND: Submit to server
        try {
            const result = mode === "create"
                ? await createTask(formData)
                : await updateTask(formData);

            if (result.error) {
                toast.error(result.error);
            }
        } catch (error: any) {
            console.error("Task form error:", error);
            toast.error("Error al guardar: " + error.message);
        }
    };

    // Determine default division value
    const defaultDivisionValue = initialData?.task_division_id || defaultDivisionId || undefined;

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            {/* Hidden fields for admin mode */}
            {isAdminMode && (
                <>
                    <input type="hidden" name="is_system" value="true" />
                    <input type="hidden" name="is_admin_mode" value="true" />
                    {/* Don't send organization_id for system tasks */}
                </>
            )}
            {!isAdminMode && (
                <input type="hidden" name="organization_id" value={organizationId} />
            )}
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Nombre: full width */}
                    <div className="md:col-span-2">
                        <FormGroup label="Nombre de la Tarea" htmlFor="name">
                            <Input
                                id="name"
                                name="name"
                                placeholder="Ej: Colocación de mampostería"
                                defaultValue={initialData?.name || initialData?.custom_name || ""}
                                required
                            />
                        </FormGroup>
                    </div>

                    {/* Código: 1 col */}
                    <div>
                        <FormGroup label="Código" htmlFor="code">
                            <Input
                                id="code"
                                name="code"
                                placeholder="Ej: ALB-001"
                                defaultValue={initialData?.code || ""}
                            />
                        </FormGroup>
                    </div>

                    {/* Unidad: 1 col */}
                    <div>
                        <FormGroup label="Unidad de Medida" htmlFor="unit_id">
                            <Select name="unit_id" defaultValue={initialData?.unit_id} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar unidad..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {units
                                        .filter((u) => u.applicable_to?.includes('task'))
                                        .map((unit) => (
                                            <SelectItem key={unit.id} value={unit.id}>
                                                {unit.name} ({unit.symbol})
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </FormGroup>
                    </div>

                    {/* División: full width */}
                    <div className="md:col-span-2">
                        <FormGroup label="División / Rubro" htmlFor="task_division_id">
                            <Select name="task_division_id" defaultValue={defaultDivisionValue}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sin división" />
                                </SelectTrigger>
                                <SelectContent>
                                    {divisions
                                        .filter((d) => !d.parent_id)
                                        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
                                        .map((division) => (
                                            <SelectItem key={division.id} value={division.id}>
                                                {division.order != null ? `${division.order}. ` : ""}{division.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </FormGroup>
                    </div>

                </div>
            </div>

            <FormFooter
                onCancel={onCancel}
                cancelLabel="Cancelar"
                submitLabel={mode === "create" ? "Crear Tarea" : "Guardar Cambios"}
                className="-mx-4 -mb-4 mt-6"
            />
        </form>
    );
}
