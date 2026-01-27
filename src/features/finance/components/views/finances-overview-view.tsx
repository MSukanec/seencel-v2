"use client";

import { useMemo, useState, useEffect } from "react";
import { DashboardKpiCard, CurrencyBreakdownItem } from "@/components/dashboard/dashboard-kpi-card";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { BaseDualAreaChart } from "@/components/charts/area/base-dual-area-chart";
import { BaseDonutChart } from "@/components/charts/pie/base-donut-chart";
import { BaseWaffleChart } from "@/components/charts/waffle/base-waffle-chart";
import { TrendingUp, TrendingDown, BarChart3, PieChart, Activity, Wallet, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ChartConfig } from "@/components/ui/chart";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { useCurrency } from "@/providers/currency-context";
import { useFinancialFeatures } from "@/hooks/use-financial-features";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancialValueDisplay } from "@/components/ui/financial-value-display";
import { cn } from "@/lib/utils";
import { generateFinanceInsights } from "@/features/insights/logic/finance";
import { InsightCard } from "@/features/insights/components/insight-card";
import { Lightbulb } from "lucide-react";
import { useMoney } from "@/hooks/use-money";
import type { DisplayMode } from "@/lib/money";
import type { CurrencyViewMode } from "./finance-page-client";

interface FinancesOverviewViewProps {
    movements: any[];
    wallets?: { id: string; wallet_name: string }[];
    /** External currency mode control (from wrapper toolbar) */
    currencyMode?: CurrencyViewMode;
}

