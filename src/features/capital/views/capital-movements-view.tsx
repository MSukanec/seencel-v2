"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableAvatarCell } from "@/components/shared/data-table/data-table-avatar-cell";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { createDateColumn, createMoneyColumn } from "@/components/shared/data-table/columns";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Plus, Landmark, Wallet, TrendingUp, TrendingDown, Download, Upload, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { isAfter, isBefore, isEqual, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { useMoney } from "@/hooks/use-money";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { useModal } from "@/providers/modal-store";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { FacetedFilter } from "@/components/layout/dashboard/shared/toolbar/toolbar-faceted-filter";
import { DateRangeFilter, DateRangeFilterValue } from "@/components/layout/dashboard/shared/toolbar/toolbar-date-range-filter";

interface CapitalMovementsViewProps {
    movements: any[];
    participants: any[];
    wallets?: any[];
    organizationId: string;
    financialData: any;
}

export function CapitalMovementsView({
    movements,
    participants,
    wallets = [],
    organizationId,
    financialData
}: CapitalMovementsViewProps) {
    const { openModal, closeModal } = useModal();
    const money = useMoney();

    // Filters state
    const [dateRange, setDateRange] = useState<DateRangeFilterValue | undefined>(undefined);
    const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());
    const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());

    // Filter movements
    const filteredMovements = useMemo(() => {
        let result = movements;

        // Date filter
        if (dateRange && (dateRange.from || dateRange.to)) {
            result = result.filter(m => {
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
        }

        // Type filter
        if (typeFilter.size > 0) {
            result = result.filter(m => typeFilter.has(m.type));
        }

        // Status filter
        if (statusFilter.size > 0) {
            result = result.filter(m => statusFilter.has(m.status));
        }

        return result;
    }, [movements, dateRange, typeFilter, statusFilter]);

    // Format helpers
    const formatCurrency = (amount: number, currencyCode?: string) => {
        return money.format(amount, currencyCode);
    };

    const getWalletName = (walletId: string) => {
        if (!walletId) return "-";
        return wallets.find(w => w.id === walletId)?.wallet_name || "-";
    };

    const getParticipantName = (participantId: string) => {
        if (!participantId) return "-";
        return participants.find(p => p.id === participantId)?.name || "-";
    };

    // Handlers
    const handleCreate = () => {
        // TODO: Implement capital movement form
        console.log("Create capital movement");
    };

    const handleExport = () => {
        console.log("Export capital movements");
    };

    // Columns
    const columns: ColumnDef<any>[] = [
        createDateColumn<any>({
            accessorKey: "payment_date",
            showAvatar: false,
        }),
        {
            accessorKey: "type",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
            cell: ({ row }) => {
                const type = row.original.type;
                const isContribution = type === 'contribution';
                const participant = participants.find(p => p.id === row.original.participant_id);

                return (
                    <DataTableAvatarCell
                        title={isContribution ? "Aporte" : "Retiro"}
                        subtitle={participant?.name || "Participante"}
                        src={participant?.avatar_url}
                        fallback={participant?.name?.[0] || "?"}
                    />
                );
            },
        },
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
        createMoneyColumn<any>({
            accessorKey: "amount",
            prefix: "auto",
            colorMode: "auto",
            signKey: "type",
            signPositiveValue: "contribution",
            currencyKey: "currency_code",
        }),
        {
            accessorKey: "status",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
            cell: ({ row }) => {
                const status = row.original.status;
                let className = "";

                switch (status) {
                    case "confirmed":
                    case "completed":
                        className = "bg-amount-positive/10 text-amount-positive border-amount-positive/20";
                        break;
                    case "pending":
                        className = "bg-amber-500/10 text-amber-600 border-amber-500/20";
                        break;
                    case "rejected":
                    case "cancelled":
                        className = "bg-destructive/10 text-destructive border-destructive/20";
                        break;
                    default:
                        className = "bg-muted text-muted-foreground";
                }

                const label =
                    (status === "confirmed" || status === "completed") ? "Confirmado" :
                        status === "pending" ? "Pendiente" :
                            (status === "rejected" || status === "cancelled") ? "Rechazado" :
                                status === "void" ? "Anulado" : status || "Pendiente";

                return (
                    <Badge variant="outline" className={className}>
                        {label}
                    </Badge>
                );
            },
        }
    ];

    // KPI calculations
    const kpiData = useMemo(() => {
        const contributions = filteredMovements
            .filter(m => m.type === 'contribution')
            .reduce((sum, m) => sum + Number(m.functional_amount || m.amount || 0), 0);

        const withdrawals = filteredMovements
            .filter(m => m.type === 'withdrawal')
            .reduce((sum, m) => sum + Number(m.functional_amount || m.amount || 0), 0);

        return {
            contributions,
            withdrawals,
            netCapital: contributions - withdrawals,
            totalMovements: filteredMovements.length
        };
    }, [filteredMovements]);

    // Filter options
    const typeOptions = [
        { label: "Aporte", value: "contribution" },
        { label: "Retiro", value: "withdrawal" },
    ];

    const statusOptions = [
        { label: "Confirmado", value: "confirmed" },
        { label: "Pendiente", value: "pending" },
        { label: "Rechazado", value: "rejected" },
    ];

    // Clear all filters
    const handleClearFilters = () => {
        setDateRange(undefined);
        setTypeFilter(new Set());
        setStatusFilter(new Set());
    };

    // ========================================
    // RENDER - EMPTY STATE
    // ========================================

    if (movements.length === 0) {
        return (
            <>
                <Toolbar
                    portalToHeader
                    actions={[
                        {
                            label: "Nuevo Movimiento",
                            icon: Plus,
                            onClick: handleCreate,
                            variant: "default"
                        }
                    ]}
                />
                <div className="h-full flex items-center justify-center">
                    <EmptyState
                        icon={Landmark}
                        title="Sin movimientos de capital"
                        description="Registrá el primer aporte o retiro de capital para comenzar."
                    />
                </div>
            </>
        );
    }

    // ========================================
    // RENDER - CONTENT
    // ========================================

    return (
        <>
            <Toolbar
                portalToHeader
                leftActions={
                    <>
                        <DateRangeFilter
                            title="Período"
                            value={dateRange}
                            onChange={setDateRange}
                        />
                        <FacetedFilter
                            title="Tipo"
                            options={typeOptions}
                            selectedValues={typeFilter}
                            onSelect={(value) => {
                                const newSet = new Set(typeFilter);
                                if (newSet.has(value)) {
                                    newSet.delete(value);
                                } else {
                                    newSet.add(value);
                                }
                                setTypeFilter(newSet);
                            }}
                            onClear={() => setTypeFilter(new Set())}
                        />
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
                    </>
                }
                actions={[
                    {
                        label: "Nuevo Movimiento",
                        icon: Plus,
                        onClick: handleCreate,
                        variant: "default"
                    },
                    {
                        label: "Exportar",
                        icon: Download,
                        onClick: handleExport
                    }
                ]}
            />

            <div className="space-y-6">
                {/* KPI Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <DashboardKpiCard
                        title="Aportes"
                        value={formatCurrency(kpiData.contributions)}
                        icon={<ArrowUpRight className="h-5 w-5" />}
                        iconClassName="bg-amount-positive/10 text-amount-positive"
                    />
                    <DashboardKpiCard
                        title="Retiros"
                        value={formatCurrency(kpiData.withdrawals)}
                        icon={<ArrowDownRight className="h-5 w-5" />}
                        iconClassName="bg-amount-negative/10 text-amount-negative"
                    />
                    <DashboardKpiCard
                        title="Capital Neto"
                        value={formatCurrency(kpiData.netCapital)}
                        icon={<Wallet className="h-5 w-5" />}
                        iconClassName={kpiData.netCapital >= 0 ? "bg-amount-positive/10 text-amount-positive" : "bg-amount-negative/10 text-amount-negative"}
                    />
                    <DashboardKpiCard
                        title="Movimientos"
                        value={kpiData.totalMovements.toString()}
                        icon={<Landmark className="h-5 w-5" />}
                    />
                </div>

                {/* Movements Table */}
                <DataTable
                    columns={columns}
                    data={filteredMovements}
                    enableRowSelection={false}
                    enableRowActions={true}
                    initialSorting={[{ id: "payment_date", desc: true }]}
                />
            </div>
        </>
    );
}
