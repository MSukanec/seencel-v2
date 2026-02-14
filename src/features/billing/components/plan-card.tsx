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
import { getPlanConfig, resolvePlanSlug } from "@/components/shared/plan-badge";

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
// Card material system — derived from PlanBadge materials
// ============================================================

interface CardMaterial {
    surface: string;
    borderColor: string;
    lightColor: string;
    hoverShape: string;
    hoverIntensity: number;
    accentColor: string;
    iconBg: string;
    textHighlight: string;
    /** Whether to show border sheen reflection */
    hasSheen: boolean;
    /** Duration of border sheen animation in seconds — lower = more frequent */
    sheenDuration: number;
    /** Sheen color — bright (top border highlight) */
    sheenColor: string;
    /** Sheen color — dim (secondary borders) */
    sheenColorDim: string;
    /** Sheen color — faint (tertiary borders) */
    sheenColorFaint: string;
}

const CARD_MATERIALS: Record<string, CardMaterial> = {
    essential: {
        surface: "#2a2a2a",
        borderColor: "rgba(255,255,255,0.06)",
        lightColor: "rgba(255,255,255,0.06)",
        hoverShape: "circle 200px",
        hoverIntensity: 1.0,
        accentColor: "rgba(255,255,255,0.04)",
        iconBg: "#3a3a3a",
        textHighlight: "#a0a0a0",
        hasSheen: false,
        sheenDuration: 0,
        sheenColor: "rgba(255,255,255,0.20)",
        sheenColorDim: "rgba(255,255,255,0.08)",
        sheenColorFaint: "rgba(255,255,255,0.03)",
    },
    pro: {
        surface: "#222630",
        borderColor: "rgba(120,140,200,0.15)",
        lightColor: "rgba(140,160,220,0.08)",
        hoverShape: "circle 180px",
        hoverIntensity: 0.9,
        accentColor: "rgba(120,140,200,0.08)",
        iconBg: "linear-gradient(135deg, #2a2e3a, #323850)",
        textHighlight: "#8898b8",
        hasSheen: true,
        sheenDuration: 12,       // base speed
        sheenColor: "rgba(140,160,220,0.30)",
        sheenColorDim: "rgba(140,160,220,0.10)",
        sheenColorFaint: "rgba(140,160,220,0.04)",
    },
    teams: {
        surface: "#262030",
        borderColor: "rgba(150,120,200,0.15)",
        lightColor: "rgba(160,135,220,0.10)",
        hoverShape: "circle 160px",
        hoverIntensity: 0.85,
        accentColor: "rgba(150,120,200,0.08)",
        iconBg: "linear-gradient(135deg, #2e2838, #3a2e48)",
        textHighlight: "#9878b8",
        hasSheen: true,
        sheenDuration: 8,        // 1.5x more frequent
        sheenColor: "rgba(160,135,220,0.30)",
        sheenColorDim: "rgba(160,135,220,0.10)",
        sheenColorFaint: "rgba(160,135,220,0.04)",
    },
    enterprise: {
        surface: "linear-gradient(175deg, #1a1a20, #16161c, #1c1c22)",
        borderColor: "rgba(160,160,210,0.18)",
        lightColor: "rgba(180,170,220,0.12)",
        hoverShape: "ellipse 200px 80px",
        hoverIntensity: 0.7,
        accentColor: "rgba(160,155,210,0.10)",
        iconBg: "linear-gradient(135deg, #232328, #28283a)",
        textHighlight: "#a0a0b8",
        hasSheen: true,
        sheenDuration: 6,        // 2x more frequent
        sheenColor: "rgba(180,170,220,0.35)",
        sheenColorDim: "rgba(180,170,220,0.12)",
        sheenColorFaint: "rgba(180,170,220,0.06)",
    },
};

