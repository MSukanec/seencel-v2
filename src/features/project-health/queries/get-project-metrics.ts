'use server';

/**
 * Query para obtener métricas del proyecto (Salud)
 * 
 * Obtiene datos de: construction_tasks, quotes_view, client_payments
 * No tiene tablas propias — es un feature de lectura pura.
 */

import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth';
import { sanitizeError } from '@/lib/error-utils';
import { ProjectMetrics } from '../types';

interface GetProjectMetricsResult {
    data: ProjectMetrics | null;
    error: string | null;
}

/**
 * Obtiene las métricas de un proyecto para calcular su salud
 */
export async function getProjectMetrics(projectId: string): Promise<GetProjectMetricsResult> {
    // Auth check
    const user = await getAuthUser();
    if (!user) return { data: null, error: 'No autenticado' };

    const supabase = await createClient();

    try {
        // 1. Obtener fechas de tareas de construcción (primera y última)
        const { data: taskDates, error: taskDatesError } = await supabase
            .schema('construction').from('construction_tasks')
            .select('planned_start_date, planned_end_date')
            .eq('project_id', projectId)
            .eq('is_deleted', false)
            .not('planned_start_date', 'is', null);

        // No fallamos si no hay fechas — usamos defaults

        // 2. Obtener estadísticas de tareas
        const { data: tasks, error: tasksError } = await supabase
            .schema('construction').from('construction_tasks')
            .select('status')
            .eq('project_id', projectId)
            .eq('is_deleted', false);

        if (tasksError) {
            return { data: null, error: sanitizeError(tasksError) };
        }

        // Contar tareas por estado
        const tasksTotal = tasks?.length || 0;
        const tasksCompleted = tasks?.filter(t => t.status === 'completed').length || 0;
        const tasksInProgress = tasks?.filter(t => t.status === 'in_progress').length || 0;
        const tasksPaused = tasks?.filter(t => t.status === 'paused').length || 0;

        // 3. Obtener presupuesto total (suma de quotes aprobados)
        const { data: quotes, error: quotesError } = await supabase
            .schema('finance').from('quotes_view')
            .select('total_with_tax')
            .eq('project_id', projectId)
            .eq('is_deleted', false)
            .in('status', ['approved', 'signed']);

        if (quotesError) {
            return { data: null, error: sanitizeError(quotesError) };
        }

        const budgetTotal = quotes?.reduce((sum, q) => sum + (Number(q.total_with_tax) || 0), 0) || 0;

        // 4. Obtener pagos de clientes (costo ejecutado)
        const { data: payments, error: paymentsError } = await supabase
            .schema('finance').from('client_payments')
            .select('amount')
            .eq('project_id', projectId)
            .eq('status', 'confirmed')
            .eq('is_deleted', false);

        if (paymentsError) {
            return { data: null, error: sanitizeError(paymentsError) };
        }

        const costExecuted = payments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

        // 5. Calcular fechas de inicio/fin desde tareas
        let startDate = new Date();
        let endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // +90 días default

        if (taskDates && taskDates.length > 0) {
            const starts = taskDates
                .map(t => t.planned_start_date)
                .filter(Boolean)
                .map(d => new Date(d).getTime());
            const ends = taskDates
                .map(t => t.planned_end_date || t.planned_start_date)
                .filter(Boolean)
                .map(d => new Date(d).getTime());

            if (starts.length > 0) startDate = new Date(Math.min(...starts));
            if (ends.length > 0) endDate = new Date(Math.max(...ends));
        }

        // 6. Construir métricas
        const metrics: ProjectMetrics = {
            startDate,
            endDate,
            budgetTotal,

            tasksTotal,
            tasksCompleted,
            tasksInProgress,
            tasksReopened: 0, // TODO: Calcular desde activity_logs
            tasksPaused,
            tasksBlocked: 0, // TODO: Calcular desde dependencias

            costExecuted,

            changesCount: 0,
            dateChangesCount: 0,
            responsibleChangesCount: 0,

            unresolvedDependencies: 0,
        };

        return { data: metrics, error: null };

    } catch (error) {
        const message = sanitizeError(error);
        return { data: null, error: message };
    }
}
