"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { acceptInvitationAction } from "@/features/team/actions";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserPlus, ArrowRight, Building2, Shield, User } from "lucide-react";

interface PendingInvitation {
    id: string;
    token: string;
    organization_name: string;
    role_name: string;
    inviter_name: string | null;
}

interface PendingInvitationOverlayProps {
    invitation: PendingInvitation;
}

export function PendingInvitationOverlay({ invitation }: PendingInvitationOverlayProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [dismissed, setDismissed] = useState(false);

    const handleAccept = () => {
        startTransition(async () => {
            const result = await acceptInvitationAction(invitation.token);
            if (result.success && result.organizationId) {
                router.push("/organization" as any);
                router.refresh();
            }
        });
    };

    if (dismissed) return null;

    return (
        <AlertDialog open={true}>
            <AlertDialogContent
                className="max-w-md"
                onEscapeKeyDown={(e: KeyboardEvent) => e.preventDefault()}
            >
                <AlertDialogHeader className="items-center text-center">
                    <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                        <UserPlus className="h-7 w-7 text-primary" />
                    </div>
                    <AlertDialogTitle className="text-lg">
                        Te invitaron a una organización
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-4 text-sm">
                            <p>
                                {invitation.inviter_name
                                    ? `${invitation.inviter_name} te ha invitado a unirte a una organización.`
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
                                    <span className="text-muted-foreground">Rol asignado:</span>
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
                        disabled={isPending}
                    >
                        Ahora no
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleAccept}
                        disabled={isPending}
                        className="gap-2"
                    >
                        {isPending ? (
                            "Aceptando..."
                        ) : (
                            <>
                                Aceptar invitación
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
