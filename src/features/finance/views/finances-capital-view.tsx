"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableAvatarCell } from "@/components/shared/data-table/data-table-avatar-cell";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { createDateColumn, createMoneyColumn } from "@/components/shared/data-table/columns";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { FacetedFilter } from "@/components/layout/dashboard/shared/toolbar/toolbar-faceted-filter";
import { useMoney } from "@/hooks/use-money";
import { cn } from "@/lib/utils";
import {
    Plus,
    Landmark,
    Wallet,
    Users,
    ArrowUpRight,
    ArrowDownRight,
    Download,
    UserPlus,
} from "lucide-react";

// ============================================================================
// FINANCES CAPITAL VIEW
// ============================================================================
// Single consolidated view for the Capital tab inside Finance page.
// Shows: KPIs → Participants Table → Movements Table
// ============================================================================

interface FinancesCapitalViewProps {
    movements: any[];
    participants: any[];
    wallets: { id: string; wallet_name: string }[];
    organizationId: string;
}

export function FinancesCapitalView({
    movements,
    participants,
    wallets = [],
    organizationId,
}: FinancesCapitalViewProps) {
    const money = useMoney();
    const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());

    // =========================================================================
    // KPI Calculations
    // =========================================================================
    const kpis = useMemo(() => {
        const contributions = movements
            .filter(m => m.type === "contribution")
            .reduce((sum, m) => sum + Number(m.functional_amount || m.amount || 0), 0);

        const withdrawals = movements
            .filter(m => m.type === "withdrawal")
            .reduce((sum, m) => sum + Number(m.functional_amount || m.amount || 0), 0);

        return {
            contributions,
            withdrawals,
            netCapital: contributions - withdrawals,
            participantCount: participants.length,
        };
    }, [movements, participants]);

    // =========================================================================
    // Filtered movements
    // =========================================================================
    const filteredMovements = useMemo(() => {
        if (typeFilter.size === 0) return movements;
        return movements.filter(m => typeFilter.has(m.type));
    }, [movements, typeFilter]);

    // =========================================================================
    // Helpers
    // =========================================================================
    const getWalletName = (walletId: string) => {
        if (!walletId) return "-";
        return wallets.find(w => w.id === walletId)?.wallet_name || "-";
    };

    const getParticipantName = (participantId: string) => {
        if (!participantId) return "-";
        return participants.find(p => p.id === participantId)?.name || "-";
    };

    // =========================================================================
    // Handlers (TODO: connect to forms)
    // =========================================================================
    const handleCreateMovement = () => {
        // TODO: Open capital movement form panel
        console.log("Create capital movement");
    };

    const handleCreateParticipant = () => {
        // TODO: Open capital participant form panel
        console.log("Create capital participant");
    };

    // =========================================================================
    // Participant Columns
    // =========================================================================
    const participantColumns: ColumnDef<any>[] = [
        {
            accessorKey: "name",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Participante" />,
            cell: ({ row }) => (
                <DataTableAvatarCell
                    title={row.original.name}
                    src={row.original.avatar_url}
                    fallback={row.original.name?.[0] || "?"}
                />
            ),
        },
        {
            accessorKey: "ownership_percentage",
            header: ({ column }) => <DataTableColumnHeader column={column} title="% Esperado" className="justify-end" />,
            cell: ({ row }) => {
                const pct = row.original.ownership_percentage;
                return (
                    <div className="flex justify-end">
                        <span className="font-mono tabular-nums text-sm">
                            {pct != null ? `${Number(pct).toFixed(1)}%` : "N/A"}
                        </span>
                    </div>
                );
            },
        },
        createMoneyColumn<any>({
            accessorKey: "total_contributed",
            title: "Aportes",
        }),
        createMoneyColumn<any>({
            accessorKey: "total_withdrawn",
            title: "Retiros",
        }),
        createMoneyColumn<any>({
            accessorKey: "current_balance",
            title: "Balance",
            colorMode: "auto",
        }),
        {
            accessorKey: "status",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
            cell: ({ row }) => {
                const status = row.original.status;
                return (
                    <Badge
                        variant="outline"
                        className={cn(
                            status === "active"
                                ? "bg-amount-positive/10 text-amount-positive border-amount-positive/20"
                                : "bg-muted text-muted-foreground border-muted"
                        )}
                    >
                        {status === "active" ? "Activo" : "Inactivo"}
                    </Badge>
                );
            },
        },
    ];

    // =========================================================================
    // Movement Columns
    // =========================================================================
    const movementColumns: ColumnDef<any>[] = [
        createDateColumn<any>({
            accessorKey: "payment_date",
            showAvatar: false,
        }),
        {
            accessorKey: "type",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
            cell: ({ row }) => {
                const type = row.original.type;
                const isContribution = type === "contribution";
                const participant = participants.find(p => p.id === row.original.participant_id);

                return (
                    <DataTableAvatarCell
                        title={isContribution ? "Aporte" : type === "adjustment" ? "Ajuste" : "Retiro"}
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
                const className =
                    status === "confirmed" || status === "completed"
                        ? "bg-amount-positive/10 text-amount-positive border-amount-positive/20"
                        : status === "pending"
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            : status === "rejected" || status === "cancelled"
                                ? "bg-destructive/10 text-destructive border-destructive/20"
                                : "bg-muted text-muted-foreground";
                const label =
                    status === "confirmed" || status === "completed" ? "Confirmado" :
                        status === "pending" ? "Pendiente" :
                            status === "rejected" || status === "cancelled" ? "Rechazado" :
                                status || "Pendiente";
                return <Badge variant="outline" className={className}>{label}</Badge>;
            },
        },
    ];

    // =========================================================================
    // Filter options
    // =========================================================================
    const typeOptions = [
        { label: "Aporte", value: "contribution" },
        { label: "Retiro", value: "withdrawal" },
        { label: "Ajuste", value: "adjustment" },
    ];

    // =========================================================================
    // RENDER — Empty State
    // =========================================================================
    if (movements.length === 0 && participants.length === 0) {
        return (
            <>
                <Toolbar
                    portalToHeader
                    actions={[
                        {
                            label: "Nuevo Movimiento",
                            icon: Plus,
                            onClick: handleCreateMovement,
                        },
                        {
                            label: "Agregar Participante",
                            icon: UserPlus,
                            onClick: handleCreateParticipant,
                        },
                    ]}
                />
                <div className="h-full flex items-center justify-center min-h-[400px]">
                    <ViewEmptyState
                        mode="empty"
                        icon={Landmark}
                        viewName="Capital de Socios"
                        featureDescription="Registrá los participantes de la sociedad y sus aportes, retiros y ajustes de capital. El sistema calcula automáticamente el balance de cada socio."
                        onAction={handleCreateParticipant}
                        actionLabel="Agregar Participante"
                        actionIcon={UserPlus}
                    />
                </div>
            </>
        );
    }

    // =========================================================================
    // RENDER — Content
    // =========================================================================
    return (
        <>
            <Toolbar
                portalToHeader
                actions={[
                    {
                        label: "Nuevo Movimiento",
                        icon: Plus,
                        onClick: handleCreateMovement,
                    },
                    {
                        label: "Agregar Participante",
                        icon: UserPlus,
                        onClick: handleCreateParticipant,
                    },
                    {
                        label: "Exportar",
                        icon: Download,
                        onClick: () => console.log("Export"),
                    },
                ]}
            />

            <div className="space-y-6">
                {/* ── KPI Row ─────────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <DashboardKpiCard
                        title="Capital Neto"
                        value={money.format(kpis.netCapital)}
                        icon={<Wallet className="h-5 w-5" />}
                        iconClassName={kpis.netCapital >= 0 ? "bg-amount-positive/10 text-amount-positive" : "bg-amount-negative/10 text-amount-negative"}
                    />
                    <DashboardKpiCard
                        title="Aportes Totales"
                        value={money.format(kpis.contributions)}
                        icon={<ArrowUpRight className="h-5 w-5" />}
                        iconClassName="bg-amount-positive/10 text-amount-positive"
                    />
                    <DashboardKpiCard
                        title="Retiros Totales"
                        value={money.format(kpis.withdrawals)}
                        icon={<ArrowDownRight className="h-5 w-5" />}
                        iconClassName="bg-amount-negative/10 text-amount-negative"
                    />
                    <DashboardKpiCard
                        title="Participantes"
                        value={kpis.participantCount.toString()}
                        icon={<Users className="h-5 w-5" />}
                    />
                </div>

                {/* ── Participants Table ──────────────────────────── */}
                {participants.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Participantes
                        </h3>
                        <DataTable
                            columns={participantColumns}
                            data={participants}
                            enableRowSelection={false}
                            showPagination={false}
                            pageSize={50}
                        />
                    </div>
                )}

                {/* ── Movements Table ────────────────────────────── */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Movimientos
                        </h3>
                        <div className="flex gap-2">
                            <FacetedFilter
                                title="Tipo"
                                options={typeOptions}
                                selectedValues={typeFilter}
                                onSelect={(value) => {
                                    const next = new Set(typeFilter);
                                    if (next.has(value)) next.delete(value);
                                    else next.add(value);
                                    setTypeFilter(next);
                                }}
                                onClear={() => setTypeFilter(new Set())}
                            />
                        </div>
                    </div>
                    <DataTable
                        columns={movementColumns}
                        data={filteredMovements}
                        enableRowSelection={false}
                        initialSorting={[{ id: "payment_date", desc: true }]}
                    />
                </div>
            </div>
        </>
    );
}
