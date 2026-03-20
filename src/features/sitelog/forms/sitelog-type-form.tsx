"use client";

import { useEffect, useTransition, useState } from "react";
import { usePanel } from "@/stores/panel-store";
import { Tags } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { TextField, NotesField } from "@/components/shared/forms/fields";
import { createSiteLogType, updateSiteLogType } from "../actions";
import { SiteLogType } from "../types";

// ─── Types ───────────────────────────────────────────────

interface SiteLogTypeFormProps {
    organizationId: string;
    initialData?: SiteLogType;
    onSuccess?: () => void;
    formId?: string;
}

// ─── Component ───────────────────────────────────────────

export function SiteLogTypeForm({
    organizationId,
    initialData,
    onSuccess,
    formId,
}: SiteLogTypeFormProps) {
    const router = useRouter();
    const { closePanel, setPanelMeta, completePanel } = usePanel();
    const [isPending, startTransition] = useTransition();
    const isEditing = !!initialData;

    // Form state
    const [name, setName] = useState(initialData?.name || "");
    const [description, setDescription] = useState(initialData?.description || "");

    // ─── Panel Meta ──────────────────────────────────────
    useEffect(() => {
        setPanelMeta({
            icon: Tags,
            title: isEditing ? "Editar Tipo" : "Nuevo Tipo de Bitácora",
            description: isEditing
                ? "Modifica el nombre de este tipo de bitácora."
                : "Define un nuevo tipo para clasificar tus registros.",
            size: "sm",
            footer: {
                submitLabel: isEditing ? "Guardar" : "Crear Tipo",
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
                    await updateSiteLogType(organizationId, initialData.id, name, description);
                    toast.success("Tipo actualizado correctamente");
                } else {
                    await createSiteLogType(organizationId, name, description);
                    toast.success("Tipo creado correctamente");
                }
                onSuccess?.();
                router.refresh();

                if (isEditing) {
                    closePanel();
                } else {
                    completePanel(() => {
                        setName("");
                        setDescription("");
                    });
                }
            } catch {
                toast.error("Error al guardar tipo");
            }
        });
    };

    // ─── Render ──────────────────────────────────────────
    return (
        <form id={formId} onSubmit={handleSubmit}>
            <div className="space-y-4">
                <TextField
                    value={name}
                    onChange={setName}
                    label="Nombre"
                    required
                    placeholder="Ej. Incidente"
                    autoFocus
                />
                <NotesField
                    value={description}
                    onChange={setDescription}
                    label="Descripción"
                    placeholder="Descripción breve..."
                    rows={3}
                />
            </div>
        </form>
    );
}
