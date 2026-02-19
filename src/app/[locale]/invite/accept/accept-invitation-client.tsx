"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckCircle, Shield, User, Briefcase } from "lucide-react";
import { acceptInvitationAction } from "@/features/team/actions";

/** Labels for actor types — duplicated here to avoid importing server-only code */
const ACTOR_TYPE_LABELS: Record<string, string> = {
    client: 'Cliente',
    accountant: 'Contador',
    field_worker: 'Trabajador de campo',
    external_site_manager: 'Director de obra externo',
    subcontractor_portal_user: 'Subcontratista',
};

interface Props {
    token: string;
    organizationName: string;
    organizationLogo: string | null;
    roleName: string;
    invitationType: string;
    actorType: string | null;
    inviterName: string | null;
    email: string;
    isAuthenticated: boolean;
    /** True if the invited email already has a Seencel account but is not logged in */
    emailAlreadyRegistered: boolean;
}

export function AcceptInvitationClient({
    token,
    organizationName,
    organizationLogo,
    roleName,
    invitationType,
    actorType,
    inviterName,
    email,
    isAuthenticated,
    emailAlreadyRegistered,
}: Props) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [accepted, setAccepted] = useState(false);

    const isExternal = invitationType === 'external';
    const actorLabel = actorType ? ACTOR_TYPE_LABELS[actorType] || actorType : null;

    // Contextual texts
    const headerTitle = isExternal
        ? 'Invitación de colaboración'
        : 'Invitación a un equipo';
    const headerSubtext = inviterName
        ? `${inviterName} te invitó a unirte a`
        : 'Te invitaron a unirte a';
    const roleLabel = isExternal
        ? (actorLabel || 'Colaborador externo')
        : roleName;

    // Footer text: context-aware per invitation type
    const footerText = isExternal
        ? `Al aceptar, colaborarás con esta organización como ${roleLabel?.toLowerCase()}.`
        : 'Al aceptar, te unirás como miembro de esta organización.';

    const successTitle = isExternal ? '¡Colaboración aceptada!' : '¡Bienvenido al equipo!';
    const successText = isExternal ? 'Ahora colaborás con' : 'Te uniste a';

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
                toast.info(isExternal
                    ? "Ya colaborás con esta organización"
                    : "Ya sos miembro de esta organización"
                );
            } else {
                toast.success(isExternal
                    ? "¡Colaboración aceptada correctamente!"
                    : "¡Te uniste al equipo correctamente!"
                );
            }

            setTimeout(() => { router.push("/hub"); }, 2000);
        } catch {
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
                <h1 className="text-xl font-semibold">{successTitle}</h1>
                <p className="text-muted-foreground text-sm">
                    {successText} <span className="font-medium text-foreground">{organizationName}</span>.
                    Redirigiendo al dashboard...
                </p>
            </div>
        );
    }

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
                <h1 className="text-xl font-semibold">{headerTitle}</h1>
                <p className="text-muted-foreground text-sm">{headerSubtext}</p>
                <p className="text-lg font-semibold">{organizationName}</p>
            </div>

            {/* Details */}
            <div className="rounded-lg bg-muted/30 border p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                        {isExternal ? <Briefcase className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                        Rol asignado
                    </span>
                    <span className="font-medium">{roleLabel}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Email invitado
                    </span>
                    <span className="font-medium">{email}</span>
                </div>
            </div>

            {/* Smart CTA — 3 states */}
            {isAuthenticated ? (
                // ✅ Logged in → accept directly
                <Button
                    onClick={handleAccept}
                    disabled={isLoading}
                    className="w-full"
                    size="lg"
                >
                    {isLoading ? "Aceptando..." : "Aceptar Invitación →"}
                </Button>
            ) : emailAlreadyRegistered ? (
                // 🔑 Has account but not logged in → only Login
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground text-center">
                        Iniciá sesión con <span className="font-medium text-foreground">{email}</span> para aceptar esta invitación.
                    </p>
                    <a href={`/login?redirect=/invite/accept?token=${token}`} className="w-full block">
                        <Button variant="default" className="w-full" size="lg">
                            Iniciar Sesión
                        </Button>
                    </a>
                </div>
            ) : (
                // 🆕 New user → Login + Register
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground text-center">
                        Necesitás una cuenta en SEENCEL para aceptar esta invitación.
                    </p>
                    <div className="flex flex-col gap-2">
                        <a href={`/login?redirect=/invite/accept?token=${token}`} className="w-full">
                            <Button variant="default" className="w-full" size="lg">
                                Iniciar Sesión
                            </Button>
                        </a>
                        <a href={`/signup?email=${encodeURIComponent(email)}&redirect=/invite/accept?token=${token}`} className="w-full">
                            <Button variant="outline" className="w-full" size="lg">
                                Crear Cuenta
                            </Button>
                        </a>
                    </div>
                </div>
            )}

            <p className="text-xs text-muted-foreground text-center">{footerText}</p>
        </div>
    );
}
