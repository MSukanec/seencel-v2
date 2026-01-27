"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Banknote, FilterX } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWrapper } from "@/components/layout";
import { ContentLayout } from "@/components/layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DateRangeFilter, type DateRangeFilterValue } from "@/components/layout/dashboard/shared/toolbar/toolbar-date-range-filter";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { useCurrency } from "@/providers/currency-context";
import { useFinancialFeatures } from "@/hooks/use-financial-features";
import { useMoney } from "@/hooks/use-money";
import type { DisplayMode } from "@/lib/money/money";

import { ProjectClientView, ClientFinancialSummary, ClientPaymentView, ClientRole, OrganizationFinancialData } from "@/features/clients/types";
import { ClientsOverview } from "./clients-overview-view";
import { ClientsListView } from "./clients-list-view";
import { CommitmentsView } from "./clients-commitments-view";
import { ClientsPaymentsView } from "./clients-payments-view";
import { ClientsSchedulesView } from "./clients-schedules-view";
import { ClientSettings } from "./clients-settings-view";
import { HealthMonitorBanner } from "@/features/health/components/health-monitor-banner";
import { analyzePaymentsHealth } from "@/features/health/modules/payments";

const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

interface ClientsPageClientProps {
    projectId: string;
    orgId: string;
    clients: ProjectClientView[];
    financialSummary: ClientFinancialSummary[];
    commitments: any[];
    payments: ClientPaymentView[];
    schedules: any[];
    roles: ClientRole[];
    financialData: OrganizationFinancialData;
    defaultTab?: string;
    contacts?: { id: string; full_name?: string; email?: string; phone?: string; linked_user_id?: string; image_url?: string; }[];
    representativesByClient?: Record<string, any[]>;
}

