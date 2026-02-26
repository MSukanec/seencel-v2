"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/shared/forms/fields/text-field";
import { usePanel } from "@/stores/panel-store";
import { Layers } from "lucide-react";

interface ProjectsTypeFormProps {
    organizationId: string;
    initialData?: {
        id: string;
        name: string;
    } | null;
    /** Called with form data. The VIEW handles server calls + optimistic updates. */
    onSubmit: (data: { name: string }) => void;
    formId?: string;
}

export function ProjectsTypeForm({ organizationId, initialData, onSubmit, formId }: ProjectsTypeFormProps) {
    const t = useTranslations("Project.settings.types.modal");
    const { closePanel, setPanelMeta } = usePanel();
    const [name, setName] = useState(initialData?.name || "");

    const isEditing = !!initialData;

    // Self-describe
    useEffect(() => {
        setPanelMeta({
            icon: Layers,
            title: isEditing ? (t("editTitle") || "Editar Tipo") : (t("createTitle") || "Nuevo Tipo"),
            description: isEditing
                ? (t("editDescription") || "Modificá el nombre del tipo de proyecto.")
                : (t("createDescription") || "Creá un nuevo tipo de proyecto para clasificar tus obras."),
            size: "sm",
            footer: {
                submitLabel: t("save") || "Guardar",
            }
        });
    }, [isEditing, setPanelMeta, t]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        // Delegate to view → close immediately (optimistic)
        onSubmit({ name: name.trim() });
        closePanel();
    };

    return (
        <form id={formId} onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto">
                <TextField
                    value={name}
                    onChange={setName}
                    label={t("nameLabel")}
                    placeholder={t("namePlaceholder")}
                    required
                    autoFocus
                />
            </div>
        </form>
    );
}
