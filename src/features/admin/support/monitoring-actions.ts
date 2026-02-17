"use server";

import { sanitizeError } from "@/lib/error-utils";
import { createClient } from "@/lib/supabase/server";

// =============================================================================
// TYPES
// =============================================================================

export interface EnrichedSystemError {
    id: string;
    domain: string;
    entity: string;
    functionName: string;
    message: string;
    context: Record<string, unknown>;
    severity: string;
    createdAt: string;
    // Contexto humano resuelto
    userEmail: string | null;
    userName: string | null;
    orgName: string | null;
    planName: string | null;
    paymentAmount: number | null;
    paymentCurrency: string | null;
    paymentProvider: string | null;
    errorStep: string | null;
}

export interface OpsAlert {
    id: string;
    createdAt: string;
    updatedAt: string;
    severity: string;
    status: string;
    alertType: string;
    title: string;
    description: string | null;
    provider: string | null;
    fingerprint: string | null;
    evidence: Record<string, unknown>;
    ackAt: string | null;
    resolvedAt: string | null;
    // Contexto humano
    userId: string | null;
    userEmail: string | null;
    userName: string | null;
    organizationId: string | null;
    orgName: string | null;
    orgPlanName: string | null;
    paymentId: string | null;
    paymentAmount: number | null;
    paymentCurrency: string | null;
    paymentProductType: string | null;
    paymentStatus: string | null;
    // Acciones
    ackByName: string | null;
    resolvedByName: string | null;
}

export interface OpsRepairAction {
    id: string;
    alertType: string;
    label: string;
    description: string | null;
    requiresConfirmation: boolean;
    isDangerous: boolean;
    isActive: boolean;
}

export interface MonitoringDashboard {
    errorsLast24h: number;
    criticalErrorsLast24h: number;
    openAlerts: number;
    criticalAlerts: number;
    lastCheckRun: {
        createdAt: string;
        status: string;
        durationMs: number | null;
    } | null;
    systemStatus: 'healthy' | 'warning' | 'critical';
}

// =============================================================================
// DASHBOARD — Panel resumen
// =============================================================================

export async function getMonitoringDashboard(): Promise<{
    success: boolean;
    data?: MonitoringDashboard;
    error?: string;
}> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "No autenticado" };

        const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        // Parallel queries
        const [errorsResult, criticalErrorsResult, openAlertsResult, criticalAlertsResult, lastCheckResult] = await Promise.all([
            // Total errors last 24h
            supabase
                .from('system_error_logs')
                .select('id', { count: 'exact', head: true })
                .gte('created_at', since24h),

            // Critical errors last 24h
            supabase
                .from('system_error_logs')
                .select('id', { count: 'exact', head: true })
                .gte('created_at', since24h)
                .eq('severity', 'critical'),

            // Open alerts
            supabase
                .from('ops_alerts')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'open'),

            // Critical open alerts
            supabase
                .from('ops_alerts')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'open')
                .eq('severity', 'critical'),

            // Last check run
            supabase
                .from('ops_check_runs')
                .select('created_at, status, duration_ms')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle(),
        ]);

        const errorsLast24h = errorsResult.count ?? 0;
        const criticalErrorsLast24h = criticalErrorsResult.count ?? 0;
        const openAlerts = openAlertsResult.count ?? 0;
        const criticalAlerts = criticalAlertsResult.count ?? 0;

        // Determinar estado del sistema
        let systemStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
        if (criticalAlerts > 0 || criticalErrorsLast24h > 5) {
            systemStatus = 'critical';
        } else if (openAlerts > 0 || errorsLast24h > 0) {
            systemStatus = 'warning';
        }

        return {
            success: true,
            data: {
                errorsLast24h,
                criticalErrorsLast24h,
                openAlerts,
                criticalAlerts,
                lastCheckRun: lastCheckResult.data ? {
                    createdAt: lastCheckResult.data.created_at,
                    status: lastCheckResult.data.status,
                    durationMs: lastCheckResult.data.duration_ms,
                } : null,
                systemStatus,
            }
        };
    } catch (error) {
        return { success: false, error: sanitizeError(error) };
    }
}

// =============================================================================
// ENRICHED SYSTEM ERRORS — Errores con nombres humanos
// =============================================================================

export async function getEnrichedSystemErrors(hours: number = 48): Promise<{
    success: boolean;
    errors?: EnrichedSystemError[];
    error?: string;
}> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "No autenticado" };

        const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
            .from('system_errors_enriched_view')
            .select('*')
            .gte('created_at', since)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error("Error fetching enriched errors:", error);
            return { success: false, error: sanitizeError(error) };
        }

        const errors: EnrichedSystemError[] = (data || []).map((e: Record<string, unknown>) => ({
            id: e.id as string,
            domain: e.domain as string,
            entity: e.entity as string,
            functionName: e.function_name as string,
            message: e.error_message as string,
            context: (e.context || {}) as Record<string, unknown>,
            severity: e.severity as string,
            createdAt: e.created_at as string,
            // Contexto humano
            userEmail: (e.user_email as string) || null,
            userName: (e.user_name as string) || null,
            orgName: (e.org_name as string) || null,
            planName: (e.plan_name as string) || null,
            paymentAmount: e.payment_amount ? Number(e.payment_amount) : null,
            paymentCurrency: (e.payment_currency as string) || null,
            paymentProvider: (e.payment_provider as string) || null,
            errorStep: (e.error_step as string) || null,
        }));

        return { success: true, errors };
    } catch (error) {
        return { success: false, error: sanitizeError(error) };
    }
}

