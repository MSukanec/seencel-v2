
"use server";


import { sanitizeError } from "@/lib/error-utils";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { projectClientSchema, clientRoleSchema, clientCommitmentSchema } from "./types";

// ===============================================
// Auth Helper
// ===============================================

/**
 * Get the authenticated user ID from Supabase auth.
 * Returns null if not authenticated.
 */
async function getAuthenticatedUserId(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
}

// ===============================================
// Clients (Project Clients)
// ===============================================

const createClientSchema = z.object({
    project_id: z.string().uuid(),
    contact_id: z.string().uuid(),
    organization_id: z.string().uuid(),
    client_role_id: z.string().uuid().optional(),
    notes: z.string().optional(),
    is_primary: z.boolean().optional(),
});

export async function createClientAction(input: z.infer<typeof createClientSchema>) {
    const supabase = await createClient();

    // Check if client already exists for this project to avoid duplicates (unique constraint usually handles this but good to have nice error)
    // The unique index is `uniq_project_client` on (project_id, contact_id)

    const { data, error } = await supabase
        .from('project_clients')
        .insert({
            project_id: input.project_id,
            contact_id: input.contact_id,
            organization_id: input.organization_id,
            client_role_id: input.client_role_id,
            notes: input.notes,
            is_primary: input.is_primary ?? true,
            status: 'active'
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating client:", error);
        if (error.code === '23505') {
            throw new Error("Este contacto ya es cliente de este proyecto.");
        }
        throw new Error("Error al crear el cliente.");
    }

    // Auto-grant project_access if contact has a linked Seencel user
    try {
        const { data: contact } = await supabase
            .from("contacts")
            .select("linked_user_id")
            .eq("id", input.contact_id)
            .single();

        if (contact?.linked_user_id) {
            // Check if access already exists (e.g., from a previous project or manual link)
            const { data: existingAccess } = await supabase
                .from("project_access")
                .select("id")
                .eq("project_id", input.project_id)
                .eq("user_id", contact.linked_user_id)
                .eq("is_deleted", false)
                .maybeSingle();

            if (!existingAccess) {
                const { linkCollaboratorToProjectAction } = await import("@/features/external-actors/project-access-actions");
                await linkCollaboratorToProjectAction({
                    project_id: input.project_id,
                    organization_id: input.organization_id,
                    user_id: contact.linked_user_id,
                    access_type: "client",
                    access_level: "viewer",
                    client_id: data.id,
                });
            }
        }
    } catch (accessError) {
        // Non-blocking: client was created successfully, access grant is best-effort
        console.error("Error auto-granting project access:", accessError);
    }

    revalidatePath('/organization/clients');
    return data;
}

const updateClientSchema = createClientSchema.partial().extend({
    id: z.string().uuid(),
});

export async function updateClientAction(input: z.infer<typeof updateClientSchema>) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('project_clients')
        .update({
            project_id: input.project_id,
            contact_id: input.contact_id,
            organization_id: input.organization_id,
            client_role_id: input.client_role_id,
            notes: input.notes,
            is_primary: input.is_primary,
            updated_at: new Date().toISOString()
        })
        .eq('id', input.id)
        .select()
        .single();

    if (error) {
        console.error("Error updating client:", error);
        throw new Error("Error al actualizar el cliente.");
    }

    revalidatePath('/organization/clients');
    return data;
}

export async function deleteClientAction(clientId: string) {
    const supabase = await createClient();

    const now = new Date().toISOString();

    // Soft-delete project_client
    const { error } = await supabase
        .from('project_clients')
        .update({ is_deleted: true, deleted_at: now })
        .eq('id', clientId);

    if (error) {
        console.error("Error deleting client:", error);
        throw new Error("Error al eliminar el cliente.");
    }

    // Also soft-delete any project_access linked to this client_id
    await supabase
        .from('project_access')
        .update({ is_deleted: true, deleted_at: now, is_active: false })
        .eq('client_id', clientId)
        .eq('is_deleted', false);

    revalidatePath('/organization/clients');
}

