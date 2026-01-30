"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getPlanDisplayName } from "@/lib/plan-utils";
import { Plan } from "@/actions/plans";
import {
    CreditCard,
    Building2,
    Landmark,
    Shield,
    CheckCircle2,
    Sparkles,
    ArrowLeft,
    Lock,
    Zap,
    Crown,
    Users,
    Wrench,
    Clock,
} from "lucide-react";

// Types for plan status (same as plans-comparison.tsx)
export type PlanFlagStatus = 'active' | 'maintenance' | 'hidden' | 'founders' | 'coming_soon';

export interface PlanPurchaseFlags {
    pro: PlanFlagStatus;
    teams: PlanFlagStatus;
}

interface CheckoutContentProps {
    plans: Plan[];
    initialPlanSlug?: string;
    initialCycle?: "monthly" | "annual";
    /**
     * Feature flags status for each plan
     */
    purchaseFlags?: PlanPurchaseFlags;
    /**
     * Admin can bypass disabled plans
     */
    isAdmin?: boolean;
}

const planIcons: Record<string, React.ElementType> = {
    pro: Zap,
    teams: Users,
    free: Crown,
};

const paymentMethods = [
    {
        id: "card",
        icon: CreditCard,
        gradient: "from-blue-500 to-purple-600",
    },
    {
        id: "mercadopago",
        icon: Building2,
        gradient: "from-sky-400 to-blue-500",
    },
    {
        id: "transfer",
        icon: Landmark,
        gradient: "from-emerald-500 to-teal-600",
    },
];

