"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { usePanel } from "@/stores/panel-store";
import { CurrencyField, AmountField } from "@/components/shared/forms/fields";
import { upsertLaborPrice } from "../actions";
import { LaborTypeWithPrice } from "../types";
import { toast } from "sonner";
import { DollarSign } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface Currency {
    id: string;
    code: string;
    symbol: string;
    name: string;
}

export interface LaborPriceFormProps {
    laborType: LaborTypeWithPrice;
    organizationId: string;
    currencies: Currency[];
    defaultCurrencyId: string;
    /** Inyectado por PanelProvider */
    formId?: string;
}

// ============================================================================
// Component (Self-Contained — Panel Pattern)
// ============================================================================

export function LaborPriceForm({
    laborType,
    organizationId,
    currencies,
    defaultCurrencyId,
    formId,
}: LaborPriceFormProps) {
    const router = useRouter();
    const { closePanel, setPanelMeta, setSubmitting } = usePanel();

    // Form state
    const [price, setPrice] = useState<string>(
        laborType.current_price?.toString() || ""
    );
    const [currencyId, setCurrencyId] = useState<string>(
        laborType.currency_id || defaultCurrencyId
    );

    // Panel metadata
    useEffect(() => {
        setPanelMeta({
            title: laborType.current_price != null ? "Editar Precio" : "Establecer Precio",
            description: `Define el costo por ${laborType.unit_name || 'unidad'} para "${laborType.name}"`,
            icon: DollarSign,
            footer: {
                submitLabel: "Guardar Precio",
            },
        });
    }, [laborType, setPanelMeta]);

    // Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const numericPrice = parseFloat(price);
        if (isNaN(numericPrice) || numericPrice < 0) {
            toast.error("Ingresá un precio válido");
            return;
        }

        setSubmitting(true);
        try {
            const result = await upsertLaborPrice({
                organization_id: organizationId,
                labor_type_id: laborType.id,
                unit_price: numericPrice,
                currency_id: currencyId,
            });

            if (!result.success) {
                toast.error(result.error || "Error al guardar precio");
                return;
            }

            toast.success("Precio guardado correctamente");
            closePanel();
            router.refresh();
        } catch (error) {
            toast.error("Error inesperado");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" id={formId}>
            {/* Labor Type Info (readonly) */}
            <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                <p className="font-medium text-sm">{laborType.name}</p>
                <p className="text-xs text-muted-foreground">
                    {[laborType.category_name, laborType.level_name, laborType.role_name]
                        .filter(Boolean)
                        .join(' • ')}
                </p>
            </div>

            {/* Currency Selector */}
            <CurrencyField
                value={currencyId}
                onChange={setCurrencyId}
                currencies={currencies}
            />

            {/* Price Input */}
            <AmountField
                value={price}
                onChange={setPrice}
                label={`Precio por ${laborType.unit_name || 'unidad'}`}
                placeholder="0.00"
            />
        </form>
    );
}
