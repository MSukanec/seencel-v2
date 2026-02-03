"use client";

import { useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { HardHat } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWrapper } from "@/components/layout";

import { LaborOverviewView } from "./labor-overview-view";
import { LaborPaymentsView } from "./labor-payments-view";
import { LaborTeamView } from "./labor-team-view";
import { LaborSettingsView } from "./labor-settings-view";
import { LaborCatalogView } from "./labor-catalog-view";
import { LaborPaymentView, LaborType, ProjectLaborView, LaborCategory } from "../types";

const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

interface FormattedWallet {
    id: string;
    wallet_id: string;
    name: string;
    balance: number;
    currency_symbol: string;
    currency_code?: string;
    is_default: boolean;
}

interface FormattedCurrency {
    id: string;
    name: string;
    code: string;
    symbol: string;
    is_default: boolean;
    exchange_rate: number;
}

interface ContactOption {
    id: string;
    name: string;
    image?: string | null;
    fallback?: string;
}

// Types for catalog (minimal versions for passing data)
interface CatalogLaborCategory {
    id: string;
    name: string;
    description: string | null;
    is_system: boolean;
}

interface LaborLevel {
    id: string;
    name: string;
    description: string | null;
    sort_order?: number;
}

interface LaborRole {
    id: string;
    name: string;
    description: string | null;
    is_system: boolean;
}

interface CatalogLaborType {
    id: string;
    name: string;
    description: string | null;
    labor_category_id: string;
    labor_level_id: string;
    labor_role_id: string | null;
    unit_id: string;
    category_name: string | null;
    level_name: string | null;
    role_name: string | null;
    unit_name: string | null;
}

interface Unit {
    id: string;
    name: string;
}

interface LaborPageViewProps {
    projectId: string;
    orgId: string;
    defaultTab?: string;
    payments: LaborPaymentView[];
    laborTypes: LaborType[];
    workers: ProjectLaborView[];
    wallets: FormattedWallet[];
    currencies: FormattedCurrency[];
    contacts: ContactOption[];
    // Catalog data (optional - only passed when catalog tab is needed)
    catalogCategories?: CatalogLaborCategory[];
    catalogLevels?: LaborLevel[];
    catalogRoles?: LaborRole[];
    catalogTypes?: CatalogLaborType[];
    catalogUnits?: Unit[];
    // Settings data
    laborCategories?: LaborCategory[];
}

export function LaborPageView({
    projectId,
    orgId,
    defaultTab = "overview",
    payments,
    laborTypes,
    workers,
    wallets,
    currencies,
    contacts,
    catalogCategories = [],
    catalogLevels = [],
    catalogRoles = [],
    catalogTypes = [],
    catalogUnits = [],
    laborCategories = [],
}: LaborPageViewProps) {
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const currentTab = searchParams.get("view") || defaultTab;
    const [activeTab, setActiveTab] = useState(currentTab);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        // Update URL without navigation (shallow)
        const params = new URLSearchParams(searchParams.toString());
        params.set("view", value);
        window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
    };

    // Check if catalog data is available
    const hasCatalogData = catalogCategories.length > 0 || catalogLevels.length > 0 || catalogRoles.length > 0 || catalogTypes.length > 0;

    const tabs = (
        <TabsList className="bg-transparent p-0 gap-4 flex items-start justify-start">
            <TabsTrigger value="overview" className={tabTriggerClass}>Visión General</TabsTrigger>
            <TabsTrigger value="team" className={tabTriggerClass}>Equipo</TabsTrigger>
            <TabsTrigger value="payments" className={tabTriggerClass}>Pagos</TabsTrigger>
            {hasCatalogData && (
                <TabsTrigger value="catalog" className={tabTriggerClass}>Catálogo</TabsTrigger>
            )}
            <TabsTrigger value="settings" className={tabTriggerClass}>Ajustes</TabsTrigger>
        </TabsList>
    );

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
            <PageWrapper
                type="page"
                title="Mano de Obra"
                tabs={tabs}
                icon={<HardHat />}
            >
                <TabsContent value="overview" className="m-0 flex-1 h-full flex flex-col focus-visible:outline-none">
                    <LaborOverviewView
                        projectId={projectId}
                        orgId={orgId}
                        payments={payments}
                    />
                </TabsContent>
                <TabsContent value="team" className="m-0 flex-1 h-full flex flex-col focus-visible:outline-none">
                    <LaborTeamView
                        projectId={projectId}
                        orgId={orgId}
                        workers={workers}
                        laborTypes={laborTypes}
                        contacts={contacts}
                    />
                </TabsContent>
                <TabsContent value="payments" className="m-0 flex-1 h-full flex flex-col focus-visible:outline-none">
                    <LaborPaymentsView
                        projectId={projectId}
                        orgId={orgId}
                        payments={payments}
                        laborTypes={laborTypes}
                        workers={workers}
                        wallets={wallets}
                        currencies={currencies}
                    />
                </TabsContent>
                {hasCatalogData && (
                    <TabsContent value="catalog" className="m-0 flex-1 h-full flex flex-col focus-visible:outline-none overflow-hidden">
                        <LaborCatalogView
                            laborCategories={catalogCategories}
                            laborLevels={catalogLevels}
                            laborRoles={catalogRoles}
                            laborTypes={catalogTypes}
                            units={catalogUnits}
                            isAdminMode={false}
                        />
                    </TabsContent>
                )}
                <TabsContent value="settings" className="m-0 flex-1 h-full flex flex-col focus-visible:outline-none">
                    <LaborSettingsView
                        projectId={projectId}
                        orgId={orgId}
                        laborTypes={laborCategories}
                    />
                </TabsContent>
            </PageWrapper>
        </Tabs>
    );
}

