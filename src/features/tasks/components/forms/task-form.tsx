"use client";

import { useState } from "react";
import { FormFooter } from "@/components/shared/form-footer";
import { FormGroup } from "@/components/ui/form-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { createTask, updateTask } from "../../actions";
import { Task, Unit, TaskDivision } from "../../types";

interface TaskFormProps {
    mode: "create" | "edit";
    initialData?: Task;
    organizationId: string;
    units: Unit[];
    divisions: TaskDivision[];
    onCancel?: () => void;
    onSuccess?: () => void;
}

export function TaskForm({ mode, initialData, organizationId, units, divisions, onCancel, onSuccess }: TaskFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isPublished, setIsPublished] = useState(initialData?.is_published ?? false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const toastId = toast.loading(mode === "create" ? "Creando tarea..." : "Guardando cambios...");

        try {
            const formData = new FormData(e.currentTarget);
            formData.set("is_published", isPublished.toString());

            if (mode === "edit" && initialData?.id) {
                formData.append("id", initialData.id);
            }

            const result = mode === "create"
                ? await createTask(formData)
                : await updateTask(formData);

            if (result.error) {
                toast.error(result.error, { id: toastId });
            } else {
                toast.success(mode === "create" ? "¡Tarea creada!" : "¡Cambios guardados!", { id: toastId });
                onSuccess?.();
            }
        } catch (error: any) {
            console.error("Task form error:", error);
            toast.error("Error inesperado: " + error.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                    {/* Nombre: 8 cols */}
                    <div className="md:col-span-8">
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

                    {/* Código: 4 cols */}
                    <div className="md:col-span-4">
                        <FormGroup label="Código" htmlFor="code">
                            <Input
                                id="code"
                                name="code"
                                placeholder="Ej: ALB-001"
                                defaultValue={initialData?.code || ""}
                            />
                        </FormGroup>
                    </div>

                    {/* Unidad: 6 cols */}
                    <div className="md:col-span-6">
                        <FormGroup label="Unidad de Medida" htmlFor="unit_id">
                            <Select name="unit_id" defaultValue={initialData?.unit_id} required>
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
                    </div>

                    {/* División: 6 cols */}
                    <div className="md:col-span-6">
                        <FormGroup label="División / Rubro" htmlFor="task_division_id">
                            <Select name="task_division_id" defaultValue={initialData?.task_division_id || undefined}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sin división" />
                                </SelectTrigger>
                                <SelectContent>
                                    {divisions.map((division) => (
                                        <SelectItem key={division.id} value={division.id}>
                                            {division.name}
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
                                placeholder="Descripción detallada de la tarea..."
                                defaultValue={initialData?.description || ""}
                                rows={3}
                            />
                        </FormGroup>
                    </div>

                    {/* Publicado: 12 cols */}
                    <div className="md:col-span-12">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                            <div>
                                <Label htmlFor="is_published" className="text-sm font-medium">
                                    Publicar tarea
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Las tareas publicadas aparecen disponibles para usar en presupuestos
                                </p>
                            </div>
                            <Switch
                                id="is_published"
                                checked={isPublished}
                                onCheckedChange={setIsPublished}
                            />
                        </div>
                    </div>

                </div>
            </div>

            <FormFooter
                onCancel={onCancel}
                cancelLabel="Cancelar"
                submitLabel={isLoading
                    ? (mode === "create" ? "Creando..." : "Guardando...")
                    : (mode === "create" ? "Crear Tarea" : "Guardar Cambios")
                }
                isLoading={isLoading}
                className="-mx-4 -mb-4 mt-6"
            />
        </form>
    );
}
