"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Contacts import batch processor
 */

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
