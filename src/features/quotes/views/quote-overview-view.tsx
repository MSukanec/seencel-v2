"use client";

import { useMemo } from "react";
import { QuoteView, ContractSummary, QuoteItemView } from "../types";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { LazyDonutChart } from "@/components/charts/lazy-charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    FileText,
    Building2,
    FileSignature,
    Calendar,
    Clock,
    CheckCircle2,
    AlertCircle,
    DollarSign,
    Hash,
    Calculator,
    PieChart
} from "lucide-react";
import { useMoney } from "@/hooks/use-money";

interface QuoteOverviewViewProps {
    quote: QuoteView;
    contractSummary?: ContractSummary | null;
    items?: QuoteItemView[];
}

// Mapa de estados a español
const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
    draft: { label: "Borrador", variant: "secondary", icon: <FileText className="h-3.5 w-3.5" /> },
    sent: { label: "Enviado", variant: "outline", icon: <Clock className="h-3.5 w-3.5" /> },
    approved: { label: "Aprobado", variant: "default", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    rejected: { label: "Rechazado", variant: "destructive", icon: <AlertCircle className="h-3.5 w-3.5" /> },
    expired: { label: "Vencido", variant: "destructive", icon: <AlertCircle className="h-3.5 w-3.5" /> },
};

// Colores estándar para composición (HEX directos)
const COMPOSITION_COLORS = {
    original: "#22c55e",      // Emerald - Contrato Original
    approved: "#3b82f6",      // Blue - Cambios Aprobados
    pending: "#f59e0b",       // Amber - Cambios Pendientes
};

// Paleta de colores para rubros (determinísticos)
const CATEGORY_COLORS = [
    "#3b82f6", // Blue
    "#22c55e", // Emerald
    "#8B5CF6", // Violet
    "#f59e0b", // Amber
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#f97316", // Orange
    "#84cc16", // Lime
    "#a855f7", // Purple
    "#14b8a6", // Teal
];

