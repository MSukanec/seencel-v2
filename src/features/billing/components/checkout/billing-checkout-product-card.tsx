"use client";

// ============================================================
// BILLING CHECKOUT PRODUCT CARD
// ============================================================
// Componente unificado que muestra el producto en checkout:
// - Course: Muestra info del curso
// - Plan: Selector de plan + billing cycle
// - Seats: Muestra info de asientos adicionales
// - Upgrade: Muestra info del upgrade prorrateado
// ============================================================

import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    Crown,
    Zap,
    Users,
    GraduationCap,
    BookOpen,
    Video,
    Clock,
    ArrowRight,
    CalendarDays,
    Sparkles,
    Lock,
    Wrench,
} from "lucide-react";
import type {
    CheckoutPlan,
    CheckoutCourse,
    CheckoutSeats,
    CheckoutUpgrade,
    BillingCycle,
    ProductType,
    PlanFlagStatus,
} from "@/features/billing/types/checkout";

// ============================================================
// CONSTANTS
// ============================================================

const planIcons: Record<string, React.ElementType> = {
    pro: Zap,
    teams: Users,
    free: Crown,
};

const planColors: Record<string, {
    bg: string;
    border: string;
    text: string;
    solid: string;
    accent: string;
}> = {
    pro: {
        bg: "bg-[oklch(0.55_0.22_260/0.1)]",
        border: "border-[oklch(0.55_0.22_260)]",
        text: "text-[oklch(0.55_0.22_260)]",
        solid: "bg-[oklch(0.55_0.22_260)]",
        accent: "[&_[data-slot=radio-indicator]]:bg-[oklch(0.55_0.22_260)] [&_[data-slot=radio-indicator]]:border-[oklch(0.55_0.22_260)]"
    },
    teams: {
        bg: "bg-[oklch(0.55_0.25_300/0.1)]",
        border: "border-[oklch(0.55_0.25_300)]",
        text: "text-[oklch(0.55_0.25_300)]",
        solid: "bg-[oklch(0.55_0.25_300)]",
        accent: "[&_[data-slot=radio-indicator]]:bg-[oklch(0.55_0.25_300)] [&_[data-slot=radio-indicator]]:border-[oklch(0.55_0.25_300)]"
    },
};

// ============================================================
// PROPS
// ============================================================

interface BillingCheckoutProductCardProps {
    productType: ProductType;
    // Plan props
    plans?: CheckoutPlan[];
    selectedPlanId?: string;
    onSelectPlan?: (planId: string) => void;
    billingCycle?: BillingCycle;
    onBillingCycleChange?: (cycle: BillingCycle) => void;
    purchaseFlags?: { pro: PlanFlagStatus; teams: PlanFlagStatus };
    isAdmin?: boolean;
    formatPrice?: (amount: number) => string;
    // Course props  
    course?: CheckoutCourse | null;
    // Seats props
    seatsData?: CheckoutSeats | null;
    seatsQuantity?: number;
    onSeatsQuantityChange?: (quantity: number) => void;
    // Upgrade props
    upgradeData?: CheckoutUpgrade | null;
}

// ============================================================
// COMPONENT
// ============================================================

