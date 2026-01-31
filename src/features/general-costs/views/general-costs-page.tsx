"use client";

import { useState, useMemo } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { GeneralCost, GeneralCostCategory, GeneralCostPaymentView, EnhancedDashboardData } from "@/features/general-costs/types";
import { GeneralCostsDashboardView } from "./general-costs-dashboard-view";
import { GeneralCostsConceptsView } from "./general-costs-concepts-view";
import { GeneralCostsPaymentsView } from "./general-costs-payments-view";
import { GeneralCostsSettingsView } from "./general-costs-settings-view";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { DateRangeFilter, type DateRangeFilterValue } from "@/components/layout/dashboard/shared/toolbar/toolbar-date-range-filter";


interface GeneralCostsPageClientProps {
    organizationId: string;
    categories: GeneralCostCategory[];
    concepts: GeneralCost[];
    payments: GeneralCostPaymentView[];
    dashboardData: EnhancedDashboardData;
    wallets: { id: string; wallet_name: string }[];
    currencies: { id: string; name: string; code: string; symbol: string }[];
}

export function GeneralCostsPageClient({ organizationId, categories, concepts, payments, dashboardData, wallets, currencies }: GeneralCostsPageClientProps) {
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



    return (
        <>
            <TabsContent value="dashboard" className="m-0 h-full focus-visible:outline-none">
                {/* Portal toolbar to header */}
                <Toolbar
                    portalToHeader={true}
                    leftActions={
                        <DateRangeFilter
                            title="Período"
                            value={dateRange}
                            onChange={(value) => setDateRange(value)}
                        />
                    }
                />
                <GeneralCostsDashboardView data={filteredDashboardData} payments={filteredPayments} />
            </TabsContent>
            <TabsContent value="concepts" className="m-0 h-full focus-visible:outline-none">
                <GeneralCostsConceptsView data={concepts} categories={categories} organizationId={organizationId} />
            </TabsContent>
            <TabsContent value="payments" className="m-0 h-full focus-visible:outline-none">
                <GeneralCostsPaymentsView
                    data={filteredPayments}
                    concepts={concepts}
                    wallets={wallets}
                    currencies={currencies}
                    organizationId={organizationId}
                />
            </TabsContent>
            <TabsContent value="settings" className="m-0 h-full focus-visible:outline-none">
                <GeneralCostsSettingsView categories={categories} organizationId={organizationId} />
            </TabsContent>
        </>
    );
}
