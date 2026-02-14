"use client";

import React, { useState, useCallback, useRef } from "react";
import { Plan } from "@/actions/plans";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { getPlanConfig } from "@/components/shared/plan-badge";
import { PlanCard, PLAN_STATUS_CONFIG } from "./plan-card";
import type { PlanFlagStatus, PlanPurchaseFlags } from "./plan-card";

// ============================================================
// Plan tier helpers
// ============================================================

export const getPlanTier = (name: string): number => {
    const lower = name.toLowerCase();
    if (lower === 'free' || lower === 'essential') return 0;
    if (lower === 'pro') return 1;
    if (lower === 'teams') return 2;
    if (lower === 'enterprise') return 3;
    return 0;
};

// ============================================================
// PlanCardsGrid component
// ============================================================

interface PlanCardsGridProps {
    plans: Plan[];
    currentPlanId?: string | null;
    organizationId?: string | null;
    isAdmin?: boolean;
    purchaseFlags?: PlanPurchaseFlags;
    isDashboard?: boolean;
    /** Control billing period externally (if provided, toggle is not shown) */
    billingPeriod?: "monthly" | "annual";
    onBillingPeriodChange?: (period: "monthly" | "annual") => void;
    /** Show the monthly/annual toggle (default: true) */
    showToggle?: boolean;
}

export function PlanCardsGrid({
    plans,
    currentPlanId,
    organizationId,
    isAdmin = false,
    purchaseFlags = { pro: 'active', teams: 'active' },
    isDashboard = false,
    billingPeriod: externalBillingPeriod,
    onBillingPeriodChange,
    showToggle = true,
}: PlanCardsGridProps) {
    const [internalBillingPeriod, setInternalBillingPeriod] = useState<"monthly" | "annual">("annual");

    const billingPeriod = externalBillingPeriod ?? internalBillingPeriod;
    const setBillingPeriod = (period: "monthly" | "annual") => {
        if (onBillingPeriodChange) {
            onBillingPeriodChange(period);
        } else {
            setInternalBillingPeriod(period);
        }
    };

    // Determine plan status from feature flags
    const getPlanStatus = (planName: string): PlanFlagStatus => {
        const lower = planName.toLowerCase();
        if (lower.includes("free") || lower.includes("essential")) return 'active';
        if (lower.includes("pro")) return purchaseFlags.pro;
        if (lower.includes("team")) return purchaseFlags.teams;
        return 'active';
    };

    // Check if user can click plan CTA
    const canInteract = (planName: string): boolean => {
        if (isAdmin) return true;
        const status = getPlanStatus(planName);
        return status === 'active' || status === 'founders';
    };

    // Build checkout URL
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

    // CTA label
    const getCtaLabel = (plan: Plan): string => {
        const currentPlan = currentPlanId ? plans.find(p => p.id === currentPlanId) : null;
        const currentSlug = currentPlan?.slug?.toLowerCase() || currentPlan?.name?.toLowerCase() || '';
        const targetSlug = plan.slug?.toLowerCase() || plan.name?.toLowerCase() || '';

        if (currentSlug.includes('pro') && targetSlug.includes('team') && organizationId) {
            return "Mejorar Plan";
        }

        return isDashboard ? "Mejorar Plan" : "Empezar Ahora";
    };

    // Current plan tier
    const currentPlan = currentPlanId ? plans.find(p => p.id === currentPlanId) : null;
    const currentTier = currentPlan ? getPlanTier(currentPlan.name) : 0;
    const isLoggedIn = !!currentPlanId || isDashboard;

    // Separate Enterprise from regular plans
    const regularPlans = plans.filter(p => !p.name.toLowerCase().includes('enterprise'));
    const enterprisePlan = plans.find(p => p.name.toLowerCase().includes('enterprise'));

    return (
        <div>
            {/* Billing Toggle */}
            {showToggle && (
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
            )}

            {/* Plan Cards Grid — Regular plans only */}
            <div className="grid gap-8 md:grid-cols-3">
                {regularPlans.map((plan, index) => {
                    const isCurrentPlan = currentPlanId === plan.id;
                    const isPopular = index === 1;
                    const thisTier = getPlanTier(plan.name);
                    const isFree = thisTier === 0;
                    const status = getPlanStatus(plan.name);

                    // Determine CTA state
                    let ctaDisabled = false;
                    let ctaDisabledLabel: string | undefined;
                    let statusOverride = undefined;

                    if (isCurrentPlan) {
                        ctaDisabled = true;
                        ctaDisabledLabel = "Plan Actual";
                    } else if (isLoggedIn && thisTier < currentTier) {
                        // Any plan below current tier (including free) → "Incluido"
                        ctaDisabled = true;
                        ctaDisabledLabel = "Incluido en tu plan";
                    } else if (isFree && isLoggedIn && currentTier === 0) {
                        // Free plan when user is on free → "Plan Actual"
                        ctaDisabled = true;
                        ctaDisabledLabel = "Plan Actual";
                    } else if (status !== 'active' && !canInteract(plan.name)) {
                        statusOverride = PLAN_STATUS_CONFIG[status];
                    } else if (status !== 'active' && isAdmin) {
                        // Admin can bypass, but show status indicator
                        statusOverride = PLAN_STATUS_CONFIG[status];
                    }

                    return (
                        <PlanCard
                            key={plan.id}
                            plan={plan}
                            billingPeriod={billingPeriod}
                            isCurrentPlan={isCurrentPlan}
                            isPopular={isPopular}
                            ctaLabel={getCtaLabel(plan)}
                            ctaHref={getCheckoutUrl(plan)}
                            ctaDisabled={ctaDisabled}
                            ctaDisabledLabel={ctaDisabledLabel}
                            statusOverride={statusOverride}
                            isAdmin={isAdmin}
                            showDetailsLink={isDashboard}
                        />
                    );
                })}
            </div>

            {/* Enterprise Card — Full width, obsidian material */}
            {enterprisePlan && (
                <EnterpriseCard plan={enterprisePlan} />
            )}
        </div>
    );
}

