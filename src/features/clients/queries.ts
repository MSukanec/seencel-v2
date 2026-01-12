
import { createClient } from "@/lib/supabase/server";
import {
    ProjectClientView,
    ClientFinancialSummary,
    ClientCommitment,
    ClientPaymentView,
    ClientPaymentSchedule,
    ClientRole,
    ClientPortalSettings
} from "./types";

/**
 * Helper to get the current authenticated user's active organization
 */
async function getActiveOrganizationId() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: userData } = await supabase
        .from('users')
        .select(`id, user_preferences(last_organization_id)`)
        .eq('auth_id', user.id)
        .single();

    if (!userData) return null;

    const pref = Array.isArray((userData as any).user_preferences)
        ? (userData as any).user_preferences[0]
        : (userData as any).user_preferences;

    return pref?.last_organization_id || null;
}

export async function getClients(projectId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('project_clients_view')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching clients:", JSON.stringify(error, null, 2));
        return { data: [] as ProjectClientView[], error };
    }

    return { data: data as ProjectClientView[], error: null };
}

/**
 * Get all clients for an organization (across all projects)
 */
export async function getClientsByOrganization(organizationId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('project_clients_view')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching clients by organization:", JSON.stringify(error, null, 2));
        return { data: [] as ProjectClientView[], error };
    }

    return { data: data as ProjectClientView[], error: null };
}

/**
 * Get financial summary for all clients in an organization
 */
export async function getFinancialSummaryByOrganization(organizationId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('client_financial_summary_view')
        .select('*')
        .eq('organization_id', organizationId);

    if (error) {
        console.error("Error fetching financial summary by organization:", error);
        return { data: [] as ClientFinancialSummary[], error };
    }

    return { data: data as ClientFinancialSummary[], error: null };
}

/**
 * Get all commitments for an organization
 */
export async function getCommitmentsByOrganization(organizationId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('client_commitments')
        .select(`
            *,
            project:projects(name),
            client:project_clients(
                id,
                contact:contacts(full_name, company_name)
            ),
            currency:currencies(symbol, code)
        `)
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching commitments by organization:", error);
        return { data: [], error };
    }

    return { data, error: null };
}

/**
 * Get all payments for an organization
 */
export async function getPaymentsByOrganization(organizationId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('client_payments_view')
        .select('*')
        .eq('organization_id', organizationId)
        .order('payment_date', { ascending: false });

    if (error) {
        console.error("Error fetching payments by organization:", error);
        return { data: [] as ClientPaymentView[], error };
    }

    return { data: data as ClientPaymentView[], error: null };
}

/**
 * Get all payment schedules for an organization
 */
export async function getSchedulesByOrganization(organizationId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('client_payment_schedule')
        .select(`
            *,
            commitment:client_commitments(
                id,
                project_id,
                client:project_clients(
                    id,
                    contact:contacts(full_name)
                )
            ),
            currency:currencies(symbol, code)
        `)
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .order('due_date', { ascending: true });

    if (error) {
        console.error("Error fetching schedules by organization:", error);
        return { data: [] as any[], error };
    }

    return { data: data as any[], error: null };
}

export async function getClientFinancialSummary(projectId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('client_financial_summary_view')
        .select('*')
        .eq('project_id', projectId);

    if (error) {
        console.error("Error fetching client financial summary:", error);
        return { data: [] as ClientFinancialSummary[], error };
    }

    return { data: data as ClientFinancialSummary[], error: null };
}

export async function getClientCommitments(projectId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('client_commitments')
        .select(`
            *,
            project:projects(name),
            client:project_clients(
                id,
                contact:contacts(full_name, company_name)
            ),
            currency:currencies(symbol, code)
        `)
        .eq('project_id', projectId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching client commitments:", error);
        return { data: [], error };
    }

    return { data, error: null };
}

export async function getClientPayments(projectId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('client_payments_view')
        .select('*')
        .eq('project_id', projectId)
        .order('payment_date', { ascending: false });

    if (error) {
        console.error("Error fetching client payments:", error);
        return { data: [] as ClientPaymentView[], error };
    }

    return { data: data as ClientPaymentView[], error: null };
}

export async function getClientPaymentSchedules(projectId: string) {
    const supabase = await createClient();

    // Joining client_commitments to filter by project_id
    // Note: Implicit inner join filter syntax in PostgREST for relation filtering

    const { data, error } = await supabase
        .from('client_payment_schedule')
        .select(`
            *,
            commitment:client_commitments!inner(
                id,
                project_id,
                client:project_clients(
                    id,
                    contact:contacts(full_name)
                )
            ),
            currency:currencies(symbol, code)
        `)
        .eq('commitment.project_id', projectId)
        .eq('is_deleted', false)
        .order('due_date', { ascending: true });

    if (error) {
        console.error("Error fetching client payment schedules:", error);
        return { data: [] as any[], error };
    }

    return { data: data as any[], error: null };
}

export async function getClientRoles(orgId?: string) {
    const supabase = await createClient();
    const organizationId = orgId || await getActiveOrganizationId();
    if (!organizationId) return { error: "No authorized organization found" };

    const { data, error } = await supabase
        .from('client_roles')
        .select('*')
        .or(`organization_id.eq.${organizationId},organization_id.is.null`)
        .eq('is_deleted', false)
        .order('name');

    if (error) {
        console.error("Error fetching client roles:", error);
        return { data: [] as ClientRole[], error };
    }

    return { data: data as ClientRole[], error: null };
}

export async function getPortalSettings(projectId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('client_portal_settings')
        .select('*')
        .eq('project_id', projectId)
        .single();

    if (error) return { data: null, error };
    return { data: data as ClientPortalSettings, error: null };
}
