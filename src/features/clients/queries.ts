
import { createClient } from "@/lib/supabase/server";
import { sanitizeError } from "@/lib/error-utils";
import {
    ProjectClientView,
    ClientFinancialSummary,
    ClientCommitment,
    ClientPaymentView,
    ClientPaymentSchedule,
    ClientRole,
} from "./types";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";


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
        .schema('iam').from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!userData) return null;

    // Cross-schema: user_preferences está en iam
    const { data: prefData } = await supabase
        .schema('iam').from('user_preferences')
        .select('last_organization_id')
        .eq('user_id', userData.id)
        .single();

    return prefData?.last_organization_id || null;
}

export async function getClients(projectId: string | null) {
    const supabase = await createClient();

    let query = supabase
        .schema('projects').from('project_clients_view')
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
        .schema('projects').from('project_clients_view')
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
        .schema('contacts').from('contacts')
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
 * Get all contracts and change orders for an organization (from quotes_view)
 * Used in the "Contratos" tab of Cobros page
 */
export async function getOrganizationContracts(organizationId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('finance').from('quotes_view')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .in('quote_type', ['contract', 'change_order'])
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching organization contracts:", error);
        return { data: [], error };
    }

    return { data: data || [], error: null };
}

/**
 * Get financial summary for all clients in an organization
 */
export async function getFinancialSummaryByOrganization(organizationId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('finance').from('client_financial_summary_view')
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

    // Query base: commitments + currency (same schema: finance)
    const { data: commitments, error } = await supabase
        .schema('finance').from('client_commitments')
        .select(`
            *,
            currency:currencies(symbol, code)
        `)
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching commitments by organization:", error);
        return { data: [], error };
    }

    if (!commitments || commitments.length === 0) return { data: [], error: null };

    // Enrich: project names (projects schema)
    const projectIds = [...new Set(commitments.map(c => c.project_id).filter(Boolean))];
    let projectsMap: Record<string, string> = {};
    if (projectIds.length > 0) {
        const { data: projects } = await supabase
            .schema('projects').from('projects')
            .select('id, name')
            .in('id', projectIds);
        if (projects) {
            projectsMap = Object.fromEntries(projects.map(p => [p.id, p.name]));
        }
    }

    // Enrich: client info (projects schema -> contacts schema)
    const clientIds = [...new Set(commitments.map(c => c.client_id).filter(Boolean))];
    let clientsMap: Record<string, { id: string; contact_full_name: string | null; contact_company_name: string | null }> = {};
    if (clientIds.length > 0) {
        const { data: clients } = await supabase
            .schema('projects').from('project_clients')
            .select('id, contact_id')
            .in('id', clientIds);
        if (clients && clients.length > 0) {
            const contactIds = [...new Set(clients.map(c => c.contact_id).filter(Boolean))];
            let contactsMap: Record<string, { full_name: string | null; company_name: string | null }> = {};
            if (contactIds.length > 0) {
                const { data: contacts } = await supabase
                    .schema('contacts').from('contacts')
                    .select('id, full_name, company_name')
                    .in('id', contactIds);
                if (contacts) {
                    contactsMap = Object.fromEntries(contacts.map(c => [c.id, { full_name: c.full_name, company_name: c.company_name }]));
                }
            }
            for (const cl of clients) {
                const contact = contactsMap[cl.contact_id] || { full_name: null, company_name: null };
                clientsMap[cl.id] = { id: cl.id, contact_full_name: contact.full_name, contact_company_name: contact.company_name };
            }
        }
    }

    // Compose enriched data
    const enriched = commitments.map(c => ({
        ...c,
        project: projectsMap[c.project_id] ? { name: projectsMap[c.project_id] } : null,
        client: clientsMap[c.client_id] ? {
            id: clientsMap[c.client_id].id,
            contact: {
                full_name: clientsMap[c.client_id].contact_full_name,
                company_name: clientsMap[c.client_id].contact_company_name,
            }
        } : null,
    }));

    return { data: enriched, error: null };
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
        .schema('finance').from('client_payments_view')
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

    // Query base: schedules only (public schema)
    const { data: schedules, error } = await supabase
        .from('client_payment_schedule')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .order('due_date', { ascending: true });

    if (error) {
        console.error("Error fetching schedules by organization:", error);
        return { data: [] as any[], error };
    }

    if (!schedules || schedules.length === 0) return { data: [] as any[], error: null };

    // Enrich: currencies (finance schema)
    const currencyIds = [...new Set(schedules.map(s => s.currency_id).filter(Boolean))];
    let currenciesMap: Record<string, { symbol: string; code: string }> = {};
    if (currencyIds.length > 0) {
        const { data: currencies } = await supabase
            .schema('finance').from('currencies')
            .select('id, symbol, code')
            .in('id', currencyIds);
        if (currencies) {
            currenciesMap = Object.fromEntries(currencies.map(c => [c.id, { symbol: c.symbol, code: c.code }]));
        }
    }

    // Enrich: commitments (finance schema)
    const commitmentIds = [...new Set(schedules.map(s => s.commitment_id).filter(Boolean))];
    let commitmentsMap: Record<string, { id: string; project_id: string | null; client_id: string | null }> = {};
    if (commitmentIds.length > 0) {
        const { data: commitments } = await supabase
            .schema('finance').from('client_commitments')
            .select('id, project_id, client_id')
            .in('id', commitmentIds);
        if (commitments) {
            commitmentsMap = Object.fromEntries(commitments.map(c => [c.id, { id: c.id, project_id: c.project_id, client_id: c.client_id }]));
        }
    }

    // Enrich: client contacts (projects -> contacts)
    const clientIds = [...new Set(Object.values(commitmentsMap).map(c => c.client_id).filter(Boolean))] as string[];
    let clientContactMap: Record<string, { id: string; contact_full_name: string | null }> = {};
    if (clientIds.length > 0) {
        const { data: clients } = await supabase
            .schema('projects').from('project_clients')
            .select('id, contact_id')
            .in('id', clientIds);
        if (clients && clients.length > 0) {
            const contactIds = [...new Set(clients.map(c => c.contact_id).filter(Boolean))];
            let contactsMap: Record<string, string> = {};
            if (contactIds.length > 0) {
                const { data: contacts } = await supabase
                    .schema('contacts').from('contacts')
                    .select('id, full_name')
                    .in('id', contactIds);
                if (contacts) {
                    contactsMap = Object.fromEntries(contacts.map(c => [c.id, c.full_name]));
                }
            }
            for (const cl of clients) {
                clientContactMap[cl.id] = { id: cl.id, contact_full_name: contactsMap[cl.contact_id] || null };
            }
        }
    }

    // Compose enriched data
    const enriched = schedules.map(s => {
        const commitment = commitmentsMap[s.commitment_id];
        const client = commitment?.client_id ? clientContactMap[commitment.client_id] : null;
        return {
            ...s,
            currency: currenciesMap[s.currency_id] || null,
            commitment: commitment ? {
                id: commitment.id,
                project_id: commitment.project_id,
                client: client ? {
                    id: client.id,
                    contact: { full_name: client.contact_full_name }
                } : null,
            } : null,
        };
    });

    return { data: enriched as any[], error: null };
}

