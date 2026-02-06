"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { parseFlexibleDate } from "./date-utils";

/**
 * Client payments import batch processor
 */

export async function importPaymentsBatch(
    organizationId: string,
    projectId: string,
    payments: any[],
    batchId: string
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // === AMOUNT SIGN ANALYSIS ===
    // Detect if amounts have mixed signs (some positive, some negative)
    const rawAmounts = payments.map(p => Number(p.amount) || 0);
    const positiveCount = rawAmounts.filter(a => a > 0).length;
    const negativeCount = rawAmounts.filter(a => a < 0).length;
    const hasMixedSigns = positiveCount > 0 && negativeCount > 0;

    const warnings: string[] = [];
    if (hasMixedSigns) {
        warnings.push(`Detectamos ${positiveCount} valores positivos y ${negativeCount} negativos. Los montos negativos (posibles devoluciones) se convirtieron a positivos.`);
    }

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

            // Parse date using flexible parser (handles DD-MM-YY, DD/MM/YYYY, ISO, Excel serial, etc.)
            const parsedDate = parseFlexibleDate(payment.payment_date);
            const payment_date = parsedDate || new Date();

            // NORMALIZE AMOUNT: Always use absolute value (DB constraint requires positive)
            const rawAmount = Number(payment.amount) || 0;
            const amount = Math.abs(rawAmount);

            return {
                project_id: projectId,
                organization_id: organizationId,
                client_id,
                amount,
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
        warnings,
        skipped: payments.length - records.length
    };
}
