/**
 * Money Type - Immutable value object for monetary amounts
 * 
 * This is the foundation of all financial calculations in SEENCEL.
 * Following the "Money as First-Class Citizen" pattern used by
 * Stripe, QuickBooks, and other fintech applications.
 * 
 * GOLDEN RULES:
 * 1. Never use raw numbers for money - always use Money type
 * 2. Money objects are immutable - operations return new instances
 * 3. All conversions go through MoneyService
 * 4. All formatting goes through MoneyFormatter
 */

/**
 * Currency configuration
 */
export interface Currency {
    code: string;       // ISO 4217 code: 'ARS', 'USD'
    symbol: string;     // Display symbol: '$', 'US$'
    isDefault: boolean; // Is this the organization's functional currency?
}

/**
 * Immutable Money value object
 * 
 * @example
 * const payment = createMoney(1000, 'USD', 1200);
 * // payment.amount = 1000
 * // payment.currencyCode = 'USD'
 * // payment.exchangeRate = 1200
 * // payment.functionalAmount = 1200000 (auto-calculated)
 */
export interface Money {
    /** The amount in the original currency */
    readonly amount: number;

    /** ISO 4217 currency code */
    readonly currencyCode: string;

    /** Currency symbol for display */
    readonly symbol: string;

    /** Exchange rate at the time of transaction (to functional currency) */
    readonly exchangeRate: number;

    /** Whether this is in the functional (primary) currency */
    readonly isFunctional: boolean;
}

/**
 * Input for creating Money objects from database records
 * 
 * Valid DB columns: amount, exchange_rate, currency_id
 * Note: currency_code comes from JOINs with currencies table
 */
export interface MoneyInput {
    amount: number | string | null | undefined;
    currency_code?: string | null;
    currency_symbol?: string | null;
    exchange_rate?: number | string | null;
}

/**
 * Configuration for money operations
 */
export interface MoneyConfig {
    /** Primary/functional currency code (e.g., 'ARS') */
    functionalCurrencyCode: string;

    /** Primary currency symbol */
    functionalCurrencySymbol: string;

    /** Secondary currency code (e.g., 'USD') */
    secondaryCurrencyCode: string;

    /** Secondary currency symbol */
    secondaryCurrencySymbol: string;

    /** Current exchange rate for new transactions */
    currentExchangeRate: number;

    /** Number of decimal places to display (0, 1, or 2) */
    decimalPlaces: number;

    /** Locale for formatting (e.g., 'es-AR') */
    locale: string;
}

/**
 * Display mode for aggregated values
 */
export type DisplayMode = 'mix' | 'functional' | 'secondary';

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: MoneyConfig = {
    functionalCurrencyCode: 'ARS',
    functionalCurrencySymbol: '$',
    secondaryCurrencyCode: 'USD',
    secondaryCurrencySymbol: 'US$',
    currentExchangeRate: 1,
    decimalPlaces: 2,
    locale: 'es-AR',
};

/**
 * Create a Money object from raw values
 * 
 * @param input - Raw values from database or form
 * @param config - Money configuration
 * @returns Immutable Money object
 * 
 * @example
 * const money = createMoney({
 *   amount: 1000,
 *   currency_code: 'USD',
 *   exchange_rate: 1200
 * }, config);
 */
export function createMoney(input: MoneyInput, config: MoneyConfig): Money {
    const amount = safeNumber(input.amount);
    const currencyCode = input.currency_code || config.functionalCurrencyCode;
    const exchangeRate = safeNumber(input.exchange_rate) || config.currentExchangeRate;
    const isFunctional = currencyCode === config.functionalCurrencyCode;

    // Determine symbol
    let symbol = input.currency_symbol || '$';
    if (currencyCode === config.functionalCurrencyCode) {
        symbol = config.functionalCurrencySymbol;
    } else if (currencyCode === config.secondaryCurrencyCode) {
        symbol = config.secondaryCurrencySymbol;
    }

    return Object.freeze({
        amount,
        currencyCode,
        symbol,
        exchangeRate,
        isFunctional,
    });
}

/**
 * Create Money from a simple amount (assumes functional currency)
 */
export function createFunctionalMoney(amount: number, config: MoneyConfig): Money {
    return createMoney({
        amount,
        currency_code: config.functionalCurrencyCode,
        exchange_rate: 1,
    }, config);
}

/**
 * ZERO money in functional currency
 */
export function zeroMoney(config: MoneyConfig): Money {
    return createFunctionalMoney(0, config);
}

/**
 * Safely convert any value to a number, returning 0 for invalid values
 */
function safeNumber(value: number | string | null | undefined): number {
    if (value === null || value === undefined) return 0;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) || !isFinite(num) ? 0 : num;
}

/**
 * Check if a value is a valid Money object
 */
export function isMoney(value: unknown): value is Money {
    return (
        typeof value === 'object' &&
        value !== null &&
        'amount' in value &&
        'currencyCode' in value &&
        'exchangeRate' in value
    );
}
