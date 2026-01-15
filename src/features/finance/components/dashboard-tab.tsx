"use client";

import { EnhancedDashboardData } from "@/types/general-costs";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { InsightCard } from "@/components/dashboard/dashboard-insight-card";
import { DollarSign, TrendingUp, CreditCard, PieChart as PieChartIcon, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BaseAreaChart } from "@/components/charts/base-area-chart";
import { BaseDonutChart } from "@/components/charts/base-donut-chart";
import { Card, CardContent, CardHeader } from "@/components/ui/card"; // Kept for Activity List only

interface DashboardTabProps {
    data: EnhancedDashboardData;
}

export function DashboardTab({ data }: DashboardTabProps) {
    const { kpis, charts, insights, recentActivity } = data;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
    };

    return (
        <div className="space-y-6">
            {/* 1. KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <DashboardKpiCard
                    title={kpis.totalExpense.label}
                    value={formatCurrency(Number(kpis.totalExpense.value))}
                    icon={<DollarSign className="w-5 h-5" />}
                    description={kpis.totalExpense.description}
                    trend={{ value: "-93.2%", direction: "down" }}
                />
                <DashboardKpiCard
                    title={kpis.monthlyAverage.label}
                    value={formatCurrency(Number(kpis.monthlyAverage.value))}
                    icon={<TrendingUp className="w-5 h-5" />}
                    description={kpis.monthlyAverage.description}
                />
                <DashboardKpiCard
                    title={kpis.totalPayments.label}
                    value={kpis.totalPayments.value}
                    icon={<CreditCard className="w-5 h-5" />}
                    description={kpis.totalPayments.description}
                />
                <DashboardKpiCard
                    title={kpis.expenseConcentration.label}
                    value={kpis.expenseConcentration.value}
                    icon={<PieChartIcon className="w-5 h-5" />}
                    description={kpis.expenseConcentration.description}
                />
            </div>

            {/* 2. Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Evolution Chart (2/3) */}
                <div className="lg:col-span-2">
                    <BaseAreaChart
                        data={charts.monthlyEvolution}
                        xKey="month"
                        yKey="amount"
                        title="Evolución Mensual"
                        description="Hacé click en un punto para ver los pagos de ese mes"
                        xAxisFormatter={formatDate}
                        tooltipFormatter={(value) => formatCurrency(value)}
                        className="h-full bg-card rounded-xl border p-6"
                        height={300}
                    />
                </div>

                {/* Categories Chart (1/3) */}
                <div className="lg:col-span-1">
                    <BaseDonutChart
                        data={charts.categoryDistribution}
                        nameKey="name"
                        valueKey="value"
                        title="Distribución por Categoría"
                        description="Principales áreas de gasto"
                        className="h-full bg-card rounded-xl border p-6"
                        height={300}
                    />
                </div>
            </div>

            {/* 3. Bottom Row: Insights & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Insights Column */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                            <div className="p-1 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-600">
                                <Clock className="w-4 h-4" />
                            </div>
                            Insights
                        </h3>
                    </div>

                    {insights.length === 0 ? (
                        <div className="p-8 border rounded-xl bg-card text-center text-muted-foreground">
                            <p>Sin insights relevantes por el momento.</p>
                        </div>
                    ) : (
                        insights.map(insight => (
                            <InsightCard key={insight.id} insight={insight} />
                        ))
                    )}
                </div>

                {/* Activity List */}
                <Card className="h-full border-none shadow-none bg-transparent">
                    <CardHeader className="px-0 pt-0">
                        <h3 className="text-lg font-medium flex items-center gap-2 mb-2">
                            <div className="p-1 rounded-md bg-muted text-muted-foreground">
                                <Clock className="w-4 h-4" />
                            </div>
                            Actividad Reciente
                        </h3>
                    </CardHeader>
                    <CardContent className="px-0 space-y-0 divide-y">
                        {recentActivity.map(payment => (
                            <div key={payment.id} className="flex items-center justify-between py-3 hover:bg-muted/50 px-2 rounded-lg transition-colors">
                                <div>
                                    <p className="font-medium text-sm">{payment.general_cost_name || "Gasto general"}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                        <span>{new Date(payment.payment_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                                        <span>·</span>
                                        <span>{payment.category_name || "Sin categoría"}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono font-medium text-sm">{formatCurrency(payment.amount)}</p>
                                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground border-border/60">
                                        {payment.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
