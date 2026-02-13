"use client";

import { useState } from "react";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { TextField } from "@/components/shared/forms/fields";
import { toast } from "sonner";
import { useModal } from "@/stores/modal-store";
import { createContactCategory, updateContactCategory } from "@/actions/contacts";
import { ContactCategory } from "@/types/contact";

interface ContactCategoryFormProps {
    organizationId: string;
    initialData?: ContactCategory;
    onSuccess?: (category: ContactCategory) => void;
}

export function ContactCategoryForm({ organizationId, initialData, onSuccess }: ContactCategoryFormProps) {
    const { closeModal } = useModal();
    const [name, setName] = useState(initialData?.name || "");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // ✅ OPTIMISTIC: Close and show success immediately
        if (onSuccess && initialData) onSuccess({ ...initialData, name });
        closeModal();
        toast.success(initialData ? "Categoría actualizada correctamente" : "Categoría creada correctamente");

        // 🔄 BACKGROUND: Submit to server
        try {
            if (initialData) {
                await updateContactCategory(initialData.id, name);
            } else {
                const newCategory = await createContactCategory(organizationId, name);
                if (onSuccess && newCategory) {
                    onSuccess(newCategory);
                }
            }
        } catch (error) {
            console.error("Error saving contact category:", error);
            toast.error("Error al guardar categoría (Revisa la consola)");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col max-h-full min-h-0">
            <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
                <TextField
                    label="Nombre"
                    value={name}
                    onChange={setName}
                    placeholder="Ej. Proveedor"
                    required
                    autoFocus
                />
            </div>
            <FormFooter
                onCancel={closeModal}
                submitLabel={initialData ? "Guardar" : "Crear"}
                className="-mx-4 -mb-4 mt-6"
            />
        </form>
    );
}
