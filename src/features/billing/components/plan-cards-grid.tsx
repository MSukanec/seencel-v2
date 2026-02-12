"use client";

import { useState } from "react";
import { Plan } from "@/actions/plans";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Building2, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
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

                    if (isCurrentPlan || (isFree && isLoggedIn)) {
                        ctaDisabled = true;
                        ctaDisabledLabel = "Plan Actual";
                    } else if (isLoggedIn && thisTier < currentTier) {
                        ctaDisabled = true;
                        ctaDisabledLabel = "Incluido en tu plan";
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

            {/* Enterprise Card — Full width, corporate dark aesthetic */}
            {enterprisePlan && (
                <Card
                    className="mt-8 bg-zinc-900 dark:bg-zinc-950 border-zinc-700/50 dark:border-zinc-800"
                >
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-lg bg-zinc-800 dark:bg-zinc-900 border border-zinc-600/30">
                                    <Building2 className="h-5 w-5 text-zinc-300" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg text-zinc-100">Empresa</CardTitle>
                                    <CardDescription className="text-sm text-zinc-400">
                                        Para organizaciones con necesidades avanzadas de personalización, seguridad e integraciones.
                                    </CardDescription>
                                </div>
                            </div>
                            <Link href="/contact">
                                <Button
                                    variant="outline"
                                    className="border-zinc-600 text-zinc-200 hover:bg-zinc-800 hover:text-white gap-2"
                                >
                                    Contactar Ventas
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-x-8 gap-y-1 text-sm text-zinc-400">
                            <span>✓ Proyectos ilimitados</span>
                            <span>✓ Asesores externos ilimitados</span>
                            <span>✓ Herramientas a medida</span>
                            <span>✓ Soporte dedicado</span>
                            <span>✓ Onboarding asistido</span>
                            <span>✓ API y Webhooks</span>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
