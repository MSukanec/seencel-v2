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
import { LaborPaymentView, LaborType, ProjectLaborView } from "../types";

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

    const tabs = (
        <TabsList className="bg-transparent p-0 gap-4 flex items-start justify-start">
            <TabsTrigger value="overview" className={tabTriggerClass}>Visión General</TabsTrigger>
            <TabsTrigger value="team" className={tabTriggerClass}>Equipo</TabsTrigger>
            <TabsTrigger value="payments" className={tabTriggerClass}>Pagos</TabsTrigger>
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
                <TabsContent value="settings" className="m-0 flex-1 h-full flex flex-col focus-visible:outline-none">
                    <LaborSettingsView
                        projectId={projectId}
                        orgId={orgId}
                        laborTypes={laborTypes}
                    />
                </TabsContent>
            </PageWrapper>
        </Tabs>
    );
}
