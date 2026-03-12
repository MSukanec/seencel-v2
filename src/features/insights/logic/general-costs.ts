import { GeneralCostByCategory, GeneralCostMonthlySummary, GeneralCostPaymentView } from "@/features/general-costs/types";
import { Insight, InsightContext } from "../types";
import { allInsightRules } from "./rules";

export interface GeneralCostsInsightsContext {
    monthlySummary: GeneralCostMonthlySummary[];
    byCategory: GeneralCostByCategory[];
    recentPayments: GeneralCostPaymentView[];
}

export function generateGeneralCostsInsights(context: GeneralCostsInsightsContext): Insight[] {
    const { monthlySummary, byCategory, recentPayments } = context;

    // 1. Adapter: Convert specific Domain Context to Generic Rule Context
    const sortedSummary = [...monthlySummary].sort((a, b) => new Date(a.payment_month).getTime() - new Date(b.payment_month).getTime());

    // Prepare Monthly Data for Analysis
    const monthlyData = sortedSummary.map(m => ({
        month: m.payment_month,
        value: m.total_amount
    }));

    // Identify Previous Period for Growth Rules
    // Standard logic: Last Month vs Previous-to-Last
    // But growthExplained expects "Total Gasto" (Current) vs "Previous Period Gasto".
    // Let's assume the "Current Period" is the LAST available month in the summary.
    const currentMonthData = sortedSummary[sortedSummary.length - 1];
    const previousMonthData = sortedSummary[sortedSummary.length - 2];

    // Aggregate payments by concept for efficiency insight
    const conceptPaymentMap: Record<string, { name: string; count: number }> = {};
    for (const p of recentPayments) {
        const name = p.general_cost_name || 'Sin concepto';
        if (!conceptPaymentMap[name]) {
            conceptPaymentMap[name] = { name, count: 0 };
        }
        conceptPaymentMap[name].count++;
    }
    const paymentsByConcept = Object.values(conceptPaymentMap).map(c => ({
        conceptName: c.name,
        paymentsCount: c.count
    }));

    const totalPaymentCount = sortedSummary.reduce((sum, m) => sum + m.payments_count, 0);

    const ruleContext: InsightContext = {
        // Current Period Stats (Last Month)
        totalGasto: currentMonthData?.total_amount || 0,
        totalValue: sortedSummary.reduce((sum, m) => sum + m.total_amount, 0),
        currentMonth: currentMonthData ? new Date(currentMonthData.payment_month).getMonth() + 1 : undefined,

        // Time Series
        monthlyData: monthlyData,

        // Category Data
        categoryData: byCategory.map(c => ({ name: c.category_name || 'Otros', value: c.total_amount })),

        // Payments Info
        paymentCount: totalPaymentCount,
        paymentsByConcept,

        // Meta
        monthCount: sortedSummary.length,
        isShortPeriod: false,

        // Term labels for Spanish
        termLabels: {
            singular: 'gasto',
            plural: 'gastos',
            verbIncrease: 'aumenta',
            verbDecrease: 'disminuye'
        }
    };

    // 2. Execution: Run all rules
    const insights = allInsightRules
        .map(rule => rule(ruleContext))
        .filter((i): i is Insight => i !== null);

    // 3. Sorting (by priority)
    return insights.sort((a, b) => (a.priority || 99) - (b.priority || 99));
}

