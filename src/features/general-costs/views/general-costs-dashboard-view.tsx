"use client";

/**
 * General Costs — Dashboard View (Insight Cards Pattern)
 * 
 * Row 1: 4 Insight Cards (KPI + chart + insight in one card)
 * Row 2: 2 Operational Cards (Activity + Obligations)
 */

import { EnhancedDashboardData, GeneralCostPaymentView } from "@/features/general-costs/types";
import { ChartCard, ListCard, type ListCardItem } from "@/components/cards";
import { InsightCard } from "@/features/insights/components/insight-card";
import {
    DollarSign, TrendingUp, TrendingDown, Minus,
    CalendarClock, PieChart as PieChartIcon,
    Clock, AlertCircle, CheckCircle2, Timer,
} from "lucide-react";
import { LazyAreaChart, LazyBarChart, LazyDonutChart as BaseDonutChart } from "@/components/charts/lazy-charts";
import { useMoney } from "@/hooks/use-money";
import { parseDateFromDB } from "@/lib/timezone-data";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DashboardTabProps {
    data: EnhancedDashboardData;
    payments: GeneralCostPaymentView[];
}

// ─── Helpers ─────────────────────────────────────────────

const RECURRENCE_LABELS: Record<string, string> = {
    monthly: "Mensual",
    weekly: "Semanal",
    quarterly: "Trimestral",
    yearly: "Anual",
};

const STATUS_META: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
    on_track: { label: "Al día", icon: CheckCircle2, className: "text-semantic-positive" },
    pending: { label: "Pendiente", icon: Timer, className: "text-semantic-warning" },
    overdue: { label: "Vencido", icon: AlertCircle, className: "text-semantic-negative" },
};

function TrendBadge({ value, direction }: { value: number; direction: 'up' | 'down' | 'neutral' }) {
    if (value === 0 || direction === 'neutral') return null;
    const Icon = direction === 'up' ? TrendingUp : TrendingDown;
    return (
        <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1",
            direction === 'down' ? "bg-amount-positive/10 text-amount-positive" : "bg-amount-negative/10 text-amount-negative",
        )}>
            <Icon className="w-3 h-3" />
            {value}%
        </span>
    );
}

// ─── Component ───────────────────────────────────────────

