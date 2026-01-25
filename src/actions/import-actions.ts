"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createImportBatch(
    organizationId: string,
    entityType: string,
    count: number
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from('import_batches')
        .insert({
            organization_id: organizationId,
            user_id: user.id,
            entity_type: entityType,
            record_count: count,
            status: 'completed'
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating import batch:", error);
        throw new Error("Failed to create import batch");
    }

    return data;
}

export async function revertImportBatch(batchId: string, entityTable: string = 'contacts') {
    const supabase = await createClient();

    // 1. Mark batch as reverted
    const { error: batchError } = await supabase
        .from('import_batches')
        .update({ status: 'reverted' })
        .eq('id', batchId);

    if (batchError) throw new Error("Failed to update batch status");

    // 2. Soft delete records associated with this batch
    const allowedTables = ['contacts', 'client_payments'];
    if (!allowedTables.includes(entityTable)) throw new Error("Invalid entity table for revert");

    const { error: recordsError } = await supabase
        .from(entityTable)
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString()
        })
        .eq('import_batch_id', batchId);

    if (recordsError) throw new Error("Failed to revert records");

    revalidatePath('/organization/contacts');
    revalidatePath('/project');
    return { success: true };
}

export async function importContactsBatch(organizationId: string, contacts: any[], batchId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Transform data for insertion
    const records = contacts.map(contact => ({
        organization_id: organizationId,
        first_name: contact.first_name,
        last_name: contact.last_name,
        full_name: contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
        email: contact.email,
        phone: contact.phone,
        company_name: contact.company_name,
        location: contact.location,
        notes: contact.notes,
        import_batch_id: batchId,
        is_local: true,
        sync_status: 'synced',
        created_by: user.id, // Audit trigger requirement
        updated_by: user.id, // Audit trigger requirement
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }));

    // ROBUST IMPORT STRATEGY: Check -> Filter -> Insert
    // This avoids "onConflict" complexity with constraints and guarantees "ignore duplicates" behavior.

    // 1. Get all emails from the batch
    const emails = records.map(r => r.email).filter(Boolean);

    // 2. Find existing emails in this org
    let existingEmails = new Set<string>();
    if (emails.length > 0) {
        // Chunk query if too many emails
        const { data: existing } = await supabase
            .from('contacts')
            .select('email')
            .eq('organization_id', organizationId)
            .in('email', emails);

        if (existing) {
            existing.forEach(r => existingEmails.add(r.email));
        }
    }

    // 3. Filter out records that already exist
    const newRecords = records.filter(r => !existingEmails.has(r.email));

    // 4. Insert only new records
    if (newRecords.length > 0) {
        const { error } = await supabase
            .from('contacts')
            .insert(newRecords);

        if (error) {
            console.error("Bulk insert failed:", error);
            throw new Error("Bulk insert failed: " + error.message);
        }
    }

    revalidatePath('/organization/contacts');
    return { success: true };
}

