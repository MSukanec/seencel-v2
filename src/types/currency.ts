// Currency types for bi-monetary system
export interface Currency {
    id: string;
    code: string;
    name: string;
    symbol: string;
    is_default?: boolean;
    exchange_rate?: number;
}

export interface MonetaryBreakdown {
    // Total in functional/primary currency
    totalFunctional: number;

    // Breakdown by native currency
    byNativeCurrency: {
        currency: Currency;
        amount: number;
        functionalAmount: number; // Converted to functional currency
    }[];
}

export interface MonetaryAmount {
    amount: number;
    currency: Currency;
    exchangeRate?: number;
    functionalAmount?: number; // Pre-calculated amount in functional currency
}

export type DisplayCurrency = 'primary' | 'secondary' | 'both';

export interface CurrencyContextValue {
    // Organization's configured currencies
    primaryCurrency: Currency | null;
    secondaryCurrency: Currency | null;
    allCurrencies: Currency[];

    // User's display preference (persisted in localStorage)
    displayCurrency: DisplayCurrency;
    setDisplayCurrency: (currency: DisplayCurrency) => void;

    // Current exchange rate for conversions (can be updated)
    currentExchangeRate: number;
    setCurrentExchangeRate: (rate: number) => void;

    // Utility functions
    formatAmount: (amount: number, currency?: Currency | string) => string;
    convertToFunctional: (amount: number, fromCurrency: Currency | string, rate?: number) => number;
    convertFromFunctional: (functionalAmount: number, toCurrency: Currency | string, rate?: number) => number;

    // Breakdown calculation
    calculateBreakdown: (items: MonetaryAmount[]) => MonetaryBreakdown;

    // Loading state
    isLoading: boolean;
}
