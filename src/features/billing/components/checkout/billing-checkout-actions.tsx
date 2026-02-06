"use client";

// ============================================================
// BILLING CHECKOUT ACTIONS
// ============================================================
// Botones de pago: Transfer, MercadoPago, PayPal
// ============================================================

import { Button } from "@/components/ui/button";
import { useModal } from "@/stores/modal-store";
import { Loader2, ArrowRight, Lock } from "lucide-react";
import { BankTransferForm } from "@/features/billing/forms/billing-bank-transfer-form";
import { activateFreeSubscription } from "@/features/billing/actions";
import type { UseCheckoutReturn } from "@/features/billing/types/checkout";

// ============================================================
// PROPS
// ============================================================

interface BillingCheckoutActionsProps {
    checkout: UseCheckoutReturn;
    organizationId?: string;
    exchangeRate?: number;
    onMercadopagoLoading: (loading: boolean) => void;
    onPaypalLoading: (loading: boolean) => void;
    onFreeActivationLoading: (loading: boolean) => void;
}

// ============================================================
// COMPONENT
// ============================================================

export function BillingCheckoutActions({
    checkout,
    organizationId,
    exchangeRate = 1,
    onMercadopagoLoading,
    onPaypalLoading,
    onFreeActivationLoading,
}: BillingCheckoutActionsProps) {
    const { openModal, closeModal } = useModal();
    const { state, computed } = checkout;

    const isCourse = state.productType === "course";
    const isSeats = state.productType === "seats";
    const isAnnual = state.billingCycle === "annual";
    const isArsPayment = computed.isArsPayment;

    // Calculate amounts
    const finalPrice = computed.finalPrice;
    const monthlyPrice = computed.monthlyPrice;
    const monthlyCostIfAnnual = monthlyPrice * 12;
    const savingsAmount = computed.savingsAmount;

    // Get button label based on payment method
    const getButtonLabel = () => {
        if (state.appliedCoupon?.isFree) return "Activar Gratis";
        if (state.paymentMethod === "transfer") return "Continuar con Transferencia";
        if (state.paymentMethod === "mercadopago") return "Pagar con MercadoPago";
        if (state.paymentMethod === "paypal") return "Pagar con PayPal";
        return "Continuar";
    };

    const isLoading = state.mercadopagoLoading || state.paypalLoading || state.freeActivationLoading;

    const handlePayment = async () => {
        // Check if coupon gives 100% discount - activate directly
        if (state.appliedCoupon?.isFree && !isCourse && organizationId && computed.currentPlan) {
            onFreeActivationLoading(true);
            try {
                const result = await activateFreeSubscription({
                    organizationId,
                    planId: computed.currentPlan.id,
                    billingPeriod: state.billingCycle as "monthly" | "annual",
                    couponId: state.appliedCoupon.couponId,
                    couponCode: state.appliedCoupon.code
                });
                if (result.success) {
                    window.location.href = "/checkout/success?type=subscription&free=true";
                    return;
                } else {
                    console.error("Free activation failed:", result.error);
                }
            } catch (error) {
                console.error("Free activation error:", error);
            } finally {
                onFreeActivationLoading(false);
            }
            return;
        }

        if (state.paymentMethod === "transfer") {
            // Calculate transfer amounts
            const transferAmount = isArsPayment
                ? Math.round(finalPrice * exchangeRate)
                : finalPrice;
            const transferCurrency = isArsPayment ? "ARS" : "USD";

            // Get original amount (before savings/coupon)
            let originalAmountUsd = finalPrice;
            if (isCourse) {
                originalAmountUsd = computed.currentCourse?.price || 0;
            } else if (isAnnual) {
                originalAmountUsd = monthlyCostIfAnnual;
            } else {
                originalAmountUsd = monthlyPrice;
            }

            openModal(
                <BankTransferForm
                    productName={computed.productName || ""}
                    amount={transferAmount}
                    currency={transferCurrency}
                    courseId={isCourse ? computed.currentCourse?.id : undefined}
                    courseSlug={isCourse ? computed.currentCourse?.slug : undefined}
                    planId={!isCourse && !isSeats ? state.selectedPlanId : undefined}
                    organizationId={!isCourse ? organizationId : undefined}
                    billingPeriod={!isCourse && !isSeats ? state.billingCycle as "monthly" | "annual" : undefined}
                    seatsQuantity={isSeats ? state.seatsQuantity : undefined}
                    originalAmount={isArsPayment ? Math.round(originalAmountUsd * exchangeRate) : originalAmountUsd}
                    annualSavings={!isCourse && !isSeats && isAnnual ? (isArsPayment ? Math.round(savingsAmount * exchangeRate) : savingsAmount) : undefined}
                    couponCode={state.appliedCoupon?.code}
                    discountAmount={state.appliedCoupon?.discount}
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
        } else if (state.paymentMethod === "mercadopago") {
            onMercadopagoLoading(true);
            try {
                const mpAmount = Math.round(finalPrice * exchangeRate);
                const response = await fetch("/api/mercadopago/preference", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        productType: isCourse ? "course" : isSeats ? "seats" : "subscription",
                        productId: isCourse ? computed.currentCourse?.id : state.selectedPlanId,
                        organizationId: !isCourse ? organizationId : undefined,
                        billingPeriod: !isCourse && !isSeats ? state.billingCycle : undefined,
                        seatsQuantity: isSeats ? state.seatsQuantity : undefined,
                        amount: mpAmount,
                        title: computed.productName,
                        couponCode: state.appliedCoupon?.code,
                        couponDiscount: state.appliedCoupon?.discount
                            ? Math.round(state.appliedCoupon.discount * exchangeRate)
                            : undefined,
                    }),
                });

                if (!response.ok) {
                    throw new Error("Error al crear preferencia de pago");
                }

                const data = await response.json();
                if (data.init_point) {
                    window.location.href = data.init_point;
                } else {
                    throw new Error("No se recibió URL de pago");
                }
            } catch (error) {
                console.error("MercadoPago error:", error);
                onMercadopagoLoading(false);
            }
        } else if (state.paymentMethod === "paypal") {
            onPaypalLoading(true);
            try {
                const createResponse = await fetch("/api/paypal/create-order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        productType: isCourse ? "course" : isSeats ? "seats" : "subscription",
                        productId: isCourse ? computed.currentCourse?.id : state.selectedPlanId,
                        organizationId: !isCourse ? organizationId : undefined,
                        billingPeriod: !isCourse && !isSeats ? state.billingCycle : undefined,
                        seatsQuantity: isSeats ? state.seatsQuantity : undefined,
                        amount: finalPrice,
                        title: computed.productName,
                        couponCode: state.appliedCoupon?.code,
                        couponDiscount: state.appliedCoupon?.discount,
                    }),
                });

                if (!createResponse.ok) {
                    throw new Error("Error al crear orden de PayPal");
                }

                const orderData = await createResponse.json();
                if (orderData.approveUrl) {
                    window.location.href = orderData.approveUrl;
                } else {
                    throw new Error("No se recibió URL de aprobación");
                }
            } catch (error) {
                console.error("PayPal error:", error);
                onPaypalLoading(false);
            }
        }
    };

    return (
        <>
            <Button
                size="lg"
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 shadow-lg"
                disabled={!computed.canProceed || isLoading}
                onClick={handlePayment}
            >
                {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    <>
                        {getButtonLabel()}
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                )}
            </Button>

            {/* Security note */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                Pago seguro y encriptado
            </div>
        </>
    );
}
