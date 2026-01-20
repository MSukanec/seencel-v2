"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getUserOrganizations } from "@/features/organization/queries";

// ============================================
// CREATE TASK
// ============================================
export async function createTask(formData: FormData) {
    const supabase = await createClient();
    const { activeOrgId } = await getUserOrganizations();

    if (!activeOrgId) {
        return { error: "No hay organización activa" };
    }

    const name = formData.get("name") as string;
    const code = formData.get("code") as string | null;
    const description = formData.get("description") as string | null;
    const unit_id = formData.get("unit_id") as string;
    const task_division_id = formData.get("task_division_id") as string | null;
    const is_published = formData.get("is_published") === "true";

    if (!name?.trim()) {
        return { error: "El nombre es requerido" };
    }

    if (!unit_id) {
        return { error: "La unidad es requerida" };
    }

    const { data, error } = await supabase
        .from("tasks")
        .insert({
            name: name.trim(),
            custom_name: name.trim(), // Keep in sync for compatibility
            code: code?.trim() || null,
            description: description?.trim() || null,
            unit_id,
            task_division_id: task_division_id || null,
            organization_id: activeOrgId,
            is_system: false,
            is_published,
            is_deleted: false,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating task:", error);
        return { error: error.message };
    }

    revalidatePath("/organization/catalog");
    return { data, error: null };
}

// ============================================
// UPDATE TASK
// ============================================
export async function updateTask(formData: FormData) {
    const supabase = await createClient();
    const { activeOrgId } = await getUserOrganizations();

    if (!activeOrgId) {
        return { error: "No hay organización activa" };
    }

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const code = formData.get("code") as string | null;
    const description = formData.get("description") as string | null;
    const unit_id = formData.get("unit_id") as string;
    const task_division_id = formData.get("task_division_id") as string | null;
    const is_published = formData.get("is_published") === "true";

    if (!id) {
        return { error: "ID de tarea no proporcionado" };
    }

    if (!name?.trim()) {
        return { error: "El nombre es requerido" };
    }

    const { data, error } = await supabase
        .from("tasks")
        .update({
            name: name.trim(),
            custom_name: name.trim(),
            code: code?.trim() || null,
            description: description?.trim() || null,
            unit_id,
            task_division_id: task_division_id || null,
            is_published,
        })
        .eq("id", id)
        .eq("organization_id", activeOrgId) // Security: only own tasks
        .eq("is_system", false) // Security: can't edit system tasks
        .select()
        .single();

    if (error) {
        console.error("Error updating task:", error);
        return { error: error.message };
    }

    revalidatePath("/organization/catalog");
    return { data, error: null };
}

// ============================================
// DELETE TASK (soft delete)
// ============================================
export async function deleteTask(id: string) {
    const supabase = await createClient();
    const { activeOrgId } = await getUserOrganizations();

    if (!activeOrgId) {
        return { error: "No hay organización activa" };
    }

    const { error } = await supabase
        .from("tasks")
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("organization_id", activeOrgId)
        .eq("is_system", false);

    if (error) {
        console.error("Error deleting task:", error);
        return { error: error.message };
    }

    revalidatePath("/organization/catalog");
    return { success: true, error: null };
}
