/**
 * Money Service - Single Source of Truth for Currency Conversions
 * 
 * This service handles ALL monetary calculations in SEENCEL:
 * - Currency conversions (bidirectional)
 * - Summing amounts across currencies
 * - Calculating display values based on view mode
 * 
 * NO OTHER FILE should implement conversion logic.
 */

import {
    Money,
    MoneyConfig,
    MoneyInput,
    DisplayMode,
    createMoney,
    zeroMoney
} from './money';

/**
 * Result of a currency breakdown calculation
 */
export interface CurrencyBreakdown {
    currencyCode: string;
    symbol: string;
    nativeTotal: number;
    isPrimary: boolean;
}

/**
 * Result of summing money items
 */
export interface MoneySum {
    /** Total in the target currency */
    total: number;

    /** Breakdown by original currency */
    breakdown: CurrencyBreakdown[];

    /** Number of items processed */
    count: number;
}

/**
 * Convert Money to functional (primary) currency
 * 
 * BIDIRECTIONAL LOGIC:
 * - If money is in functional currency → return as-is
 * - If money is in secondary currency → multiply by exchange rate
 * 
 * @example
 * // USD to ARS (exchange_rate = 1200)
 * const usd = createMoney({ amount: 100, currency_code: 'USD', exchange_rate: 1200 }, config);
 * const ars = convertToFunctional(usd, config);
 * // ars = 120000 ARS
 */
export function convertToFunctional(money: Money, config: MoneyConfig): number {
    if (money.isFunctional) {
        return money.amount;
    }
    // Secondary → Functional: multiply by rate
    const rate = money.exchangeRate > 0 ? money.exchangeRate : config.currentExchangeRate;
    return money.amount * rate;
}

/**
 * Convert Money to secondary currency
 * 
 * BIDIRECTIONAL LOGIC:
 * - If money is in secondary currency → return as-is
 * - If money is in functional currency → divide by exchange rate
 * 
 * @example
 * // ARS to USD (current rate = 1200)
 * const ars = createMoney({ amount: 120000, currency_code: 'ARS' }, config);
 * const usd = convertToSecondary(ars, config);
 * // usd = 100 USD
 */
export function convertToSecondary(money: Money, config: MoneyConfig): number {
    if (money.currencyCode === config.secondaryCurrencyCode) {
        return money.amount;
    }
    // Functional → Secondary: divide by rate
    // Use the item's exchange rate if available, otherwise current rate
    const rate = money.exchangeRate > 0 ? money.exchangeRate : config.currentExchangeRate;
    if (rate <= 0) return money.amount; // Safety: don't divide by zero
    return money.amount / rate;
}

/**
 * Calculate the display amount based on current display mode
 * 
 * This is the MAIN function components should use for displaying values.
 * 
 * @param money - The Money object to display
 * @param mode - Current display mode ('mix' | 'functional' | 'secondary')
 * @param config - Money configuration
 * @returns The amount to display (already converted if needed)
 * 
 * @example
 * // In 'functional' mode (ARS), show everything in ARS
 * const display = calculateDisplayAmount(money, 'functional', config);
 * 
 * // In 'secondary' mode (USD), convert ARS to USD
 * const display = calculateDisplayAmount(money, 'secondary', config);
 * 
 * // In 'mix' mode, return original amount (no conversion)
 * const display = calculateDisplayAmount(money, 'mix', config);
 */
export function calculateDisplayAmount(
    money: Money,
    mode: DisplayMode,
    config: MoneyConfig
): number {
    switch (mode) {
        case 'mix':
            // Mix mode: return original amount (no conversion)
            // Components should group by currency and show breakdown
            return money.amount;

        case 'functional':
            // Functional mode: everything in primary currency
            return convertToFunctional(money, config);

        case 'secondary':
            // Secondary mode: everything in secondary currency
            return convertToSecondary(money, config);

        default:
            return money.amount;
    }
}

