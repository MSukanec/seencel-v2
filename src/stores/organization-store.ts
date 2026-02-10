"use client";

import { create } from 'zustand';
import { Currency } from '@/types/currency';
import { OrganizationPreferences } from '@/types/organization';
import {
    formatCurrency as formatCurrencyUtil,
    convertToFunctional as convertToFunctionalUtil,
    convertFromFunctional as convertFromFunctionalUtil,
} from '@/lib/currency-utils';

// === Types ===

interface Wallet {
    id: string;
    wallet_id?: string;
    name: string;
    balance?: number;
    currency_symbol?: string;
    currency_code?: string;
    is_default?: boolean;
}

interface Project {
    id: string;
    name: string;
}

interface Client {
    id: string;
    name: string;
    project_id?: string;
}

type DisplayCurrency = 'primary' | 'secondary' | 'both' | 'mix';

interface OrganizationState {
    // Core
    activeOrgId: string | null;
    preferences: OrganizationPreferences | null;
    isFounder: boolean;

    // Lists for forms
    wallets: Wallet[];
    projects: Project[];
    clients: Client[];
    currencies: Currency[];

    // Currency display settings
    displayCurrency: DisplayCurrency;
    currentExchangeRate: number;
    decimalPlaces: number;
    kpiCompactFormat: boolean;

    // Hydration status
    isHydrated: boolean;

    // Plan invalidation counter (increment to force plan-button refetch)
    planVersion: number;

    // Admin impersonation (support mode)
    isImpersonating: boolean;
    impersonationOrgName: string | null;
}

interface OrganizationActions {
    // Hydration (called from layout)
    hydrate: (data: Partial<OrganizationState>) => void;

    // Currency display preference
    setDisplayCurrency: (currency: DisplayCurrency) => void;
    setCurrentExchangeRate: (rate: number) => void;

    // Computed getters
    getPrimaryCurrency: () => Currency | null;
    getSecondaryCurrency: () => Currency | null;
    getDefaultWallet: () => Wallet | null;

    // Currency utilities
    formatAmount: (amount: number, currency?: Currency | string) => string;
    convertToFunctional: (amount: number, fromCurrency: Currency | string, rate?: number) => number;
    convertFromFunctional: (functionalAmount: number, toCurrency: Currency | string, rate?: number) => number;

    // Plan invalidation
    invalidatePlan: () => void;

    // Admin impersonation
    setImpersonating: (orgName: string) => void;
    clearImpersonating: () => void;
}

type OrganizationStore = OrganizationState & OrganizationActions;

// === Store ===

export const useOrganizationStore = create<OrganizationStore>((set, get) => ({
    // Initial state
    activeOrgId: null,
    preferences: null,
    isFounder: false,
    wallets: [],
    projects: [],
    clients: [],
    currencies: [],
    displayCurrency: 'mix',
    currentExchangeRate: 1,
    decimalPlaces: 2,
    kpiCompactFormat: false,
    isHydrated: false,
    planVersion: 0,
    isImpersonating: false,
    impersonationOrgName: null,

    // Hydrate from server data
    hydrate: (data) => {
        // Load display currency from localStorage if available
        let displayCurrency: DisplayCurrency = 'mix';
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('seencel_display_currency');
            if (saved === 'primary' || saved === 'secondary' || saved === 'both' || saved === 'mix') {
                displayCurrency = saved;
            }
        }

        // Calculate exchange rate from secondary currency
        const secondaryCurrency = data.currencies?.find(c => !c.is_default);
        const exchangeRate = secondaryCurrency?.exchange_rate && secondaryCurrency.exchange_rate > 1
            ? secondaryCurrency.exchange_rate
            : 1;

        set({
            ...data,
            displayCurrency,
            currentExchangeRate: exchangeRate,
            isHydrated: true,
        });
    },

    // Display preference
    setDisplayCurrency: (currency) => {
        set({ displayCurrency: currency });
        if (typeof window !== 'undefined') {
            localStorage.setItem('seencel_display_currency', currency);
        }
    },

    setCurrentExchangeRate: (rate) => set({ currentExchangeRate: rate }),

    // Increment planVersion to force plan-button refetch
    invalidatePlan: () => set((state) => ({ planVersion: state.planVersion + 1 })),

    // Admin impersonation
    setImpersonating: (orgName: string) => set({ isImpersonating: true, impersonationOrgName: orgName }),
    clearImpersonating: () => set({ isImpersonating: false, impersonationOrgName: null }),

    // Computed getters
    getPrimaryCurrency: () => {
        const { currencies } = get();
        return currencies.find(c => c.is_default) || currencies[0] || null;
    },

    getSecondaryCurrency: () => {
        const { currencies } = get();
        return currencies.find(c => !c.is_default) || null;
    },

    getDefaultWallet: () => {
        const { wallets } = get();
        return wallets.find(w => w.is_default) || wallets[0] || null;
    },

    // Currency utilities
    formatAmount: (amount, currency) => {
        const { decimalPlaces } = get();
        const primaryCurrency = get().getPrimaryCurrency();
        const curr = currency || primaryCurrency || undefined;
        return formatCurrencyUtil(amount, curr, 'es-AR', decimalPlaces);
    },

    convertToFunctional: (amount, fromCurrency, rate) => {
        const { currentExchangeRate } = get();
        const primaryCurrency = get().getPrimaryCurrency();
        if (!primaryCurrency) return amount;

        const fromCode = typeof fromCurrency === 'string' ? fromCurrency : fromCurrency.code;
        return convertToFunctionalUtil(
            amount,
            fromCode,
            primaryCurrency.code,
            rate ?? currentExchangeRate
        );
    },

    convertFromFunctional: (functionalAmount, toCurrency, rate) => {
        const { currentExchangeRate } = get();
        const primaryCurrency = get().getPrimaryCurrency();
        if (!primaryCurrency) return functionalAmount;

        const toCode = typeof toCurrency === 'string' ? toCurrency : toCurrency.code;
        return convertFromFunctionalUtil(
            functionalAmount,
            toCode,
            primaryCurrency.code,
            rate ?? currentExchangeRate
        );
    },
}));