export async function getClientFinancialSummary(projectId: string | null) {
    const supabase = await createClient();

    let query = supabase
        .schema('finance').from('client_financial_summary_view')
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

    // Query base: commitments + currency (same schema: finance)
    let query = supabase
        .schema('finance').from('client_commitments')
        .select(`
            *,
            currency:currencies(symbol, code)
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (projectId) {
        query = query.eq('project_id', projectId);
    }

    const { data: commitments, error } = await query;

    if (error) {
        console.error("Error fetching client commitments:", error);
        return { data: [], error };
    }

    if (!commitments || commitments.length === 0) return { data: [], error: null };

    // Enrich: project names (projects schema)
    const projectIds = [...new Set(commitments.map(c => c.project_id).filter(Boolean))];
    let projectsMap: Record<string, string> = {};
    if (projectIds.length > 0) {
        const { data: projects } = await supabase
            .schema('projects').from('projects')
            .select('id, name')
            .in('id', projectIds);
        if (projects) {
            projectsMap = Object.fromEntries(projects.map(p => [p.id, p.name]));
        }
    }

    // Enrich: client info (projects -> contacts)
    const clientIds = [...new Set(commitments.map(c => c.client_id).filter(Boolean))];
    let clientsMap: Record<string, { id: string; contact_full_name: string | null; contact_company_name: string | null }> = {};
    if (clientIds.length > 0) {
        const { data: clients } = await supabase
            .schema('projects').from('project_clients')
            .select('id, contact_id')
            .in('id', clientIds);
        if (clients && clients.length > 0) {
            const contactIds = [...new Set(clients.map(c => c.contact_id).filter(Boolean))];
            let contactsMap: Record<string, { full_name: string | null; company_name: string | null }> = {};
            if (contactIds.length > 0) {
                const { data: contacts } = await supabase
                    .schema('contacts').from('contacts')
                    .select('id, full_name, company_name')
                    .in('id', contactIds);
                if (contacts) {
                    contactsMap = Object.fromEntries(contacts.map(c => [c.id, { full_name: c.full_name, company_name: c.company_name }]));
                }
            }
            for (const cl of clients) {
                const contact = contactsMap[cl.contact_id] || { full_name: null, company_name: null };
                clientsMap[cl.id] = { id: cl.id, contact_full_name: contact.full_name, contact_company_name: contact.company_name };
            }
        }
    }

    // Compose enriched data
    const enriched = commitments.map(c => ({
        ...c,
        project: projectsMap[c.project_id] ? { name: projectsMap[c.project_id] } : null,
        client: clientsMap[c.client_id] ? {
            id: clientsMap[c.client_id].id,
            contact: {
                full_name: clientsMap[c.client_id].contact_full_name,
                company_name: clientsMap[c.client_id].contact_company_name,
            }
        } : null,
    }));

    return { data: enriched, error: null };
}

export async function getClientPayments(projectId: string | null) {
    const supabase = await createClient();

    let query = supabase
        .schema('finance').from('client_payments_view')
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

    // Query base: schedules only (public schema)
    const { data: schedules, error } = await supabase
        .from('client_payment_schedule')
        .select('*')
        .eq('is_deleted', false)
        .order('due_date', { ascending: true });

    if (error) {
        console.error("Error fetching client payment schedules:", error);
        return { data: [] as any[], error };
    }

    if (!schedules || schedules.length === 0) return { data: [] as any[], error: null };

    // Enrich: currencies (finance schema)
    const currencyIds = [...new Set(schedules.map(s => s.currency_id).filter(Boolean))];
    let currenciesMap: Record<string, { symbol: string; code: string }> = {};
    if (currencyIds.length > 0) {
        const { data: currencies } = await supabase
            .schema('finance').from('currencies')
            .select('id, symbol, code')
            .in('id', currencyIds);
        if (currencies) {
            currenciesMap = Object.fromEntries(currencies.map(c => [c.id, { symbol: c.symbol, code: c.code }]));
        }
    }

    // Enrich: commitments (finance schema)
    const commitmentIds = [...new Set(schedules.map(s => s.commitment_id).filter(Boolean))];
    let commitmentsMap: Record<string, { id: string; project_id: string | null; client_id: string | null }> = {};
    if (commitmentIds.length > 0) {
        const { data: commitments } = await supabase
            .schema('finance').from('client_commitments')
            .select('id, project_id, client_id')
            .in('id', commitmentIds);
        if (commitments) {
            commitmentsMap = Object.fromEntries(commitments.map(c => [c.id, { id: c.id, project_id: c.project_id, client_id: c.client_id }]));
        }
    }

    // Filter by project if needed
    let filteredSchedules = schedules;
    if (projectId) {
        const validCommitmentIds = Object.entries(commitmentsMap)
            .filter(([_, c]) => c.project_id === projectId)
            .map(([id]) => id);
        filteredSchedules = schedules.filter(s => validCommitmentIds.includes(s.commitment_id));
    }

    // Enrich: client contacts (projects -> contacts)
    const clientIds = [...new Set(Object.values(commitmentsMap).map(c => c.client_id).filter(Boolean))] as string[];
    let clientContactMap: Record<string, { id: string; contact_full_name: string | null }> = {};
    if (clientIds.length > 0) {
        const { data: clients } = await supabase
            .schema('projects').from('project_clients')
            .select('id, contact_id')
            .in('id', clientIds);
        if (clients && clients.length > 0) {
            const contactIds = [...new Set(clients.map(c => c.contact_id).filter(Boolean))];
            let contactsMap: Record<string, string> = {};
            if (contactIds.length > 0) {
                const { data: contacts } = await supabase
                    .schema('contacts').from('contacts')
                    .select('id, full_name')
                    .in('id', contactIds);
                if (contacts) {
                    contactsMap = Object.fromEntries(contacts.map(c => [c.id, c.full_name]));
                }
            }
            for (const cl of clients) {
                clientContactMap[cl.id] = { id: cl.id, contact_full_name: contactsMap[cl.contact_id] || null };
            }
        }
    }

    // Compose enriched data
    const enriched = filteredSchedules.map(s => {
        const commitment = commitmentsMap[s.commitment_id];
        const client = commitment?.client_id ? clientContactMap[commitment.client_id] : null;
        return {
            ...s,
            currency: currenciesMap[s.currency_id] || null,
            commitment: commitment ? {
                id: commitment.id,
                project_id: commitment.project_id,
                client: client ? {
                    id: client.id,
                    contact: { full_name: client.contact_full_name }
                } : null,
            } : null,
        };
    });

    return { data: enriched as any[], error: null };
}

export async function getClientRoles(orgId?: string) {
    const supabase = await createClient();
    const organizationId = orgId || await getActiveOrganizationId();
    if (!organizationId) return { error: "No authorized organization found" };

    const { data, error } = await supabase
        .schema('projects').from('client_roles')
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
