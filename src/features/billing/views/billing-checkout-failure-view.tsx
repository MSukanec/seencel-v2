"use client";

import { useSearchParams } from "next/navigation";
import { ContentLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { XCircle, RotateCcw, HelpCircle } from "lucide-react";
import Link from "next/link";

export function BillingCheckoutFailureView() {
    const searchParams = useSearchParams();

    const source = searchParams.get("source") || "unknown";
    const paymentId = searchParams.get("payment_id") || searchParams.get("collection_id") || searchParams.get("token");
    const errorMessage = searchParams.get("error");

    return (
        <ContentLayout variant="narrow" className="py-16">
            <div className="flex flex-col items-center text-center space-y-6">
                {/* Failure Icon */}
                <div className="w-20 h-20 rounded-full bg-amount-negative/10 flex items-center justify-center">
                    <XCircle className="w-12 h-12 text-amount-negative" />
                </div>

                {/* Title */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">Pago No Completado</h1>
                    <p className="text-muted-foreground text-lg">
                        Hubo un problema con tu pago
                    </p>
                </div>

                {/* Error Message */}
                <div className="bg-amount-negative/10 border border-amount-negative/20 rounded-lg px-6 py-4 max-w-md">
                    <p className="text-sm">
                        {errorMessage
                            ? decodeURIComponent(errorMessage)
                            : "El pago fue rechazado o cancelado. No se realizó ningún cargo a tu cuenta."
                        }
                    </p>
                </div>

                {/* Payment ID */}
                {paymentId && (
                    <div className="bg-muted/50 rounded-lg px-6 py-4 space-y-1">
                        <p className="text-sm text-muted-foreground">ID de Referencia</p>
                        <p className="font-mono text-sm">{paymentId}</p>
                    </div>
                )}

                {/* Source */}
                <p className="text-xs text-muted-foreground">
                    Gateway: <span className="capitalize font-medium">{source}</span>
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button asChild>
                        <Link href="/checkout">
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Reintentar Pago
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/contacto">
                            <HelpCircle className="w-4 h-4 mr-2" />
                            Contactar
                        </Link>
                    </Button>
                </div>
            </div>
        </ContentLayout>
    );
}
