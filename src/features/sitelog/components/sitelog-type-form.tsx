"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { toast } from "sonner";
import { useModal } from "@/stores/modal-store";
import { createSiteLogType, updateSiteLogType } from "@/actions/sitelog";
import { SiteLogType } from "@/types/sitelog";

interface SiteLogTypeFormProps {
    organizationId: string;
    initialData?: SiteLogType;
    onSuccess?: (type: SiteLogType) => void;
}

export function SiteLogTypeForm({ organizationId, initialData, onSuccess }: SiteLogTypeFormProps) {
    const { closeModal } = useModal();
    const [name, setName] = useState(initialData?.name || "");
    const [description, setDescription] = useState(initialData?.description || "");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // ✅ OPTIMISTIC: Close and show success immediately
        if (onSuccess && initialData) onSuccess({ ...initialData, name, description });
        closeModal();
        toast.success(initialData ? "Tipo actualizado correctamente" : "Tipo creado correctamente");

        // 🔄 BACKGROUND: Submit to server
        try {
            if (initialData) {
                await updateSiteLogType(initialData.id, name, description);
            } else {
                const newType = await createSiteLogType(organizationId, name, description);
                if (onSuccess && newType) {
                    onSuccess(newType);
                }
            }
        } catch (error) {
            console.error("Error saving site log type:", error);
            toast.error("Error al guardar tipo (Revisa la consola)");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej. Incidente"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Descripción (Opcional)</Label>
                    <Input
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descripción breve..."
                    />
                </div>
            </div>
            <FormFooter
                onCancel={closeModal}
                submitLabel={initialData ? "Guardar" : "Crear"}
                className="-mx-4 -mb-4 mt-6"
            />
        </form>
    );
}

