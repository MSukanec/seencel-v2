"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckCircle, Users, Shield, User } from "lucide-react";
import { acceptInvitationAction } from "@/features/team/actions";

interface Props {
    token: string;
    organizationName: string;
    organizationLogo: string | null;
    roleName: string;
    inviterName: string | null;
    email: string;
    isAuthenticated: boolean;
}

export function AcceptInvitationClient({
    token,
    organizationName,
    organizationLogo,
    roleName,
    inviterName,
    email,
    isAuthenticated,
}: Props) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [accepted, setAccepted] = useState(false);

    const handleAccept = async () => {
        setIsLoading(true);
        try {
            const result = await acceptInvitationAction(token);

            if (!result.success) {
                toast.error(result.error || "Error al aceptar la invitación");
                return;
            }

            setAccepted(true);

            if (result.alreadyMember) {
                toast.info("Ya sos miembro de esta organización");
            } else {
                toast.success("¡Te uniste al equipo correctamente!");
            }

            // Redirect to dashboard after brief delay
            setTimeout(() => {
                router.push("/hub");
            }, 2000);
        } catch (error) {
            toast.error("Error inesperado");
        } finally {
            setIsLoading(false);
        }
    };

    // Success state
    if (accepted) {
        return (
            <div className="rounded-xl border bg-card p-8 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <h1 className="text-xl font-semibold">¡Bienvenido al equipo!</h1>
                <p className="text-muted-foreground text-sm">
                    Te uniste a <span className="font-medium text-foreground">{organizationName}</span>.
                    Redirigiendo al dashboard...
                </p>
            </div>
        );
    }

    // Invitation details + action
    return (
        <div className="rounded-xl border bg-card p-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-xl overflow-hidden border bg-muted">
                    {organizationLogo ? (
                        <img
                            src={organizationLogo}
                            alt={organizationName}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <span className="text-xl font-bold text-muted-foreground">
                            {organizationName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                        </span>
                    )}
                </div>
                <h1 className="text-xl font-semibold">Invitación a un equipo</h1>
                <p className="text-muted-foreground text-sm">
                    {inviterName
                        ? `${inviterName} te invitó a unirte a`
                        : "Te invitaron a unirte a"
                    }
                </p>
                <p className="text-lg font-semibold">{organizationName}</p>
            </div>

            {/* Details */}
            <div className="rounded-lg bg-muted/30 border p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Rol asignado
                    </span>
                    <span className="font-medium">{roleName}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Email invitado
                    </span>
                    <span className="font-medium">{email}</span>
                </div>
            </div>

            {/* Action */}
            {isAuthenticated ? (
                <Button
                    onClick={handleAccept}
                    disabled={isLoading}
                    className="w-full"
                    size="lg"
                >
                    {isLoading ? "Aceptando..." : "Aceptar Invitación"}
                </Button>
            ) : (
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground text-center">
                        Necesitás una cuenta en SEENCEL para aceptar esta invitación.
                    </p>
                    <div className="flex flex-col gap-2">
                        <a
                            href={`/login?redirect=/invite/accept?token=${token}`}
                            className="w-full"
                        >
                            <Button variant="default" className="w-full" size="lg">
                                Iniciar Sesión
                            </Button>
                        </a>
                        <a
                            href={`/signup?redirect=/invite/accept?token=${token}`}
                            className="w-full"
                        >
                            <Button variant="outline" className="w-full" size="lg">
                                Crear Cuenta
                            </Button>
                        </a>
                    </div>
                </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
                Al aceptar, te unirás como miembro de esta organización.
            </p>
        </div>
    );
}
