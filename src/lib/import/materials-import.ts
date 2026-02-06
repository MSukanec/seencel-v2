"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { parseFlexibleDate } from "./date-utils";

/**
 * Material payments import batch processor
 */

export async function importMaterialPaymentsBatch(
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
    // This happens when user has purchases AND returns in the same import
    const rawAmounts = payments.map(p => Number(p.amount) || 0);
    const positiveCount = rawAmounts.filter(a => a > 0).length;
    const negativeCount = rawAmounts.filter(a => a < 0).length;
    const hasMixedSigns = positiveCount > 0 && negativeCount > 0;

    // We'll add a warning if mixed signs detected
    const warnings: string[] = [];
    if (hasMixedSigns) {
        warnings.push(`Detectamos ${positiveCount} valores positivos y ${negativeCount} negativos. Los montos negativos (posibles devoluciones) se convirtieron a positivos. Si esto no es correcto, revisá los datos originales.`);
    }

    // 1. Get material types for lookup
    const { data: materialTypes } = await supabase
        .from('material_types')
        .select('id, name')
        .or(`organization_id.eq.${organizationId},is_system.eq.true`)
        .eq('is_deleted', false);

    const typeMap = new Map<string, string>();
    materialTypes?.forEach((t: any) => {
        if (t.name) typeMap.set(t.name.toLowerCase().trim(), t.id);
    });

    // 2. Get currencies for code lookup
    const { data: currencies } = await supabase
        .from('currencies')
        .select('id, code');

    const currencyMap = new Map<string, any>();
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
            // Resolve material_type_id (optional)
            let material_type_id = null;
            if (payment.material_type_name) {
                const rawValue = String(payment.material_type_name).trim();
                // Check if it's already a UUID
                const directMatch = materialTypes?.find(t => t.id === rawValue);
                if (directMatch) {
                    material_type_id = directMatch.id;
                } else {
                    material_type_id = typeMap.get(rawValue.toLowerCase()) || null;
                }
            }

            // Resolve currency_id
            let currency_id = null;
            const rawCurrency = String(payment.currency_code || 'ARS').trim();
            const directCurrency = currencies?.find(c => c.id === rawCurrency);

            if (directCurrency) {
                currency_id = directCurrency.id;
            } else {
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
                const rawWallet = String(payment.wallet_name).trim();
                const directWallet = wallets?.find(w => w.id === rawWallet);
                if (directWallet) {
                    wallet_id = directWallet.id;
                } else {
                    wallet_id = walletMap.get(rawWallet.toLowerCase()) || null;
                }
            }
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

            // NORMALIZE AMOUNT: Always use absolute value (DB constraint requires positive)
            const rawAmount = Number(payment.amount) || 0;
            const amount = Math.abs(rawAmount);
            const exchange_rate = Number(payment.exchange_rate) || 1;

            return {
                project_id: projectId,
                organization_id: organizationId,
                wallet_id,
                material_type_id,
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
        console.warn("Material import warnings:", errors);
    }

    // 5. Insert valid records
    if (records.length > 0) {
        const { error } = await supabase
            .from('material_payments')
            .insert(records);

        if (error) {
            console.error("Bulk material payment insert failed:", error);
            throw new Error("Bulk insert failed: " + error.message);
        }
    }

    revalidatePath('/project');
    return {
        success: records.length,
        errors,
        warnings, // NEW: Return warnings for UI to display
        skipped: payments.length - records.length
    };
}


/**
 * Material catalog import batch processor
 */