/**
 * Deactivate a project client (revoke access but keep as historical record).
 * Sets status = 'inactive' on project_clients and is_active = false on project_access.
 */
export async function deactivateClientAction(clientId: string) {
    const supabase = await createClient();

    // Set client as inactive (keeps the record visible)
    const { error } = await supabase
        .from('project_clients')
        .update({ status: 'inactive' })
        .eq('id', clientId);

    if (error) {
        console.error("Error deactivating client:", error);
        throw new Error("Error al desvincular el cliente.");
    }

    // Revoke project_access linked to this client_id
    await supabase
        .from('project_access')
        .update({ is_active: false })
        .eq('client_id', clientId)
        .eq('is_deleted', false);

    revalidatePath('/organization/clients');
}

/**
 * Reactivate a previously deactivated project client.
 * Sets status = 'active' on project_clients and is_active = true on project_access.
 */
export async function reactivateClientAction(clientId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('project_clients')
        .update({ status: 'active' })
        .eq('id', clientId);

    if (error) {
        console.error("Error reactivating client:", error);
        throw new Error("Error al reactivar el cliente.");
    }

    // Reactivate project_access linked to this client_id
    await supabase
        .from('project_access')
        .update({ is_active: true })
        .eq('client_id', clientId)
        .eq('is_deleted', false);

    revalidatePath('/organization/clients');
}

// ===============================================
// Client Roles
// ===============================================

const createRoleSchema = z.object({
    organization_id: z.string().uuid(),
    name: z.string().min(1),
    description: z.string().optional(),
});

export async function createClientRoleAction(input: z.infer<typeof createRoleSchema>) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('client_roles')
        .insert({
            organization_id: input.organization_id,
            name: input.name,
            description: input.description,
            is_system: false
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating role:", error);
        throw new Error("Error al crear el rol.");
    }

    revalidatePath('/organization/clients');
    return data;
}

const updateRoleSchema = createRoleSchema.partial().extend({
    id: z.string().uuid(),
});

export async function updateClientRoleAction(input: z.infer<typeof updateRoleSchema>) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('client_roles')
        .update({
            name: input.name,
            description: input.description,
        })
        .eq('id', input.id)
        .select()
        .single();

    if (error) {
        console.error("Error updating role:", error);
        throw new Error("Error al actualizar el rol.");
    }

    revalidatePath('/organization/clients');
    return data;
}

export async function deleteClientRoleAction(roleId: string, replacementId?: string) {
    const supabase = await createClient();

    // 1. If replacementId is provided, migrate clients
    if (replacementId) {
        const { error: migrationError } = await supabase
            .from('project_clients')
            .update({ client_role_id: replacementId })
            .eq('client_role_id', roleId);

        if (migrationError) {
            console.error("Error migrating clients:", migrationError);
            throw new Error("Error al reasignar clientes antes de eliminar.");
        }
    }

    // 2. Perform Soft Delete
    const { error } = await supabase
        .from('client_roles')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', roleId);

    if (error) {
        console.error("Error deleting role:", error);
        throw new Error("Error al eliminar el rol.");
    }

    revalidatePath('/organization/clients');
}

// ===============================================
// Commitments
// ===============================================

const createCommitmentSchema = clientCommitmentSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
    is_deleted: true,
    created_by: true
}).extend({
    // Allow strings for form handling, convert to numbers
    amount: z.union([z.string(), z.number()]).transform(val => Number(val)),
    exchange_rate: z.union([z.string(), z.number()]).optional().transform(val => val ? Number(val) : 1),
    currency_code: z.string().optional(),
    unit_name: z.string().nullable(),
    concept: z.string().nullable(),
    description: z.string().nullable(),
});

