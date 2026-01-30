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
    // ADJUSTMENT CALCULATIONS - ACCUMULATED MONTHLY %
    // ============================================
    // Calculate accumulated coefficient from base period to latest index
    const accumulatedCoefficient = useMemo(() => {
        if (!indexHistory.length) return 1;

        const baseMonth = subcontract.base_period_month;
        const baseYear = subcontract.base_period_year;
        const basePeriodDate = baseMonth && baseYear
            ? new Date(baseYear, baseMonth - 1, 1)
            : null;

        // Build index map
        const indexMap = new Map<string, number>();
        indexHistory.forEach(idx => {
            const year = idx.period_year < 100 ? 2000 + idx.period_year : idx.period_year;
            const key = `${idx.period_month}-${year}`;
            if (idx.values) {
                indexMap.set(key, Object.values(idx.values)[0] as number);
            }
        });

        // Accumulate from base period to latest
        let accumulated = 1;
        const sortedHistory = [...indexHistory].sort((a, b) => {
            const yearA = a.period_year < 100 ? 2000 + a.period_year : a.period_year;
            const yearB = b.period_year < 100 ? 2000 + b.period_year : b.period_year;
            return yearA - yearB || (a.period_month || 1) - (b.period_month || 1);
        });

        for (const idx of sortedHistory) {
            const year = idx.period_year < 100 ? 2000 + idx.period_year : idx.period_year;
            const indexDate = new Date(year, (idx.period_month || 1) - 1, 1);

            // Only accumulate AFTER base period
            if (basePeriodDate && indexDate > basePeriodDate) {
                const key = `${idx.period_month}-${year}`;
                const monthlyPercent = indexMap.get(key) || 0;
                accumulated *= (1 + monthlyPercent / 100);
            }
        }

        return accumulated;
    }, [indexHistory, subcontract.base_period_month, subcontract.base_period_year]);

    const variation = (accumulatedCoefficient - 1) * 100;

    // OPTION B: Calculate on REMAINING balance
    const adjustedRemaining = remaining * accumulatedCoefficient;
    const difference = adjustedRemaining - remaining;

    // Items arrays for KPI cards (for proper currency display)
    const remainingItems = [{ amount: remaining, currency_code: config.functionalCurrencyCode, exchange_rate: 1 }];
    const adjustedRemainingItems = [{ amount: adjustedRemaining, currency_code: config.functionalCurrencyCode, exchange_rate: 1 }];
    const differenceItems = [{ amount: Math.abs(difference), currency_code: config.functionalCurrencyCode, exchange_rate: 1 }];

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

        // Build index map for quick lookup (month-year -> monthly percentage)
        const indexMap = new Map<string, number>();
        indexHistory.forEach(idx => {
            const year = idx.period_year < 100 ? 2000 + idx.period_year : idx.period_year;
            const key = `${idx.period_month}-${year}`;
            if (idx.values) {
                // Values are stored as percentages (e.g., 3.2 means 3.2%)
                indexMap.set(key, Object.values(idx.values)[0] as number);
            }
        });

        // Get base period from subcontract
        const baseMonth = subcontract.base_period_month;
        const baseYear = subcontract.base_period_year;
        const basePeriodDate = baseMonth && baseYear
            ? new Date(baseYear, baseMonth - 1, 1)
            : null;


        // Find date range
        const firstPaymentDate = paymentsWithDate.length > 0 ? paymentsWithDate[0].date : null;
        const firstIndexDate = indexHistory.length > 0
            ? new Date(
                (indexHistory[0].period_year < 100 ? 2000 + indexHistory[0].period_year : indexHistory[0].period_year),
                (indexHistory[0].period_month || 1) - 1
            )
            : null;

        const lastIndex = indexHistory.length > 0 ? indexHistory[indexHistory.length - 1] : null;
        const lastIndexDate = lastIndex
            ? new Date(
                (lastIndex.period_year < 100 ? 2000 + lastIndex.period_year : lastIndex.period_year),
                (lastIndex.period_month || 1) - 1
            )
            : null;

        let startDate: Date | null = null;
        if (firstPaymentDate && firstIndexDate) {
            startDate = firstPaymentDate < firstIndexDate ? firstPaymentDate : firstIndexDate;
        } else if (firstPaymentDate) {
            startDate = firstPaymentDate;
        } else if (firstIndexDate) {
            startDate = firstIndexDate;
        }

        const now = new Date();
        let endDate = lastIndexDate || now;
        if (endDate < now) endDate = now;

        if (!startDate) return [];

        // Generate months from start to end with ACCUMULATED coefficient
        const months: { month: string; pagado: number; saldo: number; saldoAjustado: number; indice: number; coefAcumulado: number }[] = [];
        const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

        // Accumulated coefficient starts at 1 (100%)
        let accumulatedCoefficient = 1;

        while (current <= endDate) {
            const month = current.getMonth() + 1;
            const year = current.getFullYear();
            const periodEndDate = new Date(year, month, 0);

            // Get monthly inflation percentage for this period
            const indexKey = `${month}-${year}`;
            const monthlyPercent = indexMap.get(indexKey) || 0; // Default 0% if no data

            // Accumulate: multiply by (1 + monthly%/100)
            // Only accumulate AFTER the base period
            if (basePeriodDate && current > basePeriodDate) {
                accumulatedCoefficient *= (1 + monthlyPercent / 100);
            } else if (!basePeriodDate) {
                // If no base period defined, accumulate from start
                accumulatedCoefficient *= (1 + monthlyPercent / 100);
            }

            // Sum ALL payments up to and including this period
            const cumulativePaid = paymentsWithDate
                .filter(p => p.date <= periodEndDate)
                .reduce((acc, p) => acc + p.amount, 0);

            // Remaining for this period
            const monthRemaining = contractTotal - cumulativePaid;

            // Month label with index percentage
            const monthAbbr = MONTH_NAMES[month - 1]?.slice(0, 3) || String(month);
            const monthLabel = `${monthAbbr} ${String(year).slice(2)}\n(${monthlyPercent.toFixed(1)}%)`;

            months.push({
                month: monthLabel,
                pagado: cumulativePaid,
                saldo: monthRemaining,
                saldoAjustado: monthRemaining * accumulatedCoefficient,
                indice: monthlyPercent,
                coefAcumulado: accumulatedCoefficient,
            });

            // Move to next month
            current.setMonth(current.getMonth() + 1);
        }

        return months;
    }, [indexHistory, payments, contractTotal, subcontract.base_period_month, subcontract.base_period_year, currentRate, effectiveDisplayMode, config]);

    // ============================================
    // PAYMENT SPEED vs INFLATION calculations
    // ============================================
    const paymentProgress = contractTotal > 0
        ? (totalPaid / contractTotal) * 100
        : 0;

    // Accumulated inflation since base period
    const inflationProgress = variation; // Already calculated as percentage

    // Determine who's "winning"
    const isWinning = paymentProgress > inflationProgress;

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
                    />

                    {/* 2. Variación - muestra como porcentaje */}
                    <DashboardKpiCard
                        title="Variación"
                        value={`${variation >= 0 ? '+' : ''}${variation.toFixed(1)}%`}
                        icon={<Percent className="h-5 w-5" />}
                        description={`Base: ${basePeriodLabel}`}
                        compact={false}
                    />

                    {latestIndexValue && (
                        <>
                            <DashboardKpiCard
                                title="Coeficiente de Ajuste"
                                value={accumulatedCoefficient.toFixed(4)}
                                icon={<Percent className="h-5 w-5" />}
                                trend={{
                                    value: `${variation >= 0 ? '+' : ''}${variation.toFixed(1)}%`,
                                    label: "variación",
                                    direction: variation >= 0 ? "up" : "down"
                                }}
                                compact={false}
                            />

                            <DashboardKpiCard
                                title="Diferencia a Pagar"
                                items={differenceItems}
                                icon={<DollarSign className="h-5 w-5" />}
                                description="Adicional por redeterminación"
                                compact={true}
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
                        items={remainingItems}
                        description="Sin aplicar ajuste por índice"
                        compact={true}
                    />

                    <DashboardKpiCard
                        title="Saldo Ajustado"
                        items={adjustedRemainingItems}
                        description="Con redeterminación aplicada"
                        compact={true}
                    />
                </div>
                {/* Charts Row - Side by Side on Desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Evolution Chart - LEFT */}
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
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#EF4444' }} />
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
                                    saldo: { label: 'Saldo Pendiente', color: '#EF4444' },
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
                                        cursor={{ stroke: '#EF4444', strokeWidth: 1, strokeDasharray: '4 4' }}
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

                    {/* Payment Speed vs Inflation - RIGHT */}
                    <DashboardCard
                        title="Velocidad de Pago vs Inflación"
                        description={isWinning
                            ? "✅ Estás pagando más rápido de lo que sube la inflación"
                            : "⚠️ La inflación está superando tu ritmo de pagos"
                        }
                        icon={<TrendingUp className="h-4 w-4" />}
                        compact
                    >
                        <div className="flex flex-col justify-center h-[276px] py-4">
                            <div className="space-y-8">
                                {/* Payment Progress */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-muted-foreground">Pagado del Contrato</span>
                                        <span className={cn(
                                            "text-2xl font-bold",
                                            isWinning ? "text-green-500" : "text-muted-foreground"
                                        )}>
                                            {paymentProgress.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="h-4 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min(paymentProgress, 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {formatMoney(totalPaid)} de {formatMoney(contractTotal)}
                                    </p>
                                </div>

                                {/* Inflation Progress */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-muted-foreground">Inflación Acumulada</span>
                                        <span className={cn(
                                            "text-2xl font-bold",
                                            !isWinning ? "text-red-500" : "text-muted-foreground"
                                        )}>
                                            +{inflationProgress.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="h-4 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-red-500 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min(inflationProgress * 2, 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Diferencia: {formatMoney(Math.abs(difference))}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </DashboardCard>
                </div>

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
