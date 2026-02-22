"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { useModal } from "@/stores/modal-store";

interface ProjectsModalityFormProps {
    organizationId: string;
    initialData?: {
        id: string;
        name: string;
    } | null;
    /** Called with form data. The VIEW handles server calls + optimistic updates. */
    onSubmit: (data: { name: string }) => void;
}

export function ProjectsModalityForm({ organizationId, initialData, onSubmit }: ProjectsModalityFormProps) {
    const t = useTranslations("Project.settings.modalities.modal");
    const { closeModal, setBeforeClose } = useModal();
    const [name, setName] = useState(initialData?.name || "");
    const [error, setError] = useState<string | null>(null);

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            setError(t("requiredError") || "El nombre es obligatorio");
            return;
        }

        // Delegate to view → close immediately (optimistic)
        onSubmit({ name: name.trim() });
        setBeforeClose(undefined); // Clear guard so modal closes without "unsaved changes" prompt
        closeModal();
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto">
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
                submitLabel={t("save")}
                submitDisabled={!name.trim()}
                className="-mx-4 -mb-4 mt-6"
            />
        </form>
    );
}
