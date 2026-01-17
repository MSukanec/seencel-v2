"use client";

import { useMemo, useState, useEffect } from "react";
import { DashboardKpiCard, CurrencyBreakdownItem } from "@/components/dashboard/dashboard-kpi-card";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { InsightCard } from "@/features/insights/components/insight-card";
import { InsightAction } from "@/features/insights/types";
import { useInsightPersistence } from "@/features/insights/hooks/use-insight-persistence";
import { generateClientInsights } from "@/features/insights/logic/clients";
import { BaseDualAreaChart } from "@/components/charts/area/base-dual-area-chart";
import { BaseDonutChart } from "@/components/charts/pie/base-donut-chart";
import { ClientFinancialSummary, ClientPaymentView } from "../types";
import { FileText, DollarSign, Clock, TrendingUp, TrendingDown, BarChart3, PieChart, Lightbulb, Activity, CheckCircle, Wallet } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ChartConfig } from "@/components/ui/chart";
import { useSmartCurrency } from "@/hooks/use-smart-currency";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { formatCurrency as formatCurrencyUtil } from "@/lib/currency-utils";
import { useCurrency } from "@/providers/currency-context";
import { useCurrencyOptional } from "@/providers/currency-context";
import { useFinancialFeatures } from "@/hooks/use-financial-features";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface ClientsOverviewProps {
    summary: ClientFinancialSummary[];
    payments: ClientPaymentView[];
}