/**
 * Sum an array of Money items with proper currency handling
 * 
 * @param items - Array of MoneyInput objects (from database)
 * @param mode - Display mode for the sum
 * @param config - Money configuration
 * @returns MoneySum with total and breakdown
 * 
 * @example
 * const movements = [
 *   { amount: 1000, currency_code: 'USD', exchange_rate: 1200 },
 *   { amount: 50000, currency_code: 'ARS', exchange_rate: 1 },
 * ];
 * 
 * const result = sumMoney(movements, 'functional', config);
 * // result.total = 1250000 (1000*1200 + 50000)
 * // result.breakdown = [
 * //   { currencyCode: 'ARS', nativeTotal: 50000 },
 * //   { currencyCode: 'USD', nativeTotal: 1000 },
 * // ]
 */
export function sumMoney(
    items: MoneyInput[],
    mode: DisplayMode,
    config: MoneyConfig
): MoneySum {
    if (!items || items.length === 0) {
        return { total: 0, breakdown: [], count: 0 };
    }

    const breakdownMap = new Map<string, CurrencyBreakdown>();
    let total = 0;

    for (const item of items) {
        const money = createMoney(item, config);
        const displayAmount = calculateDisplayAmount(money, mode, config);

        // Accumulate total
        total += displayAmount;

        // Track breakdown by currency (always native amounts)
        const existing = breakdownMap.get(money.currencyCode);
        if (existing) {
            existing.nativeTotal += money.amount;
        } else {
            breakdownMap.set(money.currencyCode, {
                currencyCode: money.currencyCode,
                symbol: money.symbol,
                nativeTotal: money.amount,
                isPrimary: money.isFunctional,
            });
        }
    }

    // Sort breakdown: primary first, then alphabetically
    const breakdown = Array.from(breakdownMap.values()).sort((a, b) => {
        if (a.isPrimary) return -1;
        if (b.isPrimary) return 1;
        return a.currencyCode.localeCompare(b.currencyCode);
    });

    return {
        total,
        breakdown,
        count: items.length,
    };
}

/**
 * Sum Money items with a sign (for ingresos vs egresos)
 * 
 * @param items - Array with amount, currency, exchange_rate, and amount_sign
 * @param mode - Display mode
 * @param config - Money configuration
 * @returns Object with ingresos, egresos, and balance
 */
export function sumMoneyWithSign(
    items: (MoneyInput & { amount_sign?: number | null })[],
    mode: DisplayMode,
    config: MoneyConfig
): {
    ingresos: MoneySum;
    egresos: MoneySum;
    balance: number;
} {
    const ingresosItems: MoneyInput[] = [];
    const egresosItems: MoneyInput[] = [];

    for (const item of items) {
        const sign = Number(item.amount_sign ?? 1);
        if (sign > 0) {
            ingresosItems.push(item);
        } else {
            egresosItems.push(item);
        }
    }

    const ingresos = sumMoney(ingresosItems, mode, config);
    const egresos = sumMoney(egresosItems, mode, config);
    const balance = ingresos.total - egresos.total;

    return { ingresos, egresos, balance };
}

/**
 * Group Money items by a key function and sum each group
 * 
 * @param items - Array of items to group
 * @param keyFn - Function to extract grouping key from each item
 * @param mode - Display mode
 * @param config - Money configuration
 * @returns Map of key to MoneySum
 */
export function groupAndSumMoney<T extends MoneyInput>(
    items: T[],
    keyFn: (item: T) => string,
    mode: DisplayMode,
    config: MoneyConfig
): Map<string, MoneySum> {
    const groups = new Map<string, T[]>();

    // Group items by key
    for (const item of items) {
        const key = keyFn(item);
        const group = groups.get(key) || [];
        group.push(item);
        groups.set(key, group);
    }

    // Sum each group
    const result = new Map<string, MoneySum>();
    for (const [key, groupItems] of groups) {
        result.set(key, sumMoney(groupItems, mode, config));
    }

    return result;
}