function getCardMaterial(planName: string): CardMaterial {
    const slug = resolvePlanSlug(planName);
    return CARD_MATERIALS[slug] || CARD_MATERIALS.essential;
}

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
    const mat = getCardMaterial(plan.name);
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
                border: `1px solid ${mat.borderColor}`,
                boxShadow: `0 2px 12px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)`,
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* ── Border sheen — reflection running along the top edge ── */}
            {mat.hasSheen && (
                <div
                    className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none z-[3]"
                    style={{
                        background:
                            `linear-gradient(90deg, transparent 0%, transparent 10%, ${mat.sheenColor} 46%, ${mat.sheenColorDim} 54%, transparent 90%, transparent 100%)`,
                        animation: `plan-reflection ${mat.sheenDuration}s linear infinite`,
                    }}
                />
            )}

            {/* ── Border sheen — bottom edge (mirror, dimmer) ── */}
            {mat.hasSheen && (
                <div
                    className="absolute bottom-0 left-0 right-0 h-[1px] pointer-events-none z-[3]"
                    style={{
                        background:
                            `linear-gradient(90deg, transparent 0%, transparent 10%, ${mat.sheenColorDim} 46%, ${mat.sheenColorFaint} 54%, transparent 90%, transparent 100%)`,
                        animation: `plan-reflection ${mat.sheenDuration * 1.3}s linear infinite`,
                        animationDelay: `${mat.sheenDuration * 0.5}s`,
                    }}
                />
            )}

            {/* ── Border sheen — left edge (vertical) ── */}
            {mat.hasSheen && (
                <div
                    className="absolute top-0 bottom-0 left-0 w-[1px] pointer-events-none z-[3]"
                    style={{
                        background:
                            `linear-gradient(180deg, transparent 0%, transparent 10%, ${mat.sheenColorDim} 46%, ${mat.sheenColorFaint} 54%, transparent 90%, transparent 100%)`,
                        animation: `plan-border-reflection ${mat.sheenDuration * 1.5}s linear infinite`,
                        animationDelay: `${mat.sheenDuration * 0.3}s`,
                    }}
                />
            )}

            {/* ── Border sheen — right edge (vertical) ── */}
            {mat.hasSheen && (
                <div
                    className="absolute top-0 bottom-0 right-0 w-[1px] pointer-events-none z-[3]"
                    style={{
                        background:
                            `linear-gradient(180deg, transparent 0%, transparent 10%, ${mat.sheenColorDim} 46%, ${mat.sheenColorFaint} 54%, transparent 90%, transparent 100%)`,
                        animation: `plan-border-reflection ${mat.sheenDuration * 1.5}s linear infinite`,
                        animationDelay: `${mat.sheenDuration * 0.8}s`,
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
                <div className="absolute top-4 right-4 z-10">
                    <Badge
                        className="text-xs border-0"
                        style={{
                            background: mat.accentColor,
                            color: mat.textHighlight,
                            backdropFilter: "blur(4px)",
                        }}
                    >
                        Popular
                    </Badge>
                </div>
            )}

            {/* ── Header ── */}
            <div className="relative z-[5] pt-5 px-5 pb-2">
                <div className="flex items-center gap-3 mb-1.5">
                    <div
                        className="p-1.5 rounded-lg"
                        style={{ background: typeof mat.iconBg === 'string' ? mat.iconBg : mat.iconBg }}
                    >
                        <Mark color={mat.textHighlight} />
                    </div>
                    <span className="text-base font-semibold text-foreground">
                        {getPlanDisplayName(plan.name)}
                    </span>
                </div>
                <p className="text-xs text-muted-foreground/60">
                    {plan.billing_type === "per_user" ? "Por usuario / mes" : "Tarifa plana"}
                </p>
            </div>

            {/* ── Price ── */}
            <div className="relative z-[5] px-5 pb-4">
                {price === 0 ? (
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold" style={{ color: mat.textHighlight }}>
                            Gratis
                        </span>
                    </div>
                ) : (
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold" style={{ color: mat.textHighlight }}>
                            US$ {price}
                        </span>
                        <span className="text-muted-foreground/60 text-sm">/ mes</span>
                    </div>
                )}
            </div>

            {/* ── Divider ── */}
            <div
                className="mx-5 h-px"
                style={{
                    background: `linear-gradient(90deg, transparent, ${mat.borderColor}, transparent)`,
                }}
            />

            {/* ── Feature list ── */}
            <div className="relative z-[5] flex-1 px-5 py-4">
                <ul className="space-y-2.5 text-sm">
                    {features.map((feature) => {
                        const FeatureIcon = feature.icon;
                        return (
                            <li key={feature.label} className="flex items-center gap-2.5">
                                <FeatureIcon className="h-3.5 w-3.5 shrink-0" style={{ color: mat.textHighlight, opacity: 0.5 }} />
                                <span>
                                    <span className="text-muted-foreground/70">{feature.label}:</span>{" "}
                                    <span className="font-medium text-foreground/90">{feature.value}</span>
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
                            className="w-full border-0"
                            variant="outline"
                            style={{
                                background: isPopular
                                    ? `linear-gradient(135deg, ${mat.textHighlight}20, ${mat.textHighlight}30)`
                                    : "rgba(255,255,255,0.06)",
                                color: isPopular ? mat.textHighlight : "rgba(255,255,255,0.7)",
                                borderColor: isPopular ? `${mat.textHighlight}40` : "transparent",
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
