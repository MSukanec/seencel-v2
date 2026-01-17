"use client";

import { useCurrencyOptional } from "@/providers/currency-context";
import { formatCurrency } from "@/lib/currency-utils";
import { useCallback } from "react";

/**
 * Hook that provides currency formatting with organization's decimal preference
 * Falls back to 2 decimals if context is unavailable
 */
export function useFormatCurrency() {
    const context = useCurrencyOptional();
    const decimalPlaces = context?.decimalPlaces ?? 2;

    const format = useCallback((
        amount: number,
        currencyCode?: string,
        options?: { forceDecimals?: number }
    ): string => {
        const decimals = options?.forceDecimals ?? decimalPlaces;
        return formatCurrency(amount, currencyCode, 'es-AR', decimals);
    }, [decimalPlaces]);

    /**
     * Format a raw number with locale and decimal preference (no currency symbol)
     */
    const formatNumber = useCallback((
        amount: number,
        options?: { forceDecimals?: number }
    ): string => {
        const decimals = options?.forceDecimals ?? decimalPlaces;
        return amount.toLocaleString('es-AR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }, [decimalPlaces]);

    return {
        format,
        formatNumber,
        decimalPlaces
    };
}
