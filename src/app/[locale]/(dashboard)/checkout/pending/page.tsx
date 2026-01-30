"use client";

import { useSearchParams } from "next/navigation";
import { ContentLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Clock, Home, HelpCircle } from "lucide-react";
import Link from "next/link";

export default function CheckoutPendingPage() {
    const searchParams = useSearchParams();

    const source = searchParams.get("source") || "unknown";
    const paymentId = searchParams.get("payment_id") || searchParams.get("collection_id");

    return (
        <ContentLayout variant="narrow" className="py-16">
            <div className="flex flex-col items-center text-center space-y-6">
                {/* Pending Icon */}
                <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Clock className="w-12 h-12 text-amber-500" />
                </div>

                {/* Title */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">Pago Pendiente</h1>
                    <p className="text-muted-foreground text-lg">
                        Tu pago está siendo procesado
                    </p>
                </div>

                {/* Info */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-6 py-4 max-w-md">
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                        El pago puede tardar unos minutos en confirmarse.
                        Recibirás un email cuando se complete.
                    </p>
                </div>

                {/* Payment ID */}
                {paymentId && (
                    <div className="bg-muted/50 rounded-lg px-6 py-4 space-y-1">
                        <p className="text-sm text-muted-foreground">ID de Pago</p>
                        <p className="font-mono text-sm">{paymentId}</p>
                    </div>
                )}

                {/* Source */}
                <p className="text-xs text-muted-foreground">
                    Procesado via <span className="capitalize font-medium">{source}</span>
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button asChild>
                        <Link href="/">
                            <Home className="w-4 h-4 mr-2" />
                            Ir al Inicio
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
