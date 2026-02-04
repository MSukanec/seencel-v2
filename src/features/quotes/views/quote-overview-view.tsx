"use client";

import { QuoteView, ContractSummary } from "../types";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    FileText,
    Building2,
    FileSignature,
    Calendar,
    TrendingUp,
    Clock,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import { useMoney } from "@/hooks/use-money";

interface QuoteOverviewViewProps {
    quote: QuoteView;
    contractSummary?: ContractSummary | null;
}

// Mapa de estados a español
const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
    draft: { label: "Borrador", variant: "secondary", icon: <FileText className="h-3.5 w-3.5" /> },
    sent: { label: "Enviado", variant: "outline", icon: <Clock className="h-3.5 w-3.5" /> },
    approved: { label: "Aprobado", variant: "default", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    rejected: { label: "Rechazado", variant: "destructive", icon: <AlertCircle className="h-3.5 w-3.5" /> },
    expired: { label: "Vencido", variant: "destructive", icon: <AlertCircle className="h-3.5 w-3.5" /> },
};

export function QuoteOverviewView({ quote, contractSummary }: QuoteOverviewViewProps) {
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

            {/* Grid Principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Columna Izquierda - Info General */}
                <div className="lg:col-span-2 space-y-4">

                    {/* Card: Descripción */}
                    <DashboardCard
                        title={isContract ? 'Alcance del Contrato' : 'Descripción del Presupuesto'}
                        icon={<FileText className="h-4 w-4" />}
                    >
                        {quote.description ? (
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {quote.description}
                            </p>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/50 border-2 border-dashed rounded-lg">
                                <FileText className="h-8 w-8 mb-2" />
                                <p className="text-sm">Sin descripción definida</p>
                            </div>
                        )}
                    </DashboardCard>

                    {/* Grid: Cliente y Estado */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Card: Cliente */}
                        <DashboardCard
                            title="Cliente"
                            icon={<Building2 className="h-4 w-4" />}
                            compact
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-lg">
                                    {(quote.client_name || 'SC').substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-semibold">{quote.client_name || 'Sin Cliente Asignado'}</p>
                                    <p className="text-xs text-muted-foreground">Cliente del {isContract ? 'Contrato' : 'Presupuesto'}</p>
                                </div>
                            </div>
                        </DashboardCard>

                        {/* Card: Estado y Fechas */}
                        <DashboardCard
                            title="Estado"
                            icon={<Calendar className="h-4 w-4" />}
                            compact
                        >
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Badge variant={statusInfo.variant} className="gap-1">
                                        {statusInfo.icon}
                                        {statusInfo.label}
                                    </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground space-y-1">
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
                </div>

                {/* Columna Derecha - KPIs Financieros */}
                <div className="space-y-4">

                    {isContract && contractSummary ? (
                        <>
                            {/* Contrato Revisado (Principal) */}
                            <DashboardKpiCard
                                title="Contrato Revisado"
                                amount={contractSummary.revised_contract_value || 0}
                                iconClassName="bg-emerald-500/10 text-emerald-600"
                                description="Valor actual incluyendo adicionales aprobados"
                            />

                            {/* Impacto de Adicionales */}
                            <DashboardKpiCard
                                title="Impacto de Adicionales"
                                amount={contractSummary.approved_changes_value || 0}
                                icon={<TrendingUp className="h-5 w-5" />}
                                iconClassName="bg-blue-500/10 text-blue-600"
                                trend={{
                                    value: `${contractSummary.approved_change_order_count} aprobados`,
                                    direction: "up"
                                }}
                            />

                            {/* Contrato Original */}
                            <DashboardKpiCard
                                title="Contrato Original"
                                amount={contractSummary.original_contract_value || 0}
                                description="Monto firmado inicialmente"
                                className="opacity-80"
                            />

                            {/* Pendiente de Aprobación */}
                            {contractSummary.pending_changes_value > 0 && (
                                <DashboardKpiCard
                                    title="Pendiente de Aprobación"
                                    amount={contractSummary.pending_changes_value}
                                    iconClassName="bg-orange-500/10 text-orange-600"
                                    description={`${contractSummary.pending_change_order_count} adicionales en revisión`}
                                />
                            )}
                        </>
                    ) : (
                        <>
                            {/* Total Presupuestado */}
                            <DashboardKpiCard
                                title="Total Presupuestado"
                                amount={quote.total_with_tax || 0}
                                iconClassName="bg-primary/10 text-primary"
                                description={`${quote.tax_label || 'IVA'} incluido (${quote.tax_pct}%)`}
                            />

                            {/* Subtotal */}
                            <DashboardKpiCard
                                title="Subtotal"
                                amount={quote.subtotal_with_markup || 0}
                                description="Antes de impuestos y descuentos"
                            />

                            {/* Descuento (si aplica) */}
                            {quote.discount_pct > 0 && (
                                <DashboardKpiCard
                                    title="Descuento Aplicado"
                                    value={`${quote.discount_pct}%`}
                                    description={`-${money.format((quote.subtotal_with_markup || 0) - (quote.total_after_discount || 0))}`}
                                    iconClassName="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
