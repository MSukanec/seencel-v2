"use client";

import { useMemo } from "react";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { InsightCard, Insight, InsightSeverity } from "@/components/dashboard/dashboard-insight-card";
import { BaseAreaChart } from "@/components/charts/base-area-chart";
import { BaseDonutChart } from "@/components/charts/base-donut-chart";
import { ClientFinancialSummary, ClientPaymentView } from "../types";
import { FileText, DollarSign, Clock, TrendingUp, BarChart3, PieChart, Lightbulb, Activity } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ChartConfig } from "@/components/ui/chart";
import { useCurrencyOptional } from "@/providers/currency-context";
import { formatCurrency as formatCurrencyUtil, sumMonetaryAmounts, getAmountsByCurrency } from "@/lib/currency-utils";

interface ClientsOverviewProps {
    summary: ClientFinancialSummary[];
    payments: ClientPaymentView[];
}

export function ClientsOverview({ summary, payments }: ClientsOverviewProps) {
    const currencyContext = useCurrencyOptional();

    // ========================================
    // HELPERS - Use context currency or fallback to ARS
    // ========================================
    const primaryCurrencyCode = currencyContext?.primaryCurrency?.code || 'ARS';

    const formatCurrency = (amount: number, currencyCode?: string) => {
        return formatCurrencyUtil(amount, currencyCode || currencyContext?.primaryCurrency || 'ARS');
    };

    // ========================================
    // KPI CALCULATIONS
    // ========================================
    const kpis = useMemo(() => {
        // Use bi-currency aware sum for proper multi-currency handling
        // Note: summary should ideally have currency_code and exchange_rate
        // For now, we sum the amounts as they're stored (should be in functional currency)
        const totalCommitted = summary.reduce((acc, curr) => acc + (Number(curr.total_committed_amount) || 0), 0);
        const totalPaid = summary.reduce((acc, curr) => acc + (Number(curr.total_paid_amount) || 0), 0);
        const totalBalance = summary.reduce((acc, curr) => acc + (Number(curr.balance_due) || 0), 0);

        // Get breakdown by currency from payments (for future KPI breakdown display)
        const currencyBreakdown = getAmountsByCurrency(payments as any, primaryCurrencyCode);

        // Calculate monthly average from payments
        const paymentsByMonth = payments.reduce((acc, p) => {
            const month = p.payment_month || new Date(p.payment_date).toISOString().slice(0, 7);
            acc[month] = (acc[month] || 0) + Number(p.amount);
            return acc;
        }, {} as Record<string, number>);

        const monthsWithPayments = Object.keys(paymentsByMonth).length || 1;
        const monthlyAverage = totalPaid / monthsWithPayments;

        // Previous month comparison for trend
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
            trendDirection: trendPercent > 0 ? "up" : trendPercent < 0 ? "down" : "neutral" as "up" | "down" | "neutral"
        };
    }, [summary, payments]);

    // ========================================
    // CHART DATA: PAYMENT EVOLUTION
    // ========================================
    const evolutionData = useMemo(() => {
        const grouped = payments.reduce((acc, p) => {
            // payment_month can be "2024-01-01T00:00:00.000Z" or null
            // Extract YYYY-MM format safely
            let monthKey = "";
            if (p.payment_month) {
                monthKey = String(p.payment_month).slice(0, 7);
            } else if (p.payment_date) {
                monthKey = String(p.payment_date).slice(0, 7);
            }
            if (monthKey) {
                acc[monthKey] = (acc[monthKey] || 0) + Number(p.amount);
            }
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(grouped)
            .filter(([month]) => month && month.length >= 7) // Ensure valid month key
            .map(([month, amount]) => {
                // Parse YYYY-MM safely
                const [year, monthNum] = month.split('-').map(Number);
                const date = new Date(year, (monthNum || 1) - 1, 1);
                const formatted = isNaN(date.getTime())
                    ? month
                    : new Intl.DateTimeFormat('es', { month: 'short', year: '2-digit' }).format(date);
                return { month: formatted, rawMonth: month, amount };
            })
            .sort((a, b) => a.rawMonth.localeCompare(b.rawMonth))
            .slice(-12); // Last 12 months
    }, [payments]);

    const evolutionChartConfig: ChartConfig = {
        amount: { label: "Cobrado", color: "var(--chart-2)" }
    };

    // ========================================
    // CHART DATA: CLIENT DISTRIBUTION
    // ========================================
    const distributionData = useMemo(() => {
        const clientTotals = payments.reduce((acc, p) => {
            const clientName = p.client_name || "Desconocido";
            acc[clientName] = (acc[clientName] || 0) + Number(p.amount);
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
    }, [payments]);

    const distributionChartConfig: ChartConfig = distributionData.reduce((acc, item, i) => {
        acc[item.name] = { label: item.name, color: item.fill };
        return acc;
    }, {} as ChartConfig);

    // ========================================
    // INSIGHTS GENERATION
    // ========================================
    const insights = useMemo<Insight[]>(() => {
        const result: Insight[] = [];

        // Clients with balance
        const clientsWithBalance = summary.filter(s => s.balance_due > 0).length;
        if (clientsWithBalance > 0) {
            result.push({
                id: "balance-pending",
                title: `${clientsWithBalance} clientes con saldo pendiente`,
                description: `Hay ${formatCurrency(kpis.totalBalance)} por cobrar en total.`,
                severity: clientsWithBalance > 3 ? "warning" : "info"
            });
        }

        // No recent payments
        const recentPayments = payments.filter(p => {
            const daysDiff = (Date.now() - new Date(p.payment_date).getTime()) / (1000 * 60 * 60 * 24);
            return daysDiff <= 30;
        });
        if (recentPayments.length === 0 && payments.length > 0) {
            result.push({
                id: "no-recent",
                title: "Sin pagos en los últimos 30 días",
                description: "No se han registrado cobros recientemente. Considera hacer seguimiento.",
                severity: "critical"
            });
        }

        // Good collection rate
        const collectionRate = kpis.totalCommitted > 0 ? (kpis.totalPaid / kpis.totalCommitted) * 100 : 0;
        if (collectionRate >= 80) {
            result.push({
                id: "good-rate",
                title: `Tasa de cobranza: ${collectionRate.toFixed(0)}%`,
                description: "Excelente porcentaje de cobro respecto a compromisos.",
                severity: "positive"
            });
        }

        // Monthly trend
        if (kpis.trendPercent > 20) {
            result.push({
                id: "trend-up",
                title: `Cobros +${kpis.trendPercent.toFixed(0)}% vs mes anterior`,
                description: "Los ingresos están creciendo respecto al mes pasado.",
                severity: "positive"
            });
        }

        return result.slice(0, 3); // Max 3 insights
    }, [summary, payments, kpis]);

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
                    value={formatCurrency(kpis.totalCommitted)}
                    icon={<FileText className="w-5 h-5" />}
                    description="Valor total de contratos"
                    currencyBreakdown={getAmountsByCurrency(summary as any, primaryCurrencyCode)}
                />
                <DashboardKpiCard
                    title="Cobrado a la Fecha"
                    value={formatCurrency(kpis.totalPaid)}
                    icon={<DollarSign className="w-5 h-5" />}
                    iconClassName="bg-emerald-500/10 text-emerald-600"
                    trend={{
                        value: `${kpis.trendPercent >= 0 ? '+' : ''}${kpis.trendPercent.toFixed(0)}%`,
                        label: "vs mes anterior",
                        direction: kpis.trendDirection
                    }}
                    currencyBreakdown={getAmountsByCurrency(payments as any, primaryCurrencyCode)}
                />
                <DashboardKpiCard
                    title="Saldo a la Fecha"
                    value={formatCurrency(kpis.totalBalance)}
                    icon={<Clock className="w-5 h-5" />}
                    iconClassName="bg-amber-500/10 text-amber-600"
                    description="Por cobrar"
                    currencyBreakdown={getAmountsByCurrency(summary.map(s => ({
                        amount: s.balance_due,
                        currency_code: s.currency_code,
                        currency_symbol: s.currency_symbol
                    })) as any, primaryCurrencyCode)}
                />
                <DashboardKpiCard
                    title="Promedio Mensual"
                    value={formatCurrency(kpis.monthlyAverage)}
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
                                        <span className="font-medium">{formatCurrency(item.value)}</span>
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
                                        +{formatCurrency(payment.amount)}
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
