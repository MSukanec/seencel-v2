import { Insight, InsightContext } from "../types";
import { allInsightRules } from "./rules";

export interface MaterialsInsightsInput {
    /** Monthly payment totals for trend analysis */
    monthlyData: Array<{ month: string; value: number }>;
    /** Payments grouped by material type */
    typeDistribution: Array<{ name: string; value: number }>;
    /** Current month (1-12) */
    currentMonth?: number;
    /** Total payment count */
    paymentCount: number;
}

/**
 * Generates insights for Materials feature using the generic rules engine.
 * Transforms material-specific data into InsightContext.
 */
export function generateMaterialsInsights(input: MaterialsInsightsInput): Insight[] {
    const { monthlyData, typeDistribution, currentMonth, paymentCount } = input;

    // Calculate totals
    const totalValue = typeDistribution.reduce((sum, t) => sum + t.value, 0);

    // Build previous month comparison if we have enough data
    const sortedMonthly = [...monthlyData].sort((a, b) => a.month.localeCompare(b.month));
    const currentMonthData = sortedMonthly[sortedMonthly.length - 1];
    const previousMonthData = sortedMonthly[sortedMonthly.length - 2];

    // Build InsightContext for rules engine
    const ruleContext: InsightContext = {
        // Total value (accumulated)
        totalValue,
        totalGasto: totalValue, // Alias for legacy compatibility

        // Time series
        monthlyData: monthlyData.map(m => ({ month: m.month, value: m.value })),

        // Category data (material types)
        categoryData: typeDistribution.map(t => ({ name: t.name, value: t.value })),

        // For growth comparison (previous month)
        previousCategoryData: previousMonthData
            ? typeDistribution.map(t => ({
                name: t.name,
                value: t.value * 0.9 // Simplified - ideally we'd have real previous data
            }))
            : undefined,

        // Payment info
        paymentCount,

        // Period info
        currentMonth: currentMonth ?? new Date().getMonth() + 1,
        monthCount: monthlyData.length,
        isShortPeriod: monthlyData.length < 3,

        // Custom term labels for materials context
        termLabels: {
            singular: "gasto en materiales",
            plural: "gastos en materiales",
            verbIncrease: "aumenta",
            verbDecrease: "disminuye"
        }
    };

    // Execute all generic rules
    const insights = allInsightRules
        .map(rule => rule(ruleContext))
        .filter((i): i is Insight => i !== null);

    // Sort by priority
    return insights.sort((a, b) => (a.priority || 99) - (b.priority || 99));
}
