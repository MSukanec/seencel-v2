
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
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { SiteLog } from "@/types/sitelog";

const s3Client = new S3Client({
    region: process.env.R2_REGION || "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
});

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
        .order('contact_full_name', { ascending: true });

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
        .order('contact_full_name', { ascending: true });

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

export async function getClientPortalSiteLogs(projectId: string) {
    const supabase = await createClient();

    const { data: logs, error } = await supabase
        .from('site_logs')
        .select(`
            *,
            entry_type:site_log_types(id, name, color, icon),
            author:project_members(
                id,
                user:users(full_name, email, avatar_url)
            ),
            media:media_links(
                id,
                media_file:media_files(
                    id,
                    bucket,
                    file_path,
                    file_name,
                    file_type,
                    file_size,
                    is_public,
                    width,
                    height
                )
            )
        `)
        .eq('project_id', projectId)
        .eq('is_deleted', false)
        .eq('is_public', true)
        .order('log_date', { ascending: false });

    if (error) {
        console.error("Error fetching portal logs:", error);
        return { data: [] as SiteLog[], error };
    }

    // Process media and sign URLs
    const formattedData = await Promise.all(logs.map(async (log) => {
        const mediaItems = await Promise.all(log.media.map(async (link: any) => {
            const file = link.media_file;
            if (!file) return null;

            let finalUrl = "";

            // If it's a public bucket, constructing the URL might be different, 
            // but here we assume all media access via Signed URL for consistency and security
            // unless we prefer public URLs for public buckets.
            // Following shared logic: sign if bucket private, or just sign everything for safety + expiry.
            // But we must check if file_path exists.

            if (file.bucket && file.file_path) {
                try {
                    const command = new GetObjectCommand({
                        Bucket: file.bucket,
                        Key: file.file_path,
                    });
                    finalUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
                } catch (e) {
                    console.error("Error signing URL:", e);
                }
            }

            return {
                id: file.id,
                url: finalUrl,
                type: file.file_type,
                name: file.file_name,
                bucket: file.bucket,
                path: file.file_path,
                // Add extra fields for the UI
                size: file.file_size
            };
        }));

        return {
            ...log,
            media: mediaItems.filter((m: any) => m !== null)
        };
    }));

    return { data: formattedData as SiteLog[], error: null };
}

/**
 * Fetch all data needed for the public client portal
 */
export async function getClientPortalData(projectId: string, clientId: string) {
    const supabase = await createClient();

    // Fetch all data in parallel
    const [
        projectResult,
        clientResult,
        settingsResult,
        brandingResult,
        paymentsResult,
        schedulesResult,
        summaryResult,
        logsResult
    ] = await Promise.all([
        // Project info
        supabase
            .from('projects')
            .select('id, name, organization_id, image_url, color')
            .eq('id', projectId)
            .single(),

        // Client info
        supabase
            .from('project_clients_view')
            .select('*')
            .eq('id', clientId)
            .single(),

        // Portal settings
        supabase
            .from('client_portal_settings')
            .select('*')
            .eq('project_id', projectId)
            .single(),

        // Portal branding (may not exist)
        supabase
            .from('client_portal_branding')
            .select('*')
            .eq('project_id', projectId)
            .single(),

        // Payments for this client
        supabase
            .from('client_payments_view')
            .select('*')
            .eq('project_id', projectId)
            .eq('client_id', clientId)
            .order('payment_date', { ascending: false }),

        // Payment schedules
        supabase
            .from('client_payment_schedule')
            .select('*')
            .eq('project_id', projectId)
            .eq('client_id', clientId)
            .order('due_date', { ascending: true }),

        // Financial summary
        supabase
            .from('client_financial_summary_view')
            .select('*')
            .eq('project_id', projectId)
            .eq('client_id', clientId),

        // Site Logs
        getClientPortalSiteLogs(projectId)
    ]);

    return {
        project: projectResult.data,
        client: clientResult.data,
        settings: settingsResult.data,
        branding: brandingResult.data,  // Will be null if no custom branding
        payments: paymentsResult.data || [],
        schedules: schedulesResult.data || [],
        summary: summaryResult.data?.[0] || null,
        logs: logsResult.data || [],
        error: projectResult.error || clientResult.error
    };
}

