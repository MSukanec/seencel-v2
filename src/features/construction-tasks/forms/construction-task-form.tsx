"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ConstructionTaskView } from "../types";
import { createConstructionTask, updateConstructionTask } from "../actions";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { formatDateForDB } from "@/lib/timezone-data";

interface ConstructionTaskFormProps {
    projectId: string;
    organizationId: string;
    initialData?: ConstructionTaskView | null;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function ConstructionTaskForm({
    projectId,
    organizationId,
    initialData,
    onSuccess,
    onCancel,
}: ConstructionTaskFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!initialData;

    // Form state
    const [customName, setCustomName] = useState(initialData?.custom_name || initialData?.task_name || "");
    const [customUnit, setCustomUnit] = useState(initialData?.custom_unit || initialData?.unit || "");
    const [quantity, setQuantity] = useState(initialData?.quantity?.toString() || "1");
    const [startDate, setStartDate] = useState<Date | undefined>(
        initialData?.start_date ? new Date(initialData.start_date) : undefined
    );
    const [endDate, setEndDate] = useState<Date | undefined>(
        initialData?.end_date ? new Date(initialData.end_date) : undefined
    );
    const [status, setStatus] = useState(initialData?.status || "pending");
    const [progressPercent, setProgressPercent] = useState(initialData?.progress_percent?.toString() || "0");
    const [notes, setNotes] = useState(initialData?.notes || "");

    // Validation
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!customName.trim()) {
            newErrors.customName = "El nombre es requerido";
        }

        const qty = parseFloat(quantity);
        if (isNaN(qty) || qty <= 0) {
            newErrors.quantity = "La cantidad debe ser mayor a 0";
        }

        const progress = parseInt(progressPercent);
        if (isNaN(progress) || progress < 0 || progress > 100) {
            newErrors.progressPercent = "El progreso debe ser entre 0 y 100";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsLoading(true);

        try {
            const payload = {
                custom_name: customName.trim(),
                custom_unit: customUnit.trim() || null,
                quantity: parseFloat(quantity),
                start_date: formatDateForDB(startDate),
                end_date: formatDateForDB(endDate),
                status: status as "pending" | "in_progress" | "completed" | "paused",
                progress_percent: parseInt(progressPercent),
                notes: notes.trim() || null,
                cost_scope: (initialData?.cost_scope || 'materials_and_labor') as "materials_and_labor" | "materials_only" | "labor_only",
            };

            const result = isEditing
                ? await updateConstructionTask(initialData.id, projectId, payload)
                : await createConstructionTask(projectId, organizationId, payload);

            if (result.success) {
                toast.success(isEditing ? "Tarea actualizada" : "Tarea creada");
                onSuccess?.();
            } else {
                toast.error(result.error || "Error al guardar la tarea");
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
            {/* Contenido scrolleable */}
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nombre - Full width */}
                    <FormGroup
                        label="Nombre de la tarea"
                        htmlFor="custom_name"
                        required
                        error={errors.customName}
                        className="md:col-span-2"
                    >
                        <Input
                            id="custom_name"
                            name="custom_name"
                            placeholder="Ej: Hormigón armado losa"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                        />
                    </FormGroup>

                    {/* Cantidad */}
                    <FormGroup
                        label="Cantidad"
                        htmlFor="quantity"
                        required
                        error={errors.quantity}
                    >
                        <Input
                            id="quantity"
                            name="quantity"
                            type="number"
                            step="0.01"
                            placeholder="100"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                        />
                    </FormGroup>

                    {/* Unidad */}
                    <FormGroup
                        label="Unidad"
                        htmlFor="custom_unit"
                    >
                        <Input
                            id="custom_unit"
                            name="custom_unit"
                            placeholder="m², ml, un"
                            value={customUnit}
                            onChange={(e) => setCustomUnit(e.target.value)}
                        />
                    </FormGroup>

                    {/* Fecha de inicio */}
                    <FormGroup
                        label="Fecha de inicio"
                        htmlFor="start_date"
                    >
                        <DatePicker
                            id="start_date"
                            name="start_date"
                            value={startDate}
                            onChange={setStartDate}
                        />
                    </FormGroup>

                    {/* Fecha de fin */}
                    <FormGroup
                        label="Fecha de fin"
                        htmlFor="end_date"
                    >
                        <DatePicker
                            id="end_date"
                            name="end_date"
                            value={endDate}
                            onChange={setEndDate}
                        />
                    </FormGroup>

                    {/* Estado */}
                    <FormGroup
                        label="Estado"
                        htmlFor="status"
                    >
                        <Select value={status} onValueChange={(value) => setStatus(value as "pending" | "in_progress" | "completed" | "paused")}>
                            <SelectTrigger id="status">
                                <SelectValue placeholder="Seleccionar estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">Pendiente</SelectItem>
                                <SelectItem value="in_progress">En Progreso</SelectItem>
                                <SelectItem value="completed">Completada</SelectItem>
                                <SelectItem value="paused">Pausada</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormGroup>

                    {/* Progreso */}
                    <FormGroup
                        label="Progreso (%)"
                        htmlFor="progress_percent"
                        error={errors.progressPercent}
                    >
                        <Input
                            id="progress_percent"
                            name="progress_percent"
                            type="number"
                            min={0}
                            max={100}
                            placeholder="0"
                            value={progressPercent}
                            onChange={(e) => setProgressPercent(e.target.value)}
                        />
                    </FormGroup>

                    {/* Observaciones - Full width */}
                    <FormGroup
                        label="Observaciones"
                        htmlFor="notes"
                        className="md:col-span-2"
                    >
                        <Textarea
                            id="notes"
                            name="notes"
                            placeholder="Notas adicionales sobre la tarea..."
                            className="min-h-[80px]"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </FormGroup>
                </div>
            </div>

            {/* Footer sticky - SIEMPRE fuera del div scrolleable */}
            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isLoading}
                submitLabel={isEditing ? "Guardar Cambios" : "Crear Tarea"}
                onCancel={onCancel}
            />
        </form>
    );
}