export function QuoteOverviewView({ quote, contractSummary, items = [] }: QuoteOverviewViewProps) {
    const isContract = quote.quote_type === 'contract';
    const money = useMoney();

    const statusInfo = STATUS_MAP[quote.status] || { label: quote.status, variant: "secondary" as const, icon: null };

    // Formatear fecha
    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // ============================================
    // COMPOSICIÓN DEL CONTRATO (Donut)
    // ============================================
    const compositionData = useMemo(() => {
        if (!contractSummary) return [];

        const data = [
            {
                name: "Contrato Original",
                value: contractSummary.original_contract_value || 0,
                fill: COMPOSITION_COLORS.original
            }
        ];

        if (contractSummary.approved_changes_value > 0) {
            data.push({
                name: "Cambios Aprobados",
                value: contractSummary.approved_changes_value,
                fill: COMPOSITION_COLORS.approved
            });
        }

        if (contractSummary.pending_changes_value > 0) {
            data.push({
                name: "Cambios Pendientes",
                value: contractSummary.pending_changes_value,
                fill: COMPOSITION_COLORS.pending
            });
        }

        return data;
    }, [contractSummary]);

    // ============================================
    // DISTRIBUCIÓN POR RUBRO (Donut)
    // ============================================
    const divisionData = useMemo(() => {
        if (!items || items.length === 0) return [];

        const byDivision: Record<string, number> = {};

        items.forEach(item => {
            const divisionName = item.division_name || "Sin Rubro";
            byDivision[divisionName] = (byDivision[divisionName] || 0) + (item.subtotal_with_markup || 0);
        });

        return Object.entries(byDivision)
            .map(([name, value], index) => ({
                name,
                value,
                fill: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [items]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Banner para Adicionales (Change Orders) */}
            {quote.quote_type === 'change_order' && quote.parent_quote_id && (
                <div className="bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 dark:bg-blue-900 p-2.5 rounded-full">
                            <FileSignature className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-blue-900 dark:text-blue-100">Adicional al Contrato</h3>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                Este documento es un anexo al contrato principal.
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-blue-200 dark:border-blue-700 hover:bg-blue-100/50 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300" asChild>
                        <a href={`/organization/quotes/${quote.parent_quote_id}`}>
                            Ver Contrato Principal
                        </a>
                    </Button>
                </div>
            )}

            {/* Fila principal: Alcance + Cliente + Estado */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Card: Descripción/Alcance */}
                <DashboardCard
                    title={isContract ? 'Alcance del Contrato' : 'Descripción'}
                    icon={<FileText className="h-4 w-4" />}
                    className="lg:col-span-1"
                >
                    {quote.description ? (
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                            {quote.description}
                        </p>
                    ) : (
                        <p className="text-sm text-muted-foreground/50 italic">Sin descripción</p>
                    )}
                </DashboardCard>

                {/* Card: Cliente */}
                <DashboardCard
                    title="Cliente"
                    icon={<Building2 className="h-4 w-4" />}
                >
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm shrink-0">
                            {(quote.client_name || 'SC').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold truncate">{quote.client_name || 'Sin Cliente'}</p>
                            <p className="text-xs text-muted-foreground">Cliente del {isContract ? 'Contrato' : 'Presupuesto'}</p>
                        </div>
                    </div>
                </DashboardCard>

                {/* Card: Estado */}
                <DashboardCard
                    title="Estado"
                    icon={<Calendar className="h-4 w-4" />}
                >
                    <div className="space-y-2">
                        <Badge variant={statusInfo.variant} className="gap-1">
                            {statusInfo.icon}
                            {statusInfo.label}
                        </Badge>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                            <div className="flex justify-between">
                                <span>Válido hasta:</span>
                                <span className="font-medium text-foreground">{formatDate(quote.valid_until)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Creado:</span>
                                <span className="font-medium text-foreground">{formatDate(quote.created_at)}</span>
                            </div>
                        </div>
                    </div>
                </DashboardCard>
            </div>

            {/* KPI Row - Solo para contratos */}
            {isContract && contractSummary && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <DashboardKpiCard
                        title="Contrato Original"
                        amount={contractSummary.original_contract_value || 0}
                        icon={<DollarSign className="h-5 w-5" />}
                        size="default"
                    />
                    <DashboardKpiCard
                        title="Impacto Total"
                        amount={contractSummary.approved_changes_value || 0}
                        icon={<Hash className="h-5 w-5" />}
                        trend={contractSummary.original_contract_value > 0 ? {
                            value: `${((contractSummary.approved_changes_value / contractSummary.original_contract_value) * 100).toFixed(1)}%`,
                            label: "del original",
                            direction: contractSummary.approved_changes_value >= 0 ? "up" : "down"
                        } : undefined}
                        size="default"
                    />
                    <DashboardKpiCard
                        title="Valor Actualizado"
                        amount={contractSummary.revised_contract_value || 0}
                        icon={<Calculator className="h-5 w-5" />}
                        description="Original + Aprobados"
                        size="default"
                    />
                    <DashboardKpiCard
                        title="Órdenes de Cambio"
                        value={contractSummary.change_order_count || 0}
                        icon={<FileText className="h-5 w-5" />}
                        description={`${contractSummary.approved_change_order_count || 0} aprobada${(contractSummary.approved_change_order_count || 0) !== 1 ? 's' : ''}`}
                        size="default"
                    />
                </div>
            )}

            {/* KPIs para presupuestos (no contratos) */}
            {!isContract && (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <DashboardKpiCard
                        title="Total Presupuestado"
                        amount={quote.total_with_tax || 0}
                        iconClassName="bg-primary/10 text-primary"
                        description={`${quote.tax_label || 'IVA'} incluido (${quote.tax_pct}%)`}
                    />
                    <DashboardKpiCard
                        title="Subtotal"
                        amount={quote.subtotal_with_markup || 0}
                        description="Antes de impuestos"
                    />
                    {quote.discount_pct > 0 && (
                        <DashboardKpiCard
                            title="Descuento"
                            value={`${quote.discount_pct}%`}
                            description={`-${money.format((quote.subtotal_with_markup || 0) - (quote.total_after_discount || 0))}`}
                            iconClassName="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        />
                    )}
                </div>
            )}

            {/* Gráficos - Solo si hay datos */}
            {(compositionData.length > 0 || divisionData.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 [&>*]:min-w-0">

                    {/* Composición del Contrato */}
                    {isContract && compositionData.length > 0 && (
                        <DashboardCard
                            title="Composición del Contrato"
                            description={`Total: ${money.format(contractSummary?.revised_contract_value || 0)}`}
                            icon={<PieChart className="h-4 w-4" />}
                            className="h-[340px]"
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

                    {/* Distribución por Rubro */}
                    {divisionData.length > 0 && (
                        <DashboardCard
                            title="Por Rubro"
                            description={`${divisionData.length} rubros`}
                            icon={<PieChart className="h-4 w-4" />}
                            className="h-[340px]"
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
            )}
        </div>
    );
}
