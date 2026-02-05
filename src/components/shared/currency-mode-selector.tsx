"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrency } from "@/stores/organization-store";
import { useFinancialFeatures } from "@/hooks/use-financial-features";
import type { DisplayCurrency } from "@/types/currency";

/**
 * Global Currency Mode Selector
 * 
 * Allows users to switch between different currency display modes:
 * - Mix: Shows native amounts with breakdown (no conversion)
 * - Primary (ARS): Converts everything to functional currency
 * - Secondary (USD): Converts everything to secondary currency
 * 
 * This component directly modifies CurrencyContext, which triggers
 * re-renders in all components using useMoney().
 */
export function CurrencyModeSelector() {
    const {
        displayCurrency,
        setDisplayCurrency,
        primaryCurrency,
        secondaryCurrency
    } = useCurrency();
    const { showCurrencySelector } = useFinancialFeatures();

    // Don't render if feature is disabled or no secondary currency
    if (!showCurrencySelector || !secondaryCurrency) {
        return null;
    }

    const handleChange = (value: string) => {
        setDisplayCurrency(value as DisplayCurrency);
    };

    return (
        <Tabs
            value={displayCurrency}
            onValueChange={handleChange}
            className="h-8"
        >
            <TabsList className="h-8 grid grid-cols-3 w-auto bg-muted/50">
                <TabsTrigger
                    value="mix"
                    className="text-xs px-3 data-[state=active]:bg-background"
                >
                    Mix
                </TabsTrigger>
                <TabsTrigger
                    value="primary"
                    className="text-xs px-3 data-[state=active]:bg-background"
                >
                    {primaryCurrency?.code || 'ARS'}
                </TabsTrigger>
                <TabsTrigger
                    value="secondary"
                    className="text-xs px-3 data-[state=active]:bg-background"
                >
                    {secondaryCurrency.code}
                </TabsTrigger>
            </TabsList>
        </Tabs>
    );
}
