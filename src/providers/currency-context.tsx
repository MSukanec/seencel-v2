"use client";

import { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from 'react';
import { Currency, CurrencyContextValue, DisplayCurrency, MonetaryAmount, MonetaryBreakdown } from '@/types/currency';
import {
    formatCurrency as formatCurrencyUtil,
    convertToFunctional as convertToFunctionalUtil,
    convertFromFunctional as convertFromFunctionalUtil,
    calculateMonetaryBreakdown
} from '@/lib/currency-utils';

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

interface CurrencyProviderProps {
    children: ReactNode;
    currencies: Currency[];
    defaultExchangeRate?: number;
    decimalPlaces?: number; // Organization preference for decimal display
}

/**
 * CurrencyProvider - Global bi-currency context for SEENCEL
 * 
 * Provides:
 * - Primary and secondary currency configuration
 * - Display preference (user can toggle between currencies)
 * - Formatting and conversion utilities
 */
export function CurrencyProvider({
    children,
    currencies,
    defaultExchangeRate = 1,
    decimalPlaces = 2
}: CurrencyProviderProps) {
    // Find primary and secondary currencies
    const primaryCurrency = useMemo(() =>
        currencies.find(c => c.is_default) || currencies[0] || null
        , [currencies]);

    const secondaryCurrency = useMemo(() =>
        currencies.find(c => !c.is_default) || null
        , [currencies]);

    // Display preference (persisted to localStorage)
    const [displayCurrency, setDisplayCurrencyState] = useState<DisplayCurrency>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('seencel_display_currency');
            if (saved === 'primary' || saved === 'secondary' || saved === 'both' || saved === 'mix') {
                return saved;
            }
        }
        return 'mix'; // Default to mix mode
    });

    const setDisplayCurrency = useCallback((currency: DisplayCurrency) => {
        setDisplayCurrencyState(currency);
        if (typeof window !== 'undefined') {
            localStorage.setItem('seencel_display_currency', currency);
        }
    }, []);

    // Current exchange rate for real-time conversions
    // Initialize with secondary currency rate if available, otherwise default
    const [currentExchangeRate, setCurrentExchangeRate] = useState(() => {
        const secondary = currencies.find(c => !c.is_default);
        if (secondary?.exchange_rate && secondary.exchange_rate > 1) {
            return secondary.exchange_rate;
        }
        return defaultExchangeRate;
    });

    // Sync state if currencies load later or change
    // Only update if current rate is at default (1) to avoid overwriting user overrides
    useEffect(() => {
        if (secondaryCurrency?.exchange_rate && secondaryCurrency.exchange_rate > 1) {
            setCurrentExchangeRate(prev => {
                // If we are effectively uninitialized (<= 1), assume the stored rate is better
                if (prev <= 1) return secondaryCurrency.exchange_rate!;
                return prev;
            });
        }
    }, [secondaryCurrency]);

    // Formatting function
    const formatAmount = useCallback((amount: number, currency?: Currency | string) => {
        const curr = currency || primaryCurrency;
        return formatCurrencyUtil(amount, curr, 'es-AR', decimalPlaces);
    }, [primaryCurrency, decimalPlaces]);

    // Conversion functions
    const convertToFunctional = useCallback((
        amount: number,
        fromCurrency: Currency | string,
        rate?: number
    ) => {
        if (!primaryCurrency) return amount;
        const fromCode = typeof fromCurrency === 'string' ? fromCurrency : fromCurrency.code;
        return convertToFunctionalUtil(
            amount,
            fromCode,
            primaryCurrency.code,
            rate ?? currentExchangeRate
        );
    }, [primaryCurrency, currentExchangeRate]);

    const convertFromFunctional = useCallback((
        functionalAmount: number,
        toCurrency: Currency | string,
        rate?: number
    ) => {
        if (!primaryCurrency) return functionalAmount;
        const toCode = typeof toCurrency === 'string' ? toCurrency : toCurrency.code;
        return convertFromFunctionalUtil(
            functionalAmount,
            toCode,
            primaryCurrency.code,
            rate ?? currentExchangeRate
        );
    }, [primaryCurrency, currentExchangeRate]);

    // Breakdown calculation
    const calculateBreakdown = useCallback((items: MonetaryAmount[]): MonetaryBreakdown => {
        if (!primaryCurrency) {
            return { totalFunctional: 0, byNativeCurrency: [] };
        }
        return calculateMonetaryBreakdown(items, primaryCurrency);
    }, [primaryCurrency]);

    const value: CurrencyContextValue = useMemo(() => ({
        primaryCurrency,
        secondaryCurrency,
        allCurrencies: currencies,
        displayCurrency,
        setDisplayCurrency,
        currentExchangeRate,
        setCurrentExchangeRate,
        formatAmount,
        convertToFunctional,
        convertFromFunctional,
        calculateBreakdown,
        decimalPlaces,
        isLoading: false,
    }), [
        primaryCurrency,
        secondaryCurrency,
        currencies,
        displayCurrency,
        setDisplayCurrency,
        currentExchangeRate,
        formatAmount,
        convertToFunctional,
        convertFromFunctional,
        calculateBreakdown,
        decimalPlaces,
    ]);

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
}

/**
 * Hook to access currency context
 */
export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
}

/**
 * Optional hook that returns null if outside provider (for optional usage)
 */
export function useCurrencyOptional() {
    return useContext(CurrencyContext);
}