// === Hydrator Component ===
// This component hydrates the store from server-side data
// It renders nothing but ensures the store is populated

interface OrganizationStoreHydratorProps {
    activeOrgId: string | null;
    preferences: OrganizationPreferences | null;
    isFounder: boolean;
    wallets: Wallet[];
    projects: Project[];
    clients: Client[];
    currencies: Currency[];
    decimalPlaces: number;
    kpiCompactFormat: boolean;
    isImpersonating?: boolean;
    impersonationOrgName?: string | null;
}

import { useEffect, useRef } from 'react';

export function OrganizationStoreHydrator({
    activeOrgId,
    preferences,
    isFounder,
    wallets,
    projects,
    clients,
    currencies,
    decimalPlaces,
    kpiCompactFormat,
    isImpersonating = false,
    impersonationOrgName = null,
}: OrganizationStoreHydratorProps) {
    // Track previous critical values to detect changes that require re-hydration
    const prevActiveOrgId = useRef(activeOrgId);
    const prevIsFounder = useRef(isFounder);
    const hydrated = useRef(false);

    useEffect(() => {
        // Detect if critical values changed (org switch or plan upgrade)
        const orgChanged = prevActiveOrgId.current !== activeOrgId;
        const founderStatusChanged = prevIsFounder.current !== isFounder;
        const shouldRehydrate = orgChanged || founderStatusChanged;

        // Update refs for next comparison
        prevActiveOrgId.current = activeOrgId;
        prevIsFounder.current = isFounder;

        // Hydrate on first mount OR when critical data changes
        if (!hydrated.current || shouldRehydrate) {
            hydrated.current = true;

            useOrganizationStore.getState().hydrate({
                activeOrgId,
                preferences,
                isFounder,
                wallets,
                projects,
                clients,
                currencies,
                decimalPlaces,
                kpiCompactFormat,
            });

            // Set impersonation state (from server detection)
            if (isImpersonating) {
                useOrganizationStore.getState().setImpersonating(impersonationOrgName || '');
            } else {
                useOrganizationStore.getState().clearImpersonating();
            }
        }
    }, [activeOrgId, preferences, isFounder, wallets, projects, clients, currencies, decimalPlaces, kpiCompactFormat, isImpersonating, impersonationOrgName]);

    return null;
}

// === Convenience Hooks ===

/**
 * Hook compatible con el antiguo OrganizationContext
 * Retorna los datos básicos de organización
 */
