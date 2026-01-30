"use client";

import { useMemo } from "react";
import { MaterialPaymentView } from "@/features/materials/types";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { InsightCard } from "@/features/insights/components/insight-card";
import { generateMaterialsInsights } from "@/features/insights/logic/materials";
import { DollarSign, TrendingUp, CreditCard, PieChart as PieChartIcon, Clock, BarChart3, Lightbulb } from "lucide-react";
import { LazyAreaChart as BaseAreaChart, LazyDonutChart as BaseDonutChart } from "@/components/charts/lazy-charts";
import { useMoney } from "@/hooks/use-money";
import { ContentLayout } from "@/components/layout";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";

interface MaterialsOverviewViewProps {
    projectId: string;
    orgId: string;
    payments: MaterialPaymentView[];
}

export function MaterialsOverviewView({ projectId, orgId, payments }: MaterialsOverviewViewProps) {
    const money = useMoney();

    // =============================================
    // KPIs - All calculated client-side using useMoney
    // =============================================
    const kpis = useMemo(() => {
        // Total using useMoney.sum() for proper bimonetary aggregation
        const { total } = money.sum(payments);

        // Unique months for average calculation
        const uniqueMonths = new Set(
            payments.map(p => p.payment_date?.substring(0, 7)).filter(Boolean)
        );
        const monthCount = Math.max(uniqueMonths.size, 1);
        const monthlyAverage = total / monthCount;

        // Type concentration - group by type and find top
        const byType: Record<string, MaterialPaymentView[]> = {};
        payments.forEach(p => {
            const typeName = p.material_type_name || "Sin Tipo";
            if (!byType[typeName]) byType[typeName] = [];
            byType[typeName].push(p);
        });

        // Calculate totals per type using useMoney.sum
        const typeAmounts = Object.entries(byType).map(([name, items]) => ({
            name,
            total: money.sum(items).total
        }));

        const topType = typeAmounts.sort((a, b) => b.total - a.total)[0];
        const concentrationPct = total > 0 && topType
            ? Math.round((topType.total / total) * 100)
            : 0;

        return {
            total,
            monthlyAverage,
            paymentCount: payments.length,
            monthCount,
            concentrationPct,
            topTypeName: topType?.name || "-"
        };
    }, [payments, money]);

    // =============================================
    // Charts - Calculated client-side using toFunctionalAmount for consistency
    // =============================================
    const charts = useMemo(() => {
        // Monthly evolution - aggregate by month using toFunctionalAmount
        const monthlyData: Record<string, number> = {};
        payments.forEach(p => {
            const month = p.payment_date?.substring(0, 7) || "";
            if (month) {
                const functionalAmount = money.toFunctionalAmount(p);
                monthlyData[month] = (monthlyData[month] || 0) + functionalAmount;
            }
        });
        const monthlyEvolution = Object.entries(monthlyData)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, amount]) => ({ month, amount }));

        // Type distribution - aggregate by type using toFunctionalAmount
        const byType: Record<string, number> = {};
        payments.forEach(p => {
            const typeName = p.material_type_name || "Sin Tipo";
            const functionalAmount = money.toFunctionalAmount(p);
            byType[typeName] = (byType[typeName] || 0) + functionalAmount;
        });
        const typeDistribution = Object.entries(byType)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);

        return { monthlyEvolution, typeDistribution };
    }, [payments, money]);

    // =============================================
    // Insights - Generated using rules engine
    // =============================================
    const insights = useMemo(() => {
        return generateMaterialsInsights({
            monthlyData: charts.monthlyEvolution.map(m => ({ month: m.month, value: m.amount })),
            typeDistribution: charts.typeDistribution,
            paymentCount: kpis.paymentCount,
            currentMonth: new Date().getMonth() + 1
        });
    }, [charts, kpis.paymentCount]);

    const recentActivity = payments.slice(0, 5);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
    };

    return (
        <>
            {/* Toolbar with portal to header */}
            <Toolbar portalToHeader />

            <ContentLayout variant="wide" className="pb-6">
                <div className="space-y-6">
                    {/* 1. KPI Row - 2x2 on mobile, 1x4 on desktop */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <DashboardKpiCard
                            title="Total Pagos"
                            items={payments}
                            icon={<DollarSign className="w-5 h-5" />}
                            iconClassName="bg-amount-negative/10 text-amount-negative"
                            description="Suma de todos los pagos de materiales"
                            size="hero"
                            compact
                        />
                        <DashboardKpiCard
                            title="Promedio Mensual"
                            amount={kpis.monthlyAverage}
                            icon={<TrendingUp className="w-5 h-5" />}
                            description={`Basado en ${kpis.monthCount} mes${kpis.monthCount > 1 ? 'es' : ''}`}
                            size="hero"
                            compact
                        />
                        <DashboardKpiCard
                            title="Cant. Pagos"
                            value={kpis.paymentCount}
                            icon={<CreditCard className="w-5 h-5" />}
                            description="Número total de pagos registrados"
                            size="hero"
                            compact
                        />
                        <DashboardKpiCard
                            title="Concentración"
                            value={`${kpis.concentrationPct}%`}
                            icon={<PieChartIcon className="w-5 h-5" />}
                            description={`Top: ${kpis.topTypeName}`}
                            size="hero"
                            compact
                        />
                    </div>

                    {/* 2. Charts Row - 50/50 split */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 [&>*]:min-w-0">
                        {/* Evolution Chart */}
                        <DashboardCard
                            title="Evolución Mensual"
                            description="Pagos por mes"
                            icon={<BarChart3 className="w-4 h-4" />}
                            className="h-[340px]"
                        >
                            {charts.monthlyEvolution.length > 0 ? (
                                <BaseAreaChart
                                    data={charts.monthlyEvolution}
                                    yKey="amount"
                                    xKey="month"
                                    xAxisFormatter={formatDate}
                                    showGrid={false}
                                    height={240}
                                    gradient
                                    autoFormat
                                />
                            ) : (
                                <div className="flex items-center justify-center h-[240px] text-muted-foreground">
                                    Sin datos de evolución
                                </div>
                            )}
                        </DashboardCard>

                        {/* Type Distribution */}
                        <DashboardCard
                            title="Por Tipo de Material"
                            description="Distribución de pagos"
                            icon={<PieChartIcon className="w-4 h-4" />}
                            className="h-[340px]"
                        >
                            {charts.typeDistribution.length > 0 ? (
                                <BaseDonutChart
                                    data={charts.typeDistribution}
                                    nameKey="name"
                                    valueKey="value"
                                    height={240}
                                    showLegend
                                    autoFormat
                                />
                            ) : (
                                <div className="flex items-center justify-center h-[240px] text-muted-foreground">
                                    Sin datos de distribución
                                </div>
                            )}
                        </DashboardCard>
                    </div>

                    {/* 3. Bottom Row - Insights + Activity */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Insights */}
                        <DashboardCard
                            title="Insights"
                            description="Análisis de tus pagos"
                            icon={<Lightbulb className="w-4 h-4" />}
                        >
                            {insights.length > 0 ? (
                                <div className="space-y-3">
                                    {insights.map((insight) => (
                                        <InsightCard key={insight.id} insight={insight} />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm">
                                    Sin insights relevantes por el momento.
                                </p>
                            )}
                        </DashboardCard>

                        {/* Recent Activity */}
                        <DashboardCard
                            title="Actividad Reciente"
                            description="Últimos pagos registrados"
                            icon={<Clock className="w-4 h-4" />}
                        >
                            {recentActivity.length > 0 ? (
                                <div className="space-y-3">
                                    {recentActivity.map((payment) => (
                                        <div
                                            key={payment.id}
                                            className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                                        >
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {payment.material_type_name || "Pago de material"}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {payment.payment_date
                                                        ? new Date(payment.payment_date).toLocaleDateString("es-ES", {
                                                            day: "numeric",
                                                            month: "short"
                                                        })
                                                        : "Sin fecha"}
                                                </p>
                                            </div>
                                            <p className="font-semibold text-amount-negative">
                                                {money.format(money.calculateDisplayAmount(payment))}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm">
                                    Sin actividad reciente.
                                </p>
                            )}
                        </DashboardCard>
                    </div>
                </div>
            </ContentLayout>
        </>
    );
}
