"use client";

import { useState } from "react";
import { Banknote, Plus, Upload, Download } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { FacetedFilter } from "@/components/layout/dashboard/shared/toolbar/toolbar-faceted-filter";
import { useModal } from "@/stores/modal-store";
import { useRouter } from "next/navigation";
import { PaymentsDataTable } from "../components/tables/payments-data-table";
import { PaymentForm } from "../components/forms/clients-payment-form";
import { ClientPaymentView, OrganizationFinancialData } from "../types";
import { ImportConfig } from "@/lib/import-utils";
import { createImportBatch, importPaymentsBatch, revertImportBatch } from "@/actions/import-actions";

interface ClientsPaymentsViewProps {
    data: ClientPaymentView[];
    clients: any[];
    financialData: OrganizationFinancialData;
    projectId: string;
    orgId: string;
}

export function ClientsPaymentsView({
    data,
    clients,
    financialData,
    projectId,
    orgId
}: ClientsPaymentsViewProps) {
    const { openModal } = useModal();
    const router = useRouter();
    const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
    const [walletFilter, setWalletFilter] = useState<Set<string>>(new Set());

    // ========================================
    // FILTER OPTIONS
    // ========================================
    const statusOptions = [
        { label: "Confirmado", value: "confirmed" },
        { label: "Pendiente", value: "pending" },
        { label: "Rechazado", value: "rejected" },
        { label: "Anulado", value: "void" },
    ];

    // Get unique wallets from data
    const walletOptions = Array.from(
        new Set(data.map(p => p.wallet_name).filter(Boolean))
    ).map(name => ({ label: name as string, value: name as string }));

    // ========================================
    // IMPORT CONFIG
    // ========================================
    const paymentsImportConfig: ImportConfig<any> = {
        entityLabel: "Pagos",
        entityId: "client_payments",
        columns: [
            {
                id: "payment_date",
                label: "Fecha",
                required: true,
                type: "date",
                example: "2024-01-15"
            },
            {
                id: "client_name",
                label: "Cliente",
                required: true,
                example: "Juan Pérez",
                foreignKey: {
                    table: 'project_clients',
                    labelField: 'contact_full_name',
                    valueField: 'id',
                    fetchOptions: async () => clients.map(c => ({
                        id: c.id,
                        label: c.contact_full_name || 'Sin nombre'
                    })),
                }
            },
            {
                id: "amount",
                label: "Monto",
                required: true,
                type: "currency",
                example: "150000"
            },
            {
                id: "currency_code",
                label: "Moneda",
                required: false,
                example: "ARS",
                foreignKey: {
                    table: 'currencies',
                    labelField: 'code',
                    valueField: 'id',
                    fetchOptions: async () => financialData.currencies.map(c => ({
                        id: c.id,
                        label: c.code
                    })),
                }
            },
            {
                id: "wallet_name",
                label: "Billetera",
                required: false,
                example: "Banco Principal",
                foreignKey: {
                    table: 'wallets',
                    labelField: 'name',
                    valueField: 'id',
                    fetchOptions: async () => financialData.wallets.map(w => ({
                        id: w.id,
                        label: w.name
                    })),
                }
            },
            {
                id: "exchange_rate",
                label: "Tipo de Cambio",
                required: false,
                type: "number",
                example: "1.0000"
            },
            {
                id: "reference",
                label: "Referencia",
                required: false,
                example: "TRX-12345"
            },
            {
                id: "notes",
                label: "Notas",
                required: false
            },
        ],
        onImport: async (records) => {
            try {
                const batch = await createImportBatch(orgId, "client_payments", records.length);
                const result = await importPaymentsBatch(orgId, projectId, records, batch.id);
                router.refresh();
                return {
                    success: result.success,
                    errors: result.errors,
                    warnings: result.warnings,
                    batchId: batch.id
                };
            } catch (error: any) {
                console.error("Import error:", error);
                throw error;
            }
        },
        onRevert: async (batchId) => {
            await revertImportBatch(batchId, 'client_payments');
            router.refresh();
        }
    };

    // ========================================
    // HANDLERS
    // ========================================
    const handleNewPayment = () => {
        openModal(
            <PaymentForm
                projectId={projectId}
                organizationId={orgId}
                clients={clients}
                financialData={financialData}
                onSuccess={() => {
                    router.refresh();
                }}
            />,
            {
                title: "Nuevo Pago de Cliente",
                description: "Registra un nuevo pago para este proyecto.",
                size: "lg"
            }
        );
    };

    const handleImport = () => {
        // TODO: Open import modal
        console.log("Import clicked", paymentsImportConfig);
    };

    const handleExport = () => {
        // TODO: Export to Excel
        console.log("Export clicked");
    };

    // ========================================
    // FILTERED DATA
    // ========================================
    const filteredData = data.filter(payment => {
        if (statusFilter.size > 0 && !statusFilter.has(payment.status)) {
            return false;
        }
        if (walletFilter.size > 0 && (!payment.wallet_name || !walletFilter.has(payment.wallet_name))) {
            return false;
        }
        return true;
    });

    // ✅ CORRECTO: EmptyState en la View con Toolbar en header
    if (data.length === 0) {
        return (
            <>
                <Toolbar
                    portalToHeader
                    actions={[
                        {
                            label: "Nuevo Pago",
                            icon: Plus,
                            onClick: handleNewPayment,
                            variant: "default"
                        },
                        {
                            label: "Importar",
                            icon: Upload,
                            onClick: handleImport
                        },
                        {
                            label: "Exportar",
                            icon: Download,
                            onClick: handleExport
                        }
                    ]}
                />
                <div className="h-full flex items-center justify-center">
                    <EmptyState
                        icon={Banknote}
                        title="Sin pagos registrados"
                        description="Registrá el primer pago de tus clientes o importalos desde un archivo Excel."
                    />
                </div>
            </>
        );
    }

    // ✅ CORRECTO: Toolbar en header con filtros facetados + split button
    return (
        <>
            <Toolbar
                portalToHeader
                leftActions={
                    <div className="flex gap-2">
                        <FacetedFilter
                            title="Estado"
                            options={statusOptions}
                            selectedValues={statusFilter}
                            onSelect={(value) => {
                                const newSet = new Set(statusFilter);
                                if (newSet.has(value)) {
                                    newSet.delete(value);
                                } else {
                                    newSet.add(value);
                                }
                                setStatusFilter(newSet);
                            }}
                            onClear={() => setStatusFilter(new Set())}
                        />
                        {walletOptions.length > 0 && (
                            <FacetedFilter
                                title="Billetera"
                                options={walletOptions}
                                selectedValues={walletFilter}
                                onSelect={(value) => {
                                    const newSet = new Set(walletFilter);
                                    if (newSet.has(value)) {
                                        newSet.delete(value);
                                    } else {
                                        newSet.add(value);
                                    }
                                    setWalletFilter(newSet);
                                }}
                                onClear={() => setWalletFilter(new Set())}
                            />
                        )}
                    </div>
                }
                actions={[
                    {
                        label: "Nuevo Pago",
                        icon: Plus,
                        onClick: handleNewPayment,
                        variant: "default"
                    },
                    {
                        label: "Importar",
                        icon: Upload,
                        onClick: handleImport
                    },
                    {
                        label: "Exportar",
                        icon: Download,
                        onClick: handleExport
                    }
                ]}
            />
            <PaymentsDataTable
                data={filteredData}
                clients={clients}
                financialData={financialData}
                projectId={projectId}
                orgId={orgId}
            />
        </>
    );
}
