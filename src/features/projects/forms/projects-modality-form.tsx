"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/shared/forms/fields/text-field";
import { usePanel } from "@/stores/panel-store";
import { FolderCog } from "lucide-react";

interface ProjectsModalityFormProps {
    organizationId: string;
    initialData?: {
        id: string;
        name: string;
    } | null;
    /** Called with form data. The VIEW handles server calls + optimistic updates. */
    onSubmit: (data: { name: string }) => void;
    formId?: string;
}

export function ProjectsModalityForm({ organizationId, initialData, onSubmit, formId }: ProjectsModalityFormProps) {
    const t = useTranslations("Project.settings.modalities.modal");
    const { closePanel, setPanelMeta } = usePanel();
    const [name, setName] = useState(initialData?.name || "");

    const isEditing = !!initialData;

    // Self-describe
    useEffect(() => {
        setPanelMeta({
            icon: FolderCog,
            title: isEditing ? (t("editTitle") || "Editar Modalidad") : (t("createTitle") || "Nueva Modalidad"),
            description: isEditing
                ? (t("editDescription") || "Modificá el nombre de la modalidad.")
                : (t("createDescription") || "Creá una nueva modalidad de proyecto."),
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