export async function createCommitmentAction(input: z.infer<typeof createCommitmentSchema> | FormData) {
    const supabase = await createClient();

    // Get current user for `created_by` (optional, relies on trigger/default usually, or we set it)
    const { data: { user } } = await supabase.auth.getUser();

    // We need to fetch the member id for the user for `created_by`, skipping for now to keep it simple, 
    // assuming backend triggers or RLS handles current_user linking if strict.
    // Actually schema says `created_by uuid references organization_members`. 
    // We should look up the member ID. For speed, I'll assume the client passes it or we make do.
    // Let's rely on DB default if possible, or leave null.

    // Handling FormData input
    let payload = input as any;
    let currencyCodeToCheck: string | null = null;

    if (input instanceof FormData) {
        const raw = Object.fromEntries(input.entries());
        payload = {
            ...raw,
            amount: Number(raw.amount),
            exchange_rate: raw.exchange_rate ? Number(raw.exchange_rate) : 1,
            // Handle optional fields
            unit_name: raw.unit_name || null,
            concept: raw.concept || null,
            description: raw.description || null,
        };
        currencyCodeToCheck = raw.currency_code as string || null;
    } else {
        currencyCodeToCheck = (input as any).currency_code || null;
    }

    if (!payload.exchange_rate) payload.exchange_rate = 1;

    // 1. Fetch currency to apply Latam Rule (USD -> Multiply, Others -> Keep)
    // Simplified: Just check public table, fallback to view if needed.

    let currencyCode: string | null = currencyCodeToCheck;
    const currencyIdToCheck = payload.currency_id;

    // Try Public Table first
    if (!currencyCode) {
        const { data: pubCurrency } = await supabase
            .from('currencies')
            .select('code')
            .eq('id', currencyIdToCheck)
            .single();

        if (pubCurrency) {
            currencyCode = pubCurrency.code;
        } else {
            // Fallback to View
            const { data: viewCurrency } = await supabase
                .from('organization_currencies_view')
                .select('currency_code')
                .eq('organization_id', payload.organization_id)
                .eq('currency_id', currencyIdToCheck)
                .single();
            if (viewCurrency) currencyCode = viewCurrency.currency_code;
        }
    }

    if (!currencyCode) throw new Error("Error al validar la moneda del compromiso.");

    // Insert commitment - functional_amount is calculated dynamically in views/frontend
    const { data, error } = await supabase
        .from('client_commitments')
        .insert({
            project_id: payload.project_id,
            client_id: payload.client_id,
            organization_id: payload.organization_id,
            amount: payload.amount,
            currency_id: currencyIdToCheck,
            exchange_rate: payload.exchange_rate,
            commitment_method: payload.commitment_method,
            unit_name: payload.unit_name,
            concept: payload.concept,
            description: payload.description
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating commitment:", error);
        throw new Error("Error al crear el compromiso.");
    }

    revalidatePath('/organization/clients');
    return data;
}

const updateCommitmentSchema = createCommitmentSchema.partial().extend({
    id: z.string().uuid(),
});

export async function updateCommitmentAction(input: z.infer<typeof updateCommitmentSchema>) {
    const supabase = await createClient();

    // Handling FormData input
    let payload = input as any;
    let currencyCodeToCheck: string | null = null;
    let commitmentId: string | null = null;

    if (input instanceof FormData) {
        const raw = Object.fromEntries(input.entries());
        payload = {
            ...raw,
            amount: Number(raw.amount),
            exchange_rate: raw.exchange_rate ? Number(raw.exchange_rate) : 1,
            // Handle specific fields
            client_id: raw.client_id,
            project_id: raw.project_id,
            organization_id: raw.organization_id,
            unit_name: raw.unit_name || null,
            concept: raw.concept || null,
            description: raw.description || null,
        };
        commitmentId = raw.id as string || (input as any).id;
        currencyCodeToCheck = raw.currency_code as string || null;
    } else {
        commitmentId = input.id;
        currencyCodeToCheck = (input as any).currency_code || null;
    }

    if (!commitmentId) throw new Error("ID de compromiso requerido para actualización.");

    // 1. Fetch current commitment to get org_id if needed
    const { data: currentCommitment, error: fetchError } = await supabase
        .from('client_commitments')
        .select('organization_id, currency_id, amount, exchange_rate')
        .eq('id', commitmentId)
        .single();

    if (fetchError || !currentCommitment) throw new Error("Compromiso no encontrado.");

    // 2. Resolve Currency for Latam Rule
    const currencyIdToCheck = payload.currency_id ?? currentCommitment.currency_id;
    let currencyCode = currencyCodeToCheck;

    if (!currencyCode) {
        const { data: pubCurrency } = await supabase
            .from('currencies')
            .select('code')
            .eq('id', currencyIdToCheck)
            .single();

        if (pubCurrency) {
            currencyCode = pubCurrency.code;
        } else {
            const { data: viewCurrency } = await supabase
                .from('organization_currencies_view')
                .select('currency_code')
                .eq('organization_id', currentCommitment.organization_id)
                .eq('currency_id', currencyIdToCheck)
                .single();
            if (viewCurrency) currencyCode = viewCurrency.currency_code;
        }
    }

    if (!currencyCode) throw new Error("Error al validar moneda en actualización de compromiso.");

    // 3. Calc Functional Amount
    const newAmount = payload.amount ?? currentCommitment.amount;
    const newRate = payload.exchange_rate ?? currentCommitment.exchange_rate ?? 1;

    // Update commitment - functional amount calculated dynamically
    const { data, error } = await supabase
        .from('client_commitments')
        .update({
            amount: newAmount,
            currency_id: currencyIdToCheck,
            exchange_rate: newRate,
            commitment_method: payload.commitment_method,
            unit_name: payload.unit_name,
            concept: payload.concept,
            description: payload.description,
            client_id: payload.client_id,
            updated_at: new Date().toISOString()
        })
        .eq('id', commitmentId)
        .select()
        .single();

    if (error) {
        console.error("Error updating commitment:", error);
        throw new Error("Error al actualizar el compromiso.");
    }

    revalidatePath('/organization/clients');
    return data;
}

export async function deleteCommitmentAction(commitmentId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('client_commitments')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', commitmentId);

    if (error) {
        console.error("Error deleting commitment:", error);
        throw new Error("Error al eliminar el compromiso.");
    }

    revalidatePath('/organization/clients');
}

// ===============================================
// Payments
// ===============================================

const createPaymentSchema = z.object({
    project_id: z.string().uuid(),
    organization_id: z.string().uuid(),
    wallet_id: z.string().uuid(),
    client_id: z.string().uuid().nullable(),
    commitment_id: z.string().uuid().nullable(),
    schedule_id: z.string().uuid().nullable(),
    amount: z.number().positive(),
    currency_id: z.string().uuid(),
    exchange_rate: z.number().nullable(),
    payment_date: z.string(), // YYYY-MM-DD
    notes: z.string().optional(),
    reference: z.string().optional(),
    status: z.enum(['confirmed', 'pending', 'rejected', 'void']).default('confirmed'),
});

export async function createPaymentAction(input: z.infer<typeof createPaymentSchema>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Handling FormData input if necessary
    let payload = input as any;
    let currencyCodeToCheck: string | null = null;
    let mediaFilesJson: string | null = null;

    if (input instanceof FormData) {
        const raw = Object.fromEntries(input.entries());
        payload = {
            ...raw,
            amount: Number(raw.amount),
            exchange_rate: raw.exchange_rate ? Number(raw.exchange_rate) : null,
            // Handle nullables
            schedule_id: raw.schedule_id === '' ? null : raw.schedule_id,
            commitment_id: raw.commitment_id === '' ? null : raw.commitment_id,
            client_id: raw.client_id === '' ? null : raw.client_id,
        };
        currencyCodeToCheck = raw.currency_code as string || null;
        mediaFilesJson = raw.media_files as string || null;
    } else {
        // Assume it's an object, check if currency_code was passed (even if not in schema type definition)
        currencyCodeToCheck = (input as any).currency_code || null;
        mediaFilesJson = (input as any).media_files || null;
    }

    // 1. Fetch currency to check code for Latam Rule
    // Strategy: Trust frontend currency_code if available.

    let currencyCode: string | null = currencyCodeToCheck;

    // Fallback: If no code provided, fetch from DB (Public table -> View)
    if (!currencyCode) {
        const { data: publicCurrency, error: currencyError } = await supabase
            .from('currencies')
            .select('code')
            .eq('id', input.currency_id)
            .single();

        if (publicCurrency) {
            currencyCode = publicCurrency.code;
        } else {
            const { data: viewCurrency } = await supabase
                .from('organization_currencies_view')
                .select('currency_code')
                .eq('organization_id', payload.organization_id)
                .eq('currency_id', payload.currency_id)
                .single();

            if (viewCurrency) currencyCode = viewCurrency.currency_code;
        }
    }

    if (!currencyCode) {
        // Fallback: If still unknown, and we are creating, we might fail or default.
        // But throwing error is safer.
        throw new Error("Error al validar la moneda: No se pudo obtener información de la divisa.");
    }

    // Insert payment - functional amount calculated dynamically in views/frontend
    const { data, error } = await supabase
        .from('client_payments')
        .insert({
            project_id: payload.project_id,
            organization_id: payload.organization_id,
            wallet_id: payload.wallet_id,
            client_id: payload.client_id,
            commitment_id: payload.commitment_id,
            schedule_id: payload.schedule_id,
            amount: payload.amount,
            currency_id: payload.currency_id,
            exchange_rate: payload.exchange_rate,
            payment_date: payload.payment_date,
            notes: payload.notes,
            reference: payload.reference,
            status: payload.status
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating payment:", error);
        throw new Error("Error al registrar el pago.");
    }

    // === TRANSACTIONAL SECTION START ===
    // These operations should ideally be atomic. If critical ones fail, rollback the payment.
    let rollbackNeeded = false;
    let rollbackReason = '';

    try {
        // 3. Handle Media Attachment
        if (mediaFilesJson && data?.id && user?.id) {
            const mediaList = JSON.parse(mediaFilesJson);
            if (Array.isArray(mediaList)) {
                for (const mediaData of mediaList) {
                    if (mediaData.id === 'existing') continue;
                    if (!mediaData.path || !mediaData.bucket) continue;

                    const dbType = mediaData.type.startsWith('image/') ? 'image' : mediaData.type === 'application/pdf' ? 'pdf' : 'other';

                    // Insert Media File
                    const { data: fileData, error: fileError } = await supabase
                        .from('media_files')
                        .insert({
                            organization_id: payload.organization_id,
                            bucket: mediaData.bucket,
                            file_path: mediaData.path,
                            file_name: mediaData.name,
                            file_type: dbType,
                            file_size: mediaData.size,
                            created_by: user.id,
                            is_public: false
                        })
                        .select()
                        .single();

                    if (!fileError && fileData) {
                        // Link
                        const { error: linkError } = await supabase.from('media_links').insert({
                            media_file_id: fileData.id,
                            client_payment_id: data.id,
                            organization_id: payload.organization_id,
                            project_id: payload.project_id,
                            created_by: user.id,
                            category: 'financial',
                            visibility: 'private'
                        });
                        if (linkError) {
                            console.error("Error linking media file:", linkError);
                            // Non-critical: file exists but link failed - continue
                        }
                    } else {
                        console.error("Error creating media file record:", fileError);
                        // Non-critical: continue with other files
                    }
                }
            }
        }

        // 4. If it's linked to a schedule, update the schedule status
        if (input.schedule_id && input.status === 'confirmed') {
            const { error: scheduleError } = await supabase
                .from('client_payment_schedule')
                .update({
                    status: 'paid',
                    paid_at: new Date().toISOString(),
                })
                .eq('id', payload.schedule_id);

            if (scheduleError) {
                console.error("Error updating schedule status:", scheduleError);
                // This is more critical - schedule won't reflect payment
                // But we don't rollback for this, just log
            }
        }
    } catch (e) {
        console.error("Critical error in post-payment operations:", e);
        rollbackNeeded = true;
        rollbackReason = e instanceof Error ? sanitizeError(e) : 'Unknown error';
    }

    // === ROLLBACK IF NEEDED ===
    if (rollbackNeeded && data?.id) {
        console.error(`Rolling back payment ${data.id} due to: ${rollbackReason}`);
        await supabase
            .from('client_payments')
            .update({ is_deleted: true, deleted_at: new Date().toISOString() })
            .eq('id', data.id);

        throw new Error(`Error al procesar el pago: ${rollbackReason}. El pago fue revertido.`);
    }
    // === TRANSACTIONAL SECTION END ===

    revalidatePath('/organization/clients');
    return data;
}

const updatePaymentSchema = createPaymentSchema.partial().extend({
    id: z.string().uuid(),
});

export async function updatePaymentAction(input: z.infer<typeof updatePaymentSchema>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Handling FormData input
    let payload = input as any;
    let currencyCodeToCheck: string | null = null;
    let paymentId: string | null = null;
    let mediaFilesJson: string | null = null;

    if (input instanceof FormData) {
        const raw = Object.fromEntries(input.entries());
        payload = {
            ...raw,
            amount: Number(raw.amount),
            exchange_rate: raw.exchange_rate ? Number(raw.exchange_rate) : null,
            // Handle nullables
            schedule_id: raw.schedule_id === '' ? null : raw.schedule_id,
            commitment_id: raw.commitment_id === '' ? null : raw.commitment_id,
            client_id: raw.client_id === '' ? null : raw.client_id,
        };
        // ID is crucial for update
        paymentId = raw.id as string || (input as any).id;
        currencyCodeToCheck = raw.currency_code as string || null;
        mediaFilesJson = raw.media_files as string || null;
    } else {
        paymentId = input.id;
        currencyCodeToCheck = (input as any).currency_code || null;
        mediaFilesJson = (input as any).media_files || null;
    }

    if (!paymentId) {
        throw new Error("No se proporcionó ID para actualizar el pago.");
    }

    // 1. Fetch current payment to get amount/rate for calculation AND organization_id
    const { data: currentPayment, error: fetchError } = await supabase
        .from('client_payments')
        .select('amount, exchange_rate, currency_id, organization_id')
        .eq('id', paymentId)
        .single();

    if (fetchError || !currentPayment) {
        throw new Error("No se encontró el pago a actualizar.");
    }

    // 2. Fetch currency details 
    // Strategy: Trust frontend currency_code if available.

    let currencyCode: string | null = currencyCodeToCheck;

    if (!currencyCode) {
        // We need to know if the currency (new or existing) is USD
        const currencyIdToCheck = payload.currency_id ?? currentPayment.currency_id;

        const { data: pubCurrency } = await supabase
            .from('currencies')
            .select('code')
            .eq('id', currencyIdToCheck)
            .single();

        if (pubCurrency) {
            currencyCode = pubCurrency.code;
        } else {
            const { data: viewCurrency } = await supabase
                .from('organization_currencies_view')
                .select('currency_code')
                .eq('organization_id', currentPayment.organization_id)
                .eq('currency_id', currencyIdToCheck)
                .single();
            if (viewCurrency) currencyCode = viewCurrency.currency_code;
        }
    }

    if (!currencyCode) throw new Error("Error al validar moneda durante actualización.");

    // Update payment - functional amount calculated dynamically
    const { data, error } = await supabase
        .from('client_payments')
        .update({
            project_id: payload.project_id,
            organization_id: payload.organization_id,
            wallet_id: payload.wallet_id,
            client_id: payload.client_id,
            commitment_id: payload.commitment_id,
            schedule_id: payload.schedule_id,
            amount: payload.amount,
            currency_id: payload.currency_id,
            exchange_rate: payload.exchange_rate,
            payment_date: payload.payment_date,
            notes: payload.notes,
            reference: payload.reference,
            status: payload.status,
            updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select()
        .single();

    if (error) {
        console.error("Error updating payment:", error);
        throw new Error("Error al actualizar el pago.");
    }

    // 4. Handle Media Attachment (New)
    if (mediaFilesJson && data?.id && user?.id) {
        try {
            const mediaList = JSON.parse(mediaFilesJson);
            if (Array.isArray(mediaList)) {
                for (const mediaData of mediaList) {
                    // Skip existing
                    if (mediaData.id === 'existing') continue;
                    if (!mediaData.path || !mediaData.bucket) continue;

                    const dbType = mediaData.type.startsWith('image/') ? 'image' : mediaData.type === 'application/pdf' ? 'pdf' : 'other';

                    // Insert Media File
                    const { data: fileData, error: fileError } = await supabase
                        .from('media_files')
                        .insert({
                            organization_id: currentPayment.organization_id,
                            bucket: mediaData.bucket,
                            file_path: mediaData.path,
                            file_name: mediaData.name,
                            file_type: dbType,
                            file_size: mediaData.size,
                            created_by: user.id,
                            is_public: false
                        })
                        .select()
                        .single();

                    if (!fileError && fileData) {
                        // Link
                        await supabase.from('media_links').insert({
                            media_file_id: fileData.id,
                            client_payment_id: data.id,
                            organization_id: currentPayment.organization_id,
                            project_id: payload.project_id, // Assuming payload has it or is optional
                            created_by: user.id,
                            category: 'financial',
                            visibility: 'private'
                        });
                    } else {
                        console.error("Error creating media file record in update:", fileError);
                    }
                }
            }
        } catch (e) {
            console.error("Error processing media file in update:", e);
        }
    }

    revalidatePath('/organization/clients');
    return data;
}

export async function deletePaymentAction(paymentId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('client_payments')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString()
        })
        .eq('id', paymentId);

    if (error) {
        console.error("Error deleting payment:", error);
        throw new Error("Error al eliminar el pago.");
    }

    revalidatePath('/organization/clients');
}

// ===============================================
// Invite Client by Email (Unified Flow)
// ===============================================

const inviteClientSchema = z.object({
    organization_id: z.string().uuid(),
    project_id: z.string().uuid(),
    email: z.string().email(),
    contact_name: z.string().optional(),
    client_role_id: z.string().uuid().optional(),
    notes: z.string().optional(),
});

/**
 * Unified action: invite a client to a project by email.
 * 
 * Flow:
 * 1. Find or create contact by email
 * 2. Create project_client
 * 3. If user exists in Seencel → grant direct project_access
 * 4. If user doesn't exist → send invitation email
 * 
 * Reuses existing actions — does NOT duplicate logic.
 */
export async function inviteClientToProjectAction(
    input: z.infer<typeof inviteClientSchema>
): Promise<{ success: boolean; error?: string; project_client_id?: string; invited?: boolean; access_granted?: boolean }> {
    const supabase = await createClient();

    // 1. Auth — get current user
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
        return { success: false, error: "No autenticado" };
    }

    const { data: currentUser } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", authUser.id)
        .single();

    if (!currentUser) {
        return { success: false, error: "Usuario no encontrado" };
    }

    const normalizedEmail = input.email.toLowerCase().trim();

    // 2. Find or create contact
    let contactId: string;

    // 2a. Check if contact already exists with this email in the org
    const { data: existingContact } = await supabase
        .from("contacts")
        .select("id, linked_user_id")
        .eq("organization_id", input.organization_id)
        .eq("is_deleted", false)
        .ilike("email", normalizedEmail)
        .maybeSingle();

    if (existingContact) {
        contactId = existingContact.id;
    } else {
        // 2b. Auto-create contact
        const contactName = input.contact_name?.trim() || normalizedEmail;
        const nameParts = contactName.split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

        const { data: newContact, error: contactError } = await supabase
            .from("contacts")
            .insert({
                organization_id: input.organization_id,
                email: normalizedEmail,
                full_name: contactName,
                first_name: firstName,
                last_name: lastName,
                contact_type: "person",
            })
            .select("id")
            .single();

        if (contactError) {
            console.error("Error creating contact:", contactError);
            return { success: false, error: "Error al crear el contacto automáticamente." };
        }
        contactId = newContact.id;
    }

    // 3. Check if already a project_client
    const { data: existingClient } = await supabase
        .from("project_clients")
        .select("id")
        .eq("project_id", input.project_id)
        .eq("contact_id", contactId)
        .eq("is_deleted", false)
        .maybeSingle();

    if (existingClient) {
        return { success: false, error: "Este contacto ya es cliente de este proyecto." };
    }

    // 4. Create project_client
    const { data: projectClient, error: clientError } = await supabase
        .from("project_clients")
        .insert({
            project_id: input.project_id,
            organization_id: input.organization_id,
            contact_id: contactId,
            client_role_id: input.client_role_id,
            notes: input.notes,
            is_primary: true,
            status: "active",
        })
        .select("id")
        .single();

    if (clientError) {
        console.error("Error creating project_client:", clientError);
        return { success: false, error: "Error al vincular el cliente al proyecto." };
    }

    // 5. Check if user exists in Seencel
    const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", normalizedEmail)
        .maybeSingle();

    if (existingUser) {
        // 5a. User exists → grant direct project_access via existing action
        try {
            const { linkCollaboratorToProjectAction } = await import("@/features/external-actors/project-access-actions");
            await linkCollaboratorToProjectAction({
                project_id: input.project_id,
                organization_id: input.organization_id,
                user_id: existingUser.id,
                access_type: "client",
                access_level: "viewer",
                client_id: projectClient.id,
            });

            // Also auto-link contact to user if not already linked
            if (!existingContact?.linked_user_id) {
                await supabase
                    .from("contacts")
                    .update({ linked_user_id: existingUser.id })
                    .eq("id", contactId);
            }

            revalidatePath("/organization/clients");
            return {
                success: true,
                project_client_id: projectClient.id,
                access_granted: true,
                invited: false,
            };
        } catch (error) {
            console.error("Error granting direct access:", error);
            // Client was created successfully, just access failed
            revalidatePath("/organization/clients");
            return {
                success: true,
                project_client_id: projectClient.id,
                access_granted: false,
                invited: false,
                error: "Cliente vinculado pero no se pudo dar acceso automático.",
            };
        }
    } else {
        // 5b. User doesn't exist → send invitation via existing action
        try {
            const { addExternalCollaboratorWithProjectAction } = await import("@/features/team/actions");
            const result = await addExternalCollaboratorWithProjectAction({
                organizationId: input.organization_id,
                email: normalizedEmail,
                actorType: "client",
                projectId: input.project_id,
                clientId: projectClient.id,
            });

            if (!result.success) {
                // Invitation failed but client was created
                console.error("Invitation failed:", result.error);
                revalidatePath("/organization/clients");
                return {
                    success: true,
                    project_client_id: projectClient.id,
                    access_granted: false,
                    invited: false,
                    error: "Cliente vinculado pero no se pudo enviar la invitación: " + result.error,
                };
            }

            revalidatePath("/organization/clients");
            return {
                success: true,
                project_client_id: projectClient.id,
                access_granted: false,
                invited: true,
            };
        } catch (error) {
            console.error("Error sending invitation:", error);
            revalidatePath("/organization/clients");
            return {
                success: true,
                project_client_id: projectClient.id,
                access_granted: false,
                invited: false,
                error: "Cliente vinculado pero no se pudo enviar la invitación.",
            };
        }
    }
}

// ===============================================
// Helpers
// ===============================================

export async function getCommitmentsByClientAction(clientId: string) {
    const supabase = await createClient();

    // Fetch commitments with currency details for display
    const { data, error } = await supabase
        .from('client_commitments')
        .select(`
            *,
            currency:currencies(id, code, symbol, name)
        `)
        .eq('client_id', clientId)
        .eq('is_deleted', false) // Ensure we don't show deleted commitmenrs
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching client commitments:", error);
        throw new Error("Error fetching client commitments");
    }

    return data || [];
}

