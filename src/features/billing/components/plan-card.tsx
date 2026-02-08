"use client";

import { Plan } from "@/actions/plans";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Crown, Users, FolderOpen, HardDrive, BarChart3, Wrench, Clock, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPlanDisplayName } from "@/lib/plan-utils";
import { Link } from "@/i18n/routing";
import type { LucideIcon } from "lucide-react";

// ============================================================
// Shared plan types
// ============================================================

export type PlanFlagStatus = 'active' | 'maintenance' | 'hidden' | 'founders' | 'coming_soon';

export interface PlanPurchaseFlags {
    pro: PlanFlagStatus;
    teams: PlanFlagStatus;
}

// ============================================================
// Plan visual constants
// ============================================================

const PRICE_MAP: Record<string, { monthly: number; annual: number }> = {
    free: { monthly: 0, annual: 0 },
    pro: { monthly: 20, annual: 16 },
    teams: { monthly: 30, annual: 24 },
};

export const getPlanIcon = (name: string): LucideIcon => {
    const lower = name.toLowerCase();
    if (lower.includes("team")) return Users;
    if (lower.includes("pro")) return Crown;
    return Sparkles;
};

export const getPlanGradient = (name: string) => {
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
    return {
        gradient: "from-lime-500 to-green-500",
        bg: "bg-lime-500",
        text: "text-lime-600 dark:text-lime-400",
        border: "border-lime-300 dark:border-lime-700",
        lightBg: "bg-lime-50 dark:bg-lime-900/30",
    };
};

// ============================================================
// Status override config for non-active plans
// ============================================================

export interface PlanStatusOverride {
    icon: LucideIcon;
    label: string;
    sublabel?: string;
    buttonColor: string;
}

export const PLAN_STATUS_CONFIG: Record<string, PlanStatusOverride> = {
    maintenance: {
        icon: Wrench,
        label: "En Mantenimiento",
        sublabel: "Vuelve pronto",
        buttonColor: "border-orange-500 bg-orange-500/15 text-orange-500",
    },
    coming_soon: {
        icon: Clock,
        label: "Próximamente",
        sublabel: "Disponible pronto",
        buttonColor: "border-blue-500/50 text-blue-500 hover:bg-blue-500/10",
    },
    hidden: {
        icon: Lock,
        label: "No Disponible",
        buttonColor: "border-muted text-muted-foreground",
    },
    founders: {
        icon: Crown,
        label: "Solo Fundadores",
        buttonColor: "border-amber-500/50 text-amber-500 hover:bg-amber-500/10",
    },
};

// ============================================================
// Helpers
// ============================================================

const formatStorage = (mb: number): string => {
    if (mb >= 1024) return `${Math.round(mb / 1024)} GB`;
    return `${mb} MB`;
};

const getPrice = (planName: string, billingPeriod: "monthly" | "annual"): number => {
    const lower = planName.toLowerCase();
    const prices = PRICE_MAP[lower] || { monthly: 0, annual: 0 };
    return billingPeriod === "annual" ? prices.annual : prices.monthly;
};

const formatPrice = (amount: number) => {
    if (!amount) return "Gratis";
    return `US$ ${amount}`;
};

const getCardFeatures = (plan: Plan): Array<{ icon: LucideIcon; label: string; value: string }> => {
    const features = plan.features;
    if (!features) return [];

    const isUnlimited = (val: number) => val >= 999;

    return [
        {
            icon: Users,
            label: "Miembros",
            value: features.can_invite_members ? "Ilimitados (por asiento)" : "Solo tú",
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

// ============================================================
// PlanCard component
// ============================================================

export interface PlanCardProps {
    plan: Plan;
    billingPeriod: "monthly" | "annual";
    isCurrentPlan: boolean;
    isPopular?: boolean;
    // CTA
    ctaLabel: string;
    ctaHref: string;
    // Disabled states
    ctaDisabled?: boolean;
    ctaDisabledLabel?: string;
    // Status override (maintenance, coming_soon, etc)
    statusOverride?: PlanStatusOverride;
    // Admin bypass
    isAdmin?: boolean;
    // Show "Ver detalles" link (only in dashboard, not pricing)
    showDetailsLink?: boolean;
}

export function PlanCard({
    plan,
    billingPeriod,
    isCurrentPlan,
    isPopular = false,
    ctaLabel,
    ctaHref,
    ctaDisabled = false,
    ctaDisabledLabel,
    statusOverride,
    isAdmin = false,
    showDetailsLink = false,
}: PlanCardProps) {
    const PlanIcon = getPlanIcon(plan.name);
    const planColors = getPlanGradient(plan.name);
    const price = getPrice(plan.name, billingPeriod);
    const features = getCardFeatures(plan);

    return (
        <Card
            className={cn(
                "relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
                isPopular && `border-2 shadow-lg ring-2 ${planColors.border} ring-current/20`,
            )}
        >
            {/* Gradient accent bar */}
            <div className={cn("h-1.5 w-full bg-gradient-to-r", planColors.gradient)} />

            {/* Badges container */}
            <div className="absolute top-4 right-4 flex flex-col gap-1 items-end">
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
                        planColors.gradient,
                        "text-white"
                    )}>
                        <PlanIcon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-xl">{getPlanDisplayName(plan.name)}</CardTitle>
                </div>
                <CardDescription>
                    {plan.billing_type === "per_user" ? "Por usuario / mes" : "Tarifa plana"}
                </CardDescription>
            </CardHeader>

            <CardContent>
                <div className="mb-6">
                    <span className="text-4xl font-bold">
                        {formatPrice(price)}
                    </span>
                    {price > 0 && (
                        <span className="text-muted-foreground ml-1 text-sm">/ mes</span>
                    )}
                </div>

                {/* Feature list */}
                <ul className="space-y-3 text-sm">
                    {features.map((feature) => {
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

            <CardFooter className="flex-col gap-2">
                {ctaDisabled ? (
                    <Button className="w-full" variant="outline" disabled>
                        <Check className="h-4 w-4 mr-2" />
                        {ctaDisabledLabel || "Plan Actual"}
                    </Button>
                ) : statusOverride ? (
                    isAdmin ? (
                        <Link href={ctaHref as "/checkout"} className="w-full">
                            <Button
                                className={cn("w-full", statusOverride.buttonColor)}
                                variant="outline"
                            >
                                <statusOverride.icon className="h-4 w-4 mr-2" />
                                {statusOverride.label}
                                {statusOverride.sublabel && (
                                    <span className="opacity-70 ml-1">· {statusOverride.sublabel}</span>
                                )}
                            </Button>
                        </Link>
                    ) : (
                        <Button
                            className={cn("w-full", statusOverride.buttonColor)}
                            variant="outline"
                            disabled
                        >
                            <statusOverride.icon className="h-4 w-4 mr-2" />
                            {statusOverride.label}
                            {statusOverride.sublabel && (
                                <span className="opacity-70 ml-1">· {statusOverride.sublabel}</span>
                            )}
                        </Button>
                    )
                ) : (
                    <Link href={ctaHref as "/checkout"} className="w-full">
                        <Button
                            className={cn(
                                "w-full",
                                isPopular && `${planColors.bg} hover:opacity-90 text-white border-0`
                            )}
                            variant={isPopular ? "default" : "outline"}
                        >
                            {ctaLabel}
                        </Button>
                    </Link>
                )}

                {showDetailsLink && (
                    <Link href="/pricing" className="w-full">
                        <Button variant="ghost" className="w-full text-muted-foreground" size="sm">
                            Ver detalles
                        </Button>
                    </Link>
                )}
            </CardFooter>
        </Card>
    );
}
