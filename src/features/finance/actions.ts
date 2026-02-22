"use server";


import { sanitizeError } from "@/lib/error-utils";
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
    | 'labor_payment'
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
        'labor_payment': 'labor_payment_id',
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
    // These must match the movement_type values from unified_financial_movements_view
    const tableMap: Record<string, string> = {
        'client_payment': 'client_payments',
        'material_payment': 'material_payments',
        'labor_payment': 'labor_payments',
        'subcontract_payment': 'subcontract_payments',
        'partner_contribution': 'partner_contributions',
        'partner_withdrawal': 'partner_withdrawals',
        'general_cost': 'general_costs_payments', // Note: view uses 'general_cost', table is 'general_costs_payments'
        'wallet_transfer': 'financial_operations',
        'currency_exchange': 'financial_operations',
    };

    const table = tableMap[movementType];

    if (!table) {
        return { success: false, error: `Unknown movement type: ${movementType}` };
    }

    // For financial operations, we need to soft-delete both the operation and movements
    if (movementType === 'wallet_transfer' || movementType === 'currency_exchange') {
        // First get the financial_operation_id from the movement
        const { data: movement, error: fetchError } = await supabase
            .schema('finance').from('financial_operation_movements')
            .select('financial_operation_id')
            .eq('id', movementId)
            .single();

        if (fetchError || !movement) {
            console.error("Error fetching movement:", fetchError);
            return { success: false, error: "Error al encontrar el movimiento" };
        }

        // Soft delete all movements for this operation
        const { error: movError } = await supabase
            .schema('finance').from('financial_operation_movements')
            .update({ is_deleted: true })
            .eq('financial_operation_id', movement.financial_operation_id);

        if (movError) {
            console.error("Error soft-deleting movements:", movError);
            return { success: false, error: "Error al eliminar los movimientos" };
        }

        // Soft delete the parent operation
        const { error } = await supabase
            .schema('finance').from('financial_operations')
            .update({ is_deleted: true })
            .eq('id', movement.financial_operation_id);

        if (error) {
            console.error("Error soft-deleting financial operation:", error);
            return { success: false, error: "Error al eliminar la operación" };
        }

        return { success: true };
    }

    // Soft delete for other payment types
    const { error } = await supabase
        .from(table)
        .update({ is_deleted: true })
        .eq('id', movementId);

    if (error) {
        console.error(`Error soft-deleting from ${table}:`, error);
        return { success: false, error: "Error al eliminar el movimiento" };
    }

    return { success: true };
}

// ============================================
// CURRENCY EXCHANGE
// ============================================

export interface CurrencyExchangeInput {
    organization_id: string;
    project_id?: string;
    operation_date: string;
    description?: string;
    from_wallet_id: string;
    from_currency_id: string;
    from_amount: number;
    to_wallet_id: string;
    to_currency_id: string;
    to_amount: number;
}

