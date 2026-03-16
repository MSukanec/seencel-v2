"use client";

/**
 * General Costs — Dashboard View (Insight Cards Pattern)
 * 
 * Row 1: 4 Insight Cards (KPI + chart + insight in one card)
 * Row 2: 2 Operational Cards (Activity + Obligations)
 */

import React from "react";
import { EnhancedDashboardData, GeneralCostPaymentView } from "@/features/general-costs/types";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { ContentCard } from "@/components/cards";
import { ActivityListItem, type ActivityListItemData } from "@/components/shared/list-item/items/activity-list-item";
import {
    DollarSign, TrendingUp, TrendingDown, Minus,
    CalendarClock, PieChart as PieChartIcon,
    Clock, AlertCircle, CheckCircle2, Timer,
    Lightbulb, Grid3X3, CalendarDays, ChevronDown, Check, LayoutGrid, Tag, Receipt,
} from "lucide-react";
import { LazyAreaChart } from "@/components/charts/lazy-charts";
import { ProportionBar } from "@/components/charts/proportion/proportion-bar";
import { WaffleBarChart } from "@/components/charts/waffle/waffle-bar-chart";
import { WaffleHorizontalBar } from "@/components/charts/waffle/waffle-horizontal-bar";
import { BaseHeatMap } from "@/components/charts/heatmap/base-heat-map";
import { capitalizeMonth } from "@/components/charts/chart-config";
import { useMoney } from "@/hooks/use-money";
import { parseDateFromDB } from "@/lib/timezone-data";
import { format, subMonths, startOfMonth, startOfYear, endOfYear } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PageHeaderActionPortal } from "@/components/layout";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

// ─── Period Filter ────────────────────────────────────────

type PeriodKey = 'all' | 'this-month' | 'last-3' | 'last-6' | 'last-12' | 'this-year' | 'last-year';

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
    { key: 'all', label: 'Histórico' },
    { key: 'this-month', label: 'Este Mes' },
    { key: 'last-3', label: 'Últimos 3 Meses' },
    { key: 'last-6', label: 'Últimos 6 Meses' },
    { key: 'last-12', label: 'Últimos 12 Meses' },
    { key: 'this-year', label: 'Este Año' },
    { key: 'last-year', label: 'Año Anterior' },
];

function getPeriodRange(key: PeriodKey): { from: Date; to: Date } | null {
    if (key === 'all') return null;
    const now = new Date();
    switch (key) {
        case 'this-month':
            return { from: startOfMonth(now), to: now };
        case 'last-3':
            return { from: startOfMonth(subMonths(now, 2)), to: now };
        case 'last-6':
            return { from: startOfMonth(subMonths(now, 5)), to: now };
        case 'last-12':
            return { from: startOfMonth(subMonths(now, 11)), to: now };
        case 'this-year':
            return { from: startOfYear(now), to: now };
        case 'last-year': {
            const lastYear = new Date(now.getFullYear() - 1, 0, 1);
            return { from: startOfYear(lastYear), to: endOfYear(lastYear) };
        }
        default:
            return null;
    }
}

