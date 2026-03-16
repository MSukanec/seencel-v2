"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { usePanel } from "@/stores/panel-store";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info, UserCheck } from "lucide-react";
import { addExternalCollaboratorAction } from "@/features/team/actions";
import { ADVISOR_ACTOR_TYPE_LABELS } from "@/features/team/types";

interface AddExternalFormProps {
    organizationId: string;
    formId?: string;
}

export function AddExternalCollaboratorForm({ organizationId, formId }: AddExternalFormProps) {
    const router = useRouter();
    const { closePanel, setPanelMeta, setSubmitting } = usePanel();

    // Form state
    const [email, setEmail] = useState("");
    const [actorType, setActorType] = useState("");

    // Setup Panel Meta
    useEffect(() => {
        setPanelMeta({
            title: "Vincular Colaborador Externo",
            description: "Envía una invitación formal para que un colaborador externo se una a tu organización.",
            icon: UserCheck,
            size: "md",
            footer: {
                submitLabel: "Agregar Colaborador",
            }
        });
    }, [setPanelMeta]);

    const handleCancel = () => {
        closePanel();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            toast.error("El email es obligatorio");
            return;
        }

        if (!actorType) {
            toast.error("Seleccioná un tipo de colaborador");
            return;
        }

        setSubmitting(true);

        try {
            const result = await addExternalCollaboratorAction(organizationId, email.trim(), actorType);

            if (!result.success) {
                toast.error(result.error || "Error al agregar colaborador");
                setSubmitting(false);
                return;
            }

            closePanel();
            toast.success("Se envió una invitación al colaborador por email.");
            router.refresh();
        } catch (error) {
            toast.error("Error inesperado al agregar colaborador");
            setSubmitting(false);
        }
    };

    const selectedTypeInfo = actorType ? ADVISOR_ACTOR_TYPE_LABELS[actorType] : null;

    return (
        <form id={formId} onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto space-y-4">
                <FormGroup label="Email" required>
                    <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        autoComplete="off"
                        autoFocus
                    />
                </FormGroup>

                <FormGroup label="Tipo de colaborador" required>
                    <Select value={actorType} onValueChange={setActorType}>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(ADVISOR_ACTOR_TYPE_LABELS).map(([key, { label, description }]) => (
                                <SelectItem key={key} value={key} className="py-2">
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium">{label}</span>
                                        <span className="text-xs text-muted-foreground">{description}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormGroup>

                {/* Contextual description for selected type */}
                {selectedTypeInfo && (
                    <div className="rounded-lg border bg-muted/30 p-3 flex items-start gap-2">
                        <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <p className="text-sm text-muted-foreground">
                            {selectedTypeInfo.description}
                        </p>
                    </div>
                )}

                {/* Info note */}
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    <div className="text-xs text-muted-foreground space-y-1">
                        <p>
                            <strong className="text-foreground">Los colaboradores no ocupan asientos del plan.</strong>
                        </p>
                        <p>
                            Si la persona ya tiene cuenta en Seencel, se la agrega directamente.
                            Si no, se le envía un email de invitación para que se registre.
                        </p>
                    </div>
                </div>
            </div>
        </form>
    );
}
