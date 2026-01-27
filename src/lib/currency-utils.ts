/**
 * Currency Utilities
 * Enterprise-grade bi-currency calculation functions for SEENCEL
 */

import { Currency, MonetaryAmount, MonetaryBreakdown } from '@/types/currency';

/**
 * Format a monetary amount with proper currency symbol and locale
 * @param decimals - Number of decimal places (0, 1, or 2). Defaults to 2.
 */
export function formatCurrency(
    amount: number,
    currency?: Currency | string,
    locale: string = 'es-AR',
    decimals: number = 2
): string {
    // Protection against NaN or Infinity
    const safeAmount = (isNaN(amount) || !isFinite(amount)) ? 0 : amount;

    const currencyCode = typeof currency === 'string'
        ? currency
        : currency?.code || 'ARS';

    // Clamp decimals to valid range
    const decimalPlaces = Math.max(0, Math.min(2, decimals));

    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
        }).format(safeAmount);
    } catch {
        // Fallback for invalid currency codes
        const symbol = typeof currency === 'object' ? currency?.symbol : '$';
        return `${symbol} ${safeAmount.toLocaleString(locale, {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces
        })}`;
    }
}

/**
 * Convert an amount to functional currency using exchange rate
 * If the amount is in primary currency, rate is 1
 * If the amount is in secondary currency, multiply by rate
 */
export function convertToFunctional(
    amount: number,
    fromCurrencyCode: string,
    primaryCurrencyCode: string,
    exchangeRate: number = 1
): number {
    if (fromCurrencyCode === primaryCurrencyCode) {
        return amount; // Already in functional currency
    }
    return amount * exchangeRate;
}

/**
 * Convert from functional currency to a target currency
 */
export function convertFromFunctional(
    functionalAmount: number,
    toCurrencyCode: string,
    primaryCurrencyCode: string,
    exchangeRate: number = 1
): number {
    if (toCurrencyCode === primaryCurrencyCode) {
        return functionalAmount; // Target is functional currency
    }
    if (exchangeRate === 0) return 0;
    return functionalAmount / exchangeRate;
}

/**
 * Sum monetary amounts correctly, respecting currencies
 * Returns total in functional currency + breakdown by native currency
 */
export function calculateMonetaryBreakdown(
    items: MonetaryAmount[],
    primaryCurrency: Currency
): MonetaryBreakdown {
    // Group by currency
    const byNativeCurrency = new Map<string, {
        currency: Currency;
        amount: number;
        functionalAmount: number;
    }>();

    let totalFunctional = 0;

    for (const item of items) {
        const currencyCode = item.currency.code;

        // Calculate functional amount
        const functionalAmt = item.functionalAmount
            ?? convertToFunctional(
                item.amount,
                currencyCode,
                primaryCurrency.code,
                item.exchangeRate || 1
            );

        totalFunctional += functionalAmt;

        // Add to breakdown
        const existing = byNativeCurrency.get(currencyCode);
        if (existing) {
            existing.amount += item.amount;
            existing.functionalAmount += functionalAmt;
        } else {
            byNativeCurrency.set(currencyCode, {
                currency: item.currency,
                amount: item.amount,
                functionalAmount: functionalAmt,
            });
        }
    }

    return {
        totalFunctional,
        byNativeCurrency: Array.from(byNativeCurrency.values()),
    };
}

/**
 * Safely sum amounts that may be in different currencies
 * Uses functional_amount if available, otherwise converts using exchange_rate
 */
export function sumMonetaryAmounts<T extends {
    amount: number;
    currency_id?: string;
    currency_code?: string;
    exchange_rate?: number | null;
    functional_amount?: number | null;
}>(
    items: T[],
    primaryCurrencyCode: string
): { total: number; hasMultipleCurrencies: boolean } {
    let total = 0;
    const currencies = new Set<string>();

    for (const item of items) {
        const currencyCode = item.currency_code || item.currency_id || primaryCurrencyCode;
        currencies.add(currencyCode);

        // Prefer pre-calculated functional_amount
        if (item.functional_amount != null) {
            total += item.functional_amount;
        } else if (currencyCode === primaryCurrencyCode) {
            total += item.amount;
        } else {
            // Convert using exchange rate
            total += item.amount * (item.exchange_rate || 1);
        }
    }

    return {
        total,
        hasMultipleCurrencies: currencies.size > 1,
    };
}

/**
 * Get breakdown of amounts by currency for display
 */
export function getAmountsByCurrency<T extends {
    amount: number;
    currency_code?: string;
    currency_symbol?: string;
    exchange_rate?: number | null;
    functional_amount?: number | null;
}>(
    items: T[],
    primaryCurrencyCode: string
): Array<{
    currencyCode: string;
    symbol: string;
    nativeTotal: number;
    functionalTotal: number;
    isPrimary: boolean;
}> {
    const breakdown = new Map<string, {
        currencyCode: string;
        symbol: string;
        nativeTotal: number;
        functionalTotal: number;
        isPrimary: boolean;
    }>();

    for (const item of items) {
        const currencyCode = item.currency_code || primaryCurrencyCode;
        const symbol = item.currency_symbol || '$';
        const isPrimary = currencyCode === primaryCurrencyCode;

        const functionalAmt = item.functional_amount
            ?? (isPrimary ? item.amount : item.amount * (item.exchange_rate || 1));

        const existing = breakdown.get(currencyCode);
        if (existing) {
            existing.nativeTotal += item.amount;
            existing.functionalTotal += functionalAmt;
        } else {
            breakdown.set(currencyCode, {
                currencyCode,
                symbol,
                nativeTotal: item.amount,
                functionalTotal: functionalAmt,
                isPrimary,
            });
        }
    }

    // Sort: Primary first, then others alphabetically
    return Array.from(breakdown.values()).sort((a, b) => {
        if (a.isPrimary) return -1;
        if (b.isPrimary) return 1;
        return a.currencyCode.localeCompare(b.currencyCode);
    });
}

