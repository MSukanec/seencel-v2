"use client";

/**
 * useSmartCurrency - Global Hook for Multi-Currency Display
 * 
 * This hook provides consistent logic for displaying amounts when the user
 * switches between currencies (e.g., ARS ↔ USD).
 * 
 * RULES:
 * - When displaying in SECONDARY currency (e.g., USD):
 *   - If payment is in USD → use ORIGINAL amount (preserves historical value)
 *   - If payment is in ARS → convert functional_amount / currentRate
 * 
 * - When displaying in PRIMARY currency (e.g., ARS):
 *   - Always use functional_amount (historical ARS value)
 * 
 * USE CASES:
 * - KPIs and aggregated totals
 * - Charts and visualizations
 * - Insights and analytics
 * 
 * DO NOT USE FOR:
 * - Tables showing individual transactions (show original values)
 * - Forms and inputs
 * - Export data
 */

import { useMemo, useCallback } from "react";
import { useCurrencyOptional } from "@/providers/currency-context";

export interface MonetaryItem {
    amount: number;
    functional_amount?: number | null;
    currency_code?: string | null;
    exchange_rate?: number | null;
}

export interface SmartCurrencyResult {
    /** Calculate display amount for a single item */
    calculateDisplayAmount: (item: MonetaryItem) => number;

    /** Sum display amounts for an array of items */
    sumDisplayAmounts: <T extends MonetaryItem>(items: T[]) => number;

    /** Group and sum by a key (e.g., client_name, month) */
    groupAndSum: <T extends MonetaryItem>(
        items: T[],
        keyFn: (item: T) => string
    ) => Record<string, number>;

    /** Current display currency code */
    displayCurrencyCode: string;

    /** Whether we're displaying in secondary currency */
    isSecondaryDisplay: boolean;

    /** Current exchange rate being used */
    currentRate: number;

    /** Primary currency code */
    primaryCurrencyCode: string;
}

export function useSmartCurrency(): SmartCurrencyResult {
    const currencyContext = useCurrencyOptional();

    // Derive values from context
    const primaryCurrencyCode = currencyContext?.primaryCurrency?.code || 'ARS';
    const displayCurrency = currencyContext?.displayCurrency || 'primary';
    const isSecondaryDisplay = displayCurrency === 'secondary' && !!currencyContext?.secondaryCurrency;

    // Get current rate with fallbacks
    const currentRate = useMemo(() => {
        let rate = currencyContext?.currentExchangeRate || 0;

        // Fallback to static rate from secondary currency if current rate is not set (is default 0 or 1)
        // AND if we are actually in secondary display mode (to avoid applying it randomly)
        if (rate <= 1 && currencyContext?.secondaryCurrency?.exchange_rate) {
            rate = currencyContext.secondaryCurrency.exchange_rate;
        }

        // Safety: never use 0 or negative rates
        return rate > 0 ? rate : 1;
    }, [currencyContext?.currentExchangeRate, currencyContext?.secondaryCurrency?.exchange_rate]);

    const secondaryCurrencyCode = currencyContext?.secondaryCurrency?.code || 'USD';
    const displayCurrencyCode = isSecondaryDisplay ? secondaryCurrencyCode : primaryCurrencyCode;

    /**
     * Calculate the display amount for a single monetary item
     */
    const calculateDisplayAmount = useCallback((item: MonetaryItem): number => {
        const itemCurrencyCode = item.currency_code || primaryCurrencyCode;
        const functional = Number(item.functional_amount) || Number(item.amount) || 0;
        const original = Number(item.amount) || 0;

        if (isSecondaryDisplay) {
            // Displaying in SECONDARY currency (e.g., USD)
            if (itemCurrencyCode === secondaryCurrencyCode) {
                // Item IS in secondary currency → use original value
                return original;
            } else {
                // Item IS in primary currency → convert from functional
                // CRITICAL SAFETY: If rate is <= 1, we are missing a valid conversion rate.
                // Do NOT return functional (ARS) amount disguised as USD.
                // Return 0 to indicate "Unavailable conversion" rather than false millions.
                if (currentRate <= 1) {
                    return 0;
                }
                return functional / currentRate;
            }
        } else {
            // Displaying in PRIMARY currency (e.g., ARS)
            // Always use functional amount (historical value)
            return functional;
        }
    }, [isSecondaryDisplay, secondaryCurrencyCode, primaryCurrencyCode, currentRate]);

    /**
     * Sum display amounts for an array of items
     */
    const sumDisplayAmounts = useCallback(<T extends MonetaryItem>(items: T[]): number => {
        if (!items || items.length === 0) return 0;
        return items.reduce((acc, item) => acc + calculateDisplayAmount(item), 0);
    }, [calculateDisplayAmount]);

    /**
     * Group items by a key and sum their display amounts
     */
    const groupAndSum = useCallback(<T extends MonetaryItem>(
        items: T[],
        keyFn: (item: T) => string
    ): Record<string, number> => {
        if (!items || items.length === 0) return {};

        return items.reduce((acc, item) => {
            const key = keyFn(item);
            acc[key] = (acc[key] || 0) + calculateDisplayAmount(item);
            return acc;
        }, {} as Record<string, number>);
    }, [calculateDisplayAmount]);

    return {
        calculateDisplayAmount,
        sumDisplayAmounts,
        groupAndSum,
        displayCurrencyCode,
        isSecondaryDisplay,
        currentRate,
        primaryCurrencyCode,
    };
}
