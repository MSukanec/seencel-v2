import { PageWrapper } from "@/components/layout/dashboard/shared/page-wrapper";
import { ContentLayout } from "@/components/layout/dashboard/shared/content-layout";
import { getOrganizationFinancialData } from "@/features/organization/actions/get-organization-financial-data";
import { getOrganizationMembership } from "@/features/organization/actions/get-organization-membership";
import { SubcontractsClient } from "@/features/subcontracts/components/subcontracts-client";

interface SubcontractsPageProps {
    params: {
        projectId: string;
    };
}

export default async function SubcontractsPage({ params }: SubcontractsPageProps) {
    const { projectId } = params;

    // Fetch critical data
    const membership = await getOrganizationMembership();
    const financialData = await getOrganizationFinancialData(membership.organizationId);

    // TODO: Fetch initial subcontracts count or data if needed for SSR

    return (
        <PageWrapper>
            <ContentLayout
                title="Subcontratos"
                description="Gestión de contratos con terceros y proveedores de servicios"
                isWide
            >
                <SubcontractsClient
                    projectId={projectId}
                    organizationId={membership.organizationId}
                    financialData={financialData}
                />
            </ContentLayout>
        </PageWrapper>
    );
}