export function ClientsOverview({ summary, payments }: ClientsOverviewProps) {
    const {
        calculateDisplayAmount,
        sumDisplayAmounts,
        displayCurrencyCode,
        isSecondaryDisplay,
        currentRate,
        primaryCurrencyCode
    } = useSmartCurrency();

    // Derived for compatibility
    const displayCurrency = isSecondaryDisplay ? 'secondary' : 'primary';

    // We still need context for specific currency objects (symbol etc) for breakdowns
    const {
        allCurrencies,
        setDisplayCurrency,
        primaryCurrency: primaryCurrencyObj,
        secondaryCurrency: secondaryCurrencyObj,
        currentExchangeRate: marketRate
    } = useCurrency(); // Explicit useCurrency instead of optional for robust logic

    // Decimal-aware formatting
    const { formatNumber, decimalPlaces } = useFormatCurrency();

    // Feature Flags for Financial Logic
    const { showCurrencySelector, showExchangeRate, functionalCurrencyId, showFunctionalColumns } = useFinancialFeatures();

    // ========================================
    // LOGIC FROM UNIFIED SUMMARY (MIGRATED)
    // ========================================

    // Resolve the actual Reference Currency Object
    const referenceCurrency = useMemo(() => {
        if (functionalCurrencyId) {
            return allCurrencies.find(c => c.id === functionalCurrencyId);
        }
        return allCurrencies.find(c => !c.is_default);
    }, [allCurrencies, functionalCurrencyId]);

    // Local State for View Mode: 'mix' (Breakdown) vs 'ref' (Reference Total)
    const [viewMode, setViewMode] = useState<'mix' | 'ref'>('mix');

    // Enforce "Ref" View logic if we are in that mode
    useEffect(() => {
        if (showCurrencySelector && referenceCurrency && displayCurrency !== 'secondary') {
            if (viewMode === 'ref') {
                setDisplayCurrency('secondary');
            }
        }
    }, [showCurrencySelector, referenceCurrency, displayCurrency, setDisplayCurrency, viewMode]);

    const isMixView = viewMode === 'mix';
    const isReferenceView = viewMode === 'ref';

    // Helper to render value based on view mode
    const renderFinancialValue = (
        primaryValue: number,
        breakdown: any[],
    ) => {
        const mainValueClass = "text-3xl font-bold tracking-tight";
        const secondaryValueClass = "text-xl font-medium text-muted-foreground";

        // If MIX view and we have mixed currencies, show the breakdown stacked
        if (isMixView && breakdown && breakdown.length > 0) {
            if (breakdown.length === 1) {
                const item = breakdown[0];
                return (
                    <div className="flex flex-col">
                        <span className={mainValueClass}>{item.symbol} {formatNumber(item.nativeTotal)}</span>
                    </div>
                );
            }

            // Multiple currencies - stack vertically
            return (
                <div className="flex flex-col gap-0.5">
                    {breakdown.map((item: any, index: number) => {
                        const isNegative = item.nativeTotal < 0;
                        const val = Math.abs(item.nativeTotal);
                        const isMain = index === 0;

                        return (
                            <span key={item.currencyCode} className={cn(
                                isMain ? mainValueClass : secondaryValueClass,
                                "flex items-center"
                            )}>
                                {index > 0 && (isNegative ? "- " : "+ ")}
                                {index === 0 && isNegative && "-"}
                                {item.symbol} {formatNumber(val)}
                            </span>
                        );
                    })}
                </div>
            );
        }

        // Fallback or Reference View
        return (
            <div className="flex flex-col">
                <span className={mainValueClass}>
                    {formatCurrencyUtil(primaryValue, isReferenceView && referenceCurrency ? referenceCurrency.code : primaryCurrencyObj?.code, 'es-AR', decimalPlaces)}
                </span>
            </div>
        );
    };


    // ========================================
    // DOMINANT CURRENCY LOGIC (Must be top-level hook)
    // ========================================
    // Determine which currency has the highest committed volume to prioritize it in sorting
    const dominantCurrencyCode = useMemo(() => {
        if (!summary || summary.length === 0) return primaryCurrencyCode;

        // Find the summary item with the highest functional committed amount
        const dominant = summary.reduce((prev, current) => {
            return (current.total_functional_committed_amount > prev.total_functional_committed_amount)
                ? current
                : prev;
        }, summary[0]);

        return dominant.currency_code || primaryCurrencyCode;
    }, [summary, primaryCurrencyCode]);

    // ========================================
    // KPI CALCULATIONS
    // ========================================
    const kpis = useMemo(() => {
        // Calculate Totals using Smart Logic (Hook)

        // Committed: Map summary to MonetaryItem interface
        const totalCommitted = sumDisplayAmounts(summary.map(s => ({
            amount: s.total_committed_amount,
            functional_amount: s.total_functional_committed_amount,
            currency_code: s.currency_code
        })));

        // Paid: Map payments to MonetaryItem interface
        const totalPaid = sumDisplayAmounts(payments.map(p => ({
            amount: Number(p.amount),
            functional_amount: Number(p.functional_amount),
            currency_code: p.currency_code
        })));

        // Balance: Derived or Summed
        // Better to sum individual balances to be precise with currency mix
        const totalBalance = sumDisplayAmounts(summary.map(s => ({
            amount: s.balance_due,
            functional_amount: s.functional_balance_due,
            currency_code: s.currency_code
        })));


        // ========================================
        // BREAKDOWN HELPER
        // ========================================
        const calculateBreakdown = (
            items: { amount: number, functional: number, currencyCode?: string, symbol?: string }[]
        ): CurrencyBreakdownItem[] => {
            const grouped = items.reduce((acc, item) => {
                const code = item.currencyCode || primaryCurrencyCode;
                if (!acc[code]) {
                    acc[code] = {
                        currencyCode: code,
                        symbol: item.symbol || '$',
                        nativeTotal: 0,
                        functionalTotal: 0,
                        isPrimary: code === primaryCurrencyCode
                    };
                }
                acc[code].nativeTotal += Number(item.amount) || 0;
                acc[code].functionalTotal += Number(item.functional) || 0;
                return acc;
            }, {} as Record<string, CurrencyBreakdownItem>);

            return Object.values(grouped)
                .filter(g => g.nativeTotal !== 0)
                .sort((a, b) => {
                    // Critical Request: Sort by "Commitment Currency" (Dominant) first
                    const isADominant = a.currencyCode === dominantCurrencyCode;
                    const isBDominant = b.currencyCode === dominantCurrencyCode;

                    if (isADominant && !isBDominant) return -1;
                    if (!isADominant && isBDominant) return 1;

                    // Secondary sort: Primary Currency
                    if (a.isPrimary) return -1;
                    if (b.isPrimary) return 1;

                    return a.currencyCode.localeCompare(b.currencyCode);
                });
        };

        const committedBreakdown = calculateBreakdown(summary.map(s => ({
            amount: s.total_committed_amount,
            functional: s.total_functional_committed_amount,
            currencyCode: s.currency_code || undefined,
            symbol: s.currency_symbol || undefined
        })));

        const paidBreakdown = calculateBreakdown(payments.map(p => ({
            amount: p.amount,
            functional: p.functional_amount || p.amount,
            currencyCode: p.currency_code || undefined,
            symbol: p.currency_symbol || undefined
        })));

        const balanceBreakdown = calculateBreakdown(summary.map(s => ({
            amount: s.balance_due,
            functional: s.functional_balance_due,
            currencyCode: s.currency_code || undefined,
            symbol: s.currency_symbol || undefined
        })));


        // Monthly Average
        const monthsWithPayments = new Set(payments.map(p =>
            p.payment_month || (p.payment_date ? p.payment_date.substring(0, 7) : '')
        )).size || 1;

        // NOTE: totalPaid is currently calculated using sumDisplayAmounts, which uses 'displayCurrency'.
        // If we want Average in Dominant Currency, we might need a separate total.
        // But assuming User switches "Mix/Ref" view, totalPaid changes context.
        // The Monthly Average KPI in 'render' section below formats this value.
        // We should ensure the FORMATTING in the render section uses 'dominantCurrencyCode'.
        const monthlyAverage = totalPaid / (monthsWithPayments || 1);

        // Trend Logic
        // Calculate totals by month using smart logic
        const paymentsByMonth = payments.reduce((acc, p) => {
            const month = p.payment_month || (p.payment_date ? p.payment_date.substring(0, 7) : '');
            if (!month) return acc;

            const val = calculateDisplayAmount({
                amount: Number(p.amount),
                functional_amount: Number(p.functional_amount),
                currency_code: p.currency_code
            });

            acc[month] = (acc[month] || 0) + val;
            return acc;
        }, {} as Record<string, number>);

        const now = new Date();
        const thisMonth = now.toISOString().slice(0, 7);
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonth = lastMonthDate.toISOString().slice(0, 7);

        const thisMonthTotal = paymentsByMonth[thisMonth] || 0;
        const lastMonthTotal = paymentsByMonth[lastMonth] || 0;
        const trendPercent = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100) : 0;

        return {
            totalCommitted,
            totalPaid,
            totalBalance,
            monthlyAverage,
            trendPercent,
            trendDirection: trendPercent > 0 ? "up" : trendPercent < 0 ? "down" : "neutral" as "up" | "down" | "neutral",
            committedBreakdown,
            paidBreakdown,
            balanceBreakdown,
            dominantCurrencyCode // Export this for UI usage
        };
    }, [summary, payments, sumDisplayAmounts, calculateDisplayAmount, primaryCurrencyCode]);

    // ========================================
    // CHART DATA: PAYMENT EVOLUTION + BALANCE
    // ========================================
    const evolutionData = useMemo(() => {
        // Total committed amount across all summary items
        const totalCommitted = summary.reduce((acc, s) => {
            // Use the display amount logic to handle multi-currency
            const val = calculateDisplayAmount({
                amount: Number(s.total_committed_amount),
                functional_amount: Number(s.total_functional_committed_amount) || null, // Use actual functional amount
                currency_code: s.currency_code
            });
            return acc + val;
        }, 0);

        // Group payments by month
        const grouped = payments.reduce((acc, p) => {
            let monthKey = "";
            if (p.payment_month) {
                monthKey = String(p.payment_month).slice(0, 7);
            } else if (p.payment_date) {
                monthKey = String(p.payment_date).slice(0, 7);
            }

            if (monthKey) {
                const val = calculateDisplayAmount({
                    amount: Number(p.amount),
                    functional_amount: Number(p.functional_amount),
                    currency_code: p.currency_code
                });
                acc[monthKey] = (acc[monthKey] || 0) + val;
            }
            return acc;
        }, {} as Record<string, number>);

        // First: Sort chronologically, THEN calculate cumulative balance
        const sortedMonths = Object.entries(grouped)
            .filter(([month]) => month && month.length >= 7)
            .sort(([a], [b]) => a.localeCompare(b)) // Sort first!
            .slice(-12);

        // Now calculate cumulative paid and remaining balance in correct order
        let cumulativePaid = 0;
        return sortedMonths.map(([month, paid]) => {
            const [year, monthNum] = month.split('-').map(Number);
            const date = new Date(year, (monthNum || 1) - 1, 1);
            const formatted = isNaN(date.getTime())
                ? month
                : new Intl.DateTimeFormat('es', { month: 'short', year: '2-digit' }).format(date);

            cumulativePaid += paid;
            const balance = totalCommitted - cumulativePaid;

            return {
                month: formatted,
                rawMonth: month,
                paid,
                balance: Math.max(0, balance) // Saldo pendiente (decreases as you pay)
            };
        });
    }, [payments, summary, calculateDisplayAmount]);

    // Custom colors for this specific chart using centralized financial variables
    const evolutionChartConfig: ChartConfig = {
        paid: { label: "Cobrado", color: "var(--amount-positive)" },
        balance: { label: "Saldo Pendiente", color: "var(--amount-negative)" }
    };

    // ========================================
    // CHART DATA: CLIENT DISTRIBUTION
    // ========================================
    const distributionData = useMemo(() => {
        const clientTotals = payments.reduce((acc, p) => {
            const clientName = p.client_name || "Desconocido";
            const val = calculateDisplayAmount({
                amount: Number(p.amount),
                functional_amount: Number(p.functional_amount),
                currency_code: p.currency_code
            });

            acc[clientName] = (acc[clientName] || 0) + val;
            return acc;
        }, {} as Record<string, number>);

        const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

        return Object.entries(clientTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, value], i) => ({
                name,
                value,
                fill: colors[i % colors.length]
            }));
    }, [payments, calculateDisplayAmount]);

    const distributionChartConfig: ChartConfig = distributionData.reduce((acc, item, i) => {
        acc[item.name] = { label: item.name, color: item.fill };
        return acc;
    }, {} as ChartConfig);

    // ========================================
    // INSIGHTS GENERATION
    // --- 7. GENERATE INSIGHTS (Using Adapter) ---
    const { dismissedIds, dismissInsight } = useInsightPersistence('clients-overview');

    const insights = useMemo(() => {
        const rawInsights = generateClientInsights({
            summary: summary,
            payments: payments,
            kpis: kpis,
            primaryCurrencyCode: primaryCurrencyCode || 'USD',
            displayCurrency: displayCurrency as 'primary' | 'secondary',
            formatCurrency: (amount, code) => formatCurrencyUtil(amount, code || displayCurrencyCode, 'es-AR', decimalPlaces),
            currentRate: currentRate || 1,
            secondaryCurrencyCode: secondaryCurrencyObj?.code,
            calculateDisplayAmount
        });

        // Filter out dismissed insights
        return rawInsights.filter(insight => !dismissedIds.has(insight.id));
    }, [summary, payments, kpis, primaryCurrencyCode, displayCurrency, displayCurrencyCode, currentRate, secondaryCurrencyObj?.code, calculateDisplayAmount, dismissedIds]);


    // --- 8. ACTION HANDLERS ---
    const handleAction = (action: InsightAction) => {
        // ... existing handleAction logic ...
    };

    // ========================================
    // RECENT ACTIVITY
    // ========================================
    const recentActivity = payments.slice(0, 5);

    // Dynamic Labels for Balance (Local Logic)
    const balanceTitle = kpis.totalBalance < 0 ? "Saldo a Favor / Excedente" : "Saldo Pendiente";
    const balanceSubtitle = kpis.totalBalance < 0 ? "Cobrado en exceso" : "Por cobrar";

    // ========================================
    // RENDER
    // ========================================
    return (
        <div className="space-y-6">
            {/* ROW 1: Unified Financial Summary (MIGRATED TO DASHBOARD CARD) */}
            <DashboardCard
                title="Resumen Financiero"
                description="Balance general y estado de cuentas"
                icon={<Wallet className="w-5 h-5" />}
                headerAction={
                    showCurrencySelector && referenceCurrency && (
                        <div className="flex items-center gap-2">
                            <Tabs
                                value={viewMode}
                                onValueChange={(v) => setViewMode(v as any)}
                                className="h-8"
                            >
                                <TabsList className="h-9 grid w-[200px] grid-cols-2">
                                    <TabsTrigger value="mix" className="text-xs">
                                        Mix Real
                                    </TabsTrigger>
                                    <TabsTrigger value="ref" className="text-xs">
                                        Ref: {referenceCurrency.code}
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    )
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-2">
                    {/* 1. Compromisos */}
                    <div className="space-y-2">
                        <div className="h-6 flex items-center">
                            <p className="text-sm font-medium text-muted-foreground">Compromisos Totales</p>
                        </div>
                        <div className="min-h-[3rem] flex items-center">
                            {renderFinancialValue(kpis.totalCommitted, kpis.committedBreakdown)}
                        </div>
                        <p className="text-xs text-muted-foreground">Valor total de contratos</p>
                    </div>

                    {/* 2. Cobrado */}
                    <div className="space-y-2">
                        <div className="h-6 flex items-center justify-between">
                            <p className="text-sm font-medium text-muted-foreground">Cobrado a la Fecha</p>
                            {kpis.trendPercent !== 0 && (
                                <span className={cn(
                                    "text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1",
                                    kpis.trendDirection === "up" ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"
                                )}>
                                    {kpis.trendDirection === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {Math.abs(kpis.trendPercent).toFixed(0)}%
                                </span>
                            )}
                        </div>
                        <div className="min-h-[3rem] flex items-center">
                            {renderFinancialValue(kpis.totalPaid, kpis.paidBreakdown)}
                        </div>
                        <p className="text-xs text-muted-foreground">Ingresos reales</p>
                    </div>

                    {/* 3. Saldo */}
                    <div className="space-y-2">
                        <div className="h-6 flex items-center">
                            <p className="text-sm font-medium text-muted-foreground">{balanceTitle}</p>
                        </div>
                        <div className="min-h-[3rem] flex items-center">
                            {(() => {
                                const positiveItem = kpis.balanceBreakdown.find(i => i.nativeTotal > 0);
                                const negativeItem = kpis.balanceBreakdown.find(i => i.nativeTotal < 0);
                                const hasCrossCurrencyMix = isMixView && !!positiveItem && !!negativeItem && positiveItem.currencyCode !== negativeItem.currencyCode;

                                if (hasCrossCurrencyMix && positiveItem) {
                                    // Cross-Currency Case: Debt in A, Credit in B.
                                    // Goal: Show Net Balance in Debt Currency (A).

                                    // Use global exchangeRate (Market Rate) not display rate (which is 1 in Primary View)
                                    // If Debt is Primary (e.g. ARS) and we have Ref (USD) available
                                    if (positiveItem.isPrimary) {
                                        // TRUE NOMINAL BALANCE CALCULATION
                                        // Goal: Calculate how much ARS is pending based on historical payments.
                                        // 1. Start with Total Committed ARS
                                        const totalCommittedARS = positiveItem.nativeTotal; // Assumption: Commitment is fully in ARS if nativeTotal > 0 and it's the only positive item? 
                                        // Actually positiveItem.nativeTotal from 'balanceBreakdown' is simply (Committed - PaidSameCurrency). 
                                        // It does not account for PaidOtherCurrency.
                                        // So we need to reconstruct: Balance = CommittedARS - Sum(All Payments converted to ARS).

                                        // We can find Total Committed in this currency from 'committedBreakdown'
                                        const committedItem = kpis.committedBreakdown.find(c => c.currencyCode === positiveItem.currencyCode);
                                        const initialDebt = committedItem ? committedItem.nativeTotal : 0;

                                        // Calculate Total Paid converted to this currency (Historic)
                                        const totalPaidConverted = payments.reduce((acc, p) => {
                                            // 1. Payment in same currency (ARS)
                                            if (p.currency_code === positiveItem.currencyCode) {
                                                return acc + Number(p.amount);
                                            }
                                            // 2. Payment in Reference/Other (USD) -> Convert to ARS
                                            // Rule: We need the rate used at moment of payment. 
                                            // stored 'exchange_rate' is (ARS per USD).
                                            // If p is USD, ARS = p.amount * p.exchange_rate
                                            if (p.exchange_rate) {
                                                if (p.currency_code !== positiveItem.currencyCode) {
                                                    return acc + (Number(p.amount) * Number(p.exchange_rate));
                                                }
                                            }
                                            return acc;
                                        }, 0);

                                        const trueNominalBalance = initialDebt - totalPaidConverted;

                                        return (
                                            <div className="flex flex-col">
                                                <span className="text-3xl font-bold tracking-tight">
                                                    {formatCurrencyUtil(trueNominalBalance, primaryCurrencyCode, 'es-AR', decimalPlaces)}
                                                </span>
                                                <span className="text-xs text-muted-foreground italic">(Nominal Histórico)</span>
                                            </div>
                                        );
                                    }

                                    // If Debt is Secondary/Ref, just show the Net Functional directly
                                    if (!positiveItem.isPrimary) {
                                        return (
                                            <div className="flex flex-col">
                                                <span className="text-3xl font-bold tracking-tight">
                                                    {formatCurrencyUtil(kpis.totalBalance, positiveItem.currencyCode, 'es-AR', decimalPlaces)}
                                                </span>
                                                <span className="text-xs text-muted-foreground italic">(Neto)</span>
                                            </div>
                                        );
                                    }
                                }

                                return renderFinancialValue(kpis.totalBalance, kpis.balanceBreakdown);
                            })()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {balanceSubtitle}
                        </p>
                    </div>

                    {/* 4. Promedio */}
                    <div className="space-y-2">
                        <div className="h-6 flex items-center">
                            <p className="text-sm font-medium text-muted-foreground">Promedio Mensual</p>
                        </div>
                        <div className="min-h-[3rem] flex items-center">
                            <div className="flex flex-col">
                                <span className="text-3xl font-bold tracking-tight">
                                    {formatCurrencyUtil(kpis.monthlyAverage, kpis.dominantCurrencyCode || secondaryCurrencyObj?.code || referenceCurrency?.code || primaryCurrencyCode, 'es-AR', decimalPlaces)}
                                </span>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Ingreso promedio / mes</p>
                    </div>
                </div>
            </DashboardCard>

            {/* ROW 2: Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
                <DashboardCard
                    title="Evolución de Cobros"
                    description="Pagos vs Saldo pendiente"
                    icon={<BarChart3 className="w-4 h-4" />}
                >
                    {evolutionData.length > 0 ? (
                        <BaseDualAreaChart
                            data={evolutionData}
                            xKey="month"
                            primaryKey="paid"
                            secondaryKey="balance"
                            primaryLabel="Cobrado"
                            secondaryLabel="Saldo Pendiente"
                            height={250}
                            config={evolutionChartConfig}
                            gradient
                            showLegend
                        />
                    ) : (
                        <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                            Sin datos de cobros
                        </div>
                    )}
                </DashboardCard>

                <DashboardCard
                    title="Distribución por Cliente"
                    description="Top 5 clientes por monto cobrado"
                    icon={<PieChart className="w-4 h-4" />}
                >
                    {distributionData.length > 0 ? (
                        <div className="flex items-center gap-4">
                            <BaseDonutChart
                                data={distributionData}
                                nameKey="name"
                                valueKey="value"
                                height={200}
                                config={distributionChartConfig}
                            />
                            <div className="flex-1 space-y-2">
                                {distributionData.map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                                        <span className="flex-1 truncate text-muted-foreground">{item.name}</span>
                                        <span className="font-medium">{formatCurrencyUtil(item.value, displayCurrencyCode, 'es-AR', decimalPlaces)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                            Sin datos de clientes
                        </div>
                    )}
                </DashboardCard>
            </div>

            {/* ROW 3: Insights & Activity */}
            <div className="grid gap-6 lg:grid-cols-2">
                <DashboardCard
                    title="Insights"
                    description="Análisis automático de tu cartera"
                    icon={<Lightbulb className="w-4 h-4" />}
                >
                    {/* INSIGHTS LIST */}
                    {insights.length > 0 && (
                        <div className="space-y-4">
                            {insights.map((insight) => (
                                <InsightCard
                                    key={insight.id}
                                    insight={insight}
                                    onAction={handleAction}
                                    onDismiss={dismissInsight}
                                />
                            ))}
                        </div>
                    )}
                    {insights.length === 0 && (
                        <div className="h-[150px] flex items-center justify-center text-muted-foreground text-sm">
                            No hay insights disponibles
                        </div>
                    )}
                </DashboardCard>

                <DashboardCard
                    title="Actividad Reciente"
                    description="Últimos cobros registrados"
                    icon={<Activity className="w-4 h-4" />}
                >
                    {recentActivity.length > 0 ? (
                        <div className="space-y-4">
                            {recentActivity.map((payment, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={payment.client_avatar_url || undefined} />
                                        <AvatarFallback className="text-xs">
                                            {(payment.client_name || "?")[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {payment.client_name || "Cliente desconocido"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(payment.payment_date), { addSuffix: true, locale: es })}
                                        </p>
                                    </div>
                                    <span className="text-sm font-semibold text-amount-positive">
                                        {/* Activity stays as original usually */}
                                        +{payment.currency_symbol || "$"} {Number(payment.amount).toLocaleString('es-AR')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-[150px] flex items-center justify-center text-muted-foreground text-sm">
                            Sin actividad reciente
                        </div>
                    )}
                </DashboardCard>
            </div>
        </div>
    );
}
