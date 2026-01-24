"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { FileText, Package } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { QuotesList } from "../components/lists/quotes-list";
import { QuoteView } from "../types";
import { EmptyState } from "@/components/ui/empty-state";
import { OrganizationFinancialData } from "@/features/clients/types";

// ============================================================================
// QUOTES PAGE VIEW
// ============================================================================
// Shared view for Quotes that works in both Organization and Project contexts
// - Organization context: Shows tabs (Presupuestos/Materiales), all org quotes
// - Project context: No tabs, shows only project-specific quotes
// ============================================================================

const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

interface QuotesPageViewProps {
    organizationId: string;
    projectId?: string | null;
    quotes: QuoteView[];
    financialData: OrganizationFinancialData;
    clients: { id: string; name: string }[];
    projects: { id: string; name: string }[];
    defaultTab?: string;
}

export function QuotesPageView({
    organizationId,
    projectId,
    quotes,
    financialData,
    clients,
    projects,
    defaultTab = "quotes"
}: QuotesPageViewProps) {
    const pathname = usePathname();
    const [activeTab, setActiveTab] = useState(defaultTab);

    // In project context, we don't show tabs
    const isProjectContext = !!projectId;

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        // Shallow URL update without full page refresh
        window.history.replaceState(null, '', `${pathname}?view=${value}`);
    };

    const tabs = !isProjectContext ? (
        <TabsList className="bg-transparent p-0 gap-4 flex items-start justify-start">
            <TabsTrigger value="quotes" className={tabTriggerClass}>
                Presupuestos
            </TabsTrigger>
            <TabsTrigger value="materials" className={tabTriggerClass}>
                Materiales
            </TabsTrigger>
        </TabsList>
    ) : undefined;

    const content = (
        <QuotesList
            quotes={quotes}
            organizationId={organizationId}
            financialData={financialData}
            clients={clients}
            projects={projects}
            projectId={projectId ?? undefined}
            showProjectColumn={!isProjectContext}
        />
    );

    // Project context: Simple layout without tabs
    if (isProjectContext) {
        return (
            <PageWrapper
                type="page"
                title="Presupuestos"
                icon={<FileText />}
            >
                <ContentLayout variant="wide">
                    {content}
                </ContentLayout>
            </PageWrapper>
        );
    }

    // Organization context: With tabs
    return (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
            <PageWrapper
                type="page"
                title="Presupuestos"
                icon={<FileText />}
                tabs={tabs}
            >
                <ContentLayout variant="wide">
                    <TabsContent value="quotes" className="flex-1 flex flex-col mt-0 min-h-0">
                        {content}
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
