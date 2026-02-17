"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import {
    Building2, Truck, Plus, Users, Loader2, CheckCircle,
    ArrowRight, ArrowLeft, Palette, HardHat, DollarSign, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormGroup } from "@/components/ui/form-group";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { createOrganization } from "@/features/organization/actions";
import { acceptInvitationAction } from "@/features/team/actions";
import type { PendingInvitationData } from "@/actions/invitation-actions";
import { cn } from "@/lib/utils";

interface WorkspaceSetupViewProps {
    pendingInvitation: PendingInvitationData | null;
}

type BusinessMode = "professional" | "supplier";

// Module presets for professional organizations
const MODULE_PRESETS = [
    {
        id: "design",
        label: "Diseño / Proyecto",
        description: "Gestión de diseño arquitectónico y proyectos de ingeniería",
        icon: Palette,
        modules: ["dashboard", "management"] as const,
    },
    {
        id: "construction",
        label: "Construcción / Dirección de Obra",
        description: "Ejecución y supervisión de obras civiles",
        icon: HardHat,
        modules: ["dashboard", "management", "construction"] as const,
    },
    {
        id: "finance",
        label: "Gestión Financiera",
        description: "Control de ingresos, egresos y capital",
        icon: DollarSign,
        modules: ["dashboard", "finance"] as const,
    },
    {
        id: "materials",
        label: "Gestión de Materiales",
        description: "Catálogo, compras y stock de materiales",
        icon: Package,
        modules: ["dashboard", "management"] as const,
    },
] as const;

type Step = "choose" | "type" | "preconfig" | "name" | "accepted";

