"use client";

import { useState, useEffect } from "react";
import { usePanel } from "@/stores/panel-store";
import { FormTextField } from "@/components/shared/forms/fields/form-text-field";
import { toast } from "sonner";
import { createContactCategory, updateContactCategory } from "@/actions/contacts";
import { ContactCategory } from "@/types/contact";
import { Tag } from "lucide-react";

interface ContactCategoryFormProps {
    organizationId: string;
    initialData?: ContactCategory;
    onSuccess?: (category: ContactCategory) => void;
    /** Injected by PanelProvider — connects form to panel footer submit button */
    formId?: string;
}

export function ContactCategoryForm({ organizationId, initialData, onSuccess, formId }: ContactCategoryFormProps) {
    const { closePanel, setPanelMeta } = usePanel();
    const isEditing = !!initialData;
    const [name, setName] = useState(initialData?.name || "");

    // 🚨 OBLIGATORIO: Self-describe via setPanelMeta
    useEffect(() => {
        setPanelMeta({
            icon: Tag,
            title: isEditing ? "Editar Categoría" : "Nueva Categoría",
            description: isEditing
                ? `Modificando "${initialData?.name}"`
                : "Creá una nueva categoría para organizar tus contactos.",
            size: "sm",
            footer: {
                submitLabel: isEditing ? "Guardar" : "Crear",
            },
        });
    }, [isEditing, initialData?.name, setPanelMeta]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // ✅ OPTIMISTIC: Close and show success immediately
        if (onSuccess && initialData) onSuccess({ ...initialData, name });
        closePanel();
        toast.success(isEditing ? "Categoría actualizada correctamente" : "Categoría creada correctamente");

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

    // 🚨 OBLIGATORIO: <form id={formId}> — conecta con el footer del container
    return (
        <form id={formId} onSubmit={handleSubmit}>
            <FormTextField
                variant="hero"
                value={name}
                onChange={setName}
                placeholder="Ej. Proveedor"
                autoFocus
            />
        </form>
    );
}
