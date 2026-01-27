/**
 * Time Health Calculator
 * 
 * Calcula la salud de tiempo del proyecto basándose en:
 * - Avance real vs avance esperado
 * - Días transcurridos vs días planificados
 */

import { TimeHealth, ProjectMetrics } from '../../types';
import { clampScore } from '../../constants';

/**
 * Calcula el avance esperado basado en el tiempo transcurrido
 */
function calculateExpectedProgress(startDate: Date, endDate: Date, now: Date = new Date()): number {
    const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysElapsed = Math.max(0, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

    // Si aún no empezó, esperado es 0
    if (daysElapsed <= 0) return 0;

    // Si ya pasó la fecha fin, esperado es 100%
    if (daysElapsed >= totalDays) return 1;

    return daysElapsed / totalDays;
}

/**
 * Calcula el avance real basado en tareas completadas
 */
function calculateActualProgress(tasksCompleted: number, tasksTotal: number): number {
    if (tasksTotal === 0) return 1; // Sin tareas = proyecto completo (o vacío)
    return tasksCompleted / tasksTotal;
}

/**
 * Calcula la diferencia en días entre avance real y esperado
 */
function calculateDaysDelta(
    actualProgress: number,
    expectedProgress: number,
    startDate: Date,
    endDate: Date
): number {
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const progressDelta = actualProgress - expectedProgress;
    return Math.round(progressDelta * totalDays);
}

/**
 * Calcula la salud de tiempo del proyecto
 * 
 * @param metrics - Métricas del proyecto
 * @returns TimeHealth - Objeto con score y detalles
 * 
 * Fórmula:
 * salud_tiempo = 100 - |avance_real - avance_esperado| * 100
 */
export function calculateTimeHealth(metrics: ProjectMetrics): TimeHealth {
    const { startDate, endDate, tasksCompleted, tasksTotal } = metrics;

    // Calcular avances
    const actualProgress = calculateActualProgress(tasksCompleted, tasksTotal);
    const expectedProgress = calculateExpectedProgress(startDate, endDate);

    // Calcular diferencia
    const progressDelta = actualProgress - expectedProgress;
    const daysDelta = calculateDaysDelta(actualProgress, expectedProgress, startDate, endDate);

    // Calcular score
    // La diferencia absoluta entre avances se penaliza
    // Si están iguales = 100, si hay 50% de diferencia = 50
    const score = clampScore(100 - Math.abs(progressDelta) * 100);

    return {
        score,
        actualProgress,
        expectedProgress,
        progressDelta,
        daysDelta,
    };
}

/**
 * Interpreta el resultado de TimeHealth
 */
export function interpretTimeHealth(health: TimeHealth): {
    status: 'ahead' | 'on_track' | 'behind';
    message: string;
} {
    if (health.progressDelta > 0.05) {
        return {
            status: 'ahead',
            message: `Adelantado ${Math.abs(health.daysDelta)} días`,
        };
    }

    if (health.progressDelta < -0.05) {
        return {
            status: 'behind',
            message: `Atrasado ${Math.abs(health.daysDelta)} días`,
        };
    }

    return {
        status: 'on_track',
        message: 'En tiempo',
    };
}
