"use server";

import { createClient } from "@/lib/supabase/server";

export interface MovementAttachment {
    id: string;
    file_name: string;
    file_path: string;
    file_type: 'image' | 'video' | 'pdf' | 'doc' | 'other';
    file_size: number | null;
    bucket: string;
    created_at: string;
}

type MovementType =
    | 'client_payment'
    | 'material_payment'
    | 'personnel_payment'
    | 'partner_contribution'
    | 'partner_withdrawal'
    | 'general_cost_payment';

/**
 * Get attachments for a specific financial movement
 * Queries media_links based on the movement type and ID
 */
export async function getMovementAttachments(
    movementId: string,
    movementType: string
): Promise<{ attachments: MovementAttachment[]; error?: string }> {
    const supabase = await createClient();

    // Map movement type to the correct foreign key column in media_links
    const columnMap: Record<MovementType, string> = {
        'client_payment': 'client_payment_id',
        'material_payment': 'material_payment_id',
        'personnel_payment': 'personnel_payment_id',
        'partner_contribution': 'partner_contribution_id',
        'partner_withdrawal': 'partner_withdrawal_id',
        'general_cost_payment': 'general_cost_payment_id',
    };

    const column = columnMap[movementType as MovementType];

    // Financial operations (wallet_transfer, currency_exchange) don't have attachments
    if (!column) {
        return { attachments: [] };
    }

    const { data, error } = await supabase
        .from('media_links')
        .select(`
            media_file_id,
            media_files!inner (
                id,
                file_name,
                file_path,
                file_type,
                file_size,
                bucket,
                created_at
            )
        `)
        .eq(column, movementId);

    if (error) {
        console.error("Error fetching movement attachments:", error);
        return { attachments: [], error: "Failed to fetch attachments" };
    }

    // Flatten the result to extract media_files
    const attachments: MovementAttachment[] = (data || []).map((link: any) => ({
        id: link.media_files.id,
        file_name: link.media_files.file_name,
        file_path: link.media_files.file_path,
        file_type: link.media_files.file_type,
        file_size: link.media_files.file_size,
        bucket: link.media_files.bucket,
        created_at: link.media_files.created_at,
    }));

    return { attachments };
}

/**
 * Get signed URL for downloading/previewing a file
 */
export async function getAttachmentUrl(
    bucket: string,
    filePath: string
): Promise<{ url: string | null; error?: string }> {
    const supabase = await createClient();

    const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) {
        console.error("Error creating signed URL:", error);
        return { url: null, error: "Failed to get file URL" };
    }

    return { url: data.signedUrl };
}

/**
 * Delete a financial movement from its source table
 * Routes to the correct table based on movement_type
 */
export async function deleteFinanceMovement(
    movementId: string,
    movementType: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    // Map movement type to the correct table
    const tableMap: Record<string, string> = {
        'client_payment': 'client_payments',
        'material_payment': 'material_payments',
        'personnel_payment': 'personnel_payments',
        'partner_contribution': 'partner_contributions',
        'partner_withdrawal': 'partner_withdrawals',
        'general_cost_payment': 'general_cost_payments',
        'wallet_transfer': 'wallet_transfers',
        'currency_exchange': 'currency_exchanges',
    };

    const table = tableMap[movementType];

    if (!table) {
        return { success: false, error: `Unknown movement type: ${movementType}` };
    }

    const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', movementId);

    if (error) {
        console.error(`Error deleting from ${table}:`, error);
        return { success: false, error: "Error al eliminar el movimiento" };
    }

    return { success: true };
}
