"use client";

import { useMemo } from "react";
import { QuoteView, ContractSummary, QuoteItemView } from "../types";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { LazyDonutChart } from "@/components/charts/lazy-charts";
import { PieChart, BarChart3, TrendingUp } from "lucide-react";
import { useMoney } from "@/hooks/use-money";
import {
    SettingsSection,
    SettingsSectionContainer,
} from "@/components/shared/settings-section";

// ── Paletas de charts ──────────────────────────────────────────────────────────
const COMPOSITION_COLORS = {
    original: "#758a57",   // chart-1 Oliva
    approved: "#7c72ab",   // chart-2 Lavanda
    pending: "#c9a03e",    // chart-4 Oro
};
const CATEGORY_COLORS = [
    "#758a57", "#7c72ab", "#b04912", "#c9a03e",
    "#06b6d4", "#6366F1", "#a78bfa", "#f97316",
    "#14b8a6", "#84cc16",
];

interface QuoteAnalyticsViewProps {
    quote: QuoteView;
    contractSummary?: ContractSummary | null;
    items?: QuoteItemView[];
}

export function QuoteAnalyticsView({ quote, contractSummary, items = [] }: QuoteAnalyticsViewProps) {
    const isContract = quote.quote_type === "contract";
    const money = useMoney();

    // ── Donut: Composición del contrato ──────────────────────────────────────
    const compositionData = useMemo(() => {
        if (!contractSummary) return [];
        const data = [{
            name: "Contrato Original",
            value: contractSummary.original_contract_value || 0,
            fill: COMPOSITION_COLORS.original,
        }];
        if (contractSummary.approved_changes_value > 0)
            data.push({ name: "Cambios Aprobados", value: contractSummary.approved_changes_value, fill: COMPOSITION_COLORS.approved });
        if (contractSummary.pending_changes_value > 0)
            data.push({ name: "Cambios Pendientes", value: contractSummary.pending_changes_value, fill: COMPOSITION_COLORS.pending });
        return data;
    }, [contractSummary]);

    // ── Donut: Distribución por rubro ────────────────────────────────────────
    const divisionData = useMemo(() => {
        if (!items || items.length === 0) return [];
        const byDivision: Record<string, number> = {};
        items.forEach((item) => {
            const div = item.division_name || "Sin Rubro";
            byDivision[div] = (byDivision[div] || 0) + (item.subtotal_with_markup || 0);
        });
        return Object.entries(byDivision)
            .map(([name, value], index) => ({ name, value, fill: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [items]);

    // ── Top 5 ítems por valor ────────────────────────────────────────────────
    const topItems = useMemo(() => {
        if (!items || items.length === 0) return [];
        return [...items]
            .sort((a, b) => (b.subtotal_with_markup || 0) - (a.subtotal_with_markup || 0))
            .slice(0, 5);
    }, [items]);

    const hasCharts = compositionData.length > 0 || divisionData.length > 0;
    const hasItems = items.length > 0;

    if (!hasCharts && !hasItems) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                Aún no hay datos suficientes para mostrar analíticas.
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SettingsSectionContainer>

                {/* ── Gráficos de composición ─────────────────────────────── */}
                {hasCharts && (
                    <SettingsSection
                        icon={PieChart}
                        title="Distribución"
                        description={
                            <>
                                {isContract && compositionData.length > 0 && (
                                    <span>Composición del contrato incluyendo adicionales.</span>
                                )}
                                {divisionData.length > 0 && (
                                    <span>Distribución de ítems por rubro.</span>
                                )}
                            </>
                        }
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {isContract && compositionData.length > 0 && (
                                <DashboardCard
                                    title="Composición del Contrato"
                                    description={`Total: ${money.format(contractSummary?.revised_contract_value || 0)}`}
                                    icon={<PieChart className="h-4 w-4" />}
                                    className="h-[320px]"
                                >
                                    <LazyDonutChart
                                        data={compositionData}
                                        nameKey="name"
                                        valueKey="value"
                                        height={200}
                                        showPercentage
                                        showLegend
                                    />
                                </DashboardCard>
                            )}
                            {divisionData.length > 0 && (
                                <DashboardCard
                                    title="Por Rubro"
                                    description={`${divisionData.length} rubro${divisionData.length !== 1 ? "s" : ""}`}
                                    icon={<PieChart className="h-4 w-4" />}
                                    className="h-[320px]"
                                >
                                    <LazyDonutChart
                                        data={divisionData}
                                        nameKey="name"
                                        valueKey="value"
                                        height={200}
                                        showPercentage
                                        showLegend
                                    />
                                </DashboardCard>
                            )}
                        </div>
                    </SettingsSection>
                )}

                {/* ── Top ítems ────────────────────────────────────────────── */}
                {topItems.length > 0 && (
                    <SettingsSection
                        icon={BarChart3}
                        title="Top 5 Ítems"
                        description="Ítems con mayor valor en el documento."
                    >
                        <div className="space-y-3">
                            {topItems.map((item, index) => {
                                const total = items.reduce((sum, i) => sum + (i.subtotal_with_markup || 0), 0);
                                const pct = total > 0 ? ((item.subtotal_with_markup || 0) / total) * 100 : 0;
                                const name = item.task_name || item.custom_name || item.description || `Ítem ${index + 1}`;

                                return (
                                    <div key={item.id} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-foreground font-medium truncate max-w-[60%]">{name}</span>
                                            <span className="text-muted-foreground tabular-nums text-xs">{money.format(item.subtotal_with_markup || 0)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-primary/60 transition-all duration-500"
                                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">{pct.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </SettingsSection>
                )}

                {/* ── Resumen numérico ─────────────────────────────────────── */}
                {hasItems && (
                    <SettingsSection
                        icon={TrendingUp}
                        title="Estadísticas"
                        description="Métricas generales del documento."
                    >
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Total de ítems</p>
                                <p className="text-2xl font-bold tabular-nums">{items.length}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Rubros distintos</p>
                                <p className="text-2xl font-bold tabular-nums">{divisionData.length}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Valor promedio por ítem</p>
                                <p className="text-2xl font-bold tabular-nums">
                                    {items.length > 0
                                        ? money.format(items.reduce((s, i) => s + (i.subtotal_with_markup || 0), 0) / items.length)
                                        : "—"}
                                </p>
                            </div>
                        </div>
                    </SettingsSection>
                )}

            </SettingsSectionContainer>
        </div>
    );
}
