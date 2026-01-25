"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { useModal } from "@/providers/modal-store";
import {
    createProjectType,
    updateProjectType,
} from "@/features/projects/actions/project-settings-actions";

interface ProjectTypeFormProps {
    organizationId: string;
    initialData?: {
        id: string;
        name: string;
    } | null;
    onSuccess: (data: { id: string; name: string; is_system: boolean; organization_id: string | null }) => void;
}

export function ProjectTypeForm({ organizationId, initialData, onSuccess }: ProjectTypeFormProps) {
    const t = useTranslations("Project.settings.types.modal");
    const { closeModal, setBeforeClose } = useModal();
    const [name, setName] = useState(initialData?.name || "");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isEditing = !!initialData;
    const isDirty = name.trim() !== (initialData?.name || "");

    useEffect(() => {
        /* 
        Temporarily disabled for debugging
        if (isDirty) {
            setBeforeClose(async () => {
                return window.confirm(t("unsavedChanges") || "Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar?");
            });
        } else {
            setBeforeClose(undefined);
        }
        */
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
                const result = await updateProjectType(initialData.id, organizationId, name.trim());
                if (result.error) {
                    toast.error(result.error);
                } else if (result.data) {
                    onSuccess(result.data);
                    closeModal();
                }
            } else {
                const result = await createProjectType(organizationId, name.trim());
                if (result.error) {
                    toast.error(result.error);
                } else if (result.data) {
                    onSuccess(result.data);
                    closeModal();
                }
            }
        } catch (e) {
            toast.error("Ocurrió un error inesperado");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex-1 space-y-4">
                <FormGroup
                    label={t("nameLabel")}
                    // ... rest
                    htmlFor="typeName"
                    error={error || undefined}
                    required
                >
                    <Input
                        id="typeName"
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
                className="-mx-4 -mb-4 mt-6"
            />
        </form>
    );
}

