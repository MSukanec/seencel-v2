"use client";

import { ContentLayout } from "@/components/layout";
import { MaterialPaymentsDataTable } from "../components/tables/material-payments-data-table";
import { MaterialPaymentView, OrganizationFinancialData, MaterialPurchase } from "../types";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Banknote, Plus } from "lucide-react";
import { useModal } from "@/providers/modal-store";
import { MaterialPaymentForm } from "../components/forms/material-payment-form";
import { useRouter } from "next/navigation";

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
    const { openModal } = useModal();
    const router = useRouter();

    const handleNewPayment = () => {
        openModal(
            <MaterialPaymentForm
                projectId={projectId}
                organizationId={orgId}
                purchases={purchases}
                financialData={financialData}
                onSuccess={() => {
                    router.refresh();
                }}
            />,
            {
                title: "Nuevo Pago de Material",
                description: "Registra un nuevo pago por materiales.",
                size: "lg"
            }
        );
    };

    // Empty State - VIEW is responsible for this decision
    if (payments.length === 0) {
        return (
            <ContentLayout variant="wide" className="pb-6">
                <EmptyState
                    icon={Banknote}
                    title="Sin pagos de materiales"
                    description="Registrá el primer pago de materiales para este proyecto."
                    action={
                        <Button onClick={handleNewPayment}>
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Pago
                        </Button>
                    }
                />
            </ContentLayout>
        );
    }

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

