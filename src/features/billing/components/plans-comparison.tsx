"use client";

import { useState } from "react";
import { Plan, PlanFeatures } from "@/actions/plans";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Medal, FileText, Plug2, Headphones, Shield, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPlanDisplayName } from "@/lib/plan-utils";
import { Link } from "@/i18n/routing";
import { PlanCardsGrid, getPlanTier } from "./plan-cards-grid";
import { getPlanGradient, PLAN_STATUS_CONFIG, type PlanFlagStatus, type PlanPurchaseFlags } from "./plan-card";

// Re-export plan types for backward compatibility
export type { PlanFlagStatus, PlanPurchaseFlags };

interface PlansComparisonProps {
    plans: Plan[];
    /**
     * When true, CTA buttons say "Cambiar Plan" instead of "Empezar Ahora".
     */
    isDashboard?: boolean;
    /**
     * Feature flags status for each plan (not just boolean)
     */
    purchaseFlags?: PlanPurchaseFlags;
    /**
     * The current user's organization plan ID (to highlight their current plan)
     */
    currentPlanId?: string | null;
    /**
     * Whether the current user is an admin (can bypass maintenance/coming_soon)
     */
    isAdmin?: boolean;
    /**
     * Organization ID for building upgrade URLs
     */
    organizationId?: string | null;
}

// Feature modules organized by category (like Vercel's pricing page)
// Note: Some features are read dynamically from plan.features, others are static placeholders
const FEATURE_MODULES = [
    {
        id: "core",
        icon: "Sparkles",
        title: "Funcionalidades Principales",
        description: "Todo lo esencial para gestionar tu organización.",
        features: [
            { key: "members", label: "Invitar miembros", featureKey: "can_invite_members" },
            { key: "external_advisors", label: "Asesores externos", featureKey: "max_external_advisors" },
            { key: "projects", label: "Proyectos activos", featureKey: "max_active_projects" },
            { key: "storage", label: "Almacenamiento", featureKey: "max_storage_mb" },
            { key: "file_size", label: "Tamaño máximo de archivo", featureKey: "max_file_size_mb" },
        ],
    },
    {
        id: "documents",
        icon: "FileText",
        title: "Documentos y Reportes",
        description: "Generación automática de documentos profesionales.",
        features: [
            { key: "pdf_custom", label: "PDFs personalizados", featureKey: "export_pdf_custom" },
            { key: "templates", label: "Plantillas personalizadas", featureKey: "custom_pdf_templates" },
            { key: "exports", label: "Exportar a Excel/CSV", featureKey: "export_excel" },
            { key: "reports", label: "Reportes y Analíticas", featureKey: "analytics_level" },
            { key: "insight_config", label: "Configuración de Insights", featureKey: "custom_insight_thresholds" },
        ],
    },
    {
        id: "integrations",
        icon: "Plug",
        title: "Integraciones y API",
        description: "Conecta con tus herramientas favoritas.",
        features: [
            { key: "api_access", label: "Acceso a API", featureKey: "api_access" },
            { key: "webhooks", label: "Webhooks", featureKey: "webhooks" },
        ],
    },
    {
        id: "support",
        icon: "Headphones",
        title: "Soporte y Servicios",
        description: "Ayuda cuando la necesites.",
        features: [
            { key: "support_level", label: "Nivel de soporte", featureKey: "support_level" },
        ],
    },
];

// getPlanIcon and getPlanGradient are now exported from plan-card.tsx

