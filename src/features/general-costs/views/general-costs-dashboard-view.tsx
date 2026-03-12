"use client";

/**
 * General Costs — Dashboard View (Insight Cards Pattern)
 * 
 * Row 1: 4 Insight Cards (KPI + chart + insight in one card)
 * Row 2: 2 Operational Cards (Activity + Obligations)
 */

import { EnhancedDashboardData, GeneralCostPaymentView } from "@/features/general-costs/types";
import { ContentCard } from "@/components/cards";
import { ActivityListItem, type ActivityListItemData } from "@/components/shared/list-item/items/activity-list-item";
import {
    DollarSign, TrendingUp, TrendingDown, Minus,
    CalendarClock, PieChart as PieChartIcon,
    Clock, AlertCircle, CheckCircle2, Timer,
    Lightbulb, Grid3X3,
} from "lucide-react";
import { LazyAreaChart, LazyBarChart } from "@/components/charts/lazy-charts";
import { ProportionBar } from "@/components/charts/proportion/proportion-bar";
import { BaseHeatMap } from "@/components/charts/heatmap/base-heat-map";
import { capitalizeMonth } from "@/components/charts/chart-config";
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

function TrendBadge({ value, direction, context }: { value: number; direction: 'up' | 'down' | 'neutral'; context?: string }) {
    if (value === 0 || direction === 'neutral') return null;
    const Icon = direction === 'up' ? TrendingUp : TrendingDown;
    return (
        <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1",
            direction === 'down' ? "bg-amount-positive/10 text-amount-positive" : "bg-amount-negative/10 text-amount-negative",
        )}>
            <Icon className="w-3 h-3" />
            {value}%{context && <span className="text-[10px] opacity-80"> {context}</span>}
        </span>
    );
}

// ─── Component ───────────────────────────────────────────

