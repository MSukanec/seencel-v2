"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useModal } from "@/stores/modal-store";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { CurrencyField, AmountField } from "@/components/shared/forms/fields";
import { upsertLaborPrice } from "../actions";
import { LaborTypeWithPrice } from "../types";
import { toast } from "sonner";

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
}

// ============================================================================
// Component (Semi-Autónomo)
// ============================================================================

export function LaborPriceForm({
    laborType,
    organizationId,
    currencies,
    defaultCurrencyId,
}: LaborPriceFormProps) {
    const router = useRouter();
    const { closeModal } = useModal();
    const [isLoading, setIsLoading] = useState(false);
    const [price, setPrice] = useState<string>(
        laborType.current_price?.toString() || ""
    );
    const [currencyId, setCurrencyId] = useState<string>(
        laborType.currency_id || defaultCurrencyId
    );

    // Callbacks internos (patrón semi-autónomo)
    const handleCancel = () => {
        closeModal();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const numericPrice = parseFloat(price);
        if (isNaN(numericPrice) || numericPrice < 0) {
            toast.error("Ingresá un precio válido");
            return;
        }

        setIsLoading(true);
        try {
            // Close modal immediately for optimistic UX
            closeModal();
            toast.promise(
                upsertLaborPrice({
                    organization_id: organizationId,
                    labor_type_id: laborType.id,
                    unit_price: numericPrice,
                    currency_id: currencyId,
                }).then(result => {
                    if (!result.success) throw new Error(result.error || "Error al guardar precio");
                    router.refresh();
                    return result;
                }),
                {
                    loading: "Guardando precio...",
                    success: "Precio guardado correctamente",
                    error: (err) => err.message || "Error inesperado",
                }
            );
        } catch (error) {
            toast.error("Error inesperado");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 gap-4">
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
                </div>
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isLoading}
                submitLabel="Guardar Precio"
                onCancel={handleCancel}
            />
        </form>
    );
}
