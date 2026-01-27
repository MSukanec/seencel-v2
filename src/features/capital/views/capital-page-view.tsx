"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangeFilter, type DateRangeFilterValue } from "@/components/layout/dashboard/shared/toolbar/toolbar-date-range-filter";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { useCurrency } from "@/providers/currency-context";
import { useFinancialFeatures } from "@/hooks/use-financial-features";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { Landmark } from "lucide-react";
import { CapitalOverviewView } from "./capital-overview-view";
import { CapitalParticipantsView } from "./capital-participants-view";
import { CapitalBalancesView } from "./capital-balances-view";
import { CapitalMovementsView } from "./capital-movements-view";

export type CurrencyViewMode = 'mix' | 'primary' | 'secondary';

const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

interface CapitalPageViewProps {
    title: string;
    movements: any[];
    participants: any[];
    wallets: { id: string; wallet_name: string }[];
    organizationId: string;
    financialData: any;
}

export function CapitalPageView({
    title,
    movements,
    participants,
    wallets,
    organizationId,
    financialData,
}: CapitalPageViewProps) {
    // Active tab
    const [activeTab, setActiveTab] = useState("overview");

    // Currency context
    const { primaryCurrency, secondaryCurrency, setDisplayCurrency } = useCurrency();
    const { showCurrencySelector } = useFinancialFeatures();

    // Currency view mode: 'mix' (real currencies) | 'primary' | 'secondary'
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

    // Date range filter
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <PageWrapper
                type="page"
                title={title}
                icon={<Landmark />}
                tabs={
                    <TabsList className="bg-transparent p-0 gap-4 flex items-start justify-start">
                        <TabsTrigger value="overview" className={tabTriggerClass}>
                            Visión General
                        </TabsTrigger>
                        <TabsTrigger value="participants" className={tabTriggerClass}>
                            Participantes
                        </TabsTrigger>
                        <TabsTrigger value="balances" className={tabTriggerClass}>
                            Balances
                        </TabsTrigger>
                        <TabsTrigger value="movements" className={tabTriggerClass}>
                            Movimientos
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
                        <CapitalOverviewView
                            movements={filteredMovements}
                            participants={participants}
                            wallets={wallets}
                            currencyMode={currencyMode}
                        />
                    </TabsContent>
                    <TabsContent value="participants" className="m-0 h-full focus-visible:outline-none">
                        <CapitalParticipantsView
                            participants={participants}
                            organizationId={organizationId}
                        />
                    </TabsContent>
                    <TabsContent value="balances" className="m-0 h-full focus-visible:outline-none">
                        <CapitalBalancesView
                            participants={participants}
                            movements={movements}
                        />
                    </TabsContent>
                    <TabsContent value="movements" className="m-0 h-full focus-visible:outline-none">
                        <CapitalMovementsView
                            movements={movements}
                            participants={participants}
                            wallets={wallets}
                            organizationId={organizationId}
                            financialData={financialData}
                        />
                    </TabsContent>
                </ContentLayout>
            </PageWrapper>
        </Tabs>
    );
}
