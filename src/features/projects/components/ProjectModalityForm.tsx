"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/global/form-footer";
import { useModal } from "@/providers/modal-store";
import {
    createProjectModality,
    updateProjectModality,
} from "@/features/projects/actions/project-settings-actions";

interface ProjectModalityFormProps {
    organizationId: string;
    initialData?: {
        id: string;
        name: string;
    } | null;
    onSuccess: (data: { id: string; name: string; is_system: boolean; organization_id: string | null }) => void;
}

export function ProjectModalityForm({ organizationId, initialData, onSuccess }: ProjectModalityFormProps) {
    const t = useTranslations("Project.settings.modalities.modal");
    const { closeModal, setBeforeClose } = useModal();
    const [name, setName] = useState(initialData?.name || "");
    const [isSaving, setIsSaving] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const isEditing = !!initialData;
    const isDirty = name.trim() !== (initialData?.name || "");

    useEffect(() => {
        if (isDirty) {
            setBeforeClose(async () => {
                return window.confirm(t("unsavedChanges") || "Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar?");
            });
        } else {
            setBeforeClose(undefined);
        }
        return () => setBeforeClose(undefined);
    }, [isDirty, setBeforeClose, t]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            setError(t("requiredError") || "El nombre es obligatorio");
            return;
        }
        setError(null);

        setIsSaving(true);
        try {
            if (isEditing && initialData) {
                const result = await updateProjectModality(initialData.id, organizationId, name.trim());
                if (result.data) {
                    onSuccess(result.data);
                    closeModal();
                }
            } else {
                const result = await createProjectModality(organizationId, name.trim());
                if (result.data) {
                    onSuccess(result.data);
                    closeModal();
                }
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="p-4 space-y-4">
                <FormGroup
                    label={t("nameLabel")}
                    htmlFor="modalityName"
                    error={error || undefined}
                    required
                >
                    <Input
                        id="modalityName"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            if (error) setError(null);
                        }}
                        placeholder={t("namePlaceholder")}
                        autoFocus
                    />
                </FormGroup>
            </div>

            <FormFooter
                onCancel={closeModal}
                cancelLabel={t("cancel")}
                submitLabel={isSaving ? t("saving") : t("save")}
                isLoading={isSaving}
                submitDisabled={!name.trim()}
            />
        </form>
    );
}
