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
    planSlug: string | null;

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
    planSlug: null,
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

    // Refetch store data (including planSlug) after plan changes
    invalidatePlan: () => {
        set((state) => ({ planVersion: state.planVersion + 1 }));
        const orgId = get().activeOrgId;
        if (orgId) {
            // Dynamically import to avoid circular dependency
            import('@/actions/organization-store-actions').then(({ fetchOrganizationStoreData }) => {
                fetchOrganizationStoreData(orgId).then((data) => {
                    set({
                        isFounder: data.isFounder,
                        planSlug: data.planSlug,
                    });
                });
            });
        }
    },

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
// Two-phase hydration:
// Phase 1 (instant): activeOrgId + impersonation from server layout
// Phase 2 (lazy): currencies, wallets, projects, clients via server action

interface OrganizationStoreHydratorProps {
    activeOrgId: string | null;
    isImpersonating?: boolean;
    impersonationOrgName?: string | null;
}

import { useEffect, useRef } from 'react';
import { fetchOrganizationStoreData } from '@/actions/organization-store-actions';
import { useAccessContextStore } from '@/stores/access-context-store';

export function OrganizationStoreHydrator({
    activeOrgId,
    isImpersonating = false,
    impersonationOrgName = null,
}: OrganizationStoreHydratorProps) {
    const prevActiveOrgId = useRef(activeOrgId);
    const hydrated = useRef(false);
    const fetchingRef = useRef(false);

    useEffect(() => {
        const orgChanged = prevActiveOrgId.current !== activeOrgId;
        prevActiveOrgId.current = activeOrgId;

        // Phase 1: Hydrate core data instantly (no network)
        if (!hydrated.current || orgChanged) {
            hydrated.current = true;

            // Set minimal state immediately so layout renders fast
            useOrganizationStore.getState().hydrate({
                activeOrgId,
            });

            // Set impersonation state
            if (isImpersonating) {
                useOrganizationStore.getState().setImpersonating(impersonationOrgName || '');
            } else {
                useOrganizationStore.getState().clearImpersonating();
            }

            // Reset access context on org change
            if (orgChanged) {
                useAccessContextStore.getState().reset();
            }
        }

        // Phase 2: Lazy fetch heavy data (currencies, wallets, projects, clients)
        if (activeOrgId && (!fetchingRef.current || orgChanged)) {
            fetchingRef.current = true;

            fetchOrganizationStoreData(activeOrgId)
                .then((data) => {
                    useOrganizationStore.getState().hydrate({
                        activeOrgId,
                        preferences: data.preferences as any,
                        isFounder: data.isFounder,
                        planSlug: data.planSlug,
                        wallets: data.wallets,
                        projects: data.projects,
                        clients: data.clients,
                        currencies: data.currencies,
                        decimalPlaces: data.decimalPlaces,
                        kpiCompactFormat: data.kpiCompactFormat,
                    });

                    // Hydrate access context store
                    if (data.accessContext) {
                        useAccessContextStore.getState().hydrate(data.accessContext);
                    }
                })
                .catch((error) => {
                    console.error('Failed to load organization data:', error);
                    // Still mark as hydrated with empty data so UI doesn't block
                    useOrganizationStore.getState().hydrate({
                        activeOrgId,
                        wallets: [],
                        projects: [],
                        clients: [],
                        currencies: [],
                    });
                });
        }
    }, [activeOrgId, isImpersonating, impersonationOrgName]);

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
    const planSlug = useOrganizationStore(state => state.planSlug);
    const wallets = useOrganizationStore(state => state.wallets);
    const projects = useOrganizationStore(state => state.projects);
    const clients = useOrganizationStore(state => state.clients);
    const isImpersonating = useOrganizationStore(state => state.isImpersonating);
    const impersonationOrgName = useOrganizationStore(state => state.impersonationOrgName);

    return { activeOrgId, preferences, isFounder, planSlug, wallets, projects, clients, isImpersonating, impersonationOrgName };
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


