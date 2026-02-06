"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { toast } from "sonner";
import { useModal } from "@/stores/modal-store";
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // ✅ OPTIMISTIC: Close and show success immediately
        if (onSuccess && initialData) onSuccess({ ...initialData, name });
        closeModal();
        toast.success(initialData ? "Tipo actualizado correctamente" : "Tipo creado correctamente");

        // 🔄 BACKGROUND: Submit to server
        try {
            if (initialData) {
                await updateContactType(initialData.id, name);
            } else {
                const newType = await createContactType(organizationId, name);
                if (onSuccess && newType) {
                    onSuccess(newType);
                }
            }
        } catch (error) {
            console.error("Error saving contact type:", error);
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
                        placeholder="Ej. Proveedor"
                        required
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

