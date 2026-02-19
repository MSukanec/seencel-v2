
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { useModal } from "@/stores/modal-store";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { FormGroup } from "@/components/ui/form-group";
import { Input } from "@/components/ui/input";
import { sendClientInvitationAction } from "@/features/clients/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BadgeCheck, Mail, ShieldCheck } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface InviteClientPortalFormProps {
    /** ID of the project_clients record */
    clientId: string;
    contactName: string | null;
    contactEmail: string | null;
    contactAvatarUrl?: string | null;
    /** Whether the contact already has a Seencel account */
    isSeencelUser?: boolean;
}

// ============================================================================
// Helpers
// ============================================================================

function getInitials(name: string | null): string {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
}

// ============================================================================
// Component
// ============================================================================

export function InviteClientPortalForm({
    clientId,
    contactName,
    contactEmail,
    contactAvatarUrl,
    isSeencelUser = false,
}: InviteClientPortalFormProps) {
    const router = useRouter();
    const { closeModal } = useModal();
    const [isPending, startTransition] = useTransition();

    // If the contact has no email, allow entering one inline
    const [overrideEmail, setOverrideEmail] = useState("");
    const needsEmail = !contactEmail;

    const displayName = contactName || contactEmail || "el cliente";

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        startTransition(async () => {
            try {
                const result = await sendClientInvitationAction(clientId);

                if (!result.success) {
                    toast.error(result.error || "Error al enviar la invitación");
                    return;
                }

                closeModal();
                toast.success(`Invitación enviada a ${displayName}`);
                router.refresh();
            } catch (error: any) {
                toast.error(error.message || "Error al enviar la invitación");
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto space-y-5 p-1 px-2">

                {/* Client identity card */}
                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
                    <div className="relative shrink-0">
                        <Avatar className="h-11 w-11 border">
                            <AvatarImage src={contactAvatarUrl || undefined} alt={displayName} />
                            <AvatarFallback className="text-sm font-medium">
                                {getInitials(contactName)}
                            </AvatarFallback>
                        </Avatar>
                        {isSeencelUser && (
                            <div
                                className="absolute -bottom-0.5 -right-0.5 rounded-full bg-background p-px ring-1 ring-background"
                                title="Usuario activo en Seencel"
                            >
                                <BadgeCheck className="h-3.5 w-3.5 text-blue-500" fill="rgb(59,130,246)" color="white" />
                            </div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{displayName}</p>
                        {contactEmail && (
                            <p className="text-xs text-muted-foreground truncate">{contactEmail}</p>
                        )}
                        {isSeencelUser && (
                            <p className="text-xs text-blue-500 mt-0.5">Usuario activo en Seencel</p>
                        )}
                    </div>
                </div>

                {/* Explanation — context-aware */}
                <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                        <p className="text-sm font-medium text-foreground">¿Qué pasa al enviar?</p>
                    </div>
                    {isSeencelUser ? (
                        <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                            <li>Se le envía un email con el acceso al portal de este proyecto</li>
                            <li>
                                Como ya tiene cuenta en Seencel, <strong className="text-foreground">ingresa directamente</strong> — no necesita registrarse
                            </li>
                            <li>Podrá ver el avance del proyecto, presupuestos y documentos que le compartas</li>
                        </ul>
                    ) : (
                        <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                            <li>Se le envía un email con un link de invitación al portal</li>
                            <li>
                                Como <strong className="text-foreground">no tiene cuenta aún</strong>, el link lo llevará a crear una gratis
                            </li>
                            <li>Una vez registrado, accederá al avance del proyecto, presupuestos y documentos que le compartas</li>
                        </ul>
                    )}
                </div>

                {/* Email override (only if contact has no email) */}
                {needsEmail && (
                    <FormGroup label="Email del contacto" required>
                        <p className="text-xs text-muted-foreground mb-2">
                            Este contacto no tiene email registrado. Ingresá el email para enviar la invitación.
                        </p>
                        <Input
                            type="email"
                            value={overrideEmail}
                            onChange={(e) => setOverrideEmail(e.target.value)}
                            placeholder="correo@ejemplo.com"
                            autoFocus
                        />
                    </FormGroup>
                )}

            </div>

            <FormFooter
                onCancel={closeModal}
                isLoading={isPending}
                submitLabel="Enviar Invitación"
                submitDisabled={needsEmail && !overrideEmail.trim()}
                className="-mx-4 -mb-4 mt-6"
            />
        </form>
    );
}
