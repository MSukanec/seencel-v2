"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { CountrySelector } from "@/components/ui/country-selector";
import { cn } from "@/lib/utils";
import { Plan } from "@/actions/plans";
import { Link } from "@/i18n/routing";
import { useModal } from "@/providers/modal-store";
import { BankTransferForm } from "@/features/billing/components/forms/billing-bank-transfer-form";
import { validateCoupon, type CouponValidationSuccess } from "@/features/billing/actions";
import {
    Landmark,
    Shield,
    CheckCircle2,
    Sparkles,
    Lock,
    Zap,
    Crown,
    Users,
    Receipt,
    Tag,
    GraduationCap,
    BookOpen,
    Video,
    Clock,
    CalendarDays,
    X,
    Loader2,
    ArrowRight,
} from "lucide-react";

// Coupon error messages (client-side utility)
const COUPON_ERROR_MESSAGES: Record<string, string> = {
    UNAUTHENTICATED: "Debés iniciar sesión para usar cupones",
    INVALID_PRODUCT_TYPE: "Tipo de producto no válido",
    COUPON_NOT_FOUND: "El cupón no existe o no está activo",
    MINIMUM_NOT_MET: "El monto de compra no alcanza el mínimo requerido",
    PRODUCT_NOT_ELIGIBLE: "Este cupón no aplica a este producto",
    USER_LIMIT_REACHED: "Ya usaste este cupón el máximo de veces permitido",
    GLOBAL_LIMIT_REACHED: "Este cupón ya alcanzó su límite de usos",
    CURRENCY_MISMATCH: "Este cupón solo aplica a otra moneda",
    DATABASE_ERROR: "Error al validar el cupón. Intenta de nuevo"
};
const getCouponErrorMessage = (reason: string) => COUPON_ERROR_MESSAGES[reason] || "Cupón no válido";


interface Country {
    id: string;
    name: string;
    alpha_2: string | null;
}

interface CourseCheckout {
    id?: string;
    title: string;
    slug: string;
    subtitle?: string;
    price: number;
    heroImage?: string;
    modules?: { lessons: unknown[] }[];
    isFoundersIncluded?: boolean;
}

interface CheckoutViewProps {
    productType: "plan" | "course";
    plans: Plan[];
    course?: {
        id?: string;
        title: string;
        slug: string;
        subtitle?: string;
        price: number;
        heroImage?: string;
        modules?: { lessons?: unknown[] }[];
        isFoundersIncluded?: boolean;
    } | null;
    initialPlanSlug?: string;
    initialCycle?: "monthly" | "annual";
    countries?: Country[];
    organizationId?: string;
    exchangeRate?: number;
    userCountryCode?: string | null; // User's country alpha_2 code (e.g., 'AR')
}

const planIcons: Record<string, React.ElementType> = {
    pro: Zap,
    teams: Users,
    free: Crown,
};

// Plan colors from CSS variables - extended with solid background for badges
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

// Payment methods: Transfer, MercadoPago, PayPal
const paymentMethods = [
    {
        id: "transfer",
        label: "Transferencia Bancaria",
        description: "Solo Argentina · Pesos ARS",
        icon: Landmark,
        logo: null,
        bgClass: "bg-zinc-200 dark:bg-zinc-700",
    },
    {
        id: "mercadopago",
        label: "MercadoPago",
        description: "Solo Argentina · Pesos ARS",
        icon: null,
        logo: "/logos/mp_logo.png",
        bgClass: "bg-white",
    },
    {
        id: "paypal",
        label: "PayPal",
        description: "Internacional · Dólares USD",
        icon: null,
        logo: "/logos/paypal_logo.png",
        bgClass: "bg-white",
    },
];

