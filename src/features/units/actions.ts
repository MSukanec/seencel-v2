"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============================================================================
// Unit Actions
// ============================================================================

export async function createUnit(formData: FormData) {
    const supabase = await createClient();

    const name = formData.get("name") as string;
    const symbol = formData.get("symbol") as string | null;
    const organizationId = formData.get("organization_id") as string;
    const applicableToRaw = formData.get("applicable_to") as string | null;

    const applicableTo = applicableToRaw
        ? applicableToRaw.split(",").filter(Boolean)
        : ['task', 'material', 'labor'];

    if (!name || !name.trim()) {
        return { success: false, error: "El nombre es requerido" };
    }

    const { data, error } = await supabase
        .from('units')
        .insert({
            name: name.trim(),
            symbol: symbol?.trim() || null,
            organization_id: organizationId,
            applicable_to: applicableTo,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating unit:", error);
        if (error.code === "23505") {
            return { success: false, error: "Ya existe una unidad con ese nombre" };
        }
        return { success: false, error: error.message };
    }

    revalidatePath("/[locale]/(dashboard)/organization/catalog", "page");
    return { success: true, data };
}

export async function updateUnit(formData: FormData) {
    const supabase = await createClient();

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const symbol = formData.get("symbol") as string | null;
    const applicableToRaw = formData.get("applicable_to") as string | null;

    const applicableTo = applicableToRaw
        ? applicableToRaw.split(",").filter(Boolean)
        : undefined;

    if (!id || !name || !name.trim()) {
        return { success: false, error: "ID y nombre son requeridos" };
    }

    const updateData: any = {
        name: name.trim(),
        symbol: symbol?.trim() || null,
    };

    if (applicableTo) {
        updateData.applicable_to = applicableTo;
    }

    const { data, error } = await supabase
        .from('units')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error("Error updating unit:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/[locale]/(dashboard)/organization/catalog", "page");
    return { success: true, data };
}

export async function deleteUnit(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', id);

    if (error) {
        console.error("Error deleting unit:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/[locale]/(dashboard)/organization/catalog", "page");
    return { success: true };
}

// ============================================================================
// Unit Presentation Actions
// ============================================================================

export async function createUnitPresentation(formData: FormData) {
    const supabase = await createClient();

    const name = formData.get("name") as string;
    const unitId = formData.get("unit_id") as string;
    const equivalence = parseFloat(formData.get("equivalence") as string) || 1;
    const organizationId = formData.get("organization_id") as string;

    if (!name || !name.trim() || !unitId) {
        return { success: false, error: "Nombre y unidad son requeridos" };
    }

    const { data, error } = await supabase
        .from('unit_presentations')
        .insert({
            name: name.trim(),
            unit_id: unitId,
            equivalence,
            organization_id: organizationId,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating unit presentation:", error);
        if (error.code === "23505") {
            return { success: false, error: "Ya existe una presentación con ese nombre para esta unidad" };
        }
        return { success: false, error: error.message };
    }

    revalidatePath("/[locale]/(dashboard)/organization/catalog", "page");
    return { success: true, data };
}

export async function updateUnitPresentation(formData: FormData) {
    const supabase = await createClient();

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const unitId = formData.get("unit_id") as string;
    const equivalence = parseFloat(formData.get("equivalence") as string) || 1;

    if (!id || !name || !name.trim() || !unitId) {
        return { success: false, error: "ID, nombre y unidad son requeridos" };
    }

    const { data, error } = await supabase
        .from('unit_presentations')
        .update({
            name: name.trim(),
            unit_id: unitId,
            equivalence,
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error("Error updating unit presentation:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/[locale]/(dashboard)/organization/catalog", "page");
    return { success: true, data };
}

export async function deleteUnitPresentation(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('unit_presentations')
        .delete()
        .eq('id', id);

    if (error) {
        console.error("Error deleting unit presentation:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/[locale]/(dashboard)/organization/catalog", "page");
    return { success: true };
}