export async function importMaterialsCatalogBatch(
    organizationId: string,
    materials: any[],
    batchId: string
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Get organization member ID for audit
    const { data: memberData } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', user.id)
        .single();
    const memberId = memberData?.id || null;

    // 1. Get categories for name lookup (filter by org)
    const { data: categories, error: catError } = await supabase
        .from('material_categories')
        .select('id, name')
        .eq('organization_id', organizationId)
        .eq('is_deleted', false);

    if (catError) {
        console.error('[Import] Failed to fetch categories:', catError);
    }

    const categoryMap = new Map<string, string>();
    categories?.forEach((c: any) => {
        if (c.name) categoryMap.set(c.name.toLowerCase().trim(), c.id);
    });
    console.log(`[Import] Found ${categoryMap.size} categories for org:`, Array.from(categoryMap.keys()));

    // 2. Get units for name/symbol lookup (system + org)
    const { data: units } = await supabase
        .from('units')
        .select('id, name, symbol, organization_id')
        .or(`organization_id.is.null,organization_id.eq.${organizationId}`);

    const unitMap = new Map<string, string>();
    units?.forEach((u: any) => {
        if (u.name) unitMap.set(u.name.toLowerCase().trim(), u.id);
        if (u.symbol) unitMap.set(u.symbol.toLowerCase().trim(), u.id);
    });

    // 3. Get existing providers (contacts) for lookup
    const { data: contacts } = await supabase
        .from('contacts')
        .select('id, full_name, company_name')
        .eq('organization_id', organizationId)
        .eq('is_deleted', false);

    const providerMap = new Map<string, string>();
    contacts?.forEach((c: any) => {
        if (c.full_name) providerMap.set(c.full_name.toLowerCase().trim(), c.id);
        if (c.company_name) providerMap.set(c.company_name.toLowerCase().trim(), c.id);
    });

    // 4. Get currencies for code lookup
    const { data: currencies } = await supabase
        .from('currencies')
        .select('id, code');

    const currencyMap = new Map<string, string>();
    currencies?.forEach((c: any) => {
        if (c.code) currencyMap.set(c.code.toUpperCase(), c.id);
    });
    const defaultCurrencyId = currencyMap.get('ARS') || currencies?.[0]?.id;

    // 5. Get existing material names for duplicate detection
    const { data: existingMaterials } = await supabase
        .from('materials')
        .select('name')
        .eq('organization_id', organizationId)
        .eq('is_deleted', false);

    const existingNames = new Set<string>();
    existingMaterials?.forEach((m: any) => {
        if (m.name) existingNames.add(m.name.toLowerCase().trim());
    });

    // 6. Transform and validate records - collect items to create
    const errors: any[] = [];
    const unitsToCreate = new Map<string, string>(); // name -> original name
    const providersToCreate = new Map<string, string>(); // name -> original name
    const categoriesToCreate = new Map<string, string>(); // name -> original name

    const parsedMaterials = materials.map((material, index) => {
        const name = String(material.name || '').trim();

        if (!name) {
            errors.push({ row: index + 1, error: 'Nombre es requerido' });
            return null;
        }

        // Check for duplicates
        if (existingNames.has(name.toLowerCase())) {
            errors.push({ row: index + 1, error: `Material duplicado: "${name}"` });
            return null;
        }

        // Mark as used to prevent duplicates within import
        existingNames.add(name.toLowerCase());

        // Resolve or mark category for creation
        let category_id = null;
        let categoryToCreate: string | null = null;
        if (material.category_name) {
            const rawValue = String(material.category_name).trim();
            console.log(`[Import] Category for "${name}": rawValue="${rawValue}"`);

            // Check if rawValue is already a UUID (from conflict resolution)
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawValue);

            if (isUUID) {
                // Already resolved to an ID
                category_id = rawValue;
                console.log(`[Import] Category is UUID, using directly: ${category_id}`);
            } else {
                // Try to find by name
                const directMatch = categories?.find(c => c.id === rawValue);
                if (directMatch) {
                    category_id = directMatch.id;
                    console.log(`[Import] Category matched by ID: ${category_id}`);
                } else {
                    category_id = categoryMap.get(rawValue.toLowerCase()) || null;
                    console.log(`[Import] Category lookup by name: ${category_id}`);
                    if (!category_id && rawValue) {
                        // Mark for creation
                        categoryToCreate = rawValue;
                        if (!categoriesToCreate.has(rawValue.toLowerCase())) {
                            categoriesToCreate.set(rawValue.toLowerCase(), rawValue);
                        }
                    }
                }
            }
        }

        // Resolve or mark unit for creation
        let unit_id = null;
        let unitToCreate: string | null = null;
        if (material.unit_name) {
            const rawValue = String(material.unit_name).trim();
            const directMatch = units?.find(u => u.id === rawValue);
            if (directMatch) {
                unit_id = directMatch.id;
            } else {
                unit_id = unitMap.get(rawValue.toLowerCase()) || null;
                if (!unit_id && rawValue) {
                    // Mark for creation
                    unitToCreate = rawValue;
                    if (!unitsToCreate.has(rawValue.toLowerCase())) {
                        unitsToCreate.set(rawValue.toLowerCase(), rawValue);
                    }
                }
            }
        }

        // Resolve or mark provider for creation
        let provider_id = null;
        let providerToCreate: string | null = null;
        if (material.provider_name) {
            const rawValue = String(material.provider_name).trim();
            const directMatch = contacts?.find(c => c.id === rawValue);
            if (directMatch) {
                provider_id = directMatch.id;
            } else {
                provider_id = providerMap.get(rawValue.toLowerCase()) || null;
                if (!provider_id && rawValue) {
                    providerToCreate = rawValue;
                    if (!providersToCreate.has(rawValue.toLowerCase())) {
                        providersToCreate.set(rawValue.toLowerCase(), rawValue);
                    }
                }
            }
        }

        // Resolve material_type
        let material_type = 'material';
        if (material.material_type) {
            const typeValue = String(material.material_type).toLowerCase().trim();
            if (typeValue.includes('consumable') || typeValue.includes('consumible') || typeValue.includes('insumo')) {
                material_type = 'consumable';
            }
        }

        // Parse and normalize price
        let unit_price: number | null = null;
        if (material.unit_price !== undefined && material.unit_price !== null && material.unit_price !== '') {
            const rawPrice = String(material.unit_price).replace(/[^\d.,\-]/g, '').replace(',', '.');
            unit_price = parseFloat(rawPrice);
            if (isNaN(unit_price)) unit_price = null;
        }

        // Normalize currency code (handle "pesos" -> "ARS", "dolares" -> "USD")
        let currency_code: string | null = null;
        if (material.currency_code) {
            const rawCurrency = String(material.currency_code).toLowerCase().trim();
            if (rawCurrency.includes('peso') || rawCurrency === 'ars' || rawCurrency === '$') {
                currency_code = 'ARS';
            } else if (rawCurrency.includes('dolar') || rawCurrency.includes('dollar') || rawCurrency === 'usd' || rawCurrency === 'us$') {
                currency_code = 'USD';
            } else if (rawCurrency.includes('euro') || rawCurrency === 'eur' || rawCurrency === '€') {
                currency_code = 'EUR';
            } else {
                // Keep as-is but uppercase
                currency_code = rawCurrency.toUpperCase();
            }
        }

        // Parse price date (optional - uses current date if not provided)
        let price_date: string | null = null;
        if (material.price_date) {
            const parsedDate = parseFlexibleDate(material.price_date);
            if (parsedDate) {
                price_date = parsedDate.toISOString().split('T')[0];
            }
        }

        // Resolve or mark sale unit for creation
        let sale_unit_id = null;
        let saleUnitToCreate: string | null = null;
        if (material.sale_unit_name) {
            const rawValue = String(material.sale_unit_name).trim();
            const directMatch = units?.find(u => u.id === rawValue);
            if (directMatch) {
                sale_unit_id = directMatch.id;
            } else {
                sale_unit_id = unitMap.get(rawValue.toLowerCase()) || null;
                if (!sale_unit_id && rawValue) {
                    // Mark for creation (reuse unitsToCreate)
                    saleUnitToCreate = rawValue;
                    if (!unitsToCreate.has(rawValue.toLowerCase())) {
                        unitsToCreate.set(rawValue.toLowerCase(), rawValue);
                    }
                }
            }
        }

        // Parse sale unit quantity
        let sale_unit_quantity: number | null = null;
        if (material.sale_unit_quantity !== undefined && material.sale_unit_quantity !== null && material.sale_unit_quantity !== '') {
            const rawQty = String(material.sale_unit_quantity).replace(/[^\d.,]/g, '').replace(',', '.');
            sale_unit_quantity = parseFloat(rawQty);
            if (isNaN(sale_unit_quantity) || sale_unit_quantity <= 0) sale_unit_quantity = null;
        }

        console.log(`[Import] Parsed "${name}": unit_price="${material.unit_price}" -> ${unit_price}, currency="${material.currency_code}" -> ${currency_code}, price_date="${material.price_date}" -> ${price_date}`);

        return {
            name,
            code: material.code ? String(material.code).trim() : null,
            description: material.description ? String(material.description).trim() : null,
            category_id,
            categoryToCreate,
            unit_id,
            unitToCreate,
            provider_id,
            providerToCreate,
            material_type,
            unit_price,
            currency_code,
            price_date,
            sale_unit_id,
            saleUnitToCreate,
            sale_unit_quantity,
            index,
        };
    }).filter(Boolean) as any[];

    // 7. Create missing categories
    let categoriesCreated = 0;
    if (categoriesToCreate.size > 0) {
        const categoryInserts = Array.from(categoriesToCreate.values()).map(name => ({
            name,
            organization_id: organizationId,
            is_deleted: false,
        }));

        console.log(`[Import] Creating ${categoryInserts.length} new categories:`, categoryInserts.map(c => c.name));

        const { data: newCategories, error: categoryError } = await supabase
            .from('material_categories')
            .insert(categoryInserts)
            .select('id, name');

        if (categoryError) {
            console.error('[Import] Failed to create categories:', categoryError);
        } else if (newCategories) {
            categoriesCreated = newCategories.length;
            console.log(`[Import] Successfully created ${newCategories.length} categories`);
            newCategories.forEach((c: any) => {
                categoryMap.set(c.name.toLowerCase().trim(), c.id);
            });
        }
    }

    // 8. Create missing units
    if (unitsToCreate.size > 0) {
        const unitInserts = Array.from(unitsToCreate.values()).map(name => ({
            name,
            symbol: name.substring(0, 10), // Use first 10 chars as symbol
            organization_id: organizationId,
            is_system: false,
        }));

        const { data: newUnits, error: unitError } = await supabase
            .from('units')
            .insert(unitInserts)
            .select('id, name');

        if (!unitError && newUnits) {
            newUnits.forEach((u: any) => {
                unitMap.set(u.name.toLowerCase().trim(), u.id);
            });
        }
    }

    // 9. Create missing providers (as contacts)
    let providersCreated = 0;
    if (providersToCreate.size > 0) {
        const providerInserts = Array.from(providersToCreate.values()).map(name => ({
            full_name: name,
            organization_id: organizationId,
            is_local: true,
            sync_status: 'synced',
            created_by: memberId,
            updated_by: memberId,
        }));

        console.log(`[Import] Creating ${providerInserts.length} new providers:`, providerInserts.map(p => p.full_name));

        const { data: newProviders, error: providerError } = await supabase
            .from('contacts')
            .insert(providerInserts)
            .select('id, full_name');

        if (providerError) {
            console.error('[Import] Failed to create providers:', providerError);
        } else if (newProviders) {
            providersCreated = newProviders.length;
            console.log(`[Import] Successfully created ${newProviders.length} providers`);
            newProviders.forEach((p: any) => {
                const key = p.full_name.toLowerCase().trim();
                console.log(`[Import] Adding provider to map: key="${key}" id="${p.id}"`);
                providerMap.set(key, p.id);
            });
            console.log(`[Import] ProviderMap now has ${providerMap.size} entries:`, Array.from(providerMap.keys()));
        }
    }

    // 10. Prepare final records with resolved IDs
    const records = parsedMaterials.map(material => {
        // Resolve category_id if it was marked for creation
        let category_id = material.category_id;
        if (!category_id && material.categoryToCreate) {
            category_id = categoryMap.get(material.categoryToCreate.toLowerCase()) || null;
        }

        // Resolve unit_id if it was marked for creation
        let unit_id = material.unit_id;
        if (!unit_id && material.unitToCreate) {
            unit_id = unitMap.get(material.unitToCreate.toLowerCase()) || null;
        }

        // Resolve provider_id if it was marked for creation
        let provider_id = material.provider_id;
        if (!provider_id && material.providerToCreate) {
            const providerKey = material.providerToCreate.toLowerCase().trim();
            provider_id = providerMap.get(providerKey) || null;
            console.log(`[Import] Resolving provider "${material.providerToCreate}" -> key "${providerKey}" -> id: ${provider_id}`);
        }

        // Resolve sale_unit_id if it was marked for creation
        let sale_unit_id = material.sale_unit_id;
        if (!sale_unit_id && material.saleUnitToCreate) {
            sale_unit_id = unitMap.get(material.saleUnitToCreate.toLowerCase()) || null;
        }

        return {
            name: material.name,
            code: material.code,
            description: material.description,
            organization_id: organizationId,
            category_id,
            unit_id,
            default_provider_id: provider_id,
            default_sale_unit_id: sale_unit_id,
            default_sale_unit_quantity: material.sale_unit_quantity,
            material_type: material.material_type,
            is_system: false,
            is_deleted: false,
            import_batch_id: batchId,
            created_by: memberId,
            updated_by: memberId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            // Keep price info for second pass
            _unit_price: material.unit_price,
            _currency_code: material.currency_code,
            _price_date: material.price_date,
        };
    });

    if (errors.length > 0) {
        console.warn("Material catalog import warnings:", errors);
    }

    // 11. Insert valid records
    const insertedMaterials: any[] = [];
    if (records.length > 0) {
        // Remove temporary fields before insert
        const cleanRecords = records.map(({ _unit_price, _currency_code, _price_date, ...rest }) => rest);

        const { data: inserted, error } = await supabase
            .from('materials')
            .insert(cleanRecords)
            .select('id, name');

        if (error) {
            console.error("Bulk material catalog insert failed:", error);
            throw new Error("Bulk insert failed: " + error.message);
        }

        if (inserted) {
            insertedMaterials.push(...inserted);
        }
    }

    // 12. Insert prices for materials that have price info
    const priceInserts: any[] = [];
    console.log(`[Import] Checking ${records.length} records for prices...`);

    records.forEach((record, idx) => {
        // Parse price as number (could be string from Excel)
        const priceValue = typeof record._unit_price === 'string'
            ? parseFloat(record._unit_price)
            : Number(record._unit_price);

        console.log(`[Import] Record "${record.name}": _unit_price=${record._unit_price} (parsed: ${priceValue}), _currency_code=${record._currency_code}`);

        if (priceValue && priceValue > 0) {
            const insertedMaterial = insertedMaterials.find(
                m => m.name.toLowerCase() === record.name.toLowerCase()
            );
            if (insertedMaterial) {
                const currency_id = record._currency_code
                    ? currencyMap.get(record._currency_code)
                    : defaultCurrencyId;

                console.log(`[Import] Material "${record.name}" found, currency_id=${currency_id}`);

                if (currency_id) {
                    priceInserts.push({
                        material_id: insertedMaterial.id,
                        organization_id: organizationId,
                        unit_price: priceValue,
                        currency_id,
                        // Use user-provided date if available, otherwise current date
                        valid_from: record._price_date || new Date().toISOString().split('T')[0],
                        created_by: memberId,
                        updated_by: memberId,
                    });
                } else {
                    console.log(`[Import] No currency found for code "${record._currency_code}"`);
                }
            } else {
                console.log(`[Import] Material "${record.name}" NOT FOUND in insertedMaterials`);
            }
        }
    });

    let pricesCreated = 0;
    if (priceInserts.length > 0) {
        console.log(`[Import] Inserting ${priceInserts.length} prices for materials`);

        const { error: priceError } = await supabase
            .from('material_prices')
            .insert(priceInserts);

        if (priceError) {
            console.error('[Import] Failed to insert material prices:', priceError);
        } else {
            pricesCreated = priceInserts.length;
            console.log(`[Import] Successfully created ${pricesCreated} prices`);
        }
    }

    revalidatePath('/organization/catalog');
    return {
        success: insertedMaterials.length,
        errors,
        skipped: materials.length - insertedMaterials.length,
        created: {
            categories: categoriesCreated,
            units: unitsToCreate.size,
            providers: providersCreated,
            prices: pricesCreated,
        }
    };
}