export function FinancesOverviewView({ movements, wallets = [], currencyMode: externalCurrencyMode }: FinancesOverviewViewProps) {
    // === NEW: Centralized money operations ===
    const money = useMoney();

    // Derived values from money hook
    const displayCurrency = money.displayMode === 'secondary' ? 'secondary' : 'primary';
    const isSecondaryDisplay = money.displayMode === 'secondary';

    const {
        allCurrencies,
        setDisplayCurrency,
        primaryCurrency: primaryCurrencyObj,
        secondaryCurrency: secondaryCurrencyObj,
    } = useCurrency();

    const { formatNumber, decimalPlaces } = useFormatCurrency();
    const { showCurrencySelector, functionalCurrencyId } = useFinancialFeatures();

    // Resolve Reference Currency
    const referenceCurrency = useMemo(() => {
        if (functionalCurrencyId) {
            return allCurrencies.find(c => c.id === functionalCurrencyId);
        }
        return allCurrencies.find(c => !c.is_default);
    }, [allCurrencies, functionalCurrencyId]);

    // View Mode: 'mix' (Breakdown) vs 'primary' vs 'secondary'
    // Use external mode if provided, otherwise use local state (backwards compat)
    const [localViewMode, setLocalViewMode] = useState<'mix' | 'ref'>('mix');

    // Map external currencyMode to internal isMixView/isReferenceView
    const effectiveMode = externalCurrencyMode ?? (localViewMode === 'mix' ? 'mix' : 'secondary');
    const isMixView = effectiveMode === 'mix';
    const isReferenceView = effectiveMode === 'secondary' || effectiveMode === 'primary';

    // Sync with displayCurrency context when external mode changes
    useEffect(() => {
        if (externalCurrencyMode) {
            // External control - mode is managed by wrapper
            if (externalCurrencyMode === 'mix' || externalCurrencyMode === 'primary') {
                setDisplayCurrency('primary');
            } else if (externalCurrencyMode === 'secondary') {
                setDisplayCurrency('secondary');
            }
        } else {
            // Local control (backwards compatibility)
            if (showCurrencySelector && referenceCurrency) {
                if (localViewMode === 'ref') {
                    setDisplayCurrency('secondary');
                } else {
                    setDisplayCurrency('primary');
                }
            }
        }
    }, [externalCurrencyMode, showCurrencySelector, referenceCurrency, setDisplayCurrency, localViewMode]);

    // Helper to render financial value based on view mode
    const renderFinancialValue = (
        primaryValue: number,
        breakdown: CurrencyBreakdownItem[],
    ) => {
        if (isMixView && breakdown && breakdown.length > 0) {
            if (breakdown.length === 1) {
                const item = breakdown[0];
                const formattedValue = `${item.symbol} ${formatNumber(item.nativeTotal)}`;
                return (
                    <div className="flex flex-col">
                        <FinancialValueDisplay value={formattedValue} size="large" compact />
                    </div>
                );
            }

            return (
                <div className="flex flex-col gap-0.5">
                    {breakdown.map((item: CurrencyBreakdownItem, index: number) => {
                        const isNegative = item.nativeTotal < 0;
                        const val = Math.abs(item.nativeTotal);
                        const isMain = index === 0;
                        const prefix = index > 0 ? (isNegative ? "- " : "+ ") : (isNegative ? "-" : "");
                        const formattedValue = `${prefix}${item.symbol} ${formatNumber(val)}`;

                        return (
                            <FinancialValueDisplay
                                key={item.currencyCode}
                                value={formattedValue}
                                size={isMain ? "large" : "secondary"}
                                compact
                            />
                        );
                    })}
                </div>
            );
        }

        const formattedValue = money.format(primaryValue);
        return (
            <div className="flex flex-col">
                <FinancialValueDisplay value={formattedValue} size="large" compact />
            </div>
        );
    };

    // ========================================
    // KPI CALCULATIONS (using centralized MoneyService)
    // Standard: All financial calculations go through lib/money
    // ========================================
    const kpis = useMemo(() => {
        // Transform movements to the format expected by the centralized KPI calculator
        const kpiMovements = movements.map(m => ({
            amount: m.amount,
            currency_code: m.currency_code,
            exchange_rate: m.exchange_rate,
            amount_sign: m.amount_sign,
            payment_date: m.payment_date,
            wallet_id: m.wallet_id,
        }));

        // Use centralized KPI calculator
        const result = money.calculateKPIs(kpiMovements);

        // Map breakdown to CurrencyBreakdownItem format expected by DashboardKpiCard
        const mapBreakdown = (breakdown: typeof result.ingresosBreakdown): CurrencyBreakdownItem[] => {
            return breakdown.map(b => ({
                currencyCode: b.currencyCode,
                symbol: b.symbol,
                nativeTotal: b.nativeTotal,
                functionalTotal: b.nativeTotal * (b.isPrimary ? 1 : money.config.currentExchangeRate),
                isPrimary: b.isPrimary,
            }));
        };

        return {
            totalIngresos: result.totalIngresos,
            totalEgresos: result.totalEgresos,
            balance: result.balance,
            monthlyAverage: result.monthlyAverage,
            trendPercent: result.trendPercent,
            trendDirection: result.trendDirection,
            ingresosBreakdown: mapBreakdown(result.ingresosBreakdown),
            egresosBreakdown: mapBreakdown(result.egresosBreakdown),
            totalMovements: result.totalMovements,
        };
    }, [movements, money]);

    // ========================================
    // CHART DATA: EVOLUTION (Ingresos vs Egresos)
    // ========================================
    const evolutionData = useMemo(() => {
        const grouped = movements.reduce((acc, m) => {
            const monthKey = m.payment_date ? m.payment_date.substring(0, 7) : '';
            if (!monthKey) return acc;

            const sign = Number(m.amount_sign ?? 1);
            const amount = money.calculateDisplayAmount({
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
    }, [movements, money]);

    const evolutionChartConfig: ChartConfig = {
        ingresos: { label: "Ingresos", color: "var(--amount-positive)" },
        egresos: { label: "Egresos", color: "var(--amount-negative)" }
    };

    // ========================================
    // CHART DATA: BALANCE BY WALLET (Saldo actual por billetera)
    // ========================================
    const distributionData = useMemo(() => {
        const getWalletName = (walletId: string) => {
            if (!walletId) return 'Sin billetera';
            return wallets.find(w => w.id === walletId)?.wallet_name || 'Sin billetera';
        };

        // Calculate balance per wallet (ingresos - egresos)
        const walletBalances = movements.reduce((acc, m) => {
            const walletName = getWalletName(m.wallet_id);
            const baseAmount = money.calculateDisplayAmount({
                amount: Number(m.amount) || 0,
                currency_code: m.currency_code,
                exchange_rate: Number(m.exchange_rate) || undefined
            });
            // amount_sign: 1 for income, -1 for expense
            const signedAmount = baseAmount * (Number(m.amount_sign) || 1);

            acc[walletName] = (acc[walletName] || 0) + signedAmount;
            return acc;
        }, {} as Record<string, number>);

        const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

        // Filter out negative balances for the donut chart (can't show negative in pie)
        // Sort by balance descending
        return Object.entries(walletBalances)
            .filter(([_, value]) => (value as number) > 0)
            .sort((a, b) => (b[1] as number) - (a[1] as number))
            .slice(0, 5)
            .map(([name, value], i) => ({
                name,
                value: value as number,
                fill: colors[i % colors.length]
            }));
    }, [movements, wallets, money]);

    const distributionChartConfig: ChartConfig = distributionData.reduce((acc, item) => {
        acc[item.name] = { label: item.name, color: item.fill };
        return acc;
    }, {} as ChartConfig);

    // ========================================
    // CHART DATA: WAFFLE CHART (Egresos por mes - últimos 6 meses)
    // ========================================
    const waffleData = useMemo(() => {
        return evolutionData.slice(-6).map((item) => ({
            label: item.month,
            value: item.egresos,
            // Use same red as Egresos line (amount-negative color)
            color: 'oklch(54.392% 0.19137 24.073)' // --amount-negative
        }));
    }, [evolutionData]);

    // ========================================
    // RECENT ACTIVITY
    // ========================================
    const recentActivity = movements.slice(0, 5);

    // ========================================
    // INSIGHTS
    // ========================================
    const insights = useMemo(() => {
        const formatForInsights = (amount: number) => money.format(amount);

        return generateFinanceInsights({
            movements: movements.map(m => ({
                id: m.id,
                payment_date: m.payment_date,
                amount: money.calculateDisplayAmount({
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
    }, [movements, wallets, money]);

    // ========================================
    // RENDER
    // ========================================
    return (
        <div className="space-y-6">
            {/* KPI Grid: 2x2 on mobile, 1x4 on desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Ingresos Totales */}
                <DashboardKpiCard
                    title="Ingresos Totales"
                    value={isMixView && kpis.ingresosBreakdown.length === 1
                        ? `${kpis.ingresosBreakdown[0].symbol} ${formatNumber(kpis.ingresosBreakdown[0].nativeTotal)}`
                        : money.format(kpis.totalIngresos)
                    }
                    icon={<TrendingUp className="h-5 w-5" />}
                    iconClassName="bg-amount-positive/10 text-amount-positive"
                    description="Cobros y aportes"
                    trend={kpis.trendPercent !== 0 ? {
                        value: `${Math.abs(kpis.trendPercent).toFixed(0)}%`,
                        direction: kpis.trendDirection as "up" | "down" | "neutral"
                    } : undefined}
                    currencyBreakdown={isMixView && kpis.ingresosBreakdown.length > 1 ? kpis.ingresosBreakdown : undefined}
                    size="hero"
                    compact
                />

                {/* 2. Egresos Totales */}
                <DashboardKpiCard
                    title="Egresos Totales"
                    value={isMixView && kpis.egresosBreakdown.length === 1
                        ? `${kpis.egresosBreakdown[0].symbol} ${formatNumber(kpis.egresosBreakdown[0].nativeTotal)}`
                        : money.format(kpis.totalEgresos)
                    }
                    icon={<TrendingDown className="h-5 w-5" />}
                    iconClassName="bg-amount-negative/10 text-amount-negative"
                    description="Pagos y retiros"
                    currencyBreakdown={isMixView && kpis.egresosBreakdown.length > 1 ? kpis.egresosBreakdown : undefined}
                    size="hero"
                    compact
                />

                {/* 3. Balance Neto */}
                <DashboardKpiCard
                    title="Balance Neto"
                    value={money.formatWithSign(kpis.balance)}
                    icon={<Wallet className="h-5 w-5" />}
                    iconClassName={kpis.balance >= 0 ? "bg-amount-positive/10 text-amount-positive" : "bg-amount-negative/10 text-amount-negative"}
                    description="Ingresos - Egresos"
                    size="hero"
                    compact
                    className={kpis.balance >= 0 ? "[&_h2]:text-amount-positive" : "[&_h2]:text-amount-negative"}
                />

                {/* 4. Promedio Mensual */}
                <DashboardKpiCard
                    title="Promedio Mensual"
                    value={money.format(kpis.monthlyAverage)}
                    icon={<Activity className="h-5 w-5" />}
                    description="Ingreso promedio / mes"
                    size="hero"
                    compact
                />
            </div>

            {/* ROW 2: Charts - 3 Column Grid */}
            <div className="grid gap-6 lg:grid-cols-3 items-start [&>*]:min-w-0">
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
                            tooltipFormatter={(value) => money.format(value)}
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

                {/* 3. Egresos por Mes (Waffle Chart) */}
                <DashboardCard
                    title="Egresos por Mes"
                    description="Comparativa de gastos mensuales"
                    icon={<TrendingDown className="w-4 h-4" />}
                    compact
                >
                    {waffleData.length > 0 ? (
                        <BaseWaffleChart
                            data={waffleData}
                            height={220}
                            columns={10}
                            cellSize={14}
                            cellGap={3}
                            showLegend={false}
                            valueFormatter={(v) => money.format(v)}
                        />
                    ) : (
                        <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                            Sin datos suficientes
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

            {/* INSIGHTS: Narrative insights about finances */}
            {insights.length > 0 && (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {insights.slice(0, 3).map(insight => (
                        <InsightCard key={insight.id} insight={insight} />
                    ))}
                </div>
            )}
        </div>
    );
}
