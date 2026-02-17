"use client";

// ============================================================
// BILLING CHECKOUT PAYMENT METHODS
// ============================================================
// Selector de métodos de pago: Transfer, MercadoPago, PayPal
// ============================================================

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Landmark, Wrench } from "lucide-react";
import type { PaymentMethodId, PaymentMethodFlags } from "@/features/billing/types/checkout";

// ============================================================
// PAYMENT METHODS DATA
// ============================================================

const PAYMENT_METHODS = [
    {
        id: "transfer" as const,
        label: "Transferencia Bancaria",
        description: "Solo Argentina · Pesos ARS",
        icon: Landmark,
        logo: null,
        bgClass: "bg-zinc-200 dark:bg-zinc-700",
    },
    {
        id: "mercadopago" as const,
        label: "MercadoPago",
        description: "Solo Argentina · Pesos ARS",
        icon: null,
        logo: "/logos/mp_logo.png",
        bgClass: "bg-white",
    },
    {
        id: "paypal" as const,
        label: "PayPal",
        description: "Internacional · Dólares USD",
        icon: null,
        logo: "/logos/paypal_logo.png",
        bgClass: "bg-white",
    },
];

// ============================================================
// PROPS
// ============================================================

interface BillingCheckoutPaymentMethodsProps {
    value: PaymentMethodId;
    onChange: (method: PaymentMethodId) => void;
    isArgentina: boolean;
    paymentMethodFlags: PaymentMethodFlags;
    isAdmin?: boolean;
}

// ============================================================
// COMPONENT
// ============================================================

export function BillingCheckoutPaymentMethods({
    value,
    onChange,
    isArgentina,
    paymentMethodFlags,
    isAdmin = false,
}: BillingCheckoutPaymentMethodsProps) {
    const t = useTranslations("Founders.checkout");

    // Order payment methods: Argentina sees local first, others see international first
    const orderedMethods = isArgentina
        ? PAYMENT_METHODS
        : [...PAYMENT_METHODS].reverse();

    return (
        <Card>
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Landmark className="h-5 w-5 text-primary" />
                    {t("paymentMethod")}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <RadioGroup
                    value={value}
                    onValueChange={(newValue) => {
                        onChange(newValue as PaymentMethodId);
                    }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4"
                >
                    {orderedMethods.map((method) => {
                        const Icon = method.icon;
                        const isSelected = value === method.id;

                        // Check if payment method is disabled in feature flags
                        const isPaymentFlagDisabled = (
                            (method.id === "mercadopago" && !paymentMethodFlags.mercadopagoEnabled) ||
                            (method.id === "paypal" && !paymentMethodFlags.paypalEnabled)
                        );

                        // Visual disabled state (shown to everyone including admin)
                        const showDisabledVisual = isPaymentFlagDisabled;

                        // Functional disabled state (admin can still select)
                        const isClickDisabled = isPaymentFlagDisabled && !isAdmin;

                        return (
                            <div key={method.id} className="relative">
                                {/* Disabled/maintenance badge */}
                                {isPaymentFlagDisabled && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 text-xs font-semibold rounded-full flex items-center gap-1 bg-orange-500 text-white whitespace-nowrap z-10">
                                        <Wrench className="h-3 w-3" />
                                        En Mantenimiento
                                    </span>
                                )}



                                <Label
                                    htmlFor={isClickDisabled ? undefined : `payment-${method.id}`}
                                    className={cn(
                                        "flex flex-row sm:flex-col items-center gap-3 sm:gap-0 p-3 sm:p-4 rounded-xl border-2 transition-all h-full",
                                        showDisabledVisual && "opacity-50 border-border",
                                        isClickDisabled ? "cursor-not-allowed" : "cursor-pointer",
                                        isSelected && !isClickDisabled
                                            ? "border-primary bg-primary/5 !opacity-100"
                                            : !showDisabledVisual && "border-border hover:border-primary/50"
                                    )}
                                    onClick={isClickDisabled ? (e) => e.preventDefault() : undefined}
                                >
                                    {!isClickDisabled && (
                                        <RadioGroupItem
                                            value={method.id}
                                            id={`payment-${method.id}`}
                                            className="sr-only"
                                        />
                                    )}

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
    );
}
