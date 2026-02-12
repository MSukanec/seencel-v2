"use client";

import { Plan } from "@/actions/plans";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Zap, Users, UserCheck, Medal, FolderOpen, HardDrive, BarChart3, Wrench, Clock, Lock, Building2 } from "lucide-react";
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
    essential: { monthly: 0, annual: 0 },
    pro: { monthly: 20, annual: 16 },
    teams: { monthly: 30, annual: 24 },
};

export const getPlanIcon = (name: string): LucideIcon => {
    const lower = name.toLowerCase();
    if (lower.includes("enterprise") || lower.includes("empresa")) return Building2;
    if (lower.includes("team")) return Users;
    if (lower.includes("pro")) return Zap;
    return Sparkles;
};

export const getPlanGradient = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("enterprise") || lower.includes("empresa")) {
        return {
            gradient: "from-zinc-700 to-zinc-800",
            bg: "bg-zinc-800",
            text: "text-zinc-600 dark:text-zinc-300",
            border: "border-zinc-500/50 dark:border-zinc-600/50",
            lightBg: "bg-zinc-100 dark:bg-zinc-900/30",
        };
    }
    if (lower.includes("team")) {
        return {
            gradient: "from-slate-500 to-slate-600",
            bg: "bg-slate-500",
            text: "text-slate-600 dark:text-slate-400",
            border: "border-slate-400/40 dark:border-slate-600/50",
            lightBg: "bg-slate-50 dark:bg-slate-900/20",
        };
    }
    if (lower.includes("pro")) {
        return {
            gradient: "from-stone-500 to-stone-600",
            bg: "bg-stone-500",
            text: "text-stone-600 dark:text-stone-400",
            border: "border-stone-400/50 dark:border-stone-600/50",
            lightBg: "bg-stone-50 dark:bg-stone-900/20",
        };
    }
    // Essential / Free — neutral gray
    return {
        gradient: "from-zinc-400 to-zinc-500",
        bg: "bg-zinc-500",
        text: "text-zinc-600 dark:text-zinc-400",
        border: "border-zinc-300 dark:border-zinc-700",
        lightBg: "bg-zinc-50 dark:bg-zinc-900/20",
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
        icon: Medal,
        label: "Solo Fundadores",
        buttonColor: "border-zinc-400/50 text-zinc-400 hover:bg-zinc-400/10",
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
    if (!amount) return "Esencial";
    return `US$ ${amount}`;
};

const getCardFeatures = (plan: Plan, billingPeriod: "monthly" | "annual"): Array<{ icon: LucideIcon; label: string; value: string }> => {
    const features = plan.features;
    if (!features) return [];

    const isUnlimited = (val: number) => val >= 999;
    const seatPrice = getPrice(plan.name, billingPeriod);

    return [
        {
            icon: Users,
            label: "Miembros",
            value: features.can_invite_members ? `Ilimitados (US$ ${seatPrice} / asiento)` : "Solo tú",
        },
        {
            icon: UserCheck,
            label: "Asesores externos",
            value: features.max_external_advisors != null && features.max_external_advisors > 0
                ? (features.max_external_advisors >= 999 ? "Ilimitados" : `${features.max_external_advisors}`)
                : "No incluido",
        },
        {
            icon: FolderOpen,
            label: "Proyectos activos",
            value: isUnlimited(features.max_active_projects) ? "Ilimitados" : `${features.max_active_projects} proyectos`,
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
    const features = getCardFeatures(plan, billingPeriod);

    return (
        <Card
            className={cn(
                "relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
                isPopular && `border-2 shadow-lg ring-2 ${planColors.border} ring-current/20`,
            )}
        >
            {/* Accent bar */}
            <div className={cn("h-1 w-full bg-gradient-to-r", planColors.gradient)} />

            {/* Badges container */}
            <div className="absolute top-4 right-4 flex flex-col gap-1 items-end">
                {isPopular && !isCurrentPlan && (
                    <Badge className={cn("text-white", planColors.bg)}>
                        Popular
                    </Badge>
                )}
            </div>

            <CardHeader className="pt-4 pb-2">
                <div className="flex items-center gap-3 mb-1">
                    <div className={cn(
                        "p-1.5 rounded-lg bg-gradient-to-br",
                        planColors.gradient,
                        "text-white"
                    )}>
                        <PlanIcon className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-lg">{getPlanDisplayName(plan.name)}</CardTitle>
                </div>
                <CardDescription className="text-xs">
                    {plan.billing_type === "per_user" ? "Por usuario / mes" : "Tarifa plana"}
                </CardDescription>
            </CardHeader>

            <CardContent className="pt-0">
                <div className="mb-4">
                    <span className="text-3xl font-bold">
                        {formatPrice(price)}
                    </span>
                    {price > 0 && (
                        <span className="text-muted-foreground ml-1 text-sm">/ mes</span>
                    )}
                </div>

                {/* Feature list */}
                <ul className="space-y-2 text-sm">
                    {features.map((feature) => {
                        const FeatureIcon = feature.icon;
                        return (
                            <li key={feature.label} className="flex items-center gap-2.5">
                                <FeatureIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
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
