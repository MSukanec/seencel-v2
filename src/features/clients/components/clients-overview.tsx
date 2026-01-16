"use client";

import { useMemo } from "react";
import { DashboardKpiCard, CurrencyBreakdownItem } from "@/components/dashboard/dashboard-kpi-card";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { InsightCard } from "@/features/insights/components/insight-card";
import { Insight } from "@/features/insights/types";
import { generateClientInsights } from "@/features/insights/logic/clients";
import { BaseAreaChart } from "@/components/charts/base-area-chart";
import { BaseDonutChart } from "@/components/charts/base-donut-chart";
import { ClientFinancialSummary, ClientPaymentView } from "../types";
import { FileText, DollarSign, Clock, TrendingUp, BarChart3, PieChart, Lightbulb, Activity, CheckCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ChartConfig } from "@/components/ui/chart";
import { useCurrencyOptional } from "@/providers/currency-context";
import { formatCurrency as formatCurrencyUtil, sumMonetaryAmounts, getAmountsByCurrency } from "@/lib/currency-utils";

interface ClientsOverviewProps {
    summary: ClientFinancialSummary[];
    payments: ClientPaymentView[];
}

export function ClientsOverview({ summary, payments }: ClientsOverviewProps) {
    const currencyContext = useCurrencyOptional();

    // ========================================
    // HELPERS - Use context currency or fallback to ARS
    // ========================================
    const primaryCurrencyCode = currencyContext?.primaryCurrency?.code || 'ARS';
    const displayCurrency = currencyContext?.displayCurrency || 'primary';

    const formatCurrency = (amount: number, currencyCode?: string) => {
        // If a specific currency code is provided, use it (e.g. in list items)
        if (currencyCode) {
            return formatCurrencyUtil(amount, currencyCode);
        }

        // Otherwise, respect the global display preference
        if (displayCurrency === 'secondary' && currencyContext?.secondaryCurrency) {
            // Convert from functional to secondary
            const converted = currencyContext.convertFromFunctional(amount, currencyContext.secondaryCurrency);
            return formatCurrencyUtil(converted, currencyContext.secondaryCurrency);
        }

        // Default: Primary (Functional)
        return formatCurrencyUtil(amount, currencyContext?.primaryCurrency || 'ARS');
    };

    // ========================================
    // KPI CALCULATIONS
    // ========================================
    const kpis = useMemo(() => {
        // Use current exchange rate from context if not available in data
        // FALLBACK: If currentExchangeRate is 1 (default) or 0, try to use the static rate from secondary currency definition
        // This prevents showing ARS amounts as USD 1:1 when context rate isn't explicitly set by a date filter
        let currentRate = currencyContext?.currentExchangeRate || 0;
        if (currentRate <= 1 && currencyContext?.secondaryCurrency?.exchange_rate) {
            currentRate = currencyContext.secondaryCurrency.exchange_rate;
        }
        if (currentRate <= 0) currentRate = 1; // Last resort safety

        // ========================================
        // LOGICAL HELPERS FOR SMART AGGREGATION
        // ========================================
        // We want to sum the "Correct" amount based on display preference.
        // If Display = USD (Secondary):
        //    - USD items: Use original amount (Preserve History)
        //    - ARS items: Use functional amount / current rate (Convert present value)
        // If Display = ARS (Primary):
        //    - All items: Use functional amount (Preserve History)

        const calculateSmartTotal = (items: { functional: number, original: number, currencyCode?: string }[]) => {
            const targetCurrencyCode = displayCurrency === 'secondary' && currencyContext?.secondaryCurrency
                ? currencyContext.secondaryCurrency.code
                : primaryCurrencyCode;

            return items.reduce((acc, item) => {
                const itemCode = item.currencyCode || primaryCurrencyCode;

                // 1. Get the Functional Amount (Base Truth)
                const functional = item.functional || 0;

                // 2. Get the Original Amount (Raw Truth)
                const original = item.original || 0;

                // SMART LOGIC:
                if (displayCurrency === 'secondary') {
                    // We are calculating in USD (Secondary)
                    if (itemCode === targetCurrencyCode) {
                        // Item IS USD -> Use Original Value ! 
                        return acc + original;
                    } else {
                        // Item IS ARS -> Convert Functional / Current Rate
                        // Protect against division by zero
                        const rate = currentRate === 0 ? 1 : currentRate;
                        return acc + (functional / rate);
                    }
                } else {
                    // We are calculating in ARS (Primary)
                    // Always use Functional Amount which is the historical truth in ARS
                    return acc + functional;
                }
            }, 0);
        };

        // Calculate Totals using Smart Logic
        const totalCommitted = calculateSmartTotal(summary.map(s => ({
            functional: s.total_functional_committed_amount,
            original: s.total_committed_amount,
            currencyCode: s.currency_code || undefined
        })));

        const totalPaid = payments.length === 0 ? 0 : calculateSmartTotal(summary.map(s => ({
            functional: s.total_functional_paid_amount,
            original: s.total_paid_amount,
            // Force conversion from functional for payments to avoid mixed-currency sum issues in 'original'
            // treating all payments as effectively needing normalization to current rate if looking at USD.
            currencyCode: undefined
        })));

        // Derive Balance from the calculated totals to ensure Visual Consistency (A - B = C)
        // This avoids data drift between DB-cached balance and real-time converted Paid/Committed
        const totalBalance = totalCommitted - totalPaid;

        // Mapping for Currency Breakdown (Hover)
        // To match the main total, we need these to align.
        // However, the breakdown is usually "By Original Currency".
        // We keep existing mapped logic but ensure it uses functional for ARS mode.
        const mappedCommitted = summary.map(s => ({
            amount: displayCurrency === 'secondary' && s.currency_code !== primaryCurrencyCode
                ? s.total_committed_amount // Keep USD as USD
                : s.total_functional_committed_amount, // Convert everything else to Functional
            currency_code: displayCurrency === 'secondary' && s.currency_code !== primaryCurrencyCode
                ? s.currency_code // Keep code
                : primaryCurrencyCode, // Force ARS
            exchange_rate: 1
        }));

        // ... similar mapping for others if needed for charts, but charts use 'payments' array

        // Calculate monthly average from payments (Smart Logic)
        const paymentsByMonth = payments.reduce((acc, p) => {
            const month = p.payment_month || new Date(p.payment_date).toISOString().slice(0, 7);

            let val = 0;
            const pCode = p.currency_code || (p.currency_id ? 'UNKNOWN' : primaryCurrencyCode); // We might need to fetch code if not in view, but view has it.
            const targetCode = displayCurrency === 'secondary' ? currencyContext?.secondaryCurrency?.code : primaryCurrencyCode;

            if (displayCurrency === 'secondary') {
                if (pCode === targetCode) {
                    val = Number(p.amount);
                } else {
                    val = (Number(p.functional_amount) || Number(p.amount)) / currentRate;
                }
            } else {
                val = Number(p.functional_amount) || Number(p.amount);
            }

            acc[month] = (acc[month] || 0) + val;
            return acc;
        }, {} as Record<string, number>);

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

            return Object.values(grouped).filter(g => g.nativeTotal !== 0);
        };

        const committedBreakdown = calculateBreakdown(summary.map(s => ({
            amount: s.total_committed_amount,
            functional: s.total_functional_committed_amount,
            currencyCode: s.currency_code || undefined,
            symbol: s.currency_symbol || undefined
        })));

        // Use Payments for Paid Breakdown as it's more grounded in transaction reality
        const paidBreakdown = calculateBreakdown(payments.map(p => ({
            amount: p.amount,
            functional: p.functional_amount || p.amount, // Fallback if functional missing? Usually present.
            currencyCode: p.currency_code || undefined,
            symbol: p.currency_symbol || undefined
        })));

        const balanceBreakdown = calculateBreakdown(summary.map(s => ({
            amount: s.balance_due,
            functional: s.functional_balance_due,
            currencyCode: s.currency_code || undefined,
            symbol: s.currency_symbol || undefined
        })));


        const monthsWithPayments = Object.keys(paymentsByMonth).length || 1;
        const monthlyAverage = totalPaid / monthsWithPayments; // TotalPaid is already smart

        // Trend Logic
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
            committedMapped: mappedCommitted, // Keep for legacy if needed, or remove? Keeping for safety.
            paidMapped: [],
            balanceMapped: []
        };
    }, [summary, payments, primaryCurrencyCode, currencyContext?.currentExchangeRate, displayCurrency, currencyContext?.secondaryCurrency]);

    // ========================================
    // CHART DATA: PAYMENT EVOLUTION
    // ========================================
    const evolutionData = useMemo(() => {
        const grouped = payments.reduce((acc, p) => {
            // payment_month can be "2024-01-01T00:00:00.000Z" or null
            // Extract YYYY-MM format safely
            let monthKey = "";
            if (p.payment_month) {
                monthKey = String(p.payment_month).slice(0, 7);
            } else if (p.payment_date) {
                monthKey = String(p.payment_date).slice(0, 7);
            }
            if (monthKey) {
                acc[monthKey] = (acc[monthKey] || 0) + (Number(p.functional_amount) || Number(p.amount));
            }
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(grouped)
            .filter(([month]) => month && month.length >= 7) // Ensure valid month key
            .map(([month, amount]) => {
                // Parse YYYY-MM safely
                const [year, monthNum] = month.split('-').map(Number);
                const date = new Date(year, (monthNum || 1) - 1, 1);
                const formatted = isNaN(date.getTime())
                    ? month
                    : new Intl.DateTimeFormat('es', { month: 'short', year: '2-digit' }).format(date);
                return { month: formatted, rawMonth: month, amount };
            })
            .sort((a, b) => a.rawMonth.localeCompare(b.rawMonth))
            .slice(-12); // Last 12 months
    }, [payments]);

    const evolutionChartConfig: ChartConfig = {
        amount: { label: "Cobrado", color: "var(--chart-1)" }
    };

    // ========================================
    // CHART DATA: CLIENT DISTRIBUTION
    // ========================================
    const distributionData = useMemo(() => {
        const clientTotals = payments.reduce((acc, p) => {
            const clientName = p.client_name || "Desconocido";
            acc[clientName] = (acc[clientName] || 0) + (Number(p.functional_amount) || Number(p.amount));
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
    }, [payments]);

    const distributionChartConfig: ChartConfig = distributionData.reduce((acc, item, i) => {
        acc[item.name] = { label: item.name, color: item.fill };
        return acc;
    }, {} as ChartConfig);

    // ========================================
    // INSIGHTS GENERATION
    // ========================================
    const insights = useMemo<Insight[]>(() => {
        return generateClientInsights({
            summary,
            payments,
            kpis,
            primaryCurrencyCode,
            displayCurrency: displayCurrency as 'primary' | 'secondary',
            currentRate: currencyContext?.currentExchangeRate || 1,
            formatCurrency: (amount, code) => formatCurrency(amount, code),
            secondaryCurrencyCode: currencyContext?.secondaryCurrency?.code
        });
    }, [summary, payments, kpis, primaryCurrencyCode, currencyContext?.currentExchangeRate, displayCurrency, currencyContext?.secondaryCurrency]);

    // ========================================
    // RECENT ACTIVITY
    // ========================================
    const recentActivity = payments.slice(0, 5);



    // ========================================
    // RENDER
    // ========================================
    return (
        <div className="space-y-6">
            {/* ROW 1: KPIs */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <DashboardKpiCard
                    title="Compromisos Totales"
                    // Pass formatted value directly to avoid auto-conversion
                    value={formatCurrencyUtil(kpis.totalCommitted, (displayCurrency === 'secondary' ? currencyContext?.secondaryCurrency : primaryCurrencyCode) || undefined)}
                    icon={<FileText className="w-5 h-5" />}
                    description="Valor total de contratos"
                    currencyBreakdown={kpis.committedBreakdown}
                />
                <DashboardKpiCard
                    title="Cobrado a la Fecha"
                    value={formatCurrencyUtil(kpis.totalPaid, (displayCurrency === 'secondary' ? currencyContext?.secondaryCurrency : primaryCurrencyCode) || undefined)}
                    icon={<DollarSign className="w-5 h-5" />}
                    iconClassName="bg-emerald-500/10 text-emerald-600"
                    trend={{
                        value: `${kpis.trendPercent >= 0 ? '+' : ''}${kpis.trendPercent.toFixed(0)}%`,
                        direction: kpis.trendDirection
                    }}
                    currencyBreakdown={kpis.paidBreakdown}
                />
                <DashboardKpiCard
                    title={kpis.totalBalance < 0 ? "Saldo a Favor" : "Saldo a la Fecha"}
                    // Show absolute value
                    value={formatCurrencyUtil(kpis.totalBalance < 0 ? Math.abs(kpis.totalBalance) : kpis.totalBalance, (displayCurrency === 'secondary' ? currencyContext?.secondaryCurrency : primaryCurrencyCode) || undefined)}
                    icon={kpis.totalBalance < 0 ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    iconClassName={kpis.totalBalance < 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}
                    description={kpis.totalBalance < 0 ? "Cobrado en exceso" : "Por cobrar"}
                    currencyBreakdown={kpis.balanceBreakdown}
                />
                <DashboardKpiCard
                    title="Promedio Mensual"
                    value={formatCurrencyUtil(kpis.monthlyAverage, (displayCurrency === 'secondary' ? currencyContext?.secondaryCurrency : primaryCurrencyCode) || undefined)}
                    icon={<TrendingUp className="w-5 h-5" />}
                    iconClassName="bg-blue-500/10 text-blue-600"
                    description="Ingreso promedio por mes"
                />
            </div>

            {/* ROW 2: Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
                <DashboardCard
                    title="Evolución de Cobros"
                    description="Ingresos mensuales"
                    icon={<BarChart3 className="w-4 h-4" />}
                >
                    {evolutionData.length > 0 ? (
                        <BaseAreaChart
                            data={evolutionData}
                            xKey="month"
                            yKey="amount"
                            height={250}
                            config={evolutionChartConfig}
                            gradient
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
                                        <span className="font-medium">{formatCurrency(item.value)}</span>
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
                    {insights.length > 0 ? (
                        <div className="space-y-3">
                            {insights.map(insight => (
                                <InsightCard key={insight.id} insight={insight} />
                            ))}
                        </div>
                    ) : (
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
                                    <span className="text-sm font-semibold text-emerald-600">
                                        {/* ALWAYS show Original Amount in Activity List */}
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
