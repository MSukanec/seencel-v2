"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import {
    Building2, Truck, Plus, Users, Loader2, CheckCircle,
    ArrowRight, ArrowLeft, Lock
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormGroup } from "@/components/ui/form-group";
import { ImageUploader } from "@/components/shared/image-uploader";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { createOrganization } from "@/features/organization/actions";
import type { Currency } from "@/types/organization";
import { acceptInvitationAction } from "@/features/team/actions";
import type { PendingInvitationData } from "@/actions/invitation-actions";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface WorkspaceSetupViewProps {
    pendingInvitation: PendingInvitationData | null;
    isNewOrg?: boolean;
    isAdmin?: boolean;
    orgCreationEnabled?: boolean;
    currencies?: Currency[];
}

type BusinessMode = "professional" | "supplier";
type Step = "choose" | "type" | "name" | "accepted";

export function WorkspaceSetupView({ pendingInvitation, isNewOrg, isAdmin, orgCreationEnabled = true, currencies = [] }: WorkspaceSetupViewProps) {
    const router = useRouter();
    const [step, setStep] = useState<Step>(isNewOrg ? "type" : "choose");
    const [businessMode, setBusinessMode] = useState<BusinessMode>("professional");
    const [orgName, setOrgName] = useState("");
    const [selectedCurrencyId, setSelectedCurrencyId] = useState<string | undefined>(undefined);
    const [isPending, startTransition] = useTransition();
    const [isAccepting, setIsAccepting] = useState(false);
    const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
    const logoFileRef = useRef<File | null>(null);

    // Visual block for EVERYONE when flag is off.
    // Admin sees it blocked but can still click through.
    const orgCreationDisabled = !orgCreationEnabled;

    // ── CREATE ORG ──
    const handleCreateOrg = () => {
        if (!orgName.trim()) return;

        startTransition(async () => {
            try {
                // Build logo FormData if a file was selected
                let logoFormData: FormData | undefined;
                if (logoFileRef.current) {
                    logoFormData = new FormData();
                    logoFormData.append("file", logoFileRef.current);
                }

                const result = await createOrganization(orgName.trim(), businessMode, logoFormData, selectedCurrencyId);
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

    // ── STEP 2: NAME ──
    if (step === "name") {
        return (
            <AuthLayout
                title="Nombre de la Organización"
                description="Dale un nombre a tu espacio de trabajo. No te preocupes, podrás cambiarlo después."
                mode="onboarding"
            >
                <div className="space-y-6 w-full">
                    {/* Logo Upload */}
                    <div className="flex flex-col items-center gap-1">
                        <ImageUploader
                            currentImageUrl={logoPreviewUrl}
                            fallback=""
                            fallbackIcon={<Building2 className="w-8 h-8 text-muted-foreground" />}
                            onUpload={async (file) => {
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

                    {/* Currency Selector */}
                    <FormGroup
                        label="Moneda Principal"
                        htmlFor="defaultCurrency"
                        tooltip={
                            <div className="space-y-1.5">
                                <p>La moneda principal define en qué divisa se registran por defecto tus movimientos, presupuestos y reportes.</p>
                                <p className="font-medium">Una vez creada la organización, esta moneda no podrá ser modificada.</p>
                                <p>Podrás agregar monedas secundarias desde la configuración financiera.</p>
                            </div>
                        }
                    >
                        <Select
                            value={selectedCurrencyId}
                            onValueChange={setSelectedCurrencyId}
                        >
                            <SelectTrigger id="defaultCurrency" className="h-10">
                                <SelectValue placeholder="Seleccioná tu moneda" />
                            </SelectTrigger>
                            <SelectContent>
                                {currencies.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        <span className="flex items-center gap-2">
                                            <span className="font-medium">{c.symbol}</span>
                                            <span>{c.name}</span>
                                            <span className="text-muted-foreground">({c.code})</span>
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormGroup>

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
                description="Esto nos permite personalizar tu experiencia desde el primer día. Podrás cambiar esta configuración en cualquier momento."
                mode="onboarding"
            >
                <div className="space-y-4 w-full">
                    {/* Professional — blocked visually when flag is off, admin can bypass */}
                    <button
                        onClick={() => {
                            if (orgCreationDisabled && !isAdmin) return;
                            setBusinessMode("professional");
                            setStep("name");
                        }}
                        className={cn(
                            "w-full rounded-xl border bg-card p-6 text-left transition-all group relative",
                            orgCreationDisabled
                                ? isAdmin
                                    ? "hover:border-primary/50 hover:brightness-110 cursor-pointer opacity-60 hover:opacity-80"
                                    : "cursor-default opacity-50"
                                : "hover:border-primary/50 hover:brightness-110"
                        )}
                    >
                        {/* Blocked Badge */}
                        {orgCreationDisabled && (
                            <Badge
                                variant="secondary"
                                className="absolute top-3 right-3 text-[10px] gap-1 px-2 py-0.5"
                            >
                                <Lock className="w-2.5 h-2.5" />
                                No disponible
                            </Badge>
                        )}
                        <div className="flex items-start gap-4">
                            <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                                style={{ backgroundColor: "color-mix(in srgb, var(--chart-1) 15%, transparent)" }}
                            >
                                <Building2 className="w-5 h-5" style={{ color: "var(--chart-1)" }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-base">Estudio Profesional / Constructora</h3>
                                    {!orgCreationDisabled && (
                                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Organización que diseña, dirige o ejecuta proyectos de arquitectura, ingeniería o construcción.
                                </p>
                                <ul className="mt-2 space-y-0.5 text-sm text-muted-foreground/80">
                                    <li className="flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                                        Arquitectura, ingeniería, diseño de interiores o paisajismo
                                    </li>
                                    <li className="flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                                        Constructora, dirección de obra o project management
                                    </li>
                                    <li className="flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                                        Profesional independiente o estudio con equipo
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </button>

                    {/* Supplier — always looks locked, but admin can click through */}
                    <button
                        onClick={() => {
                            if (!isAdmin) return;
                            setBusinessMode("supplier");
                            setStep("name");
                        }}
                        className={cn(
                            "w-full rounded-xl border bg-card p-6 text-left transition-all group relative",
                            isAdmin
                                ? "hover:border-primary/50 hover:brightness-110 cursor-pointer opacity-60 hover:opacity-80"
                                : "cursor-default opacity-50"
                        )}
                    >
                        {/* Coming Soon Badge */}
                        <Badge
                            variant="secondary"
                            className="absolute top-3 right-3 text-[10px] gap-1 px-2 py-0.5"
                        >
                            <Lock className="w-2.5 h-2.5" />
                            Próximamente
                        </Badge>

                        <div className="flex items-start gap-4">
                            <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                                style={{ backgroundColor: "color-mix(in srgb, var(--chart-2) 15%, transparent)" }}
                            >
                                <Truck className="w-5 h-5" style={{ color: "var(--chart-2)" }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-base">Proveedor</h3>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Empresa que vende materiales, equipos o servicios para la industria de la construcción.
                                </p>
                                <ul className="mt-2 space-y-0.5 text-sm text-muted-foreground/80">
                                    <li className="flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                                        Corralón de materiales
                                    </li>
                                    <li className="flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                                        Alquiler de maquinaria
                                    </li>
                                    <li className="flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                                        Proveedor de servicios especializados
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => isNewOrg ? router.back() : setStep("choose")}
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
                    onClick={() => {
                        if (orgCreationDisabled && !isAdmin) return;
                        setStep("type");
                    }}
                    className={cn(
                        "w-full rounded-xl border bg-card p-6 text-left transition-all group relative",
                        orgCreationDisabled
                            ? isAdmin
                                ? "hover:border-primary/50 hover:brightness-110 cursor-pointer opacity-60 hover:opacity-80"
                                : "cursor-default opacity-50"
                            : "hover:border-primary/50 hover:brightness-110"
                    )}
                >
                    {/* Blocked Badge */}
                    {orgCreationDisabled && (
                        <Badge
                            variant="secondary"
                            className="absolute top-3 right-3 text-[10px] gap-1 px-2 py-0.5"
                        >
                            <Lock className="w-2.5 h-2.5" />
                            No disponible
                        </Badge>
                    )}
                    <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                            <Plus className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-base">Crear una organización</h3>
                                {!orgCreationDisabled && (
                                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                {orgCreationDisabled
                                    ? "La creación de organizaciones está temporalmente deshabilitada."
                                    : "Empezá desde cero con tu propia empresa o equipo de trabajo."
                                }
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
