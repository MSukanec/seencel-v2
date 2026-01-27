"use client";

import { useMemo, useState, useTransition } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Receipt, DollarSign, TrendingDown, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format, isAfter, isBefore, isEqual, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

import { GeneralCost, GeneralCostPaymentView } from "@/types/general-costs";
import { deleteGeneralCostPayment } from "@/actions/general-costs";
import { PaymentForm } from "./forms/general-costs-payment-form";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, DataTableColumnHeader } from "@/components/shared/data-table";
import { DataTableAvatarCell } from "@/components/shared/data-table/data-table-avatar-cell";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { EmptyState } from "@/components/ui/empty-state";
import { DateRangeFilter, DateRangeFilterValue } from "@/components/layout/dashboard/shared/toolbar/toolbar-date-range-filter";
import { useModal } from "@/providers/modal-store";

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

interface PaymentsTableProps {
    data: GeneralCostPaymentView[];
    concepts: GeneralCost[];
    wallets: { id: string; wallet_name: string }[];
    currencies: { id: string; code: string; symbol: string }[];
    organizationId: string;
}

export function PaymentsTable({ data, concepts, wallets, currencies, organizationId }: PaymentsTableProps) {
    const { openModal, closeModal } = useModal();

    // === Centralized money operations ===
    const money = useMoney();

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [paymentToDelete, setPaymentToDelete] = useState<GeneralCostPaymentView | null>(null);
    const [isDeleting, startDeleteTransition] = useTransition();

    // Date range filter state
    const [dateRange, setDateRange] = useState<DateRangeFilterValue | undefined>(undefined);

    // Filter payments by date range
    const filteredPayments = useMemo(() => {
        if (!dateRange || (!dateRange.from && !dateRange.to)) {
            return data;
        }
        return data.filter(p => {
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
    }, [data, dateRange]);

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
                size: "md"
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
        let totalGastos = 0;
        let totalConfirmados = 0;
        let totalPendientes = 0;

        filteredPayments.forEach(p => {
            const amount = Number(p.amount) || 0;
            totalGastos += amount;
            if (p.status === 'confirmed') {
                totalConfirmados += amount;
            } else if (p.status === 'pending') {
                totalPendientes += amount;
            }
        });

        return {
            totalGastos,
            totalConfirmados,
            totalPendientes,
            totalPagos: filteredPayments.length
        };
    }, [filteredPayments]);

    const columns: ColumnDef<GeneralCostPaymentView>[] = [
        {
            accessorKey: "payment_date",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
            cell: ({ row }) => {
                const date = new Date(row.original.payment_date);
                return (
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">{date.toLocaleDateString()}</span>
                        <span className="text-xs text-muted-foreground capitalize">
                            {format(date, 'MMMM yyyy', { locale: es })}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: "general_cost_name",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Concepto" />,
            cell: ({ row }) => (
                <DataTableAvatarCell
                    title={row.original.general_cost_name || "Gasto sin concepto"}
                    subtitle={row.original.creator_full_name || row.original.category_name || "Sin categoría"}
                    src={row.original.creator_avatar_url}
                    fallback={(row.original.creator_full_name?.[0] || row.original.category_name?.[0] || "G").toUpperCase()}
                />
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
        {
            accessorKey: "wallet_name",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Billetera" />,
            cell: ({ row }) => (
                <span className="text-sm text-foreground/80">{row.original.wallet_name || "-"}</span>
            ),
        },
        {
            accessorKey: "amount",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Monto" className="justify-end" />,
            cell: ({ row }) => {
                const amount = Number(row.original.amount);
                const exchangeRate = Number(row.original.exchange_rate);
                const hasExchangeRate = exchangeRate && exchangeRate !== 1;
                const currencyCode = row.original.currency_code || row.original.currency_id;

                return (
                    <div className="flex flex-col items-end text-right">
                        <span className="font-mono font-medium text-amount-negative">
                            -{formatCurrency(Math.abs(amount), currencyCode)}
                        </span>
                        {hasExchangeRate && (
                            <span className="text-xs text-muted-foreground">
                                Cot. {exchangeRate.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                            </span>
                        )}
                    </div>
                );
            }
        },
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
            <div className="h-full flex items-center justify-center">
                <EmptyState
                    icon={Receipt}
                    title="Sin pagos registrados"
                    description="No hay pagos de gastos generales registrados."
                    action={
                        <Button onClick={() => handleOpenForm()} size="lg">
                            <Plus className="mr-2 h-4 w-4" /> Registrar Pago
                        </Button>
                    }
                />
            </div>
        );
    }

    const statusOptions = [
        { label: "Confirmado", value: "confirmed" },
        { label: "Pendiente", value: "pending" },
        { label: "Vencido", value: "overdue" },
        { label: "Cancelado", value: "cancelled" },
    ];

    return (
        <div className="space-y-6">
            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <DashboardKpiCard
                    title="Total Gastos"
                    value={formatCurrency(kpiData.totalGastos)}
                    icon={<TrendingDown className="h-5 w-5" />}
                    iconClassName="bg-amount-negative/10 text-amount-negative"
                />
                <DashboardKpiCard
                    title="Confirmados"
                    value={formatCurrency(kpiData.totalConfirmados)}
                    icon={<DollarSign className="h-5 w-5" />}
                    iconClassName="bg-amount-positive/10 text-amount-positive"
                />
                <DashboardKpiCard
                    title="Pendientes"
                    value={formatCurrency(kpiData.totalPendientes)}
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
                searchKey="general_cost_name"
                searchPlaceholder="Buscar pagos..."
                enableRowSelection={true}
                enableRowActions={true}
                onEdit={handleOpenForm}
                onDelete={handleDeleteClick}
                initialSorting={[{ id: "payment_date", desc: true }]}
                facetedFilters={[
                    {
                        columnId: "status",
                        title: "Estado",
                        options: statusOptions
                    }
                ]}
                leftActions={
                    <DateRangeFilter
                        title="Fechas"
                        value={dateRange}
                        onChange={(value) => setDateRange(value)}
                    />
                }
                toolbarInHeader={true}
                onClearFilters={() => setDateRange(undefined)}
                actions={[
                    { label: "Registrar Pago", icon: Plus, onClick: () => handleOpenForm() },
                    { label: "Exportar Excel", icon: FileSpreadsheet, onClick: () => console.log("Export Excel") }
                ]}
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
    );
}
