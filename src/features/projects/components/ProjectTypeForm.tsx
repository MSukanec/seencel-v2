"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/global/form-footer";
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
    const { closeModal } = useModal();
    const [name, setName] = useState(initialData?.name || "");
    const [isSaving, setIsSaving] = useState(false);

    const isEditing = !!initialData;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSaving(true);
        try {
            if (isEditing && initialData) {
                const result = await updateProjectType(initialData.id, organizationId, name.trim());
                if (result.data) {
                    onSuccess(result.data);
                    closeModal();
                }
            } else {
                const result = await createProjectType(organizationId, name.trim());
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
                <FormGroup label={t("nameLabel")} htmlFor="typeName">
                    <Input
                        id="typeName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
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