export function CheckoutContent({
    plans,
    initialPlanSlug,
    initialCycle = "annual",
    purchaseFlags = { pro: 'active', teams: 'active' },
    isAdmin = false
}: CheckoutContentProps) {
    const t = useTranslations("Founders.checkout");

    // Get the status of a plan from feature flags
    const getPlanStatus = (planSlug: string): PlanFlagStatus => {
        const lower = planSlug.toLowerCase();
        if (lower.includes("pro")) return purchaseFlags.pro;
        if (lower.includes("team")) return purchaseFlags.teams;
        return 'active';
    };

    // Check if user can select the plan
    const canSelectPlan = (planSlug: string): boolean => {
        if (isAdmin) return true; // Admin bypass
        const status = getPlanStatus(planSlug);
        return status === 'active' || status === 'founders';
    };

    // Filter to only purchasable plans (exclude free)
    const purchasablePlans = plans.filter(p =>
        p.slug !== "free" && p.monthly_amount && p.monthly_amount > 0
    );

    // Find initial plan or default to first purchasable that's selectable
    const findInitialPlan = () => {
        // First try user's requested plan if selectable
        const requested = purchasablePlans.find(p => p.slug === initialPlanSlug);
        if (requested && canSelectPlan(requested.slug || '')) return requested;

        // Then find first selectable plan
        const firstSelectable = purchasablePlans.find(p => canSelectPlan(p.slug || ''));
        if (firstSelectable) return firstSelectable;

        // Fallback to first (even if disabled) for admins
        return purchasablePlans[0];
    };

    const initialPlan = findInitialPlan();

    const [selectedPlanId, setSelectedPlanId] = useState(initialPlan?.id || "");
    const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(initialCycle);
    const [paymentMethod, setPaymentMethod] = useState("card");

    const currentPlan = purchasablePlans.find((p) => p.id === selectedPlanId);

    // Calculate prices from real data
    const monthlyPrice = currentPlan?.monthly_amount || 0;
    const annualPrice = currentPlan?.annual_amount || 0;
    const price = billingCycle === "annual" ? annualPrice : monthlyPrice;
    const isAnnual = billingCycle === "annual";

    // Calculate savings percentage
    const monthlyCostIfAnnual = monthlyPrice * 12;
    const savingsPercent = monthlyCostIfAnnual > 0
        ? Math.round((1 - annualPrice / monthlyCostIfAnnual) * 100)
        : 0;

    if (!currentPlan) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">No hay planes disponibles</p>
            </div>
        );
    }

    const PlanIcon = planIcons[currentPlan.slug || ""] || Crown;

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
            {/* Header */}
            <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/organization/billing/founders">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold">{t("title")}</h1>
                            <p className="text-sm text-muted-foreground">
                                {t("secure")}
                            </p>
                        </div>
                        <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                            <Lock className="h-4 w-4" />
                            <span>SSL Secured</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Left Column - Plan & Payment Selection */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Plan Selection */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Crown className="h-5 w-5 text-primary" />
                                    {t("selectPlan")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <RadioGroup
                                    value={selectedPlanId}
                                    onValueChange={setSelectedPlanId}
                                    className="grid md:grid-cols-2 gap-4"
                                >
                                    {purchasablePlans.map((plan) => {
                                        const Icon = planIcons[plan.slug || ""] || Crown;
                                        const isSelected = selectedPlanId === plan.id;
                                        const displayPrice = billingCycle === "annual"
                                            ? plan.annual_amount
                                            : plan.monthly_amount;

                                        // Feature flag status
                                        const planStatus = getPlanStatus(plan.slug || '');
                                        const isDisabled = !canSelectPlan(plan.slug || '');

                                        // Status config for disabled states
                                        const statusConfig: Record<string, { icon: typeof Wrench; label: string; bgColor: string; textColor: string }> = {
                                            maintenance: { icon: Wrench, label: "En Mantenimiento", bgColor: "bg-orange-500/10", textColor: "text-orange-500" },
                                            coming_soon: { icon: Clock, label: "Próximamente", bgColor: "bg-blue-500/10", textColor: "text-blue-500" },
                                            hidden: { icon: Lock, label: "No Disponible", bgColor: "bg-muted", textColor: "text-muted-foreground" },
                                        };
                                        const statusInfo = planStatus !== 'active' && planStatus !== 'founders'
                                            ? statusConfig[planStatus]
                                            : null;

                                        return (
                                            <Label
                                                key={plan.id}
                                                htmlFor={isDisabled ? undefined : plan.id}
                                                className={cn(
                                                    "relative flex flex-col p-6 rounded-xl border-2 transition-all",
                                                    isDisabled
                                                        ? "cursor-not-allowed opacity-60 border-border bg-muted/30"
                                                        : "cursor-pointer",
                                                    !isDisabled && isSelected
                                                        ? "border-primary bg-primary/5"
                                                        : !isDisabled && "border-border hover:border-primary/50"
                                                )}
                                                onClick={isDisabled ? (e) => e.preventDefault() : undefined}
                                            >
                                                {/* Radio button - hidden if disabled */}
                                                {!isDisabled && (
                                                    <RadioGroupItem
                                                        value={plan.id}
                                                        id={plan.id}
                                                        className="absolute top-4 right-4"
                                                    />
                                                )}

                                                {/* Status badge for disabled plans */}
                                                {statusInfo && (
                                                    <div className={cn(
                                                        "absolute top-4 right-4 px-2 py-1 rounded-md flex items-center gap-1.5",
                                                        statusInfo.bgColor
                                                    )}>
                                                        <statusInfo.icon className={cn("h-3 w-3", statusInfo.textColor)} />
                                                        <span className={cn("text-xs font-medium", statusInfo.textColor)}>
                                                            {statusInfo.label}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Popular badge - only show if plan is active */}
                                                {plan.slug === "teams" && !statusInfo && (
                                                    <span className="absolute -top-3 left-4 px-2 py-0.5 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                                                        Popular
                                                    </span>
                                                )}
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-xl flex items-center justify-center",
                                                        isDisabled ? "bg-muted" : "bg-primary/10"
                                                    )}>
                                                        <Icon className={cn("h-6 w-6", isDisabled ? "text-muted-foreground" : "text-primary")} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg">{getPlanDisplayName(plan.name)}</h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            {plan.billing_type === "per_user" ? "Por usuario" : "Fijo"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-2xl font-bold">
                                                    ${displayPrice?.toLocaleString()}
                                                    <span className="text-sm font-normal text-muted-foreground">
                                                        {billingCycle === "annual" ? t("perYear") : t("perMonth")}
                                                    </span>
                                                </div>
                                            </Label>
                                        );
                                    })}
                                </RadioGroup>
                            </CardContent>
                        </Card>

                        {/* Billing Cycle */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("billingCycle")}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <RadioGroup
                                    value={billingCycle}
                                    onValueChange={(v) => setBillingCycle(v as "monthly" | "annual")}
                                    className="grid md:grid-cols-2 gap-4"
                                >
                                    <Label
                                        htmlFor="monthly"
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all",
                                            billingCycle === "monthly"
                                                ? "border-primary bg-primary/5"
                                                : "border-border hover:border-primary/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <RadioGroupItem value="monthly" id="monthly" />
                                            <span className="font-medium">{t("monthly")}</span>
                                        </div>
                                        <span className="font-bold">${monthlyPrice.toLocaleString()}/mo</span>
                                    </Label>

                                    <Label
                                        htmlFor="annual"
                                        className={cn(
                                            "relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all",
                                            billingCycle === "annual"
                                                ? "border-primary bg-primary/5"
                                                : "border-border hover:border-primary/50"
                                        )}
                                    >
                                        {savingsPercent > 0 && (
                                            <span className="absolute -top-3 right-4 px-2 py-0.5 text-xs font-semibold bg-chart-2 text-white rounded-full">
                                                {t("annualDiscount").replace("20", savingsPercent.toString())}
                                            </span>
                                        )}
                                        <div className="flex items-center gap-3">
                                            <RadioGroupItem value="annual" id="annual" />
                                            <div>
                                                <span className="font-medium">{t("annual")}</span>
                                                {billingCycle === "annual" && (
                                                    <div className="flex items-center gap-1 text-xs text-primary mt-1">
                                                        <Sparkles className="h-3 w-3" />
                                                        {t("founderBadge")}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <span className="font-bold">${annualPrice.toLocaleString()}/yr</span>
                                    </Label>
                                </RadioGroup>
                            </CardContent>
                        </Card>

                        {/* Payment Method */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("paymentMethod")}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <RadioGroup
                                    value={paymentMethod}
                                    onValueChange={setPaymentMethod}
                                    className="grid md:grid-cols-3 gap-4"
                                >
                                    {paymentMethods.map((method) => {
                                        const Icon = method.icon;
                                        const isSelected = paymentMethod === method.id;
                                        return (
                                            <Label
                                                key={method.id}
                                                htmlFor={`payment-${method.id}`}
                                                className={cn(
                                                    "flex flex-col items-center p-6 rounded-xl border-2 cursor-pointer transition-all",
                                                    isSelected
                                                        ? "border-primary bg-primary/5"
                                                        : "border-border hover:border-primary/50"
                                                )}
                                            >
                                                <RadioGroupItem
                                                    value={method.id}
                                                    id={`payment-${method.id}`}
                                                    className="sr-only"
                                                />
                                                <div className={cn(
                                                    "w-16 h-16 rounded-2xl flex items-center justify-center mb-3 bg-gradient-to-br",
                                                    method.gradient
                                                )}>
                                                    <Icon className="h-8 w-8 text-white" />
                                                </div>
                                                <span className="font-medium text-center">
                                                    {t(`paymentMethods.${method.id}`)}
                                                </span>
                                            </Label>
                                        );
                                    })}
                                </RadioGroup>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <Card className="border-2">
                                <CardHeader className="bg-muted/50">
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-primary" />
                                        {t("orderSummary")}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    {/* Selected Plan */}
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                            <PlanIcon className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold">{getPlanDisplayName(currentPlan.name)}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {isAnnual ? "Facturación anual" : "Facturación mensual"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Founder Badge */}
                                    {isAnnual && (
                                        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20 mb-6">
                                            <Sparkles className="h-5 w-5 text-primary" />
                                            <span className="text-sm font-medium text-primary">
                                                {t("founderBadge")}
                                            </span>
                                        </div>
                                    )}

                                    <Separator className="my-4" />

                                    {/* Pricing */}
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">{t("subtotal")}</span>
                                            <span>${price.toLocaleString()}</span>
                                        </div>
                                        {isAnnual && savingsPercent > 0 && (
                                            <div className="flex justify-between text-chart-2">
                                                <span>Ahorro ({savingsPercent}%)</span>
                                                <span>-${(monthlyCostIfAnnual - annualPrice).toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>

                                    <Separator className="my-4" />

                                    <div className="flex justify-between text-lg font-bold">
                                        <span>{t("total")}</span>
                                        <span>${price.toLocaleString()} USD</span>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex-col gap-4">
                                    <Button
                                        size="lg"
                                        className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg"
                                    >
                                        <Lock className="mr-2 h-5 w-5" />
                                        {t("complete")}
                                    </Button>

                                    <p className="text-xs text-center text-muted-foreground">
                                        {t("terms")}
                                    </p>

                                    <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Shield className="h-3 w-3" />
                                            {t("secure")}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3" />
                                            {t("guarantee")}
                                        </div>
                                    </div>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

