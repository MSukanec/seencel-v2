'use client';

/**
 * Hook: useProjectHealth
 * 
 * Hook principal para obtener la salud de un proyecto
 */

import { useState, useEffect, useCallback } from 'react';
import { ProjectHealth, ProjectMetrics } from '../types';
import { calculateProjectHealth } from '../lib/calculators';
import { getProjectMetrics } from '../queries/get-project-metrics';

interface UseProjectHealthResult {
    /** Estado de salud calculado */
    health: ProjectHealth | null;
    /** Métricas crudas del proyecto */
    metrics: ProjectMetrics | null;
    /** Si está cargando */
    isLoading: boolean;
    /** Error si existe */
    error: string | null;
    /** Función para refrescar los datos */
    refresh: () => Promise<void>;
}

/**
 * Hook para obtener y calcular la salud de un proyecto
 * 
 * @param projectId - ID del proyecto
 * @returns UseProjectHealthResult
 * 
 * @example
 * ```tsx
 * function ProjectHeader({ projectId }) {
 *   const { health, isLoading } = useProjectHealth(projectId);
 *   
 *   if (isLoading) return <Skeleton />;
 *   if (!health) return null;
 *   
 *   return <HealthIndicator health={health} />;
 * }
 * ```
 */
export function useProjectHealth(projectId: string): UseProjectHealthResult {
    const [health, setHealth] = useState<ProjectHealth | null>(null);
    const [metrics, setMetrics] = useState<ProjectMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        if (!projectId) {
            setHealth(null);
            setMetrics(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await getProjectMetrics(projectId);

            if (result.error) {
                setError(result.error);
                setHealth(null);
                setMetrics(null);
            } else if (result.data) {
                setMetrics(result.data);
                const calculatedHealth = calculateProjectHealth(result.data);
                setHealth(calculatedHealth);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error al calcular salud';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return {
        health,
        metrics,
        isLoading,
        error,
        refresh,
    };
}
