import { getFinancialMovements } from "@/features/organization/queries";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { ContentLayout } from "@/components/layout/content-layout";
import { Wallet } from "lucide-react";
import { FinanceOverview } from "@/features/finance/components/finance-overview";

export default async function FinancePage() {
    const { movements, error } = await getFinancialMovements();

    if (error || !movements) {
        return (
            <PageWrapper type="page" title="Finanzas">
                <ContentLayout variant="wide">
                    <div className="p-8 text-center text-red-500">Error loading financial data: {error}</div>
                </ContentLayout>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper type="page" title="Finanzas" icon={<Wallet />}>
            <ContentLayout variant="wide">
                <FinanceOverview movements={movements} />
            </ContentLayout>
        </PageWrapper>
    );
}
