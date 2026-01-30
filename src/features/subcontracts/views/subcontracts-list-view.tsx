"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Plus, Users, Wallet, CheckCircle2, AlertCircle } from "lucide-react";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";

import { useModal } from "@/providers/modal-store";
import { SubcontractsSubcontractForm } from "../forms/subcontracts-subcontract-form";
import { SubcontractCard } from "../components/subcontract-card";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { deleteSubcontractAction } from "@/features/subcontracts/actions";
import { DeleteConfirmationDialog } from "@/components/shared/forms/general/delete-confirmation-dialog";
import { toast } from "sonner";

import { useMoney } from "@/hooks/use-money";

interface SubcontractsListViewProps {
    projectId: string;
    organizationId: string;
    providers: { id: string; name: string; image?: string | null; fallback?: string }[];
    currencies: { id: string; code: string; symbol: string; name: string }[];
    initialSubcontracts: any[];
    payments?: any[]; // For accurate Total Paid calculation with individual exchange_rates
    defaultCurrencyId?: string | null;
    indexTypes?: { id: string; name: string; periodicity: string }[];
}

export function SubcontractsListView({ projectId, organizationId, providers, currencies, initialSubcontracts = [], payments = [], defaultCurrencyId, indexTypes = [] }: SubcontractsListViewProps) {
    const { openModal, closeModal } = useModal();
    const money = useMoney();
    const subcontracts = initialSubcontracts;

    // Search state
    const [searchQuery, setSearchQuery] = useState("");

    // Filter active subcontracts for calculations
    const activeSubcontracts = useMemo(() =>
        subcontracts.filter(s => s.status !== 'cancelled'),
        [subcontracts]
    );

    // Filter by search
    const filteredSubcontracts = useMemo(() => {
        if (!searchQuery.trim()) return subcontracts;
        const q = searchQuery.toLowerCase();
        return subcontracts.filter(s => {
            const title = (s.title || '').toLowerCase();
            const providerName = (s.contact?.full_name || s.contact?.company_name || '').toLowerCase();
            const description = (s.description || '').toLowerCase();
            return title.includes(q) || providerName.includes(q) || description.includes(q);
        });
    }, [subcontracts, searchQuery]);

    // KPI CALCULATIONS using useMoney with displayMode support
    const kpis = useMemo(() => {
        const isMixView = money.displayMode === 'mix';

        // Calculate totals per currency for mix mode breakdown
        const calculateBreakdown = (field: string) => {
            const totals: Record<string, { amount: number; symbol: string }> = {};

            activeSubcontracts.forEach(sub => {
                const currency = sub.currency_code || 'ARS';
                const symbol = sub.currency_symbol || '$';
                const val = Number(sub[field] || 0);

                if (!totals[currency]) {
                    totals[currency] = { amount: 0, symbol };
                }
                totals[currency].amount += val;
            });

            return Object.entries(totals).map(([code, data]) => ({
                currencyCode: code,
                symbol: data.symbol,
                nativeTotal: data.amount,
                functionalTotal: 0,
                isPrimary: code === money.config?.functionalCurrencyCode
            }));
        };

        // Calculate single value using money.sum for converted totals
        const calculateTotal = (field: string) => {
            const items = activeSubcontracts.map(sub => ({
                amount: Number(sub[field] || 0),
                currency_code: sub.currency_code || 'ARS',
                exchange_rate: Number(sub.exchange_rate) || money.config.currentExchangeRate || 1
            }));
            return money.sum(items).total;
        };

        // Calculate Total Paid from ACTUAL PAYMENTS with their own exchange_rates
        const calculateTotalPaid = () => {
            // Filter only confirmed/pending payments (not cancelled/void)
            const confirmedPayments = payments.filter(p =>
                p.status !== 'void' && p.status !== 'cancelled' && p.status !== 'rejected'
            );

            const items = confirmedPayments.map(p => ({
                amount: Number(p.amount || 0),
                currency_code: p.currency_code || 'ARS',
                exchange_rate: Number(p.exchange_rate) || money.config.currentExchangeRate || 1
            }));
            return money.sum(items).total;
        };

        return {
            totalContracted: calculateTotal('amount_total'),
            totalPaid: calculateTotalPaid(),
            totalRemaining: calculateTotal('remaining_amount'),
            contractedBreakdown: calculateBreakdown('amount_total'),
            paidBreakdown: calculateBreakdown('paid_amount'),
            remainingBreakdown: calculateBreakdown('remaining_amount'),
        };
    }, [activeSubcontracts, payments, money.config, money.displayMode]);



    // Helper to get display value based on mode
    const getDisplayValue = (total: number, breakdown: any[]) => {
        if (money.displayMode === 'mix' && breakdown.length === 1) {
            const item = breakdown[0];
            return `${item.symbol} ${item.nativeTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
        }
        return money.format(total);
    };

    const activeCount = activeSubcontracts.length;
    const totalCount = subcontracts.length;

    const router = useRouter();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [subcontractToDelete, setSubcontractToDelete] = useState<any | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Handlers
    const handleCreate = () => {
        openModal(
            <SubcontractsSubcontractForm
                onSuccess={() => {
                    closeModal();
                    router.refresh();
                }}
                onCancel={closeModal}
                organizationId={organizationId}
                projectId={projectId}
                providers={providers}
                currencies={currencies}
                defaultCurrencyId={defaultCurrencyId}
                indexTypes={indexTypes}
            />,
            {
                title: "Nuevo Subcontrato",
                description: "Complete los datos para registrar un nuevo subcontrato en el proyecto.",
                size: "lg"
            }
        );
    };

    const handleEdit = (subcontract: any) => {
        openModal(
            <SubcontractsSubcontractForm
                initialData={subcontract}
                onSuccess={() => {
                    closeModal();
                    router.refresh();
                }}
                onCancel={closeModal}
                organizationId={organizationId}
                projectId={projectId}
                providers={providers}
                currencies={currencies}
                defaultCurrencyId={defaultCurrencyId}
                indexTypes={indexTypes}
            />,
            {
                title: "Editar Subcontrato",
                description: "Modifique los datos del subcontrato.",
                size: "lg"
            }
        );
    };

    const handleDeleteClick = (subcontract: any) => {
        setSubcontractToDelete(subcontract);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!subcontractToDelete) return;
        setIsDeleting(true);
        try {
            await deleteSubcontractAction(subcontractToDelete.id);
            toast.success("Subcontrato eliminado");
            router.refresh();
        } catch (error) {
            toast.error("Error al eliminar el subcontrato");
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
            setSubcontractToDelete(null);
        }
    };

    const handleView = (subcontract: any) => {
        router.push(window.location.pathname + '/' + subcontract.id);
    };



    return (
        <div className="h-full flex flex-col">
            {/* Toolbar Portal to Header */}
            <Toolbar
                portalToHeader={true}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Buscar subcontratos..."
                actions={[
                    {
                        label: "Nuevo",
                        icon: Plus,
                        onClick: handleCreate
                    }
                ]}
            />

            {/* Scrollable Content - KPIs + Cards together */}
            <div className="flex-1 min-h-0 overflow-auto">
                <div className="space-y-4">
                    {/* KPI GRID */}
                    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                        <DashboardKpiCard
                            title="Total Contratado"
                            amount={kpis.totalContracted}
                            icon={<Wallet className="h-4 w-4" />}
                            currencyBreakdown={money.displayMode === 'mix' && kpis.contractedBreakdown.length > 1 ? kpis.contractedBreakdown : undefined}
                            description="Monto total acumulado"
                        />
                        <DashboardKpiCard
                            title="Total Pagado"
                            amount={kpis.totalPaid}
                            icon={<CheckCircle2 className="h-4 w-4" />}
                            currencyBreakdown={money.displayMode === 'mix' && kpis.paidBreakdown.length > 1 ? kpis.paidBreakdown : undefined}
                            iconClassName="text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20"
                            description="Pagos confirmados"
                        />
                        <DashboardKpiCard
                            title="Restante por Pagar"
                            amount={kpis.totalRemaining}
                            icon={<AlertCircle className="h-4 w-4" />}
                            currencyBreakdown={money.displayMode === 'mix' && kpis.remainingBreakdown.length > 1 ? kpis.remainingBreakdown : undefined}
                            iconClassName="text-amber-600 bg-amber-100 dark:bg-amber-900/20"
                            description="Pendiente de saldar"
                        />
                        <DashboardKpiCard
                            title="Subcontratos"
                            value={totalCount}
                            icon={<Users className="h-4 w-4" />}
                            description={`${activeCount} activos`}
                            iconClassName="text-blue-600 bg-blue-100 dark:bg-blue-900/20"
                        />
                    </div>

                    {/* Subcontracts List */}
                    {filteredSubcontracts.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            {filteredSubcontracts.map((subcontract) => (
                                <SubcontractCard
                                    key={subcontract.id}
                                    subcontract={subcontract}
                                    payments={payments}
                                    onView={handleView}
                                    onEdit={handleEdit}
                                    onDelete={handleDeleteClick}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={Users}
                            title={searchQuery ? "Sin resultados" : "No tienes subcontratos"}
                            description={searchQuery ? `No se encontraron subcontratos para "${searchQuery}"` : "Aquí aparecerán los contratos con proveedores y subcontratistas."}
                        />
                    )}
                </div>
            </div>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Eliminar Subcontrato"
                description={
                    <span>
                        ¿Estás seguro de eliminar el contrato con <strong>{subcontractToDelete?.contact?.full_name || subcontractToDelete?.contact?.company_name}</strong>?
                    </span>
                }
                confirmLabel="Eliminar"
                onConfirm={handleConfirmDelete}
                isDeleting={isDeleting}
            />
        </div>
    );
}
