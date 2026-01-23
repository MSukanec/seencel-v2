import { Insight, InsightContext, InsightRule } from "../types";
import { detectTrendDirection, projectYearEndSpend, formatProjectionInsight } from "@/lib/analytics";

/**
 * Insight 1 – Crecimiento explicado (narrativo)
 * Explica QUÉ categoría explica la mayor parte del aumento/reducción del valor
 */
export const growthExplainedInsight: InsightRule = (context: InsightContext): Insight | null => {
    if (!context.previousCategoryData || !context.totalValue) return null;
    const previousPeriodValue = context.previousCategoryData.reduce((sum, c) => sum + c.value, 0);
    if (previousPeriodValue === 0 || context.totalValue === 0) return null;

    const growthRate = ((context.totalValue - previousPeriodValue) / previousPeriodValue) * 100;
    const absoluteChange = context.totalValue - previousPeriodValue;

    // Use threshold from context or default
    const threshold = context.thresholds?.growthSignificant ?? 15;

    if (Math.abs(growthRate) < threshold) return null;

    const previousCategoryMap = new Map(context.previousCategoryData.map(c => [c.name, c.value]));

    let maxImpactCategory = '';
    let maxImpactAmount = 0;

    for (const category of context.categoryData) {
        const previousValue = previousCategoryMap.get(category.name) || 0;
        const categoryChange = category.value - previousValue;

        if (growthRate > 0) {
            if (categoryChange > maxImpactAmount) {
                maxImpactAmount = categoryChange;
                maxImpactCategory = category.name;
            }
        } else {
            if (categoryChange < maxImpactAmount) {
                maxImpactAmount = categoryChange;
                maxImpactCategory = category.name;
            }
        }
    }

    if (!maxImpactCategory || maxImpactAmount === 0) return null;

    const impactPercentage = Math.round(Math.abs(maxImpactAmount / absoluteChange) * 100);

    // Another candidate for threshold? e.g. "driverSignificance". Keeping hardcoded 25% for now as it's internal logic.
    if (impactPercentage < 25) return null;

    const roundedGrowthRate = Math.round(Math.abs(growthRate));

    if (growthRate > 0) {
        return {
            id: 'growth-explained-increase',
            severity: 'warning',
            title: `Origen del aumento identificado`,
            description: `El ${impactPercentage}% del aumento proviene de "${maxImpactCategory}" en este período.`,
            icon: 'TrendingUp',
            priority: 1,
            context: `"${maxImpactCategory}" creció un ${roundedGrowthRate}% respecto al período anterior.`,
            actionHint: `Revisá los conceptos de "${maxImpactCategory}" en este período.`,
            actions: [
                {
                    id: 'view-category-concepts',
                    label: 'Ver conceptos',
                    type: 'navigate',
                    payload: { tab: 'concepts', filterCategory: maxImpactCategory }
                }
            ]
        };
    } else {
        return {
            id: 'growth-explained-decrease',
            severity: 'info',
            title: `Origen del ahorro identificado`,
            description: `El ${impactPercentage}% de la reducción proviene de "${maxImpactCategory}".`,
            icon: 'TrendingDown',
            priority: 3,
            context: `"${maxImpactCategory}" se redujo un ${roundedGrowthRate}% respecto al período anterior.`,
            actionHint: `Revisá los conceptos de "${maxImpactCategory}" en este período.`,
            actions: [
                {
                    id: 'view-category-concepts',
                    label: 'Ver conceptos',
                    type: 'navigate',
                    payload: { tab: 'concepts', filterCategory: maxImpactCategory }
                }
            ]
        };
    }
};

/**
 * Insight 2 – Alta concentración (Pareto)
 */
