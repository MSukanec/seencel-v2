"use client";

import { useMemo } from "react";
import { TrendingUp, Info, Calendar, Percent, DollarSign, Download } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useMoney } from "@/hooks/use-money";
import { cn } from "@/lib/utils";
import { MONTH_NAMES } from "@/features/advanced/types";
import type { EconomicIndexValue } from "@/features/advanced/types";

// ✅ Money service functions for correct calculations
import { sumMoney, calculateDisplayAmount as calcDisplayAmount } from "@/lib/money/money-service";
import { createMoney } from "@/lib/money/money";

// ✅ Dashboard components
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";

// ✅ Recharts + Project Chart Components
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { CHART_DEFAULTS } from '@/components/charts/chart-config';

interface SubcontractAdjustmentViewProps {
    subcontract: any;
    payments: any[];
    financialData: any;
    latestIndexValue?: number | null;
    indexTypeName?: string | null;
    indexHistory?: EconomicIndexValue[];
}

export function SubcontractAdjustmentView({
    subcontract,
    payments,
    financialData,
    latestIndexValue,
    indexTypeName,
    indexHistory = []
}: SubcontractAdjustmentViewProps) {
    // ✅ Extract displayMode and sum from useMoney (global context)
    const { format: formatMoney, config, displayMode, sum } = useMoney();



    // Export handler
    const handleExport = () => {
        // TODO: Implement export functionality
        console.log("Export adjustment data");
    };

    // If no index adjustment is configured, show empty state
    if (!subcontract.adjustment_index_type_id || !subcontract.base_index_value) {
        return (
            <div className="h-full flex items-center justify-center">
                <EmptyState
                    icon={TrendingUp}
                    title="Sin Ajuste Configurado"
                    description="Este subcontrato no tiene un índice de ajuste configurado. Editá el subcontrato para agregar un índice de redeterminación."
                />
            </div>
        );
    }

    // Get current exchange rate from config
    const currentRate = config.currentExchangeRate;

    // ============================================
    // PATRON SEGUN SKILL: finance-multicurrency
    // ============================================

    // 1. DATOS RAW DEL CONTRATO
    const contractAmount = Number(subcontract.amount_total || 0);
    const contractCurrencyCode = subcontract.currency?.code || config.functionalCurrencyCode;
    const contractExchangeRate = Number(subcontract.exchange_rate) || currentRate;

    // 2. MODO EFECTIVO (segun skill sección 4)
    // En Mix, usar la moneda del contrato
    const effectiveDisplayMode = useMemo(() => {
        if (displayMode === 'mix') {
            return contractCurrencyCode === config.secondaryCurrencyCode
                ? 'secondary'
                : 'functional';
        }
        return displayMode;
    }, [displayMode, contractCurrencyCode, config.secondaryCurrencyCode]);

    // 3. TOTAL CONTRATO usando sumMoney
    const contractTotal = useMemo(() => {
        return sumMoney(
            [{
                amount: contractAmount,
                currency_code: contractCurrencyCode,
                exchange_rate: contractExchangeRate
            }],
            effectiveDisplayMode,
            config
        ).total;
    }, [contractAmount, contractCurrencyCode, contractExchangeRate, effectiveDisplayMode, config]);

    // 4. TOTAL PAGADO usando sumMoney (NO functional_amount!)
    const totalPaid = useMemo(() => {
        return sumMoney(
            payments.map(p => ({
                amount: Number(p.amount || 0),
                currency_code: p.currency?.code || p.currency_code || config.functionalCurrencyCode,
                exchange_rate: Number(p.exchange_rate) || currentRate
            })),
            effectiveDisplayMode,
            config
        ).total;
    }, [payments, effectiveDisplayMode, config, currentRate]);

    // 5. SALDO PENDIENTE
    const remaining = contractTotal - totalPaid;

    // ============================================
    // ADJUSTMENT CALCULATIONS
    // ============================================
    const baseValue = Number(subcontract.base_index_value);
    const currentValue = latestIndexValue || baseValue;
    const coefficient = baseValue > 0 ? currentValue / baseValue : 1;
    const variation = (coefficient - 1) * 100;

    // OPTION B: Calculate on REMAINING balance
    const adjustedRemaining = remaining * coefficient;
    const difference = adjustedRemaining - remaining;

    const basePeriodLabel = subcontract.base_period_month && subcontract.base_period_year
        ? `${MONTH_NAMES[subcontract.base_period_month - 1]} ${subcontract.base_period_year}`
        : 'N/A';

    // Prepare chart data from index history and payments
    const chartData = useMemo(() => {
        // Convertir pagos usando sumMoney pattern (NO functional_amount)
        const paymentsWithDate = payments.map(p => {
            const amt = sumMoney(
                [{
                    amount: Number(p.amount || 0),
                    currency_code: p.currency?.code || p.currency_code || config.functionalCurrencyCode,
                    exchange_rate: Number(p.exchange_rate) || currentRate
                }],
                effectiveDisplayMode,
                config
            ).total;
            return {
                date: new Date(p.payment_date),
                amount: amt
            };
        });

        // Sort payments by date
        paymentsWithDate.sort((a, b) => a.date.getTime() - b.date.getTime());

        // Build index map for quick lookup (month-year -> indexValue)
        const indexMap = new Map<string, number>();
        indexHistory.forEach(idx => {
            const year = idx.period_year < 100 ? 2000 + idx.period_year : idx.period_year;
            const key = `${idx.period_month}-${year}`;
            if (idx.values) {
                indexMap.set(key, Object.values(idx.values)[0] as number);
            }
        });

        // Find date range: from first payment or first index (whichever is earlier)
        const firstPaymentDate = paymentsWithDate.length > 0 ? paymentsWithDate[0].date : null;
        const firstIndexDate = indexHistory.length > 0
            ? new Date(
                (indexHistory[0].period_year < 100 ? 2000 + indexHistory[0].period_year : indexHistory[0].period_year),
                (indexHistory[0].period_month || 1) - 1
            )
            : null;

        // Get the latest index date
        const lastIndex = indexHistory.length > 0 ? indexHistory[indexHistory.length - 1] : null;
        const lastIndexDate = lastIndex
            ? new Date(
                (lastIndex.period_year < 100 ? 2000 + lastIndex.period_year : lastIndex.period_year),
                (lastIndex.period_month || 1) - 1
            )
            : null;

        // Determine start date (1 month before first payment if exists, else first index)
        let startDate: Date | null = null;
        if (firstPaymentDate && firstIndexDate) {
            startDate = firstPaymentDate < firstIndexDate ? firstPaymentDate : firstIndexDate;
        } else if (firstPaymentDate) {
            startDate = firstPaymentDate;
        } else if (firstIndexDate) {
            startDate = firstIndexDate;
        }

        // Determine end date (current month or last index)
        const now = new Date();
        let endDate = lastIndexDate || now;
        if (endDate < now) endDate = now;

        if (!startDate) return [];

        // Generate months from start to end
        const months: { month: string; pagado: number; saldo: number; saldoAjustado: number }[] = [];
        const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

        while (current <= endDate) {
            const month = current.getMonth() + 1;
            const year = current.getFullYear();
            const periodEndDate = new Date(year, month, 0); // Last day of month
            const monthLabel = `${MONTH_NAMES[month - 1]?.slice(0, 3) || month} ${String(year).slice(2)}`;

            // Sum ALL payments up to and including this period
            const cumulativePaid = paymentsWithDate
                .filter(p => p.date <= periodEndDate)
                .reduce((acc, p) => acc + p.amount, 0);

            // Remaining for this period
            const monthRemaining = contractTotal - cumulativePaid;

            // Get index value for this period (if exists), otherwise use baseValue (coef=1)
            const indexKey = `${month}-${year}`;
            const indexValue = indexMap.get(indexKey) || baseValue;
            const periodCoefficient = baseValue > 0 ? indexValue / baseValue : 1;

            months.push({
                month: monthLabel,
                pagado: cumulativePaid,
                saldo: monthRemaining,
                saldoAjustado: monthRemaining * periodCoefficient,
            });

            // Move to next month
            current.setMonth(current.getMonth() + 1);
        }

        return months;
    }, [indexHistory, payments, contractTotal, baseValue, currentRate, effectiveDisplayMode, config]);

    return (
        <>
            {/* Toolbar with export */}
            <Toolbar
                portalToHeader
                actions={[
                    {
                        label: "Exportar",
                        icon: Download,
                        onClick: handleExport,
                        variant: "secondary" as const,
                    }
                ]}
            />

            <div className="space-y-6">
                {/* Period Comparison - 4 KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 1. Índice - nombre del índice */}
                    <DashboardKpiCard
                        title="Índice"
                        value={indexTypeName || 'ICC'}
                        icon={<TrendingUp className="h-5 w-5" />}
                        description="Redeterminación aplicada al saldo pendiente"
                        compact={false}
                        size="default"
                    />

                    {/* 2. Variación - muestra como porcentaje */}
                    <DashboardKpiCard
                        title="Variación"
                        value={`${variation >= 0 ? '+' : ''}${variation.toFixed(1)}%`}
                        icon={<Percent className="h-5 w-5" />}
                        description={`Base: ${basePeriodLabel}`}
                        compact={false}
                        size="default"
                    />

                    {latestIndexValue && (
                        <>
                            <DashboardKpiCard
                                title="Coeficiente de Ajuste"
                                value={coefficient.toFixed(4)}
                                icon={<Percent className="h-5 w-5" />}
                                trend={{
                                    value: `${variation >= 0 ? '+' : ''}${variation.toFixed(1)}%`,
                                    label: "variación",
                                    direction: variation >= 0 ? "up" : "down"
                                }}
                                compact={false}
                                size="default"
                            />

                            <DashboardKpiCard
                                title="Diferencia a Pagar"
                                amount={Math.abs(difference)}
                                icon={<DollarSign className="h-5 w-5" />}
                                description="Adicional por redeterminación"
                                compact={true}
                                size="default"
                            />
                        </>
                    )}
                </div>

                {!latestIndexValue && (
                    <div className="flex items-center gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-sm text-amber-700 dark:text-amber-400">
                        <Info className="h-4 w-4" />
                        No hay datos del índice actual. Agregue valores en Ajustes Avanzados.
                    </div>
                )}

                {/* Balance Comparison - using DashboardKpiCard */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <DashboardKpiCard
                        title="Saldo Original (Pendiente)"
                        amount={remaining}
                        description="Sin aplicar ajuste por índice"
                        compact={true}
                        size="large"
                    />

                    <DashboardKpiCard
                        title="Saldo Ajustado"
                        amount={adjustedRemaining}
                        description="Con redeterminación aplicada"
                        compact={true}
                        size="large"
                    />
                </div>
                {/* Evolution Chart - Using project chart components */}
                {chartData.length > 1 && (
                    <DashboardCard
                        title="Evolución del Saldo"
                        description="Monto adeudado, pagos acumulados y saldo ajustado"
                        icon={<TrendingUp className="h-4 w-4" />}
                        compact
                    >
                        {/* Custom Legend */}
                        <div className="flex items-center justify-end gap-4 mb-2">
                            <div className="flex items-center gap-1.5 text-xs">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#3B82F6' }} />
                                <span className="text-muted-foreground">Saldo Pendiente</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#22c55e' }} />
                                <span className="text-muted-foreground">Pagos Acumulados</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#8B5CF6' }} />
                                <span className="text-muted-foreground">Saldo Ajustado</span>
                            </div>
                        </div>
                        <ChartContainer
                            config={{
                                saldo: { label: 'Saldo Pendiente', color: '#3B82F6' },
                                pagado: { label: 'Pagos Acumulados', color: '#22c55e' },
                                saldoAjustado: { label: 'Saldo Ajustado', color: '#8B5CF6' }
                            } satisfies ChartConfig}
                            className="w-full"
                            style={{ height: 276 }}
                        >
                            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_DEFAULTS.gridColor} />
                                <XAxis
                                    dataKey="month"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    minTickGap={20}
                                    tick={{ fill: '#a1a1aa' }}
                                    dy={4}
                                />
                                <YAxis
                                    tickFormatter={(v: number) => formatMoney(v)}
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    width={40}
                                    tick={{ fill: '#a1a1aa' }}
                                />
                                <ChartTooltip
                                    cursor={{ stroke: '#3B82F6', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    content={<ChartTooltipContent formatter={(v) => formatMoney(Number(v) || 0)} />}
                                />
                                {/* Línea 1: Saldo Pendiente (baja con pagos) */}
                                <Line
                                    type="monotone"
                                    dataKey="saldo"
                                    name="Saldo Pendiente"
                                    stroke="var(--color-saldo)"
                                    strokeWidth={2}
                                    dot={false}
                                    animationDuration={CHART_DEFAULTS.animationDuration}
                                />
                                {/* Línea 2: Pagos Acumulados (sube) */}
                                <Line
                                    type="monotone"
                                    dataKey="pagado"
                                    name="Pagos Acumulados"
                                    stroke="var(--color-pagado)"
                                    strokeWidth={2}
                                    dot={false}
                                    animationDuration={CHART_DEFAULTS.animationDuration}
                                />
                                {/* Línea 3: Saldo Ajustado (punteada) */}
                                <Line
                                    type="monotone"
                                    dataKey="saldoAjustado"
                                    name="Saldo Ajustado"
                                    stroke="var(--color-saldoAjustado)"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={false}
                                    animationDuration={CHART_DEFAULTS.animationDuration}
                                />
                            </LineChart>
                        </ChartContainer>
                    </DashboardCard>
                )}

                {chartData.length <= 1 && (
                    <DashboardCard
                        title="Evolución del Ajuste"
                        icon={<TrendingUp className="h-4 w-4" />}
                    >
                        <EmptyState
                            icon={TrendingUp}
                            title="Sin Historial Suficiente"
                            description="Se necesitan al menos 2 períodos de índice para mostrar el gráfico de evolución."
                        />
                    </DashboardCard>
                )}
            </div>
        </>
    );
}
