"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ===============================================
// Material Payments
// ===============================================

const createMaterialPaymentSchema = z.object({
    project_id: z.string().uuid(),
    organization_id: z.string().uuid(),
    wallet_id: z.string().uuid(),
    purchase_id: z.string().uuid().nullable(),
    amount: z.number().positive(),
    currency_id: z.string().uuid(),
    exchange_rate: z.number().nullable(),
    payment_date: z.string(), // YYYY-MM-DD
    notes: z.string().optional(),
    reference: z.string().optional(),
    status: z.enum(['confirmed', 'pending', 'rejected', 'void']).default('confirmed'),
});

export async function createMaterialPaymentAction(input: z.infer<typeof createMaterialPaymentSchema> | FormData) {
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
            purchase_id: raw.purchase_id === '' ? null : raw.purchase_id,
        };
        currencyCodeToCheck = raw.currency_code as string || null;
        mediaFilesJson = raw.media_files as string || null;
    } else {
        currencyCodeToCheck = (input as any).currency_code || null;
        mediaFilesJson = (input as any).media_files || null;
    }

    // 1. Fetch currency to check code for functional amount calc
    let currencyCode: string | null = currencyCodeToCheck;

    if (!currencyCode) {
        const { data: publicCurrency } = await supabase
            .from('currencies')
            .select('code')
            .eq('id', payload.currency_id)
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
        throw new Error("Error al validar la moneda: No se pudo obtener información de la divisa.");
    }

    // 2. Calculate functional amount (Latam Rule: USD multiplies by rate)
    const isUSD = currencyCode === 'USD';
    const functional_amount = isUSD
        ? payload.amount * (payload.exchange_rate || 1)
        : payload.amount;

    const { data, error } = await supabase
        .from('material_payments')
        .insert({
            project_id: payload.project_id,
            organization_id: payload.organization_id,
            wallet_id: payload.wallet_id,
            purchase_id: payload.purchase_id,
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
        console.error("Error creating material payment:", error);
        throw new Error("Error al registrar el pago de material.");
    }

    // 3. Handle Media Attachment if needed
    if (mediaFilesJson && data?.id && user?.id) {
        try {
            const mediaList = JSON.parse(mediaFilesJson);
            if (Array.isArray(mediaList)) {
                for (const mediaData of mediaList) {
                    if (mediaData.id === 'existing') continue;
                    if (!mediaData.path || !mediaData.bucket) continue;

                    const dbType = mediaData.type.startsWith('image/') ? 'image' : mediaData.type === 'application/pdf' ? 'pdf' : 'other';

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
                        await supabase.from('media_links').insert({
                            media_file_id: fileData.id,
                            material_payment_id: data.id,
                            organization_id: payload.organization_id,
                            project_id: payload.project_id,
                            created_by: user.id,
                            category: 'financial',
                            visibility: 'private'
                        });
                    }
                }
            }
        } catch (e) {
            console.error("Error processing media files:", e);
        }
    }

    revalidatePath('/project');
    return data;
}

const updateMaterialPaymentSchema = createMaterialPaymentSchema.partial().extend({
    id: z.string().uuid(),
});

export async function updateMaterialPaymentAction(input: z.infer<typeof updateMaterialPaymentSchema> | FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

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
            purchase_id: raw.purchase_id === '' ? null : raw.purchase_id,
        };
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

    // 1. Fetch current payment
    const { data: currentPayment, error: fetchError } = await supabase
        .from('material_payments')
        .select('amount, exchange_rate, currency_id, organization_id')
        .eq('id', paymentId)
        .single();

    if (fetchError || !currentPayment) {
        throw new Error("No se encontró el pago a actualizar.");
    }

    // 2. Fetch currency details 
    let currencyCode: string | null = currencyCodeToCheck;

    if (!currencyCode) {
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

    // 3. Calculate new functional amount
    const newAmount = payload.amount ?? currentPayment.amount;
    const newRate = payload.exchange_rate ?? currentPayment.exchange_rate ?? 1;
    const isUSD = currencyCode === 'USD';
    const functional_amount = isUSD ? newAmount * newRate : newAmount;

    const { data, error } = await supabase
        .from('material_payments')
        .update({
            project_id: payload.project_id,
            organization_id: payload.organization_id,
            wallet_id: payload.wallet_id,
            purchase_id: payload.purchase_id,
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
        console.error("Error updating material payment:", error);
        throw new Error("Error al actualizar el pago.");
    }

    // 4. Handle Media Attachment (New)
    if (mediaFilesJson && data?.id && user?.id) {
        try {
            const mediaList = JSON.parse(mediaFilesJson);
            if (Array.isArray(mediaList)) {
                for (const mediaData of mediaList) {
                    if (mediaData.id === 'existing') continue;
                    if (!mediaData.path || !mediaData.bucket) continue;

                    const dbType = mediaData.type.startsWith('image/') ? 'image' : mediaData.type === 'application/pdf' ? 'pdf' : 'other';

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
                        await supabase.from('media_links').insert({
                            media_file_id: fileData.id,
                            material_payment_id: data.id,
                            organization_id: currentPayment.organization_id,
                            project_id: payload.project_id,
                            created_by: user.id,
                            category: 'financial',
                            visibility: 'private'
                        });
                    }
                }
            }
        } catch (e) {
            console.error("Error processing media file in update:", e);
        }
    }

    revalidatePath('/project');
    return data;
}

