import { GeneralCostByCategory, GeneralCostMonthlySummary, GeneralCostPaymentView } from "@/types/general-costs";
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

    const ruleContext: InsightContext = {
        // Current Period Stats (Last Month)
        totalGasto: currentMonthData?.total_amount || 0,
        currentMonth: currentMonthData ? new Date(currentMonthData.payment_month).getMonth() + 1 : undefined,

        // Time Series
        monthlyData: monthlyData,

        // Category Data (This is usually "Total over the viewed period", but legacy rules expect Current Period Slice vs Previous)
        // Our 'byCategory' view usually aggregates the WHOLE selection.
        // If we want "Growth Explained", we ideally need 'byCategory' split by period.
        // Currently, our 'byCategory' input is just a list. 
        // LIMITATION: We might lack granular "Previous Month Category Data" if the view provides aggregate.
        // For now, we map what we have to enable Concentration/Trend rules which use 'categoryData'.
        categoryData: byCategory.map(c => ({ name: c.category_name || 'Otros', value: c.total_amount })),

        // Payments Info
        paymentCount: currentMonthData?.payments_count || 0,

        // Meta
        monthCount: sortedSummary.length,
        isShortPeriod: false
    };

    // 2. Execution: Run all rules
    const insights = allInsightRules
        .map(rule => rule(ruleContext))
        .filter((i): i is Insight => i !== null);

    // 3. Sorting (by priority)
    return insights.sort((a, b) => (a.priority || 99) - (b.priority || 99));
}

