"use client";

import { QuoteView, ContractSummary } from "../types";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, DollarSign, TrendingUp, AlertCircle, Building2, FileSignature } from "lucide-react";
import { useMoney } from "@/hooks/use-money";

interface QuoteOverviewViewProps {
    quote: QuoteView;
    contractSummary?: ContractSummary | null;
}

export function QuoteOverviewView({ quote, contractSummary }: QuoteOverviewViewProps) {
    const isContract = quote.quote_type === 'contract';

    // Use centralized money formatting
    const money = useMoney();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* 0. Context Banner for Change Orders */}
            {quote.quote_type === 'change_order' && quote.parent_quote_id && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                            <FileSignature className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-blue-900">Adicional al Contrato</h3>
                            <p className="text-sm text-blue-700">
                                Este documento es un anexo al contrato principal.
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-blue-200 hover:bg-blue-100/50 text-blue-700" asChild>
                        <a href={`/organization/quotes/${quote.parent_quote_id}`}>
                            Ver Contrato Principal
                        </a>
                    </Button>
                </div>
            )}

            {/* 1. Header Section with Description */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-medium flex items-center gap-2">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                {isContract ? 'Alcance del Contrato' : 'Descripción del Presupuesto'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {quote.description ? (
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {quote.description}
                                </p>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground/50 border-2 border-dashed rounded-lg">
                                    <FileText className="h-8 w-8 mb-2" />
                                    <p className="text-sm">Sin descripción definida</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Cliente</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">{quote.client_name || 'Sin Cliente'}</p>
                                        <p className="text-xs text-muted-foreground">Cliente Registrado</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Estado</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                                        <AlertCircle className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-semibold capitalize">{quote.status}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Válido hasta: {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : '-'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* 2. KPIs Column */}
                <div className="space-y-4">
                    {/* Contract Logic */}
                    {isContract && contractSummary ? (
                        <>
                            {/* Revised Contract Value (Main KPI) */}
                            <DashboardKpiCard
                                title="Contrato Revisado"
                                amount={contractSummary.revised_contract_value || 0}
                                icon={<DollarSign className="h-5 w-5" />}
                                iconClassName="bg-emerald-500/10 text-emerald-600"
                                description="Valor actual incluyendo adicionales aprobados"
                            />

                            {/* Change Orders Impact */}
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

                            {/* Original Value */}
                            <DashboardKpiCard
                                title="Contrato Original"
                                amount={contractSummary.original_contract_value || 0}
                                description="Monto firmado inicialmente"
                                className="opacity-80"
                            />

                            {/* Potential (Pending) */}
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
                        // Standard Quote Logic
                        <>
                            <DashboardKpiCard
                                title="Total Presupuestado"
                                amount={quote.total_with_tax || 0}
                                icon={<DollarSign className="h-5 w-5" />}
                                iconClassName="bg-primary/10 text-primary"
                                description={`${quote.tax_label || 'Tax'} incluido (${quote.tax_pct}%)`}
                            />

                            <DashboardKpiCard
                                title="Subtotal"
                                amount={quote.subtotal_with_markup || 0}
                                description="Antes de impuestos y descuentos"
                            />

                            {quote.discount_pct > 0 && (
                                <DashboardKpiCard
                                    title="Descuento Aplicado"
                                    value={`${quote.discount_pct}%`}
                                    description={`-${money.format((quote.subtotal_with_markup || 0) - (quote.total_after_discount || 0))}`}
                                    iconClassName="bg-green-100 text-green-700"
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
