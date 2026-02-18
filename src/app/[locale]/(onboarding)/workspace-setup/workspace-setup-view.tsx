"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Building2, Plus, Users, Loader2, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormGroup } from "@/components/ui/form-group";
import { ImageUploader } from "@/components/shared/image-uploader";
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
    const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
    const logoFileRef = useRef<File | null>(null);

    // ── CREATE ORG ──
    const handleCreateOrg = (formData: FormData) => {
        const orgName = formData.get("orgName") as string;
        if (!orgName?.trim()) return;

        startTransition(async () => {
            try {
                // Build logo FormData if a file was selected
                let logoFormData: FormData | undefined;
                if (logoFileRef.current) {
                    logoFormData = new FormData();
                    logoFormData.append("file", logoFileRef.current);
                }

                const result = await createOrganization(orgName.trim(), 'professional', logoFormData);
                if (!result.success) {
                    toast.error(result.error || "Error al crear la organización");
                }
                // On success, createOrganization redirects automatically
            } catch {
                // createOrganization uses redirect() which throws NEXT_REDIRECT
                // This is expected behavior
            }
        });
    };

    // ── ACCEPT INVITATION ──
    const handleAcceptInvitation = async () => {
        if (!pendingInvitation) return;
        setIsAccepting(true);
        try {
            const result = await acceptInvitationAction(pendingInvitation.token);
            if (!result.success) {
                toast.error(result.error || "Error al aceptar la invitación");
                setIsAccepting(false);
                return;
            }

            setMode("accepted");
            toast.success("¡Te uniste al equipo!");

            setTimeout(() => {
                router.push("/organization");
                router.refresh();
            }, 1500);
        } catch {
            toast.error("Error inesperado");
            setIsAccepting(false);
        }
    };

    // ── SUCCESS STATE ──
    if (mode === "accepted") {
        return (
            <AuthLayout
                title="¡Bienvenido al equipo!"
                description="Redirigiendo al espacio de trabajo..."
                mode="onboarding"
            >
                <div className="flex flex-col items-center gap-4 py-8">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-500" />
                    </div>
                    <p className="text-muted-foreground text-sm">
                        Te uniste a <span className="font-medium text-foreground">{pendingInvitation?.organization_name}</span>
                    </p>
                </div>
            </AuthLayout>
        );
    }

    // ── CREATE ORG FORM ──
    if (mode === "create") {
        return (
            <AuthLayout
                title="Crear Organización"
                description="Creá tu espacio de trabajo para gestionar proyectos y equipo."
                mode="onboarding"
            >
                <form action={handleCreateOrg} className="space-y-6 w-full">
                    {/* Logo Upload */}
                    <div className="flex flex-col items-center gap-2">
                        <ImageUploader
                            currentImageUrl={logoPreviewUrl}
                            fallback=""
                            fallbackIcon={<Building2 className="w-8 h-8 text-muted-foreground" />}
                            onUpload={async (file) => {
                                // Store file locally for upload after org creation
                                logoFileRef.current = file;
                                const previewUrl = URL.createObjectURL(file);
                                setLogoPreviewUrl(previewUrl);
                                return {
                                    success: true,
                                    url: previewUrl,
                                };
                            }}
                            onRemove={() => {
                                logoFileRef.current = null;
                                setLogoPreviewUrl(null);
                            }}
                            compressionPreset="avatar"
                            size="xl"
                            hint="Logo de tu organización (opcional)"
                        />
                    </div>

                    <FormGroup
                        label="Nombre de la Organización"
                        htmlFor="orgName"
                        required
                        helpText="No te preocupes, podrás cambiarlo después."
                    >
                        <Input
                            id="orgName"
                            name="orgName"
                            required
                            className="h-10"
                            placeholder="Mi Empresa"
                            autoFocus
                        />
                    </FormGroup>

                    <Button type="submit" size="lg" className="w-full" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Crear y Continuar
                    </Button>

                    <button
                        type="button"
                        onClick={() => setMode("choose")}
                        className="w-full text-sm text-muted-foreground hover:text-primary transition-colors text-center"
                    >
                        ← Volver
                    </button>
                </form>
            </AuthLayout>
        );
    }

    // ── CHOOSE MODE (default) ──
    return (
        <AuthLayout
            title="Configurá tu Espacio de Trabajo"
            description="Elegí cómo querés empezar a usar Seencel."
            mode="onboarding"
        >
            <div className="space-y-4 w-full">
                {/* Option 1: Create Organization */}
                <button
                    onClick={() => setMode("create")}
                    className="w-full rounded-xl border bg-card p-6 text-left hover:border-primary/50 hover:bg-accent/30 transition-all group"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                            <Plus className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-base">Crear una organización</h3>
                                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                Empezá desde cero con tu propia empresa o equipo de trabajo.
                            </p>
                        </div>
                    </div>
                </button>

                {/* Option 2: Pending Invitation */}
                {pendingInvitation && (
                    <div className="rounded-xl border bg-card p-6 space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="w-11 h-11 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                <Users className="w-5 h-5 text-blue-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base">Invitación pendiente</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {pendingInvitation.inviter_name
                                        ? `${pendingInvitation.inviter_name} te invitó a unirte a`
                                        : "Te invitaron a unirte a"
                                    }
                                </p>
                                <p className="text-base font-medium mt-0.5">
                                    {pendingInvitation.organization_name}
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={handleAcceptInvitation}
                            disabled={isAccepting}
                            className="w-full"
                            variant="outline"
                        >
                            {isAccepting
                                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Aceptando...</>
                                : "Aceptar Invitación"
                            }
                        </Button>
                    </div>
                )}

                {/* No invitation message */}
                {!pendingInvitation && (
                    <div className="rounded-xl border border-dashed bg-muted/20 p-6 text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span className="text-sm">
                                No tenés invitaciones pendientes a un equipo.
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </AuthLayout>
    );
}
