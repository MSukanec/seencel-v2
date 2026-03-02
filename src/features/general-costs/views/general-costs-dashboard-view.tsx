"use client";

/**
 * General Costs — Dashboard View
 * KPIs + Charts + Insights + Recent Activity
 * Owns its own date range filter via Toolbar portalToHeader.
 */

import { useState, useMemo } from "react";
import { EnhancedDashboardData, GeneralCostPaymentView } from "@/features/general-costs/types";
import { MetricCard, ChartCard } from "@/components/cards";
import { InsightCard } from "@/features/insights/components/insight-card";
import { DollarSign, TrendingUp, CreditCard, PieChart as PieChartIcon, Clock, BarChart3, Lightbulb } from "lucide-react";
import { LazyAreaChart as BaseAreaChart, LazyDonutChart as BaseDonutChart } from "@/components/charts/lazy-charts";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { DateRangeFilter, type DateRangeFilterValue } from "@/components/layout/dashboard/shared/toolbar/toolbar-date-range-filter";
import { useMoney } from "@/hooks/use-money";
import { parseDateFromDB } from "@/lib/timezone-data";
import { format, isAfter, isBefore, isEqual, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";

interface DashboardTabProps {
    data: EnhancedDashboardData;
    payments: GeneralCostPaymentView[];
}

export function GeneralCostsDashboardView({ data, payments }: DashboardTabProps) {
    const { kpis, charts, insights, recentActivity } = data;
    const money = useMoney();

    // ─── Date range filter (self-contained) ──────────────
    const [dateRange, setDateRange] = useState<DateRangeFilterValue | undefined>(undefined);

    const filteredPayments = useMemo(() => {
        if (!dateRange?.from && !dateRange?.to) return payments;
        return payments.filter(p => {
            const paymentDate = parseDateFromDB(p.payment_date);
            if (!paymentDate) return false;
            const date = startOfDay(paymentDate);
            const from = dateRange?.from ? startOfDay(dateRange.from) : null;
            const to = dateRange?.to ? endOfDay(dateRange.to) : null;
            if (from && !(isAfter(date, from) || isEqual(date, from))) return false;
            if (to && !(isBefore(date, to) || isEqual(date, to))) return false;
            return true;
        });
    }, [payments, dateRange]);

    const expensePayments = filteredPayments.length > 0 ? filteredPayments : recentActivity;

    const formatDate = (dateStr: string) => {
        const d = parseDateFromDB(dateStr);
        return d ? format(d, 'MMM yyyy', { locale: es }) : dateStr;
    };

    return (
        <>
            <Toolbar
                portalToHeader
                leftActions={
                    <DateRangeFilter
                        title="Período"
                        value={dateRange}
                        onChange={(value) => setDateRange(value)}
                    />
                }
            />
            <div className="space-y-6">
                {/* 1. KPI Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        title={kpis.totalExpense.label}
                        amount={Number(kpis.totalExpense.value)}
                        items={expensePayments as any}
                        icon={<DollarSign className="w-5 h-5" />}
                        iconClassName="bg-amount-negative/10 text-amount-negative"
                        description={kpis.totalExpense.description}
                        size="default"
                    />
                    <MetricCard
                        title={kpis.monthlyAverage.label}
                        amount={Number(kpis.monthlyAverage.value)}
                        icon={<TrendingUp className="w-5 h-5" />}
                        description={kpis.monthlyAverage.description}
                        size="default"
                    />
                    <MetricCard
                        title={kpis.totalPayments.label}
                        value={kpis.totalPayments.value}
                        icon={<CreditCard className="w-5 h-5" />}
                        description={kpis.totalPayments.description}
                        size="default"
                    />
                    <MetricCard
                        title={kpis.expenseConcentration.label}
                        value={kpis.expenseConcentration.value}
                        icon={<PieChartIcon className="w-5 h-5" />}
                        description={kpis.expenseConcentration.description}
                        size="default"
                    />
                </div>

                {/* 2. Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 [&>*]:min-w-0">
                    <ChartCard
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
                            tooltipLabelFormatter={formatDate}
                            chartClassName="h-full"
                        />
                    </ChartCard>

                    <ChartCard
                        title="Por Categoría"
                        description="Distribución de gastos"
                        icon={<PieChartIcon className="w-4 h-4" />}
                        className="h-[340px]"
                    >
                        <BaseDonutChart
                            data={charts.categoryDistribution}
                            nameKey="name"
                            valueKey="value"
                            height={200}
                        />
                    </ChartCard>
                </div>

                {/* 3. Bottom Row: Insights & Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard
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
                                    <InsightCard key={insight.id} insight={insight} />
                                ))}
                            </div>
                        )}
                    </ChartCard>

                    <ChartCard
                        title="Actividad Reciente"
                        description="Últimos pagos registrados"
                        icon={<Clock className="w-4 h-4" />}
                    >
                        {recentActivity.length > 0 ? (
                            <div className="space-y-4">
                                {recentActivity.slice(0, 5).map(payment => {
                                    const paymentDate = parseDateFromDB(payment.payment_date);
                                    const formattedDate = paymentDate
                                        ? format(paymentDate, 'd MMM', { locale: es })
                                        : '';

                                    return (
                                        <div key={payment.id} className="flex items-center gap-3">
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
                                                -{money.format(payment.amount)}
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
                    </ChartCard>
                </div>
            </div>
        </>
    );
}