export function CheckoutView({
    productType,
    plans,
    course,
    initialPlanSlug,
    initialCycle = "annual",
    countries = [],
    organizationId,
    exchangeRate = 1,
    userCountryCode = null
}: CheckoutViewProps) {
    const t = useTranslations("Founders.checkout");
    const isCourse = productType === "course";

    // Country-based payment logic
    const isArgentina = userCountryCode === "AR";

    // Filter to only purchasable plans (exclude free)
    const purchasablePlans = plans.filter(p =>
        p.slug !== "free" && p.monthly_amount && p.monthly_amount > 0
    );

    // Find initial plan or default to first purchasable
    const initialPlan = purchasablePlans.find(p => p.slug === initialPlanSlug) || purchasablePlans[0];

    // Core state - default payment method based on country and product type
    // Transfer only available for courses, not for subscription plans
    const [selectedPlanId, setSelectedPlanId] = useState(initialPlan?.id || "");
    const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(initialCycle);
    const [paymentMethod, setPaymentMethod] = useState(
        isArgentina ? (isCourse ? "transfer" : "mercadopago") : "paypal"
    );

    // Payment methods ordered by country
    // Transfer is only available for courses (one-time payments), not subscriptions
    const availablePaymentMethods = isCourse
        ? paymentMethods
        : paymentMethods.filter(m => m.id !== "transfer");

    const orderedPaymentMethods = isArgentina
        ? availablePaymentMethods
        : [...availablePaymentMethods].reverse();

    // Invoice/Billing state
    const [needsInvoice, setNeedsInvoice] = useState(false);
    const [isCompany, setIsCompany] = useState(false);
    const [billingName, setBillingName] = useState("");
    const [taxId, setTaxId] = useState("");
    const [address, setAddress] = useState("");
    const [countryId, setCountryId] = useState("");
    const [city, setCity] = useState("");
    const [postcode, setPostcode] = useState("");

    // Coupon state
    const [showCoupon, setShowCoupon] = useState(false);
    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState<{
        code: string;
        type: "percent" | "fixed";
        amount: number;        // Percent or fixed amount
        discount: number;      // USD discount amount
        finalPrice: number;    // USD final price after discount
    } | null>(null);
    const [couponError, setCouponError] = useState<string | null>(null);
    const [couponLoading, setCouponLoading] = useState(false);

    // Terms state
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [acceptedCommunications, setAcceptedCommunications] = useState(false);

    // Modal hook
    const { openModal, closeModal } = useModal();

    // Determine current product and pricing
    const currentPlan = purchasablePlans.find((p) => p.id === selectedPlanId);
    const currentPlanSlug = currentPlan?.slug || "pro";
    const currentPlanColors = planColors[currentPlanSlug] || planColors.pro;

    // Course pricing (one-time payment)
    const coursePrice = course?.price || 0;
    const totalLessons = course?.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;

    // Plan pricing
    const monthlyPrice = currentPlan?.monthly_amount || 0;
    const annualPrice = currentPlan?.annual_amount || 0;
    const planPrice = billingCycle === "annual" ? annualPrice : monthlyPrice;
    const isAnnual = billingCycle === "annual";

    // Calculate savings percentage for plans
    const monthlyCostIfAnnual = monthlyPrice * 12;
    const savingsPercent = monthlyCostIfAnnual > 0
        ? Math.round((1 - annualPrice / monthlyCostIfAnnual) * 100)
        : 0;
    const savingsAmount = monthlyCostIfAnnual - annualPrice;

    // Base price in USD (before coupon)
    const basePrice = isCourse ? coursePrice : planPrice;

    // Final price includes coupon discount (in USD)
    const finalPrice = appliedCoupon ? appliedCoupon.finalPrice : basePrice;
    const productName = isCourse ? course?.title : currentPlan?.name;

    const canProceed = acceptedTerms && (isCourse ? course : currentPlan);

    // Handle coupon validation
    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;

        setCouponLoading(true);
        setCouponError(null);

        const result = await validateCoupon({
            code: couponCode.trim(),
            productType: isCourse ? "course" : "subscription",
            productId: isCourse ? (course?.id || "") : (currentPlan?.id || ""),
            price: basePrice, // Always validate with USD base price
            currency: "USD"    // Always validate in USD
        });

        setCouponLoading(false);

        if (!result.ok) {
            setCouponError(getCouponErrorMessage(result.reason));
            setAppliedCoupon(null);
            return;
        }

        // Success - store the applied coupon
        setAppliedCoupon({
            code: result.couponCode,
            type: result.type,
            amount: result.amount,
            discount: result.discount,
            finalPrice: result.finalPrice
        });
        setCouponError(null);
    };

    // Handle coupon removal
    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode("");
        setCouponError(null);
        setShowCoupon(false);
    };

    // Dynamic currency based on payment method
    const isArsPayment = paymentMethod === "transfer" || paymentMethod === "mercadopago";

    // Format price based on selected payment method currency
    const formatPrice = (amountUsd: number, forceUsd = false) => {
        if (forceUsd || !isArsPayment) {
            return `USD $${amountUsd.toLocaleString()}`;
        }
        const amountArs = Math.round(amountUsd * exchangeRate);
        return `ARS $${amountArs.toLocaleString("es-AR")}`;
    };

    // No product available
    if (!isCourse && !currentPlan) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">No hay productos disponibles</p>
            </div>
        );
    }

    if (isCourse && !course) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">Curso no encontrado</p>
            </div>
        );
    }

    const PlanIcon = currentPlan ? (planIcons[currentPlan.slug || ""] || Crown) : Crown;

    return (
        <>
            <div className="py-4 sm:py-8">
                <div className="grid lg:grid-cols-3 gap-4 sm:gap-8 max-w-6xl mx-auto">
                    {/* Left Column - Product & Payment Selection */}
                    <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                        {/* COURSE: Product Info (no selection needed) */}
                        {isCourse && course && (
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
                                                        <a
                                                            href="/founders"
                                                            className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline"
                                                        >
                                                            Conocer más sobre el Plan
                                                            <ArrowRight className="h-4 w-4" />
                                                        </a>
                                                        <span className="text-muted-foreground">|</span>
                                                        <a
                                                            href="/checkout?product=plan-pro&cycle=annual"
                                                            className="inline-flex items-center gap-2 text-sm font-medium bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 transition-colors"
                                                        >
                                                            Obtener Plan Fundadores
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* PLAN: Plan Selection + Billing Cycle (merged into one card) */}
                        {!isCourse && (
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
                                        onValueChange={setSelectedPlanId}
                                        className="grid md:grid-cols-2 gap-4"
                                    >
                                        {purchasablePlans.map((plan) => {
                                            const Icon = planIcons[plan.slug || ""] || Crown;
                                            const isSelected = selectedPlanId === plan.id;
                                            const displayPrice = billingCycle === "annual"
                                                ? plan.annual_amount
                                                : plan.monthly_amount;
                                            const colors = planColors[plan.slug || ""] || planColors.pro;

                                            return (
                                                <Label
                                                    key={plan.id}
                                                    htmlFor={plan.id}
                                                    className={cn(
                                                        "relative flex flex-col p-5 rounded-xl border-2 cursor-pointer transition-all",
                                                        isSelected
                                                            ? `${colors.border} ${colors.bg}`
                                                            : "border-border hover:border-muted-foreground/50"
                                                    )}
                                                >
                                                    <RadioGroupItem
                                                        value={plan.id}
                                                        id={plan.id}
                                                        className="sr-only"
                                                    />
                                                    {plan.slug === "teams" && (
                                                        <span className={cn(
                                                            "absolute -top-3 left-4 px-2 py-0.5 text-xs font-semibold rounded-full text-white",
                                                            colors.solid
                                                        )}>
                                                            Popular
                                                        </span>
                                                    )}
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-lg flex items-center justify-center",
                                                            colors.bg
                                                        )}>
                                                            <Icon className={cn("h-5 w-5", colors.text)} />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold">{plan.name}</h3>
                                                            <p className="text-xs text-muted-foreground">
                                                                {plan.billing_type === "per_user" ? "Por usuario" : "Fijo"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-xl font-bold">
                                                        USD ${displayPrice?.toLocaleString()}
                                                        <span className="text-sm font-normal text-muted-foreground">
                                                            /{billingCycle === "annual" ? "año" : "mes"}
                                                        </span>
                                                    </div>
                                                </Label>
                                            );
                                        })}
                                    </RadioGroup>

                                    <Separator />

                                    {/* Billing Cycle (inside same card) */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <CalendarDays className="h-5 w-5 text-primary" />
                                            <h3 className="font-semibold">{t("billingCycle")}</h3>
                                        </div>
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
                                                        ? `${currentPlanColors.border} ${currentPlanColors.bg}`
                                                        : "border-border hover:border-muted-foreground/50"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <RadioGroupItem
                                                        value="monthly"
                                                        id="monthly"
                                                        className="sr-only"
                                                    />
                                                    <span className="font-medium">{t("monthly")}</span>
                                                </div>
                                                <span className="font-bold">USD ${monthlyPrice.toLocaleString()}/mes</span>
                                            </Label>

                                            <Label
                                                htmlFor="annual"
                                                className={cn(
                                                    "relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all",
                                                    billingCycle === "annual"
                                                        ? `${currentPlanColors.border} ${currentPlanColors.bg}`
                                                        : "border-border hover:border-muted-foreground/50"
                                                )}
                                            >
                                                {savingsPercent > 0 && (
                                                    <span className={cn(
                                                        "absolute -top-3 right-4 px-2 py-0.5 text-xs font-semibold text-white rounded-full",
                                                        currentPlanColors.solid
                                                    )}>
                                                        Ahorrá {savingsPercent}%
                                                    </span>
                                                )}
                                                <div className="flex items-center gap-3">
                                                    <RadioGroupItem
                                                        value="annual"
                                                        id="annual"
                                                        className="sr-only"
                                                    />
                                                    <div>
                                                        <span className="font-medium">{t("annual")}</span>
                                                        {billingCycle === "annual" && (
                                                            <div className="flex items-center gap-1 text-xs mt-0.5 text-amber-500">
                                                                <Sparkles className="h-3 w-3" />
                                                                {t("founderBadge")}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="font-bold">USD ${annualPrice.toLocaleString()}/año</span>
                                            </Label>
                                        </RadioGroup>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Payment Method */}
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Landmark className="h-5 w-5 text-primary" />
                                    {t("paymentMethod")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <RadioGroup
                                    value={paymentMethod}
                                    onValueChange={(value) => {
                                        // Only allow change if method is not locked
                                        const isLocked = !isArgentina && (value === "transfer" || value === "mercadopago");
                                        if (!isLocked) setPaymentMethod(value);
                                    }}
                                    className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4"
                                >
                                    {orderedPaymentMethods.map((method) => {
                                        const Icon = method.icon;
                                        const isSelected = paymentMethod === method.id;
                                        const isLocked = !isArgentina && (method.id === "transfer" || method.id === "mercadopago");

                                        return (
                                            <div key={method.id} className="relative">
                                                {/* Locked badge for non-Argentina users */}
                                                {isLocked && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] whitespace-nowrap z-10 px-1.5 py-0.5"
                                                    >
                                                        Solo Argentina · <Link href="/contact" className="text-primary hover:underline">Contacto</Link>
                                                    </Badge>
                                                )}
                                                <Label
                                                    htmlFor={`payment-${method.id}`}
                                                    className={cn(
                                                        "flex flex-row sm:flex-col items-center gap-3 sm:gap-0 p-3 sm:p-4 rounded-xl border-2 transition-all",
                                                        isLocked
                                                            ? "cursor-not-allowed opacity-50 border-border"
                                                            : "cursor-pointer",
                                                        isSelected && !isLocked
                                                            ? "border-primary bg-primary/5"
                                                            : !isLocked && "border-border hover:border-primary/50"
                                                    )}
                                                >
                                                    <RadioGroupItem
                                                        value={method.id}
                                                        id={`payment-${method.id}`}
                                                        className="sr-only"
                                                        disabled={isLocked}
                                                    />
                                                    <div className={cn(
                                                        "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center sm:mb-2 overflow-hidden flex-shrink-0",
                                                        method.bgClass
                                                    )}>
                                                        {method.logo ? (
                                                            <Image
                                                                src={method.logo}
                                                                alt={method.label}
                                                                width={36}
                                                                height={36}
                                                                className="object-contain"
                                                            />
                                                        ) : Icon ? (
                                                            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                                                        ) : null}
                                                    </div>
                                                    <div className="flex flex-col sm:items-center">
                                                        <span className="font-medium text-sm">
                                                            {method.label}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground sm:text-center sm:mt-0.5">
                                                            {method.description}
                                                        </span>
                                                    </div>
                                                </Label>
                                            </div>
                                        );
                                    })}
                                </RadioGroup>
                            </CardContent>
                        </Card>

                        {/* Invoice Section (Optional) */}
                        <Card>
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Receipt className="h-5 w-5 text-primary" />
                                        Datos de Facturación
                                    </CardTitle>
                                    <Switch
                                        checked={needsInvoice}
                                        onCheckedChange={setNeedsInvoice}
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Activá esta opción si necesitás factura para tu compra
                                </p>
                            </CardHeader>

                            {needsInvoice && (
                                <CardContent className="space-y-4 pt-0">
                                    <Separator />

                                    {/* Company Toggle */}
                                    <div className="flex items-center justify-between py-2">
                                        <div>
                                            <Label className="text-sm font-medium">Facturar a empresa</Label>
                                            <p className="text-xs text-muted-foreground">Activá si necesitás factura a nombre de empresa</p>
                                        </div>
                                        <Switch
                                            checked={isCompany}
                                            onCheckedChange={setIsCompany}
                                        />
                                    </div>

                                    {/* Name/Company + Tax ID */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="billing_name">
                                                {isCompany ? "Razón Social" : "Nombre Completo"}
                                            </Label>
                                            <Input
                                                id="billing_name"
                                                value={billingName}
                                                onChange={(e) => setBillingName(e.target.value)}
                                                placeholder={isCompany ? "Mi Empresa S.A." : "Juan Pérez"}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="tax_id">CUIT / NIF / RFC</Label>
                                            <Input
                                                id="tax_id"
                                                value={taxId}
                                                onChange={(e) => setTaxId(e.target.value)}
                                                placeholder="20-12345678-9"
                                            />
                                        </div>
                                    </div>

                                    {/* Address + Country */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="address">Dirección</Label>
                                            <Input
                                                id="address"
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                placeholder="Calle y número"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="country">País</Label>
                                            <CountrySelector
                                                value={countryId}
                                                onChange={setCountryId}
                                                countries={countries}
                                                placeholder="Seleccionar país"
                                            />
                                        </div>
                                    </div>

                                    {/* City + Postcode */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="city">Ciudad</Label>
                                            <Input
                                                id="city"
                                                value={city}
                                                onChange={(e) => setCity(e.target.value)}
                                                placeholder="Ciudad"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="postcode">Código Postal</Label>
                                            <Input
                                                id="postcode"
                                                value={postcode}
                                                onChange={(e) => setPostcode(e.target.value)}
                                                placeholder="1234"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    </div>

                    {/* Right Column - Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-4">
                            <Card className="border-2">
                                <CardHeader className="bg-muted/50 pb-4">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Shield className="h-5 w-5 text-primary" />
                                        {t("orderSummary")}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-6">
                                    {/* Selected Product */}
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center",
                                            isCourse ? "bg-primary/10" : currentPlanColors.bg
                                        )}>
                                            {isCourse ? (
                                                <GraduationCap className="h-6 w-6 text-primary" />
                                            ) : (
                                                <PlanIcon className={cn("h-6 w-6", currentPlanColors.text)} />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold">{productName}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {isCourse
                                                    ? "Acceso por 1 año"
                                                    : isAnnual ? "Facturación anual" : "Facturación mensual"
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    {/* Founder Badge (only for annual plans) - uses golden/amber color */}
                                    {!isCourse && isAnnual && (
                                        <div className="flex items-center gap-2 p-3 rounded-lg border bg-amber-500/10 border-amber-500/30">
                                            <Sparkles className="h-5 w-5 text-amber-500" />
                                            <span className="text-sm font-medium text-amber-500">
                                                {t("founderBadge")}
                                            </span>
                                        </div>
                                    )}

                                    {/* Coupon */}
                                    {appliedCoupon ? (
                                        // Show applied coupon badge
                                        <div className="flex items-center justify-between p-3 rounded-lg border bg-primary/5 border-primary/30">
                                            <div className="flex items-center gap-2">
                                                <Tag className="h-4 w-4 text-primary" />
                                                <div>
                                                    <span className="text-sm font-medium text-primary">
                                                        {appliedCoupon.code}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground ml-2">
                                                        {appliedCoupon.type === "percent"
                                                            ? `${appliedCoupon.amount}% OFF`
                                                            : `USD $${appliedCoupon.amount} OFF`
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleRemoveCoupon}
                                                className="text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : !showCoupon ? (
                                        <button
                                            onClick={() => setShowCoupon(true)}
                                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <Tag className="h-4 w-4" />
                                            ¿Tenés un cupón?
                                        </button>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="flex gap-2">
                                                <Input
                                                    value={couponCode}
                                                    onChange={(e) => {
                                                        setCouponCode(e.target.value);
                                                        setCouponError(null);
                                                    }}
                                                    placeholder="Código de cupón"
                                                    className="flex-1"
                                                    disabled={couponLoading}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            handleApplyCoupon();
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleApplyCoupon}
                                                    disabled={couponLoading || !couponCode.trim()}
                                                >
                                                    {couponLoading ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        "Aplicar"
                                                    )}
                                                </Button>
                                            </div>
                                            {couponError && (
                                                <p className="text-xs text-destructive">{couponError}</p>
                                            )}
                                        </div>
                                    )}

                                    <Separator />

                                    {/* Pricing */}
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">{t("subtotal")}</span>
                                            {/* For annual plans, show original price (monthly * 12) as subtotal */}
                                            <span>
                                                {formatPrice(
                                                    !isCourse && isAnnual
                                                        ? monthlyCostIfAnnual
                                                        : finalPrice
                                                )}
                                            </span>
                                        </div>
                                        {!isCourse && isAnnual && savingsPercent > 0 && (
                                            <div className="flex justify-between text-primary">
                                                <span>Ahorro ({savingsPercent}%)</span>
                                                <span>-{formatPrice(savingsAmount).replace("$", "$ ")}</span>
                                            </div>
                                        )}
                                        {/* Coupon discount line */}
                                        {appliedCoupon && (
                                            <div className="flex justify-between text-primary">
                                                <span>Cupón ({appliedCoupon.code})</span>
                                                <span>-{formatPrice(appliedCoupon.discount).replace("$", "$ ")}</span>
                                            </div>
                                        )}
                                    </div>

                                    <Separator />

                                    <div className="flex justify-between text-lg font-bold">
                                        <span>{t("total")}</span>
                                        <span>{formatPrice(finalPrice)}</span>
                                    </div>

                                    {/* Terms & Conditions */}
                                    <div className="space-y-3 pt-2">
                                        <div className="flex items-start gap-3">
                                            <Checkbox
                                                id="terms"
                                                checked={acceptedTerms}
                                                onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                                            />
                                            <label htmlFor="terms" className="text-xs text-muted-foreground leading-tight cursor-pointer">
                                                Acepto los{" "}
                                                <Link href="/terms" className="text-primary hover:underline">
                                                    Términos y Condiciones
                                                </Link>{" "}
                                                y la{" "}
                                                <Link href="/privacy" className="text-primary hover:underline">
                                                    Política de Privacidad
                                                </Link>
                                            </label>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Checkbox
                                                id="communications"
                                                checked={acceptedCommunications}
                                                onCheckedChange={(checked) => setAcceptedCommunications(checked === true)}
                                            />
                                            <label htmlFor="communications" className="text-xs text-muted-foreground leading-tight cursor-pointer">
                                                Acepto recibir comunicaciones sobre mi {isCourse ? "curso" : "suscripción"}
                                            </label>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex-col gap-3 pt-0">
                                    <Button
                                        size="lg"
                                        className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 shadow-lg"
                                        disabled={!canProceed}
                                        onClick={() => {
                                            if (paymentMethod === "transfer") {
                                                // For bank transfer, use ARS with converted amount
                                                const transferAmount = isArsPayment
                                                    ? Math.round(finalPrice * exchangeRate)
                                                    : finalPrice;
                                                const transferCurrency = isArsPayment ? "ARS" : "USD";

                                                // Calculate original amount (before annual savings and coupon)
                                                const originalAmountUsd = isCourse
                                                    ? coursePrice
                                                    : (isAnnual ? monthlyCostIfAnnual : monthlyPrice);

                                                openModal(
                                                    <BankTransferForm
                                                        productName={productName || ""}
                                                        amount={transferAmount}
                                                        currency={transferCurrency}
                                                        courseId={isCourse ? course?.id : undefined}
                                                        courseSlug={isCourse ? course?.slug : undefined}
                                                        planId={!isCourse ? selectedPlanId : undefined}
                                                        organizationId={!isCourse ? organizationId : undefined}
                                                        billingPeriod={!isCourse ? billingCycle : undefined}
                                                        planColor={!isCourse ? currentPlanColors.text : undefined}
                                                        // Price breakdown info
                                                        originalAmount={isArsPayment ? Math.round(originalAmountUsd * exchangeRate) : originalAmountUsd}
                                                        annualSavings={!isCourse && isAnnual ? (isArsPayment ? Math.round(savingsAmount * exchangeRate) : savingsAmount) : undefined}
                                                        couponCode={appliedCoupon?.code}
                                                        discountAmount={appliedCoupon?.discount}
                                                        exchangeRate={isArsPayment ? exchangeRate : undefined}
                                                        onSuccess={closeModal}
                                                        onCancel={closeModal}
                                                    />,
                                                    {
                                                        title: "Transferencia Bancaria",
                                                        description: "Realiza la transferencia y sube el comprobante de pago.",
                                                        size: "md"
                                                    }
                                                );
                                            }
                                            // TODO: Handle mercadopago and paypal
                                        }}
                                    >
                                        <Lock className="mr-2 h-4 w-4" />
                                        Completar Compra
                                    </Button>

                                    <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Shield className="h-3 w-3" />
                                            Pago seguro
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Garantía 30 días
                                        </div>
                                    </div>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
