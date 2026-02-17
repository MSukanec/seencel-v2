"use client";

import { useState, useTransition } from "react";
import { acceptInvitationAction } from "@/features/team/actions";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Shield, User } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface PendingInvitation {
    id: string;
    token: string;
    organization_name: string;
    organization_logo: string | null;
    role_name: string;
    inviter_name: string | null;
    is_external?: boolean;
}

interface PendingInvitationOverlayProps {
    invitation: PendingInvitation;
}

export function PendingInvitationOverlay({ invitation }: PendingInvitationOverlayProps) {
    const [isPending, startTransition] = useTransition();
    const [dismissed, setDismissed] = useState(false);
    const [accepted, setAccepted] = useState(false);

    const handleAccept = () => {
        if (isPending || accepted) return;

        startTransition(async () => {
            try {
                const result = await acceptInvitationAction(invitation.token);
                if (result.success) {
                    setAccepted(true);
                    // Hard redirect — guaranteed to execute
                    window.location.href = "/organization";
                } else {
                    console.error("Accept invitation error:", result.error);
                    toast.error(result.error || "Error al aceptar la invitación");
                }
            } catch (error) {
                console.error("Accept invitation exception:", error);
                toast.error("Error inesperado al aceptar la invitación");
            }
        });
    };

    if (dismissed) return null;

    // Keep overlay visible while accepted + redirecting
    const isOpen = !dismissed;

    // Get initials for fallback
    const initials = invitation.organization_name
        .split(" ")
        .map(w => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <AlertDialog open={isOpen}>
            <AlertDialogContent
                className="max-w-md"
                onEscapeKeyDown={(e: KeyboardEvent) => e.preventDefault()}
            >
                <AlertDialogHeader className="items-center text-center">
                    {/* Organization logo or initials */}
                    <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-xl overflow-hidden border bg-muted">
                        {invitation.organization_logo ? (
                            <Image
                                src={invitation.organization_logo}
                                alt={invitation.organization_name}
                                width={64}
                                height={64}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span className="text-xl font-bold text-muted-foreground">{initials}</span>
                        )}
                    </div>
                    <AlertDialogTitle className="text-lg">
                        {invitation.is_external
                            ? 'Te invitaron a colaborar con una organización'
                            : 'Te invitaron a una organización'
                        }
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-4 text-sm">
                            <p>
                                {invitation.inviter_name
                                    ? invitation.is_external
                                        ? `${invitation.inviter_name} te ha invitado a colaborar con una organización.`
                                        : `${invitation.inviter_name} te ha invitado a unirte a una organización.`
                                    : invitation.is_external
                                        ? "Te han invitado a colaborar con una organización."
                                        : "Te han invitado a unirte a una organización."
                                }
                            </p>
                            <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-left">
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="text-muted-foreground">Organización:</span>
                                    <span className="font-medium text-foreground">{invitation.organization_name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="text-muted-foreground">
                                        {invitation.is_external ? 'Tipo de acceso:' : 'Rol asignado:'}
                                    </span>
                                    <span className="font-medium text-foreground">{invitation.role_name}</span>
                                </div>
                                {invitation.inviter_name && (
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <span className="text-muted-foreground">Invitado por:</span>
                                        <span className="font-medium text-foreground">{invitation.inviter_name}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="sm:justify-center gap-2">
                    <AlertDialogCancel
                        onClick={() => setDismissed(true)}
                        disabled={isPending || accepted}
                    >
                        Ahora no
                    </AlertDialogCancel>
                    <Button
                        onClick={handleAccept}
                        disabled={isPending || accepted}
                        className="gap-2"
                    >
                        {isPending || accepted ? (
                            "Aceptando..."
                        ) : (
                            <>
                                Aceptar invitación
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
