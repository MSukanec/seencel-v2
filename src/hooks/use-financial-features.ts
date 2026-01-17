import { useOrganization } from "@/context/organization-context";
import { useCurrency } from "@/providers/currency-context";
import { useMemo } from "react";

export function useFinancialFeatures() {
    const { preferences } = useOrganization();
    const { allCurrencies } = useCurrency();

    // 1. Has Secondary Currencies?
    // Filter out the default currency to count actual secondaries
    const secondaryCurrencies = useMemo(() =>
        allCurrencies.filter(c => !c.is_default),
        [allCurrencies]
    );

    const showCurrencySelector = secondaryCurrencies.length > 0;

    // 2. Use Exchange Rate?
    const showExchangeRate = preferences?.use_currency_exchange === true;

    // 3. Functional Currency Enabled?
    // Only if Exchange is enabled. Fallback to default currency if functional is not explicitly set.
    const rawFunctionalId = preferences?.functional_currency_id;
    const defaultCurrencyId = preferences?.default_currency_id;

    const functionalCurrencyId = rawFunctionalId || (showExchangeRate ? defaultCurrencyId : undefined);
    const showFunctionalColumns = showExchangeRate && !!functionalCurrencyId;



    return {
        // Flags
        showCurrencySelector,
        showExchangeRate,
        showFunctionalColumns,

        // Data
        defaultCurrencyId,
        functionalCurrencyId,
        secondaryCurrenciesCount: secondaryCurrencies.length,

        // Raw Preferences (exposed just in case)
        preferences
    };
}
