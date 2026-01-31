"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangeFilter, type DateRangeFilterValue } from "@/components/layout/dashboard/shared/toolbar/toolbar-date-range-filter";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { DollarSign } from "lucide-react";
import { FinancesOverviewView } from "./finances-overview-view";
import { FinancesMovementsView } from "./finances-movements-view";
import { FinancesSettingsView } from "./finances-settings-view";

export type CurrencyViewMode = 'mix' | 'primary' | 'secondary';

const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

interface FinancePageClientProps {
    title: string;
    movements: any[];
    wallets: { id: string; wallet_name: string }[];
    projects: { id: string; name: string }[];
    organizationId: string;
    clients?: any[];
    financialData?: any;
    settingsData: {
        preferences: any;
        contactCurrencies: any;
        contactWallets: any;
        availableCurrencies: any;
        availableWallets: any;
        subscription: any;
    };
    tabLabels: {
        overview: string;
        movements: string;
        settings: string;
    };
}

export function FinancePageClient({
    title,
    movements,
    wallets,
    projects,
    organizationId,
    clients = [],
    financialData,
    settingsData,
    tabLabels
}: FinancePageClientProps) {
    // Active tab
    const [activeTab, setActiveTab] = useState("overview");



    // Date range filter - no default selection (infinite until user selects)
    const [dateRange, setDateRange] = useState<DateRangeFilterValue | undefined>(undefined);

    // Filter movements by date range (only for overview tab)
    const filteredMovements = useMemo(() => {
        if (activeTab !== 'overview') return movements;
        if (!dateRange?.from && !dateRange?.to) return movements;

        return movements.filter(m => {
            const paymentDate = new Date(m.payment_date);
            if (dateRange?.from && paymentDate < dateRange.from) return false;
            if (dateRange?.to && paymentDate > dateRange.to) return false;
            return true;
        });
    }, [movements, dateRange, activeTab]);



    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <PageWrapper
                type="page"
                title={title}
                icon={<DollarSign />}
                tabs={
                    <TabsList className="bg-transparent p-0 gap-4 flex items-start justify-start">
                        <TabsTrigger value="overview" className={tabTriggerClass}>
                            {tabLabels.overview}
                        </TabsTrigger>
                        <TabsTrigger value="payments" className={tabTriggerClass}>
                            {tabLabels.movements}
                        </TabsTrigger>
                        <TabsTrigger value="settings" className={tabTriggerClass}>
                            {tabLabels.settings}
                        </TabsTrigger>
                    </TabsList>
                }
            >
                <ContentLayout variant="wide" className="pb-6">
                    <TabsContent value="overview" className="m-0 focus-visible:outline-none">
                        {/* Portal toolbar to header for Overview tab */}
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
                        <FinancesOverviewView
                            movements={filteredMovements}
                            wallets={wallets}
                        />
                    </TabsContent>
                    <TabsContent value="payments" className="m-0 h-full focus-visible:outline-none">
                        <FinancesMovementsView
                            movements={movements}
                            wallets={wallets}
                            projects={projects}
                            showProjectColumn={true}
                            organizationId={organizationId}
                            currencies={settingsData.availableCurrencies?.map((c: any) => ({
                                id: c.id,
                                name: c.name,
                                code: c.code,
                                symbol: c.symbol
                            })) ?? []}
                            clients={clients}
                            financialData={financialData}
                        />
                    </TabsContent>
                    <TabsContent value="settings" className="m-0 focus-visible:outline-none">
                        <FinancesSettingsView
                            organizationId={organizationId}
                            preferences={settingsData.preferences}
                            orgCurrencies={settingsData.contactCurrencies}
                            orgWallets={settingsData.contactWallets}
                            availableCurrencies={settingsData.availableCurrencies}
                            availableWallets={settingsData.availableWallets}
                            subscription={settingsData.subscription}
                        />
                    </TabsContent>
                </ContentLayout>
            </PageWrapper>
        </Tabs>
    );
}