export function ClientsPageClient({
    projectId,
    orgId,
    clients,
    financialSummary,
    commitments,
    payments,
    schedules,
    roles,
    financialData,
    defaultTab = "overview",
    contacts = [],
    representativesByClient = {}
}: ClientsPageClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const currentTab = searchParams.get("view") || defaultTab;

    // --- CURRENCY TOOLBAR STATE (Usando SOLO useMoney) ---
    const { primaryCurrency, secondaryCurrency } = useCurrency();
    const { showCurrencySelector } = useFinancialFeatures();
    const money = useMoney();

    // Map between UI tabs and DisplayMode
    type CurrencyViewMode = 'mix' | 'primary' | 'secondary';

    const modeToView = (mode: DisplayMode): CurrencyViewMode => {
        if (mode === 'mix') return 'mix';
        if (mode === 'secondary') return 'secondary';
        return 'primary'; // functional -> primary
    };

    const viewToMode = (view: CurrencyViewMode): DisplayMode => {
        if (view === 'mix') return 'mix';
        if (view === 'secondary') return 'secondary';
        return 'functional'; // primary -> functional
    };

    const currencyMode = modeToView(money.displayMode);

    const handleCurrencyModeChange = (mode: CurrencyViewMode) => {
        money.setDisplayMode(viewToMode(mode));
    };

    // Date range filter
    const [dateRange, setDateRange] = useState<DateRangeFilterValue | undefined>(undefined);

    // Filter payments by date range for overview
    const filteredPayments = useMemo(() => {
        if (!dateRange?.from && !dateRange?.to) return payments;
        return payments.filter(p => {
            const paymentDate = new Date(p.payment_date);
            if (dateRange?.from && paymentDate < dateRange.from) return false;
            if (dateRange?.to && paymentDate > dateRange.to) return false;
            return true;
        });
    }, [payments, dateRange]);

    // Currency mode selector element (for Toolbar)
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

    // --- HEALTH FILTER STATE ---
    const [healthFilterActive, setHealthFilterActive] = useState(false);

    // Analyze payments health
    const healthReport = useMemo(() => analyzePaymentsHealth(payments), [payments]);

    // Get the IDs of affected payments
    const affectedPaymentIds = useMemo(() => {
        return new Set(healthReport.issues.map(issue => issue.paymentId));
    }, [healthReport.issues]);

    // Filtered payments when health filter is active
    const displayedPayments = useMemo(() => {
        if (!healthFilterActive) return payments;
        return payments.filter(p => affectedPaymentIds.has(p.id));
    }, [payments, healthFilterActive, affectedPaymentIds]);

    // 🚀 PERFORMANCE FIX: Use local state + shallow URL update
    // router.replace() causes full re-fetch, this is instant
    const [activeTab, setActiveTab] = useState(currentTab);

    const handleTabChange = (value: string) => {
        setActiveTab(value); // Instant UI update

        // Update URL without navigation (shallow)
        const params = new URLSearchParams(searchParams.toString());
        params.set("view", value);
        window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
    };

    // Handler for "Mostrar" button - navigates to payments tab and activates filter
    const handleShowAffected = useCallback(() => {
        setHealthFilterActive(true);
        if (currentTab !== "payments") {
            handleTabChange("payments");
        }
    }, [currentTab]);

    // Handler to clear the filter
    const handleClearFilter = useCallback(() => {
        setHealthFilterActive(false);
    }, []);

    const tabs = (
        <TabsList className="bg-transparent p-0 gap-4 flex items-start justify-start">
            <TabsTrigger value="overview" className={tabTriggerClass}>Visión General</TabsTrigger>
            <TabsTrigger value="list" className={tabTriggerClass}>Lista</TabsTrigger>
            <TabsTrigger value="commitments" className={tabTriggerClass}>Compromisos</TabsTrigger>
            <TabsTrigger value="payments" className={tabTriggerClass}>Pagos</TabsTrigger>
            <TabsTrigger value="schedules" className={tabTriggerClass}>Cronogramas</TabsTrigger>
            <TabsTrigger value="settings" className={tabTriggerClass}>Ajustes</TabsTrigger>
        </TabsList>
    );

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
            <PageWrapper
                type="page"
                title="Compromisos y Pagos"
                tabs={tabs}
                icon={<Banknote />}
            >
                <ContentLayout variant="wide" className="pb-6">
                    {/* DATA HEALTH BANNER */}
                    <HealthMonitorBanner
                        report={healthReport}
                        moduleName="pagos"
                        storageKey={`clients-health-${projectId}`}
                        onShowAffected={handleShowAffected}
                        isFilterActive={healthFilterActive}
                        onClearFilter={handleClearFilter}
                    />

                    {/* FILTER INDICATOR - Shows when health filter is active */}
                    {healthFilterActive && activeTab === "payments" && (
                        <Alert className="mb-4 bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400">
                            <FilterX className="h-4 w-4 !text-orange-500" />
                            <AlertDescription className="flex items-center justify-between w-full">
                                <span>
                                    Mostrando solo los <strong>{displayedPayments.length}</strong> pagos con problemas de datos.
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-current hover:bg-orange-500/20"
                                    onClick={handleClearFilter}
                                >
                                    Mostrar todos
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}

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
                        <ClientsOverview summary={financialSummary} payments={filteredPayments} />
                    </TabsContent>
                    <TabsContent value="list" className="m-0 h-full focus-visible:outline-none">
                        <ClientsListView
                            data={clients}
                            roles={roles}
                            orgId={orgId}
                            projectId={projectId}
                            contacts={contacts}
                            representativesByClient={representativesByClient}
                        />
                    </TabsContent>
                    <TabsContent value="commitments" className="m-0 h-full focus-visible:outline-none">
                        <CommitmentsView
                            commitments={commitments}
                            clients={clients}
                            projectId={projectId}
                            orgId={orgId}
                            payments={payments}
                            financialData={financialData}
                        />
                    </TabsContent>
                    <TabsContent value="payments" className="m-0 h-full focus-visible:outline-none">
                        <ClientsPaymentsView
                            data={displayedPayments}
                            clients={clients}
                            financialData={financialData}
                            projectId={projectId}
                            orgId={orgId}
                        />
                    </TabsContent>
                    <TabsContent value="schedules" className="m-0 h-full focus-visible:outline-none">
                        <ClientsSchedulesView data={schedules} />
                    </TabsContent>
                    <TabsContent value="settings" className="m-0 h-full focus-visible:outline-none">
                        <ClientSettings roles={roles} orgId={orgId} />
                    </TabsContent>
                </ContentLayout>
            </PageWrapper >
        </Tabs >
    );
}

