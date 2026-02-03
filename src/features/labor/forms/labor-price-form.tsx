"use client";

import { useState } from "react";
import { FormGroup } from "@/components/ui/form-group";
import { Input } from "@/components/ui/input";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    onSuccess?: () => void;
    onCancel?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function LaborPriceForm({
    laborType,
    organizationId,
    currencies,
    defaultCurrencyId,
    onSuccess,
    onCancel,
}: LaborPriceFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [price, setPrice] = useState<string>(
        laborType.current_price?.toString() || ""
    );
    const [currencyId, setCurrencyId] = useState<string>(
        laborType.currency_id || defaultCurrencyId
    );

    const selectedCurrency = currencies.find(c => c.id === currencyId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const numericPrice = parseFloat(price);
        if (isNaN(numericPrice) || numericPrice < 0) {
            toast.error("Ingresá un precio válido");
            return;
        }

        setIsLoading(true);
        try {
            const result = await upsertLaborPrice({
                organization_id: organizationId,
                labor_type_id: laborType.id,
                unit_price: numericPrice,
                currency_id: currencyId,
            });

            if (result.success) {
                onSuccess?.();
            } else {
                toast.error(result.error || "Error al guardar precio");
            }
        } catch (error) {
            toast.error("Error inesperado");
        } finally {
            setIsLoading(false);
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
                    <FormGroup label="Moneda">
                        <Select value={currencyId} onValueChange={setCurrencyId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar moneda" />
                            </SelectTrigger>
                            <SelectContent>
                                {currencies.map((currency) => (
                                    <SelectItem key={currency.id} value={currency.id}>
                                        {currency.code} - {currency.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormGroup>

                    {/* Price Input */}
                    <FormGroup label={`Precio por ${laborType.unit_name || 'unidad'}`}>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                {selectedCurrency?.symbol || '$'}
                            </span>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="pl-8 font-mono"
                                placeholder="0.00"
                                autoFocus
                            />
                        </div>
                    </FormGroup>
                </div>
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isLoading}
                submitLabel="Guardar Precio"
                onCancel={onCancel}
            />
        </form>
    );
}
