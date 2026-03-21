"use client";

import React from "react";
import { Plan } from "@/actions/plans";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Zap, Users, UserCheck, Medal, FolderOpen, HardDrive, BarChart3, Wrench, Clock, Lock, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPlanDisplayName } from "@/lib/plan-utils";
import { Link } from "@/i18n/routing";
import type { LucideIcon } from "lucide-react";
import { getPlanConfig, resolvePlanSlug, MATERIALS } from "@/components/shared/plan-badge";

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
// PlanCard component — metallic material design
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
    const slug = resolvePlanSlug(plan.name);
    const mat = MATERIALS[slug];
    const price = getPrice(plan.name, billingPeriod);
    const features = getCardFeatures(plan, billingPeriod);
    const config = getPlanConfig(plan.name);
    const Mark = config.mark;

    // Refs for mouse tracking
    const plateRef = React.useRef<HTMLDivElement>(null);
    const lightRef = React.useRef<HTMLDivElement>(null);

    const handleMouseMove = React.useCallback((e: React.MouseEvent) => {
        if (!plateRef.current || !lightRef.current) return;
        const rect = plateRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        lightRef.current.style.background = `radial-gradient(${mat.hoverShape} at ${x}px ${y}px, ${mat.lightColor}, transparent)`;
        lightRef.current.style.opacity = String(mat.hoverIntensity);
    }, [mat]);

    const handleMouseLeave = React.useCallback(() => {
        if (lightRef.current) {
            lightRef.current.style.opacity = "0";
        }
    }, []);

    return (
        <div
            ref={plateRef}
            className={cn(
                "relative overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1",
                "flex flex-col",
                isPopular && "ring-1 ring-current/10",
            )}
            style={{
                background: mat.surface,
                border: `1px solid ${mat.border}`,
                boxShadow: [
                    `inset 0 1px 0 ${mat.bevelLight}`,
                    `inset 0 -1px 0 ${mat.bevelDark}`,
                    mat.dropShadow,
                    ...(mat.innerGlow ? [mat.innerGlow] : []),
                ].join(", "),
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* ── Brushed texture (horizontal lines, barely visible) ── */}
            {mat.brushTexture && (
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ backgroundImage: mat.brushTexture }}
                />
            )}

            {/* ── Border sheen — reflection running along the top edge ── */}
            {mat.hasSheen && (
                <div
                    className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none z-[3]"
                    style={{
                        background:
                            "linear-gradient(90deg, transparent 0%, transparent 10%, rgba(255,255,255,0.25) 46%, rgba(255,255,255,0.08) 54%, transparent 90%, transparent 100%)",
                        animation: "plan-reflection 12s linear infinite",
                    }}
                />
            )}

            {/* ── Mouse-following light ── */}
            <div
                ref={lightRef}
                className="absolute inset-0 pointer-events-none z-[2] transition-opacity duration-300"
                style={{ opacity: 0 }}
            />

            {/* ── Popular badge ── */}
            {isPopular && !isCurrentPlan && (
                <div className="absolute top-4 right-4 z-[10]">
                    <Badge
                        className="text-xs border-0 px-2.5 py-1"
                        style={{
                            background: "rgba(255,255,255,0.08)",
                            color: "rgba(255,255,255,0.8)",
                            backdropFilter: "blur(4px)",
                        }}
                    >
                        Popular
                    </Badge>
                </div>
            )}

            {/* ── Header ── */}
            <div className="relative z-[5] pt-6 px-6 pb-2">
                <div className="flex items-center gap-3 mb-1.5">
                    <span 
                        className="uppercase font-bold text-[22px] flex items-center gap-3"
                        style={{
                            backgroundImage: mat.cutFill,
                            WebkitBackgroundClip: "text",
                            backgroundClip: "text",
                            color: "transparent",
                            letterSpacing: mat.letterSpacing,
                            WebkitTextFillColor: "transparent",
                            textShadow: mat.cutDepth
                        }}
                    >
                        <span className="flex items-center justify-center -mt-[2px]">
                            <Mark color={mat.markColor} />
                        </span>
                        {config.label}
                    </span>
                </div>
                <p className="text-xs text-muted-foreground/60">
                    {plan.billing_type === "per_user" ? "Por usuario / mes" : "Tarifa plana"}
                </p>
            </div>

            {/* ── Price ── */}
            <div className="relative z-[5] px-6 pb-4">
                {price === 0 ? (
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold" style={{ color: mat.markColor }}>
                            Gratis
                        </span>
                    </div>
                ) : (
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold" style={{ color: mat.markColor }}>
                            US$ {price}
                        </span>
                        <span className="text-muted-foreground/60 text-sm font-medium">/ mes</span>
                    </div>
                )}
            </div>

            {/* ── Divider ── */}
            <div
                className="mx-6 h-px opacity-30"
                style={{
                    background: `linear-gradient(90deg, transparent, ${mat.markColor}, transparent)`,
                }}
            />

            {/* ── Feature list ── */}
            <div className="relative z-[5] flex-1 px-6 py-5">
                <ul className="space-y-3 text-[13.5px]">
                    {features.map((feature) => {
                        const FeatureIcon = feature.icon;
                        return (
                            <li key={feature.label} className="flex items-center gap-2.5">
                                <FeatureIcon className="h-4 w-4 shrink-0" style={{ color: mat.markColor, opacity: 0.8 }} />
                                <span className="text-white/80 font-medium">
                                    <span className="opacity-70">{feature.label}:</span>{" "}
                                    <span className="opacity-100">{feature.value}</span>
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </div>

            {/* ── Footer ── */}
            <div className="relative z-[5] px-5 pb-5 pt-2 flex flex-col gap-2">
                {ctaDisabled ? (
                    <Button
                        className="w-full border-0"
                        variant="outline"
                        disabled
                        style={{
                            background: "rgba(255,255,255,0.04)",
                            color: "rgba(255,255,255,0.5)",
                        }}
                    >
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
                            className="w-full border-0 font-bold opacity-90 hover:opacity-100 transition-opacity"
                            variant="outline"
                            style={{
                                background: isPopular
                                    ? mat.cutFill
                                    : "rgba(255,255,255,0.06)",
                                color: isPopular ? "#000" : "rgba(255,255,255,0.7)",
                                boxShadow: isPopular ? mat.dropShadow : "none",
                            }}
                        >
                            {ctaLabel}
                        </Button>
                    </Link>
                )}

                {showDetailsLink && (
                    <Link href="/pricing" className="w-full">
                        <Button variant="ghost" className="w-full text-muted-foreground/50 hover:text-muted-foreground" size="sm">
                            Ver detalles
                        </Button>
                    </Link>
                )}
            </div>
        </div>
    );
}
