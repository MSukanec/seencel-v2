"use client";

import { ContentLayout } from "@/components/layout";
import { MaterialPaymentsDataTable } from "../components/tables/material-payments-data-table";
import { MaterialPaymentView, OrganizationFinancialData, MaterialPurchase } from "../types";

interface MaterialsPaymentsViewProps {
    projectId: string;
    orgId: string;
    payments: MaterialPaymentView[];
    purchases: MaterialPurchase[];
    financialData: OrganizationFinancialData;
}

export function MaterialsPaymentsView({
    projectId,
    orgId,
    payments,
    purchases,
    financialData
}: MaterialsPaymentsViewProps) {
    return (
        <ContentLayout variant="wide" className="pb-6">
            <MaterialPaymentsDataTable
                data={payments}
                purchases={purchases}
                financialData={financialData}
                projectId={projectId}
                orgId={orgId}
            />
        </ContentLayout>
    );
}

