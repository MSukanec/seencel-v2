"use server";


import { sanitizeError } from "@/lib/error-utils";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============================================================================
// CREATE System Material
// ============================================================================

export async function createSystemMaterial(formData: FormData) {
    const supabase = await createClient();

    const name = formData.get("name") as string;
    const unit_id = formData.get("unit_id") as string || null;
    const category_id = formData.get("category_id") as string || null;
    const material_type = (formData.get("material_type") as string) || "material";

    if (!name?.trim()) {
        return { error: "El nombre es requerido" };
    }

    const { data, error } = await supabase
        .from("materials")
        .insert({
            name: name.trim(),
            unit_id: unit_id || null,
            category_id: category_id || null,
            material_type,
            is_system: true,
            organization_id: null, // System materials have no org
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating system material:", error);
        if (error.code === "23505") {
            return { error: "Ya existe un material con ese nombre" };
        }
        return { error: sanitizeError(error) };
    }

    revalidatePath("/admin/catalog");
    return { data };
}

// ============================================================================
// UPDATE System Material
// ============================================================================

export async function updateSystemMaterial(formData: FormData) {
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

    const { data, error } = await supabase
        .from("materials")
        .update({
            name: name.trim(),
            unit_id: unit_id || null,
            category_id: category_id || null,
            material_type,
        })
        .eq("id", id)
        .eq("is_system", true) // Safety: only update system materials
        .select()
        .single();

    if (error) {
        console.error("Error updating system material:", error);
        if (error.code === "23505") {
            return { error: "Ya existe un material con ese nombre" };
        }
        return { error: sanitizeError(error) };
    }

    revalidatePath("/admin/catalog");
    return { data };
}

// ============================================================================
// DELETE System Material (Soft Delete + Optional Replacement)
// ============================================================================

export async function deleteSystemMaterial(id: string, replacementId: string | null) {
    const supabase = await createClient();

    // If replacement is provided, update all references first
    if (replacementId) {
        // Update any references in other tables that use material_id

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

        // task_recipe_materials table
        await supabase
            .from("task_recipe_materials")
            .update({ material_id: replacementId })
            .eq("material_id", id);
    }

    // Soft delete the material
    const { error } = await supabase
        .from("materials")
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("is_system", true); // Safety: only delete system materials

    if (error) {
        console.error("Error deleting system material:", error);
        return { error: sanitizeError(error) };
    }

    revalidatePath("/admin/catalog");
    return { success: true };
}

// ============================================================================
// MATERIAL CATEGORIES CRUD
// ============================================================================

/**
 * Create a material category
 */
export async function createMaterialCategory(name: string, parentId: string | null) {
    const supabase = createServiceClient();

    if (!name?.trim()) {
        return { error: "El nombre es requerido" };
    }

    const { data, error } = await supabase
        .from("material_categories")
        .insert({
            name: name.trim(),
            parent_id: parentId || null,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating material category:", error);
        return { error: sanitizeError(error) };
    }

    revalidatePath("/admin/catalog");
    return { data };
}

/**
 * Update a material category
 */
export async function updateMaterialCategory(id: string, name: string, parentId: string | null) {
    const supabase = createServiceClient();

    if (!id) {
        return { error: "ID es requerido" };
    }

    if (!name?.trim()) {
        return { error: "El nombre es requerido" };
    }

    // Prevent circular reference
    if (parentId === id) {
        return { error: "Una categoría no puede ser su propio padre" };
    }

    const { data, error } = await supabase
        .from("material_categories")
        .update({
            name: name.trim(),
            parent_id: parentId || null,
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating material category:", error);
        return { error: sanitizeError(error) };
    }

    revalidatePath("/admin/catalog");
    return { data };
}

/**
 * Delete a material category
 */
export async function deleteMaterialCategory(id: string) {
    const supabase = createServiceClient();

    // First, update children to have no parent (orphan them at root level)
    await supabase
        .from("material_categories")
        .update({ parent_id: null })
        .eq("parent_id", id);

    // Then delete the category
    const { error } = await supabase
        .from("material_categories")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting material category:", error);
        return { error: sanitizeError(error) };
    }

    revalidatePath("/admin/catalog");
    return { success: true };
}