// =============================================================================
// OPS ALERTS — Alertas operativas con contexto humano
// =============================================================================

export async function getOpsAlerts(statusFilter?: string): Promise<{
    success: boolean;
    alerts?: OpsAlert[];
    error?: string;
}> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "No autenticado" };

        let query = supabase
            .from('ops_alerts_enriched_view')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (statusFilter && statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }

        const { data, error } = await query;

        if (error) {
            console.error("Error fetching ops alerts:", error);
            return { success: false, error: sanitizeError(error) };
        }

        const alerts: OpsAlert[] = (data || []).map((a: Record<string, unknown>) => ({
            id: a.id as string,
            createdAt: a.created_at as string,
            updatedAt: a.updated_at as string,
            severity: a.severity as string,
            status: a.status as string,
            alertType: a.alert_type as string,
            title: a.title as string,
            description: (a.description as string) || null,
            provider: (a.provider as string) || null,
            fingerprint: (a.fingerprint as string) || null,
            evidence: (a.evidence || {}) as Record<string, unknown>,
            ackAt: (a.ack_at as string) || null,
            resolvedAt: (a.resolved_at as string) || null,
            // Contexto humano
            userId: (a.user_id as string) || null,
            userEmail: (a.user_email as string) || null,
            userName: (a.user_name as string) || null,
            organizationId: (a.organization_id as string) || null,
            orgName: (a.org_name as string) || null,
            orgPlanName: (a.org_plan_name as string) || null,
            paymentId: (a.payment_id as string) || null,
            paymentAmount: a.payment_amount ? Number(a.payment_amount) : null,
            paymentCurrency: (a.payment_currency as string) || null,
            paymentProductType: (a.payment_product_type as string) || null,
            paymentStatus: (a.payment_status as string) || null,
            ackByName: (a.ack_by_name as string) || null,
            resolvedByName: (a.resolved_by_name as string) || null,
        }));

        return { success: true, alerts };
    } catch (error) {
        return { success: false, error: sanitizeError(error) };
    }
}

// =============================================================================
// OPS REPAIR ACTIONS — Catálogo de acciones disponibles
// =============================================================================

export async function getOpsRepairActions(): Promise<{
    success: boolean;
    actions?: OpsRepairAction[];
    error?: string;
}> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "No autenticado" };

        const { data, error } = await supabase
            .from('ops_repair_actions')
            .select('*')
            .eq('is_active', true);

        if (error) {
            return { success: false, error: sanitizeError(error) };
        }

        const actions: OpsRepairAction[] = (data || []).map((a: Record<string, unknown>) => ({
            id: a.id as string,
            alertType: a.alert_type as string,
            label: a.label as string,
            description: (a.description as string) || null,
            requiresConfirmation: a.requires_confirmation as boolean,
            isDangerous: a.is_dangerous as boolean,
            isActive: a.is_active as boolean,
        }));

        return { success: true, actions };
    } catch (error) {
        return { success: false, error: sanitizeError(error) };
    }
}

// =============================================================================
// EXECUTE REPAIR — Ejecuta una acción de reparación
// =============================================================================

export async function executeOpsRepair(alertId: string, actionId: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "No autenticado" };

        // Obtener el users.id (no auth_id)
        const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', user.id)
            .single();

        if (!userData) return { success: false, error: "No se encontró el usuario" };

        const { error } = await supabase.rpc('ops_execute_repair_action', {
            p_alert_id: alertId,
            p_action_id: actionId,
            p_executed_by: userData.id,
        });

        if (error) {
            console.error("Error executing repair:", error);
            return { success: false, error: sanitizeError(error) };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: sanitizeError(error) };
    }
}

// =============================================================================
// RESOLVE ALERT — Marca una alerta como resuelta manualmente
// =============================================================================

export async function resolveOpsAlert(alertId: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "No autenticado" };

        const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', user.id)
            .single();

        if (!userData) return { success: false, error: "No se encontró el usuario" };

        const { error } = await supabase
            .from('ops_alerts')
            .update({
                status: 'resolved',
                resolved_at: new Date().toISOString(),
                resolved_by: userData.id,
            })
            .eq('id', alertId);

        if (error) {
            return { success: false, error: sanitizeError(error) };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: sanitizeError(error) };
    }
}

// =============================================================================
// ACK ALERT — Marca una alerta como acknowledgeada
// =============================================================================

export async function ackOpsAlert(alertId: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "No autenticado" };

        const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', user.id)
            .single();

        if (!userData) return { success: false, error: "No se encontró el usuario" };

        const { error } = await supabase
            .from('ops_alerts')
            .update({
                status: 'ack',
                ack_at: new Date().toISOString(),
                ack_by: userData.id,
            })
            .eq('id', alertId);

        if (error) {
            return { success: false, error: sanitizeError(error) };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: sanitizeError(error) };
    }
}

// =============================================================================
// RUN ALL CHECKS — Ejecuta manualmente el suite de chequeos
// =============================================================================

export async function runOpsChecks(): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "No autenticado" };

        const { error } = await supabase.rpc('ops_run_all_checks');

        if (error) {
            console.error("Error running ops checks:", error);
            return { success: false, error: sanitizeError(error) };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: sanitizeError(error) };
    }
}
