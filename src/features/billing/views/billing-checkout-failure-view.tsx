"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ContentLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { XCircle, RotateCcw, HelpCircle } from "lucide-react";
import Link from "next/link";

export function BillingCheckoutFailureView() {
    const searchParams = useSearchParams();
    const t = useTranslations("BillingResults.failure");

    const source = searchParams.get("source") || "unknown";
    const paymentId = searchParams.get("payment_id") || searchParams.get("collection_id") || searchParams.get("token");
    const errorMessage = searchParams.get("error");

    // Preserve checkout context for retry — pass through product_type, plan_id, course_id
    const productType = searchParams.get("product_type");
    const planId = searchParams.get("plan_id");
    const courseId = searchParams.get("course_id");

    // Build retry URL with context so user doesn't lose their selection
    const retryParams = new URLSearchParams();
    if (productType) retryParams.set("product_type", productType);
    if (planId) retryParams.set("plan_id", planId);
    if (courseId) retryParams.set("course_id", courseId);
    const retryUrl = retryParams.toString() ? `/checkout?${retryParams.toString()}` : "/checkout";

    return (
        <ContentLayout variant="narrow" className="py-16">
            <div className="flex flex-col items-center text-center space-y-6">
                {/* Failure Icon */}
                <div className="w-20 h-20 rounded-full bg-amount-negative/10 flex items-center justify-center">
                    <XCircle className="w-12 h-12 text-amount-negative" />
                </div>

                {/* Title */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">{t("title")}</h1>
                    <p className="text-muted-foreground text-lg">
                        {t("subtitle")}
                    </p>
                </div>

                {/* Error Message */}
                <div className="bg-amount-negative/10 border border-amount-negative/20 rounded-lg px-6 py-4 max-w-md">
                    <p className="text-sm">
                        {errorMessage
                            ? decodeURIComponent(errorMessage)
                            : t("defaultError")
                        }
                    </p>
                </div>

                {/* Payment ID */}
                {paymentId && (
                    <div className="bg-muted/50 rounded-lg px-6 py-4 space-y-1">
                        <p className="text-sm text-muted-foreground">{t("referenceId")}</p>
                        <p className="font-mono text-sm">{paymentId}</p>
                    </div>
                )}

                {/* Source */}
                <p className="text-xs text-muted-foreground">
                    {t("gateway")}: <span className="capitalize font-medium">{source}</span>
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button asChild>
                        <Link href={retryUrl}>
                            <RotateCcw className="w-4 h-4 mr-2" />
                            {t("retryPayment")}
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
