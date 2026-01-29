"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableAvatarCell } from "@/components/shared/data-table/data-table-avatar-cell";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { ColumnDef, FilterFn } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Banknote, Wallet, TrendingUp, TrendingDown, FileSpreadsheet } from "lucide-react";
import { format, isAfter, isBefore, isEqual, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { useMoney } from "@/hooks/use-money";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { useModal } from "@/providers/modal-store";
import { MovementDetailModal } from "../modals/movement-detail-modal";
import { DateRangeFilter, DateRangeFilterValue } from "@/components/layout/dashboard/shared/toolbar/toolbar-date-range-filter";

interface FinancesMovementsViewProps {
    movements: any[];
    wallets?: any[];
    projects?: any[];
    showProjectColumn?: boolean;
}

export function FinancesMovementsView({ movements, wallets = [], projects = [], showProjectColumn = false }: FinancesMovementsViewProps) {
    const { openModal, closeModal } = useModal();

    // === Centralized money operations ===
    const money = useMoney();

    // Date range filter state
    const [dateRange, setDateRange] = useState<DateRangeFilterValue | undefined>(undefined);

    // Filter movements by date range
    const filteredMovements = useMemo(() => {
        if (!dateRange || (!dateRange.from && !dateRange.to)) {
            return movements;
        }
        return movements.filter(m => {
            const date = startOfDay(new Date(m.payment_date));
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
    }, [movements, dateRange]);

    // Use centralized formatting from useMoney()
    const formatCurrency = (amount: number, currencyCode?: string) => {
        return money.format(amount, currencyCode);
    };

    const getWalletName = (walletId: string) => {
        if (!walletId) return "-";
        return wallets.find(w => w.id === walletId)?.wallet_name || "-";
    };

    const getProjectName = (projectId: string) => {
        if (!projectId) return "-";
        return projects.find(p => p.id === projectId)?.name || "-";
    };

    // Handle row click to open detail modal
    const handleRowClick = (movement: any) => {
        openModal(
            <MovementDetailModal
                movement={movement}
                walletName={getWalletName(movement.wallet_id)}
                projectName={getProjectName(movement.project_id)}
                onEdit={() => {
                    closeModal();
                    // TODO: Connect to edit form when available
                    console.log("Edit movement:", movement.id);
                }}
                onClose={closeModal}
            />,
            {
                title: "Detalle del Movimiento",
                description: "Información completa del movimiento financiero.",
                size: "md"
            }
        );
    };

    const columns: ColumnDef<any>[] = [
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
            filterFn: (row, columnId, filterValue: DateRangeFilterValue | undefined) => {
                if (!filterValue || (!filterValue.from && !filterValue.to)) return true;
                const cellValue = row.getValue(columnId);
                if (!cellValue) return false;
                const date = startOfDay(new Date(cellValue as string));
                const from = filterValue.from ? startOfDay(filterValue.from) : null;
                const to = filterValue.to ? endOfDay(filterValue.to) : null;
                if (from && to) {
                    return (isAfter(date, from) || isEqual(date, from)) && (isBefore(date, to) || isEqual(date, to));
                }
                if (from) return isAfter(date, from) || isEqual(date, from);
                if (to) return isBefore(date, to) || isEqual(date, to);
                return true;
            },
        },
        {
            accessorKey: "movement_type",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
            cell: ({ row }) => {
                // Map movement_type to friendly label
                const typeLabels: Record<string, string> = {
                    'client_payment': 'Pago de Cliente',
                    'material_payment': 'Pago de Material',
                    'personnel_payment': 'Pago de Personal',
                    'partner_contribution': 'Aporte de Socio',
                    'partner_withdrawal': 'Retiro de Socio',
                    'general_cost_payment': 'Gastos Generales',
                    'wallet_transfer': 'Transferencia',
                    'currency_exchange': 'Cambio de Moneda',
                };
                const typeLabel = typeLabels[row.original.movement_type] || row.original.movement_type;

                return (
                    <DataTableAvatarCell
                        title={typeLabel}
                        subtitle={row.original.entity_name || "-"}
                        src={row.original.creator_avatar_url}
                        fallback={row.original.creator_full_name?.[0] || "?"}
                    />
                );
            },
            enableSorting: true,
            enableHiding: false,
        },
        // Project column - only shown in organization mode
        ...(showProjectColumn ? [{
            accessorKey: "project_id",
            header: ({ column }: any) => <DataTableColumnHeader column={column} title="Proyecto" />,
            cell: ({ row }: any) => (
                <span className="text-sm font-medium">{getProjectName(row.original.project_id)}</span>
            ),
        }] : []),
        {
            accessorKey: "description",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Descripción" />,
            cell: ({ row }) => (
                <div className="max-w-[180px] truncate" title={row.original.description || ""}>
                    <span className="text-sm">{row.original.description || "-"}</span>
                </div>
            ),
        },
        {
            accessorKey: "wallet_id",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Billetera" />,
            cell: ({ row }) => (
                <span className="text-sm text-foreground/80">{getWalletName(row.original.wallet_id)}</span>
            ),
        },
        {
            accessorKey: "amount",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Monto" className="justify-end" />,
            cell: ({ row }) => {
                const amount = Number(row.original.amount);
                const sign = Number(row.original.amount_sign ?? 1);
                const isPositive = sign > 0;
                const exchangeRate = Number(row.original.exchange_rate);
                const hasExchangeRate = exchangeRate && exchangeRate !== 1;

                return (
                    <div className="flex flex-col items-end text-right">
                        <span className={cn("font-mono font-medium", isPositive ? "text-amount-positive" : "text-amount-negative")}>
                            {isPositive ? "+" : "-"}{formatCurrency(Math.abs(amount), row.original.currency_code)}
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
                    case "completed":
                    case "paid":
                        variant = "outline";
                        className = "bg-amount-positive/10 text-amount-positive border-amount-positive/20";
                        break;
                    case "pending":
                        variant = "outline";
                        className = "bg-amber-500/10 text-amber-600 border-amber-500/20";
                        break;
                    case "rejected":
                    case "cancelled":
                        variant = "destructive";
                        break;
                    case "void":
                        variant = "secondary";
                        break;
                    default:
                        variant = "secondary";
                }

                const label =
                    (status === "confirmed" || status === "completed" || status === "paid") ? "Confirmado" :
                        status === "pending" ? "Pendiente" :
                            (status === "rejected" || status === "cancelled") ? "Rechazado" :
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

    if (movements.length === 0) {
        return (
            <div className="h-full flex items-center justify-center">
                <EmptyState
                    icon={Banknote}
                    title="Sin movimientos"
                    description="No hay movimientos registrados en este período."
                    action={
                        <Button onClick={() => console.log("New Movement")} size="lg">
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Movimiento
                        </Button>
                    }
                />
            </div>
        );
    }

    const statusOptions = [
        { label: "Confirmado", value: "confirmed" },
        { label: "Pendiente", value: "pending" },
        { label: "Rechazado", value: "rejected" },
        { label: "Anulado", value: "void" },
    ];

    // Calculate KPI values using centralized MoneyService
    const kpiData = useMemo(() => {
        const kpiMovements = filteredMovements.map(m => ({
            amount: m.amount,
            currency_code: m.currency_code,
            exchange_rate: m.exchange_rate,
            amount_sign: m.amount_sign,
        }));

        const result = money.calculateKPIs(kpiMovements);

        return {
            ingresos: result.totalIngresos,
            egresos: result.totalEgresos,
            balance: result.balance,
            totalMovimientos: result.totalMovements
        };
    }, [filteredMovements, money]);

    return (
        <div className="space-y-6">
            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <DashboardKpiCard
                    title="Ingresos"
                    value={formatCurrency(kpiData.ingresos)}
                    icon={<TrendingUp className="h-5 w-5" />}
                    iconClassName="bg-amount-positive/10 text-amount-positive"
                />
                <DashboardKpiCard
                    title="Egresos"
                    value={formatCurrency(kpiData.egresos)}
                    icon={<TrendingDown className="h-5 w-5" />}
                    iconClassName="bg-amount-negative/10 text-amount-negative"
                />
                <DashboardKpiCard
                    title="Balance"
                    value={formatCurrency(kpiData.balance)}
                    icon={<Wallet className="h-5 w-5" />}
                    iconClassName={kpiData.balance >= 0 ? "bg-amount-positive/10 text-amount-positive" : "bg-amount-negative/10 text-amount-negative"}
                />
                <DashboardKpiCard
                    title="Total Movimientos"
                    value={kpiData.totalMovimientos.toString()}
                    icon={<Banknote className="h-5 w-5" />}
                />
            </div>

            {/* Movements Table */}
            <DataTable
                columns={columns}
                data={filteredMovements}
                enableRowSelection={true}
                enableRowActions={true}
                onRowClick={handleRowClick}
                initialSorting={[{ id: "payment_date", desc: true }]}
                onClearFilters={() => setDateRange(undefined)}
            />
        </div>
    );
}
