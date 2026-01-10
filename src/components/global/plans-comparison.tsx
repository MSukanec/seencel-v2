"use client";

import { useState } from "react";
import { Plan, PlanFeatures } from "@/actions/plans";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Sparkles, Zap, Crown, Users, FileText, Plug2, Headphones, Shield, Wrench, FolderOpen, HardDrive, BarChart3, Webhook } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";

export interface PlanPurchaseFlags {
    pro: boolean;
    teams: boolean;
}

interface PlansComparisonProps {
    plans: Plan[];
    /**
     * When true, CTA buttons say "Cambiar Plan" instead of "Empezar Ahora".
     */
    isDashboard?: boolean;
    /**
     * Feature flags for enabling/disabling plan purchases
     */
    purchaseFlags?: PlanPurchaseFlags;
    /**
     * The current user's organization plan ID (to highlight their current plan)
     */
    currentPlanId?: string | null;
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
            { key: "members", label: "Miembros del equipo", featureKey: "max_members" },
            { key: "projects", label: "Proyectos activos", featureKey: "max_projects" },
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

// Plan icons based on tier (matching badge icons)
const getPlanIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("team")) return Users;
    if (lower.includes("pro")) return Crown;
    return Sparkles; // Free default
};

// Plan gradient colors matching CSS variables
const getPlanGradient = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("team")) {
        return {
            gradient: "from-purple-500 to-violet-600",
            bg: "bg-purple-500",
            text: "text-purple-600 dark:text-purple-400",
            border: "border-purple-300 dark:border-purple-700",
            lightBg: "bg-purple-50 dark:bg-purple-900/30",
        };
    }
    if (lower.includes("pro")) {
        return {
            gradient: "from-indigo-500 to-blue-600",
            bg: "bg-indigo-500",
            text: "text-indigo-600 dark:text-indigo-400",
            border: "border-indigo-300 dark:border-indigo-700",
            lightBg: "bg-indigo-50 dark:bg-indigo-900/30",
        };
    }
    // Free (lime/green)
    return {
        gradient: "from-lime-500 to-green-500",
        bg: "bg-lime-500",
        text: "text-lime-600 dark:text-lime-400",
        border: "border-lime-300 dark:border-lime-700",
        lightBg: "bg-lime-50 dark:bg-lime-900/30",
    };
};

