import { Insight, InsightContext, InsightRule } from "../types";
import { detectTrendDirection, projectYearEndSpend, formatProjectionInsight } from "@/lib/analytics";

/**
 * Insight 1 – Crecimiento explicado (narrativo)
 * Explica QUÉ categoría explica la mayor parte del aumento/reducción del gasto
 */
export const growthExplainedInsight: InsightRule = (context: InsightContext): Insight | null => {
    if (!context.previousCategoryData || !context.totalGasto) return null;
    const previousPeriodGasto = context.previousCategoryData.reduce((sum, c) => sum + c.value, 0);
    if (previousPeriodGasto === 0 || context.totalGasto === 0) return null;

    const growthRate = ((context.totalGasto - previousPeriodGasto) / previousPeriodGasto) * 100;
    const absoluteChange = context.totalGasto - previousPeriodGasto;

    if (Math.abs(growthRate) < 15) return null;

    const previousCategoryMap = new Map(context.previousCategoryData.map(c => [c.name, c.value]));

    let maxImpactCategory = '';
    let maxImpactAmount = 0;

    for (const category of context.categoryData) {
        const previousValue = previousCategoryMap.get(category.name) || 0;
        const categoryChange = category.value - previousValue;

        // Check if this category drives the trend (Positive growth && Positive change OR Negative growth && Negative change)
        if ((growthRate > 0 && categoryChange > maxImpactAmount) || (growthRate < 0 && categoryChange < maxImpactAmount)) {
            // We want the magnitude for comparison? No, strictly finding the driver.
            // logic from legacy: 
            /* 
             if (growthRate > 0 && categoryChange > maxImpactAmount) { ... } 
             else if (growthRate < 0 && categoryChange < maxImpactAmount) { ... }
            */
            // Simplified loop tracking max absolute driver in direction of trend
            if (growthRate > 0) {
                if (categoryChange > maxImpactAmount) {
                    maxImpactAmount = categoryChange;
                    maxImpactCategory = category.name;
                }
            } else {
                // Finding the most negative change (smallest number)
                if (categoryChange < maxImpactAmount) {
                    maxImpactAmount = categoryChange;
                    maxImpactCategory = category.name;
                }
            }
        }
    }

    if (!maxImpactCategory || maxImpactAmount === 0) return null;

    const impactPercentage = Math.round(Math.abs(maxImpactAmount / absoluteChange) * 100);

    if (impactPercentage < 25) return null;

    const roundedGrowthRate = Math.round(Math.abs(growthRate));

    if (growthRate > 0) {
        return {
            id: 'growth-explained-increase',
            severity: 'warning',
            title: 'Origen del aumento identificado',
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
            severity: 'info', // Legacy used info
            title: 'Origen del ahorro identificado',
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
 * Insight 2 – Alta concentración del gasto
 */
export const concentrationNarrativeInsight: InsightRule = (context: InsightContext): Insight | null => {
    if (context.categoryData.length < 2) return null;

    const totalValue = context.categoryData.reduce((sum, c) => sum + c.value, 0);
    if (totalValue === 0) return null;

    const sortedCategories = [...context.categoryData].sort((a, b) => b.value - a.value);

    let accumulatedPercentage = 0;
    let categoriesNeeded = 0;

    for (const category of sortedCategories) {
        accumulatedPercentage += (category.value / totalValue) * 100;
        categoriesNeeded++;

        if (accumulatedPercentage >= 80) break;
    }

    if (categoriesNeeded > 3 || accumulatedPercentage < 70) return null;

    const roundedPercentage = Math.round(accumulatedPercentage);

    if (categoriesNeeded === 1) {
        return {
            id: 'concentration-single',
            severity: 'critical', // Legacy 'alert' -> 'critical'
            title: 'Concentración crítica',
            description: `Una sola categoría ("${sortedCategories[0].name}") concentra el ${roundedPercentage}% del gasto total.`,
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
        title: 'Alta concentración del gasto',
        description: `${categoriesNeeded} categorías concentran el ${roundedPercentage}% del gasto total.`,
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
 * Insight 6 – Tendencia sostenida de gasto
 */
export const sustainedTrendInsight: InsightRule = (context: InsightContext): Insight | null => {
    if (context.isShortPeriod || context.monthlyData.length < 3) return null;

    const values = context.monthlyData.map(m => m.value);
    const trend = detectTrendDirection(values, { minDataPoints: 3, stableThresholdPercent: 4 });

    if (!trend || trend.direction === 'stable') return null;
    if (trend.confidence === 'low') return null;

    const changePercent = Math.abs(trend.monthlyChangePercent);
    if (changePercent < 5) return null;

    const isIncreasing = trend.direction === 'increasing';
    const confidenceText = trend.confidence === 'high' ? 'consistente' : 'moderada';

    return {
        id: isIncreasing ? 'sustained-trend-up' : 'sustained-trend-down',
        severity: isIncreasing ? 'warning' : 'info',
        title: isIncreasing ? 'Tendencia de aumento sostenido' : 'Tendencia de reducción sostenida',
        description: `El gasto ${isIncreasing ? 'aumenta' : 'disminuye'} ~${Math.round(changePercent)}% mensual en promedio.`,
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
    if (context.isShortPeriod || context.monthlyData.length < 3) return null;

    const currentMonth = context.currentMonth ?? new Date().getMonth() + 1;

    if (currentMonth >= 11) return null;

    const allValues = context.monthlyData.map(m => m.value);
    // Assume monthlyData is ordered and represents year up to now? 
    // Context usually passes "available history". We take the slice relevant to "This Year" if mixed?
    // For safety, let's assume monthlyData IS the relevant series provided by caller.

    if (allValues.length < 3) return null;

    const projection = projectYearEndSpend(allValues, currentMonth, { minDataPoints: 3 });

    if (!projection) return null;
    if (projection.direction === 'stable') return null;

    const changePercent = Math.abs(projection.changePercent);
    if (changePercent < 5) return null;

    const isUp = projection.direction === 'up';
    const projectionText = formatProjectionInsight(projection, 'yearEnd');

    return {
        id: isUp ? 'year-end-projection-up' : 'year-end-projection-down',
        severity: isUp ? 'warning' : 'info',
        title: 'Proyección de cierre anual',
        description: projectionText,
        icon: 'Calendar',
        priority: 3,
        context: `Proyección basada en ${allValues.length} meses del año actual, quedan ${projection.monthsRemaining} meses.`,
        actionHint: isUp
            ? 'Considerá ajustar el presupuesto si el aumento no es planificado.'
            : 'El gasto proyectado está por debajo del promedio histórico.',
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
    // ... others can be added incrementally
];
