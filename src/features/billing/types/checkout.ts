// ============================================================
// CHECKOUT TYPES
// ============================================================
// Tipos centralizados para el módulo de checkout
// Soporta: plan, course, seats
// ============================================================

import type { LucideIcon } from "lucide-react";

// ============================================================
// PRODUCT TYPES
// ============================================================

export type ProductType = "plan" | "course" | "seats" | "upgrade";
export type BillingCycle = "monthly" | "annual" | "one-time";
export type PaymentMethodId = "transfer" | "mercadopago" | "paypal";
export type PlanFlagStatus = "active" | "founders" | "coming_soon" | "disabled" | "maintenance" | "hidden";

// ============================================================
// PLAN
// ============================================================

export interface CheckoutPlan {
    id: string;
    name: string;
    slug: string | null;
    monthly_amount: number | null;
    annual_amount: number | null;
    billing_type?: string | null;
    features?: unknown;
}

// ============================================================
// COURSE
// ============================================================

export interface CheckoutCourse {
    id?: string;
    title: string;
    slug: string;
    subtitle?: string;
    price: number;
    heroImage?: string;
    modules?: { lessons?: unknown[] }[];
    isFoundersIncluded?: boolean;
}

// ============================================================
// SEATS (NEW)
// ============================================================

export interface CheckoutSeats {
    organizationId: string;
    quantity: number;
    proratedPricePerSeat: number;
    daysRemaining: number;
    expiresAt: string;
    billingPeriod: BillingCycle;
    basePricePerSeat: number;
}

// ============================================================
// UPGRADE (PRO → TEAMS)
// ============================================================

export interface CheckoutUpgrade {
    organizationId: string;
    currentPlanId: string;
    currentPlanSlug: string;
    currentPlanName: string;
    targetPlanId: string;
    targetPlanSlug: string;
    targetPlanName: string;
    billingPeriod: BillingCycle;
    credit: number;
    targetPrice: number;
    upgradePrice: number;
    daysRemaining: number;
    expiresAt: string;
    subscriptionAmount: number;
}

// ============================================================
// PAYMENT METHODS
// ============================================================

export interface PaymentMethod {
    id: PaymentMethodId;
    label: string;
    description: string;
    icon: LucideIcon | null;
    logo: string | null;
    bgClass: string;
}

export interface PaymentMethodFlags {
    mercadopagoEnabled: boolean;
    paypalEnabled: boolean;
}

// ============================================================
// COUPON
// ============================================================

export interface AppliedCoupon {
    couponId: string;
    code: string;
    type: "percent" | "fixed";
    amount: number;
    discount: number;
    finalPrice: number;
    isFree: boolean;
}

// ============================================================
// INVOICE / BILLING DATA
// ============================================================

export interface InvoiceData {
    needsInvoice: boolean;
    isCompany: boolean;
    billingName: string;
    taxId: string;
    address: string;
    countryId: string;
    city: string;
    postcode: string;
}

// ============================================================
// CHECKOUT STATE
// ============================================================

export interface CheckoutState {
    // Product
    productType: ProductType;
    selectedPlanId: string;
    billingCycle: BillingCycle;

    // Seats (when productType === 'seats')
    seatsQuantity: number;
    seatsData: CheckoutSeats | null;

    // Upgrade (when productType === 'upgrade')
    upgradeData: CheckoutUpgrade | null;

    // Payment
    paymentMethod: PaymentMethodId;

    // Coupon
    couponCode: string;
    appliedCoupon: AppliedCoupon | null;
    couponError: string | null;
    couponLoading: boolean;

    // Invoice
    invoiceData: InvoiceData;

    // Terms
    acceptedTerms: boolean;
    acceptedCommunications: boolean;

    // Loading states
    mercadopagoLoading: boolean;
    paypalLoading: boolean;
    freeActivationLoading: boolean;
}

// ============================================================
// CHECKOUT PROPS
// ============================================================

export interface CheckoutViewProps {
    productType: ProductType;
    plans: CheckoutPlan[];
    course?: CheckoutCourse | null;
    seatsData?: CheckoutSeats | null;
    upgradeData?: CheckoutUpgrade | null;
    initialPlanSlug?: string;
    initialCycle?: BillingCycle;
    countries?: { id: string; name: string; alpha_2: string | null }[];
    organizationId?: string;
    exchangeRate?: number;
    userCountryCode?: string | null;
    purchaseFlags?: { pro: PlanFlagStatus; teams: PlanFlagStatus };
    paymentMethodFlags?: PaymentMethodFlags;
    isAdmin?: boolean;
    coursePurchasesEnabled?: boolean;
}

// ============================================================
// CHECKOUT COMPUTED VALUES
// ============================================================

export interface CheckoutComputed {
    // Current product
    currentPlan: CheckoutPlan | undefined;
    currentCourse: CheckoutCourse | undefined | null;
    productName: string;

    // Pricing
    basePrice: number;
    finalPrice: number;
    isArsPayment: boolean;

    // Plan specific
    monthlyPrice: number;
    annualPrice: number;
    savingsPercent: number;
    savingsAmount: number;

    // Validation
    canProceed: boolean;

    // Helpers
    formatPrice: (amountUsd: number, forceUsd?: boolean) => string;
}

// ============================================================
// CHECKOUT ACTIONS
// ============================================================

export interface CheckoutActions {
    selectPlan: (planId: string) => void;
    setBillingCycle: (cycle: BillingCycle) => void;
    setPaymentMethod: (method: PaymentMethodId) => void;
    setSeatsQuantity: (quantity: number) => void;

    // Coupon
    setCouponCode: (code: string) => void;
    applyCoupon: () => Promise<void>;
    removeCoupon: () => void;

    // Invoice
    setInvoiceData: (data: Partial<InvoiceData>) => void;

    // Terms
    setAcceptedTerms: (accepted: boolean) => void;
    setAcceptedCommunications: (accepted: boolean) => void;

    // Payment
    processPayment: () => Promise<void>;
    activateFreeSubscription: () => Promise<void>;
}

// ============================================================
// FULL CHECKOUT HOOK RETURN
// ============================================================

export interface UseCheckoutReturn {
    state: CheckoutState;
    computed: CheckoutComputed;
    actions: CheckoutActions;
}