export const concentrationNarrativeInsight: InsightRule = (context: InsightContext): Insight | null => {
    if (context.categoryData.length < 2) return null;

    const totalValue = context.categoryData.reduce((sum, c) => sum + c.value, 0);
    if (totalValue === 0) return null;

    const sortedCategories = [...context.categoryData].sort((a, b) => b.value - a.value);

    let accumulatedPercentage = 0;
    let categoriesNeeded = 0;

    const paretoThreshold = context.thresholds?.concentrationPareto ?? 80;

    for (const category of sortedCategories) {
        accumulatedPercentage += (category.value / totalValue) * 100;
        categoriesNeeded++;

        if (accumulatedPercentage >= paretoThreshold) break;
    }

    if (categoriesNeeded > 3 || accumulatedPercentage < (paretoThreshold - 10)) return null;

    const roundedPercentage = Math.round(accumulatedPercentage);
    const term = context.termLabels?.singular || 'gasto';

    if (categoriesNeeded === 1) {
        return {
            id: 'concentration-single',
            severity: 'critical',
            title: `Concentración crítica`,
            description: `Una sola categoría ("${sortedCategories[0].name}") concentra el ${roundedPercentage}% del ${term} total.`,
            icon: 'AlertTriangle',
            priority: 1,
            context: `"${sortedCategories[0].name}" lidera con el ${roundedPercentage}%.`,
            actionHint: `Revisá "${sortedCategories[0].name}" en el gráfico de categorías.`,
            actions: [
                {
                    id: 'filter-category',
                    label: 'Ver en gráfico',
                    type: 'filter',
                    payload: { category: sortedCategories[0].name }
                }
            ]
        };
    }

    const topCategoryName = sortedCategories[0]?.name || '';
    const topCategoryPercentage = sortedCategories[0] ? Math.round((sortedCategories[0].value / totalValue) * 100) : 0;

    return {
        id: 'concentration-few',
        severity: 'warning',
        title: `Alta concentración de ${context.termLabels?.plural || 'gastos'}`,
        description: `${categoriesNeeded} categorías concentran el ${roundedPercentage}% del ${term} total.`,
        icon: 'PieChart',
        priority: 2,
        context: `"${topCategoryName}" lidera con el ${topCategoryPercentage}%.`,
        actionHint: `Revisá "${topCategoryName}" en el gráfico de categorías.`,
        actions: [
            {
                id: 'filter-category',
                label: 'Ver en gráfico',
                type: 'filter',
                payload: { category: topCategoryName }
            }
        ]
    };
};

/**
 * Insight 6 – Tendencia sostenida
 */
export const sustainedTrendInsight: InsightRule = (context: InsightContext): Insight | null => {
    const minPoints = context.thresholds?.minDataPoints ?? 3;
    if (context.isShortPeriod || context.monthlyData.length < minPoints) return null;

    const values = context.monthlyData.map(m => m.value);

    // Pass thresholds to analytics helper if possible, or check locally.
    // detectTrendDirection accepts options.
    const stableThreshold = context.thresholds?.trendStable ?? 4;
    const trend = detectTrendDirection(values, { minDataPoints: minPoints, stableThresholdPercent: stableThreshold });

    if (!trend || trend.direction === 'stable') return null;
    if (trend.confidence === 'low') return null;

    const changePercent = Math.abs(trend.monthlyChangePercent);
    // Use the same stable threshold as significant trigger? Or slightly higher?
    // Let's use growthSignificant / 3 as a heuristic for "trend significance" per month
    const significantMonthly = (context.thresholds?.growthSignificant ?? 15) / 3;
    if (changePercent < significantMonthly) return null;

    const isIncreasing = trend.direction === 'increasing';
    const confidenceText = trend.confidence === 'high' ? 'consistente' : 'moderada';

    // Dynamic terminology
    const term = context.termLabels?.singular || 'gasto';
    const verb = isIncreasing
        ? (context.termLabels?.verbIncrease || 'aumenta')
        : (context.termLabels?.verbDecrease || 'disminuye');

    return {
        id: isIncreasing ? 'sustained-trend-up' : 'sustained-trend-down',
        // Logic inversion: Increasing Income is GOOD (info/positive), Increasing Expense is BAD (warning)
        // Since we don't have a semantic "Good/Bad" flag on context, we assume Warning for Increase unless context suggests otherwise?
        // Actually, for Generic Rules, Increase is usually Warning for Expenses.
        // For Incomes, we might want 'positive'.
        // Let's stick to Neutral 'info' or 'warning' based on magnitude for now, or infer from label.
        // Quick heuristics: if label is 'ingreso', increase is good (positive).
        // Todo: Add `isPositiveMetrics: boolean` to context.
        severity: isIncreasing
            ? (term.includes('ingres') ? 'positive' : 'warning')
            : (term.includes('ingres') ? 'warning' : 'info'),

        title: isIncreasing
            ? `Tendencia de aumento sostenido`
            : `Tendencia de reducción sostenida`,
        description: `El ${term} ${verb} ~${Math.round(changePercent)}% mensual en promedio.`,
        icon: isIncreasing ? 'TrendingUp' : 'TrendingDown',
        priority: 2,
        context: `Tendencia ${confidenceText} basada en ${context.monthlyData.length} meses de datos.`,
        actionHint: isIncreasing
            ? 'Revisá qué categorías están impulsando el aumento.'
            : 'Verificá si esta reducción es planificada.',
        actions: [
            {
                id: 'view-monthly-trend',
                label: 'Ver evolución',
                type: 'open',
                payload: { panel: 'monthlyChart' }
            }
        ]
    };
};

