"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { toast } from "sonner";
import { useModal } from "@/providers/modal-store";
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
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (initialData) {
                await updateSiteLogType(initialData.id, name, description);
                toast.success("Tipo actualizado correctamente");
                if (onSuccess) onSuccess({ ...initialData, name, description });
            } else {
                const newType = await createSiteLogType(organizationId, name, description);
                toast.success("Tipo creado correctamente");
                if (onSuccess && newType) {
                    onSuccess(newType);
                }
            }
            closeModal();
        } catch (error) {
            console.error("Error saving site log type:", error);
            toast.error("Error al guardar tipo (Revisa la consola)");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
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
                isLoading={isLoading}
                submitLabel={initialData ? "Guardar" : "Crear"}
                className="-mx-4 -mb-4 mt-6"
            />
        </form>
    );
}