export async function deleteMaterialPaymentAction(paymentId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('material_payments')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString()
        })
        .eq('id', paymentId);

    if (error) {
        console.error("Error deleting material payment:", error);
        throw new Error("Error al eliminar el pago.");
    }

    revalidatePath('/project');
}

// ===============================================
// Helpers: Get Material Purchases for dropdown
// ===============================================

export async function getMaterialPurchasesAction(projectId: string) {
    const supabase = await createClient();

    // For now, return empty array - will be populated when material_purchases table exists
    // TODO: Implement when material_purchases table is ready
    const { data, error } = await supabase
        .from('material_purchases')
        .select('id, reference, concept, supplier_name')
        .eq('project_id', projectId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (error) {
        // Table might not exist yet, return empty array
        console.warn("Error fetching material purchases (table may not exist yet):", error.message);
        return [];
    }

    return data || [];
}

// ===============================================
// Material CRUD (Unified for Admin + Organization)
// ===============================================

/**
 * Create a material
 * @param isAdminMode - If true, creates a system material (is_system=true, no org_id)
 * @param organizationId - Required when isAdminMode is false
 */
export async function createMaterial(formData: FormData, isAdminMode: boolean = false) {
    const supabase = await createClient();

    const name = formData.get("name") as string;
    const unit_id = formData.get("unit_id") as string || null;
    const category_id = formData.get("category_id") as string || null;
    const material_type = (formData.get("material_type") as string) || "material";
    const organization_id = formData.get("organization_id") as string || null;

    if (!name?.trim()) {
        return { error: "El nombre es requerido" };
    }

    // Validate org_id is present for non-admin mode
    if (!isAdminMode && !organization_id) {
        return { error: "Se requiere una organización" };
    }

    const { data, error } = await supabase
        .from("materials")
        .insert({
            name: name.trim(),
            unit_id: unit_id || null,
            category_id: category_id || null,
            material_type,
            is_system: isAdminMode,
            organization_id: isAdminMode ? null : organization_id,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating material:", error);
        if (error.code === "23505") {
            return { error: "Ya existe un material con ese nombre" };
        }
        return { error: error.message };
    }

    revalidatePath("/organization/catalog");
    revalidatePath("/admin/catalog");
    return { data };
}

/**
 * Update a material
 * @param isAdminMode - If true, can only update system materials
 */
export async function updateMaterial(formData: FormData, isAdminMode: boolean = false) {
    const supabase = await createClient();

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const unit_id = formData.get("unit_id") as string || null;
    const category_id = formData.get("category_id") as string || null;
    const material_type = (formData.get("material_type") as string) || "material";

    if (!id) {
        return { error: "ID es requerido" };
    }

    if (!name?.trim()) {
        return { error: "El nombre es requerido" };
    }

    let query = supabase
        .from("materials")
        .update({
            name: name.trim(),
            unit_id: unit_id || null,
            category_id: category_id || null,
            material_type,
        })
        .eq("id", id);

    // Safety: only update the correct type of material
    if (isAdminMode) {
        query = query.eq("is_system", true);
    } else {
        query = query.eq("is_system", false);
    }

    const { data, error } = await query.select().single();

    if (error) {
        console.error("Error updating material:", error);
        if (error.code === "23505") {
            return { error: "Ya existe un material con ese nombre" };
        }
        return { error: error.message };
    }

    revalidatePath("/organization/catalog");
    revalidatePath("/admin/catalog");
    return { data };
}

/**
 * Delete a material (soft delete)
 * @param isAdminMode - If true, can only delete system materials
 */
export async function deleteMaterial(id: string, replacementId: string | null, isAdminMode: boolean = false) {
    const supabase = await createClient();

    // If replacement is provided, update all references first
    if (replacementId) {
        // products table
        await supabase
            .from("products")
            .update({ material_id: replacementId })
            .eq("material_id", id);

        // organization_material_prices table
        await supabase
            .from("organization_material_prices")
            .update({ material_id: replacementId })
            .eq("material_id", id);

        // task_materials table
        await supabase
            .from("task_materials")
            .update({ material_id: replacementId })
            .eq("material_id", id);
    }

    let query = supabase
        .from("materials")
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
        })
        .eq("id", id);

    // Safety: only delete the correct type of material
    if (isAdminMode) {
        query = query.eq("is_system", true);
    } else {
        query = query.eq("is_system", false);
    }

    const { error } = await query;

    if (error) {
        console.error("Error deleting material:", error);
        return { error: error.message };
    }

    revalidatePath("/organization/catalog");
    revalidatePath("/admin/catalog");
    return { success: true };
}


