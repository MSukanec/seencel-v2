/**
 * Health Score - Aggregator Principal
 * 
 * Combina todos los indicadores para calcular la salud general del proyecto
 */

import { ProjectHealth, ProjectMetrics, HealthStatus } from '../../types';
import { HEALTH_CONFIG, getHealthStatus, clampScore } from '../../constants';
import { calculateTimeHealth } from './time-health';
import { calculateCostHealth } from './cost-health';
import { calculateStability } from './stability';

/**
 * Calcula la fricción del proyecto
 * (Simplificado para MVP - basado en tareas bloqueadas/pausadas)
 */
function calculateFriction(metrics: ProjectMetrics) {
    const { tasksBlocked, tasksPaused, unresolvedDependencies } = metrics;

    // Cada tarea bloqueada o pausada suma fricción
    const level = clampScore(
        (tasksBlocked * 10) +
        (tasksPaused * 5) +
        (unresolvedDependencies * 8)
    );

    return {
        level,
        blockedTasks: tasksBlocked,
        pausedTasks: tasksPaused,
        unresolvedDependencies,
    };
}

/**
 * Calcula la tensión del proyecto
 */
function calculateTension(frictionLevel: number, stabilityScore: number) {
    const { tensionWeights } = HEALTH_CONFIG;

    const frictionComponent = frictionLevel * tensionWeights.friction;
    const instabilityComponent = (100 - stabilityScore) * tensionWeights.instability;

    const level = clampScore(frictionComponent + instabilityComponent);

    return {
        level,
        frictionComponent,
        instabilityComponent,
    };
}

/**
 * Calcula la inercia del proyecto
 * (Qué tan difícil es cambiar el proyecto)
 */
function calculateInertia(metrics: ProjectMetrics) {
    const { tasksCompleted, tasksTotal, costExecuted, budgetTotal } = metrics;

    // Progreso de tareas (0-1 ratio)
    const progressComponent = tasksTotal > 0
        ? tasksCompleted / tasksTotal
        : 0;

    // Progreso de costo (0-1 ratio)
    const costComponent = budgetTotal > 0
        ? costExecuted / budgetTotal
        : 0;

    // Promedio de ambos, convertido a 0-100
    const level = clampScore(((progressComponent + costComponent) / 2) * 100);

    return {
        level,
        progressComponent,
        costComponent,
    };
}

/**
 * Calcula la salud general del proyecto
 * 
 * @param metrics - Métricas del proyecto
 * @returns ProjectHealth - Estado completo de salud
 * 
 * Fórmula:
 * salud_general = promedio_ponderado(salud_tiempo, salud_costo, estabilidad)
 */
export function calculateProjectHealth(metrics: ProjectMetrics): ProjectHealth {
    const { weights } = HEALTH_CONFIG;

    // Calcular indicadores individuales
    const time = calculateTimeHealth(metrics);
    const cost = calculateCostHealth(metrics);
    const stability = calculateStability(metrics);
    const friction = calculateFriction(metrics);
    const tension = calculateTension(friction.level, stability.score);
    const inertia = calculateInertia(metrics);

    // Calcular score general (promedio ponderado)
    const score = clampScore(
        time.score * weights.time +
        cost.score * weights.cost +
        stability.score * weights.stability
    );

    // Determinar estado
    const status = getHealthStatus(score);

    return {
        score,
        status,
        time,
        cost,
        stability,
        friction,
        tension,
        inertia,
        calculatedAt: new Date(),
    };
}

/**
 * Genera un resumen textual del estado de salud
 */
export function getHealthSummary(health: ProjectHealth): string {
    const parts: string[] = [];

    // Estado general
    if (health.status === 'healthy') {
        parts.push('El proyecto está en buen estado.');
    } else if (health.status === 'warning') {
        parts.push('El proyecto requiere atención.');
    } else {
        parts.push('El proyecto está en estado crítico.');
    }

    // Tiempo
    if (health.time.progressDelta < -0.1) {
        parts.push(`Hay un atraso de ${Math.abs(health.time.daysDelta)} días.`);
    } else if (health.time.progressDelta > 0.1) {
        parts.push(`Adelantado ${health.time.daysDelta} días.`);
    }

    // Costo
    if (health.cost.costDelta > 0.1) {
        parts.push('El gasto está por encima del ritmo esperado.');
    }

    // Estabilidad
    if (health.stability.score < 60) {
        parts.push('El proyecto presenta alta inestabilidad.');
    }

    return parts.join(' ');
}

// Re-exportar calculadores individuales
export { calculateTimeHealth } from './time-health';
export { calculateCostHealth } from './cost-health';
export { calculateStability } from './stability';
