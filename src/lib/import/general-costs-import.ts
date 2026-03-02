"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { parseFlexibleDate } from "./date-utils";

/**
 * General Costs payments import batch processor
 *
 * Resolves:
 * - general_cost_name → general_cost_id (FK to general_costs)
 * - currency_code → currency_id
 * - wallet_name → wallet_id
 *
 * Pattern: same as subcontracts-import.ts / clients-import.ts
 */

export async function importGeneralCostPaymentsBatch(
    organizationId: string,
    payments: any[],
    batchId: string
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // === AMOUNT SIGN ANALYSIS ===
    const rawAmounts = payments.map(p => Number(p.amount) || 0);
    const positiveCount = rawAmounts.filter(a => a > 0).length;
    const negativeCount = rawAmounts.filter(a => a < 0).length;
    const hasMixedSigns = positiveCount > 0 && negativeCount > 0;

    const warnings: string[] = [];
    if (hasMixedSigns) {
        warnings.push(`Detectamos ${positiveCount} valores positivos y ${negativeCount} negativos. Los montos negativos se convirtieron a positivos.`);
    }

    // 1. Get general costs (concepts) for name lookup
    const { data: concepts } = await supabase
        .schema('finance').from('general_costs')
        .select('id, name')
        .eq('organization_id', organizationId)
        .eq('is_deleted', false);

    const conceptMap = new Map<string, string>();
    const conceptIdSet = new Set<string>();
    concepts?.forEach((c: any) => {
        conceptIdSet.add(c.id);
        if (c.name) conceptMap.set(c.name.toLowerCase().trim(), c.id);
    });

    // 2. Get currencies for code lookup
    const { data: currencies } = await supabase
        .schema('finance').from('currencies')
        .select('id, code');

    const currencyMap = new Map<string, string>();
    currencies?.forEach((c: any) => {
        if (c.code) currencyMap.set(c.code.toUpperCase(), c.id);
    });

    // 3. Get wallets for name lookup
    const { data: wallets } = await supabase
        .schema('finance').from('organization_wallets_view')
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
            // Resolve general_cost_id (optional — can be null for "Sin concepto")
            let general_cost_id: string | null = null;
            const rawConceptValue = String(payment.general_cost_name || '').trim();

            if (rawConceptValue) {
                // Check if already a UUID (resolved by conflict step)
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawConceptValue);

                if (isUUID && conceptIdSet.has(rawConceptValue)) {
                    general_cost_id = rawConceptValue;
                } else {
                    general_cost_id = conceptMap.get(rawConceptValue.toLowerCase()) || null;
                }

                if (!general_cost_id) {
                    // Not a hard error — log warning but allow import without concept
                    warnings.push(`Fila ${index + 1}: Concepto "${rawConceptValue}" no encontrado, se importó sin concepto.`);
                }
            }

            // Resolve currency_id
            const rawCurrency = String(payment.currency_code || 'ARS').trim();
            const isCurrencyUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawCurrency);
            let currency_id: string | undefined;
            if (isCurrencyUUID) {
                currency_id = rawCurrency;
            } else {
                currency_id = currencyMap.get(rawCurrency.toUpperCase());
            }
            if (!currency_id) {
                errors.push({ row: index + 1, error: `Moneda no encontrada: "${rawCurrency}"` });
                return null;
            }

            // Resolve wallet_id (optional)
            let wallet_id: string | null = null;
            if (payment.wallet_name) {
                const rawWallet = String(payment.wallet_name).trim();
                const isWalletUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawWallet);
                if (isWalletUUID) {
                    wallet_id = rawWallet;
                } else {
                    wallet_id = walletMap.get(rawWallet.toLowerCase()) || null;
                }
            }
            // Fallback to first wallet
            if (!wallet_id && wallets && wallets.length > 0) {
                wallet_id = wallets[0].id;
            }

            if (!wallet_id) {
                errors.push({ row: index + 1, error: "No se encontró billetera y no hay billetera por defecto." });
                return null;
            }

            // Parse date
            const parsedDate = parseFlexibleDate(payment.payment_date);
            const payment_date = parsedDate || new Date();

            // Normalize amount: always positive
            const rawAmount = Number(payment.amount) || 0;
            const amount = Math.abs(rawAmount);

            if (amount === 0) {
                errors.push({ row: index + 1, error: "El monto es 0 o inválido." });
                return null;
            }

            return {
                organization_id: organizationId,
                general_cost_id,
                amount,
                currency_id,
                exchange_rate: Number(payment.exchange_rate) || 1,
                wallet_id,
                payment_date: payment_date.toISOString(),
                notes: payment.notes || null,
                reference: payment.reference || null,
                status: payment.status || 'confirmed',
                import_batch_id: batchId,
                created_by: user.id,
                is_deleted: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
        })
        .filter(Boolean);

    if (errors.length > 0) {
        console.warn("General costs import warnings:", errors);
    }

    // 5. Insert valid records
    if (records.length > 0) {
        const { error } = await supabase
            .schema('finance').from('general_costs_payments')
            .insert(records);

        if (error) {
            console.error("Bulk general cost payment insert failed:", error);
            throw new Error("Bulk insert failed: " + error.message);
        }
    }

    revalidatePath('/organization/general-costs');
    return {
        success: records.length,
        errors,
        warnings,
        skipped: payments.length - records.length
    };
}
