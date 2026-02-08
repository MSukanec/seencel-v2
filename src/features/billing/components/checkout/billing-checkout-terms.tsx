"use client";

// ============================================================
// BILLING CHECKOUT TERMS
// ============================================================
// Checkboxes para términos y condiciones
// ============================================================

import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "@/i18n/routing";

// ============================================================
// PROPS
// ============================================================

interface BillingCheckoutTermsProps {
    acceptedTerms: boolean;
    acceptedCommunications: boolean;
    onTermsChange: (accepted: boolean) => void;
    onCommunicationsChange: (accepted: boolean) => void;
    productLabel?: string; // "curso" | "suscripción" | "asientos"
}

// ============================================================
// COMPONENT
// ============================================================

export function BillingCheckoutTerms({
    acceptedTerms,
    acceptedCommunications,
    onTermsChange,
    onCommunicationsChange,
    productLabel = "suscripción",
}: BillingCheckoutTermsProps) {
    return (
        <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3">
                <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => onTermsChange(checked === true)}
                />
                <label
                    htmlFor="terms"
                    className="text-xs text-muted-foreground leading-tight cursor-pointer"
                >
                    Acepto los{" "}
                    <Link href="/terms" className="text-primary hover:underline">
                        Términos y Condiciones
                    </Link>
                    , la{" "}
                    <Link href="/privacy" className="text-primary hover:underline">
                        Política de Privacidad
                    </Link>{" "}
                    y la{" "}
                    <Link href="/terms" className="text-primary hover:underline">
                        Política de Reembolsos
                    </Link>
                    . Acepto recibir acceso inmediato al servicio.
                </label>
            </div>
            <div className="flex items-start gap-3">
                <Checkbox
                    id="communications"
                    checked={acceptedCommunications}
                    onCheckedChange={(checked) => onCommunicationsChange(checked === true)}
                />
                <label
                    htmlFor="communications"
                    className="text-xs text-muted-foreground leading-tight cursor-pointer"
                >
                    Acepto recibir comunicaciones sobre mi {productLabel}
                </label>
            </div>
        </div>
    );
}
