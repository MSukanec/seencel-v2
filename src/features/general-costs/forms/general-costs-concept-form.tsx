"use client";

import { useEffect, useTransition, useState } from "react";
import { usePanel } from "@/stores/panel-store";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import {
    TextField,
    NotesField,
    SelectField,
    SwitchField,
} from "@/components/shared/forms/fields";
import { GeneralCost, GeneralCostCategory } from "@/features/general-costs/types";
import { createGeneralCost, updateGeneralCost } from "@/features/general-costs/actions";

// ─── Types ───────────────────────────────────────────────

interface ConceptFormProps {
    organizationId: string;
    categories: GeneralCostCategory[];
    initialData?: GeneralCost | null;
    onSuccess?: () => void;
    formId?: string;
}

// ─── Constants ───────────────────────────────────────────

const RECURRENCE_OPTIONS = [
    { value: "monthly", label: "Mensual" },
    { value: "weekly", label: "Semanal" },
    { value: "quarterly", label: "Trimestral" },
    { value: "yearly", label: "Anual" },
];

// ─── Component ───────────────────────────────────────────

export function GeneralCostsConceptForm({
    organizationId,
    categories,
    initialData,
    onSuccess,
    formId,
}: ConceptFormProps) {
    const { closePanel, setPanelMeta } = usePanel();
    const [isPending, startTransition] = useTransition();
    const isEditing = !!initialData;

    // Form state
    const [name, setName] = useState(initialData?.name || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [categoryId, setCategoryId] = useState(initialData?.category_id || "");
    const [isRecurring, setIsRecurring] = useState(initialData?.is_recurring ?? false);
    const [recurrenceInterval, setRecurrenceInterval] = useState(initialData?.recurrence_interval || "monthly");
    const [expectedDay, setExpectedDay] = useState(String(initialData?.expected_day || "1"));

    // ─── Panel Meta ──────────────────────────────────────
    useEffect(() => {
        setPanelMeta({
            icon: FileText,
            title: isEditing ? "Editar Concepto" : "Nuevo Concepto",
            description: isEditing
                ? "Modificá los datos del concepto de gasto."
                : "Definí un concepto de gasto (ej. Alquiler, Luz, Internet).",
            size: "md",
            footer: {
                submitLabel: isEditing ? "Guardar Cambios" : "Crear Concepto",
            },
        });
    }, [isEditing, setPanelMeta]);

    // ─── Category options ────────────────────────────────
    const categoryOptions = categories.map((cat) => ({
        value: cat.id,
        label: cat.name,
    }));

    // ─── Submit ──────────────────────────────────────────
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error("El nombre es obligatorio");
            return;
        }
        if (!categoryId) {
            toast.error("La categoría es obligatoria");
            return;
        }

        startTransition(async () => {
            try {
                const payload = {
                    name,
                    description: description || undefined,
                    category_id: categoryId,
                    is_recurring: isRecurring,
                    recurrence_interval: isRecurring ? recurrenceInterval : undefined,
                    expected_day: isRecurring ? Number(expectedDay) || undefined : undefined,
                };

                if (isEditing && initialData) {
                    await updateGeneralCost(initialData.id, payload);
                    toast.success("Concepto actualizado");
                } else {
                    await createGeneralCost({
                        ...payload,
                        organization_id: organizationId,
                    });
                    toast.success("Concepto creado");
                }
                onSuccess?.();
                closePanel();
            } catch {
                toast.error("Error al guardar el concepto");
            }
        });
    };

    // ─── Render ──────────────────────────────────────────
    return (
        <form id={formId} onSubmit={handleSubmit}>
            <div className="space-y-4">
                <TextField
                    label="Nombre"
                    value={name}
                    onChange={setName}
                    placeholder="Ej. Alquiler Local"
                    required
                />

                <SelectField
                    label="Categoría"
                    value={categoryId}
                    onChange={setCategoryId}
                    options={categoryOptions}
                    placeholder="Seleccionar categoría"
                    required
                />

                <SwitchField
                    label="Recurrencia"
                    value={isRecurring}
                    onChange={setIsRecurring}
                    description="Activar si este gasto se repite periódicamente"
                />

                {isRecurring && (
                    <div className="grid grid-cols-2 gap-4">
                        <SelectField
                            label="Frecuencia"
                            value={recurrenceInterval}
                            onChange={setRecurrenceInterval}
                            options={RECURRENCE_OPTIONS}
                            placeholder="Seleccionar frecuencia"
                        />
                        <TextField
                            label="Día esperado"
                            value={expectedDay}
                            onChange={setExpectedDay}
                            placeholder="1-31"
                            helpText="Día del mes aproximado"
                        />
                    </div>
                )}

                <NotesField
                    label="Descripción"
                    value={description}
                    onChange={setDescription}
                    placeholder="Detalles adicionales..."
                    rows={3}
                />
            </div>
        </form>
    );
}
