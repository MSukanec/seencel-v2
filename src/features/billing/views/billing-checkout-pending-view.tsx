"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ContentLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Clock, Home, HelpCircle, Loader2 } from "lucide-react";
import Link from "next/link";

const POLL_INTERVAL_MS = 8000;
const MAX_POLL_ATTEMPTS = 30; // ~4 minutes

export function BillingCheckoutPendingView() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const t = useTranslations("BillingResults.pending");

    const source = searchParams.get("source") || "unknown";
    const paymentId = searchParams.get("payment_id") || searchParams.get("collection_id");

    const [isPolling, setIsPolling] = useState(source === "mercadopago" && !!paymentId);
    const pollCountRef = useRef(0);

    // Poll MercadoPago payment status
    const checkPaymentStatus = useCallback(async () => {
        if (!paymentId || source !== "mercadopago") return;

        try {
            const response = await fetch(`/api/mercadopago/payment-status?payment_id=${paymentId}`);
            if (!response.ok) return;

            const data = await response.json();

            if (data.status === "approved") {
                // Payment confirmed — redirect to success
                const params = new URLSearchParams();
                params.set("source", "mercadopago");
                params.set("payment_id", paymentId);
                if (data.product_type) params.set("product_type", data.product_type);
                router.replace(`/checkout/success?${params.toString()}`);
                return;
            }

            if (data.status === "rejected" || data.status === "cancelled") {
                // Payment failed — redirect to failure
                const params = new URLSearchParams();
                params.set("source", "mercadopago");
                params.set("payment_id", paymentId);
                router.replace(`/checkout/failure?${params.toString()}`);
                return;
            }

            // Still pending — increment counter
            pollCountRef.current += 1;
            if (pollCountRef.current >= MAX_POLL_ATTEMPTS) {
                setIsPolling(false);
            }
        } catch {
            // Silently fail — we'll try again on next interval
        }
    }, [paymentId, source, router]);

    useEffect(() => {
        if (!isPolling) return;

        const interval = setInterval(checkPaymentStatus, POLL_INTERVAL_MS);
        // Also do an immediate first check
        checkPaymentStatus();

        return () => clearInterval(interval);
    }, [isPolling, checkPaymentStatus]);

    return (
        <ContentLayout variant="narrow" className="py-16">
            <div className="flex flex-col items-center text-center space-y-6">
                {/* Pending Icon */}
                <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Clock className="w-12 h-12 text-amber-500" />
                </div>

                {/* Title */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">{t("title")}</h1>
                    <p className="text-muted-foreground text-lg">
                        {t("subtitle")}
                    </p>
                </div>

                {/* Info */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-6 py-4 max-w-md">
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                        {t("info")}
                    </p>
                </div>

                {/* Polling indicator */}
                {isPolling && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{t("checking")}</span>
                    </div>
                )}

                {/* Payment ID */}
                {paymentId && (
                    <div className="bg-muted/50 rounded-lg px-6 py-4 space-y-1">
                        <p className="text-sm text-muted-foreground">{t("paymentId")}</p>
                        <p className="font-mono text-sm">{paymentId}</p>
                    </div>
                )}

                {/* Source */}
                <p className="text-xs text-muted-foreground">
                    {t("processedVia")} <span className="capitalize font-medium">{source}</span>
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button asChild>
                        <Link href="/">
                            <Home className="w-4 h-4 mr-2" />
                            {t("goHome")}
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/contacto">
                            <HelpCircle className="w-4 h-4 mr-2" />
                            {t("contact")}
                        </Link>
                    </Button>
                </div>
            </div>
        </ContentLayout>
    );
}