export function PlansComparison({ plans, isDashboard = false, purchaseFlags = { pro: true, teams: true }, currentPlanId }: PlansComparisonProps) {
    const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("annual");
    const [selectedPlanIndex, setSelectedPlanIndex] = useState(1); // Default to Pro (middle plan)

    // Check if a plan can be purchased based on feature flags
    const canPurchasePlan = (planName: string): boolean => {
        const lower = planName.toLowerCase();
        if (lower.includes("free")) return true; // Free is always available
        if (lower.includes("pro")) return purchaseFlags.pro;
        if (lower.includes("team")) return purchaseFlags.teams;
        return true;
    };

    // Price mapping: planName -> { monthly, annual }
    const PRICE_MAP: Record<string, { monthly: number; annual: number }> = {
        free: { monthly: 0, annual: 0 },
        pro: { monthly: 20, annual: 16 },
        teams: { monthly: 30, annual: 24 },
    };

    const getPrice = (planName: string): number => {
        const lower = planName.toLowerCase();
        const prices = PRICE_MAP[lower] || { monthly: 0, annual: 0 };
        return billingPeriod === "annual" ? prices.annual : prices.monthly;
    };

    const formatPrice = (amount: number) => {
        if (!amount) return "Gratis";
        return `US$ ${amount}`;
    };

    // Format storage from MB to human readable
    const formatStorage = (mb: number): string => {
        if (mb >= 1024) return `${Math.round(mb / 1024)} GB`;
        return `${mb} MB`;
    };

    // Get card features from plan.features (dynamic)
    const getCardFeatures = (plan: Plan): Array<{ icon: React.ElementType; label: string; value: string }> => {
        const features = plan.features;
        if (!features) return [];

        const isUnlimited = (val: number) => val >= 999;

        return [
            {
                icon: Users,
                label: "Miembros",
                value: isUnlimited(features.max_members) ? "Ilimitados" : `${features.max_members} miembro${features.max_members > 1 ? "s" : ""}`,
            },
            {
                icon: FolderOpen,
                label: "Proyectos",
                value: isUnlimited(features.max_projects) ? "Ilimitados" : `${features.max_projects} proyectos`,
            },
            {
                icon: HardDrive,
                label: "Almacenamiento",
                value: formatStorage(features.max_storage_mb),
            },
            {
                icon: BarChart3,
                label: "Analíticas",
                value: features.analytics_level === "basic" ? "Básicas" : features.analytics_level === "advanced" ? "Avanzadas" : "Personalizadas",
            },
        ];
    };

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

            {/* Founders Card - Only shows for Annual */}
            {billingPeriod === "annual" && (
                <Card className="mb-8 border-amber-400/50 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/10 dark:border-amber-700/50">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                                    <Crown className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-lg">Programa de Fundadores</CardTitle>
                                        <Badge variant="outline" className="border-amber-400 text-amber-600 dark:text-amber-400">
                                            Oferta Limitada
                                        </Badge>
                                    </div>
                                    <CardDescription>
                                        Suscripción <span className="font-semibold text-foreground">ANUAL</span> con 8 beneficios exclusivos de por vida
                                    </CardDescription>
                                </div>
                            </div>
                            <Button variant="default" className="bg-amber-500 hover:bg-amber-600 text-white">
                                Desde $16/mes →
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-x-8 gap-y-2">
                            {FOUNDERS_BENEFITS.map((benefit, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm">
                                    <Check className="h-4 w-4 text-amber-500 shrink-0" />
                                    <span>{benefit}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800">
                            <p className="text-sm text-muted-foreground">
                                ¿Preguntas? <Link href="/contact" className="text-amber-600 hover:underline">Contacta con nuestro equipo</Link>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Plan Cards */}
            <div className="grid gap-8 md:grid-cols-3 mb-16">
                {plans.map((plan, index) => {
                    const PlanIcon = getPlanIcon(plan.name);
                    const planColors = getPlanGradient(plan.name);
                    const isPopular = index === 1; // Middle plan is "popular"
                    const isCurrentPlan = currentPlanId === plan.id;

                    return (
                        <Card
                            key={plan.id}
                            className={cn(
                                "relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
                                isPopular && `border-2 shadow-lg ring-2 ${planColors.border} ring-current/20`,
                                isCurrentPlan && "ring-2 ring-primary"
                            )}
                        >
                            {/* Gradient accent bar */}
                            <div className={cn("h-1.5 w-full bg-gradient-to-r", getPlanGradient(plan.name).gradient)} />

                            {/* Badges container */}
                            <div className="absolute top-4 right-4 flex flex-col gap-1 items-end">
                                {isCurrentPlan && (
                                    <Badge variant="outline" className="border-primary text-primary bg-primary/10">
                                        Tu plan actual
                                    </Badge>
                                )}
                                {isPopular && !isCurrentPlan && (
                                    <Badge className={cn("text-white", planColors.bg)}>
                                        Popular
                                    </Badge>
                                )}
                            </div>

                            <CardHeader className="pt-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={cn(
                                        "p-2 rounded-lg bg-gradient-to-br",
                                        getPlanGradient(plan.name).gradient,
                                        "text-white"
                                    )}>
                                        <PlanIcon className="h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                                </div>
                                <CardDescription>
                                    {plan.billing_type === "per_user" ? "Por usuario / mes" : "Tarifa plana"}
                                </CardDescription>
                            </CardHeader>

                            <CardContent>
                                <div className="mb-6">
                                    <span className="text-4xl font-bold">
                                        {formatPrice(getPrice(plan.name))}
                                    </span>
                                    {getPrice(plan.name) > 0 && (
                                        <span className="text-muted-foreground ml-1 text-sm">/ mes</span>
                                    )}
                                </div>

                                {/* Dynamic feature list from plan.features */}
                                <ul className="space-y-3 text-sm">
                                    {getCardFeatures(plan).map((feature) => {
                                        const FeatureIcon = feature.icon;
                                        return (
                                            <li key={feature.label} className="flex items-center gap-3">
                                                <FeatureIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                                                <span>
                                                    <span className="text-muted-foreground">{feature.label}:</span>{" "}
                                                    <span className="font-medium">{feature.value}</span>
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </CardContent>

                            <CardFooter>
                                {isCurrentPlan ? (
                                    <Button
                                        className="w-full"
                                        variant="outline"
                                        disabled
                                    >
                                        <Check className="h-4 w-4 mr-2" />
                                        Plan Actual
                                    </Button>
                                ) : canPurchasePlan(plan.name) ? (
                                    <Button
                                        className={cn(
                                            "w-full",
                                            isPopular && `${planColors.bg} hover:opacity-90 text-white border-0`
                                        )}
                                        variant={isPopular ? "default" : "outline"}
                                    >
                                        {isDashboard ? "Cambiar Plan" : "Empezar Ahora"}
                                    </Button>
                                ) : (
                                    <div className="w-full text-center">
                                        <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                                            <Wrench className="h-4 w-4" />
                                            <span className="text-sm font-medium">En Mantenimiento</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Vuelve pronto</p>
                                    </div>
                                )}
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            {/* Detailed Comparison - Vercel Style */}
            <div className="space-y-0">
                {/* Sticky Header - Different layouts for mobile/desktop */}
                <div className="sticky top-16 z-20 bg-background/95 backdrop-blur-sm border-b">
                    {/* Mobile: Tab selector */}
                    <div className="md:hidden flex items-center justify-between py-3 px-2">
                        <div className="flex gap-1">
                            {plans.map((plan, index) => (
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
                                    {plan.name}
                                </button>
                            ))}
                        </div>
                        {plans[selectedPlanIndex] && (
                            canPurchasePlan(plans[selectedPlanIndex].name) ? (
                                <Button
                                    size="sm"
                                    className={cn(
                                        getPlanGradient(plans[selectedPlanIndex].name).bg,
                                        "text-white hover:opacity-90"
                                    )}
                                >
                                    {isDashboard ? "Cambiar" : "Empezar"}
                                </Button>
                            ) : (
                                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                    <Wrench className="h-3 w-3" />
                                    <span>Mantenimiento</span>
                                </div>
                            )
                        )}
                    </div>

                    {/* Desktop: All plans visible */}
                    <div className="hidden md:grid md:grid-cols-4 gap-4 py-4 px-2">
                        <div className="text-sm font-medium text-muted-foreground">
                            Características
                        </div>
                        {plans.map((plan) => {
                            const planColors = getPlanGradient(plan.name);
                            const isPurchasable = canPurchasePlan(plan.name);
                            return (
                                <div key={plan.id} className="text-center">
                                    <div className="font-semibold mb-2">{plan.name}</div>
                                    {isPurchasable ? (
                                        <Button
                                            size="sm"
                                            variant={plan.name.toLowerCase().includes("pro") ? "default" : "outline"}
                                            className={cn(
                                                "w-full max-w-[140px]",
                                                plan.name.toLowerCase().includes("pro") && `${planColors.bg} hover:opacity-90 text-white`
                                            )}
                                        >
                                            {isDashboard ? "Cambiar" : "Empezar"}
                                        </Button>
                                    ) : (
                                        <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs py-2">
                                            <Wrench className="h-3 w-3" />
                                            <span>Mantenimiento</span>
                                        </div>
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
                                            {plans[selectedPlanIndex] && (
                                                <span className="text-sm text-right">
                                                    {(() => {
                                                        const value = getDynamicFeatureValue(plans[selectedPlanIndex], feature.featureKey);
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
                                            {plans.map((plan) => {
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
