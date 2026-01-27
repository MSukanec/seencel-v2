/**
 * Project Health Feature - Configuration & Constants
 */

import { HealthConfig, HealthStatus, HealthStatusConfig } from './types';

// =============================================
// CONFIGURACIÓN PRINCIPAL
// =============================================

export const HEALTH_CONFIG: HealthConfig = {
    // Pesos para calcular salud general
    weights: {
        time: 0.35,      // 35% importancia
        cost: 0.35,      // 35% importancia
        stability: 0.30, // 30% importancia
    },

    // Thresholds para determinar estado
    thresholds: {
        healthy: 80,  // >= 80 = sano
        warning: 60,  // >= 60 = atención, < 60 = crítico
    },

    // Factor de penalización por cada evento inestable
    // Cada evento resta X puntos de estabilidad
    stabilityFactor: 5,

    // Pesos para calcular tensión
    tensionWeights: {
        friction: 0.6,     // 60% peso de fricción
        instability: 0.4,  // 40% peso de inestabilidad
    },
};

// =============================================
// CONFIGURACIÓN DE ESTADOS VISUALES
// =============================================

export const HEALTH_STATUS_CONFIG: Record<HealthStatus, HealthStatusConfig> = {
    healthy: {
        status: 'healthy',
        label: 'Saludable',
        description: 'El proyecto avanza según lo planificado con buen control de costos y estabilidad.',
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/20',
    },
    warning: {
        status: 'warning',
        label: 'Atención',
        description: 'Hay aspectos del proyecto que requieren atención para evitar problemas mayores.',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/20',
    },
    critical: {
        status: 'critical',
        label: 'Crítico',
        description: 'El proyecto presenta problemas significativos que requieren acción inmediata.',
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
    },
};

// =============================================
// COLORES PARA UI DINÁMICA
// =============================================

export const HEALTH_COLORS = {
    healthy: {
        primary: '#22c55e',      // green-500
        background: '#dcfce7',   // green-100
        gradient: 'from-green-400 to-emerald-500',
    },
    warning: {
        primary: '#eab308',      // yellow-500
        background: '#fef9c3',   // yellow-100
        gradient: 'from-yellow-400 to-amber-500',
    },
    critical: {
        primary: '#6366f1',      // indigo-500 (más elegante que rojo)
        background: '#e0e7ff',   // indigo-100
        gradient: 'from-indigo-400 to-purple-500',
    },
};

// =============================================
// CONFIGURACIÓN DE PULSO
// =============================================

export const PULSE_CONFIG = {
    // Threshold para considerar "estable" (sin cambio significativo)
    stableThreshold: 2, // +/- 2 puntos = estable

    // Velocidades de animación según tendencia (ms)
    animationSpeed: {
        improving: 3000,  // Lento, relajado
        stable: 4000,     // Muy lento
        declining: 1500,  // Rápido, alerta
    },
};

// =============================================
// HELPERS
// =============================================

/**
 * Determina el estado de salud basado en el score
 */
export function getHealthStatus(score: number): HealthStatus {
    if (score >= HEALTH_CONFIG.thresholds.healthy) return 'healthy';
    if (score >= HEALTH_CONFIG.thresholds.warning) return 'warning';
    return 'critical';
}

/**
 * Obtiene la configuración visual para un estado
 */
export function getStatusConfig(status: HealthStatus): HealthStatusConfig {
    return HEALTH_STATUS_CONFIG[status];
}

/**
 * Obtiene los colores para un estado
 */
export function getStatusColors(status: HealthStatus) {
    return HEALTH_COLORS[status];
}

/**
 * Clamp un valor entre 0 y 100
 */
export function clampScore(value: number): number {
    return Math.max(0, Math.min(100, value));
}
