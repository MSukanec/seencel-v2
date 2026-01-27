/**
 * useMoney - Single React Hook for All Money Operations
 * 
 * This hook provides a unified API for:
 * - Currency configuration from context
 * - Display mode management (Mix/ARS/USD)
 * - Formatting with organization's decimal preferences
 * - Calculations using the centralized MoneyService
 * 
 * USAGE:
 * ```tsx
 * const { format, calculateKPIs, displayMode, setDisplayMode } = useMoney();
 * 
 * const kpis = calculateKPIs(movements);
 * const formatted = format(kpis.balance);
 * ```
 */

"use client";

import { useCallback, useMemo } from 'react';
import { useCurrencyOptional } from '@/providers/currency-context';
import {
    MoneyConfig,
    MoneyInput,
    DisplayMode,
    createMoney,
    calculateDisplayAmount as calcDisplayAmount,
    sumMoney,
    sumMoneyWithSign,
    formatAmount,
    formatMoney,
    calculateFinanceKPIs,
    calculateCashFlowData,
    calculateWalletBalances,
    KPIMovement,
    DEFAULT_CONFIG,
    Money,
} from '@/lib/money';

/**
 * Map our new DisplayMode to context's displayCurrency
 */
function displayModeToContext(mode: DisplayMode): 'primary' | 'secondary' | 'mix' {
    switch (mode) {
        case 'secondary':
            return 'secondary';
        case 'mix':
            return 'mix';
        case 'functional':
        default:
            return 'primary';
    }
}

/**
 * Map context's displayCurrency to our DisplayMode
 */
function contextToDisplayMode(
    displayCurrency: 'primary' | 'secondary' | 'both' | 'mix',
): DisplayMode {
    if (displayCurrency === 'mix') return 'mix';
    if (displayCurrency === 'secondary') return 'secondary';
    return 'functional'; // primary -> functional
}

export interface UseMoneyOptions {
    /** Force a specific display mode (overrides context) */
    forcedMode?: DisplayMode;
}

export interface UseMoneyReturn {
    // === Configuration ===
    /** Current money configuration */
    config: MoneyConfig;

    /** Current display mode */
    displayMode: DisplayMode;

    /** Set display mode */
    setDisplayMode: (mode: DisplayMode) => void;

    /** Current display currency code */
    displayCurrencyCode: string;

    /** Primary currency code (alias for config.functionalCurrencyCode) */
    primaryCurrencyCode: string;

    // === Conversion ===
    /** Calculate display amount for a single item */
    calculateDisplayAmount: (item: MoneyInput) => number;

    /** Create a Money object from raw input */
    createMoney: (item: MoneyInput) => Money;

    // === Formatting ===
    /** Format a number as currency */
    format: (amount: number, currencyCode?: string) => string;

    /** Format with + sign for positive values */
    formatWithSign: (amount: number, currencyCode?: string) => string;

    /** Format compact (e.g., 1.5M) */
    formatCompact: (amount: number, currencyCode?: string) => string;

    // === Aggregation ===
    /** Sum an array of monetary items */
    sum: (items: MoneyInput[]) => { total: number; breakdown: ReturnType<typeof sumMoney>['breakdown'] };

    /** Sum with sign separation (ingresos/egresos) */
    sumWithSign: (items: (MoneyInput & { amount_sign?: number | null })[]) => ReturnType<typeof sumMoneyWithSign>;

    // === KPIs ===
    /** Calculate finance KPIs */
    calculateKPIs: (movements: KPIMovement[]) => ReturnType<typeof calculateFinanceKPIs>;

    /** Calculate cash flow chart data */
    calculateCashFlow: (movements: KPIMovement[], monthsToShow?: number) => ReturnType<typeof calculateCashFlowData>;

    /** Calculate wallet balances */
    calculateWalletBalances: (
        movements: KPIMovement[],
        wallets: { id: string; wallet_name: string }[]
    ) => ReturnType<typeof calculateWalletBalances>;
}

/**
 * Primary hook for all money operations
 */
