"use client";

import { useMemo, useState, useTransition } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Receipt, DollarSign, TrendingDown, Loader2, HardHat } from "lucide-react";
import { toast } from "sonner";
import { isAfter, isBefore, isEqual, startOfDay, endOfDay } from "date-fns";

import { LaborPaymentView, LaborType, ProjectLaborView } from "../types";
import { deleteLaborPayment } from "../actions";
import { LaborPaymentForm } from "../forms/labor-payment-form";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, DataTableColumnHeader } from "@/components/shared/data-table";
import { createDateColumn, createTextColumn, createMoneyColumn } from "@/components/shared/data-table/columns";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ContentLayout } from "@/components/layout";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { DateRangeFilterValue } from "@/components/layout/dashboard/shared/toolbar/toolbar-date-range-filter";
import { useModal } from "@/stores/modal-store";

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

interface FormattedWallet {
    id: string;
    wallet_id: string;
    name: string;
    balance: number;
    currency_symbol: string;
    currency_code?: string;
    is_default: boolean;
}

interface FormattedCurrency {
    id: string;
    name: string;
    code: string;
    symbol: string;
    is_default: boolean;
    exchange_rate: number;
}

interface LaborPaymentsViewProps {
    projectId: string;
    orgId: string;
    payments: LaborPaymentView[];
    laborTypes: LaborType[];
    workers: ProjectLaborView[];
    wallets: FormattedWallet[];
    currencies: FormattedCurrency[];
}

export function LaborPaymentsView({
    projectId,
    orgId,
    payments,
    laborTypes,
    workers,
    wallets,
    currencies,
}: LaborPaymentsViewProps) {
    const { openModal, closeModal } = useModal();

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [paymentToDelete, setPaymentToDelete] = useState<LaborPaymentView | null>(null);
    const [isDeleting, startDeleteTransition] = useTransition();

    // Date range filter state
    const [dateRange, setDateRange] = useState<DateRangeFilterValue | undefined>(undefined);

    // Filter payments by date range
    const filteredPayments = useMemo(() => {
        if (!dateRange || (!dateRange.from && !dateRange.to)) {
            return payments;
        }
        return payments.filter(p => {
            const date = startOfDay(new Date(p.payment_date));
            const from = dateRange.from ? startOfDay(dateRange.from) : null;
            const to = dateRange.to ? endOfDay(dateRange.to) : null;
            if (from && to) {
                return (isAfter(date, from) || isEqual(date, from)) &&
                    (isBefore(date, to) || isEqual(date, to));
            }
            if (from) return isAfter(date, from) || isEqual(date, from);
            if (to) return isBefore(date, to) || isEqual(date, to);
            return true;
        });
    }, [payments, dateRange]);

    const handleOpenForm = (payment?: LaborPaymentView) => {
        openModal(
            <LaborPaymentForm
                initialData={payment}
                workers={workers}
                laborTypes={laborTypes}
                wallets={wallets}
                currencies={currencies}
                projectId={projectId}
                organizationId={orgId}
                onSuccess={closeModal}
                onCancel={closeModal}
            />,
            {
                title: payment ? "Editar Pago" : "Registrar Pago",
                description: payment
                    ? "Modificá los datos del pago de mano de obra."
                    : "Completá los campos para registrar un nuevo pago.",
                size: "md",
            }
        );
    };

    const handleRowClick = (payment: LaborPaymentView) => {
        // Open in edit mode for now
        handleOpenForm(payment);
    };

    const handleDeleteClick = (payment: LaborPaymentView) => {
        setPaymentToDelete(payment);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!paymentToDelete) return;

        startDeleteTransition(async () => {
            try {
                await deleteLaborPayment(paymentToDelete.id, projectId);
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

        filteredPayments.forEach(p => {
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
            totalPagos: filteredPayments.length
        };
    }, [filteredPayments]);

    const columns: ColumnDef<LaborPaymentView>[] = [
        createDateColumn<LaborPaymentView>({
            accessorKey: "payment_date",
            avatarUrlKey: "creator_avatar_url",
            avatarFallbackKey: "creator_name",
        }),
        {
            accessorKey: "contact_display_name",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Trabajador" />,
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium">{row.original.contact_display_name || "Sin asignar"}</span>
                    <span className="text-xs text-muted-foreground">{row.original.labor_type_name || "Sin categoría"}</span>
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
        createTextColumn<LaborPaymentView>({
            accessorKey: "wallet_name",
            title: "Billetera",
            muted: true,
        }),
        createMoneyColumn<LaborPaymentView>({
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
                    case "rejected":
                        variant = "destructive";
                        break;
                    case "void":
                        variant = "secondary";
                        break;
                    default:
                        variant = "secondary";
                }

                const label =
                    status === "confirmed" ? "Confirmado" :
                        status === "pending" ? "Pendiente" :
                            status === "rejected" ? "Rechazado" :
                                status === "void" ? "Anulado" : status;

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

    // Toolbar always present
    const toolbar = (
        <Toolbar
            portalToHeader
            actions={[
                {
                    label: "Registrar Pago",
                    icon: Plus,
                    onClick: () => handleOpenForm(),
                }
            ]}
        />
    );

    if (payments.length === 0) {
        return (
            <ContentLayout variant="wide" className="pb-6">
                {toolbar}
                <div className="h-full flex items-center justify-center">
                    <EmptyState
                        icon={HardHat}
                        title="Sin pagos registrados"
                        description="No hay pagos de mano de obra registrados."
                    />
                </div>
            </ContentLayout>
        );
    }

    return (
        <ContentLayout variant="wide" className="pb-6">
            {toolbar}
            <div className="space-y-6">
                {/* KPI Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <DashboardKpiCard
                        title="Total Mano de Obra"
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
                    data={filteredPayments}
                    enableRowSelection={true}
                    enableRowActions={true}
                    onEdit={handleOpenForm}
                    onDelete={handleDeleteClick}
                    onRowClick={handleRowClick}
                    initialSorting={[{ id: "payment_date", desc: true }]}
                    onClearFilters={() => setDateRange(undefined)}
                />
            </div>

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
        </ContentLayout>
    );
}
