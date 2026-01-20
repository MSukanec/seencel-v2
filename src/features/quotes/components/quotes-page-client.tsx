"use client";

import { QuoteView } from "@/features/quotes/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { ContentLayout } from "@/components/layout/content-layout";
import { FileText, Package } from "lucide-react";
import { QuotesList } from "./lists/quotes-list";
import { EmptyState } from "@/components/ui/empty-state";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { OrganizationFinancialData } from "@/features/clients/types";

// Reusable tab trigger style
const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

interface QuotesPageClientProps {
    quotes: QuoteView[];
    organizationId: string;
    financialData: OrganizationFinancialData;
    clients: { id: string; name: string }[];
    projects: { id: string; name: string }[];
    defaultTab?: string;
}

export function QuotesPageClient({
    quotes,
    organizationId,
    financialData,
    clients,
    projects,
    defaultTab = "quotes"
}: QuotesPageClientProps) {
    const pathname = usePathname();
    const [activeTab, setActiveTab] = useState(defaultTab);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        // Shallow URL update without full page refresh
        window.history.replaceState(null, '', `${pathname}?view=${value}`);
    };

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
            <PageWrapper
                type="page"
                title="Presupuestos"
                icon={<FileText />}
                tabs={
                    <TabsList className="bg-transparent p-0 gap-4 flex items-start justify-start">
                        <TabsTrigger value="quotes" className={tabTriggerClass}>
                            Presupuestos
                        </TabsTrigger>
                        <TabsTrigger value="materials" className={tabTriggerClass}>
                            Materiales
                        </TabsTrigger>
                    </TabsList>
                }
            >
                <ContentLayout variant="wide">
                    <TabsContent value="quotes" className="flex-1 flex flex-col mt-0 min-h-0">
                        <QuotesList
                            quotes={quotes}
                            organizationId={organizationId}
                            financialData={financialData}
                            clients={clients}
                            projects={projects}
                        />
                    </TabsContent>

                    <TabsContent value="materials" className="flex-1 flex flex-col mt-0 min-h-0">
                        <EmptyState
                            icon={Package}
                            title="Lista de Materiales"
                            description="Próximamente: visualizá todos los materiales resultantes de tus presupuestos."
                        />
                    </TabsContent>
                </ContentLayout>
            </PageWrapper>
        </Tabs>
    );
}