export function useMoney(options: UseMoneyOptions = {}): UseMoneyReturn {
    const currencyContext = useCurrencyOptional();

    // Build configuration from context
    const config: MoneyConfig = useMemo(() => {
        if (!currencyContext) return DEFAULT_CONFIG;

        const { primaryCurrency, secondaryCurrency, currentExchangeRate, decimalPlaces } = currencyContext;

        return {
            functionalCurrencyCode: primaryCurrency?.code || 'ARS',
            functionalCurrencySymbol: primaryCurrency?.symbol || '$',
            secondaryCurrencyCode: secondaryCurrency?.code || 'USD',
            secondaryCurrencySymbol: secondaryCurrency?.symbol || 'US$',
            currentExchangeRate: currentExchangeRate > 0 ? currentExchangeRate : 1,
            decimalPlaces: decimalPlaces ?? 2,
            locale: 'es-AR',
        };
    }, [currencyContext]);

    // Display mode management
    const displayMode: DisplayMode = useMemo(() => {
        if (options.forcedMode) return options.forcedMode;
        if (!currencyContext) return 'functional';
        return contextToDisplayMode(currencyContext.displayCurrency);
    }, [options.forcedMode, currencyContext]);

    const setDisplayMode = useCallback((mode: DisplayMode) => {
        if (!currencyContext) return;
        currencyContext.setDisplayCurrency(displayModeToContext(mode));
    }, [currencyContext]);

    const displayCurrencyCode = useMemo(() => {
        if (displayMode === 'secondary') {
            return config.secondaryCurrencyCode;
        }
        return config.functionalCurrencyCode;
    }, [displayMode, config]);

    // === Conversion functions ===
    const calculateDisplayAmountFn = useCallback((item: MoneyInput): number => {
        const money = createMoney(item, config);
        return calcDisplayAmount(money, displayMode, config);
    }, [config, displayMode]);

    const createMoneyFn = useCallback((item: MoneyInput): Money => {
        return createMoney(item, config);
    }, [config]);

    // === Formatting functions ===
    const format = useCallback((amount: number, currencyCode?: string): string => {
        return formatAmount(amount, currencyCode || displayCurrencyCode, config);
    }, [config, displayCurrencyCode]);

    const formatWithSign = useCallback((amount: number, currencyCode?: string): string => {
        return formatAmount(amount, currencyCode || displayCurrencyCode, config, { showPositiveSign: true });
    }, [config, displayCurrencyCode]);

    const formatCompact = useCallback((amount: number, currencyCode?: string): string => {
        return formatAmount(amount, currencyCode || displayCurrencyCode, config, { compact: true });
    }, [config, displayCurrencyCode]);

    // === Aggregation functions ===
    const sum = useCallback((items: MoneyInput[]) => {
        const result = sumMoney(items, displayMode, config);
        return { total: result.total, breakdown: result.breakdown };
    }, [config, displayMode]);

    const sumWithSignFn = useCallback((items: (MoneyInput & { amount_sign?: number | null })[]) => {
        return sumMoneyWithSign(items, displayMode, config);
    }, [config, displayMode]);

    // === KPI functions ===
    const calculateKPIs = useCallback((movements: KPIMovement[]) => {
        return calculateFinanceKPIs(movements, displayMode, config);
    }, [config, displayMode]);

    const calculateCashFlowFn = useCallback((movements: KPIMovement[], monthsToShow: number = 12) => {
        return calculateCashFlowData(movements, displayMode, config, monthsToShow);
    }, [config, displayMode]);

    const calculateWalletBalancesFn = useCallback((
        movements: KPIMovement[],
        wallets: { id: string; wallet_name: string }[]
    ) => {
        return calculateWalletBalances(movements, wallets, displayMode, config);
    }, [config, displayMode]);

    return {
        // Configuration
        config,
        displayMode,
        setDisplayMode,
        displayCurrencyCode,
        primaryCurrencyCode: config.functionalCurrencyCode,

        // Conversion
        calculateDisplayAmount: calculateDisplayAmountFn,
        createMoney: createMoneyFn,

        // Formatting
        format,
        formatWithSign,
        formatCompact,

        // Aggregation
        sum,
        sumWithSign: sumWithSignFn,

        // KPIs
        calculateKPIs,
        calculateCashFlow: calculateCashFlowFn,
        calculateWalletBalances: calculateWalletBalancesFn,
    };
}
