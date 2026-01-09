"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormFooter } from "@/components/global/form-footer";
import { toast } from "sonner";
import { useModal } from "@/providers/modal-store";
import { createContactType, updateContactType } from "@/actions/contacts";
import { ContactType } from "@/types/contact";

interface ContactTypeFormProps {
    organizationId: string;
    initialData?: ContactType;
    onSuccess?: (type: ContactType) => void;
}

export function ContactTypeForm({ organizationId, initialData, onSuccess }: ContactTypeFormProps) {
    // We reuse Project translations or create generic ones. Ideally "Settings.ContactTypes"
    // For now I'll use hardcoded or generic strings if translation keys missing
    const { closeModal } = useModal();
    const [name, setName] = useState(initialData?.name || "");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (initialData) {
                await updateContactType(initialData.id, name);
                toast.success("Tipo actualizado correctamente");
                if (onSuccess) onSuccess({ ...initialData, name });
            } else {
                const newType = await createContactType(organizationId, name);
                toast.success("Tipo creado correctamente");
                if (onSuccess && newType) {
                    onSuccess(newType);
                }
            }
            closeModal();
        } catch (error) {
            console.error("Error saving contact type:", error);
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
                        placeholder="Ej. Proveedor"
                        required
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
