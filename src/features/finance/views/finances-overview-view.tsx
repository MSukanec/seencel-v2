"use client";

import { useState, useMemo } from "react";
import { FinanceDashboardProvider, useFinanceDashboard } from "@/features/finance/context/finance-dashboard-context";
import { DashboardWidgetGrid } from "@/features/finance/components/widgets/dashboard-widget-grid";
import { DEFAULT_FINANCE_LAYOUT } from "@/features/finance/components/widgets/registry";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { BaseDualAreaChart } from "@/components/charts/area/base-dual-area-chart";
import { BaseDonutChart } from "@/components/charts/pie/base-donut-chart";
import { TrendingUp, TrendingDown, BarChart3, PieChart, Activity, Wallet, Lightbulb, Banknote } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ChartConfig } from "@/components/ui/chart";
import { useMoney } from "@/hooks/use-money";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { InsightCard } from "@/features/insights/components/insight-card";
import { generateFinanceInsights } from "@/features/insights/logic/finance";
import { cn } from "@/lib/utils";
import { DateRangeFilterValue } from "@/components/layout/dashboard/shared/toolbar/toolbar-date-range-filter";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { LayoutDashboard, Check } from "lucide-react";

interface FinancesOverviewViewProps {
    movements: any[];
    wallets?: { id: string; wallet_name: string }[];
}

export function FinancesOverviewView({ movements, wallets = [] }: FinancesOverviewViewProps) {
    const [dateRange, setDateRange] = useState<DateRangeFilterValue | undefined>(undefined);

    // Empty state check
    if (movements.length === 0) {
        return (
            <div className="h-full flex flex-col">
                <div className="flex-1 flex items-center justify-center">
                    <ViewEmptyState
                        mode="empty"
                        icon={Banknote}
                        viewName="Resumen Financiero"
                        featureDescription="Registrá tu primer movimiento en la pestaña Movimientos para ver estadísticas y gráficos aquí."
                    />
                </div>
            </div>
        );
    }

    return (
        <FinanceDashboardProvider
            movements={movements}
            wallets={wallets}
            dateRange={dateRange}
            setDateRange={setDateRange}
        >
            <FinancesDashboardContent />
        </FinanceDashboardProvider>
    );
}

