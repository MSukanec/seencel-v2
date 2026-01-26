"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QuoteView } from "../types";
import { ChangeOrdersList } from "../components/lists/change-orders-list";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { Plus } from "lucide-react";
import { toast } from "sonner";
// We need to import the Change Order creation form/modal later or use a placeholder action
import { useModal } from "@/providers/modal-store";
import { QuoteForm } from "../components/forms/quote-form";

interface QuoteChangeOrdersViewProps {
    contract: QuoteView;
    changeOrders: QuoteView[];
    currencies: { id: string; name: string; symbol: string }[];
}

export function QuoteChangeOrdersView({
    contract,
    changeOrders,
    currencies
}: QuoteChangeOrdersViewProps) {
    const router = useRouter();
    const { openModal, closeModal } = useModal();

    const handleCreateChangeOrder = () => {
        // Map simple currencies to OrganizationCurrency shape to satisfy types
        const fullCurrencies = currencies.map(c => ({
            ...c,
            code: c.symbol, // Fallback
            is_default: c.id === contract.currency_id,
            exchange_rate: 1
        }));

        // We reuse QuoteForm but pass parent_quote_id (contract.id)
        openModal(
            <QuoteForm
                mode="create"
                organizationId={contract.organization_id}
                projectId={contract.project_id || undefined}
                // Pre-fill parent contract
                initialData={{
                    quote_type: 'change_order',
                    parent_quote_id: contract.id,
                    project_id: contract.project_id,
                    client_id: contract.client_id,
                    currency_id: contract.currency_id,
                    version: 1,
                    // Empty required fields
                    name: "",
                    status: 'draft',
                    organization_id: contract.organization_id,
                    tax_pct: contract.tax_pct,
                    created_at: '',
                    updated_at: ''
                } as any}
                financialData={{
                    currencies: fullCurrencies,
                    defaultCurrencyId: contract.currency_id,
                    defaultTaxLabel: contract.tax_label || "IVA",
                    // Dummy values to satisfy OrganizationFinancialData interface
                    defaultWalletId: "",
                    wallets: [],
                    preferences: {} as any
                }}
                clients={[]} // Not needed as it inherits
                projects={[]} // Not needed as it inherits
                onCancel={closeModal}
                onSuccess={(id: string | undefined) => {
                    closeModal();
                    toast.success("Adicional creado correctamente");
                    router.refresh();
                }}
                parentQuoteId={contract.id}
                parentQuoteName={contract.name}
            />,
            {
                title: "Nuevo Adicional",
                description: `Creando adicional para contrato: ${contract.name}`,
                size: "lg"
            }
        );
    };

    return (
        <div className="space-y-6">
            <Toolbar
                portalToHeader
                actions={[
                    {
                        label: "Nuevo Adicional",
                        icon: Plus,
                        onClick: handleCreateChangeOrder
                    }
                ]}
            />

            <ChangeOrdersList
                contractId={contract.id}
                contractName={contract.name}
                changeOrders={changeOrders}
                currencySymbol={contract.currency_symbol || '$'}
                onRefresh={() => router.refresh()}
                organizationId={contract.organization_id}
                financialData={{
                    currencies: currencies,
                    defaultCurrencyId: contract.currency_id
                }}
            />
        </div>
    );
}
