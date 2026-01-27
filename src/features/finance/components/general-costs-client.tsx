"use client";

import { useState, useMemo } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralCost, GeneralCostCategory, GeneralCostPaymentView, EnhancedDashboardData } from "@/types/general-costs";
import { DashboardTab } from "./dashboard-tab";
import { ConceptsTable } from "./concepts-table";
import { PaymentsTable } from "./payments-table";
import { SettingsTab } from "./settings-tab";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { DateRangeFilter, type DateRangeFilterValue } from "@/components/layout/dashboard/shared/toolbar/toolbar-date-range-filter";
import { useCurrency } from "@/providers/currency-context";
import { useFinancialFeatures } from "@/hooks/use-financial-features";

export type CurrencyViewMode = 'mix' | 'primary' | 'secondary';

interface GeneralCostsClientProps {
    organizationId: string;
    categories: GeneralCostCategory[];
    concepts: GeneralCost[];
    payments: GeneralCostPaymentView[];
    dashboardData: EnhancedDashboardData;
    wallets: { id: string; wallet_name: string }[];
    currencies: { id: string; code: string; symbol: string }[];
}

export function GeneralCostsClient({ organizationId, categories, concepts, payments, dashboardData, wallets, currencies }: GeneralCostsClientProps) {
    // Currency context
    const { primaryCurrency, secondaryCurrency, setDisplayCurrency } = useCurrency();
    const { showCurrencySelector } = useFinancialFeatures();

    // Currency view mode
    const [currencyMode, setCurrencyMode] = useState<CurrencyViewMode>('mix');

    // Handle currency mode change
    const handleCurrencyModeChange = (mode: CurrencyViewMode) => {
        setCurrencyMode(mode);
        if (mode === 'mix' || mode === 'primary') {
            setDisplayCurrency('primary');
        } else if (mode === 'secondary') {
            setDisplayCurrency('secondary');
        }
    };

    // Date range filter - no default selection (infinite until user selects)
    const [dateRange, setDateRange] = useState<DateRangeFilterValue | undefined>(undefined);

    // Filter payments by date range
    const filteredPayments = useMemo(() => {
        if (!dateRange?.from && !dateRange?.to) return payments;

        return payments.filter(p => {
            const paymentDate = new Date(p.payment_date);
            if (dateRange?.from && paymentDate < dateRange.from) return false;
            if (dateRange?.to && paymentDate > dateRange.to) return false;
            return true;
        });
    }, [payments, dateRange]);

    // Recalculate dashboard data based on filtered payments
    const filteredDashboardData = useMemo(() => {
        // For now, pass original data - filtering should be done server-side for accuracy
        // The toolbar filter mainly applies to the visible chart data
        return dashboardData;
    }, [dashboardData, filteredPayments]);

    // Currency mode tabs element
    const currencyModeSelector = showCurrencySelector && secondaryCurrency ? (
        <Tabs
            value={currencyMode}
            onValueChange={(v) => handleCurrencyModeChange(v as CurrencyViewMode)}
            className="h-9"
        >
            <TabsList className="h-9 grid grid-cols-3 w-auto">
                <TabsTrigger value="mix" className="text-xs px-3">
                    Mix
                </TabsTrigger>
                <TabsTrigger value="primary" className="text-xs px-3">
                    {primaryCurrency?.code || 'ARS'}
                </TabsTrigger>
                <TabsTrigger value="secondary" className="text-xs px-3">
                    {secondaryCurrency.code}
                </TabsTrigger>
            </TabsList>
        </Tabs>
    ) : null;

    return (
        <>
            <TabsContent value="dashboard" className="m-0 h-full focus-visible:outline-none">
                {/* Portal toolbar to header */}
                <Toolbar
                    portalToHeader={true}
                    leftActions={
                        <>
                            {currencyModeSelector}
                            <DateRangeFilter
                                title="Período"
                                value={dateRange}
                                onChange={(value) => setDateRange(value)}
                            />
                        </>
                    }
                />
                <DashboardTab data={filteredDashboardData} payments={filteredPayments} />
            </TabsContent>
            <TabsContent value="concepts" className="m-0 h-full focus-visible:outline-none">
                <ConceptsTable data={concepts} categories={categories} organizationId={organizationId} />
            </TabsContent>
            <TabsContent value="payments" className="m-0 h-full focus-visible:outline-none">
                <PaymentsTable
                    data={payments}
                    concepts={concepts}
                    wallets={wallets}
                    currencies={currencies}
                    organizationId={organizationId}
                />
            </TabsContent>
            <TabsContent value="settings" className="m-0 h-full focus-visible:outline-none">
                <SettingsTab categories={categories} organizationId={organizationId} />
            </TabsContent>
        </>
    );
}