// Inner component to consume the context
function FinancesDashboardContent() {
    const { kpis, filteredMovements, isMixView, wallets } = useFinanceDashboard();
    const [isEditing, setIsEditing] = useState(false);

    // Legacy Chart Logic (kept for comparison/legacy support)
    const money = useMoney();

    // ========================================
    // CHART DATA: EVOLUTION (Ingresos vs Egresos)
    // IMPORTANT: Charts MUST use toFunctionalAmount to convert all values
    // to a single currency. Using calculateDisplayAmount would mix currencies
    // in 'mix' mode, which is invalid for chart visualization.
    // ========================================
    const evolutionData = useMemo(() => {
        const grouped = filteredMovements.reduce((acc, m) => {
            const monthKey = m.payment_date ? m.payment_date.substring(0, 7) : '';
            if (!monthKey) return acc;

            const sign = Number(m.amount_sign ?? 1);
            // ALWAYS convert to functional currency for charts
            const amount = money.toFunctionalAmount({
                amount: Number(m.amount) || 0,
                currency_code: m.currency_code,
                exchange_rate: Number(m.exchange_rate) || undefined
            });

            if (!acc[monthKey]) acc[monthKey] = { ingresos: 0, egresos: 0 };
            if (sign > 0) {
                acc[monthKey].ingresos += amount;
            } else {
                acc[monthKey].egresos += amount;
            }
            return acc;
        }, {} as Record<string, { ingresos: number, egresos: number }>);


        type MonthData = { ingresos: number, egresos: number };
        const sortedMonths = (Object.entries(grouped) as [string, MonthData][])
            .filter(([month]) => month && month.length >= 7)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-12);

        return sortedMonths.map(([month, data]) => {
            const [year, monthNum] = month.split('-').map(Number);
            const date = new Date(year, (monthNum || 1) - 1, 1);
            const formatted = isNaN(date.getTime())
                ? month
                : new Intl.DateTimeFormat('es', { month: 'short', year: '2-digit' }).format(date);

            return {
                month: formatted,
                rawMonth: month,
                ingresos: data.ingresos,
                egresos: data.egresos
            };
        });
    }, [filteredMovements, money.toFunctionalAmount]);

    const evolutionChartConfig: ChartConfig = {
        ingresos: { label: "Ingresos", color: "var(--amount-positive)" },
        egresos: { label: "Egresos", color: "var(--amount-negative)" }
    };

    // ========================================
    // CHART DATA: BALANCE BY WALLET (Saldo actual por billetera)
    // ========================================
    const distributionData = useMemo(() => {
        // Calculate balance per wallet (ingresos - egresos)
        const walletBalances = filteredMovements.reduce((acc, m) => {
            // Use wallet_name directly from the view, fallback to lookup
            const walletName = m.wallet_name || 'Sin billetera';
            const baseAmount = money.toFunctionalAmount({
                amount: Number(m.amount) || 0,
                currency_code: m.currency_code,
                exchange_rate: Number(m.exchange_rate) || undefined
            });
            const signedAmount = baseAmount * (Number(m.amount_sign) || 1);

            acc[walletName] = (acc[walletName] || 0) + signedAmount;
            return acc;
        }, {} as Record<string, number>);

        const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

        return Object.entries(walletBalances)
            .filter(([_, value]) => (value as number) > 0)
            .sort((a, b) => (b[1] as number) - (a[1] as number))
            .slice(0, 5)
            .map(([name, value], i) => ({
                name,
                value: value as number,
                fill: colors[i % colors.length]
            }));
    }, [filteredMovements, money.toFunctionalAmount]);

    const distributionChartConfig: ChartConfig = distributionData.reduce((acc, item) => {
        acc[item.name] = { label: item.name, color: item.fill };
        return acc;
    }, {} as ChartConfig);

    // ========================================
    // RECENT ACTIVITY
    // ========================================
    const recentActivity = filteredMovements.slice(0, 5);

    // ========================================
    // INSIGHTS
    // ========================================
    const insights = useMemo(() => {
        const formatForInsights = (amount: number) => money.format(amount);

        return generateFinanceInsights({
            movements: filteredMovements.map(m => ({
                id: m.id,
                payment_date: m.payment_date,
                amount: money.toFunctionalAmount({
                    amount: Number(m.amount) || 0,
                    currency_code: m.currency_code,
                    exchange_rate: Number(m.exchange_rate) || undefined
                }),
                amount_sign: Number(m.amount_sign) || 1,
                wallet_id: m.wallet_id,
                movement_type: m.movement_type
            })),
            wallets,
            formatCurrency: formatForInsights
        });
    }, [filteredMovements, wallets, money.format, money.toFunctionalAmount]);


    return (
        <div className="space-y-8">
            {/* Toolbar - Portal to Header */}
            <Toolbar
                portalToHeader
                actions={[{
                    label: isEditing ? "Guardar" : "Personalizar",
                    onClick: () => setIsEditing(!isEditing),
                    icon: isEditing ? Check : LayoutDashboard,
                    variant: isEditing ? "default" : "outline"
                }]}
            />


            {/* Enterprise Widget Grid */}
            <DashboardWidgetGrid layout={DEFAULT_FINANCE_LAYOUT} isEditing={isEditing} />

            <div className="border-t border-border/50 my-6" />

            {/* 2. LEGACY: Comparison Section */}
            <div className="space-y-4 opacity-75">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold tracking-tight">Legacy View (Comparación)</h2>
                </div>

                {/* Legacy KPI Cards using Context Data */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <DashboardKpiCard
                        title="Ingresos Totales"
                        amount={kpis.ingresos}
                        icon={<TrendingUp className="h-5 w-5" />}
                        iconClassName="bg-amount-positive/10 text-amount-positive"
                        description="Cobros y aportes"
                        currencyBreakdown={isMixView && kpis.ingresosBreakdown.length > 1 ? kpis.ingresosBreakdown : undefined}
                        size="hero"
                    />
                    <DashboardKpiCard
                        title="Egresos Totales"
                        amount={kpis.egresos}
                        icon={<TrendingDown className="h-5 w-5" />}
                        iconClassName="bg-amount-negative/10 text-amount-negative"
                        description="Pagos y retiros"
                        currencyBreakdown={isMixView && kpis.egresosBreakdown.length > 1 ? kpis.egresosBreakdown : undefined}
                        size="hero"
                    />
                    <DashboardKpiCard
                        title="Balance Neto"
                        amount={kpis.balance}
                        icon={<Wallet className="h-5 w-5" />}
                        iconClassName={kpis.balance >= 0 ? "bg-amount-positive/10 text-amount-positive" : "bg-amount-negative/10 text-amount-negative"}
                        description="Ingresos - Egresos"
                        size="hero"
                    />
                    <DashboardKpiCard
                        title="Promedio Mensual"
                        amount={kpis.monthlyAverage}
                        icon={<Activity className="h-5 w-5" />}
                        description="Ingreso promedio / mes"
                        size="hero"
                    />
                </div>

                {/* ROW 2: Charts - 2 Column Grid */}
                <div className="grid gap-6 lg:grid-cols-2 items-start [&>*]:min-w-0">
                    {/* 1. Evolución Financiera */}
                    <DashboardCard
                        title="Evolución Financiera"
                        description="Ingresos vs Egresos por mes"
                        icon={<BarChart3 className="w-4 h-4" />}
                    >
                        {evolutionData.length > 0 ? (
                            <BaseDualAreaChart
                                data={evolutionData}
                                xKey="month"
                                primaryKey="ingresos"
                                secondaryKey="egresos"
                                primaryLabel="Ingresos"
                                secondaryLabel="Egresos"
                                height={220}
                                config={evolutionChartConfig}
                                gradient
                                showLegend
                            />
                        ) : (
                            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                                Sin datos de movimientos
                            </div>
                        )}
                    </DashboardCard>

                    {/* 2. Saldo por Billetera */}
                    <DashboardCard
                        title="Saldo por Billetera"
                        description="Balance actual por cuenta"
                        icon={<PieChart className="w-4 h-4" />}
                    >
                        {distributionData.length > 0 ? (
                            <BaseDonutChart
                                data={distributionData}
                                nameKey="name"
                                valueKey="value"
                                height={200}
                                config={distributionChartConfig}
                            />
                        ) : (
                            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                                Sin datos de movimientos
                            </div>
                        )}
                    </DashboardCard>
                </div>

                {/* ROW 3: Insights + Activity (2 Column Grid) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* LEFT: Insights */}
                    <DashboardCard
                        title="Insights Financieros"
                        description="Análisis automático de tu situación"
                        icon={<Lightbulb className="w-4 h-4" />}
                    >
                        {insights.length > 0 ? (
                            <div className="space-y-2">
                                {insights.map((insight) => (
                                    <InsightCard key={insight.id} insight={insight} />
                                ))}
                            </div>
                        ) : (
                            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                                No hay insights en este momento
                            </div>
                        )}
                    </DashboardCard>

                    {/* RIGHT: Recent Activity with Creator Avatars */}
                    <DashboardCard
                        title="Actividad Reciente"
                        description="Últimos movimientos registrados"
                        icon={<Activity className="w-4 h-4" />}
                    >
                        {recentActivity.length > 0 ? (
                            <div className="space-y-4">
                                {recentActivity.map((movement, i) => {
                                    const isPositive = Number(movement.amount_sign ?? 1) > 0;
                                    const hasAvatar = movement.creator_avatar_url;
                                    const creatorInitial = movement.creator_full_name?.charAt(0)?.toUpperCase() || '?';

                                    return (
                                        <div key={i} className="flex items-center gap-3">
                                            {/* Creator Avatar */}
                                            {hasAvatar ? (
                                                <img
                                                    src={movement.creator_avatar_url}
                                                    alt={movement.creator_full_name || 'Usuario'}
                                                    className="h-9 w-9 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                                                    {creatorInitial}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {movement.entity_name || movement.description || "Movimiento"}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {movement.creator_full_name && <span>{movement.creator_full_name} · </span>}
                                                    {formatDistanceToNow(new Date(movement.payment_date), { addSuffix: true, locale: es })}
                                                </p>
                                            </div>
                                            <span className={cn(
                                                "text-sm font-semibold",
                                                isPositive ? "text-amount-positive" : "text-amount-negative"
                                            )}>
                                                {isPositive ? "+" : "-"}{movement.currency_symbol || "$"} {Math.abs(Number(movement.amount)).toLocaleString('es-AR')}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                                Sin actividad reciente
                            </div>
                        )}
                    </DashboardCard>
                </div>
            </div>
        </div>
    );
}