export async function importPaymentsBatch(
    organizationId: string,
    projectId: string,
    payments: any[],
    batchId: string
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // 1. Get project clients for name lookup
    const { data: projectClients } = await supabase
        .from('project_clients_view')
        .select('id, contact_full_name')
        .eq('project_id', projectId);

    const clientMap = new Map<string, string>();
    projectClients?.forEach((c: any) => {
        if (c.contact_full_name) {
            clientMap.set(c.contact_full_name.toLowerCase().trim(), c.id);
        }
    });

    // 2. Get currencies for code lookup
    const { data: currencies } = await supabase
        .from('currencies')
        .select('id, code');

    const currencyMap = new Map<string, string>();
    currencies?.forEach((c: any) => {
        if (c.code) currencyMap.set(c.code.toUpperCase(), c.id);
    });

    // 3. Get wallets for name lookup
    const { data: wallets } = await supabase
        .from('organization_wallets_view')
        .select('id, wallet_name')
        .eq('organization_id', organizationId);

    const walletMap = new Map<string, string>();
    wallets?.forEach((w: any) => {
        if (w.wallet_name) walletMap.set(w.wallet_name.toLowerCase().trim(), w.id);
    });

    // 4. Transform and validate records
    const errors: any[] = [];
    const records = payments
        .map((payment, index) => {
            // Resolve client_id
            const clientName = String(payment.client_name || '').toLowerCase().trim();
            const client_id = clientMap.get(clientName);
            if (!client_id) {
                errors.push({ row: index + 1, error: `Cliente no encontrado: "${payment.client_name}"` });
                return null;
            }

            // Resolve currency_id
            const currencyCode = String(payment.currency_code || 'ARS').toUpperCase();
            const currency_id = currencyMap.get(currencyCode);
            if (!currency_id) {
                errors.push({ row: index + 1, error: `Moneda no encontrada: "${currencyCode}"` });
                return null;
            }

            // Resolve wallet_id (optional)
            let wallet_id = null;
            if (payment.wallet_name) {
                wallet_id = walletMap.get(String(payment.wallet_name).toLowerCase().trim());
            }
            // If no wallet specified or not found, use first wallet
            if (!wallet_id && wallets && wallets.length > 0) {
                wallet_id = wallets[0].id;
            }

            // Parse date
            let payment_date = new Date();
            if (payment.payment_date) {
                const parsed = new Date(payment.payment_date);
                if (!isNaN(parsed.getTime())) payment_date = parsed;
            }

            return {
                project_id: projectId,
                organization_id: organizationId,
                client_id,
                amount: Number(payment.amount) || 0,
                currency_id,
                wallet_id,
                exchange_rate: Number(payment.exchange_rate) || 1,
                payment_date: payment_date.toISOString(),
                notes: payment.notes || null,
                reference: payment.reference || null,
                status: 'confirmed',
                import_batch_id: batchId,
                created_by: user.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
        })
        .filter(Boolean);

    if (errors.length > 0) {
        console.warn("Import warnings:", errors);
    }

    // 5. Insert valid records
    if (records.length > 0) {
        const { error } = await supabase
            .from('client_payments')
            .insert(records);

        if (error) {
            console.error("Bulk payment insert failed:", error);
            throw new Error("Bulk insert failed: " + error.message);
        }
    }

    revalidatePath('/project');
    return {
        success: records.length,
        errors,
        skipped: payments.length - records.length
    };
}


export async function importSubcontractPaymentsBatch(
    organizationId: string,
    projectId: string,
    payments: any[],
    batchId: string
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // 1. Get subcontracts for lookup (Title or Provider)
    const { data: subcontracts } = await supabase
        .from('subcontracts_view')
        .select('id, title, provider_name')
        .eq('project_id', projectId);

    const titleMap = new Map<string, string>();
    const providerMap = new Map<string, string[]>();

    subcontracts?.forEach((s: any) => {
        if (s.title) titleMap.set(s.title.toLowerCase().trim(), s.id);
        if (s.provider_name) {
            const name = s.provider_name.toLowerCase().trim();
            const existing = providerMap.get(name) || [];
            existing.push(s.id);
            providerMap.set(name, existing);
        }
    });

    // 2. Get currencies for code lookup
    const { data: currencies } = await supabase
        .from('currencies')
        .select('id, code');

    const currencyMap = new Map<string, any>(); // Store whole object (id, code)
    currencies?.forEach((c: any) => {
        if (c.code) currencyMap.set(c.code.toUpperCase(), c);
    });

    // 3. Get wallets for name lookup
    const { data: wallets } = await supabase
        .from('organization_wallets_view')
        .select('id, wallet_name')
        .eq('organization_id', organizationId);

    const walletMap = new Map<string, string>();
    wallets?.forEach((w: any) => {
        if (w.wallet_name) walletMap.set(w.wallet_name.toLowerCase().trim(), w.id);
    });

    // 4. Transform and validate records
    const errors: any[] = [];
    const records = payments
        .map((payment, index) => {
            // Resolve subcontract_id
            let subcontract_id = null;
            const rawValue = payment.subcontract_title || payment.provider_name;

            // Check if rawValue is already a valid UUID (from Import Modal resolution)
            // We use the subcontracts array we already fetched
            const directMatch = subcontracts?.find(s => s.id === rawValue);

            if (directMatch) {
                subcontract_id = directMatch.id;
            } else {
                const targetName = String(rawValue || '').toLowerCase().trim();

                // Try Title Match
                if (titleMap.has(targetName)) {
                    subcontract_id = titleMap.get(targetName);
                }
                // Try Provider Match
                else if (providerMap.has(targetName)) {
                    const ids = providerMap.get(targetName) || [];
                    if (ids.length === 1) {
                        subcontract_id = ids[0];
                    } else {
                        errors.push({ row: index + 1, error: `Ambigüedad: El proveedor "${payment.provider_name}" tiene múltiples contratos. Use el título del contrato.` });
                        return null;
                    }
                } else {
                    errors.push({ row: index + 1, error: `Subcontrato/Proveedor no encontrado: "${targetName}"` });
                    return null;
                }
            }

            // Resolve currency_id
            let currency_id = null;
            const rawCurrency = String(payment.currency_code || 'ARS').trim(); // Check trimmed raw value

            // Check if it's a direct ID match (from conflict resolution)
            // currencies is array of { id, code }
            const directCurrency = currencies?.find(c => c.id === rawCurrency);

            if (directCurrency) {
                currency_id = directCurrency.id;
            } else {
                // Try Code Match
                const currencyCode = rawCurrency.toUpperCase();
                const currency = currencyMap.get(currencyCode);
                if (currency) {
                    currency_id = currency.id;
                } else {
                    errors.push({ row: index + 1, error: `Moneda no encontrada: "${rawCurrency}"` });
                    return null;
                }
            }

            // Resolve wallet_id (optional)
            let wallet_id = null;
            if (payment.wallet_name) {
                wallet_id = walletMap.get(String(payment.wallet_name).toLowerCase().trim());
            }
            if (!wallet_id && wallets && wallets.length > 0) {
                wallet_id = wallets[0].id;
            }

            if (!wallet_id) {
                errors.push({ row: index + 1, error: "No se encontró billetera y no hay billetera por defecto." });
                return null;
            }


            // Parse date
            let payment_date = new Date();
            if (payment.payment_date) {
                const parsed = new Date(payment.payment_date);
                if (!isNaN(parsed.getTime())) payment_date = parsed;
            }

            const amount = Number(payment.amount) || 0;
            const exchange_rate = Number(payment.exchange_rate) || 1;

            // Functional Amount Logic (Latam Rule)
            // Need code for this logic. If we have currency_id, we need to find code.
            const resolvedCurrency = currencies?.find(c => c.id === currency_id);
            const isUSD = resolvedCurrency?.code === 'USD';
            const functional_amount = isUSD ? amount * exchange_rate : amount;

            return {
                project_id: projectId,
                organization_id: organizationId,
                wallet_id,
                subcontract_id,
                amount,
                currency_id,
                exchange_rate,
                payment_date: payment_date.toISOString(),
                notes: payment.notes || null,
                reference: payment.reference || null,
                status: 'confirmed',
                functional_amount,
                import_batch_id: batchId,
                created_by: user.id,
                is_deleted: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
        })
        .filter(Boolean);

    if (errors.length > 0) {
        console.warn("Import warnings:", errors);
    }

    // 5. Insert valid records
    if (records.length > 0) {
        const { error } = await supabase
            .from('subcontract_payments')
            .insert(records);

        if (error) {
            console.error("Bulk subcontract payment insert failed:", error);
            throw new Error("Bulk insert failed: " + error.message);
        }
    }

    revalidatePath('/project');
    return {
        success: records.length,
        errors,
        skipped: payments.length - records.length
    };
}