export function useOrganization() {
    const activeOrgId = useOrganizationStore(state => state.activeOrgId);
    const preferences = useOrganizationStore(state => state.preferences);
    const isFounder = useOrganizationStore(state => state.isFounder);
    const wallets = useOrganizationStore(state => state.wallets);
    const projects = useOrganizationStore(state => state.projects);
    const clients = useOrganizationStore(state => state.clients);
    const isImpersonating = useOrganizationStore(state => state.isImpersonating);
    const impersonationOrgName = useOrganizationStore(state => state.impersonationOrgName);

    return { activeOrgId, preferences, isFounder, wallets, projects, clients, isImpersonating, impersonationOrgName };
}

/**
 * Hook compatible con el antiguo CurrencyContext
 * Retorna datos de currencies y utilidades de formato
 */
export function useCurrency() {
    const currencies = useOrganizationStore(state => state.currencies);
    const displayCurrency = useOrganizationStore(state => state.displayCurrency);
    const setDisplayCurrency = useOrganizationStore(state => state.setDisplayCurrency);
    const currentExchangeRate = useOrganizationStore(state => state.currentExchangeRate);
    const setCurrentExchangeRate = useOrganizationStore(state => state.setCurrentExchangeRate);
    const formatAmount = useOrganizationStore(state => state.formatAmount);
    const convertToFunctional = useOrganizationStore(state => state.convertToFunctional);
    const convertFromFunctional = useOrganizationStore(state => state.convertFromFunctional);
    const decimalPlaces = useOrganizationStore(state => state.decimalPlaces);
    const kpiCompactFormat = useOrganizationStore(state => state.kpiCompactFormat);
    const isHydrated = useOrganizationStore(state => state.isHydrated);

    // Computed values (stable references from primitives)
    const primaryCurrency = currencies.find(c => c.is_default) || currencies[0] || null;
    const secondaryCurrency = currencies.find(c => !c.is_default) || null;

    return {
        currencies,
        displayCurrency,
        setDisplayCurrency,
        currentExchangeRate,
        setCurrentExchangeRate,
        formatAmount,
        convertToFunctional,
        convertFromFunctional,
        decimalPlaces,
        kpiCompactFormat,
        isHydrated,
        primaryCurrency,
        secondaryCurrency,
        allCurrencies: currencies,
        isLoading: !isHydrated,
    };
}

/**
 * Hook for forms - returns only the data needed for form dropdowns
 * Works inside modals/portals because Zustand is outside React tree
 */
export function useFormData() {
    const activeOrgId = useOrganizationStore(state => state.activeOrgId);
    const wallets = useOrganizationStore(state => state.wallets);
    const currencies = useOrganizationStore(state => state.currencies);
    const projects = useOrganizationStore(state => state.projects);
    const clients = useOrganizationStore(state => state.clients);
    const getDefaultWallet = useOrganizationStore(state => state.getDefaultWallet);
    const getPrimaryCurrency = useOrganizationStore(state => state.getPrimaryCurrency);

    return { activeOrgId, wallets, currencies, projects, clients, getDefaultWallet, getPrimaryCurrency };
}

/**
 * Hook for currency display components
 */
export function useCurrencyDisplay() {
    const displayCurrency = useOrganizationStore(state => state.displayCurrency);
    const setDisplayCurrency = useOrganizationStore(state => state.setDisplayCurrency);
    const currentExchangeRate = useOrganizationStore(state => state.currentExchangeRate);
    const setCurrentExchangeRate = useOrganizationStore(state => state.setCurrentExchangeRate);
    const formatAmount = useOrganizationStore(state => state.formatAmount);
    const convertToFunctional = useOrganizationStore(state => state.convertToFunctional);
    const convertFromFunctional = useOrganizationStore(state => state.convertFromFunctional);
    const getPrimaryCurrency = useOrganizationStore(state => state.getPrimaryCurrency);
    const getSecondaryCurrency = useOrganizationStore(state => state.getSecondaryCurrency);
    const decimalPlaces = useOrganizationStore(state => state.decimalPlaces);
    const kpiCompactFormat = useOrganizationStore(state => state.kpiCompactFormat);

    return {
        displayCurrency,
        setDisplayCurrency,
        currentExchangeRate,
        setCurrentExchangeRate,
        formatAmount,
        convertToFunctional,
        convertFromFunctional,
        getPrimaryCurrency,
        getSecondaryCurrency,
        decimalPlaces,
        kpiCompactFormat,
    };
}

/**
 * Optional hook that returns null if store is not hydrated (for optional usage)
 */
export function useCurrencyOptional() {
    const isHydrated = useOrganizationStore(state => state.isHydrated);
    const currencyData = useCurrency();

    if (!isHydrated) return null;
    return currencyData;
}


