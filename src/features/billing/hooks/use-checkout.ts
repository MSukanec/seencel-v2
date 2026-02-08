"use client";

// ============================================================
// USE-CHECKOUT HOOK
// ============================================================
// Hook central que maneja todo el estado y lógica del checkout.
// Soporta: plan, course, seats, upgrade
// ============================================================

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "@/i18n/routing";
import { useModal } from "@/stores/modal-store";
import { validateCoupon, activateFreeSubscription } from "@/features/billing/actions";
import type {
    CheckoutViewProps,
    CheckoutState,
    CheckoutComputed,
    CheckoutActions,
    UseCheckoutReturn,
    AppliedCoupon,
    InvoiceData,
    BillingCycle,
    PaymentMethodId,
    PlanFlagStatus,
    CheckoutPlan,
} from "@/features/billing/types/checkout";

// ============================================================
// CONSTANTS
// ============================================================

export const COUPON_ERROR_MESSAGES: Record<string, string> = {
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

export const getCouponErrorMessage = (reason: string) =>
    COUPON_ERROR_MESSAGES[reason] || "Cupón no válido";

// ============================================================
// HOOK
// ============================================================

export function useCheckout(props: CheckoutViewProps): UseCheckoutReturn {
    const {
        productType,
        plans,
        course,
        seatsData,
        upgradeData,
        initialPlanSlug,
        initialCycle = "annual",
        exchangeRate = 1,
        userCountryCode = null,
        purchaseFlags = { pro: 'active', teams: 'active' },
        isAdmin = false,
    } = props;

    const router = useRouter();
    const { openModal, closeModal } = useModal();

    // ============================================================
    // COMPUTED HELPERS (must be before useState for initial values)
    // ============================================================

    const isArgentina = userCountryCode === "AR";

    const purchasablePlans = useMemo(() =>
        plans.filter((p): p is CheckoutPlan =>
            p.slug !== "free" &&
            typeof p.monthly_amount === 'number' &&
            p.monthly_amount > 0
        ) as CheckoutPlan[],
        [plans]);

    const getPlanStatus = useCallback((planSlug: string): PlanFlagStatus => {
        const lower = planSlug.toLowerCase();
        if (lower.includes("pro")) return purchaseFlags.pro as PlanFlagStatus;
        if (lower.includes("team")) return purchaseFlags.teams as PlanFlagStatus;
        return 'active';
    }, [purchaseFlags]);

    const canSelectPlan = useCallback((planSlug: string): boolean => {
        if (isAdmin) return true;
        const status = getPlanStatus(planSlug);
        return status === 'active' || status === 'founders';
    }, [isAdmin, getPlanStatus]);

    const findInitialPlan = useCallback(() => {
        const requested = purchasablePlans.find(p => p.slug === initialPlanSlug);
        if (requested && canSelectPlan(requested.slug || '')) return requested;

        const firstSelectable = purchasablePlans.find(p => canSelectPlan(p.slug || ''));
        if (firstSelectable) return firstSelectable;

        return purchasablePlans[0];
    }, [purchasablePlans, initialPlanSlug, canSelectPlan]);

    const getDefaultPaymentMethod = useCallback((): PaymentMethodId => {
        if (isArgentina) return "transfer";
        return "paypal";
    }, [isArgentina]);

    const initialPlan = findInitialPlan();

    // ============================================================
    // STATE
    // ============================================================

    // Product
    const [selectedPlanId, setSelectedPlanId] = useState(initialPlan?.id || "");
    const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialCycle);
    const [seatsQuantity, setSeatsQuantity] = useState(seatsData?.quantity || 1);

    // Payment
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>(getDefaultPaymentMethod());

    // Coupon
    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
    const [couponError, setCouponError] = useState<string | null>(null);
    const [couponLoading, setCouponLoading] = useState(false);

    // Invoice
    const [invoiceData, setInvoiceDataState] = useState<InvoiceData>({
        needsInvoice: false,
        isCompany: false,
        billingName: "",
        taxId: "",
        address: "",
        countryId: "",
        city: "",
        postcode: "",
    });

    // Terms
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [acceptedCommunications, setAcceptedCommunications] = useState(false);

    // Loading states
    const [mercadopagoLoading, setMercadopagoLoading] = useState(false);
    const [paypalLoading, setPaypalLoading] = useState(false);
    const [freeActivationLoading, setFreeActivationLoading] = useState(false);

    // ============================================================
    // COMPUTED VALUES
    // ============================================================

    const currentPlan = useMemo(() =>
        purchasablePlans.find((p) => p.id === selectedPlanId),
        [purchasablePlans, selectedPlanId]);

    const isCourse = productType === "course";
    const isSeats = productType === "seats";
    const isUpgrade = productType === "upgrade";

    // Pricing
    const coursePrice = course?.price || 0;
    const monthlyPrice = currentPlan?.monthly_amount || 0;
    const annualPrice = currentPlan?.annual_amount || 0;
    const planPrice = billingCycle === "annual" ? annualPrice : monthlyPrice;

    // Seats pricing
    const seatsTotalPrice = seatsData
        ? seatsData.proratedPricePerSeat * seatsQuantity
        : 0;

    // Base price based on product type
    const basePrice = useMemo(() => {
        if (isCourse) return coursePrice;
        if (isSeats) return seatsTotalPrice;
        if (isUpgrade && upgradeData) return upgradeData.upgradePrice;
        return planPrice;
    }, [isCourse, isSeats, isUpgrade, coursePrice, seatsTotalPrice, upgradeData, planPrice]);

    // Final price with coupon
    const finalPrice = appliedCoupon ? appliedCoupon.finalPrice : basePrice;

    // Savings calculation for annual
    const monthlyCostIfAnnual = monthlyPrice * 12;
    const savingsPercent = monthlyCostIfAnnual > 0
        ? Math.round((1 - annualPrice / monthlyCostIfAnnual) * 100)
        : 0;
    const savingsAmount = monthlyCostIfAnnual - annualPrice;

    // Product name
    const productName = useMemo(() => {
        if (isCourse) return course?.title || "Curso";
        if (isSeats) return `${seatsQuantity} asiento(s) adicional(es)`;
        if (isUpgrade && upgradeData) return `Upgrade a ${upgradeData.targetPlanName}`;
        return currentPlan?.name || "Plan";
    }, [isCourse, isSeats, isUpgrade, course, seatsQuantity, currentPlan, upgradeData]);

    // If payment is in ARS
    const isArsPayment = paymentMethod === "transfer" || paymentMethod === "mercadopago";

    // Format price helper
    const formatPrice = useCallback((amountUsd: number, forceUsd = false) => {
        if (forceUsd || !isArsPayment) {
            return `USD $${amountUsd.toLocaleString()}`;
        }
        const amountArs = Math.round(amountUsd * exchangeRate);
        return `ARS $${amountArs.toLocaleString("es-AR")}`;
    }, [isArsPayment, exchangeRate]);

    // Can proceed validation
    const canProceed = useMemo(() => {
        if (!acceptedTerms) return false;
        if (isCourse && !course) return false;
        if (isUpgrade && !upgradeData) return false;
        if (!isCourse && !isSeats && !isUpgrade && !currentPlan) return false;
        if (isSeats && seatsQuantity < 1) return false;
        return true;
    }, [acceptedTerms, isCourse, isSeats, isUpgrade, course, currentPlan, seatsQuantity, upgradeData]);

    // ============================================================
    // ACTIONS
    // ============================================================

    const handleApplyCoupon = useCallback(async () => {
        if (!couponCode.trim()) return;

        setCouponLoading(true);
        setCouponError(null);

        const result = await validateCoupon({
            code: couponCode.trim(),
            productType: isCourse ? "course" : "subscription",
            productId: isCourse ? (course?.id || "") : (currentPlan?.id || ""),
            price: basePrice,
            currency: "USD"
        });

        setCouponLoading(false);

        if (!result.ok) {
            setCouponError(getCouponErrorMessage(result.reason));
            setAppliedCoupon(null);
            return;
        }

        setAppliedCoupon({
            couponId: result.couponId,
            code: result.couponCode,
            type: result.type,
            amount: result.amount,
            discount: result.discount,
            finalPrice: result.finalPrice,
            isFree: result.isFree
        });
        setCouponError(null);
    }, [couponCode, isCourse, course, currentPlan, basePrice]);

    const handleRemoveCoupon = useCallback(() => {
        setAppliedCoupon(null);
        setCouponCode("");
        setCouponError(null);
    }, []);

    const handleSetInvoiceData = useCallback((data: Partial<InvoiceData>) => {
        setInvoiceDataState(prev => ({ ...prev, ...data }));
    }, []);

    const handleActivateFreeSubscription = useCallback(async () => {
        if (!appliedCoupon?.isFree || !currentPlan || !props.organizationId) return;

        setFreeActivationLoading(true);

        const result = await activateFreeSubscription({
            organizationId: props.organizationId,
            planId: currentPlan.id,
            billingPeriod: billingCycle as "monthly" | "annual",
            couponId: appliedCoupon.couponId,
            couponCode: appliedCoupon.code,
        });

        setFreeActivationLoading(false);

        if (result.success) {
            window.location.href = "/checkout/success?type=subscription&free=true";
        }
    }, [appliedCoupon, currentPlan, billingCycle, router, props.organizationId]);

    const handleProcessPayment = useCallback(async () => {
        // This will be implemented per payment method
        // For now, placeholder
    }, []);

    // ============================================================
    // STATE OBJECT
    // ============================================================

    const state: CheckoutState = {
        productType,
        selectedPlanId,
        billingCycle,
        seatsQuantity,
        seatsData: seatsData || null,
        upgradeData: upgradeData || null,
        paymentMethod,
        couponCode,
        appliedCoupon,
        couponError,
        couponLoading,
        invoiceData,
        acceptedTerms,
        acceptedCommunications,
        mercadopagoLoading,
        paypalLoading,
        freeActivationLoading,
    };

    const computed: CheckoutComputed = {
        currentPlan,
        currentCourse: course,
        productName,
        basePrice,
        finalPrice,
        isArsPayment,
        monthlyPrice,
        annualPrice,
        savingsPercent,
        savingsAmount,
        canProceed,
        formatPrice,
    };

    const actions: CheckoutActions = {
        selectPlan: setSelectedPlanId,
        setBillingCycle,
        setPaymentMethod,
        setSeatsQuantity,
        setCouponCode,
        applyCoupon: handleApplyCoupon,
        removeCoupon: handleRemoveCoupon,
        setInvoiceData: handleSetInvoiceData,
        setAcceptedTerms,
        setAcceptedCommunications,
        processPayment: handleProcessPayment,
        activateFreeSubscription: handleActivateFreeSubscription,
    };

    return { state, computed, actions };
}