export async function createCurrencyExchange(
    data: CurrencyExchangeInput
): Promise<{ success: boolean; error?: string; operationId?: string }> {
    const supabase = await createClient();

    // Get current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: "Usuario no autenticado" };
    }

    // Get user ID from users table
    const { data: userData, error: userError } = await supabase
        .schema('iam').from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (userError || !userData) {
        return { success: false, error: "Usuario no encontrado en el sistema" };
    }

    // Calculate exchange rate (to_amount / from_amount)
    const exchangeRate = data.to_amount / data.from_amount;

    // 1. Create the parent financial_operation
    // NOTE: created_by is auto-populated by handle_updated_by trigger
    const { data: operation, error: opError } = await supabase
        .schema('finance').from('financial_operations')
        .insert({
            organization_id: data.organization_id,
            project_id: data.project_id || null,
            type: 'currency_exchange',
            operation_date: data.operation_date,
            description: data.description || null,
        })
        .select('id')
        .single();

    if (opError || !operation) {
        console.error("Error creating financial operation:", opError);
        return { success: false, error: "Error al crear la operación" };
    }

    // 2. Create the OUT movement (vendo)
    // NOTE: created_by is auto-populated by handle_updated_by trigger
    const { error: outError } = await supabase
        .schema('finance').from('financial_operation_movements')
        .insert({
            financial_operation_id: operation.id,
            organization_id: data.organization_id,
            project_id: data.project_id || null,
            wallet_id: data.from_wallet_id,
            currency_id: data.from_currency_id,
            amount: data.from_amount,
            direction: 'out',
            exchange_rate: exchangeRate,
        });

    if (outError) {
        console.error("Error creating OUT movement:", outError);
        // Rollback: delete the operation
        await supabase.schema('finance').from('financial_operations').delete().eq('id', operation.id);
        return { success: false, error: sanitizeError(outError) };
    }

    // 3. Create the IN movement (compro)
    // NOTE: created_by is auto-populated by handle_updated_by trigger
    const { error: inError } = await supabase
        .schema('finance').from('financial_operation_movements')
        .insert({
            financial_operation_id: operation.id,
            organization_id: data.organization_id,
            project_id: data.project_id || null,
            wallet_id: data.to_wallet_id,
            currency_id: data.to_currency_id,
            amount: data.to_amount,
            direction: 'in',
            exchange_rate: 1, // El monto destino ya está en su moneda
        });

    if (inError) {
        console.error("Error creating IN movement:", inError);
        // Rollback: delete the operation (cascade deletes movements)
        await supabase.schema('finance').from('financial_operations').delete().eq('id', operation.id);
        return { success: false, error: "Error al crear movimiento de entrada" };
    }

    return { success: true, operationId: operation.id };
}

// ============================================
// WALLET TRANSFER
// ============================================

export interface WalletTransferInput {
    organization_id: string;
    project_id?: string;
    operation_date: string;
    description?: string;
    from_wallet_id: string;
    to_wallet_id: string;
    currency_id: string;
    amount: number;
}

export async function createWalletTransfer(
    data: WalletTransferInput
): Promise<{ success: boolean; error?: string; operationId?: string }> {
    const supabase = await createClient();

    // Get current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: "Usuario no autenticado" };
    }

    // Get user ID from users table
    const { data: userData, error: userError } = await supabase
        .schema('iam').from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (userError || !userData) {
        return { success: false, error: "Usuario no encontrado en el sistema" };
    }

    // 1. Create the parent financial_operation
    const { data: operation, error: opError } = await supabase
        .schema('finance').from('financial_operations')
        .insert({
            organization_id: data.organization_id,
            project_id: data.project_id || null,
            type: 'wallet_transfer',
            operation_date: data.operation_date,
            description: data.description || null,
            created_by: userData,
        })
        .select('id')
        .single();

    if (opError || !operation) {
        console.error("Error creating financial operation:", opError);
        return { success: false, error: "Error al crear la operación" };
    }

    // 2. Create the OUT movement (from wallet)
    const { error: outError } = await supabase
        .schema('finance').from('financial_operation_movements')
        .insert({
            financial_operation_id: operation.id,
            organization_id: data.organization_id,
            project_id: data.project_id || null,
            wallet_id: data.from_wallet_id,
            currency_id: data.currency_id,
            amount: data.amount,
            direction: 'out',
            exchange_rate: 1,
            created_by: userData.id,
        });

    if (outError) {
        console.error("Error creating OUT movement:", outError);
        await supabase.schema('finance').from('financial_operations').delete().eq('id', operation.id);
        return { success: false, error: "Error al crear movimiento de salida" };
    }

    // 3. Create the IN movement (to wallet)
    const { error: inError } = await supabase
        .schema('finance').from('financial_operation_movements')
        .insert({
            financial_operation_id: operation.id,
            organization_id: data.organization_id,
            project_id: data.project_id || null,
            wallet_id: data.to_wallet_id,
            currency_id: data.currency_id,
            amount: data.amount,
            direction: 'in',
            exchange_rate: 1,
            created_by: userData.id,
        });

    if (inError) {
        console.error("Error creating IN movement:", inError);
        await supabase.schema('finance').from('financial_operations').delete().eq('id', operation.id);
        return { success: false, error: "Error al crear movimiento de entrada" };
    }

    return { success: true, operationId: operation.id };
}
