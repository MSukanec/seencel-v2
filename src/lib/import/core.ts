"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Core import batch management - create and revert batches
 */

export async function createImportBatch(
    organizationId: string,
    entityType: string,
    count: number
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Get member_id for this user in this organization
    const { data: member } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', user.id)
        .single();

    const { data, error } = await supabase
        .from('import_batches')
        .insert({
            organization_id: organizationId,
            member_id: member?.id || null,
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
    const allowedTables = ['contacts', 'client_payments', 'subcontract_payments', 'material_payments', 'materials'];
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
