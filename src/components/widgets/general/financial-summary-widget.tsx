"use client";

import { useEffect, useState, useMemo } from "react";
import type { WidgetProps } from "@/components/widgets/grid/types";
import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { getFinancialSummary } from "@/actions/widget-actions";
import type { FinancialMovementRaw } from "@/actions/widget-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { WidgetEmptyState } from "@/components/widgets/grid/widget-empty-state";
import { cn } from "@/lib/utils";
import { useMoney } from "@/hooks/use-money";

// ============================================================================
// FINANCIAL SUMMARY WIDGET (Income / Expenses / Balance, Autonomous)
// ============================================================================
// Uses useMoney.calculateKPIs() for consistent calculations with
// the Finance page. Receives raw movements and calculates client-side.
// ============================================================================

const SCOPE_TITLES: Record<string, string> = {
    organization: "Resumen Financiero",
    project: "Finanzas del Proyecto",
};

function KPIRow({
    label,
    value,
    icon: Icon,
    colorClass,
}: {
    label: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    colorClass: string;
}) {
    return (
        <div className="flex items-center gap-3 py-2">
            <div className={cn("p-1.5 rounded-md", colorClass)}>
                <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                    {label}
                </p>
            </div>
            <span className="text-sm font-semibold tabular-nums text-foreground">
                {value}
            </span>
        </div>
    );
}

function FinancialSummarySkeleton() {
    return (
        <div className="space-y-3 px-4 py-3">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-7 w-7 rounded-md" />
                    <Skeleton className="h-3 w-16" />
                    <div className="flex-1" />
                    <Skeleton className="h-4 w-20" />
                </div>
            ))}
        </div>
    );
}

export function FinancialOverviewWidget({ config, initialData }: WidgetProps) {
    const scope = config?.scope || "organization";
    const projectId = config?.projectId || null;

    // initialData is now raw movements (FinancialMovementRaw[]) from prefetch
    // OR the old FinancialSummaryData format for client-side fallback
    const [movements, setMovements] = useState<FinancialMovementRaw[] | null>(
        Array.isArray(initialData) ? initialData : null
    );

    // Force functional mode: the widget always shows totals in functional currency
    // This ensures USD amounts are converted to ARS (or whatever the functional currency is)
    const money = useMoney({ forcedMode: 'functional' });

    // Client-side fetch if no initial data
    useEffect(() => {
        if (initialData) return;
        let cancelled = false;
        setMovements(null);
        getFinancialSummary(scope, projectId).then((result) => {
            if (!cancelled && result) {
                // getFinancialSummary still returns FinancialSummaryData for backward compat
                // but we need movements - so we create synthetic ones
                // This path is only used if no prefetched data is available
                setMovements([]);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [scope, projectId, initialData]);

    // Calculate KPIs using the same logic as the Finance page
    const kpis = useMemo(() => {
        if (!movements || movements.length === 0) return null;
        return money.calculateKPIs(movements);
    }, [movements, money]);

    const isEmpty = movements !== null && (!kpis || (kpis.totalIngresos === 0 && kpis.totalEgresos === 0));

    return (
        <div className="h-full flex flex-col rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
                <div className="p-1.5 rounded-md bg-primary/10">
                    <Wallet className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold leading-none">
                        {SCOPE_TITLES[scope] || "Resumen Financiero"}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                        Moneda funcional ({money.primaryCurrencyCode || '...'})
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {movements === null ? (
                    <FinancialSummarySkeleton />
                ) : isEmpty ? (
                    <WidgetEmptyState
                        icon={DollarSign}
                        title="Sin movimientos"
                        description="Registrá ingresos y egresos para ver el resumen aquí"
                        href="/organization/finance"
                        actionLabel="Ir a Finanzas"
                    />
                ) : kpis ? (
                    <div className="px-4 py-2 divide-y divide-border/30">
                        <KPIRow
                            label="Ingresos"
                            value={money.formatCompact(kpis.totalIngresos)}
                            icon={TrendingUp}
                            colorClass="bg-emerald-500/10 text-emerald-500"
                        />
                        <KPIRow
                            label="Egresos"
                            value={money.formatCompact(kpis.totalEgresos)}
                            icon={TrendingDown}
                            colorClass="bg-red-500/10 text-red-500"
                        />
                        <KPIRow
                            label="Balance"
                            value={money.formatCompact(kpis.balance)}
                            icon={Wallet}
                            colorClass={cn(
                                kpis.balance >= 0
                                    ? "bg-blue-500/10 text-blue-500"
                                    : "bg-orange-500/10 text-orange-500"
                            )}
                        />
                    </div>
                ) : null}
            </div>
        </div>
    );
}
