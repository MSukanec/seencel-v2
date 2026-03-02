"use client";

/**
 * Finances Capital (Socios) View
 * Standard 19.0 - Lean View Pattern (~200 lines)
 * 
 * Vista de socios: KPIs → Participantes → Movimientos de capital.
 * Orquesta hooks + columnas + UI. No contiene lógica de negocio.
 */

import { useMemo } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table/data-table";
import { MetricCard } from "@/components/cards";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { FilterPopover, SearchButton, DisplayButton } from "@/components/shared/toolbar-controls";
import { useTableFilters } from "@/hooks/use-table-filters";
import { useMoney } from "@/hooks/use-money";
import { updateMovementField } from "../actions";
import {
    Plus,
    Landmark,
    Wallet,
    Users,
    ArrowUpRight,
    ArrowDownRight,
    UserPlus,
} from "lucide-react";
import {
    getParticipantColumns,
    getCapitalMovementColumns,
    CAPITAL_TYPE_OPTIONS,
} from "../tables/capital-columns";

// ─── Types ───────────────────────────────────────────────

interface FinancesCapitalViewProps {
    movements: any[];
    participants: any[];
    wallets: { id: string; wallet_name: string }[];
    organizationId: string;
}

// ─── Component ───────────────────────────────────────────

export function FinancesCapitalView({
    movements,
    participants,
    wallets = [],
    organizationId,
}: FinancesCapitalViewProps) {
    const money = useMoney();
    const router = useRouter();

    // ─── Filters (movements table) ───────────────────────
    const facetConfigs = [
        { key: "type", title: "Tipo", options: CAPITAL_TYPE_OPTIONS },
    ];

    const filters = useTableFilters({ facets: facetConfigs });

    // ─── Filtered movements ──────────────────────────────
    const filteredMovements = useMemo(() => {
        return movements.filter(m => {
            const typeFilter = filters.facetValues.type;
            if (typeFilter?.size > 0 && !typeFilter.has(m.type)) return false;
            return true;
        });
    }, [movements, filters.facetValues]);

    // ─── KPI Calculations ────────────────────────────────
    const kpis = useMemo(() => {
        const contributionItems = movements.filter(m => m.type === "contribution");
        const withdrawalItems = movements.filter(m => m.type === "withdrawal");
        const contributions = money.sum(contributionItems).total;
        const withdrawals = money.sum(withdrawalItems).total;

        return {
            contributions,
            withdrawals,
            netCapital: contributions - withdrawals,
            participantCount: participants.length,
        };
    }, [movements, participants, money]);

    // ─── Helpers ─────────────────────────────────────────
    const getWalletName = (walletId: string) => {
        if (!walletId) return "-";
        return wallets.find(w => w.id === walletId)?.wallet_name || "-";
    };

    // ─── Inline update handler ───────────────────────────
    const handleInlineUpdate = async (row: any, fields: Record<string, any>) => {
        const result = await updateMovementField(row.id, row.type, fields);
        if (result.success) {
            toast.success("Actualizado");
            router.refresh();
        } else {
            toast.error(result.error || "Error al actualizar");
        }
    };

    // ─── Handlers (TODO: connect to forms) ───────────────
    const handleCreateMovement = () => {
        // TODO: Open capital movement form panel
    };

    const handleCreateParticipant = () => {
        // TODO: Open capital participant form panel
    };

    // ─── Columns ─────────────────────────────────────────
    const participantColumns = getParticipantColumns();
    const movementColumns = getCapitalMovementColumns({ participants, getWalletName, onInlineUpdate: handleInlineUpdate });

    // ─── Toolbar actions ─────────────────────────────────
    const toolbarActions = [
        { label: "Nuevo Movimiento", icon: Plus, onClick: handleCreateMovement },
        { label: "Agregar Socio", icon: UserPlus, onClick: handleCreateParticipant },
    ];

    // ─── Empty State ─────────────────────────────────────
    if (movements.length === 0 && participants.length === 0) {
        return (
            <>
                <Toolbar portalToHeader actions={toolbarActions} />
                <ViewEmptyState
                    mode="empty"
                    icon={Landmark}
                    viewName="Socios"
                    featureDescription="Registrá los socios y sus aportes, retiros y ajustes de capital. El sistema calcula automáticamente el balance de cada socio."
                    onAction={handleCreateParticipant}
                    actionLabel="Agregar Socio"
                    actionIcon={UserPlus}
                />
            </>
        );
    }

    // ─── Embedded toolbars (controls left, actions right) ──
    const participantsToolbar = (table: any) => (
        <Toolbar
            leftActions={<DisplayButton table={table} />}
            actions={[{ label: "Agregar Socio", icon: UserPlus, onClick: handleCreateParticipant }]}
        />
    );

    const movementsToolbar = (table: any) => (
        <Toolbar
            leftActions={
                <>
                    <FilterPopover filters={filters} />
                    <DisplayButton table={table} />
                    <SearchButton filters={filters} placeholder="Buscar movimientos..." />
                </>
            }
            actions={[{ label: "Nuevo Movimiento", icon: Plus, onClick: handleCreateMovement }]}
        />
    );

    // ─── Render ──────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* ── KPI Row ─────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Capital Neto"
                    amount={kpis.netCapital}
                    icon={<Wallet className="h-5 w-5" />}
                    iconClassName={kpis.netCapital >= 0 ? "bg-amount-positive/10 text-amount-positive" : "bg-amount-negative/10 text-amount-negative"}
                    size="default"
                />
                <MetricCard
                    title="Aportes Totales"
                    amount={kpis.contributions}
                    icon={<ArrowUpRight className="h-5 w-5" />}
                    iconClassName="bg-amount-positive/10 text-amount-positive"
                    size="default"
                />
                <MetricCard
                    title="Retiros Totales"
                    amount={kpis.withdrawals}
                    icon={<ArrowDownRight className="h-5 w-5" />}
                    iconClassName="bg-amount-negative/10 text-amount-negative"
                    size="default"
                />
                <MetricCard
                    title="Socios"
                    value={kpis.participantCount.toString()}
                    icon={<Users className="h-5 w-5" />}
                    size="default"
                />
            </div>

            {/* ── Participants Table ──────────────────── */}
            {participants.length > 0 && (
                <DataTable
                    columns={participantColumns}
                    data={participants}
                    showPagination={false}
                    pageSize={50}
                    embeddedToolbar={participantsToolbar}
                />
            )}

            {/* ── Movements Table ────────────────────── */}
            <DataTable
                columns={movementColumns}
                data={filteredMovements}
                initialSorting={[{ id: "payment_date", desc: true }]}
                globalFilter={filters.searchQuery}
                onGlobalFilterChange={filters.setSearchQuery}
                onClearFilters={filters.clearAll}
                embeddedToolbar={movementsToolbar}
            />
        </div>
    );
}
