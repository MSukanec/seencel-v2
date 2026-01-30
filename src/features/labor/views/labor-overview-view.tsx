"use client";

import { useMemo } from "react";
import { ContentLayout } from "@/components/layout";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { LazyAreaChart as BaseAreaChart, LazyDonutChart as BaseDonutChart } from "@/components/charts/lazy-charts";
import { CHART_COLORS } from "@/components/charts/chart-config";
import {
    DollarSign,
    TrendingUp,
    Receipt,
    Users,
    PieChart as PieChartIcon,
    BarChart3
} from "lucide-react";
import { LaborPaymentView } from "../types";
import { useMoney } from "@/hooks/use-money";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface LaborOverviewViewProps {
    projectId: string;
    orgId: string;
    payments: LaborPaymentView[];
}

export function LaborOverviewView({
    projectId,
    orgId,
    payments,
}: LaborOverviewViewProps) {
    const money = useMoney();

    // Calculate all KPI data from real payments
    const kpiData = useMemo(() => {
        const confirmedPayments = payments.filter(p => p.status === "confirmed");

        // Total items for multi-currency KPI
        const totalItems = confirmedPayments.map(p => ({
            amount: Number(p.amount) || 0,
            currency_code: p.currency_code || 'ARS',
            exchange_rate: Number(p.exchange_rate) || 1,
        }));

        // Total functional amount
        const totalFunctional = confirmedPayments.reduce((sum, p) => sum + Number(p.functional_amount || 0), 0);

        // Monthly breakdown for average
        const monthlyTotals: Record<string, number> = {};
        confirmedPayments.forEach(p => {
            const monthKey = p.payment_month || format(parseISO(p.payment_date), 'yyyy-MM');
            monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + Number(p.functional_amount || 0);
        });
        const monthCount = Object.keys(monthlyTotals).length;
        const monthlyAverage = monthCount > 0 ? totalFunctional / monthCount : 0;

        // Unique workers
        const uniqueWorkers = new Set(confirmedPayments.map(p => p.labor_id).filter(Boolean));

        return {
            totalItems,
            totalPayments: confirmedPayments.length,
            monthlyAverage,
            activeWorkers: uniqueWorkers.size,
            monthlyTotals,
        };
    }, [payments]);

    // Monthly evolution chart data
    const monthlyEvolution = useMemo(() => {
        const data = Object.entries(kpiData.monthlyTotals)
            .map(([month, amount]) => ({
                month: format(parseISO(month + '-01'), 'MMM yy', { locale: es }),
                amount,
            }))
            .sort((a, b) => a.month.localeCompare(b.month));
        return data;
    }, [kpiData.monthlyTotals]);

    // Category distribution chart data
    const categoryDistribution = useMemo(() => {
        const confirmedPayments = payments.filter(p => p.status === "confirmed");
        const byCategory: Record<string, { name: string; value: number }> = {};

        confirmedPayments.forEach(p => {
            const key = p.labor_type_id || 'other';
            const name = p.labor_type_name || 'Sin categoría';
            if (!byCategory[key]) {
                byCategory[key] = { name, value: 0 };
            }
            byCategory[key].value += Number(p.functional_amount || 0);
        });

        return Object.values(byCategory)
            .sort((a, b) => b.value - a.value)
            .map((item, index) => ({
                ...item,
                color: CHART_COLORS.categorical[index % CHART_COLORS.categorical.length]
            }));
    }, [payments]);

    return (
        <>
            <Toolbar portalToHeader />

            <ContentLayout variant="wide" className="pb-6">
                <div className="space-y-6">
                    {/* KPI Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <DashboardKpiCard
                            title="Total Pagado"
                            items={kpiData.totalItems}
                            icon={<DollarSign className="h-5 w-5" />}
                            iconClassName="bg-primary/10 text-primary"
                            description="Acumulado del proyecto"
                        />
                        <DashboardKpiCard
                            title="Promedio Mensual"
                            value={money.format(kpiData.monthlyAverage)}
                            icon={<TrendingUp className="h-5 w-5" />}
                            iconClassName="bg-blue-500/10 text-blue-600"
                            description={`${Object.keys(kpiData.monthlyTotals).length} meses con pagos`}
                        />
                        <DashboardKpiCard
                            title="Pagos Realizados"
                            value={kpiData.totalPayments.toString()}
                            icon={<Receipt className="h-5 w-5" />}
                            iconClassName="bg-violet-500/10 text-violet-600"
                            description="Total de recibos"
                        />
                        <DashboardKpiCard
                            title="Trabajadores"
                            value={kpiData.activeWorkers.toString()}
                            icon={<Users className="h-5 w-5" />}
                            iconClassName="bg-emerald-500/10 text-emerald-600"
                            description="Con pagos registrados"
                        />
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 [&>*]:min-w-0">
                        {/* Monthly Evolution Chart */}
                        <DashboardCard
                            title="Evolución Mensual"
                            description="Gastos de mano de obra por mes"
                            icon={<BarChart3 className="h-4 w-4" />}
                            className="h-[340px]"
                        >
                            {monthlyEvolution.length > 0 ? (
                                <BaseAreaChart
                                    data={monthlyEvolution}
                                    yKey="amount"
                                    xKey="month"
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

                        {/* Category Distribution Chart */}
                        <DashboardCard
                            title="Distribución por Categoría"
                            description="Gastos por tipo de trabajador"
                            icon={<PieChartIcon className="h-4 w-4" />}
                            className="h-[340px]"
                        >
                            {categoryDistribution.length > 0 ? (
                                <BaseDonutChart
                                    data={categoryDistribution}
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
                </div>
            </ContentLayout>
        </>
    );
}
