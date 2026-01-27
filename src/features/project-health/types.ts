/**
 * Project Health Feature - Types & Interfaces
 * 
 * Sistema de indicadores de salud del proyecto
 */

// =============================================
// ESTADOS
// =============================================

export type HealthStatus = 'healthy' | 'warning' | 'critical';

export interface HealthStatusConfig {
    status: HealthStatus;
    label: string;
    description: string;
    color: string;
    bgColor: string;
    borderColor: string;
}

// =============================================
// INDICADORES BASE
// =============================================

export interface TimeHealth {
    /** Salud de tiempo (0-100) */
    score: number;
    /** Avance real: tareas_terminadas / tareas_totales */
    actualProgress: number;
    /** Avance esperado: dias_transcurridos / dias_planificados */
    expectedProgress: number;
    /** Diferencia entre avance real y esperado */
    progressDelta: number;
    /** Días de atraso o adelanto */
    daysDelta: number;
}

export interface CostHealth {
    /** Salud de costo (0-100) */
    score: number;
    /** Ratio: costo_ejecutado / presupuesto_total */
    costRatio: number;
    /** Ratio de avance para comparación */
    progressRatio: number;
    /** Diferencia: gastando más o menos de lo esperado */
    costDelta: number;
}

export interface Stability {
    /** Score de estabilidad (0-100) */
    score: number;
    /** Cantidad de cambios en el período */
    changesCount: number;
    /** Tareas reabiertas */
    reopenedCount: number;
    /** Cambios de fecha */
    dateChangesCount: number;
    /** Total de eventos inestables */
    totalUnstableEvents: number;
}

export interface Friction {
    /** Nivel de fricción (0-100) */
    level: number;
    /** Tareas bloqueadas */
    blockedTasks: number;
    /** Tareas pausadas */
    pausedTasks: number;
    /** Dependencias no resueltas */
    unresolvedDependencies: number;
}

export interface Tension {
    /** Nivel de tensión (0-100) */
    level: number;
    /** Componente de fricción */
    frictionComponent: number;
    /** Componente de inestabilidad */
    instabilityComponent: number;
}

export interface Inertia {
    /** Nivel de inercia (0-100) - qué tan difícil es cambiar */
    level: number;
    /** Componente de avance */
    progressComponent: number;
    /** Componente de costo comprometido */
    costComponent: number;
}

// =============================================
// AGREGADO PRINCIPAL
// =============================================

export interface ProjectHealth {
    /** Score general de salud (0-100) */
    score: number;
    /** Estado derivado del score */
    status: HealthStatus;
    /** Indicadores individuales */
    time: TimeHealth;
    cost: CostHealth;
    stability: Stability;
    friction: Friction;
    tension: Tension;
    inertia: Inertia;
    /** Timestamp del cálculo */
    calculatedAt: Date;
}

// =============================================
// PULSO (VARIACIÓN TEMPORAL)
// =============================================

export interface HealthPulse {
    /** Cambio vs período anterior */
    delta: number;
    /** Tendencia: improving, declining, stable */
    trend: 'improving' | 'declining' | 'stable';
    /** Score actual */
    current: number;
    /** Score anterior */
    previous: number;
}

// =============================================
// SNAPSHOT (PARA BASE DE DATOS)
// =============================================

export interface HealthSnapshot {
    id: string;
    projectId: string;
    snapshotDate: string;

    // Métricas base
    tasksTotal: number;
    tasksCompleted: number;
    tasksInProgress: number;
    tasksReopened: number;

    // Financiero
    budgetTotal: number;
    costExecuted: number;

    // Eventos
    changesCount: number;
    dateChangesCount: number;

    // Indicadores calculados
    healthScore: number;
    timeHealth: number;
    costHealth: number;
    stabilityScore: number;

    createdAt: string;
}

// =============================================
// INPUT PARA CALCULADORES
// =============================================

export interface ProjectMetrics {
    // Proyecto
    startDate: Date;
    endDate: Date;
    budgetTotal: number;

    // Tareas
    tasksTotal: number;
    tasksCompleted: number;
    tasksInProgress: number;
    tasksReopened: number;
    tasksPaused: number;
    tasksBlocked: number;

    // Financiero
    costExecuted: number;

    // Eventos (en período)
    changesCount: number;
    dateChangesCount: number;
    responsibleChangesCount: number;

    // Dependencias
    unresolvedDependencies: number;
}

// =============================================
// CONFIGURACIÓN
// =============================================

export interface HealthConfig {
    weights: {
        time: number;
        cost: number;
        stability: number;
    };
    thresholds: {
        healthy: number;
        warning: number;
    };
    stabilityFactor: number;
    tensionWeights: {
        friction: number;
        instability: number;
    };
}
