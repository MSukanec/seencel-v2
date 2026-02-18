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
import { useCurrency } from "@/stores/organization-store";
import { useCurrencyOptional } from "@/stores/organization-store";
import { useFinancialFeatures } from "@/hooks/use-financial-features";
import { useMoney } from "@/hooks/use-money";
import { sumMoney, calculateDisplayAmount as calcDisplayAmount } from "@/lib/money/money-service";
import { createMoney } from "@/lib/money/money";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { ContentLayout } from "@/components/layout/dashboard/shared/content-layout";
import { DateRangeFilter, type DateRangeFilterValue } from "@/components/layout/dashboard/shared/toolbar/toolbar-date-range-filter";
import { parseDateFromDB } from "@/lib/timezone-data";
import { useActiveProjectId } from "@/stores/layout-store";

interface ClientsOverviewProps {
    summary: ClientFinancialSummary[];
    payments: ClientPaymentView[];
}

export function ClientsOverview({ summary, payments }: ClientsOverviewProps) {
    const activeProjectId = useActiveProjectId();

    // === Project filter (from header selector) ===
    const projectPayments = useMemo(() => {
        if (!activeProjectId) return payments;
        return payments.filter(p => p.project_id === activeProjectId);
    }, [payments, activeProjectId]);

    const projectSummary = useMemo(() => {
        if (!activeProjectId) return summary;
        return summary.filter(s => s.project_id === activeProjectId);
    }, [summary, activeProjectId]);

    // === Date Range Filter (absorbed from page orchestrator) ===
    const [dateRange, setDateRange] = useState<DateRangeFilterValue | undefined>(undefined);

    const filteredPayments = useMemo(() => {
        if (!dateRange?.from && !dateRange?.to) return projectPayments;
        return projectPayments.filter(p => {
            const paymentDate = parseDateFromDB(p.payment_date);
            if (!paymentDate) return true;
            if (dateRange?.from && paymentDate < dateRange.from) return false;
            if (dateRange?.to && paymentDate > dateRange.to) return false;
            return true;
        });
    }, [projectPayments, dateRange]);

    // All calculations below use the date-filtered payments
    const effectivePayments = filteredPayments;

    // === Centralized money operations ===
    const money = useMoney();

    // Derived values from money hook (compatibility aliases)
    const calculateDisplayAmount = money.calculateDisplayAmount;
    const displayCurrencyCode = money.displayCurrencyCode;
    const isSecondaryDisplay = money.displayMode === 'secondary';
    const currentRate = money.config.currentExchangeRate;
    const primaryCurrencyCode = money.primaryCurrencyCode;

    // Sum helper using money
    const sumDisplayAmounts = <T extends { amount: number; currency_code?: string | null; exchange_rate?: number | null }>(items: T[]): number => {
        return money.sum(items).total;
    };

    // We still need context for specific currency objects (symbol etc) for breakdowns
    const {
        allCurrencies,
        primaryCurrency: primaryCurrencyObj,
        secondaryCurrency: secondaryCurrencyObj,
        currentExchangeRate: marketRate,
    } = useCurrency();

    // Decimal-aware formatting (from useMoney)
    const formatNumber = money.formatNumber;

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

    // View mode controlled by useMoney (synced with toolbar via setDisplayMode)
    const isMixView = money.displayMode === 'mix';
    const isReferenceView = money.displayMode === 'secondary';

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
                    {money.format(primaryValue, isReferenceView && referenceCurrency ? referenceCurrency.code : primaryCurrencyObj?.code)}
                </span>
            </div>
        );
    };


    // ========================================
    // DOMINANT CURRENCY LOGIC (Must be top-level hook)
    // ========================================
    // Determine which currency has the highest committed volume to prioritize it in sorting
    const dominantCurrencyCode = useMemo(() => {
        if (!projectSummary || projectSummary.length === 0) return primaryCurrencyCode;

        // Find the summary item with the highest committed amount
        const dominant = projectSummary.reduce((prev, current) => {
            return (current.total_committed_amount > prev.total_committed_amount)
                ? current
                : prev;
        }, projectSummary[0]);

        return dominant.currency_code || primaryCurrencyCode;
    }, [projectSummary, primaryCurrencyCode]);

    // Secondary currency code for comparisons
    const secondaryCurrencyCode = money.config.secondaryCurrencyCode;

    // ========================================
    // EFFECTIVE DISPLAY MODE FOR CALCULATIONS
    // ========================================
    // In Mix mode, we use the dominant currency for all calculations
    // This ensures charts and totals are comparable (same currency unit)
    const effectiveDisplayMode = useMemo(() => {
        if (money.displayMode === 'mix') {
            // In mix mode, convert everything to the dominant currency
            return dominantCurrencyCode === secondaryCurrencyCode ? 'secondary' : 'functional';
        }
        return money.displayMode;
    }, [money.displayMode, dominantCurrencyCode, secondaryCurrencyCode]);

    // KPI CALCULATIONS
    // ========================================
    const kpis = useMemo(() => {
        // Calculate Totals using Money Service with EFFECTIVE display mode
        // In Mix mode, this uses the dominant currency for calculations
        const config = money.config;

        // Committed: Use exchange_rate from summary (stored at commitment time)
        const committedResult = sumMoney(
            projectSummary.map(s => ({
                amount: s.total_committed_amount,
                currency_code: s.currency_code,
                exchange_rate: Number(s.commitment_exchange_rate) || currentRate
            })),
            effectiveDisplayMode,
            config
        );
        const totalCommitted = committedResult.total;

        // Paid: Map payments to MonetaryItem interface
        const paidResult = sumMoney(
            effectivePayments.map(p => ({
                amount: Number(p.amount),
                currency_code: p.currency_code,
                exchange_rate: Number(p.exchange_rate) || currentRate
            })),
            effectiveDisplayMode,
            config
        );
        const totalPaid = paidResult.total;

        // Balance: Simple arithmetic - committed minus paid (both already converted)
        // This is the correct approach because totalCommitted and totalPaid are already
        // normalized to the display currency, so balance = committed - paid
        const totalBalance = totalCommitted - totalPaid;


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

        const committedBreakdown = calculateBreakdown(projectSummary.map(s => ({
            amount: s.total_committed_amount,
            functional: s.total_committed_amount, // Will be recalculated by view if needed
            currencyCode: s.currency_code || undefined,
            symbol: s.currency_symbol || undefined
        })));

        const paidBreakdown = calculateBreakdown(effectivePayments.map(p => ({
            amount: p.amount,
            functional: p.amount * (Number(p.exchange_rate) || 1),
            currencyCode: p.currency_code || undefined,
            symbol: p.currency_symbol || undefined
        })));

        const balanceBreakdown = calculateBreakdown(projectSummary.map(s => ({
            amount: s.balance_due,
            functional: s.balance_due, // No conversion needed for breakdown display
            currencyCode: s.currency_code || undefined,
            symbol: s.currency_symbol || undefined
        })));


        // Monthly Average - Use FUNCTIONAL values for consistency
        const monthsWithPayments = new Set(effectivePayments.map(p =>
            p.payment_month || (p.payment_date ? p.payment_date.substring(0, 7) : '')
        )).size || 1;

        // Calculate total paid using display amount logic
        const totalPaidFunctional = effectivePayments.reduce((acc, p) => {
            return acc + calculateDisplayAmount({
                amount: Number(p.amount),
                currency_code: p.currency_code,
                exchange_rate: Number(p.exchange_rate) || 1
            });
        }, 0);

        const monthlyAverage = totalPaidFunctional / (monthsWithPayments || 1);

        // Trend Logic
        // Calculate totals by month using smart logic
        const paymentsByMonth = effectivePayments.reduce((acc, p) => {
            const month = p.payment_month || (p.payment_date ? p.payment_date.substring(0, 7) : '');
            if (!month) return acc;

            const val = calculateDisplayAmount({
                amount: Number(p.amount),
                currency_code: p.currency_code,
                exchange_rate: Number(p.exchange_rate) || 1
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
    }, [projectSummary, effectivePayments, effectiveDisplayMode, money.config, calculateDisplayAmount, primaryCurrencyCode, currentRate]);

    // ========================================
    // CHART DATA: PAYMENT EVOLUTION + BALANCE
    // ========================================
    const evolutionData = useMemo(() => {
        const config = money.config;

        // Total committed amount across all summary items (using effective mode)
        const totalCommitted = projectSummary.reduce((acc, s) => {
            const moneyItem = createMoney({
                amount: Number(s.total_committed_amount),
                currency_code: s.currency_code,
                exchange_rate: Number(s.commitment_exchange_rate) || currentRate
            }, config);
            const val = calcDisplayAmount(moneyItem, effectiveDisplayMode, config);
            return acc + val;
        }, 0);

        // Group payments by month (using effective mode)
        const grouped = effectivePayments.reduce((acc, p) => {
            let monthKey = "";
            if (p.payment_month) {
                monthKey = String(p.payment_month).slice(0, 7);
            } else if (p.payment_date) {
                monthKey = String(p.payment_date).slice(0, 7);
            }

            if (monthKey) {
                const moneyItem = createMoney({
                    amount: Number(p.amount),
                    currency_code: p.currency_code,
                    exchange_rate: Number(p.exchange_rate) || currentRate
                }, config);
                const val = calcDisplayAmount(moneyItem, effectiveDisplayMode, config);
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
    }, [effectivePayments, projectSummary, effectiveDisplayMode, money.config, currentRate]);

    // Custom colors for this specific chart using centralized financial variables
    const evolutionChartConfig: ChartConfig = {
        paid: { label: "Cobrado", color: "var(--amount-positive)" },
        balance: { label: "Saldo Pendiente", color: "var(--amount-negative)" }
    };

    // ========================================
    // CHART DATA: CLIENT DISTRIBUTION
    // ========================================
    const distributionData = useMemo(() => {
        const config = money.config;
        const clientTotals = effectivePayments.reduce((acc, p) => {
            const clientName = p.client_name || "Desconocido";
            const moneyItem = createMoney({
                amount: Number(p.amount),
                currency_code: p.currency_code,
                exchange_rate: Number(p.exchange_rate) || currentRate
            }, config);
            const val = calcDisplayAmount(moneyItem, effectiveDisplayMode, config);

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
    }, [effectivePayments, effectiveDisplayMode, money.config, currentRate]);

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
            summary: projectSummary,
            payments: effectivePayments,
            kpis: kpis,
            primaryCurrencyCode: primaryCurrencyCode || 'USD',
            displayCurrency: money.displayMode === 'secondary' ? 'secondary' : 'primary',
            formatCurrency: (amount, code) => money.format(amount, code || displayCurrencyCode),
            currentRate: currentRate || 1,
            secondaryCurrencyCode: secondaryCurrencyObj?.code,
            calculateDisplayAmount
        });

        // Filter out dismissed insights
        return rawInsights.filter(insight => !dismissedIds.has(insight.id));
    }, [projectSummary, effectivePayments, kpis, primaryCurrencyCode, money.displayMode, displayCurrencyCode, currentRate, secondaryCurrencyObj?.code, calculateDisplayAmount, dismissedIds, money]);


    // --- 8. ACTION HANDLERS ---
    const handleAction = (action: InsightAction) => {
        // ... existing handleAction logic ...
    };

    // ========================================
    // RECENT ACTIVITY
    // ========================================
    const recentActivity = effectivePayments.slice(0, 5);

    // Dynamic Labels for Balance (Local Logic)
    const balanceTitle = kpis.totalBalance < 0 ? "Saldo a Favor / Excedente" : "Saldo Pendiente";
    const balanceSubtitle = kpis.totalBalance < 0 ? "Cobrado en exceso" : "Por cobrar";

    // ========================================
    // RENDER
    // ========================================
    return (
        <>
            {/* Toolbar with date range filter for overview */}
            <Toolbar
                portalToHeader={true}
                leftActions={
                    <DateRangeFilter
                        title="Período"
                        value={dateRange}
                        onChange={(value) => setDateRange(value)}
                    />
                }
            />
            <ContentLayout variant="wide">
                <div className="space-y-6">
                    {/* ROW 1: KPI Grid - 2x2 on mobile, 1x4 on desktop (Idéntico a Finanzas) */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* 1. Compromisos Totales */}
                        <DashboardKpiCard
                            title="Compromisos Totales"
                            value={isMixView && kpis.committedBreakdown.length === 1
                                ? `${kpis.committedBreakdown[0].symbol} ${formatNumber(kpis.committedBreakdown[0].nativeTotal)}`
                                : money.format(kpis.totalCommitted)
                            }
                            icon={<FileText className="h-5 w-5" />}
                            iconClassName="bg-primary/10 text-primary"
                            description="Valor total de contratos"
                            currencyBreakdown={isMixView && kpis.committedBreakdown.length > 1 ? kpis.committedBreakdown : undefined}
                            size="hero"
                            compact
                        />

                        {/* 2. Cobrado a la Fecha */}
                        <DashboardKpiCard
                            title="Cobrado a la Fecha"
                            value={isMixView && kpis.paidBreakdown.length === 1
                                ? `${kpis.paidBreakdown[0].symbol} ${formatNumber(kpis.paidBreakdown[0].nativeTotal)}`
                                : money.format(kpis.totalPaid)
                            }
                            icon={<TrendingUp className="h-5 w-5" />}
                            iconClassName="bg-amount-positive/10 text-amount-positive"
                            description="Ingresos reales"
                            trend={kpis.trendPercent !== 0 ? {
                                value: `${Math.abs(kpis.trendPercent).toFixed(0)}%`,
                                direction: kpis.trendDirection as "up" | "down" | "neutral"
                            } : undefined}
                            currencyBreakdown={isMixView && kpis.paidBreakdown.length > 1 ? kpis.paidBreakdown : undefined}
                            size="hero"
                            compact
                        />

                        {/* 3. Saldo / Balance */}
                        <DashboardKpiCard
                            title={balanceTitle}
                            value={money.formatWithSign(kpis.totalBalance)}
                            icon={<Wallet className="h-5 w-5" />}
                            iconClassName={kpis.totalBalance >= 0 ? "bg-primary/10 text-primary" : "bg-amount-negative/10 text-amount-negative"}
                            description={balanceSubtitle}
                            size="hero"
                            compact
                            className={kpis.totalBalance >= 0 ? "" : "[&_h2]:text-amount-negative"}
                        />

                        {/* 4. Promedio Mensual */}
                        <DashboardKpiCard
                            title="Promedio Mensual"
                            value={money.format(kpis.monthlyAverage)}
                            icon={<Activity className="h-5 w-5" />}
                            description="Ingreso promedio / mes"
                            size="hero"
                            compact
                        />
                    </div>

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
                                <BaseDonutChart
                                    data={distributionData}
                                    nameKey="name"
                                    valueKey="value"
                                    height={200}
                                    config={distributionChartConfig}
                                    legendFormatter={(val) => money.format(val)}
                                    tooltipFormatter={(val) => money.format(val)}
                                />
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
                                    {recentActivity.map((payment, i) => {
                                        const hasCreatorAvatar = payment.creator_avatar_url;
                                        const creatorInitial = payment.creator_full_name?.charAt(0)?.toUpperCase() || '?';

                                        return (
                                            <div key={i} className="flex items-center gap-3">
                                                {/* Creator Avatar (como en Finanzas) */}
                                                {hasCreatorAvatar ? (
                                                    <img
                                                        src={payment.creator_avatar_url || undefined}
                                                        alt={payment.creator_full_name || 'Usuario'}
                                                        className="h-9 w-9 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                                                        {creatorInitial}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">
                                                        {payment.client_name || "Pago registrado"}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {payment.creator_full_name && <span>{payment.creator_full_name} · </span>}
                                                        {formatDistanceToNow(parseDateFromDB(payment.payment_date) || new Date(), { addSuffix: true, locale: es })}
                                                    </p>
                                                </div>
                                                <span className="text-sm font-semibold text-amount-positive">
                                                    +{payment.currency_symbol || "$"} {Number(payment.amount).toLocaleString('es-AR')}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="h-[150px] flex items-center justify-center text-muted-foreground text-sm">
                                    Sin actividad reciente
                                </div>
                            )}
                        </DashboardCard>
                    </div>
                </div>
            </ContentLayout>
        </>
    );
}

