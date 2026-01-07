import { GeneralCostByCategory, GeneralCostMonthlySummary, GeneralCostPaymentView, Insight } from "@/types/general-costs";

interface InsightsContext {
    monthlySummary: GeneralCostMonthlySummary[];
    byCategory: GeneralCostByCategory[];
    recentPayments: GeneralCostPaymentView[];
}

export function generateGeneralCostsInsights(context: InsightsContext): Insight[] {
    const insights: Insight[] = [];
    const { monthlySummary, byCategory, recentPayments } = context;

    // 1. Check for Spending Spikes (Operational Load)
    // Compare current month vs average
    if (monthlySummary.length >= 2) {
        const sorted = [...monthlySummary].sort((a, b) => new Date(a.payment_month).getTime() - new Date(b.payment_month).getTime());
        const lastMonth = sorted[sorted.length - 1];
        const previousMonths = sorted.slice(0, sorted.length - 1);
        const avgExpense = previousMonths.reduce((sum, m) => sum + m.total_amount, 0) / previousMonths.length;

        // Threshold: 20% increase
        if (lastMonth.total_amount > avgExpense * 1.2) {
            insights.push({
                id: 'spending-spike',
                title: 'Gasto mensual elevado',
                description: `El gasto de este mes (${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(lastMonth.total_amount)}) es un ${Math.round(((lastMonth.total_amount - avgExpense) / avgExpense) * 100)}% superior al promedio.`,
                severity: 'warning',
                actionLabel: 'Ver pagos'
            });
        }
    }

    // 2. Check for Dominant Category (Concentration)
    if (byCategory.length > 0) {
        const totalExpense = byCategory.reduce((sum, c) => sum + c.total_amount, 0);
        const sortedCategories = [...byCategory].sort((a, b) => b.total_amount - a.total_amount);
        const topCategory = sortedCategories[0];
        const concentration = (topCategory.total_amount / totalExpense) * 100;

        if (concentration > 40) {
            insights.push({
                id: 'dominant-category',
                title: 'Categoría dominante',
                description: `"${topCategory.category_name || 'Sin categoría'}" representa el ${Math.round(concentration)}% de tus gastos totales. Revisa si este nivel de concentración es el esperado.`,
                severity: 'info',
                actionLabel: 'Analizar'
            });
        }
    }

    // 3. Check for Payment Volume (Operational)
    if (recentPayments.length > 0) {
        // Example logic: if more than 50 payments in last 30 days
        // For now, let's just use total count from summary if available, using the passed recent payments is just a sample
        // Let's deduce operational load from "payments_count" in the summary of the last month
        const lastMonthSummary = monthlySummary.sort((a, b) => new Date(b.payment_month).getTime() - new Date(a.payment_month).getTime())[0];
        if (lastMonthSummary && lastMonthSummary.payments_count > 30) { // arbitrary threshold
            insights.push({
                id: 'high-volume',
                title: 'Carga operativa elevada',
                description: `Procesas ${lastMonthSummary.payments_count} pagos este mes. Considera consolidar proveedores o automatizar pagos recurrentes.`,
                severity: 'info'
            });
        }
    }

    return insights;
}