export function GeneralCostsDashboardView({ data, payments }: DashboardTabProps) {
    const { kpis, trends, charts, fixedCostsBreakdown, recurringObligations, heatmapData, insights, recentActivity } = data;
    const money = useMoney();

    // ─── Helper: format kpi amount ──────────────────────
    const formatKpi = (val: string | number) => {
        const num = Number(val);
        return isNaN(num) ? String(val) : money.format(num);
    };
    // ─── Pre-format chart data (fixes tooltip showing raw ISO dates) ──
    const formattedEvolution = charts.monthlyEvolution.map(m => {
        const d = parseDateFromDB(m.month);
        return { month: d ? capitalizeMonth(format(d, 'MMM yy', { locale: es })) : m.month, amount: m.amount };
    });
    // ─── Map insights to cards by relevance ─────────────
    const CARD_INSIGHT_MAP: Record<string, string[]> = {
        totalExpense: ['sustained-trend-up', 'sustained-trend-down', 'anomaly-spike', 'anomaly-dip', 'growth-explained-increase', 'growth-explained-decrease'],
        average: ['year-end-projection-up', 'year-end-projection-down', 'seasonality-rising', 'seasonality-falling', 'payment-efficiency'],
        fixedCosts: ['concentration-single', 'concentration-few'],
        category: ['concentration-single', 'concentration-few', 'growth-explained-increase', 'growth-explained-decrease'],
    };

    const getCardInsight = (cardKey: string) => {
        const candidates = CARD_INSIGHT_MAP[cardKey] || [];
        return insights.find(i => candidates.includes(i.id)) || null;
    };

    const SEVERITY_ICON_COLOR: Record<string, string> = {
        info: 'text-primary',
        warning: 'text-semantic-warning',
        critical: 'text-semantic-negative',
        positive: 'text-semantic-positive',
    };

    const renderInsightFooter = (cardKey: string, fallbackText?: string) => {
        const insight = getCardInsight(cardKey);
        const text = insight?.description || fallbackText || 'Sin datos suficientes para analizar.';
        const color = insight ? (SEVERITY_ICON_COLOR[insight.severity] || 'text-muted-foreground') : 'text-muted-foreground';
        return (
            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                <Lightbulb className={cn("w-3 h-3 shrink-0 mt-0.5", color)} />
                <span>{text}</span>
            </p>
        );
    };

    // ─── Max bar for horizontal bar chart ───────────────
    const maxBarAmount = fixedCostsBreakdown.length > 0
        ? fixedCostsBreakdown[0].amount
        : 1;

    // ─── Build activity items ─────────────────────────────
    const activityItems: ActivityListItemData[] = recentActivity.slice(0, 8).map(payment => {
        const paymentDate = parseDateFromDB(payment.payment_date);
        const formattedDate = paymentDate ? format(paymentDate, 'd MMM', { locale: es }) : '';
        return {
            id: payment.id,
            title: payment.general_cost_name || "Gasto general",
            subtitle: `${payment.category_name || "Sin categoría"} · ${formattedDate}`,
            value: money.format(payment.amount),
            valueIntent: "neutral" as const,
            creatorName: payment.creator_full_name,
            creatorAvatarUrl: payment.creator_avatar_url,
        };
    });

    // ─── Render ──────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* ═══ Row 1: Insight Cards ═══ */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

                {/* 1️⃣ Gasto Total */}
                <ContentCard
                    title="Gasto Total"
                    description="Últimos 12 meses"
                    icon={<DollarSign className="w-4 h-4" />}
                    footer={renderInsightFooter('totalExpense', 
                        trends.totalExpenseTrend.direction === 'down' 
                            ? `El gasto bajó ${trends.totalExpenseTrend.value}% respecto al mes anterior.`
                            : trends.totalExpenseTrend.direction === 'up'
                                ? `El gasto subió ${trends.totalExpenseTrend.value}% respecto al mes anterior.`
                                : 'Gasto estable respecto al mes anterior.'
                    )}
                    value={formatKpi(kpis.totalExpense.value)}
                    badge={<TrendBadge {...trends.totalExpenseTrend} context="vs mes anterior" />}
                >
                    {formattedEvolution.length >= 2 && (
                        <div className="-mx-2">
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
                </ContentCard>

                {/* 2️⃣ Promedio Mensual */}
                <ContentCard
                    title="Promedio Mensual"
                    description={kpis.monthlyAverage.description}
                    icon={<TrendingUp className="w-4 h-4" />}
                    footer={renderInsightFooter('average',
                        trends.avgTrend.direction === 'down'
                            ? `El promedio bajó ${trends.avgTrend.value}% (últimos 3 meses vs anteriores).`
                            : trends.avgTrend.direction === 'up'
                                ? `El promedio subió ${trends.avgTrend.value}% (últimos 3 meses vs anteriores).`
                                : 'Promedio estable en los últimos meses.'
                    )}
                    value={formatKpi(kpis.monthlyAverage.value)}
                    badge={<TrendBadge {...trends.avgTrend} context="vs promedio anterior" />}
                >
                    {formattedEvolution.length >= 2 && (
                        <div className="-mx-2">
                            <LazyBarChart
                                data={formattedEvolution}
                                xKey="month"
                                yKey="amount"
                                height={300}
                                showGrid={false}
                                showYAxis={false}
                                radius={[4, 4, 0, 0]}
                                gradient
                                referenceValue={Number(kpis.monthlyAverage.value) || undefined}
                                referenceLabel={`Prom ${formatKpi(kpis.monthlyAverage.value)}`}
                            />
                        </div>
                    )}
                </ContentCard>

                {/* 3️⃣ Costos Fijos Mensuales */}
                <ContentCard
                    title="Costos Fijos"
                    description={`${fixedCostsBreakdown.length} conceptos recurrentes`}
                    icon={<CalendarClock className="w-4 h-4" />}
                    footer={renderInsightFooter('fixedCosts',
                        fixedCostsBreakdown.length > 0
                            ? `${fixedCostsBreakdown[0].name} representa el mayor costo fijo mensual.`
                            : 'No hay costos fijos configurados.'
                    )}
                    value={formatKpi(kpis.fixedMonthlyCosts.value)}
                >
                    {/* Horizontal bar chart — always 5 slots, text inside */}
                    {(() => {
                        const totalFixed = fixedCostsBreakdown.reduce((s, c) => s + c.amount, 0);
                        const items = fixedCostsBreakdown.slice(0, 5);
                        const slots = Array.from({ length: 5 }, (_, i) => items[i] || null);
                        return (
                            <div className="flex flex-col gap-1 flex-1">
                                {slots.map((item, i) => {
                                    if (!item) {
                                        return <div key={`empty-${i}`} className="bg-muted/20 rounded-md flex-1 min-h-[28px]" />;
                                    }
                                    const pct = Math.max(Math.round((item.amount / maxBarAmount) * 100), 20);
                                    const share = totalFixed > 0 ? Math.round((item.amount / totalFixed) * 100) : 0;
                                    return (
                                        <div key={item.name} className="relative bg-muted/30 rounded-lg overflow-hidden flex-1 min-h-[28px]">
                                            <div
                                                className="absolute inset-y-0 left-0 bg-primary/80 rounded-lg transition-all"
                                                style={{ width: `${pct}%` }}
                                            />
                                            <div className="relative h-full flex items-center justify-between px-1.5 z-10">
                                                <div className="bg-background/90 border border-border/50 rounded-md shadow-lg px-2 py-0.5 flex flex-col justify-center min-w-0 mr-1">
                                                    <span className="text-[11px] font-medium text-foreground truncate leading-tight">
                                                        {item.name}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-muted-foreground leading-tight">
                                                        {money.format(item.amount)}
                                                    </span>
                                                </div>
                                                <div className="bg-background/90 border border-border/50 rounded-md shadow-lg px-2 py-0.5 shrink-0">
                                                    <span className="text-xs font-semibold text-foreground">
                                                        {share}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()}
                </ContentCard>

                {/* 4️⃣ Distribución por Categoría */}
                <ContentCard
                    title="Por Categoría"
                    description="Distribución total"
                    icon={<PieChartIcon className="w-4 h-4" />}
                    footer={renderInsightFooter('category',
                        charts.categoryDistribution.length > 0
                            ? `${charts.categoryDistribution[0].name} concentra el ${Math.round((charts.categoryDistribution[0].value / charts.categoryDistribution.reduce((s, c) => s + c.value, 0)) * 100)}% del gasto.`
                            : 'Sin datos de categorías.'
                    )}
                    value={`${charts.categoryDistribution.length} categorías`}
                >
                    {charts.categoryDistribution.length > 0 ? (
                        <ProportionBar
                            data={charts.categoryDistribution}
                            nameKey="name"
                            valueKey="value"
                        />
                    ) : (
                        <div className="h-[140px] flex items-center justify-center text-sm text-muted-foreground">
                            Sin datos
                        </div>
                    )}
                </ContentCard>
            </div>

            {/* ═══ Row 2: Operational Cards ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 5️⃣ Actividad Reciente */}
                <ContentCard
                    title="Actividad Reciente"
                    description="Últimos pagos registrados"
                    icon={<Clock className="w-4 h-4" />}
                >
                    {activityItems.length === 0 ? (
                        <div className="h-[140px] flex items-center justify-center text-sm text-muted-foreground">
                            Sin actividad reciente
                        </div>
                    ) : (
                        <div className="space-y-0.5">
                            {activityItems.slice(0, 5).map(item => (
                                <ActivityListItem key={item.id} item={item} />
                            ))}
                        </div>
                    )}
                </ContentCard>

                {/* 6️⃣ Obligaciones Recurrentes */}
                <ContentCard
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
                        <div className="space-y-0.5">
                            {recurringObligations.slice(0, 5).map(obligation => {
                                const meta = STATUS_META[obligation.status];
                                const StatusIcon = meta.icon;
                                const lastPaid = obligation.lastPaymentDate
                                    ? (() => {
                                        const d = parseDateFromDB(obligation.lastPaymentDate);
                                        return d ? format(d, 'd MMM', { locale: es }) : null;
                                    })()
                                    : null;

                                return (
                                    <div key={obligation.id} className="flex items-center gap-3 py-1.5 px-2 rounded-md">
                                        <div className={cn("h-8 w-8 shrink-0 rounded-full flex items-center justify-center bg-muted/50 border border-border")}>
                                            <StatusIcon className={cn("h-4 w-4", meta.className)} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{obligation.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">
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
                </ContentCard>
            </div>

            {/* ═══ Row 3: Recurring Costs Heatmap (full width) ═══ */}
            {heatmapData.rows.length > 0 && (
                <ContentCard
                    title="Costos Recurrentes por Mes"
                    description="Seguimiento de pagos mensuales"
                    icon={<Grid3X3 className="w-4 h-4" />}
                    footer={renderInsightFooter('heatmap',
                        (() => {
                            const totalCells = heatmapData.rows.length * heatmapData.columns.length;
                            let filledCells = 0;
                            for (const rowId of Object.keys(heatmapData.data)) {
                                filledCells += Object.keys(heatmapData.data[rowId]).length;
                            }
                            const coverage = totalCells > 0 ? Math.round((filledCells / totalCells) * 100) : 0;
                            return `Cobertura de pago: ${coverage}% de los meses con al menos un pago registrado.`;
                        })()
                    )}
                >
                    <BaseHeatMap
                        rows={heatmapData.rows}
                        columns={heatmapData.columns}
                        data={heatmapData.data}
                    />
                </ContentCard>
            )}

        </div>
    );
}
