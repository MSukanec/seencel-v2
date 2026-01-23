"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getUserOrganizations } from "@/features/organization/queries";

// ============================================
// CREATE TASK
// ============================================
export async function createTask(formData: FormData) {
    // Check if creating a system task (admin mode)
    const isSystemTask = formData.get("is_system") === "true";

    // Use service client for admin operations to bypass RLS
    const supabase = isSystemTask ? createServiceClient() : await createClient();
    const formOrgId = formData.get("organization_id") as string | null;

    // For non-system tasks, we need an organization
    if (!isSystemTask && !formOrgId) {
        const { activeOrgId } = await getUserOrganizations();
        if (!activeOrgId) {
            return { error: "No hay organización activa" };
        }
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
            organization_id: isSystemTask ? null : (formOrgId || (await getUserOrganizations()).activeOrgId),
            is_system: isSystemTask,
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
    revalidatePath("/admin/catalog");
    return { data, error: null };
}

// ============================================
// UPDATE TASK
// ============================================
export async function updateTask(formData: FormData) {
    const isAdminMode = formData.get("is_admin_mode") === "true";

    // Use service client for admin operations to bypass RLS
    const supabase = isAdminMode ? createServiceClient() : await createClient();
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

    let query = supabase
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
        .eq("id", id);

    // In admin mode, we can edit system tasks
    // In normal mode, we can only edit our org's non-system tasks
    if (isAdminMode) {
        // Admin mode: only edit system tasks
        query = query.eq("is_system", true);
    } else {
        const { activeOrgId } = await getUserOrganizations();
        if (!activeOrgId) {
            return { error: "No hay organización activa" };
        }
        query = query.eq("organization_id", activeOrgId).eq("is_system", false);
    }

    const { data, error } = await query.select().single();

    if (error) {
        console.error("Error updating task:", error);
        return { error: error.message };
    }

    revalidatePath("/organization/catalog");
    revalidatePath("/admin/catalog");
    return { data, error: null };
}

// ============================================
// DELETE TASK (soft delete)
// ============================================
export async function deleteTask(id: string, isAdminMode: boolean = false) {
    // Use service client for admin operations to bypass RLS
    const supabase = isAdminMode ? createServiceClient() : await createClient();

    let query = supabase
        .from("tasks")
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
        })
        .eq("id", id);

    // In admin mode, we can delete system tasks
    // In normal mode, we can only delete our org's non-system tasks
    if (!isAdminMode) {
        const { activeOrgId } = await getUserOrganizations();
        if (!activeOrgId) {
            return { error: "No hay organización activa" };
        }
        query = query.eq("organization_id", activeOrgId).eq("is_system", false);
    }

    const { error } = await query;

    if (error) {
        console.error("Error deleting task:", error);
        return { error: error.message };
    }

    revalidatePath("/organization/catalog");
    revalidatePath("/admin/catalog");
    return { success: true, error: null };
}

// ============================================================================
// TASK MATERIALS CRUD (Recipe Management)
// ============================================================================

/**
 * Add a material to a task's recipe
 */
export async function addTaskMaterial(
    taskId: string,
    materialId: string,
    amount: number,
    isSystemTask: boolean = false
) {
    const supabase = isSystemTask ? createServiceClient() : await createClient();

    const { data, error } = await supabase
        .from("task_materials")
        .insert({
            task_id: taskId,
            material_id: materialId,
            amount,
            is_system: isSystemTask,
            // organization_id is auto-set by trigger for non-system
        })
        .select()
        .single();

    if (error) {
        console.error("Error adding task material:", error);
        if (error.code === "23505") {
            return { error: "Este material ya está agregado a la tarea" };
        }
        return { error: error.message };
    }

    revalidatePath("/admin/catalog/task");
    revalidatePath("/organization/catalog/task");
    return { data, error: null };
}

/**
 * Update a task material's amount
 */
export async function updateTaskMaterial(
    id: string,
    amount: number,
    isSystemTask: boolean = false
) {
    const supabase = isSystemTask ? createServiceClient() : await createClient();

    const { data, error } = await supabase
        .from("task_materials")
        .update({ amount })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating task material:", error);
        return { error: error.message };
    }

    revalidatePath("/admin/catalog/task");
    revalidatePath("/organization/catalog/task");
    return { data, error: null };
}

/**
 * Remove a material from a task's recipe
 */
export async function removeTaskMaterial(id: string, isSystemTask: boolean = false) {
    const supabase = isSystemTask ? createServiceClient() : await createClient();

    const { error } = await supabase
        .from("task_materials")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error removing task material:", error);
        return { error: error.message };
    }

    revalidatePath("/admin/catalog/task");
    revalidatePath("/organization/catalog/task");
    return { success: true, error: null };
}