export function WorkspaceSetupView({ pendingInvitation }: WorkspaceSetupViewProps) {
    const router = useRouter();
    const [step, setStep] = useState<Step>("choose");
    const [businessMode, setBusinessMode] = useState<BusinessMode>("professional");
    const [selectedPresets, setSelectedPresets] = useState<string[]>(
        MODULE_PRESETS.map(p => p.id) // All selected by default
    );
    const [orgName, setOrgName] = useState("");
    const [isPending, startTransition] = useTransition();
    const [isAccepting, setIsAccepting] = useState(false);

    // ── CREATE ORG ──
    const handleCreateOrg = () => {
        if (!orgName.trim()) return;

        startTransition(async () => {
            try {
                const result = await createOrganization(orgName.trim(), businessMode);
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

            setStep("accepted");
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

    const togglePreset = (presetId: string) => {
        setSelectedPresets(prev =>
            prev.includes(presetId)
                ? prev.filter(id => id !== presetId)
                : [...prev, presetId]
        );
    };

    // ── SUCCESS STATE ──
    if (step === "accepted") {
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

    // ── STEP 3: NAME ──
    if (step === "name") {
        return (
            <AuthLayout
                title="Nombre de la Organización"
                description="Dale un nombre a tu espacio de trabajo. No te preocupes, podrás cambiarlo después."
                mode="onboarding"
            >
                <div className="space-y-6 w-full">
                    <FormGroup
                        label="Nombre"
                        htmlFor="orgName"
                        required
                    >
                        <Input
                            id="orgName"
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            required
                            className="h-10"
                            placeholder="Mi Empresa S.A."
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && orgName.trim()) {
                                    e.preventDefault();
                                    handleCreateOrg();
                                }
                            }}
                        />
                    </FormGroup>

                    {/* Summary */}
                    <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
                        <p className="text-xs text-muted-foreground font-medium">Resumen</p>
                        <div className="flex items-center gap-2 text-sm">
                            {businessMode === "professional" ? (
                                <Building2 className="w-4 h-4 text-primary" />
                            ) : (
                                <Truck className="w-4 h-4 text-primary" />
                            )}
                            <span>
                                {businessMode === "professional" ? "Estudio Profesional / Constructora" : "Proveedor"}
                            </span>
                        </div>
                        {businessMode === "professional" && selectedPresets.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {selectedPresets.map(presetId => {
                                    const preset = MODULE_PRESETS.find(p => p.id === presetId);
                                    if (!preset) return null;
                                    return (
                                        <span
                                            key={presetId}
                                            className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                                        >
                                            {preset.label}
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <Button
                        onClick={handleCreateOrg}
                        size="lg"
                        className="w-full"
                        disabled={isPending || !orgName.trim()}
                    >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Crear y Continuar
                    </Button>

                    <button
                        type="button"
                        onClick={() => setStep(businessMode === "professional" ? "preconfig" : "type")}
                        className="w-full text-sm text-muted-foreground hover:text-primary transition-colors text-center flex items-center justify-center gap-1"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Volver
                    </button>
                </div>
            </AuthLayout>
        );
    }

    // ── STEP 2: PRECONFIG (professional only) ──
    if (step === "preconfig") {
        return (
            <AuthLayout
                title="¿Qué actividades realiza tu organización?"
                description="Seleccioná las áreas relevantes para personalizar tu experiencia. Podrás cambiar esto después."
                mode="onboarding"
            >
                <div className="space-y-4 w-full">
                    {MODULE_PRESETS.map((preset) => {
                        const isSelected = selectedPresets.includes(preset.id);
                        const Icon = preset.icon;
                        return (
                            <button
                                key={preset.id}
                                onClick={() => togglePreset(preset.id)}
                                className={cn(
                                    "w-full rounded-xl border p-4 text-left transition-all group",
                                    isSelected
                                        ? "border-primary/50 bg-primary/5"
                                        : "border-border hover:border-muted-foreground/30 hover:bg-accent/30"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                                        isSelected ? "bg-primary/20" : "bg-muted"
                                    )}>
                                        <Icon className={cn(
                                            "w-4.5 h-4.5 transition-colors",
                                            isSelected ? "text-primary" : "text-muted-foreground"
                                        )} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-sm">{preset.label}</h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">{preset.description}</p>
                                    </div>
                                    <div className={cn(
                                        "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                                        isSelected
                                            ? "border-primary bg-primary"
                                            : "border-muted-foreground/30"
                                    )}>
                                        {isSelected && (
                                            <CheckCircle className="w-3.5 h-3.5 text-primary-foreground" />
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}

                    <div className="pt-2">
                        <Button
                            onClick={() => setStep("name")}
                            size="lg"
                            className="w-full"
                        >
                            Continuar
                            <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </div>

                    <button
                        type="button"
                        onClick={() => setStep("type")}
                        className="w-full text-sm text-muted-foreground hover:text-primary transition-colors text-center flex items-center justify-center gap-1"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Volver
                    </button>
                </div>
            </AuthLayout>
        );
    }

    // ── STEP 1: TYPE ──
    if (step === "type") {
        return (
            <AuthLayout
                title="¿Qué tipo de organización es?"
                description="Esto nos permite personalizar tu experiencia desde el primer día."
                mode="onboarding"
            >
                <div className="space-y-4 w-full">
                    {/* Professional */}
                    <button
                        onClick={() => {
                            setBusinessMode("professional");
                            setStep("preconfig");
                        }}
                        className="w-full rounded-xl border bg-card p-5 text-left hover:border-primary/50 hover:bg-accent/30 transition-all group"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                                <Building2 className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-sm">Estudio Profesional / Constructora</h3>
                                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Arquitectura, ingeniería, diseño, dirección de obra o construcción.
                                </p>
                            </div>
                        </div>
                    </button>

                    {/* Supplier */}
                    <button
                        onClick={() => {
                            setBusinessMode("supplier");
                            setStep("name");
                        }}
                        className="w-full rounded-xl border bg-card p-5 text-left hover:border-primary/50 hover:bg-accent/30 transition-all group"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0 group-hover:bg-orange-500/20 transition-colors">
                                <Truck className="w-5 h-5 text-orange-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-sm">Proveedor</h3>
                                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Proveedor de materiales, equipos o servicios para la construcción.
                                </p>
                            </div>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setStep("choose")}
                        className="w-full text-sm text-muted-foreground hover:text-primary transition-colors text-center flex items-center justify-center gap-1 pt-2"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Volver
                    </button>
                </div>
            </AuthLayout>
        );
    }

    // ── STEP 0: CHOOSE MODE (default) ──
    return (
        <AuthLayout
            title="Configurá tu Espacio de Trabajo"
            description="Elegí cómo querés empezar a usar Seencel."
            mode="onboarding"
        >
            <div className="space-y-4 w-full">
                {/* Option 1: Create Organization */}
                <button
                    onClick={() => setStep("type")}
                    className="w-full rounded-xl border bg-card p-5 text-left hover:border-primary/50 hover:bg-accent/30 transition-all group"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                            <Plus className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-sm">Crear una organización</h3>
                                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Empezá desde cero con tu propia empresa o equipo de trabajo.
                            </p>
                        </div>
                    </div>
                </button>

                {/* Option 2: Pending Invitation */}
                {pendingInvitation && (
                    <div className="rounded-xl border bg-card p-5 space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                <Users className="w-5 h-5 text-blue-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm">Invitación pendiente</h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {pendingInvitation.inviter_name
                                        ? `${pendingInvitation.inviter_name} te invitó a unirte a`
                                        : "Te invitaron a unirte a"
                                    }
                                </p>
                                <p className="text-sm font-medium mt-0.5">
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
                    <div className="rounded-xl border border-dashed bg-muted/20 p-5 text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span className="text-xs">
                                No tenés invitaciones pendientes a un equipo.
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </AuthLayout>
    );
}
