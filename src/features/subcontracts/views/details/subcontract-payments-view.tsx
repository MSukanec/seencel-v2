"use client";

import { useState } from "react";
import { Plus, Banknote, Wallet, CircleDollarSign, Upload, Download } from "lucide-react";
import { useModal } from "@/providers/modal-store";
import { SubcontractPaymentForm } from "@/features/subcontracts/components/forms/subcontract-payment-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { FacetedFilter } from "@/components/layout/dashboard/shared/toolbar/toolbar-faceted-filter";
import { useMoney } from "@/hooks/use-money";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { SubcontractPaymentsDataTable } from "@/features/subcontracts/components/tables/subcontract-payments-data-table";

interface SubcontractPaymentsViewProps {
    subcontract: any;
    payments: any[];
    financialData: any;
    projectId: string;
    organizationId: string;
}

export function SubcontractPaymentsView({
    subcontract,
    payments,
    financialData,
    projectId,
    organizationId
}: SubcontractPaymentsViewProps) {
    const { openModal, closeModal } = useModal();
    const router = useRouter();
    const { format: formatMoney, sum, config } = useMoney();
    const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());

    // Calculate summary using functional amounts
    const paymentsWithCurrency = payments.map(p => ({
        amount: Number(p.functional_amount || p.amount || 0),
        currency_code: config.functionalCurrencyCode,
    }));
    const paidSummary = sum(paymentsWithCurrency);

    const contractAmount = Number(subcontract.amount_total || 0);
    const contractCurrencyCode = subcontract.currency?.code || config.functionalCurrencyCode;
    const contractSymbol = subcontract.currency?.symbol || config.functionalCurrencySymbol;
    const isFunctional = contractCurrencyCode === config.functionalCurrencyCode;
    const contractFunctional = isFunctional
        ? contractAmount
        : contractAmount * (subcontract.exchange_rate || config.currentExchangeRate || 1);
    const remaining = contractFunctional - paidSummary.total;

    // ========================================
    // FILTER OPTIONS
    // ========================================
    const statusOptions = [
        { label: "Confirmado", value: "confirmed" },
        { label: "Pendiente", value: "pending" },
        { label: "Rechazado", value: "rejected" },
        { label: "Anulado", value: "void" },
    ];

    // ========================================
    // FILTERED DATA
    // ========================================
    const filteredPayments = payments.filter(payment => {
        if (statusFilter.size > 0 && !statusFilter.has(payment.status)) {
            return false;
        }
        return true;
    });

    // ========================================
    // HANDLERS
    // ========================================
    const handleNewPayment = () => {
        openModal(
            <SubcontractPaymentForm
                projectId={projectId}
                organizationId={organizationId}
                subcontracts={[subcontract]}
                financialData={financialData}
                initialData={{ subcontract_id: subcontract.id }}
                onSuccess={() => {
                    closeModal();
                    router.refresh();
                }}
            />,
            {
                title: "Nuevo Pago",
                description: `Registrar pago para ${subcontract.contact?.full_name || subcontract.title || 'este subcontrato'}`,
                size: "lg"
            }
        );
    };

    const handleImport = () => {
        toast.info("Próximamente: Importación de pagos");
    };

    const handleExport = () => {
        toast.info("Próximamente: Exportación de pagos");
    };

    // ========================================
    // EMPTY STATE
    // ========================================
    if (payments.length === 0) {
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
                        }
                    ]}
                />
                <div className="h-full flex items-center justify-center">
                    <EmptyState
                        icon={Banknote}
                        title="Sin pagos registrados"
                        description="Registra el primer pago para este subcontrato."
                    />
                </div>
            </>
        );
    }

    // ========================================
    // MAIN RENDER
    // ========================================
    return (
        <>
            {/* Toolbar with filters */}
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

            <div className="h-full flex flex-col space-y-4">
                {/* KPI Cards: Monto Contrato → Total Pagado → Saldo Pendiente */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <DashboardKpiCard
                        title="Monto Contrato"
                        amount={contractAmount}
                        icon={<CircleDollarSign className="h-6 w-6" />}
                        size="default"
                    />
                    <DashboardKpiCard
                        title="Total Pagado"
                        amount={paidSummary.total}
                        icon={<Wallet className="h-6 w-6" />}
                        iconClassName="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                        description={`${payments.length} pago${payments.length !== 1 ? 's' : ''} registrado${payments.length !== 1 ? 's' : ''}`}
                        size="default"
                    />
                    <DashboardKpiCard
                        title="Saldo Pendiente"
                        amount={remaining}
                        icon={<Banknote className="h-6 w-6" />}
                        iconClassName={remaining > 0
                            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600"
                            : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                        }
                        size="default"
                    />
                </div>

                {/* Data Table - Using specialized component */}
                <div className="flex-1 min-h-0">
                    <SubcontractPaymentsDataTable
                        data={filteredPayments}
                        subcontract={subcontract}
                        financialData={financialData}
                        projectId={projectId}
                        organizationId={organizationId}
                    />
                </div>
            </div>
        </>
    );
}
