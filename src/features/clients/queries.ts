
import { createClient } from "@/lib/supabase/server";
import { sanitizeError } from "@/lib/error-utils";
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
import { SiteLog } from "@/features/sitelog/types";

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

export async function getClients(projectId: string | null) {
    const supabase = await createClient();

    let query = supabase
        .from('project_clients_view')
        .select('*')
        .eq('is_deleted', false)
        .order('contact_full_name', { ascending: true });

    if (projectId) {
        query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

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
 * Get all contacts for an organization (for representative selection)
 */
export async function getOrganizationContacts(organizationId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('contacts')
        .select('id, full_name, email, phone, linked_user_id, image_url')
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .order('full_name', { ascending: true });

    if (error) {
        console.error("Error fetching contacts:", error);
        return { data: [], error };
    }

    return { data: data || [], error: null };
}

/**
 * Get all representatives for a project (grouped by client for UI)
 */
export async function getProjectRepresentatives(projectId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('client_representatives_view')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_deleted', false);

    if (error) {
        console.error("Error fetching project representatives:", error);
        return { data: [], error };
    }

    // Group by client_id for easy lookup
    const byClient = (data || []).reduce((acc, rep) => {
        if (!acc[rep.client_id]) {
            acc[rep.client_id] = [];
        }
        acc[rep.client_id].push({
            id: rep.id,
            client_id: rep.client_id,
            contact_id: rep.contact_id,
            role: rep.role,
            can_approve: rep.can_approve,
            can_chat: rep.can_chat,
            accepted_at: rep.accepted_at,
            rep_full_name: rep.rep_full_name,
            rep_email: rep.rep_email,
            linked_user_id: rep.linked_user_id,
        });
        return acc;
    }, {} as Record<string, any[]>);

    return { data: byClient, error: null };
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
 * Helper to enrich payments with media signed URLs
 * OPTIMIZED: Pre-generates all signed URLs in a single batch for better performance
 */
async function enrichPaymentsWithMedia(payments: any[]) {
    if (!payments || payments.length === 0) return [];

    const supabase = await createClient();
    const paymentIds = payments.map(p => p.id);

    // Single query for all media links
    const { data: mediaLinks } = await supabase
        .from('media_links')
        .select(`
            client_payment_id,
            media_file:media_files (
                id,
                bucket,
                file_path,
                file_name,
                file_type,
                file_size
            )
        `)
        .in('client_payment_id', paymentIds);

    if (!mediaLinks || mediaLinks.length === 0) {
        // No media, return payments as-is with empty attachments
        return payments.map(p => ({ ...p, attachments: [] }));
    }

    // === BATCH SIGNED URL GENERATION ===
    // Collect all unique files that need signing
    const filesToSign: { paymentId: string; fileData: any }[] = [];
    for (const link of mediaLinks as any[]) {
        const file = link.media_file;
        if (file?.bucket && file?.file_path) {
            filesToSign.push({
                paymentId: link.client_payment_id,
                fileData: file
            });
        }
    }

    // Generate ALL signed URLs in parallel (single Promise.all)
    const signedResults = await Promise.all(
        filesToSign.map(async ({ paymentId, fileData }) => {
            let image_url = "";
            try {
                const command = new GetObjectCommand({
                    Bucket: fileData.bucket,
                    Key: fileData.file_path,
                });
                image_url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
            } catch (e) {
                console.error("Error signing payment media url:", e);
            }

            let mime = 'application/octet-stream';
            if (fileData.file_type === 'image') mime = 'image/*';
            else if (fileData.file_type === 'pdf') mime = 'application/pdf';
            else if (fileData.file_type === 'video') mime = 'video/*';
            else if (fileData.file_type === 'doc') mime = 'application/msword';

            return {
                paymentId,
                file: {
                    id: fileData.id,
                    url: image_url,
                    name: fileData.file_name,
                    mime,
                    size: fileData.file_size
                }
            };
        })
    );

    // === GROUP FILES BY PAYMENT ===
    const filesByPaymentId: Record<string, any[]> = {};
    for (const result of signedResults) {
        if (!filesByPaymentId[result.paymentId]) {
            filesByPaymentId[result.paymentId] = [];
        }
        if (result.file.url) {
            filesByPaymentId[result.paymentId].push(result.file);
        }
    }

    // === MAP TO PAYMENTS (synchronous, no async) ===
    return payments.map(payment => {
        const attachments = filesByPaymentId[payment.id] || [];
        const primary = attachments[0];

        return {
            ...payment,
            image_url: primary?.url || payment.image_url || null,
            media_mime: primary?.mime,
            media_name: primary?.name,
            media_size: primary?.size,
            attachments
        };
    });
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

    const enriched = await enrichPaymentsWithMedia(data);
    return { data: enriched as ClientPaymentView[], error: null };
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

export async function getClientFinancialSummary(projectId: string | null) {
    const supabase = await createClient();

    let query = supabase
        .from('client_financial_summary_view')
        .select('*');

    if (projectId) {
        query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching client financial summary:", error);
        return { data: [] as ClientFinancialSummary[], error };
    }

    return { data: data as ClientFinancialSummary[], error: null };
}

export async function getClientCommitments(projectId: string | null) {
    const supabase = await createClient();

    let query = supabase
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
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (projectId) {
        query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching client commitments:", error);
        return { data: [], error };
    }

    return { data, error: null };
}

export async function getClientPayments(projectId: string | null) {
    const supabase = await createClient();

    let query = supabase
        .from('client_payments_view')
        .select('*')
        .order('payment_date', { ascending: false });

    if (projectId) {
        query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching client payments:", error);
        return { data: [] as ClientPaymentView[], error };
    }

    const enriched = await enrichPaymentsWithMedia(data);
    return { data: enriched as ClientPaymentView[], error: null };
}

export async function getClientPaymentSchedules(projectId: string | null) {
    const supabase = await createClient();

    if (projectId) {
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

    // No project filter — get all schedules
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

    // Simplified query - only basic site_log fields
    const { data: logs, error } = await supabase
        .from('site_logs')
        .select(`
            id,
            log_date,
            comments,
            is_public,
            status,
            created_at
        `)
        .eq('project_id', projectId)
        .eq('is_deleted', false)
        .eq('is_public', true)
        .order('log_date', { ascending: false })
        .limit(20);

    if (error) {
        console.error("Error fetching portal logs:", error);
        return { data: [] as SiteLog[], error };
    }

    // Return simplified data
    const formattedData = logs.map((log) => ({
        ...log,
        media: [] // No media for now
    }));

    return { data: formattedData as unknown as SiteLog[], error: null };
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
        logsResult,
        quotesResult
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
        getClientPortalSiteLogs(projectId),

        // Project Quotes (for portal display) - using quotes_view for pre-calculated totals
        supabase
            .from('quotes_view')
            .select('id, name, description, status, quote_date, total_with_tax, tax_pct, tax_label, discount_pct, currency_symbol')
            .eq('project_id', projectId)
            .eq('is_deleted', false)
            .neq('status', 'draft') // Don't show drafts to clients
            .order('created_at', { ascending: false })
    ]);

    // Quotes already have all fields from the view
    const quotes = (quotesResult.data || []).map((q: any) => ({
        id: q.id,
        name: q.name,
        description: q.description,
        status: q.status,
        total_with_tax: q.total_with_tax || 0,
        tax_pct: q.tax_pct || 0,
        tax_label: q.tax_label || null,
        discount_pct: q.discount_pct || 0,
        created_at: q.quote_date,
        currency_symbol: q.currency_symbol || '$'
    }));

    return {
        project: projectResult.data,
        client: clientResult.data,
        settings: settingsResult.data,
        branding: brandingResult.data,  // Will be null if no custom branding
        payments: paymentsResult.data || [],
        schedules: schedulesResult.data || [],
        summary: summaryResult.data?.[0]
            ? { ...summaryResult.data[0], project_id: projectId, client_id: clientId }
            : { project_id: projectId, client_id: clientId },
        logs: logsResult.data || [],
        quotes,
        error: projectResult.error || clientResult.error
    };
}

/**
 * Types for authenticated client portal
 */
export interface ClientPortalInfo {
    client_id: string;
    client_name: string;
    role: string;
    can_approve: boolean;
    can_chat: boolean;
    rep_id: string;
}

export interface ProjectPortal {
    project_id: string;
    project_name: string;
    clients: ClientPortalInfo[];
}

/**
 * Get all client portals where the current authenticated user is a representative.
 * Returns clients grouped with their project info for the authenticated portal selector.
 */
export async function getMyClientPortals(): Promise<{ data: ProjectPortal[]; error: string | null }> {
    const supabase = await createClient();

    // Get current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { data: [], error: "No authenticated user" };
    }

    // Get the user record to find linked contacts through client_representatives
    const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!userData) {
        return { data: [], error: "User not found" };
    }

    // Find all client representations through the view
    // This joins: client_representatives -> contacts -> users
    const { data: representations, error } = await supabase
        .from('client_representatives_view')
        .select('*')
        .eq('linked_user_id', userData.id)
        .eq('is_deleted', false);

    if (error) {
        console.error("Error fetching client portals:", error);
        return { data: [], error: sanitizeError(error) };
    }

    // Group by project for better UI
    const portalsByProject = representations?.reduce((acc, rep) => {
        const projectId = rep.project_id;
        if (!acc[projectId]) {
            acc[projectId] = {
                project_id: projectId,
                project_name: rep.project_name,
                clients: []
            };
        }
        acc[projectId].clients.push({
            client_id: rep.client_id,
            client_name: rep.client_name,
            role: rep.role,
            can_approve: rep.can_approve,
            can_chat: rep.can_chat,
            rep_id: rep.id
        });
        return acc;
    }, {} as Record<string, ProjectPortal>) || {};

    return {
        data: Object.values(portalsByProject),
        error: null
    };
}


/**
 * Get representatives for a specific client (for management UI)
 */
export async function getClientRepresentatives(clientId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('client_representatives_view')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_deleted', false);

    if (error) {
        console.error("Error fetching client representatives:", error);
        return { data: [], error };
    }

    return { data, error: null };
}

