"use client";

// ============================================================
// BILLING CHECKOUT SUMMARY
// ============================================================
// Card de resumen del pedido con pricing y totales
// ============================================================

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Sparkles } from "lucide-react";
import type { UseCheckoutReturn } from "@/features/billing/types/checkout";
import { BillingCheckoutCouponInput } from "./billing-checkout-coupon-input";
import { BillingCheckoutTerms } from "./billing-checkout-terms";

// ============================================================
// PROPS
// ============================================================

interface BillingCheckoutSummaryProps {
    checkout: UseCheckoutReturn;
    children?: React.ReactNode; // Para botones de acción
}

// ============================================================
// COMPONENT
// ============================================================

export function BillingCheckoutSummary({
    checkout,
    children,
}: BillingCheckoutSummaryProps) {
    const t = useTranslations("Founders.checkout");
    const { state, computed, actions } = checkout;

    const isCourse = state.productType === "course";
    const isSeats = state.productType === "seats";
    const isAnnual = state.billingCycle === "annual";

    // Calculate monthly cost for annual comparison
    const monthlyCostIfAnnual = computed.monthlyPrice * 12;

    // Determine product label for communications checkbox
    const productLabel = isCourse ? "curso" : isSeats ? "asientos" : "suscripción";

    return (
        <Card className="sticky top-4">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    {t("summary")}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Product Name */}
                <div className="flex justify-between items-center">
                    <span className="font-medium">{computed.productName}</span>
                    {!isCourse && !isSeats && (
                        <span className="text-sm text-muted-foreground">
                            {isAnnual ? "/ año" : "/ mes"}
                        </span>
                    )}
                </div>

                {/* Founder Badge for annual */}
                {!isCourse && !isSeats && isAnnual && (
                    <div className="flex items-center gap-2 text-sm">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        <span className="font-medium text-amber-500">
                            {t("founderBadge")}
                        </span>
                    </div>
                )}

                {/* Coupon Input */}
                <BillingCheckoutCouponInput
                    code={state.couponCode}
                    onCodeChange={actions.setCouponCode}
                    appliedCoupon={state.appliedCoupon}
                    couponError={state.couponError}
                    couponLoading={state.couponLoading}
                    onApply={actions.applyCoupon}
                    onRemove={actions.removeCoupon}
                />

                <Separator />

                {/* Pricing Breakdown */}
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("subtotal")}</span>
                        <span>
                            {computed.formatPrice(
                                !isCourse && !isSeats && isAnnual
                                    ? monthlyCostIfAnnual
                                    : computed.finalPrice
                            )}
                        </span>
                    </div>

                    {/* Annual savings */}
                    {!isCourse && !isSeats && isAnnual && computed.savingsPercent > 0 && (
                        <div className="flex justify-between text-primary">
                            <span>Ahorro ({computed.savingsPercent}%)</span>
                            <span>-{computed.formatPrice(computed.savingsAmount).replace("$", "$ ")}</span>
                        </div>
                    )}

                    {/* Coupon discount */}
                    {state.appliedCoupon && (
                        <div className="flex justify-between text-primary">
                            <span>Cupón ({state.appliedCoupon.code})</span>
                            <span>-{computed.formatPrice(state.appliedCoupon.discount).replace("$", "$ ")}</span>
                        </div>
                    )}
                </div>

                <Separator />

                {/* Total */}
                <div className="flex justify-between text-lg font-bold">
                    <span>{t("total")}</span>
                    <span>{computed.formatPrice(computed.finalPrice)}</span>
                </div>

                {/* Seats proration info */}
                {isSeats && state.seatsData && (
                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                        <p>Precio prorrateado por {state.seatsData.daysRemaining} días restantes</p>
                        <p className="text-foreground">Válido hasta {new Date(state.seatsData.expiresAt).toLocaleDateString()}</p>
                    </div>
                )}

                {/* Terms & Conditions */}
                <BillingCheckoutTerms
                    acceptedTerms={state.acceptedTerms}
                    acceptedCommunications={state.acceptedCommunications}
                    onTermsChange={actions.setAcceptedTerms}
                    onCommunicationsChange={actions.setAcceptedCommunications}
                    productLabel={productLabel}
                />
            </CardContent>

            {/* Actions (buttons passed as children) */}
            {children && (
                <CardFooter className="flex-col gap-3 pt-0">
                    {children}
                </CardFooter>
            )}
        </Card>
    );
}
