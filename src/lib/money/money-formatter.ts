/**
 * Money Formatter - Centralized Currency Formatting
 * 
 * This is the ONLY place where monetary values should be formatted for display.
 * It respects the organization's decimal preference and locale settings.
 * 
 * NO OTHER FILE should use Intl.NumberFormat or toLocaleString for money.
 */

import { Money, MoneyConfig } from './money';

/**
 * Options for formatting money
 */
export interface FormatOptions {
    /** Override decimal places (0, 1, or 2) */
    decimals?: number;

    /** Show currency symbol (default: true) */
    showSymbol?: boolean;

    /** Show sign for positive values (default: false) */
    showPositiveSign?: boolean;

    /** Compact large numbers (e.g., 1.5M instead of 1,500,000) */
    compact?: boolean;
}

/**
 * Format a Money object for display
 * 
 * @param money - Money object to format
 * @param config - Money configuration with decimal preferences
 * @param options - Optional formatting overrides
 * @returns Formatted string (e.g., "$ 1.234.567,89")
 * 
 * @example
 * const formatted = formatMoney(money, config);
 * // "$ 1.234.567,89"
 * 
 * const compact = formatMoney(money, config, { compact: true });
 * // "$ 1,2 M"
 */
export function formatMoney(
    money: Money,
    config: MoneyConfig,
    options: FormatOptions = {}
): string {
    const {
        decimals = config.decimalPlaces,
        showSymbol = true,
        showPositiveSign = false,
        compact = false,
    } = options;

    // Handle invalid amounts
    const amount = isNaN(money.amount) || !isFinite(money.amount) ? 0 : money.amount;

    // Format the number
    const formattedNumber = formatNumber(amount, config.locale, decimals, compact);

    // Build result
    let result = '';

    if (showPositiveSign && amount > 0) {
        result += '+';
    }

    if (showSymbol) {
        result += `${money.symbol} ${formattedNumber}`;
    } else {
        result += formattedNumber;
    }

    return result;
}

/**
 * Format a raw number as currency (when you don't have a Money object)
 * 
 * @param amount - Numeric amount
 * @param currencyCode - Currency code for the symbol
 * @param config - Money configuration
 * @param options - Formatting options
 * @returns Formatted string
 */
export function formatAmount(
    amount: number,
    currencyCode: string,
    config: MoneyConfig,
    options: FormatOptions = {}
): string {
    // Handle invalid amounts
    const safeAmount = isNaN(amount) || !isFinite(amount) ? 0 : amount;

    const {
        decimals = config.decimalPlaces,
        showSymbol = true,
        showPositiveSign = false,
        compact = false,
    } = options;

    // Determine symbol
    let symbol = '$';
    if (currencyCode === config.functionalCurrencyCode) {
        symbol = config.functionalCurrencySymbol;
    } else if (currencyCode === config.secondaryCurrencyCode) {
        symbol = config.secondaryCurrencySymbol;
    }

    // Format the number
    const formattedNumber = formatNumber(safeAmount, config.locale, decimals, compact);

    // Build result
    let result = '';

    if (showPositiveSign && safeAmount > 0) {
        result += '+';
    }

    if (showSymbol) {
        result += `${symbol} ${formattedNumber}`;
    } else {
        result += formattedNumber;
    }

    return result;
}

/**
 * Format a number using Intl.NumberFormat
 * 
 * @param value - Number to format
 * @param locale - Locale string (e.g., 'es-AR')
 * @param decimals - Number of decimal places
 * @param compact - Use compact notation for large numbers
 * @returns Formatted number string
 */
function formatNumber(
    value: number,
    locale: string,
    decimals: number,
    compact: boolean
): string {
    // Clamp decimals to valid range
    const decimalPlaces = Math.max(0, Math.min(2, decimals));

    const options: Intl.NumberFormatOptions = {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
    };

    if (compact) {
        options.notation = 'compact';
        options.compactDisplay = 'short';
    }

    try {
        return new Intl.NumberFormat(locale, options).format(value);
    } catch {
        // Fallback for invalid locales
        return value.toFixed(decimalPlaces);
    }
}

/**
 * Format a number as currency using Intl.NumberFormat with currency style
 * 
 * This uses the browser's built-in currency formatting for maximum compatibility.
 * 
 * @param amount - Amount to format
 * @param currencyCode - ISO 4217 currency code
 * @param locale - Locale for formatting
 * @param decimals - Number of decimal places
 * @returns Formatted currency string
 */
export function formatCurrencyNative(
    amount: number,
    currencyCode: string,
    locale: string = 'es-AR',
    decimals: number = 2
): string {
    // Handle invalid amounts
    const safeAmount = isNaN(amount) || !isFinite(amount) ? 0 : amount;
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
        return `${currencyCode} ${safeAmount.toFixed(decimalPlaces)}`;
    }
}

/**
 * Format a percentage value
 */
export function formatPercent(
    value: number,
    locale: string = 'es-AR',
    decimals: number = 0
): string {
    const safeValue = isNaN(value) || !isFinite(value) ? 0 : value;

    try {
        return new Intl.NumberFormat(locale, {
            style: 'percent',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(safeValue / 100);
    } catch {
        return `${safeValue.toFixed(decimals)}%`;
    }
}
