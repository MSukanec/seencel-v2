"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { BarChart3, Building2, Calendar, Wallet, TrendingUp, Target, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useMemo } from "react";
import { useMoney } from "@/hooks/use-money";
import { cn } from "@/lib/utils";
import { MONTH_NAMES } from "@/features/advanced/types";
import type { EconomicIndexValue } from "@/features/advanced/types";
import { BaseDualAreaChart } from "@/components/charts";

interface SubcontractOverviewViewProps {
    subcontract: any;
    payments: any[];
    financialData: any;
    // Index adjustment data
    latestIndexValue?: number | null;
    indexTypeName?: string | null;
    indexHistory?: EconomicIndexValue[];
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    draft: { label: "Borrador", variant: "secondary" },
    active: { label: "Activo", variant: "default" },
    completed: { label: "Completado", variant: "outline" },
    cancelled: { label: "Cancelado", variant: "destructive" },
};

export function SubcontractOverviewView({ subcontract, payments, financialData, latestIndexValue, indexTypeName, indexHistory = [] }: SubcontractOverviewViewProps) {
    const { format: formatMoney, sum, config } = useMoney();

    // Calculate totals
    const contractAmount = Number(subcontract.amount_total || 0);
    const contractCurrencyCode = subcontract.currency?.code || config.functionalCurrencyCode;
    const contractSymbol = subcontract.currency?.symbol || config.functionalCurrencySymbol;

    // Sum payments using proper money items with actual currency data
    const paymentItems = payments.map(p => ({
        amount: Number(p.amount || 0),
        currency_code: p.currency?.code || config.functionalCurrencyCode,
        exchange_rate: Number(p.exchange_rate) || config.currentExchangeRate
    }));
    const paidSummary = sum(paymentItems);
    const totalPaidFunctional = paidSummary.total;

    // For progress, convert contract amount to functional if needed
    const isFunctional = contractCurrencyCode === config.functionalCurrencyCode;
    const contractFunctional = isFunctional
        ? contractAmount
        : contractAmount * (subcontract.exchange_rate || config.currentExchangeRate || 1);

    // Progress percentage
    const progressPercent = contractFunctional > 0
        ? Math.min((totalPaidFunctional / contractFunctional) * 100, 100)
        : 0;

    const remaining = contractFunctional - totalPaidFunctional;
    const isOverpaid = remaining < 0;

    const statusConfig = STATUS_CONFIG[subcontract.status] || STATUS_CONFIG.draft;

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Contract Amount */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Monto Contrato
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">
                            {contractSymbol} {contractAmount.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                        </div>
                        {!isFunctional && (
                            <p className="text-xs text-muted-foreground mt-1">
                                ≈ {formatMoney(contractFunctional)}
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Total Paid */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Wallet className="h-4 w-4" />
                            Total Pagado
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono text-emerald-600">
                            {formatMoney(totalPaidFunctional)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {payments.length} pagos registrados
                        </p>
                    </CardContent>
                </Card>

                {/* Remaining */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Saldo Pendiente
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={cn(
                            "text-2xl font-bold font-mono",
                            isOverpaid ? "text-amber-600" : "text-foreground"
                        )}>
                            {isOverpaid ? "+" : ""}{formatMoney(Math.abs(remaining))}
                        </div>
                        {isOverpaid && (
                            <p className="text-xs text-amber-600 mt-1">
                                Sobrepagado
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Status */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Estado
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge variant={statusConfig.variant} className="text-base px-3 py-1">
                            {statusConfig.label}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-2">
                            Inicio: {subcontract.date ? format(new Date(subcontract.date), "dd MMM yyyy", { locale: es }) : '-'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Progress Bar */}
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">Avance Financiero</CardTitle>
                        <span className="text-sm font-mono font-bold">
                            {progressPercent.toFixed(1)}%
                        </span>
                    </div>
                </CardHeader>
                <CardContent>
                    <Progress
                        value={progressPercent}
                        className="h-3"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>Pagado: {formatMoney(totalPaidFunctional)}</span>
                        <span>Total: {formatMoney(contractFunctional)}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Index Adjustment Indicator */}
            {subcontract.adjustment_index_type_id && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Ajuste por Índice Configurado
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Este subcontrato tiene redeterminación de precios configurada.
                            Ver la pestaña <strong>"Ajuste"</strong> para el detalle completo del coeficiente y evolución.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Description */}
            {subcontract.notes && (
                <Card>
                    <CardHeader>
                        <CardTitle>Descripción</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {subcontract.notes}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Contact Info */}
            {subcontract.contact && (
                <Card>
                    <CardHeader>
                        <CardTitle>Proveedor / Contratista</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">Nombre</span>
                                <p className="font-medium">{subcontract.contact.full_name || subcontract.contact.company_name || '-'}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Empresa</span>
                                <p className="font-medium">{subcontract.contact.company_name || '-'}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Email</span>
                                <p className="font-medium">{subcontract.contact.email || '-'}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Teléfono</span>
                                <p className="font-medium">{subcontract.contact.phone || '-'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Placeholder for charts */}
            <div className="min-h-[200px] border-2 border-dashed rounded-lg flex items-center justify-center">
                <EmptyState
                    icon={BarChart3}
                    title="Métricas en desarrollo"
                    description="Próximamente verás gráficos de avance financiero y de obra."
                    className="border-none"
                />
            </div>
        </div>
    );
}
