
"use server";

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

    const { error } = await supabase
        .from('project_clients')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', clientId);

    if (error) {
        console.error("Error deleting client:", error);
        throw new Error("Error al eliminar el cliente.");
    }

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
    created_by: true,
    functional_amount: true
}).extend({
    // Allow strings for form handling, convert to numbers
    amount: z.union([z.string(), z.number()]).transform(val => Number(val)),
    exchange_rate: z.union([z.string(), z.number()]).optional().transform(val => val ? Number(val) : 1),
    currency_code: z.string().optional(),
    unit_name: z.string().nullable(),
    concept: z.string().nullable(), // Was unit_description
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

    // Latam Rule: Only USD is treated as foreign for functional calc
    const isUSD = currencyCode === 'USD';
    const functional_amount = isUSD
        ? payload.amount * (payload.exchange_rate || 1)
        : payload.amount;

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
            description: payload.description,
            functional_amount
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
    const isUSD = currencyCode === 'USD';

    // Latam rule
    const functional_amount = isUSD ? newAmount * newRate : newAmount;

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
            client_id: payload.client_id, // Allow reassigning? schema permits.
            functional_amount,
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

    // 2. Calculate functional amount logic (Latam Rule)
    const isUSD = currencyCode === 'USD';
    const functional_amount = isUSD
        ? payload.amount * (payload.exchange_rate || 1)
        : payload.amount;

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
            status: payload.status,
            functional_amount
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
        rollbackReason = e instanceof Error ? e.message : 'Unknown error';
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

    // 3. Calculate new functional amount (Latam Rule)
    const newAmount = payload.amount ?? currentPayment.amount;
    const newRate = payload.exchange_rate ?? currentPayment.exchange_rate ?? 1;

    // Only multiply if it's USD
    const isUSD = currencyCode === 'USD';
    const functional_amount = isUSD
        ? newAmount * newRate
        : newAmount;

    const { data, error } = await supabase
        .from('client_payments')
        .update({
            project_id: payload.project_id,
            organization_id: payload.organization_id, // Usually shouldn't change, but consistent with schema
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
            functional_amount,
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

// ===============================================
// Portal Settings
// ===============================================

export interface PortalSettings {
    project_id: string;
    organization_id: string;
    show_dashboard: boolean;
    show_installments: boolean;
    show_payments: boolean;
    show_logs: boolean;
    show_amounts: boolean;
    show_progress: boolean;
    show_quotes: boolean;
    allow_comments: boolean;
}

export async function getPortalSettings(projectId: string): Promise<PortalSettings | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('client_portal_settings')
        .select('*')
        .eq('project_id', projectId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error("Error fetching portal settings:", error);
    }

    return data || null;
}

export async function updatePortalSettings(
    projectId: string,
    organizationId: string,
    settings: Partial<Omit<PortalSettings, 'project_id' | 'organization_id'>>
) {
    const supabase = await createClient();

    // Check if settings exist
    const { data: existing } = await supabase
        .from('client_portal_settings')
        .select('project_id')
        .eq('project_id', projectId)
        .single();

    if (existing) {
        // Update
        const { error } = await supabase
            .from('client_portal_settings')
            .update({
                ...settings,
                updated_at: new Date().toISOString()
            })
            .eq('project_id', projectId);

        if (error) {
            console.error("Error updating portal settings:", error);
            throw new Error("Error al guardar configuración del portal.");
        }
    } else {
        // Insert
        const { error } = await supabase
            .from('client_portal_settings')
            .insert({
                project_id: projectId,
                organization_id: organizationId,
                ...settings
            });

        if (error) {
            console.error("Error creating portal settings:", error);
            throw new Error("Error al crear configuración del portal.");
        }
    }

    revalidatePath(`/project/${projectId}/portal`);
    return { success: true };
}

// ===============================================
// Portal Branding
// ===============================================

export interface PortalBranding {
    portal_name?: string | null;
    welcome_message?: string | null;
    primary_color?: string;
    background_color?: string;
    hero_image_url?: string | null;
    show_hero?: boolean;
    show_footer?: boolean;
    footer_text?: string | null;
    show_powered_by?: boolean;
}

export async function updatePortalBranding(
    projectId: string,
    organizationId: string,
    branding: PortalBranding
) {
    const supabase = await createClient();

    // Check if branding exists
    const { data: existing } = await supabase
        .from('client_portal_branding')
        .select('id')
        .eq('project_id', projectId)
        .single();

    if (existing) {
        // Update
        const { error } = await supabase
            .from('client_portal_branding')
            .update({
                ...branding,
                updated_at: new Date().toISOString()
            })
            .eq('project_id', projectId);

        if (error) {
            console.error("Error updating portal branding:", error);
            throw new Error("Error al guardar el branding del portal.");
        }
    } else {
        // Insert
        const { error } = await supabase
            .from('client_portal_branding')
            .insert({
                project_id: projectId,
                organization_id: organizationId,
                ...branding
            });

        if (error) {
            console.error("Error creating portal branding:", error);
            throw new Error("Error al crear el branding del portal.");
        }
    }

    revalidatePath(`/project/${projectId}/portal`);
    return { success: true };
}

// ===============================================
// Client Representatives
// ===============================================

const addRepresentativeSchema = z.object({
    client_id: z.string().uuid(),
    contact_id: z.string().uuid(),
    organization_id: z.string().uuid(),
    role: z.string().default('viewer'),
    can_approve: z.boolean().default(false),
    can_chat: z.boolean().default(true),
});

export async function addClientRepresentativeAction(input: z.infer<typeof addRepresentativeSchema>) {
    const supabase = await createClient();
    const userId = await getAuthenticatedUserId(supabase);

    // Get member ID for invited_by
    let invitedBy: string | null = null;
    if (userId) {
        const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', userId)
            .single();

        if (user) {
            const { data: member } = await supabase
                .from('organization_members')
                .select('id')
                .eq('user_id', user.id)
                .eq('organization_id', input.organization_id)
                .single();
            if (member) invitedBy = member.id;
        }
    }

    // Check if contact already has a user account
    const { data: contact } = await supabase
        .from('contacts')
        .select('linked_user_id')
        .eq('id', input.contact_id)
        .single();

    const acceptedAt = contact?.linked_user_id ? new Date().toISOString() : null;

    const { data, error } = await supabase
        .from('client_representatives')
        .insert({
            client_id: input.client_id,
            contact_id: input.contact_id,
            organization_id: input.organization_id,
            role: input.role,
            can_approve: input.can_approve,
            can_chat: input.can_chat,
            invited_by: invitedBy,
            accepted_at: acceptedAt, // Auto-accept if contact has account
        })
        .select()
        .single();

    if (error) {
        if (error.code === '23505') { // Unique violation
            throw new Error("Este contacto ya es representante de este cliente.");
        }
        console.error("Error adding representative:", error);
        throw new Error("Error al agregar representante.");
    }

    revalidatePath('/organization/clients');
    return data;
}

export async function removeClientRepresentativeAction(repId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('client_representatives')
        .update({ is_deleted: true })
        .eq('id', repId);

    if (error) {
        console.error("Error removing representative:", error);
        throw new Error("Error al eliminar representante.");
    }

    revalidatePath('/organization/clients');
}

const updateRepresentativeSchema = z.object({
    id: z.string().uuid(),
    role: z.string().optional(),
    can_approve: z.boolean().optional(),
    can_chat: z.boolean().optional(),
});

export async function updateClientRepresentativeAction(input: z.infer<typeof updateRepresentativeSchema>) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('client_representatives')
        .update({
            role: input.role,
            can_approve: input.can_approve,
            can_chat: input.can_chat,
            updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .select()
        .single();

    if (error) {
        console.error("Error updating representative:", error);
        throw new Error("Error al actualizar representante.");
    }

    revalidatePath('/organization/clients');
    return data;
}