export function GeneralCostsDashboardView({ data, payments }: DashboardTabProps) {
    const { kpis, trends, charts, fixedCostsBreakdown, recurringObligations, insights, recentActivity } = data;
    const money = useMoney();

    // ─── Helper: format kpi amount ──────────────────────
    const formatKpi = (val: string | number) => {
        const num = Number(val);
        return isNaN(num) ? String(val) : money.format(num);
    };
    // ─── Pre-format chart data (fixes tooltip showing raw ISO dates) ──
    const formattedEvolution = charts.monthlyEvolution.map(m => {
        const d = parseDateFromDB(m.month);
        return { month: d ? format(d, 'MMM yy', { locale: es }) : m.month, amount: m.amount };
    });

    // ─── Insight text generation ────────────────────────
    const totalExpenseInsight = (() => {
        const { direction, value } = trends.totalExpenseTrend;
        if (direction === 'neutral' || value === 0) return "Sin datos suficientes para comparar.";
        return direction === 'down'
            ? `El gasto bajó ${value}% respecto al mes anterior.`
            : `El gasto subió ${value}% respecto al mes anterior.`;
    })();

    const avgInsight = (() => {
        const { direction, value } = trends.avgTrend;
        if (direction === 'neutral' || value === 0) return "Promedio estable en los últimos meses.";
        return direction === 'down'
            ? `El promedio bajó ${value}% (últimos 3 meses vs anteriores).`
            : `El promedio subió ${value}% (últimos 3 meses vs anteriores).`;
    })();

    const fixedCostsInsight = (() => {
        if (fixedCostsBreakdown.length === 0) return "No hay costos fijos configurados.";
        const top = fixedCostsBreakdown[0];
        const totalFixed = fixedCostsBreakdown.reduce((s, c) => s + c.amount, 0);
        const pct = totalFixed > 0 ? Math.round((top.amount / totalFixed) * 100) : 0;
        return `${top.name} representa el ${pct}% de los costos fijos.`;
    })();

    const categoryInsight = (() => {
        if (charts.categoryDistribution.length === 0) return "Sin datos de categorías.";
        const top = charts.categoryDistribution[0];
        const total = charts.categoryDistribution.reduce((s, c) => s + c.value, 0);
        const pct = total > 0 ? Math.round((top.value / total) * 100) : 0;
        return `${top.name} concentra el ${pct}% del gasto total.`;
    })();

    // ─── Max bar for horizontal bar chart ───────────────
    const maxBarAmount = fixedCostsBreakdown.length > 0
        ? fixedCostsBreakdown[0].amount
        : 1;

    // ─── Build ListCard items for activity ──────────────
    const activityItems: ListCardItem[] = recentActivity.slice(0, 8).map(payment => {
        const paymentDate = parseDateFromDB(payment.payment_date);
        const formattedDate = paymentDate ? format(paymentDate, 'd MMM', { locale: es }) : '';
        return {
            id: payment.id,
            fallback: (payment.category_name || "G").charAt(0).toUpperCase(),
            title: payment.general_cost_name || "Gasto general",
            subtitle: `${payment.category_name || "Sin categoría"} · ${formattedDate}`,
            value: `-${money.format(payment.amount)}`,
            valueIntent: "negative" as const,
        };
    });

    // ─── Render ──────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* ═══ Row 1: Insight Cards ═══ */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

                {/* 1️⃣ Gasto Total */}
                <ChartCard
                    title="Gasto Total"
                    description="Últimos 12 meses"
                    icon={<DollarSign className="w-4 h-4" />}
                    footer={<p className="text-xs text-muted-foreground">{totalExpenseInsight}</p>}
                >
                    <div className="flex items-start gap-1.5">
                        <p className="text-4xl font-bold tracking-tight">
                            {formatKpi(kpis.totalExpense.value)}
                        </p>
                        <TrendBadge {...trends.totalExpenseTrend} />
                    </div>
                    {formattedEvolution.length >= 2 && (
                        <div className="mt-3 -mx-2">
                            <LazyAreaChart
                                data={formattedEvolution}
                                xKey="month"
                                yKey="amount"
                                height={300}
                                showGrid={false}
                                showYAxis={false}
                                color="var(--primary)"
                            />
                        </div>
                    )}
                </ChartCard>

                {/* 2️⃣ Promedio Mensual */}
                <ChartCard
                    title="Promedio Mensual"
                    description={kpis.monthlyAverage.description}
                    icon={<TrendingUp className="w-4 h-4" />}
                    footer={<p className="text-xs text-muted-foreground">{avgInsight}</p>}
                >
                    <div className="flex items-start gap-1.5">
                        <p className="text-4xl font-bold tracking-tight">
                            {formatKpi(kpis.monthlyAverage.value)}
                        </p>
                        <TrendBadge {...trends.avgTrend} />
                    </div>
                    {formattedEvolution.length >= 2 && (
                        <div className="mt-3 -mx-2">
                            <LazyBarChart
                                data={formattedEvolution}
                                xKey="month"
                                yKey="amount"
                                height={300}
                                showGrid={false}
                                showYAxis={false}
                                radius={[4, 4, 0, 0]}
                            />
                        </div>
                    )}
                </ChartCard>

                {/* 3️⃣ Costos Fijos Mensuales */}
                <ChartCard
                    title="Costos Fijos"
                    description={`${fixedCostsBreakdown.length} conceptos recurrentes`}
                    icon={<CalendarClock className="w-4 h-4" />}
                    footer={<p className="text-xs text-muted-foreground">{fixedCostsInsight}</p>}
                >
                    <p className="text-4xl font-bold tracking-tight mb-3">
                        {formatKpi(kpis.fixedMonthlyCosts.value)}
                    </p>
                    {/* Mini horizontal bar chart */}
                    {fixedCostsBreakdown.length > 0 && (
                        <div className="space-y-1.5">
                            {fixedCostsBreakdown.slice(0, 4).map(item => (
                                <div key={item.name} className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground truncate w-20 shrink-0">
                                        {item.name}
                                    </span>
                                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all"
                                            style={{ width: `${Math.round((item.amount / maxBarAmount) * 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-mono text-muted-foreground shrink-0">
                                        {money.format(item.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </ChartCard>

                {/* 4️⃣ Distribución por Categoría */}
                <ChartCard
                    title="Por Categoría"
                    description="Distribución total"
                    icon={<PieChartIcon className="w-4 h-4" />}
                    footer={<p className="text-xs text-muted-foreground">{categoryInsight}</p>}
                >
                    {charts.categoryDistribution.length > 0 ? (
                        <BaseDonutChart
                            data={charts.categoryDistribution}
                            nameKey="name"
                            valueKey="value"
                            height={140}
                        />
                    ) : (
                        <div className="h-[140px] flex items-center justify-center text-sm text-muted-foreground">
                            Sin datos
                        </div>
                    )}
                </ChartCard>
            </div>

            {/* ═══ Row 2: Operational Cards ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 5️⃣ Actividad Reciente */}
                <ListCard
                    title="Actividad Reciente"
                    description="Últimos pagos registrados"
                    icon={<Clock className="w-4 h-4" />}
                    items={activityItems}
                    maxItems={6}
                />

                {/* 6️⃣ Obligaciones Recurrentes */}
                <ChartCard
                    title="Obligaciones"
                    description={`${recurringObligations.length} compromisos recurrentes`}
                    icon={<AlertCircle className="w-4 h-4" />}
                    footer={
                        recurringObligations.length > 0 ? (
                            <p className="text-xs text-muted-foreground">
                                {recurringObligations.filter(o => o.status === 'overdue').length} vencidos ·{' '}
                                {recurringObligations.filter(o => o.status === 'pending').length} pendientes ·{' '}
                                {recurringObligations.filter(o => o.status === 'on_track').length} al día
                            </p>
                        ) : undefined
                    }
                >
                    {recurringObligations.length === 0 ? (
                        <div className="h-[140px] flex items-center justify-center text-sm text-muted-foreground">
                            Sin obligaciones recurrentes
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {recurringObligations.slice(0, 6).map(obligation => {
                                const meta = STATUS_META[obligation.status];
                                const StatusIcon = meta.icon;
                                const lastPaid = obligation.lastPaymentDate
                                    ? (() => {
                                        const d = parseDateFromDB(obligation.lastPaymentDate);
                                        return d ? format(d, 'd MMM', { locale: es }) : null;
                                    })()
                                    : null;

                                return (
                                    <div key={obligation.id} className="flex items-center gap-3">
                                        <StatusIcon className={cn("h-4 w-4 shrink-0", meta.className)} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{obligation.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {RECURRENCE_LABELS[obligation.recurrenceInterval] || "Recurrente"}
                                                {obligation.expectedDay ? ` · día ${obligation.expectedDay}` : ""}
                                                {lastPaid ? ` · último: ${lastPaid}` : ""}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-mono font-medium">
                                                {money.format(obligation.expectedAmount)}
                                            </p>
                                            <p className={cn("text-[10px] font-medium", meta.className)}>
                                                {meta.label}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ChartCard>
            </div>


        </div>
    );
}
