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
import { useSmartCurrency } from "@/hooks/use-smart-currency";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { formatCurrency as formatCurrencyUtil } from "@/lib/currency-utils";
import { useCurrency } from "@/providers/currency-context";
import { useFinancialFeatures } from "@/hooks/use-financial-features";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancialValueDisplay } from "@/components/ui/financial-value-display";
import { cn } from "@/lib/utils";
import { generateFinanceInsights } from "@/features/insights/logic/finance";
import { InsightCard } from "@/features/insights/components/insight-card";
import { Lightbulb } from "lucide-react";
import type { CurrencyViewMode } from "./finance-page-client";

interface FinancesOverviewViewProps {
    movements: any[];
    wallets?: { id: string; wallet_name: string }[];
    /** External currency mode control (from wrapper toolbar) */
    currencyMode?: CurrencyViewMode;
}

export function FinancesOverviewView({ movements, wallets = [], currencyMode: externalCurrencyMode }: FinancesOverviewViewProps) {
    const {
        calculateDisplayAmount,
        sumDisplayAmounts,
        displayCurrencyCode,
        isSecondaryDisplay,
        currentRate,
        primaryCurrencyCode
    } = useSmartCurrency();

    const displayCurrency = isSecondaryDisplay ? 'secondary' : 'primary';

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

        const formattedValue = formatCurrencyUtil(primaryValue, displayCurrencyCode, 'es-AR', decimalPlaces);
        return (
            <div className="flex flex-col">
                <FinancialValueDisplay value={formattedValue} size="large" compact />
            </div>
        );
    };

    // ========================================
    // KPI CALCULATIONS (using calculateDisplayAmount for proper currency conversion)
    // ========================================
    const kpis = useMemo(() => {
        let totalIngresos = 0;
        let totalEgresos = 0;

        movements.forEach(m => {
            const amount = calculateDisplayAmount({
                amount: Number(m.amount) || 0,
                currency_code: m.currency_code,
                exchange_rate: Number(m.exchange_rate) || undefined
            });
            const sign = Number(m.amount_sign ?? 1);
            if (sign > 0) {
                totalIngresos += amount;
            } else {
                totalEgresos += amount;
            }
        });

        const balance = totalIngresos - totalEgresos;

        // Breakdown by currency
        const calculateBreakdown = (
            items: { amount: number, functional: number, currencyCode?: string, symbol?: string, sign: number }[],
            filterSign?: number
        ): CurrencyBreakdownItem[] => {
            const filtered = filterSign !== undefined
                ? items.filter(i => i.sign === filterSign)
                : items;

            const grouped = filtered.reduce((acc, item) => {
                const code = item.currencyCode || primaryCurrencyCode;
                if (!acc[code]) {
                    acc[code] = {
                        currencyCode: code,
                        symbol: item.symbol || '$',
                        nativeTotal: 0,
                        functionalTotal: 0,
                        isPrimary: code === primaryCurrencyCode
                    };
                }
                acc[code].nativeTotal += Number(item.amount) || 0;
                acc[code].functionalTotal += Number(item.functional) || 0;
                return acc;
            }, {} as Record<string, CurrencyBreakdownItem>);

            return Object.values(grouped)
                .filter(g => g.nativeTotal !== 0)
                .sort((a, b) => {
                    if (a.isPrimary) return -1;
                    if (b.isPrimary) return 1;
                    return a.currencyCode.localeCompare(b.currencyCode);
                });
        };

        const allItems = movements.map(m => ({
            amount: Number(m.amount),
            functional: Number(m.functional_amount) || Number(m.amount),
            currencyCode: m.currency_code,
            symbol: m.currency_symbol,
            sign: Number(m.amount_sign ?? 1)
        }));

        const ingresosBreakdown = calculateBreakdown(allItems, 1);
        const egresosBreakdown = calculateBreakdown(allItems, -1);

        // Monthly average
        const monthsWithMovements = new Set(movements.map(m =>
            m.payment_date ? m.payment_date.substring(0, 7) : ''
        )).size || 1;

        const monthlyAverage = totalIngresos / monthsWithMovements;

        // Trend calculation
        const movementsByMonth = movements.reduce((acc, m) => {
            const month = m.payment_date ? m.payment_date.substring(0, 7) : '';
            if (!month) return acc;

            const sign = Number(m.amount_sign ?? 1);
            const amount = calculateDisplayAmount({
                amount: Number(m.amount) || 0,
                currency_code: m.currency_code,
                exchange_rate: Number(m.exchange_rate) || undefined
            });

            if (!acc[month]) acc[month] = { ingresos: 0, egresos: 0 };
            if (sign > 0) {
                acc[month].ingresos += amount;
            } else {
                acc[month].egresos += amount;
            }
            return acc;
        }, {} as Record<string, { ingresos: number, egresos: number }>);

        const now = new Date();
        const thisMonth = now.toISOString().slice(0, 7);
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonth = lastMonthDate.toISOString().slice(0, 7);

        const thisMonthIngresos = movementsByMonth[thisMonth]?.ingresos || 0;
        const lastMonthIngresos = movementsByMonth[lastMonth]?.ingresos || 0;
        const trendPercent = lastMonthIngresos > 0 ? ((thisMonthIngresos - lastMonthIngresos) / lastMonthIngresos * 100) : 0;

        return {
            totalIngresos,
            totalEgresos,
            balance,
            monthlyAverage,
            trendPercent,
            trendDirection: trendPercent > 0 ? "up" : trendPercent < 0 ? "down" : "neutral" as "up" | "down" | "neutral",
            ingresosBreakdown,
            egresosBreakdown,
            totalMovements: movements.length
        };
    }, [movements, primaryCurrencyCode, calculateDisplayAmount]);

    // ========================================
    // CHART DATA: EVOLUTION (Ingresos vs Egresos)
    // ========================================
    const evolutionData = useMemo(() => {
        const grouped = movements.reduce((acc, m) => {
            const monthKey = m.payment_date ? m.payment_date.substring(0, 7) : '';
            if (!monthKey) return acc;

            const sign = Number(m.amount_sign ?? 1);
            const amount = calculateDisplayAmount({
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
    }, [movements, calculateDisplayAmount]);

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
            const baseAmount = calculateDisplayAmount({
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
    }, [movements, wallets, calculateDisplayAmount]);

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
        const formatForInsights = (amount: number) => formatCurrencyUtil(amount, displayCurrencyCode, 'es-AR', decimalPlaces);

        return generateFinanceInsights({
            movements: movements.map(m => ({
                id: m.id,
                payment_date: m.payment_date,
                amount: calculateDisplayAmount({
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
    }, [movements, wallets, displayCurrencyCode, decimalPlaces, calculateDisplayAmount]);

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
                        : formatCurrencyUtil(kpis.totalIngresos, displayCurrencyCode, 'es-AR', decimalPlaces)
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
                        : formatCurrencyUtil(kpis.totalEgresos, displayCurrencyCode, 'es-AR', decimalPlaces)
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
                    value={`${kpis.balance >= 0 ? "+" : ""}${formatCurrencyUtil(kpis.balance, displayCurrencyCode, 'es-AR', decimalPlaces)}`}
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
                    value={formatCurrencyUtil(kpis.monthlyAverage, displayCurrencyCode, 'es-AR', decimalPlaces)}
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
                            tooltipFormatter={(value) => formatCurrencyUtil(value, displayCurrencyCode, 'es-AR', 0)}
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
                        <div className="flex flex-col items-center gap-4">
                            <BaseDonutChart
                                data={distributionData}
                                nameKey="name"
                                valueKey="value"
                                height={160}
                                config={distributionChartConfig}
                            />
                            <div className="w-full space-y-1.5">
                                {distributionData.slice(0, 4).map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm">
                                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.fill }} />
                                        <span className="flex-1 truncate text-muted-foreground text-xs">{item.name}</span>
                                        <span className="font-medium text-xs">{formatCurrencyUtil(item.value, displayCurrencyCode, 'es-AR', 0)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
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
                            valueFormatter={(v) => formatCurrencyUtil(v, displayCurrencyCode, 'es-AR', 0)}
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
                                <InsightCard key={insight.id} insight={insight} compact />
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
                        <InsightCard key={insight.id} insight={insight} compact />
                    ))}
                </div>
            )}
        </div>
    );
}
