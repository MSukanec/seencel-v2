"use client";

// ============================================================
// BILLING CHECKOUT VIEW
// ============================================================
// Vista principal de checkout refactorizada y modular.
// Soporta: plan, course, seats, upgrade
// ============================================================

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Shield, MessageCircle, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useCheckout } from "@/features/billing/hooks/use-checkout";
import {
    BillingCheckoutProductCard,
    BillingCheckoutPaymentMethods,
    BillingCheckoutInvoiceForm,
    BillingCheckoutSummary,
    BillingCheckoutActions,
} from "@/features/billing/components/checkout";
import type { CheckoutViewProps } from "@/features/billing/types/checkout";

// ============================================================
// COMPONENT
// ============================================================

export function BillingCheckoutView(props: CheckoutViewProps) {
    const t = useTranslations("Founders.checkout");
    const checkout = useCheckout(props);
    const { state, computed, actions } = checkout;

    // Local loading states for payment buttons
    const [mercadopagoLoading, setMercadopagoLoading] = useState(false);
    const [paypalLoading, setPaypalLoading] = useState(false);
    const [freeActivationLoading, setFreeActivationLoading] = useState(false);

    const {
        countries = [],
        organizationId,
        exchangeRate = 1,
        userCountryCode = null,
        paymentMethodFlags = { mercadopagoEnabled: true, paypalEnabled: true },
        isAdmin = false,
    } = props;

    const isArgentina = userCountryCode === "AR";
    const isCourse = state.productType === "course";
    const isSeats = state.productType === "seats";
    const isUpgrade = state.productType === "upgrade";

    // Course validation
    if (isCourse && !props.course) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">Curso no encontrado</p>
            </div>
        );
    }

    // Upgrade validation
    if (isUpgrade && !props.upgradeData) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">No se pudo calcular el upgrade. Verificá tu plan actual.</p>
            </div>
        );
    }

    // Update loading states in checkout state
    const checkoutWithLoading = {
        ...checkout,
        state: {
            ...checkout.state,
            mercadopagoLoading,
            paypalLoading,
            freeActivationLoading,
        }
    };

    return (
        <div className="py-4 sm:py-8">
            <div className="grid lg:grid-cols-3 gap-4 sm:gap-8 max-w-6xl mx-auto">
                {/* Left Column - Product & Payment Selection */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                    {/* Product Card */}
                    <BillingCheckoutProductCard
                        productType={state.productType}
                        plans={props.plans as any}
                        selectedPlanId={state.selectedPlanId}
                        onSelectPlan={actions.selectPlan}
                        billingCycle={state.billingCycle}
                        onBillingCycleChange={actions.setBillingCycle}
                        purchaseFlags={props.purchaseFlags}
                        isAdmin={isAdmin}
                        formatPrice={computed.formatPrice}
                        course={props.course as any}
                        seatsData={props.seatsData}
                        seatsQuantity={state.seatsQuantity}
                        onSeatsQuantityChange={actions.setSeatsQuantity}
                        upgradeData={props.upgradeData}
                    />

                    {/* Payment Methods */}
                    <BillingCheckoutPaymentMethods
                        value={state.paymentMethod}
                        onChange={actions.setPaymentMethod}
                        isArgentina={isArgentina}
                        paymentMethodFlags={paymentMethodFlags}
                        isAdmin={isAdmin}
                    />

                    {/* Invoice Form */}
                    <BillingCheckoutInvoiceForm
                        data={state.invoiceData}
                        onChange={actions.setInvoiceData}
                        countries={countries}
                    />
                </div>

                {/* Right Column - Order Summary */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-4">
                        {/* Summary Card */}
                        <BillingCheckoutSummary checkout={checkoutWithLoading}>
                            <BillingCheckoutActions
                                checkout={checkoutWithLoading}
                                organizationId={organizationId}
                                exchangeRate={exchangeRate}
                                onMercadopagoLoading={setMercadopagoLoading}
                                onPaypalLoading={setPaypalLoading}
                                onFreeActivationLoading={setFreeActivationLoading}
                            />
                        </BillingCheckoutSummary>

                        {/* Trust Badges */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                            {[
                                { icon: Shield, label: t("guaranteed") },
                                { icon: ShieldCheck, label: t("secure") },
                                { icon: MessageCircle, label: t("support") },
                            ].map(({ icon: Icon, label }) => (
                                <div key={label} className="flex flex-col items-center text-center p-2 sm:p-3 rounded-xl bg-muted/30">
                                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary mb-1 sm:mb-2" />
                                    <span className="text-[10px] sm:text-xs text-muted-foreground">{label}</span>
                                </div>
                            ))}
                        </div>


                    </div>
                </div>
            </div>
        </div>
    );
}

// Re-export for backwards compatibility
export { BillingCheckoutView as CheckoutView };
