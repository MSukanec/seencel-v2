"use client";

import { FileText } from "lucide-react";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { QuotesList } from "../components/lists/quotes-list";
import { QuoteView } from "../types";
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

export function QuotesListView({
    organizationId,
    projectId,
    quotes,
    financialData,
    clients,
    projects,
}: QuotesPageViewProps) {
    // In project context, we don't show tabs (and now organization neither)
    const isProjectContext = !!projectId;

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