// ============================================================
// Enterprise Card — Full-width obsidian material with border sheen
// ============================================================

const ENTERPRISE_MAT = {
    surface: "linear-gradient(175deg, #1a1a20, #16161c, #1c1c22)",
    borderColor: "rgba(160,160,210,0.18)",
    lightColor: "rgba(180,170,220,0.12)",
    hoverShape: "ellipse 300px 100px",
    hoverIntensity: 0.7,
    textHighlight: "#a0a0b8",
    sheenDuration: 6,
    sheenColor: "rgba(180,170,220,0.35)",
    sheenColorDim: "rgba(180,170,220,0.12)",
    sheenColorFaint: "rgba(180,170,220,0.06)",
};

const ENTERPRISE_FEATURES = [
    "Proyectos ilimitados",
    "Asesores externos ilimitados",
    "Herramientas a medida",
    "Soporte dedicado",
    "Onboarding asistido",
    "API y Webhooks",
];

function EnterpriseCard({ plan }: { plan: Plan }) {
    const plateRef = useRef<HTMLDivElement>(null);
    const lightRef = useRef<HTMLDivElement>(null);
    const config = getPlanConfig(plan.name);
    const Mark = config.mark;

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!plateRef.current || !lightRef.current) return;
        const rect = plateRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        lightRef.current.style.background = `radial-gradient(${ENTERPRISE_MAT.hoverShape} at ${x}px ${y}px, ${ENTERPRISE_MAT.lightColor}, transparent)`;
        lightRef.current.style.opacity = String(ENTERPRISE_MAT.hoverIntensity);
    }, []);

    const handleMouseLeave = useCallback(() => {
        if (lightRef.current) lightRef.current.style.opacity = "0";
    }, []);

    return (
        <div
            ref={plateRef}
            className="relative mt-8 overflow-hidden rounded-xl"
            style={{
                background: ENTERPRISE_MAT.surface,
                border: `1px solid ${ENTERPRISE_MAT.borderColor}`,
                boxShadow: "0 2px 12px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* ── Border sheens — all 4 edges ── */}
            <div
                className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none z-[3]"
                style={{
                    background: `linear-gradient(90deg, transparent 0%, transparent 10%, ${ENTERPRISE_MAT.sheenColor} 46%, ${ENTERPRISE_MAT.sheenColorDim} 54%, transparent 90%, transparent 100%)`,
                    animation: `plan-reflection ${ENTERPRISE_MAT.sheenDuration}s linear infinite`,
                }}
            />
            <div
                className="absolute bottom-0 left-0 right-0 h-[1px] pointer-events-none z-[3]"
                style={{
                    background: `linear-gradient(90deg, transparent 0%, transparent 10%, ${ENTERPRISE_MAT.sheenColorDim} 46%, ${ENTERPRISE_MAT.sheenColorFaint} 54%, transparent 90%, transparent 100%)`,
                    animation: `plan-reflection ${ENTERPRISE_MAT.sheenDuration * 1.3}s linear infinite`,
                    animationDelay: `${ENTERPRISE_MAT.sheenDuration * 0.5}s`,
                }}
            />
            <div
                className="absolute top-0 bottom-0 left-0 w-[1px] pointer-events-none z-[3]"
                style={{
                    background: `linear-gradient(180deg, transparent 0%, transparent 10%, ${ENTERPRISE_MAT.sheenColorDim} 46%, ${ENTERPRISE_MAT.sheenColorFaint} 54%, transparent 90%, transparent 100%)`,
                    animation: `plan-border-reflection ${ENTERPRISE_MAT.sheenDuration * 1.5}s linear infinite`,
                    animationDelay: `${ENTERPRISE_MAT.sheenDuration * 0.3}s`,
                }}
            />
            <div
                className="absolute top-0 bottom-0 right-0 w-[1px] pointer-events-none z-[3]"
                style={{
                    background: `linear-gradient(180deg, transparent 0%, transparent 10%, ${ENTERPRISE_MAT.sheenColorDim} 46%, ${ENTERPRISE_MAT.sheenColorFaint} 54%, transparent 90%, transparent 100%)`,
                    animation: `plan-border-reflection ${ENTERPRISE_MAT.sheenDuration * 1.5}s linear infinite`,
                    animationDelay: `${ENTERPRISE_MAT.sheenDuration * 0.8}s`,
                }}
            />

            {/* ── Mouse-following light ── */}
            <div
                ref={lightRef}
                className="absolute inset-0 pointer-events-none z-[2] transition-opacity duration-300"
                style={{ opacity: 0 }}
            />

            {/* ── Content ── */}
            <div className="relative z-[5] px-6 py-5 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div
                        className="p-2.5 rounded-lg"
                        style={{
                            background: "linear-gradient(135deg, #232328, #28283a)",
                            border: `1px solid ${ENTERPRISE_MAT.borderColor}`,
                        }}
                    >
                        <Mark color={ENTERPRISE_MAT.textHighlight} />
                    </div>
                    <div>
                        <span className="text-lg font-semibold text-foreground">Empresa</span>
                        <p className="text-sm text-muted-foreground/60">
                            Para organizaciones con necesidades avanzadas de personalización, seguridad e integraciones.
                        </p>
                    </div>
                </div>
                <Link href="/contact" className="relative z-10">
                    <Button
                        variant="outline"
                        className="gap-2 cursor-pointer"
                        style={{
                            borderColor: ENTERPRISE_MAT.borderColor,
                            color: ENTERPRISE_MAT.textHighlight,
                            background: "rgba(255,255,255,0.03)",
                        }}
                    >
                        Contactar Ventas
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
            </div>

            {/* ── Feature chips ── */}
            <div className="relative z-[5] px-6 pb-5">
                <div className="flex flex-wrap gap-x-8 gap-y-1 text-sm" style={{ color: ENTERPRISE_MAT.textHighlight, opacity: 0.7 }}>
                    {ENTERPRISE_FEATURES.map((f) => (
                        <span key={f} className="flex items-center gap-1.5">
                            <Check className="h-3.5 w-3.5" />
                            {f}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
