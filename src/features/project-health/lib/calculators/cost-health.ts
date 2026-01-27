/**
 * Cost Health Calculator
 * 
 * Calcula la salud de costo del proyecto basándose en:
 * - Ratio de costo ejecutado vs presupuesto
 * - Comparación con el avance real
 */

import { CostHealth, ProjectMetrics } from '../../types';
import { clampScore } from '../../constants';

/**
 * Calcula la salud de costo del proyecto
 * 
 * @param metrics - Métricas del proyecto
 * @returns CostHealth - Objeto con score y detalles
 * 
 * Fórmula:
 * ratio_costo = costo_ejecutado / presupuesto_total
 * ratio_avance = avance_real (tareas completadas / total)
 * salud_costo = 100 - max(0, ratio_costo - ratio_avance) * 100
 * 
 * La lógica es:
 * - Si gastás lo mismo que avanzás → salud = 100
 * - Si gastás más de lo que avanzás → salud baja
 * - Si gastás menos de lo que avanzás → salud sigue en 100 (no penaliza)
 */
export function calculateCostHealth(metrics: ProjectMetrics): CostHealth {
    const { budgetTotal, costExecuted, tasksCompleted, tasksTotal } = metrics;

    // Evitar división por cero
    if (budgetTotal === 0) {
        return {
            score: 100,
            costRatio: 0,
            progressRatio: 0,
            costDelta: 0,
        };
    }

    // Calcular ratios
    const costRatio = costExecuted / budgetTotal;
    const progressRatio = tasksTotal > 0 ? tasksCompleted / tasksTotal : 1;

    // Calcular delta (positivo = gastando más de lo que avanzamos)
    const costDelta = costRatio - progressRatio;

    // Calcular score
    // Solo penalizamos si costDelta es positivo (gastando más de lo que avanzamos)
    // Si gastamos menos, no damos bonus (se mantiene en 100)
    const penalty = Math.max(0, costDelta);
    const score = clampScore(100 - penalty * 100);

    return {
        score,
        costRatio,
        progressRatio,
        costDelta,
    };
}

/**
 * Interpreta el resultado de CostHealth
 */
export function interpretCostHealth(health: CostHealth): {
    status: 'under_budget' | 'on_budget' | 'over_budget';
    message: string;
} {
    const threshold = 0.05; // 5% de tolerancia

    if (health.costDelta < -threshold) {
        const percentage = Math.abs(Math.round(health.costDelta * 100));
        return {
            status: 'under_budget',
            message: `${percentage}% por debajo del ritmo esperado de gasto`,
        };
    }

    if (health.costDelta > threshold) {
        const percentage = Math.round(health.costDelta * 100);
        return {
            status: 'over_budget',
            message: `${percentage}% por encima del ritmo esperado de gasto`,
        };
    }

    return {
        status: 'on_budget',
        message: 'Gasto alineado con el avance',
    };
}

/**
 * Calcula el presupuesto restante proyectado
 */
export function calculateProjectedBudgetRemaining(
    budgetTotal: number,
    costExecuted: number,
    progressRatio: number
): {
    projected: number;
    remaining: number;
    willExceed: boolean;
} {
    // Si no hay avance, no podemos proyectar
    if (progressRatio === 0) {
        return {
            projected: 0,
            remaining: budgetTotal - costExecuted,
            willExceed: false,
        };
    }

    // Proyectar costo final basado en el ritmo actual
    const projectedTotal = costExecuted / progressRatio;
    const remaining = budgetTotal - costExecuted;
    const willExceed = projectedTotal > budgetTotal;

    return {
        projected: projectedTotal,
        remaining,
        willExceed,
    };
}
