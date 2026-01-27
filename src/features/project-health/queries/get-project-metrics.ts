'use server';

/**
 * Query para obtener métricas del proyecto
 * 
 * Obtiene todos los datos necesarios para calcular la salud del proyecto
 */

import { createClient } from '@/lib/supabase/server';
import { ProjectMetrics } from '../types';

interface GetProjectMetricsResult {
    data: ProjectMetrics | null;
    error: string | null;
}

/**
 * Obtiene las métricas de un proyecto para calcular su salud
 */
export async function getProjectMetrics(projectId: string): Promise<GetProjectMetricsResult> {
    const supabase = await createClient();

    try {
        // 1. Obtener datos del proyecto
        const { data: projectData, error: projectError } = await supabase
            .from('project_data')
            .select('start_date, estimated_end')
            .eq('project_id', projectId)
            .single();

        if (projectError) {
            return { data: null, error: `Error al obtener datos del proyecto: ${projectError.message}` };
        }

        // 2. Obtener estadísticas de tareas
        const { data: tasks, error: tasksError } = await supabase
            .from('construction_tasks')
            .select('status')
            .eq('project_id', projectId)
            .eq('is_deleted', false);

        if (tasksError) {
            return { data: null, error: `Error al obtener tareas: ${tasksError.message}` };
        }

        // Contar tareas por estado
        const tasksTotal = tasks?.length || 0;
        const tasksCompleted = tasks?.filter(t => t.status === 'completed').length || 0;
        const tasksInProgress = tasks?.filter(t => t.status === 'in_progress').length || 0;
        const tasksPaused = tasks?.filter(t => t.status === 'paused').length || 0;

        // 3. Obtener presupuesto total (suma de quotes aprobados)
        const { data: quotes, error: quotesError } = await supabase
            .from('quotes_view')
            .select('total_with_tax')
            .eq('project_id', projectId)
            .eq('is_deleted', false)
            .in('status', ['approved', 'signed']);

        if (quotesError) {
            return { data: null, error: `Error al obtener presupuestos: ${quotesError.message}` };
        }

        const budgetTotal = quotes?.reduce((sum, q) => sum + (Number(q.total_with_tax) || 0), 0) || 0;

        // 4. Obtener pagos de clientes (costo ejecutado)
        // Nota: Usamos 'amount' ya que functional_amount ya no existe en la tabla
        const { data: payments, error: paymentsError } = await supabase
            .from('client_payments')
            .select('amount')
            .eq('project_id', projectId)
            .eq('status', 'confirmed')
            .or('is_deleted.is.null,is_deleted.eq.false');

        if (paymentsError) {
            return { data: null, error: `Error al obtener pagos: ${paymentsError.message}` };
        }

        const costExecuted = payments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

        // 5. Construir métricas
        // TODO: Agregar queries para:
        // - changesCount (cambios en el período)
        // - tasksReopened (contar tareas reabiertas)
        // - dateChangesCount (cambios de fecha)
        // - responsibleChangesCount
        // - unresolvedDependencies
        // - tasksBlocked

        // Por ahora usamos valores por defecto (MVP)
        const metrics: ProjectMetrics = {
            // Proyecto
            startDate: projectData?.start_date
                ? new Date(projectData.start_date)
                : new Date(),
            endDate: projectData?.estimated_end
                ? new Date(projectData.estimated_end)
                : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // +90 días por defecto
            budgetTotal,

            // Tareas
            tasksTotal,
            tasksCompleted,
            tasksInProgress,
            tasksReopened: 0, // TODO: Calcular desde activity_logs
            tasksPaused,
            tasksBlocked: 0, // TODO: Calcular desde dependencias

            // Financiero
            costExecuted,

            // Eventos (por ahora en 0 hasta implementar tracking)
            changesCount: 0,
            dateChangesCount: 0,
            responsibleChangesCount: 0,

            // Dependencias
            unresolvedDependencies: 0,
        };

        return { data: metrics, error: null };

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return { data: null, error: message };
    }
}
