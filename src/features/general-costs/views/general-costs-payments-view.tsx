"use client";

import { useMemo, useState, useTransition } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Receipt, DollarSign, TrendingDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { GeneralCost, GeneralCostPaymentView } from "@/features/general-costs/types";
import { deleteGeneralCostPayment } from "@/features/general-costs/actions";
import { PaymentForm } from "../forms/general-costs-payment-form";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, DataTableColumnHeader } from "@/components/shared/data-table";
import { createDateColumn, createTextColumn, createMoneyColumn } from "@/components/shared/data-table/columns";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { useModal } from "@/stores/modal-store";

import { useMoney } from "@/hooks/use-money";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface GeneralCostsPaymentsViewProps {
    data: GeneralCostPaymentView[];
    concepts: GeneralCost[];
    wallets: { id: string; wallet_name: string }[];
    currencies: { id: string; name: string; code: string; symbol: string }[];
    organizationId: string;
}

export function GeneralCostsPaymentsView({ data, concepts, wallets, currencies, organizationId }: GeneralCostsPaymentsViewProps) {
    const { openModal, closeModal } = useModal();

    // === Centralized money operations ===
    const money = useMoney();

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [paymentToDelete, setPaymentToDelete] = useState<GeneralCostPaymentView | null>(null);
    const [isDeleting, startDeleteTransition] = useTransition();

    // Use centralized formatting
    const formatCurrency = (amount: number, currencyCode?: string) => {
        return money.format(amount, currencyCode);
    };

    const handleOpenForm = (payment?: GeneralCostPaymentView) => {
        openModal(
            <PaymentForm
                initialData={payment}
                concepts={concepts}
                wallets={wallets}
                currencies={currencies}
                organizationId={organizationId}
                onSuccess={closeModal}
                onCancel={closeModal}
            />,
            {
                title: payment ? "Editar Pago" : "Registrar Pago",
                description: payment
                    ? "Modificá los datos del pago de gasto general."
                    : "Registrá un nuevo pago de gasto general.",
                size: "lg"
            }
        );
    };

    // Open form in view mode (read-only) when row is clicked
    const handleRowClick = (payment: GeneralCostPaymentView) => {
        openModal(
            <PaymentForm
                initialData={payment}
                concepts={concepts}
                wallets={wallets}
                currencies={currencies}
                organizationId={organizationId}
                onSuccess={closeModal}
                onCancel={closeModal}
                onEdit={() => {
                    closeModal();
                    handleOpenForm(payment);
                }}
                viewMode={true}
            />,
            {
                title: "Detalle del Pago",
                description: "Información del pago de gasto general.",
                size: "lg"
            }
        );
    };

    const handleDeleteClick = (payment: GeneralCostPaymentView) => {
        setPaymentToDelete(payment);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!paymentToDelete) return;

        startDeleteTransition(async () => {
            try {
                await deleteGeneralCostPayment(paymentToDelete.id);
                toast.success("Pago eliminado");
                setIsDeleteDialogOpen(false);
            } catch (error) {
                console.error(error);
                toast.error("Error al eliminar el pago");
            }
        });
    };

    // Calculate KPI values
    const kpiData = useMemo(() => {
        const allItems: { amount: number; currency_code: string; exchange_rate?: number }[] = [];
        const confirmedItems: { amount: number; currency_code: string; exchange_rate?: number }[] = [];
        const pendingItems: { amount: number; currency_code: string; exchange_rate?: number }[] = [];

        data.forEach(p => {
            const item = {
                amount: Number(p.amount) || 0,
                currency_code: p.currency_code || 'ARS',
                exchange_rate: Number(p.exchange_rate) || 1
            };
            allItems.push(item);
            if (p.status === 'confirmed') {
                confirmedItems.push(item);
            } else if (p.status === 'pending') {
                pendingItems.push(item);
            }
        });

        return {
            allItems,
            confirmedItems,
            pendingItems,
            totalPagos: data.length
        };
    }, [data]);

    const columns: ColumnDef<GeneralCostPaymentView>[] = [
        createDateColumn<GeneralCostPaymentView>({
            accessorKey: "payment_date",
            avatarUrlKey: "creator_avatar_url",
            avatarFallbackKey: "creator_full_name",
        }),
        {
            accessorKey: "general_cost_name",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Concepto" />,
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium">{row.original.general_cost_name || "Gasto sin concepto"}</span>
                    <span className="text-xs text-muted-foreground">{row.original.category_name || "Sin categoría"}</span>
                </div>
            ),
            enableSorting: true,
            enableHiding: false,
        },
        {
            accessorKey: "notes",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Descripción" />,
            cell: ({ row }) => {
                const notes = row.original.notes;
                const reference = row.original.reference;
                return (
                    <div className="max-w-[180px] truncate">
                        {notes ? (
                            <span className="text-sm" title={notes}>{notes}</span>
                        ) : reference ? (
                            <span className="text-sm text-muted-foreground" title={reference}>Ref: {reference}</span>
                        ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                        )}
                    </div>
                );
            },
        },
        createTextColumn<GeneralCostPaymentView>({
            accessorKey: "wallet_name",
            title: "Billetera",
            muted: true,
        }),
        createMoneyColumn<GeneralCostPaymentView>({
            accessorKey: "amount",
            prefix: "-",
            colorMode: "negative",
            currencyKey: "currency_code",
        }),
        {
            accessorKey: "status",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
            cell: ({ row }) => {
                const status = row.original.status;
                let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
                let className = "";

                switch (status) {
                    case "confirmed":
                        variant = "outline";
                        className = "bg-amount-positive/10 text-amount-positive border-amount-positive/20";
                        break;
                    case "pending":
                        variant = "outline";
                        className = "bg-amber-500/10 text-amber-600 border-amber-500/20";
                        break;
                    case "overdue":
                        variant = "destructive";
                        break;
                    case "cancelled":
                        variant = "secondary";
                        break;
                    default:
                        variant = "secondary";
                }

                const label =
                    status === "confirmed" ? "Confirmado" :
                        status === "pending" ? "Pendiente" :
                            status === "overdue" ? "Vencido" :
                                status === "cancelled" ? "Cancelado" : status;

                return (
                    <Badge variant={variant} className={className}>
                        {label}
                    </Badge>
                );
            },
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id));
            },
        }
    ];

    if (data.length === 0) {
        return (
            <>
                <Toolbar
                    portalToHeader
                    actions={[
                        { label: "Nuevo Pago", icon: Plus, onClick: () => handleOpenForm() }
                    ]}
                />
                <div className="h-full flex items-center justify-center">
                    <EmptyState
                        icon={Receipt}
                        title="Sin pagos registrados"
                        description="No hay pagos de gastos generales registrados."
                    />
                </div>
            </>
        );
    }

    const statusOptions = [
        { label: "Confirmado", value: "confirmed" },
        { label: "Pendiente", value: "pending" },
        { label: "Vencido", value: "overdue" },
        { label: "Cancelado", value: "cancelled" },
    ];

    return (
        <>
            <Toolbar
                portalToHeader
                actions={[
                    { label: "Nuevo Pago", icon: Plus, onClick: () => handleOpenForm() }
                ]}
            />
            <div className="space-y-6">
                {/* KPI Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <DashboardKpiCard
                        title="Total Gastos"
                        items={kpiData.allItems}
                        icon={<TrendingDown className="h-5 w-5" />}
                        iconClassName="bg-amount-negative/10 text-amount-negative"
                    />
                    <DashboardKpiCard
                        title="Confirmados"
                        items={kpiData.confirmedItems}
                        icon={<DollarSign className="h-5 w-5" />}
                        iconClassName="bg-amount-positive/10 text-amount-positive"
                    />
                    <DashboardKpiCard
                        title="Pendientes"
                        items={kpiData.pendingItems}
                        icon={<DollarSign className="h-5 w-5" />}
                        iconClassName="bg-amber-500/10 text-amber-600"
                    />
                    <DashboardKpiCard
                        title="Total Pagos"
                        value={kpiData.totalPagos.toString()}
                        icon={<Receipt className="h-5 w-5" />}
                    />
                </div>

                {/* Payments Table */}
                <DataTable
                    columns={columns}
                    data={data}
                    enableRowSelection={true}
                    enableRowActions={true}
                    onEdit={handleOpenForm}
                    onDelete={handleDeleteClick}
                    onRowClick={handleRowClick}
                    initialSorting={[{ id: "payment_date", desc: true }]}
                />

                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará el registro del pago.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault();
                                    confirmDelete();
                                }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={isDeleting}
                            >
                                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Eliminar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </>
    );
}
