"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useModal } from "@/stores/modal-store";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { Input } from "@/components/ui/input";
import { createOrganization } from "@/features/organization/actions";

export function OrganizationCreateForm() {
    const { closeModal } = useModal();
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState("");

    const handleCancel = () => {
        closeModal();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedName = name.trim();
        if (!trimmedName) {
            toast.error("El nombre es obligatorio");
            return;
        }

        if (trimmedName.length < 2) {
            toast.error("El nombre debe tener al menos 2 caracteres");
            return;
        }

        if (trimmedName.length > 100) {
            toast.error("El nombre no puede tener más de 100 caracteres");
            return;
        }

        setIsLoading(true);
        try {
            // This action creates the org, sets it as active, and redirects
            // The redirect will unmount this component so we don't need handleSuccess
            const result = await createOrganization(trimmedName);

            // If we reach here, it means there was an error (redirect didn't fire)
            if (!result.success) {
                toast.error(result.error || "Error al crear la organización");
                setIsLoading(false);
            }
        } catch (error) {
            // Next.js redirect throws NEXT_REDIRECT, we should not catch it
            // If it's a real error, show it
            if (error instanceof Error && error.message === "NEXT_REDIRECT") {
                return; // Let the redirect happen
            }
            toast.error("Error inesperado al crear la organización");
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto space-y-4">
                <FormGroup label="Nombre de la organización" required>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Constructora Acme S.A."
                        autoComplete="off"
                        autoFocus
                        maxLength={100}
                    />
                </FormGroup>

                <p className="text-xs text-muted-foreground">
                    Se creará una nueva organización con el plan Free. Podrás configurar el logo, moneda y demás ajustes desde la configuración de la organización.
                </p>
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isLoading}
                submitLabel="Crear Organización"
                onCancel={handleCancel}
            />
        </form>
    );
}
