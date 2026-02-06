"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { parseFlexibleDate } from "./date-utils";

/**
 * Subcontract payments import batch processor
 */

export async function importSubcontractPaymentsBatch(
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



            // Parse date using flexible parser (handles DD-MM-YY, DD/MM/YYYY, ISO, Excel serial, etc.)
            const parsedDate = parseFlexibleDate(payment.payment_date);
            const payment_date = parsedDate || new Date();

            // NORMALIZE AMOUNT: Always use absolute value (DB constraint requires positive)
            const rawAmount = Number(payment.amount) || 0;
            const amount = Math.abs(rawAmount);
            const exchange_rate = Number(payment.exchange_rate) || 1;

            // Note: functional_amount is now calculated by DB trigger

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
        warnings,
        skipped: payments.length - records.length
    };
}
