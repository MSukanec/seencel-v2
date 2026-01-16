"use client";

import { useMemo } from "react";
import { DashboardKpiCard, CurrencyBreakdownItem } from "@/components/dashboard/dashboard-kpi-card";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { InsightCard } from "@/features/insights/components/insight-card";
import { Insight } from "@/features/insights/types";
import { generateClientInsights } from "@/features/insights/logic/clients";
import { BaseAreaChart } from "@/components/charts/base-area-chart";
import { BaseDonutChart } from "@/components/charts/base-donut-chart";
import { ClientFinancialSummary, ClientPaymentView } from "../types";
import { FileText, DollarSign, Clock, TrendingUp, BarChart3, PieChart, Lightbulb, Activity, CheckCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ChartConfig } from "@/components/ui/chart";
import { useSmartCurrency } from "@/hooks/use-smart-currency";
import { formatCurrency as formatCurrencyUtil } from "@/lib/currency-utils";
import { useCurrencyOptional } from "@/providers/currency-context"; // Needed for breakdown context only

interface ClientsOverviewProps {
    summary: ClientFinancialSummary[];
    payments: ClientPaymentView[];
}

export function ClientsOverview({ summary, payments }: ClientsOverviewProps) {
    const {
        calculateDisplayAmount,
        sumDisplayAmounts,
        displayCurrencyCode,
        isSecondaryDisplay,
        currentRate,
        primaryCurrencyCode
    } = useSmartCurrency();

    // Derived for compatibility
    const displayCurrency = isSecondaryDisplay ? 'secondary' : 'primary';

    // We still need context for specific currency objects (symbol etc) for breakdowns
    const currencyContext = useCurrencyOptional();

    // ========================================
    // KPI CALCULATIONS
    // ========================================
    const kpis = useMemo(() => {
        // Calculate Totals using Smart Logic (Hook)

        // Committed: Map summary to MonetaryItem interface
        const totalCommitted = sumDisplayAmounts(summary.map(s => ({
            amount: s.total_committed_amount,
            functional_amount: s.total_functional_committed_amount,
            currency_code: s.currency_code
        })));

        // Paid: Map payments to MonetaryItem interface
        const totalPaid = sumDisplayAmounts(payments.map(p => ({
            amount: Number(p.amount),
            functional_amount: Number(p.functional_amount),
            currency_code: p.currency_code
        })));

        // Balance: Derived or Summed
        // Better to sum individual balances to be precise with currency mix
        const totalBalance = sumDisplayAmounts(summary.map(s => ({
            amount: s.balance_due,
            functional_amount: s.functional_balance_due,
            currency_code: s.currency_code
        })));

        // ========================================
        // BREAKDOWN HELPER
        // ========================================
        const calculateBreakdown = (
            items: { amount: number, functional: number, currencyCode?: string, symbol?: string }[]
        ): CurrencyBreakdownItem[] => {
            const grouped = items.reduce((acc, item) => {
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

        const committedBreakdown = calculateBreakdown(summary.map(s => ({
            amount: s.total_committed_amount,
            functional: s.total_functional_committed_amount,
            currencyCode: s.currency_code || undefined,
            symbol: s.currency_symbol || undefined
        })));

        const paidBreakdown = calculateBreakdown(payments.map(p => ({
            amount: p.amount,
            functional: p.functional_amount || p.amount,
            currencyCode: p.currency_code || undefined,
            symbol: p.currency_symbol || undefined
        })));

        const balanceBreakdown = calculateBreakdown(summary.map(s => ({
            amount: s.balance_due,
            functional: s.functional_balance_due,
            currencyCode: s.currency_code || undefined,
            symbol: s.currency_symbol || undefined
        })));


        // Monthly Average
        const monthsWithPayments = new Set(payments.map(p =>
            p.payment_month || (p.payment_date ? p.payment_date.substring(0, 7) : '')
        )).size || 1;

        const monthlyAverage = totalPaid / (monthsWithPayments || 1);

        // Trend Logic
        // Calculate totals by month using smart logic
        const paymentsByMonth = payments.reduce((acc, p) => {
            const month = p.payment_month || (p.payment_date ? p.payment_date.substring(0, 7) : '');
            if (!month) return acc;

            const val = calculateDisplayAmount({
                amount: Number(p.amount),
                functional_amount: Number(p.functional_amount),
                currency_code: p.currency_code
            });

            acc[month] = (acc[month] || 0) + val;
            return acc;
        }, {} as Record<string, number>);

        const now = new Date();
        const thisMonth = now.toISOString().slice(0, 7);
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonth = lastMonthDate.toISOString().slice(0, 7);

        const thisMonthTotal = paymentsByMonth[thisMonth] || 0;
        const lastMonthTotal = paymentsByMonth[lastMonth] || 0;
        const trendPercent = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100) : 0;

        return {
            totalCommitted,
            totalPaid,
            totalBalance,
            monthlyAverage,
            trendPercent,
            trendDirection: trendPercent > 0 ? "up" : trendPercent < 0 ? "down" : "neutral" as "up" | "down" | "neutral",
            committedBreakdown,
            paidBreakdown,
            balanceBreakdown
        };
    }, [summary, payments, sumDisplayAmounts, calculateDisplayAmount, primaryCurrencyCode]);

    // ========================================
    // CHART DATA: PAYMENT EVOLUTION
    // ========================================
    const evolutionData = useMemo(() => {
        const grouped = payments.reduce((acc, p) => {
            let monthKey = "";
            if (p.payment_month) {
                monthKey = String(p.payment_month).slice(0, 7);
            } else if (p.payment_date) {
                monthKey = String(p.payment_date).slice(0, 7);
            }

            if (monthKey) {
                const val = calculateDisplayAmount({
                    amount: Number(p.amount),
                    functional_amount: Number(p.functional_amount),
                    currency_code: p.currency_code
                });
                acc[monthKey] = (acc[monthKey] || 0) + val;
            }
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(grouped)
            .filter(([month]) => month && month.length >= 7)
            .map(([month, amount]) => {
                const [year, monthNum] = month.split('-').map(Number);
                const date = new Date(year, (monthNum || 1) - 1, 1);
                const formatted = isNaN(date.getTime())
                    ? month
                    : new Intl.DateTimeFormat('es', { month: 'short', year: '2-digit' }).format(date);
                return { month: formatted, rawMonth: month, amount };
            })
            .sort((a, b) => a.rawMonth.localeCompare(b.rawMonth))
            .slice(-12);
    }, [payments, calculateDisplayAmount]);

    const evolutionChartConfig: ChartConfig = {
        amount: { label: "Cobrado", color: "var(--chart-1)" }
    };

    // ========================================
    // CHART DATA: CLIENT DISTRIBUTION
    // ========================================
    const distributionData = useMemo(() => {
        const clientTotals = payments.reduce((acc, p) => {
            const clientName = p.client_name || "Desconocido";
            const val = calculateDisplayAmount({
                amount: Number(p.amount),
                functional_amount: Number(p.functional_amount),
                currency_code: p.currency_code
            });

            acc[clientName] = (acc[clientName] || 0) + val;
            return acc;
        }, {} as Record<string, number>);

        const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

        return Object.entries(clientTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, value], i) => ({
                name,
                value,
                fill: colors[i % colors.length]
            }));
    }, [payments, calculateDisplayAmount]);

    const distributionChartConfig: ChartConfig = distributionData.reduce((acc, item, i) => {
        acc[item.name] = { label: item.name, color: item.fill };
        return acc;
    }, {} as ChartConfig);

    // ========================================
    // INSIGHTS GENERATION
    // ========================================
    const insights = useMemo<Insight[]>(() => {
        return generateClientInsights({
            summary,
            payments,
            kpis,
            calculateDisplayAmount, // Pass the smart calculator
            formatCurrency: (amount, code) => formatCurrencyUtil(amount, code || displayCurrencyCode),
            primaryCurrencyCode,
            displayCurrency: displayCurrency as 'primary' | 'secondary',
            currentRate: currentRate || 1,
            secondaryCurrencyCode: currencyContext?.secondaryCurrency?.code
        });
    }, [summary, payments, kpis, calculateDisplayAmount, displayCurrencyCode, primaryCurrencyCode, displayCurrency, currentRate, currencyContext?.secondaryCurrency?.code]);

    // ========================================
    // RECENT ACTIVITY
    // ========================================
    const recentActivity = payments.slice(0, 5);

    // ========================================
    // RENDER
    // ========================================
    return (
        <div className="space-y-6">
            {/* ROW 1: KPIs */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <DashboardKpiCard
                    title="Compromisos Totales"
                    value={formatCurrencyUtil(kpis.totalCommitted, displayCurrencyCode)}
                    icon={<FileText className="w-5 h-5" />}
                    description="Valor total de contratos"
                    currencyBreakdown={kpis.committedBreakdown}
                />
                <DashboardKpiCard
                    title="Cobrado a la Fecha"
                    value={formatCurrencyUtil(kpis.totalPaid, displayCurrencyCode)}
                    icon={<DollarSign className="w-5 h-5" />}
                    iconClassName="bg-emerald-500/10 text-emerald-600"
                    trend={{
                        value: `${kpis.trendPercent >= 0 ? '+' : ''}${kpis.trendPercent.toFixed(0)}%`,
                        direction: kpis.trendDirection
                    }}
                    currencyBreakdown={kpis.paidBreakdown}
                />
                <DashboardKpiCard
                    title={kpis.totalBalance < 0 ? "Saldo a Favor" : "Saldo a la Fecha"}
                    value={formatCurrencyUtil(kpis.totalBalance < 0 ? Math.abs(kpis.totalBalance) : kpis.totalBalance, displayCurrencyCode)}
                    icon={kpis.totalBalance < 0 ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    iconClassName={kpis.totalBalance < 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}
                    description={kpis.totalBalance < 0 ? "Cobrado en exceso" : "Por cobrar"}
                    currencyBreakdown={kpis.balanceBreakdown}
                />
                <DashboardKpiCard
                    title="Promedio Mensual"
                    value={formatCurrencyUtil(kpis.monthlyAverage, displayCurrencyCode)}
                    icon={<TrendingUp className="w-5 h-5" />}
                    iconClassName="bg-blue-500/10 text-blue-600"
                    description="Ingreso promedio por mes"
                />
            </div>

            {/* ROW 2: Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
                <DashboardCard
                    title="Evolución de Cobros"
                    description="Ingresos mensuales"
                    icon={<BarChart3 className="w-4 h-4" />}
                >
                    {evolutionData.length > 0 ? (
                        <BaseAreaChart
                            data={evolutionData}
                            xKey="month"
                            yKey="amount"
                            height={250}
                            config={evolutionChartConfig}
                            gradient
                        />
                    ) : (
                        <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                            Sin datos de cobros
                        </div>
                    )}
                </DashboardCard>

                <DashboardCard
                    title="Distribución por Cliente"
                    description="Top 5 clientes por monto cobrado"
                    icon={<PieChart className="w-4 h-4" />}
                >
                    {distributionData.length > 0 ? (
                        <div className="flex items-center gap-4">
                            <BaseDonutChart
                                data={distributionData}
                                nameKey="name"
                                valueKey="value"
                                height={200}
                                config={distributionChartConfig}
                            />
                            <div className="flex-1 space-y-2">
                                {distributionData.map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                                        <span className="flex-1 truncate text-muted-foreground">{item.name}</span>
                                        <span className="font-medium">{formatCurrencyUtil(item.value, displayCurrencyCode)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                            Sin datos de clientes
                        </div>
                    )}
                </DashboardCard>
            </div>

            {/* ROW 3: Insights & Activity */}
            <div className="grid gap-6 lg:grid-cols-2">
                <DashboardCard
                    title="Insights"
                    description="Análisis automático de tu cartera"
                    icon={<Lightbulb className="w-4 h-4" />}
                >
                    {insights.length > 0 ? (
                        <div className="space-y-3">
                            {insights.map(insight => (
                                <InsightCard key={insight.id} insight={insight} />
                            ))}
                        </div>
                    ) : (
                        <div className="h-[150px] flex items-center justify-center text-muted-foreground text-sm">
                            No hay insights disponibles
                        </div>
                    )}
                </DashboardCard>

                <DashboardCard
                    title="Actividad Reciente"
                    description="Últimos cobros registrados"
                    icon={<Activity className="w-4 h-4" />}
                >
                    {recentActivity.length > 0 ? (
                        <div className="space-y-4">
                            {recentActivity.map((payment, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={payment.client_avatar_url || undefined} />
                                        <AvatarFallback className="text-xs">
                                            {(payment.client_name || "?")[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {payment.client_name || "Cliente desconocido"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(payment.payment_date), { addSuffix: true, locale: es })}
                                        </p>
                                    </div>
                                    <span className="text-sm font-semibold text-emerald-600">
                                        {/* Activity stays as original usually */}
                                        +{payment.currency_symbol || "$"} {Number(payment.amount).toLocaleString('es-AR')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-[150px] flex items-center justify-center text-muted-foreground text-sm">
                            Sin actividad reciente
                        </div>
                    )}
                </DashboardCard>
            </div>
        </div>
    );
}
