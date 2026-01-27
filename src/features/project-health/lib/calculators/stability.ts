/**
 * Stability Calculator
 * 
 * Calcula la estabilidad del proyecto basándose en:
 * - Cantidad de cambios en el período
 * - Tareas reabiertas
 * - Cambios de fecha
 */

import { Stability, ProjectMetrics } from '../../types';
import { HEALTH_CONFIG, clampScore } from '../../constants';

/**
 * Calcula la estabilidad del proyecto
 * 
 * @param metrics - Métricas del proyecto
 * @returns Stability - Objeto con score y detalles
 * 
 * Fórmula:
 * eventos_inestables = cambios + reabiertas + reprogramaciones
 * estabilidad = 100 - eventos_inestables * FACTOR_ESTABILIDAD
 * 
 * Cada evento inestable resta X puntos (configurable)
 */
export function calculateStability(metrics: ProjectMetrics): Stability {
    const { changesCount, tasksReopened, dateChangesCount, responsibleChangesCount } = metrics;

    // Contar eventos inestables con pesos diferentes
    // Reabrir tareas es más grave que cambiar fechas
    const totalUnstableEvents =
        changesCount * 1 +           // Cambios generales: peso 1
        tasksReopened * 2 +          // Tareas reabiertas: peso 2 (más grave)
        dateChangesCount * 1 +       // Cambios de fecha: peso 1
        responsibleChangesCount * 0.5; // Cambios de responsable: peso 0.5

    // Calcular score
    const penalty = totalUnstableEvents * HEALTH_CONFIG.stabilityFactor;
    const score = clampScore(100 - penalty);

    return {
        score,
        changesCount,
        reopenedCount: tasksReopened,
        dateChangesCount,
        totalUnstableEvents: Math.round(totalUnstableEvents),
    };
}

/**
 * Interpreta el resultado de Stability
 */
export function interpretStability(stability: Stability): {
    status: 'stable' | 'moderate' | 'unstable';
    message: string;
} {
    if (stability.score >= 80) {
        return {
            status: 'stable',
            message: 'Proyecto estable, pocos cambios',
        };
    }

    if (stability.score >= 50) {
        return {
            status: 'moderate',
            message: 'Estabilidad moderada, algunos cambios',
        };
    }

    return {
        status: 'unstable',
        message: 'Proyecto inestable, muchos cambios',
    };
}

/**
 * Identifica las principales fuentes de inestabilidad
 */
export function identifyInstabilitySources(stability: Stability): string[] {
    const sources: string[] = [];

    if (stability.reopenedCount > 0) {
        sources.push(`${stability.reopenedCount} tareas reabiertas`);
    }

    if (stability.dateChangesCount > 3) {
        sources.push(`${stability.dateChangesCount} cambios de fecha`);
    }

    if (stability.changesCount > 5) {
        sources.push(`${stability.changesCount} cambios generales`);
    }

    return sources;
}