export function PlansComparison({
    plans,
    isDashboard = false,
    purchaseFlags = { pro: 'active', teams: 'active' },
    currentPlanId,
    isAdmin = false,
    organizationId,
}: PlansComparisonProps) {
    const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("annual");
    const [selectedPlanIndex, setSelectedPlanIndex] = useState(1); // Default to Pro (middle plan)

    // Filter Enterprise from comparison views — it has its own full-width card
    const comparisonPlans = plans.filter(p => !p.name.toLowerCase().includes('enterprise'));

    // Get the status of a plan from feature flags
    const getPlanStatus = (planName: string): PlanFlagStatus => {
        const lower = planName.toLowerCase();
        if (lower.includes("free")) return 'active'; // Free is always active
        if (lower.includes("pro")) return purchaseFlags.pro;
        if (lower.includes("team")) return purchaseFlags.teams;
        return 'active';
    };

    // Helper: build checkout URL (upgrade if PRO user clicks on TEAMS)
    const getCheckoutUrl = (plan: Plan): string => {
        const currentPlan = currentPlanId ? plans.find(p => p.id === currentPlanId) : null;
        const currentSlug = currentPlan?.slug?.toLowerCase() || currentPlan?.name?.toLowerCase() || '';
        const targetSlug = plan.slug?.toLowerCase() || plan.name?.toLowerCase() || '';

        // PRO → TEAMS upgrade flow
        if (currentSlug.includes('pro') && targetSlug.includes('team') && organizationId) {
            return `/checkout?type=upgrade&org=${organizationId}&target=${plan.slug || plan.name.toLowerCase()}`;
        }

        // Normal checkout
        return `/checkout?product=plan-${plan.slug || plan.name.toLowerCase()}&cycle=${billingPeriod}`;
    };

    // Helper: get CTA label
    const getCtaLabel = (plan: Plan, short = false): string => {
        const currentPlan = currentPlanId ? plans.find(p => p.id === currentPlanId) : null;
        const currentSlug = currentPlan?.slug?.toLowerCase() || currentPlan?.name?.toLowerCase() || '';
        const targetSlug = plan.slug?.toLowerCase() || plan.name?.toLowerCase() || '';

        if (currentSlug.includes('pro') && targetSlug.includes('team') && organizationId) {
            return short ? "Mejorar" : "Mejorar Plan";
        }

        return isDashboard ? (short ? "Mejorar" : "Mejorar Plan") : (short ? "Empezar" : "Empezar Ahora");
    };

    // Price, storage, card features helpers are now in plan-card.tsx

    // Get feature value for a plan from plan.features using featureKey
    const getDynamicFeatureValue = (plan: Plan, featureKey: string): string | boolean => {
        const features = plan.features;
        if (!features) return false;

        const value = features[featureKey as keyof PlanFeatures];

        // Handle number values (members, projects, storage, file size)
        if (typeof value === "number") {
            // Format storage values first (don't use >= 999 for these)
            if (featureKey === "max_storage_mb" || featureKey === "max_file_size_mb") {
                if (value >= 1024) return `${Math.round(value / 1024)} GB`;
                return `${value} MB`;
            }

            // For members and projects, use "Ilimitados" for large values
            if (value >= 999) return "Ilimitados";

            return value.toString();
        }

        // Handle string values (analytics_level, support_level)
        if (typeof value === "string") {
            const labels: Record<string, string> = {
                "basic": "Básico",
                "advanced": "Avanzado",
                "custom": "Personalizado",
                "community": "Comunidad",
                "priority": "Prioritario",
                "dedicated": "Dedicado",
            };
            return labels[value] || value;
        }

        // Handle boolean values
        return value as boolean;
    };

    // Icon mapping for modules
    const MODULE_ICONS: Record<string, React.ElementType> = {
        Sparkles,
        FileText,
        Plug: Plug2,
        Headphones,
        Shield,
    };


    // Founders benefits
    const FOUNDERS_BENEFITS = [
        "Beneficio Organizacional para todo tu equipo",
        "Voz y voto directo en el roadmap",
        "Comunidad privada en Discord",
        "Incluido en directorio de organizaciones fundadoras",
        "Acceso vitalicio al curso Master ArchiCAD",
        "Acceso anticipado a nuevas funcionalidades",
        "Insignia de Fundador pública en tu perfil",
        "Estatus permanente mientras mantengas tu suscripción",
    ];

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-12">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold tracking-tight mb-4">
                    Elige tu Plan
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Planes flexibles que crecen contigo. Comienza gratis y escala cuando lo necesites.
                </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex justify-center mb-8">
                <div className="inline-flex items-center rounded-full border bg-muted/30 p-1">
                    <button
                        onClick={() => setBillingPeriod("monthly")}
                        className={cn(
                            "px-6 py-2 rounded-full text-sm font-medium transition-all",
                            billingPeriod === "monthly"
                                ? "bg-card text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Mensual
                    </button>
                    <button
                        onClick={() => setBillingPeriod("annual")}
                        className={cn(
                            "px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                            billingPeriod === "annual"
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Anual
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary-foreground/20 text-primary-foreground border-0">
                            -20%
                        </Badge>
                    </button>
                </div>
            </div>

            {/* Founders — Exclusive, entire bar is clickable */}
            {billingPeriod === "annual" && (
                <Link href="/founders" className="block mb-8">
                    <div
                        className="flex items-center justify-between gap-4 px-6 py-5 rounded-xl border cursor-pointer transition-all hover:opacity-80"
                        style={{
                            borderColor: 'color-mix(in srgb, var(--plan-founder) 30%, transparent)',
                            background: 'color-mix(in srgb, var(--plan-founder) 5%, transparent)',
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <Medal className="h-4 w-4 shrink-0" style={{ color: 'var(--plan-founder)' }} />
                            <span className="text-sm font-medium">Programa de Fundadores</span>
                            <span className="text-muted-foreground/40 hidden sm:inline">·</span>
                            <span className="text-sm text-muted-foreground hidden sm:inline">Suscripción anual con 8 beneficios exclusivos de por vida</span>
                        </div>
                        <span
                            className="text-sm shrink-0 flex items-center gap-1.5 hover:underline"
                            style={{ color: 'var(--plan-founder)' }}
                        >
                            Conocer más
                            <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                    </div>
                </Link>
            )}

            {/* Plan Cards - Using reusable PlanCardsGrid */}
            <div className="mb-16">
                <PlanCardsGrid
                    plans={plans}
                    currentPlanId={currentPlanId}
                    organizationId={organizationId}
                    isAdmin={isAdmin}
                    purchaseFlags={purchaseFlags}
                    isDashboard={isDashboard}
                    billingPeriod={billingPeriod}
                    onBillingPeriodChange={setBillingPeriod}
                    showToggle={false}
                />
            </div>

            {/* Detailed Comparison - Vercel Style */}
            <div className="space-y-0 w-full">
                {/* Sticky Header - Different layouts for mobile/desktop */}
                <div className="sticky top-16 z-20 bg-background/95 backdrop-blur-sm border-b">
                    {/* Mobile: Tab selector */}
                    <div className="md:hidden flex items-center justify-between py-3 px-2">
                        <div className="flex gap-1">
                            {comparisonPlans.map((plan, index) => (
                                <button
                                    key={plan.id}
                                    onClick={() => setSelectedPlanIndex(index)}
                                    className={cn(
                                        "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                                        selectedPlanIndex === index
                                            ? "bg-muted text-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {getPlanDisplayName(plan.name)}
                                </button>
                            ))}
                        </div>
                        {comparisonPlans[selectedPlanIndex] && (() => {
                            const selectedPlan = comparisonPlans[selectedPlanIndex];
                            const thisTier = getPlanTier(selectedPlan.name);
                            const curPlan = currentPlanId ? plans.find(p => p.id === currentPlanId) : null;
                            const curTier = curPlan ? getPlanTier(curPlan.name) : 0;
                            const isFree = thisTier === 0;
                            const isLoggedIn = !!currentPlanId || isDashboard;
                            const isCurrentPlan = currentPlanId === selectedPlan.id;
                            const status = getPlanStatus(selectedPlan.name);

                            if (isCurrentPlan || (isFree && isLoggedIn)) {
                                return (
                                    <Button size="sm" variant="outline" disabled>
                                        <Check className="h-4 w-4 mr-1" />
                                        Actual
                                    </Button>
                                );
                            }

                            if (isLoggedIn && thisTier < curTier) {
                                return (
                                    <Button size="sm" variant="outline" disabled>
                                        <Check className="h-4 w-4 mr-1" />
                                        Incluido
                                    </Button>
                                );
                            }

                            if (status !== 'active') {
                                const config = PLAN_STATUS_CONFIG[status];
                                if (config) {
                                    const StatusIcon = config.icon;
                                    if (isAdmin) {
                                        return (
                                            <Link href={getCheckoutUrl(selectedPlan) as "/checkout"}>
                                                <Button size="sm" variant="outline" className={config.buttonColor}>
                                                    <StatusIcon className="h-3 w-3 mr-1" />
                                                    {config.label}
                                                </Button>
                                            </Link>
                                        );
                                    }
                                    return (
                                        <Button size="sm" variant="outline" className={config.buttonColor} disabled>
                                            <StatusIcon className="h-3 w-3 mr-1" />
                                            {config.label}
                                        </Button>
                                    );
                                }
                            }

                            return (
                                <Link href={getCheckoutUrl(selectedPlan) as "/checkout"}>
                                    <Button
                                        size="sm"
                                        className={cn(
                                            getPlanGradient(selectedPlan.name).bg,
                                            "text-white hover:opacity-90"
                                        )}
                                    >
                                        {isDashboard ? "Mejorar" : "Empezar"}
                                    </Button>
                                </Link>
                            );
                        })()}
                    </div>

                    {/* Desktop: All plans visible */}
                    <div className="hidden md:grid md:grid-cols-4 gap-4 py-4 px-2">
                        <div className="text-sm font-medium text-muted-foreground">
                            Características
                        </div>
                        {comparisonPlans.map((plan) => {
                            const planStatus = getPlanStatus(plan.name);
                            const isCurrentPlan = currentPlanId === plan.id;
                            const isPro = plan.name.toLowerCase().includes("pro");
                            const thisTier = getPlanTier(plan.name);
                            const curPlan = currentPlanId ? plans.find(p => p.id === currentPlanId) : null;
                            const curTier = curPlan ? getPlanTier(curPlan.name) : 0;
                            const isFree = thisTier === 0;
                            const isLoggedIn = !!currentPlanId || isDashboard;

                            return (
                                <div key={plan.id} className="text-center">
                                    <div className="font-semibold mb-2">{getPlanDisplayName(plan.name)}</div>
                                    {isCurrentPlan || (isFree && isLoggedIn) ? (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled
                                            className="w-full max-w-[140px]"
                                        >
                                            <Check className="h-4 w-4 mr-1" />
                                            {isCurrentPlan ? "Plan Actual" : "Plan Actual"}
                                        </Button>
                                    ) : isLoggedIn && thisTier < curTier ? (
                                        <Button size="sm" variant="outline" disabled className="w-full max-w-[140px]">
                                            <Check className="h-4 w-4 mr-1" />
                                            Incluido
                                        </Button>
                                    ) : planStatus !== 'active' ? (() => {
                                        const config = PLAN_STATUS_CONFIG[planStatus];
                                        if (!config) return null;
                                        const StatusIcon = config.icon;
                                        if (isAdmin) {
                                            return (
                                                <Link href={getCheckoutUrl(plan) as "/checkout"}>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className={cn("w-full max-w-[140px]", config.buttonColor)}
                                                    >
                                                        <StatusIcon className="h-3 w-3 mr-1" />
                                                        {config.label}
                                                    </Button>
                                                </Link>
                                            );
                                        }
                                        return (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className={cn("w-full max-w-[140px]", config.buttonColor)}
                                                disabled
                                            >
                                                <StatusIcon className="h-3 w-3 mr-1" />
                                                {config.label}
                                            </Button>
                                        );
                                    })() : (
                                        <Link href={getCheckoutUrl(plan) as "/checkout"}>
                                            <Button
                                                size="sm"
                                                variant={isPro ? "default" : "outline"}
                                                className={cn(
                                                    "w-full max-w-[140px]",
                                                    isPro && `${getPlanGradient(plan.name).bg} hover:opacity-90 text-white`
                                                )}
                                            >
                                                {getCtaLabel(plan, true)}
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Feature Modules */}
                {FEATURE_MODULES.map((module, moduleIndex) => {
                    const ModuleIcon = MODULE_ICONS[module.icon] || Sparkles;
                    return (
                        <div key={module.id} className="border-b last:border-0">
                            {/* Module Header - more space above */}
                            <div className={cn(
                                "px-2 pb-6",
                                moduleIndex === 0 ? "pt-6" : "pt-12" // First module less top padding
                            )}>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                    Funcionalidades
                                </p>
                                <div className="flex items-center gap-2">
                                    <ModuleIcon className="h-5 w-5 text-primary" />
                                    <h3 className="text-lg font-semibold">{module.title}</h3>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {module.description}
                                </p>
                            </div>

                            {/* Features Grid */}
                            <div className="divide-y">
                                {module.features.map((feature) => (
                                    <div
                                        key={feature.key}
                                        className="hover:bg-muted/30 transition-colors"
                                    >
                                        {/* Mobile: 2 columns (feature + selected plan only) */}
                                        <div className="md:hidden flex justify-between py-4 px-2 pl-6">
                                            <span className="text-sm font-medium">
                                                {feature.label}
                                            </span>
                                            {comparisonPlans[selectedPlanIndex] && (
                                                <span className="text-sm text-right">
                                                    {(() => {
                                                        const value = getDynamicFeatureValue(comparisonPlans[selectedPlanIndex], feature.featureKey);
                                                        return typeof value === "boolean" ? (
                                                            value ? (
                                                                <Check className="h-5 w-5 text-primary" />
                                                            ) : (
                                                                <span className="text-muted-foreground">—</span>
                                                            )
                                                        ) : (
                                                            <span className="text-foreground">{value}</span>
                                                        );
                                                    })()}
                                                </span>
                                            )}
                                        </div>

                                        {/* Desktop: 4 columns (all plans) */}
                                        <div className="hidden md:grid md:grid-cols-4 gap-4 py-4 px-2 pl-6">
                                            <div className="text-sm font-medium">
                                                {feature.label}
                                            </div>
                                            {comparisonPlans.map((plan) => {
                                                const value = getDynamicFeatureValue(plan, feature.featureKey);
                                                return (
                                                    <div key={plan.id} className="text-center text-sm">
                                                        {typeof value === "boolean" ? (
                                                            value ? (
                                                                <Check className="h-5 w-5 text-primary mx-auto" />
                                                            ) : (
                                                                <span className="text-muted-foreground">—</span>
                                                            )
                                                        ) : (
                                                            <span className="text-foreground">{value}</span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* CTA Section */}
            <div className="mt-12 text-center">
                <p className="text-muted-foreground mb-4">
                    ¿Tienes preguntas? Contáctanos para obtener más información.
                </p>
                <Link href="/contact">
                    <Button variant="outline" size="lg">
                        Contactar Ventas
                    </Button>
                </Link>
            </div>
        </div>
    );
}

