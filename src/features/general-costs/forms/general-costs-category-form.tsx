"use client";

import { useEffect, useTransition, useState } from "react";
import { usePanel } from "@/stores/panel-store";
import { FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { TextField, NotesField } from "@/components/shared/forms/fields";
import { GeneralCostCategory } from "@/features/general-costs/types";
import { createGeneralCostCategory, updateGeneralCostCategory } from "@/features/general-costs/actions";

// ─── Types ───────────────────────────────────────────────

interface CategoryFormProps {
    organizationId: string;
    initialData?: GeneralCostCategory | null;
    onSuccess?: () => void;
    formId?: string;
}

// ─── Component ───────────────────────────────────────────

export function GeneralCostsCategoryForm({
    organizationId,
    initialData,
    onSuccess,
    formId,
}: CategoryFormProps) {
    const { closePanel, setPanelMeta } = usePanel();
    const [isPending, startTransition] = useTransition();
    const isEditing = !!initialData;

    // Form state
    const [name, setName] = useState(initialData?.name || "");
    const [description, setDescription] = useState(initialData?.description || "");

    // ─── Panel Meta ──────────────────────────────────────
    useEffect(() => {
        setPanelMeta({
            icon: FolderOpen,
            title: isEditing ? "Editar Categoría" : "Nueva Categoría",
            description: isEditing
                ? "Modifica los datos de la categoría."
                : "Creá una nueva categoría para organizar tus gastos.",
            size: "sm",
            footer: {
                submitLabel: isEditing ? "Guardar Cambios" : "Crear Categoría",
            },
        });
    }, [isEditing, setPanelMeta]);

    // ─── Submit ──────────────────────────────────────────
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error("El nombre es obligatorio");
            return;
        }

        startTransition(async () => {
            try {
                if (isEditing && initialData) {
                    await updateGeneralCostCategory(initialData.id, { name, description: description || undefined });
                    toast.success("Categoría actualizada");
                } else {
                    await createGeneralCostCategory({
                        name,
                        description: description || undefined,
                        organization_id: organizationId,
                        is_system: false,
                    });
                    toast.success("Categoría creada");
                }
                onSuccess?.();
                closePanel();
            } catch {
                toast.error("Error al guardar la categoría");
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
                    placeholder="Ej. Oficina, Transporte..."
                    required
                />
                <NotesField
                    label="Descripción"
                    value={description}
                    onChange={setDescription}
                    placeholder="Detalles opcionales..."
                    rows={3}
                />
            </div>
        </form>
    );
}
