"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { FormHeroField } from "@/components/shared/forms/fields";
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
    const { closePanel, setPanelMeta, completePanel } = usePanel();
    const [name, setName] = useState(initialData?.name || "");

    const isEditing = !!initialData;

    // Self-describe
    useEffect(() => {
        setPanelMeta({
            icon: FolderCog,
            title: isEditing ? (t("editTitle") || "Editar Modalidad") : (t("createTitle") || "Nueva Modalidad de Proyecto"),
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

        onSubmit({ name: name.trim() });

        if (isEditing) {
            closePanel();
        } else {
            completePanel(() => setName(""));
        }
    };

    return (
        <form id={formId} onSubmit={handleSubmit}>
            <FormHeroField
                value={name}
                onChange={setName}
                placeholder={t("namePlaceholder") || "Ej: Obra Nueva"}
                autoFocus
            />
        </form>
    );
}
