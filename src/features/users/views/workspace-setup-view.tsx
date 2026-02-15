"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Building2, Plus, Users, Loader2, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormGroup } from "@/components/ui/form-group";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { createOrganization } from "@/features/organization/actions";
import { acceptInvitationAction } from "@/features/team/actions";
import type { PendingInvitationData } from "@/actions/invitation-actions";

interface WorkspaceSetupViewProps {
    pendingInvitation: PendingInvitationData | null;
}

type Mode = "choose" | "create" | "accepted";

export function WorkspaceSetupView({ pendingInvitation }: WorkspaceSetupViewProps) {
    const router = useRouter();
    const [mode, setMode] = useState<Mode>("choose");
    const [isPending, startTransition] = useTransition();
    const [isAccepting, setIsAccepting] = useState(false);

    // ── CREATE ORG ──
    const handleCreateOrg = (formData: FormData) => {
        const orgName = formData.get("orgName") as string;
        if (!orgName?.trim()) return;

        startTransition(async () => {
            const result = await createOrganization(orgName.trim());

            if (result.success) {
                toast.success("¡Organización creada!");
                router.push("/hub");
                router.refresh();
            } else {
                toast.error(result.error || "No se pudo crear la organización");
            }
        });
    };

    // ── ACCEPT INVITATION ──
    const handleAcceptInvitation = async () => {
        if (!pendingInvitation?.id) return;

        setIsAccepting(true);
        try {
            const result = await acceptInvitationAction(pendingInvitation.id);

            if (result.success) {
                setMode("accepted");
                toast.success("¡Invitación aceptada!");
                // Small delay so user sees the success state
                setTimeout(() => {
                    router.push("/hub");
                    router.refresh();
                }, 1500);
            } else {
                toast.error(result.error || "No se pudo aceptar la invitación");
            }
        } catch {
            toast.error("Error inesperado al aceptar la invitación");
        } finally {
            setIsAccepting(false);
        }
    };

    // ── ACCEPTED STATE ──
    if (mode === "accepted") {
        return (
            <AuthLayout
                title="¡Bienvenido al equipo!"
                description="Ya podés acceder a tu espacio de trabajo."
                mode="onboarding"
            >
                <div className="flex flex-col items-center gap-6 py-8">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <p className="text-center text-muted-foreground">
                        Te uniste a <span className="font-semibold text-foreground">{pendingInvitation?.organization_name}</span>.
                        Redirigiendo...
                    </p>
                </div>
            </AuthLayout>
        );
    }

    // ── CREATE MODE ──
    if (mode === "create") {
        return (
            <AuthLayout
                title="Crear Organización"
                description="Dale un nombre a tu espacio de trabajo. Podés cambiarlo después."
                mode="onboarding"
            >
                <form action={handleCreateOrg} className="space-y-6 w-full">
                    <FormGroup
                        label="Nombre de la Organización"
                        htmlFor="orgName"
                        required
                        helpText="No te preocupes, podés cambiar esto más adelante en la configuración."
                    >
                        <Input
                            id="orgName"
                            name="orgName"
                            required
                            className="h-10"
                            placeholder="Ej: Constructora SRL"
                            autoFocus
                        />
                    </FormGroup>

                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => setMode("choose")}
                            disabled={isPending}
                        >
                            Volver
                        </Button>
                        <Button type="submit" className="flex-1" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear
                        </Button>
                    </div>
                </form>
            </AuthLayout>
        );
    }

    // ── CHOOSE MODE (default) ──
    return (
        <AuthLayout
            title="Configurar Espacio de Trabajo"
            description="¿Cómo querés comenzar?"
            mode="onboarding"
        >
            <div className="space-y-4 w-full">
                {/* Option: Create new org */}
                <button
                    onClick={() => setMode("create")}
                    className="w-full group flex items-center gap-4 p-4 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-all text-left"
                >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Plus className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">Crear una nueva organización</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Empezá de cero con tu propio espacio de trabajo
                        </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </button>

                {/* Option: Accept invitation (if available) */}
                {pendingInvitation && (
                    <button
                        onClick={handleAcceptInvitation}
                        disabled={isAccepting}
                        className="w-full group flex items-center gap-4 p-4 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-all text-left disabled:opacity-50"
                    >
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                            {isAccepting ? (
                                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                            ) : (
                                <Users className="w-5 h-5 text-blue-500" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">
                                Unirte a {pendingInvitation.organization_name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Tenés una invitación pendiente como {pendingInvitation.role_name || "miembro"}
                            </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    </button>
                )}

                {/* Skip option */}
                <div className="pt-2 text-center">
                    <button
                        onClick={() => {
                            router.push("/hub");
                            router.refresh();
                        }}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors hover:underline"
                    >
                        Omitir por ahora
                    </button>
                </div>
            </div>
        </AuthLayout>
    );
}
