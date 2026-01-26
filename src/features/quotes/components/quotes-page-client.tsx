"use client";

import { QuoteView } from "@/features/quotes/types";
import { PageWrapper } from "@/components/layout";
import { ContentLayout } from "@/components/layout";
import { FileText } from "lucide-react";
import { QuotesList } from "./lists/quotes-list";
import { OrganizationFinancialData } from "@/features/clients/types";

interface QuotesPageClientProps {
    quotes: QuoteView[];
    organizationId: string;
    financialData: OrganizationFinancialData;
    clients: { id: string; name: string }[];
    projects: { id: string; name: string }[];
}

export function QuotesPageClient({
    quotes,
    organizationId,
    financialData,
    clients,
    projects,
}: QuotesPageClientProps) {

    return (
        <PageWrapper
            type="page"
            title="Presupuestos"
            icon={<FileText />}
        >
            <ContentLayout variant="wide">
                <QuotesList
                    quotes={quotes}
                    organizationId={organizationId}
                    financialData={financialData}
                    clients={clients}
                    projects={projects}
                />
            </ContentLayout>
        </PageWrapper>
    );
}

