"use client";

import { EnhancedDashboardData, GeneralCostPaymentView } from "@/types/general-costs";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { InsightCard } from "@/features/insights/components/insight-card";
import { DollarSign, TrendingUp, CreditCard, PieChart as PieChartIcon, Clock, BarChart3, Lightbulb } from "lucide-react";
import { LazyAreaChart as BaseAreaChart, LazyDonutChart as BaseDonutChart } from "@/components/charts/lazy-charts";
import { useCurrencyOptional } from "@/providers/currency-context";
import { formatCurrency as formatCurrencyUtil, getAmountsByCurrency } from "@/lib/currency-utils";

interface DashboardTabProps {
    data: EnhancedDashboardData;
    payments?: GeneralCostPaymentView[];
}

export function DashboardTab({ data, payments }: DashboardTabProps) {
    const { kpis, charts, insights, recentActivity } = data;
    const currencyContext = useCurrencyOptional();
    const primaryCurrencyCode = currencyContext?.primaryCurrency?.code || 'ARS';

    const formatCurrency = (amount: number) => {
        return formatCurrencyUtil(amount, currencyContext?.primaryCurrency || 'ARS');
    };

    // Calculate currency breakdown for expenses
    const expensePayments = payments || recentActivity;
    const expenseBreakdown = getAmountsByCurrency(expensePayments as any, primaryCurrencyCode);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
    };

    return (
        <div className="space-y-6">
            {/* 1. KPI Row - 2x2 on mobile, 1x4 on desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <DashboardKpiCard
                    title={kpis.totalExpense.label}
                    value={formatCurrency(Number(kpis.totalExpense.value))}
                    icon={<DollarSign className="w-5 h-5" />}
                    iconClassName="bg-amount-negative/10 text-amount-negative"
                    description={kpis.totalExpense.description}
                    currencyBreakdown={expenseBreakdown}
                    size="hero"
                    compact
                />
                <DashboardKpiCard
                    title={kpis.monthlyAverage.label}
                    value={formatCurrency(Number(kpis.monthlyAverage.value))}
                    icon={<TrendingUp className="w-5 h-5" />}
                    description={kpis.monthlyAverage.description}
                    size="hero"
                    compact
                />
                <DashboardKpiCard
                    title={kpis.totalPayments.label}
                    value={kpis.totalPayments.value}
                    icon={<CreditCard className="w-5 h-5" />}
                    description={kpis.totalPayments.description}
                    size="hero"
                    compact
                />
                <DashboardKpiCard
                    title={kpis.expenseConcentration.label}
                    value={kpis.expenseConcentration.value}
                    icon={<PieChartIcon className="w-5 h-5" />}
                    description={kpis.expenseConcentration.description}
                    size="hero"
                    compact
                />
            </div>

            {/* 2. Charts Row - 50/50 split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 [&>*]:min-w-0">
                {/* Evolution Chart */}
                <DashboardCard
                    title="Evolución Mensual"
                    description="Gastos por mes"
                    icon={<BarChart3 className="w-4 h-4" />}
                    className="h-[340px]"
                >
                    <BaseAreaChart
                        data={charts.monthlyEvolution}
                        xKey="month"
                        yKey="amount"
                        xAxisFormatter={formatDate}
                        tooltipFormatter={(value) => formatCurrency(value)}
                        tooltipLabelFormatter={formatDate}
                        chartClassName="h-full"
                    />
                </DashboardCard>

                {/* Categories Chart */}
                <DashboardCard
                    title="Por Categoría"
                    description="Distribución de gastos"
                    icon={<PieChartIcon className="w-4 h-4" />}
                    className="h-[340px]"
                >
                    <BaseDonutChart
                        data={charts.categoryDistribution}
                        nameKey="name"
                        valueKey="value"
                        legendFormatter={formatCurrency}
                        tooltipFormatter={formatCurrency}
                        height={200}
                    />
                </DashboardCard>
            </div>

            {/* 3. Bottom Row: Insights & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Insights Column */}
                <DashboardCard
                    title="Insights"
                    description="Análisis de tus gastos"
                    icon={<Lightbulb className="w-4 h-4" />}
                >
                    {insights.length === 0 ? (
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                            Sin insights relevantes por el momento
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {insights.map(insight => (
                                <InsightCard key={insight.id} insight={insight} compact />
                            ))}
                        </div>
                    )}
                </DashboardCard>

                {/* Activity List */}
                <DashboardCard
                    title="Actividad Reciente"
                    description="Últimos pagos registrados"
                    icon={<Clock className="w-4 h-4" />}
                >
                    {recentActivity.length > 0 ? (
                        <div className="space-y-4">
                            {recentActivity.slice(0, 5).map(payment => {
                                const paymentDate = new Date(payment.payment_date);
                                const formattedDate = paymentDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

                                return (
                                    <div key={payment.id} className="flex items-center gap-3">
                                        {/* Category Initial */}
                                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                                            {(payment.category_name || "G").charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {payment.general_cost_name || "Gasto general"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {payment.category_name || "Sin categoría"} · {formattedDate}
                                            </p>
                                        </div>
                                        <span className="text-sm font-semibold text-amount-negative">
                                            -{formatCurrency(payment.amount)}
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
    );
}