export function BillingCheckoutProductCard({
    productType,
    plans = [],
    selectedPlanId = "",
    onSelectPlan,
    billingCycle = "annual",
    onBillingCycleChange,
    purchaseFlags = { pro: 'active', teams: 'active' },
    isAdmin = false,
    formatPrice = (a) => `USD $${a}`,
    course,
    seatsData,
    seatsQuantity = 1,
    onSeatsQuantityChange,
    upgradeData,
}: BillingCheckoutProductCardProps) {
    const t = useTranslations("Founders.checkout");
    const isAnnual = billingCycle === "annual";

    // Helper to check if plan can be selected
    const getPlanStatus = (planSlug: string): PlanFlagStatus => {
        const lower = planSlug.toLowerCase();
        if (lower.includes("pro")) return purchaseFlags.pro;
        if (lower.includes("team")) return purchaseFlags.teams;
        return 'active';
    };

    const canSelectPlan = (planSlug: string): boolean => {
        if (isAdmin) return true;
        const status = getPlanStatus(planSlug);
        return status === 'active' || status === 'founders';
    };

    // Filter purchasable plans
    const purchasablePlans = plans.filter(p =>
        p.slug !== "free" &&
        typeof p.monthly_amount === 'number' &&
        p.monthly_amount > 0
    );

    // Calculate total lessons for course
    const totalLessons = course?.modules?.reduce(
        (acc, mod) => acc + (mod.lessons?.length || 0), 0
    ) || 0;

    // ============================================================
    // COURSE VIEW
    // ============================================================
    if (productType === "course" && course) {
        return (
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        Tu Curso
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        {/* Course Image */}
                        {course.heroImage && (
                            <div className="w-full sm:w-48 h-40 sm:h-28 rounded-xl overflow-hidden flex-shrink-0">
                                <img
                                    src={course.heroImage}
                                    alt={course.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg sm:text-xl font-bold mb-2">{course.title}</h3>
                            {course.subtitle && (
                                <p className="text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2">
                                    {course.subtitle}
                                </p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <BookOpen className="h-4 w-4" />
                                    <span>{course.modules?.length || 0} módulos</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Video className="h-4 w-4" />
                                    <span>{totalLessons} lecciones</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    <span>Acceso 1 año</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Founders Plan Promotion Banner */}
                    {course.isFoundersIncluded && (
                        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-amber-500/20">
                                    <Crown className="h-5 w-5 text-amber-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-amber-600 dark:text-amber-400 mb-1">
                                        🎉 ¡Este curso está incluido GRATIS en el Plan Fundadores!
                                    </p>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Accedé a este curso y muchos más beneficios con el Plan Fundadores por tiempo limitado.
                                    </p>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Link
                                            href="/founders"
                                            className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline"
                                        >
                                            Conocer más sobre el Plan
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                        <span className="text-muted-foreground">|</span>
                                        <Link
                                            href="/checkout?product=plan-pro&cycle=annual"
                                            className="inline-flex items-center gap-2 text-sm font-medium bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 transition-colors"
                                        >
                                            Obtener Plan Fundadores
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    // ============================================================
    // SEATS VIEW
    // ============================================================
    if (productType === "seats" && seatsData) {
        return (
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Users className="h-5 w-5 text-primary" />
                        Asientos Adicionales
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 rounded-xl bg-muted/50">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="font-medium">Precio prorrateado por asiento</p>
                                <p className="text-sm text-muted-foreground">
                                    {seatsData.daysRemaining} días restantes hasta renovación
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-primary">
                                    ${seatsData.proratedPricePerSeat.toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    (Base: ${seatsData.basePricePerSeat}/seat/año)
                                </p>
                            </div>
                        </div>

                        {/* Quantity selector */}
                        <div className="flex items-center gap-4">
                            <Label className="font-medium">Cantidad:</Label>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onSeatsQuantityChange?.(Math.max(1, seatsQuantity - 1))}
                                    className="h-8 w-8 rounded-md border flex items-center justify-center hover:bg-accent"
                                    disabled={seatsQuantity <= 1}
                                >
                                    -
                                </button>
                                <span className="w-12 text-center font-bold text-lg">{seatsQuantity}</span>
                                <button
                                    onClick={() => onSeatsQuantityChange?.(seatsQuantity + 1)}
                                    className="h-8 w-8 rounded-md border flex items-center justify-center hover:bg-accent"
                                >
                                    +
                                </button>
                            </div>
                            <span className="text-sm text-muted-foreground">
                                Total: ${(seatsData.proratedPricePerSeat * seatsQuantity).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                        <p>Los asientos adicionales se facturarán prorrateados hasta la próxima renovación:</p>
                        <p className="font-medium text-foreground">
                            {new Date(seatsData.expiresAt).toLocaleDateString()}
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // ============================================================
    // UPGRADE VIEW
    // ============================================================
    if (productType === "upgrade" && upgradeData) {
        const colors = planColors.teams;

        return (
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <ArrowRight className="h-5 w-5 text-primary" />
                        Mejorar Plan
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Current → Target */}
                    <div className="flex items-center gap-3">
                        {/* Current Plan */}
                        <div className="flex-1 p-4 rounded-xl bg-muted/50 border border-border">
                            <div className="flex items-center gap-2 mb-1">
                                <Zap className="h-4 w-4 text-[oklch(0.55_0.22_260)]" />
                                <span className="font-medium text-muted-foreground">
                                    {upgradeData.currentPlanName}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Plan actual
                            </p>
                        </div>

                        <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />

                        {/* Target Plan */}
                        <div className={cn(
                            "flex-1 p-4 rounded-xl border-2",
                            colors.bg, colors.border
                        )}>
                            <div className="flex items-center gap-2 mb-1">
                                <Users className={cn("h-4 w-4", colors.text)} />
                                <span className={cn("font-bold", colors.text)}>
                                    {upgradeData.targetPlanName}
                                </span>
                            </div>
                            <p className="text-lg font-bold">
                                {formatPrice(upgradeData.targetPrice)}
                                <span className="text-sm font-normal text-muted-foreground">
                                    /{upgradeData.billingPeriod === "annual" ? "año" : "mes"}
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Proration Breakdown */}
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                        <h4 className="font-medium text-sm">Detalle del prorrateo</h4>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Plan {upgradeData.targetPlanName} ({upgradeData.billingPeriod === "annual" ? "anual" : "mensual"})
                                </span>
                                <span>{formatPrice(upgradeData.targetPrice)}</span>
                            </div>

                            <div className="flex justify-between text-green-600 dark:text-green-400">
                                <span>
                                    Crédito por {upgradeData.daysRemaining} días restantes de {upgradeData.currentPlanName}
                                </span>
                                <span>-{formatPrice(upgradeData.credit)}</span>
                            </div>

                            <div className="border-t pt-2 flex justify-between font-bold text-base">
                                <span>Total a pagar</span>
                                <span className="text-primary">{formatPrice(upgradeData.upgradePrice)}</span>
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Tu nueva suscripción comenzará inmediatamente y vencerá el{" "}
                            {new Date(upgradeData.expiresAt).toLocaleDateString()}.
                        </p>
                    </div>

                    {/* Billing Period Badge */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                        <span>
                            Ciclo de facturación: <strong>{upgradeData.billingPeriod === "annual" ? "Anual" : "Mensual"}</strong>
                            {" "}(heredado de tu plan actual)
                        </span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // ============================================================
    // PLAN VIEW (default)
    // ============================================================
    return (
        <Card>
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Crown className="h-5 w-5 text-primary" />
                    {t("selectPlan")}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Plan Selection */}
                <RadioGroup
                    value={selectedPlanId}
                    onValueChange={(id) => onSelectPlan?.(id)}
                    className="grid md:grid-cols-2 gap-4"
                >
                    {purchasablePlans.map((plan) => {
                        const Icon = planIcons[plan.slug || ""] || Crown;
                        const isSelected = selectedPlanId === plan.id;
                        const displayPrice = isAnnual ? plan.annual_amount : plan.monthly_amount;
                        const colors = planColors[plan.slug || ""] || planColors.pro;

                        // Feature flag status
                        const planStatus = getPlanStatus(plan.slug || '');
                        const isDisabled = !canSelectPlan(plan.slug || '');

                        // Status config
                        const statusConfig: Record<string, { icon: typeof Wrench; label: string; usePlanColors?: boolean }> = {
                            maintenance: { icon: Wrench, label: "En Mantenimiento" },
                            coming_soon: { icon: Clock, label: "Próximamente", usePlanColors: true },
                            hidden: { icon: Lock, label: "No Disponible" },
                        };
                        const statusInfo = planStatus !== 'active' && planStatus !== 'founders'
                            ? statusConfig[planStatus]
                            : null;

                        const getBadgeColors = () => {
                            if (!statusInfo) return { bg: '', text: '' };
                            if (planStatus === 'maintenance') {
                                return { bg: 'bg-orange-500', text: 'text-white' };
                            }
                            if (planStatus === 'coming_soon') {
                                return { bg: colors.solid, text: 'text-white' };
                            }
                            return { bg: 'bg-muted-foreground', text: 'text-white' };
                        };
                        const badgeColors = getBadgeColors();

                        return (
                            <Label
                                key={plan.id}
                                htmlFor={isDisabled ? undefined : plan.id}
                                className={cn(
                                    "relative flex flex-col p-5 rounded-xl border-2 transition-all",
                                    isDisabled
                                        ? "opacity-50 cursor-not-allowed border-border"
                                        : "cursor-pointer border-border hover:border-primary/50",
                                    isSelected && !isDisabled && `${colors.border} ${colors.bg}`
                                )}
                            >
                                {/* Status Badge */}
                                {statusInfo && (
                                    <span className={cn(
                                        "absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 text-xs font-semibold rounded-full flex items-center gap-1 whitespace-nowrap z-10",
                                        badgeColors.bg, badgeColors.text
                                    )}>
                                        <statusInfo.icon className="h-3 w-3" />
                                        {statusInfo.label}
                                    </span>
                                )}

                                {/* Founders badge */}
                                {planStatus === 'founders' && isAnnual && (
                                    <Badge className="absolute -top-2.5 -right-2 bg-amber-500 text-white text-[10px] px-2">
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        Fundadores
                                    </Badge>
                                )}

                                <RadioGroupItem
                                    value={plan.id}
                                    id={plan.id}
                                    disabled={isDisabled}
                                    className="sr-only"
                                />

                                <div className="flex items-start gap-3">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center",
                                        colors.bg
                                    )}>
                                        <Icon className={cn("h-5 w-5", colors.text)} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={cn("font-bold text-lg", isSelected && colors.text)}>
                                            {plan.name}
                                        </h3>
                                        <p className="text-2xl font-bold mt-1">
                                            {formatPrice(displayPrice || 0)}
                                            <span className="text-sm font-normal text-muted-foreground">
                                                /{isAnnual ? "año" : "mes"}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </Label>
                        );
                    })}
                </RadioGroup>

                {/* Billing Cycle Cards - Use selected plan colors */}
                {(() => {
                    // Get selected plan colors
                    const selectedPlan = purchasablePlans.find(p => p.id === selectedPlanId);
                    const cycleColors = planColors[selectedPlan?.slug || ""] || planColors.pro;

                    return (
                        <div className="grid grid-cols-2 gap-4">
                            {/* Mensual Card */}
                            <button
                                onClick={() => onBillingCycleChange?.("monthly")}
                                className={cn(
                                    "relative flex flex-col items-center p-4 rounded-xl border-2 transition-all",
                                    !isAnnual
                                        ? `${cycleColors.border} ${cycleColors.bg}`
                                        : "border-border hover:border-muted-foreground/50"
                                )}
                            >
                                <CalendarDays className={cn(
                                    "h-5 w-5 mb-2",
                                    !isAnnual ? cycleColors.text : "text-muted-foreground"
                                )} />
                                <span className={cn(
                                    "font-medium",
                                    !isAnnual ? "text-foreground" : "text-muted-foreground"
                                )}>
                                    Mensual
                                </span>
                            </button>

                            {/* Anual Card */}
                            <button
                                onClick={() => onBillingCycleChange?.("annual")}
                                className={cn(
                                    "relative flex flex-col items-center p-4 rounded-xl border-2 transition-all",
                                    isAnnual
                                        ? `${cycleColors.border} ${cycleColors.bg}`
                                        : "border-border hover:border-muted-foreground/50"
                                )}
                            >
                                <Badge className={cn("absolute -top-2.5 right-2 text-white text-[10px]", cycleColors.solid)}>
                                    Ahorrá 20%
                                </Badge>
                                <CalendarDays className={cn(
                                    "h-5 w-5 mb-2",
                                    isAnnual ? cycleColors.text : "text-muted-foreground"
                                )} />
                                <span className={cn(
                                    "font-medium",
                                    isAnnual ? "text-foreground" : "text-muted-foreground"
                                )}>
                                    Anual
                                </span>
                            </button>
                        </div>
                    );
                })()}
            </CardContent>
        </Card>
    );
}
