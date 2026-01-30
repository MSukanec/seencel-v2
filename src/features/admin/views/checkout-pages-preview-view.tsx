"use client";

import { useState } from "react";
import { CheckCircle2, Clock, XCircle, ExternalLink, GraduationCap, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type PageType = "success-plan" | "success-course" | "pending" | "failure";

const pages: { id: PageType; label: string; icon: React.ElementType; description: string }[] = [
    {
        id: "success-plan",
        label: "Éxito (Plan)",
        icon: CreditCard,
        description: "Compra de suscripción o plan aprobada",
    },
    {
        id: "success-course",
        label: "Éxito (Curso)",
        icon: GraduationCap,
        description: "Compra de curso individual aprobada",
    },
    {
        id: "pending",
        label: "Pago Pendiente",
        icon: Clock,
        description: "Pago en proceso de verificación",
    },
    {
        id: "failure",
        label: "Pago Fallido",
        icon: XCircle,
        description: "Pago rechazado o cancelado",
    },
];

export function CheckoutPagesPreviewView() {
    const [selectedPage, setSelectedPage] = useState<PageType>("success-plan");

    // Build preview URLs with query params
    const getPreviewUrl = (pageType: PageType) => {
        // Determine base URL and params based on page type
        if (pageType === "success-plan") {
            const params = new URLSearchParams({
                source: "mercadopago",
                payment_id: "1234567890",
                status: "approved",
                product_type: "subscription",
            });
            return `/checkout/success?${params.toString()}`;
        }

        if (pageType === "success-course") {
            const params = new URLSearchParams({
                source: "mercadopago",
                payment_id: "1234567890",
                status: "approved",
                product_type: "course",
                course_id: "example-course-id",
            });
            return `/checkout/success?${params.toString()}`;
        }

        const params = new URLSearchParams({
            source: "mercadopago",
            payment_id: "1234567890",
            status: pageType === "pending" ? "pending" : "rejected",
        });
        return `/checkout/${pageType}?${params.toString()}`;
    };

    const getDisplayPath = (pageType: PageType) => {
        if (pageType.startsWith("success")) return "/checkout/success";
        return `/checkout/${pageType}`;
    };

    return (
        <div className="space-y-6">
            {/* Page Type Selector */}
            <div className="flex flex-wrap gap-3">
                {pages.map((page) => {
                    const Icon = page.icon;
                    const isSelected = selectedPage === page.id;
                    return (
                        <button
                            key={page.id}
                            onClick={() => setSelectedPage(page.id)}
                            className={`
                                flex flex-col gap-2 p-4 rounded-xl border-2 transition-all min-w-[180px]
                                ${isSelected
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50 bg-card"
                                }
                            `}
                        >
                            <div className="flex items-center gap-2">
                                <Icon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                                <span className={`font-medium ${isSelected ? "text-primary" : "text-foreground"}`}>
                                    {page.label}
                                </span>
                            </div>
                            <span className="text-xs text-muted-foreground text-left">
                                {page.description}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Preview Actions */}
            <div className="flex items-center gap-3">
                <Button asChild>
                    <Link href={getPreviewUrl(selectedPage)} target="_blank">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver Preview
                    </Link>
                </Button>
                <span className="text-sm text-muted-foreground">
                    Se abrirá en una nueva pestaña con parámetros de ejemplo
                </span>
            </div>

            {/* Preview iframe */}
            <div className="border rounded-xl overflow-hidden bg-background">
                <div className="bg-muted/50 border-b px-4 py-2 flex items-center justify-between">
                    <span className="text-sm font-medium">Vista Previa</span>
                    <span className="text-xs text-muted-foreground font-mono">
                        {getDisplayPath(selectedPage)}
                    </span>
                </div>
                <div className="aspect-video bg-card">
                    <iframe
                        key={selectedPage}
                        src={getPreviewUrl(selectedPage)}
                        className="w-full h-full border-0"
                        title={`Preview de página ${selectedPage}`}
                    />
                </div>
            </div>
        </div>
    );
}
