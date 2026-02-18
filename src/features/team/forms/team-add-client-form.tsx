"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { useModal } from "@/stores/modal-store";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { Input } from "@/components/ui/input";
import { Info } from "lucide-react";
import { addExternalCollaboratorAction } from "@/features/team/actions";

interface AddClientFormProps {
    organizationId: string;
}

export function AddClientForm({ organizationId }: AddClientFormProps) {
    const router = useRouter();
    const { closeModal } = useModal();

    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCancel = () => {
        closeModal();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            toast.error("El email es obligatorio");
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await addExternalCollaboratorAction(organizationId, email.trim(), "client");

            if (!result.success) {
                toast.error(result.error || "Error al agregar cliente");
                setIsSubmitting(false);
                return;
            }

            closeModal();
            toast.success("Se envió una invitación al cliente por email.");
            router.refresh();
        } catch (error) {
            toast.error("Error inesperado al agregar cliente");
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
                <FormGroup label="Email del cliente" required>
                    <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        autoComplete="off"
                        autoFocus
                    />
                </FormGroup>

                <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    <div className="text-xs text-muted-foreground space-y-1">
                        <p>
                            <strong className="text-foreground">Los clientes no ocupan asientos del plan.</strong> Podés agregar clientes ilimitados.
                        </p>
                        <p>
                            Si la persona ya tiene cuenta en Seencel, se la agrega directamente.
                            Si no, se le envía un email de invitación para que se registre.
                        </p>
                    </div>
                </div>
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isSubmitting}
                submitLabel="Agregar Cliente"
                onCancel={handleCancel}
            />
        </form>
    );
}