function filterPaymentsByPeriod(payments: GeneralCostPaymentView[], period: PeriodKey): GeneralCostPaymentView[] {
    const range = getPeriodRange(period);
    if (!range) return payments;
    return payments.filter(p => {
        const d = parseDateFromDB(p.payment_date);
        if (!d) return false;
        return d >= range.from && d <= range.to;
    });
}

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
    const [activePeriod, setActivePeriod] = React.useState<PeriodKey>('all');
    const [periodOpen, setPeriodOpen] = React.useState(false);

    // ─── Filter payments by period ──────────────────────
    const filteredPayments = React.useMemo(
        () => filterPaymentsByPeriod(payments, activePeriod),
        [payments, activePeriod]
    );

    // ─── Recalculate KPIs from filtered payments ────────
    const periodLabel = PERIOD_OPTIONS.find(p => p.key === activePeriod)?.label || 'Histórico';
    const isFiltered = activePeriod !== 'all';

    const filteredTotal = React.useMemo(
        () => filteredPayments.reduce((sum, p) => sum + (p.amount * (p.exchange_rate || 1)), 0),
        [filteredPayments]
    );

    // Monthly evolution from filtered payments
    const filteredEvolution = React.useMemo(() => {
        const byMonth = new Map<string, number>();
        filteredPayments.forEach(p => {
            const d = parseDateFromDB(p.payment_date);
            if (!d) return;
            const key = format(d, 'yyyy-MM');
            byMonth.set(key, (byMonth.get(key) || 0) + (p.amount * (p.exchange_rate || 1)));
        });
        return Array.from(byMonth.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, amount]) => {
                const d = parseDateFromDB(month + '-01');
                return {
                    month: d ? capitalizeMonth(format(d, 'MMM yy', { locale: es })) : month,
                    amount,
                };
            });
    }, [filteredPayments]);

    const filteredAvg = React.useMemo(() => {
        if (filteredEvolution.length === 0) return 0;
        return filteredTotal / filteredEvolution.length;
    }, [filteredTotal, filteredEvolution]);

    // Category distribution from filtered payments
    const filteredCategories = React.useMemo(() => {
        const byCategory = new Map<string, number>();
        filteredPayments.forEach(p => {
            const name = p.category_name || 'Sin categoría';
            byCategory.set(name, (byCategory.get(name) || 0) + (p.amount * (p.exchange_rate || 1)));
        });
        return Array.from(byCategory.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredPayments]);

    // Use filtered or original data depending on period
    const displayTotal = isFiltered ? filteredTotal : Number(kpis.totalExpense.value);
    const displayAvg = isFiltered ? filteredAvg : Number(kpis.monthlyAverage.value);
    const displayEvolution = isFiltered ? filteredEvolution : (() => {
        return charts.monthlyEvolution.map(m => {
            const d = parseDateFromDB(m.month);
            return { month: d ? capitalizeMonth(format(d, 'MMM yy', { locale: es })) : m.month, amount: m.amount };
        });
    })();
    const displayCategories = isFiltered ? filteredCategories : charts.categoryDistribution;
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
            <p className="text-xs text-muted-foreground flex items-start gap-1.5 min-h-[40px]">
                <Lightbulb className={cn("w-3 h-3 shrink-0 mt-0.5", color)} />
                <span>{text}</span>
            </p>
        );
    };

    // ─── Filtered activity items ─────────────────────────
    const filteredActivity = isFiltered ? filteredPayments : recentActivity;

    // ─── Build activity items ─────────────────────────────
    const activityItems: ActivityListItemData[] = filteredActivity.slice(0, 8).map(payment => {
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

    // ─── Helper: format kpi amount ──────────────────────
    const formatKpi = (val: string | number) => {
        const num = Number(val);
        return isNaN(num) ? String(val) : money.format(num);
    };

    // ─── Empty state ─────────────────────────────────────
    if (payments.length === 0) {
        return (
            <ViewEmptyState
                mode="empty"
                icon={LayoutGrid}
                viewName="Gastos Generales"
                featureDescription="Acá vas a ver un resumen completo de tus gastos generales. Seguí estos pasos para empezar:"
                docsPath="/docs/gastos-generales"
                onboardingSteps={[
                    {
                        id: "create-concepts",
                        icon: Tag,
                        label: "Crear Conceptos",
                        description: "Definí los tipos de gasto de tu organización (luz, alquiler, etc.)",
                        href: "/organization/general-costs/concepts",
                    },
                    {
                        id: "register-payments",
                        icon: Receipt,
                        label: "Registrar Pagos",
                        description: "Cargá pagos asociados a cada concepto con fecha y monto",
                        href: "/organization/general-costs/payments",
                    },
                    {
                        id: "view-dashboard",
                        icon: LayoutGrid,
                        label: "Ver Dashboard",
                        description: "Analizá tendencias, distribución y KPIs de tus gastos",
                    },
                ]}
            />
        );
    }

    // ─── Render ──────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Period Selector in Header */}
            <PageHeaderActionPortal>
                <Popover open={periodOpen} onOpenChange={setPeriodOpen}>
                    <PopoverTrigger asChild>
                        <button
                            className={cn(
                                "flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                                "border border-border/50 hover:bg-muted/50",
                                isFiltered ? "text-primary border-primary/30 bg-primary/5" : "text-foreground"
                            )}
                        >
                            <CalendarDays className="h-3.5 w-3.5" />
                            <span>{periodLabel}</span>
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent side="bottom" align="end" sideOffset={8} className="w-[200px] p-1.5">
                        {PERIOD_OPTIONS.map(opt => (
                            <button
                                key={opt.key}
                                onClick={() => {
                                    setActivePeriod(opt.key);
                                    setPeriodOpen(false);
                                }}
                                className={cn(
                                    "flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-secondary transition-colors",
                                    activePeriod === opt.key && "bg-secondary text-foreground font-medium"
                                )}
                            >
                                <span className="flex-1 text-left">{opt.label}</span>
                                {activePeriod === opt.key && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                            </button>
                        ))}
                    </PopoverContent>
                </Popover>
            </PageHeaderActionPortal>
            {/* ═══ Row 1: Insight Cards ═══ */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 xl:grid-rows-[480px]">

                {/* 1️⃣ Gasto Total */}
                <ContentCard
                    title="Gasto Total"
                    description={periodLabel}
                    icon={<DollarSign className="w-4 h-4" />}
                    footer={!isFiltered ? renderInsightFooter('totalExpense', 
                        trends.totalExpenseTrend.direction === 'down' 
                            ? `El gasto bajó ${trends.totalExpenseTrend.value}% respecto al mes anterior.`
                            : trends.totalExpenseTrend.direction === 'up'
                                ? `El gasto subió ${trends.totalExpenseTrend.value}% respecto al mes anterior.`
                                : 'Gasto estable respecto al mes anterior.'
                    ) : (
                        <p className="text-xs text-muted-foreground">
                            {filteredPayments.length} pagos en el período
                        </p>
                    )}
                    value={formatKpi(displayTotal)}
                    badge={!isFiltered ? <TrendBadge {...trends.totalExpenseTrend} context="vs mes anterior" /> : undefined}
                >
                    {displayEvolution.length >= 2 && (
                        <div className="-mx-2 flex-1 min-h-0 overflow-hidden">
                            <LazyAreaChart
                                data={displayEvolution}
                                xKey="month"
                                yKey="amount"
                                showGrid={false}
                                showYAxis={false}
                                color="var(--primary)"
                                chartClassName="h-full"
                            />
                        </div>
                    )}
                </ContentCard>

                {/* 2️⃣ Promedio Mensual */}
                <ContentCard
                    title="Promedio Mensual"
                    description={kpis.monthlyAverage.description}
                    icon={<TrendingUp className="w-4 h-4" />}
                    footer={!isFiltered ? renderInsightFooter('average',
                        trends.avgTrend.direction === 'down'
                            ? `El promedio bajó ${trends.avgTrend.value}% (últimos 3 meses vs anteriores).`
                            : trends.avgTrend.direction === 'up'
                                ? `El promedio subió ${trends.avgTrend.value}% (últimos 3 meses vs anteriores).`
                                : 'Promedio estable en los últimos meses.'
                    ) : (
                        <p className="text-xs text-muted-foreground">
                            Promedio de {filteredEvolution.length} meses
                        </p>
                    )}
                    value={formatKpi(displayAvg)}
                    badge={!isFiltered ? <TrendBadge {...trends.avgTrend} context="vs promedio anterior" /> : undefined}
                >
                    {displayEvolution.length >= 2 && (
                        <WaffleBarChart
                            data={displayEvolution.map(d => ({ label: d.month, value: d.amount }))}
                            referenceValue={displayAvg || undefined}
                            referenceLabel={`Prom ${formatKpi(displayAvg)}`}
                        />
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
                    <WaffleHorizontalBar
                        data={fixedCostsBreakdown}
                        slots={5}
                    />
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
                    value={`${displayCategories.length} categorías`}
                >
                    {displayCategories.length > 0 ? (
                        <ProportionBar
                            data={displayCategories}
                            nameKey="name"
                            valueKey="value"
                        />
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
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
                    className="overflow-visible"
                    contentClassName="overflow-visible"
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
