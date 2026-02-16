"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useModal } from "@/stores/modal-store";
import { useRouter } from "@/i18n/routing";
import { TextField } from "@/components/shared/forms/fields";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { createSiteLogType, updateSiteLogType } from "../actions";
import { SiteLogType } from "../types";

interface SiteLogTypeFormProps {
    organizationId: string;
    initialData?: SiteLogType;
}

export function SiteLogTypeForm({ organizationId, initialData }: SiteLogTypeFormProps) {
    const router = useRouter();
    const { closeModal } = useModal();
    const [name, setName] = useState(initialData?.name || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const isEditing = !!initialData;

    // Semi-autonomous callbacks
    const handleSuccess = () => {
        closeModal();
        router.refresh();
    };

    const handleCancel = () => {
        closeModal();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Optimistic: Close and show success immediately
        closeModal();
        toast.success(isEditing ? "Tipo actualizado correctamente" : "Tipo creado correctamente");

        // Background: Submit to server
        try {
            if (isEditing && initialData) {
                await updateSiteLogType(initialData.id, name, description);
            } else {
                await createSiteLogType(organizationId, name, description);
            }
        } catch (error) {
            console.error("Error saving site log type:", error);
            toast.error("Error al guardar tipo");
            router.refresh(); // Rollback
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
                <TextField
                    value={name}
                    onChange={setName}
                    label="Nombre"
                    required
                    placeholder="Ej. Incidente"
                    autoFocus
                />
                <TextField
                    value={description}
                    onChange={setDescription}
                    label="Descripción"
                    required={false}
                    placeholder="Descripción breve..."
                />
            </div>
            <FormFooter
                onCancel={handleCancel}
                submitLabel={isEditing ? "Guardar" : "Crear"}
                className="-mx-4 -mb-4 mt-6"
            />
        </form>
    );
}