/**
 * Insight 7 – Proyección de cierre anual
 */
export const yearEndProjectionInsight: InsightRule = (context: InsightContext): Insight | null => {
    const minPoints = context.thresholds?.minDataPoints ?? 3;
    if (context.isShortPeriod || context.monthlyData.length < minPoints) return null;

    const currentMonth = context.currentMonth ?? new Date().getMonth() + 1;

    if (currentMonth >= 11) return null;

    const allValues = context.monthlyData.map(m => m.value);

    if (allValues.length < minPoints) return null;

    const projection = projectYearEndSpend(allValues, currentMonth, { minDataPoints: minPoints });

    if (!projection) return null;
    if (projection.direction === 'stable') return null;

    const changePercent = Math.abs(projection.changePercent);
    const significantThreshold = context.thresholds?.growthSignificant ?? 15;
    // Projection is for the whole year, so we strictly use the high significance threshold (e.g. 5% or 10%)
    // Default was 5% hardcoded, let's use 1/3 of 'significant' logic or just fixed 5?
    // Let's us growthSignificant / 3 to align with monthly trend logic
    if (changePercent < (significantThreshold / 3)) return null;

    const isUp = projection.direction === 'up';
    // We would need to pass term labels to `formatProjectionInsight` ideally, or construct string here
    const term = context.termLabels?.singular || 'gasto';

    // Quick text construction instead of lib for now to support dynamic terms
    const diffText = `${Math.round(changePercent)}% ${isUp ? 'mayor' : 'menor'} a lo esperado`;
    const description = `Se proyecta un cierre anual un ${diffText} si se mantiene la tendencia de ${term} actual.`;

    return {
        id: isUp ? 'year-end-projection-up' : 'year-end-projection-down',
        severity: isUp
            ? (term.includes('ingres') ? 'positive' : 'warning')
            : (term.includes('ingres') ? 'warning' : 'info'),
        title: 'Proyección de cierre anual',
        description: description,
        icon: 'Calendar',
        priority: 3,
        context: `Proyección basada en ${allValues.length} meses del año actual, quedan ${projection.monthsRemaining} meses.`,
        actionHint: isUp
            ? 'Considerá ajustar el presupuesto si el aumento no es planificado.'
            : 'El proyectado está por debajo del promedio histórico.',
        actions: [
            {
                id: 'view-monthly-trend',
                label: 'Ver evolución',
                type: 'open',
                payload: { panel: 'monthlyChart' }
            }
        ]
    };
};

// --- Export Collection ---
export const allInsightRules: InsightRule[] = [
    growthExplainedInsight,
    concentrationNarrativeInsight,
    sustainedTrendInsight,
    yearEndProjectionInsight,
];

