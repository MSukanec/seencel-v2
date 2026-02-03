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

    // Use regular client - RLS policies allow admins to create system tasks
    const supabase = await createClient();
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

    // Parametric task fields
    const is_parametric = formData.get("is_parametric") === "true";
    const task_kind_id = formData.get("task_kind_id") as string | null;
    const task_element_id = formData.get("task_element_id") as string | null;
    const parameter_values_raw = formData.get("parameter_values") as string | null;
    const parameter_values = parameter_values_raw ? JSON.parse(parameter_values_raw) : {};

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
            // Parametric fields
            is_parametric,
            task_kind_id: task_kind_id || null,
            task_element_id: task_element_id || null,
            parameter_values: is_parametric ? parameter_values : {},
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

    // Use regular client - RLS policies allow admins to update system tasks
    const supabase = await createClient();
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
// UPDATE TASK ORGANIZATION (Admin only)
// ============================================
export async function updateTaskOrganization(
    taskId: string,
    organizationId: string | null
) {
    // Only admin can do this - use service client
    const supabase = createServiceClient();

    // If setting to an org, also set is_system = false
    // If setting to null (system), set is_system = true
    const updateData = organizationId
        ? { organization_id: organizationId, is_system: false }
        : { organization_id: null, is_system: true };

    const { data, error } = await supabase
        .from("tasks")
        .update(updateData)
        .eq("id", taskId)
        .select()
        .single();

    if (error) {
        console.error("Error updating task organization:", error);
        return { error: error.message };
    }

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

// ============================================================================
// TASK LABOR CRUD (Recipe Management)
// ============================================================================

/**
 * Add a labor type to a task's recipe
 */
export async function addTaskLabor(
    taskId: string,
    laborTypeId: string,
    quantity: number,
    isSystemTask: boolean = false
) {
    const supabase = isSystemTask ? createServiceClient() : await createClient();

    const { data, error } = await supabase
        .from("task_labor")
        .insert({
            task_id: taskId,
            labor_type_id: laborTypeId,
            quantity,
            is_system: isSystemTask,
            // organization_id is auto-set by trigger for non-system
        })
        .select()
        .single();

    if (error) {
        console.error("Error adding task labor:", error);
        if (error.code === "23505") {
            return { error: "Este tipo de mano de obra ya está agregado a la tarea" };
        }
        return { error: error.message };
    }

    revalidatePath("/admin/catalog/task");
    revalidatePath("/organization/catalog/task");
    return { data, error: null };
}

/**
 * Update a task labor's quantity
 */
export async function updateTaskLabor(
    id: string,
    quantity: number,
    isSystemTask: boolean = false
) {
    const supabase = isSystemTask ? createServiceClient() : await createClient();

    const { data, error } = await supabase
        .from("task_labor")
        .update({ quantity })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating task labor:", error);
        return { error: error.message };
    }

    revalidatePath("/admin/catalog/task");
    revalidatePath("/organization/catalog/task");
    return { data, error: null };
}

/**
 * Remove a labor type from a task's recipe
 */
export async function removeTaskLabor(id: string, isSystemTask: boolean = false) {
    const supabase = isSystemTask ? createServiceClient() : await createClient();

    const { error } = await supabase
        .from("task_labor")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error removing task labor:", error);
        return { error: error.message };
    }

    revalidatePath("/admin/catalog/task");
    revalidatePath("/organization/catalog/task");
    return { success: true, error: null };
}


// ============================================================================
// TASK DIVISIONS CRUD (Admin Only)
// ============================================================================

/**
 * Create a new task division (admin only - uses service client)
 */
export async function createTaskDivision(formData: FormData) {
    const supabase = await createClient();

    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const code = formData.get("code") as string | null;
    const order = formData.get("order") ? parseInt(formData.get("order") as string) : null;
    const parent_id = formData.get("parent_id") as string | null;

    if (!name?.trim()) {
        return { error: "El nombre es requerido" };
    }

    const { data, error } = await supabase
        .from("task_divisions")
        .insert({
            name: name.trim(),
            description: description?.trim() || null,
            code: code?.trim() || null,
            order,
            parent_id: parent_id || null,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating task division:", error);
        return { error: error.message };
    }

    revalidatePath("/admin/catalog");
    revalidatePath("/organization/catalog");
    return { data, error: null };
}

/**
 * Update a task division (admin only)
 */
export async function updateTaskDivision(formData: FormData) {
    const supabase = await createClient();

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const code = formData.get("code") as string | null;
    const order = formData.get("order") ? parseInt(formData.get("order") as string) : null;
    const parent_id = formData.get("parent_id") as string | null;

    if (!id) {
        return { error: "ID de rubro no proporcionado" };
    }

    if (!name?.trim()) {
        return { error: "El nombre es requerido" };
    }

    const { data, error } = await supabase
        .from("task_divisions")
        .update({
            name: name.trim(),
            description: description?.trim() || null,
            code: code?.trim() || null,
            order,
            parent_id: parent_id || null,
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating task division:", error);
        return { error: error.message };
    }

    revalidatePath("/admin/catalog");
    revalidatePath("/organization/catalog");
    return { data, error: null };
}

/**
 * Delete a task division with optional replacement
 * If replacementId is provided, all tasks are reassigned before deletion
 */
export async function deleteTaskDivision(
    divisionId: string,
    replacementId: string | null = null
) {
    const supabase = await createClient();

    // If replacement ID provided, reassign all tasks first
    if (replacementId) {
        const { error: reassignError } = await supabase
            .from("tasks")
            .update({ task_division_id: replacementId })
            .eq("task_division_id", divisionId);

        if (reassignError) {
            console.error("Error reassigning tasks:", reassignError);
            return { error: "Error al reasignar tareas: " + reassignError.message };
        }
    } else {
        // Set tasks to null division
        const { error: nullifyError } = await supabase
            .from("tasks")
            .update({ task_division_id: null })
            .eq("task_division_id", divisionId);

        if (nullifyError) {
            console.error("Error nullifying task divisions:", nullifyError);
            return { error: "Error al desvincular tareas: " + nullifyError.message };
        }
    }

    // Soft delete the division
    const { error } = await supabase
        .from("task_divisions")
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
        })
        .eq("id", divisionId);

    if (error) {
        console.error("Error deleting task division:", error);
        return { error: error.message };
    }

    revalidatePath("/admin/catalog");
    revalidatePath("/organization/catalog");
    return { success: true, error: null };
}

// Reorder task divisions (admin only)
export async function reorderTaskDivisions(
    orderedIds: string[]
): Promise<{ success?: boolean; error: string | null }> {
    const supabase = await createServiceClient();

    // Update each division's order based on its position in the array
    const updates = orderedIds.map((id, index) =>
        supabase
            .from("task_divisions")
            .update({ order: index + 1 })
            .eq("id", id)
    );

    const results = await Promise.all(updates);
    const hasError = results.some((r) => r.error);

    if (hasError) {
        console.error("Error reordering divisions:", results);
        return { error: "Error al reordenar rubros" };
    }

    revalidatePath("/admin/catalog");
    revalidatePath("/organization/catalog");
    return { success: true, error: null };
}

// ============================================
// TASK PARAMETER ACTIONS (System Table)
// ============================================

export async function createTaskParameter(formData: FormData) {
    const supabase = await createClient();

    const slug = formData.get("slug") as string;
    const label = formData.get("label") as string;
    const type = formData.get("type") as string;
    const description = formData.get("description") as string | null;
    const default_value = formData.get("default_value") as string | null;
    const is_required = formData.get("is_required") === "true";
    const order = formData.get("order") as string | null;

    if (!slug?.trim()) {
        return { error: "El slug es requerido" };
    }

    if (!label?.trim()) {
        return { error: "El nombre es requerido" };
    }

    if (!type) {
        return { error: "El tipo es requerido" };
    }

    const { data, error } = await supabase
        .from("task_parameters")
        .insert({
            slug: slug.trim().toLowerCase().replace(/\s+/g, '_'),
            label: label.trim(),
            type,
            description: description?.trim() || null,
            default_value: default_value?.trim() || null,
            is_required,
            order: order ? parseInt(order, 10) : null,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating task parameter:", error);
        if (error.code === "23505") {
            return { error: "Ya existe un parámetro con este slug" };
        }
        return { error: error.message };
    }

    revalidatePath("/admin/catalog");
    return { success: true, data, error: null };
}

export async function updateTaskParameter(id: string, formData: FormData) {
    const supabase = await createClient();

    const slug = formData.get("slug") as string;
    const label = formData.get("label") as string;
    const type = formData.get("type") as string;
    const description = formData.get("description") as string | null;
    const default_value = formData.get("default_value") as string | null;
    const is_required = formData.get("is_required") === "true";
    const order = formData.get("order") as string | null;

    if (!slug?.trim()) {
        return { error: "El slug es requerido" };
    }

    if (!label?.trim()) {
        return { error: "El nombre es requerido" };
    }

    const { data, error } = await supabase
        .from("task_parameters")
        .update({
            slug: slug.trim().toLowerCase().replace(/\s+/g, '_'),
            label: label.trim(),
            type,
            description: description?.trim() || null,
            default_value: default_value?.trim() || null,
            is_required,
            order: order ? parseInt(order, 10) : null,
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating task parameter:", error);
        if (error.code === "23505") {
            return { error: "Ya existe un parámetro con este slug" };
        }
        return { error: error.message };
    }

    revalidatePath("/admin/catalog");
    return { success: true, data, error: null };
}

export async function deleteTaskParameter(id: string) {
    const supabase = await createClient();

    // Soft delete the parameter
    const { error } = await supabase
        .from("task_parameters")
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
        })
        .eq("id", id);

    if (error) {
        console.error("Error deleting task parameter:", error);
        return { error: error.message };
    }

    revalidatePath("/admin/catalog");
    return { success: true, error: null };
}

// ============================================
// PARAMETER OPTIONS CRUD (Admin Only)
// ============================================

/**
 * Create a new parameter option
 */
export async function createParameterOption(formData: FormData) {
    const supabase = await createClient();

    const parameter_id = formData.get("parameter_id") as string;
    const label = formData.get("label") as string;
    const value = formData.get("value") as string;
    const short_code = formData.get("short_code") as string | null;
    const material_id = formData.get("material_id") as string | null;
    const order = formData.get("order") ? parseInt(formData.get("order") as string) : null;

    if (!parameter_id) {
        return { error: "ID de parámetro requerido" };
    }

    if (!label?.trim()) {
        return { error: "El label es requerido" };
    }

    if (!value?.trim()) {
        return { error: "El valor es requerido" };
    }

    const { data, error } = await supabase
        .from("task_parameter_options")
        .insert({
            parameter_id,
            label: label.trim(),
            value: value.trim(),
            short_code: short_code?.trim().toUpperCase() || null,
            material_id: material_id || null,
            order,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating parameter option:", error);
        if (error.code === "23505") {
            return { error: "Ya existe una opción con este valor" };
        }
        return { error: error.message };
    }

    revalidatePath("/admin/catalog");
    return { data, error: null };
}

/**
 * Update a parameter option
 */
export async function updateParameterOption(formData: FormData) {
    const supabase = await createClient();

    const id = formData.get("id") as string;
    const label = formData.get("label") as string;
    const value = formData.get("value") as string;
    const short_code = formData.get("short_code") as string | null;
    const material_id = formData.get("material_id") as string | null;
    const order = formData.get("order") ? parseInt(formData.get("order") as string) : null;

    if (!id) {
        return { error: "ID de opción no proporcionado" };
    }

    if (!label?.trim()) {
        return { error: "El label es requerido" };
    }

    if (!value?.trim()) {
        return { error: "El valor es requerido" };
    }

    const { data, error } = await supabase
        .from("task_parameter_options")
        .update({
            label: label.trim(),
            value: value.trim(),
            short_code: short_code?.trim().toUpperCase() || null,
            material_id: material_id || null,
            order,
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating parameter option:", error);
        if (error.code === "23505") {
            return { error: "Ya existe una opción con este valor" };
        }
        return { error: error.message };
    }

    revalidatePath("/admin/catalog");
    return { data, error: null };
}

/**
 * Delete a parameter option
 */
export async function deleteParameterOption(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("task_parameter_options")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting parameter option:", error);
        return { error: error.message };
    }

    revalidatePath("/admin/catalog");
    return { success: true, error: null };
}

// ============================================
// TASK ELEMENTS CRUD (Admin Only)
// ============================================

/**
 * Create a new task element (admin only)
 */
export async function createTaskElement(formData: FormData) {
    const supabase = await createClient();

    const name = formData.get("name") as string;
    const code = formData.get("code") as string | null;
    const description = formData.get("description") as string | null;
    const default_unit_id = formData.get("default_unit_id") as string | null;
    const order = formData.get("order") ? parseInt(formData.get("order") as string) : null;

    if (!name?.trim()) {
        return { error: "El nombre es requerido" };
    }

    const { data, error } = await supabase
        .from("task_elements")
        .insert({
            name: name.trim(),
            code: code?.trim().toUpperCase() || null,
            description: description?.trim() || null,
            default_unit_id: default_unit_id || null,
            order,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating task element:", error);
        if (error.code === "23505") {
            return { error: "Ya existe un elemento con este código" };
        }
        return { error: error.message };
    }

    revalidatePath("/admin/catalog");
    return { data, error: null };
}

/**
 * Update a task element (admin only)
 */
export async function updateTaskElement(formData: FormData) {
    const supabase = await createClient();

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const code = formData.get("code") as string | null;
    const description = formData.get("description") as string | null;
    const default_unit_id = formData.get("default_unit_id") as string | null;
    const order = formData.get("order") ? parseInt(formData.get("order") as string) : null;

    if (!id) {
        return { error: "ID de elemento no proporcionado" };
    }

    if (!name?.trim()) {
        return { error: "El nombre es requerido" };
    }

    const { data, error } = await supabase
        .from("task_elements")
        .update({
            name: name.trim(),
            code: code?.trim().toUpperCase() || null,
            description: description?.trim() || null,
            default_unit_id: default_unit_id || null,
            order,
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating task element:", error);
        if (error.code === "23505") {
            return { error: "Ya existe un elemento con este código" };
        }
        return { error: error.message };
    }

    revalidatePath("/admin/catalog");
    return { data, error: null };
}

/**
 * Delete a task element (soft delete)
 */
export async function deleteTaskElement(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("task_elements")
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
        })
        .eq("id", id);

    if (error) {
        console.error("Error deleting task element:", error);
        return { error: error.message };
    }

    revalidatePath("/admin/catalog");
    return { success: true, error: null };
}

// ============================================
// DIVISION COMPATIBILITY - ELEMENTS
// ============================================
export async function toggleDivisionElement(
    divisionId: string,
    elementId: string,
    shouldLink: boolean
) {
    const supabase = await createClient();

    if (shouldLink) {
        // Add link
        const { error } = await supabase
            .from("task_division_elements")
            .insert({ division_id: divisionId, element_id: elementId });

        if (error) {
            // Ignore duplicate key errors
            if (!error.message.includes("duplicate")) {
                console.error("Error linking element:", error);
                return { error: error.message };
            }
        }
    } else {
        // Remove link
        const { error } = await supabase
            .from("task_division_elements")
            .delete()
            .eq("division_id", divisionId)
            .eq("element_id", elementId);

        if (error) {
            console.error("Error unlinking element:", error);
            return { error: error.message };
        }
    }

    revalidatePath("/admin/catalog");
    return { success: true, error: null };
}

// ============================================
// DIVISION COMPATIBILITY - KINDS
// ============================================
export async function toggleDivisionKind(
    divisionId: string,
    kindId: string,
    shouldLink: boolean
) {
    const supabase = await createClient();

    if (shouldLink) {
        const { error } = await supabase
            .from("task_division_kinds")
            .insert({ division_id: divisionId, kind_id: kindId });

        if (error) {
            if (!error.message.includes("duplicate")) {
                console.error("Error linking kind:", error);
                return { error: error.message };
            }
        }
    } else {
        const { error } = await supabase
            .from("task_division_kinds")
            .delete()
            .eq("division_id", divisionId)
            .eq("kind_id", kindId);

        if (error) {
            console.error("Error unlinking kind:", error);
            return { error: error.message };
        }
    }

    revalidatePath("/admin/catalog");
    return { success: true, error: null };
}

// ============================================
// KIND COMPATIBILITY - ELEMENTS
// ============================================
export async function toggleKindElement(
    kindId: string,
    elementId: string,
    shouldLink: boolean
) {
    const supabase = await createClient();

    if (shouldLink) {
        const { error } = await supabase
            .from("task_kind_elements")
            .insert({ kind_id: kindId, element_id: elementId });

        if (error) {
            if (!error.message.includes("duplicate")) {
                console.error("Error linking element to kind:", error);
                return { error: error.message };
            }
        }
    } else {
        const { error } = await supabase
            .from("task_kind_elements")
            .delete()
            .eq("kind_id", kindId)
            .eq("element_id", elementId);

        if (error) {
            console.error("Error unlinking element from kind:", error);
            return { error: error.message };
        }
    }

    revalidatePath("/admin/catalog");
    return { success: true, error: null };
}

// ============================================
// ELEMENT COMPATIBILITY - PARAMETERS
// ============================================
export async function toggleElementParameter(
    elementId: string,
    parameterId: string,
    shouldLink: boolean,
    order?: number
) {
    const supabase = await createClient();

    if (shouldLink) {
        const { error } = await supabase
            .from("task_element_parameters")
            .insert({
                element_id: elementId,
                parameter_id: parameterId,
                order: order ?? 0
            });

        if (error) {
            if (!error.message.includes("duplicate")) {
                console.error("Error linking parameter to element:", error);
                return { error: error.message };
            }
        }
    } else {
        const { error } = await supabase
            .from("task_element_parameters")
            .delete()
            .eq("element_id", elementId)
            .eq("parameter_id", parameterId);

        if (error) {
            console.error("Error unlinking parameter from element:", error);
            return { error: error.message };
        }
    }

    revalidatePath("/admin/catalog");
    return { success: true, error: null };
}

// ============================================
// RECIPE CRUD
// ============================================

import {
    TaskRecipeFormData,
    TaskRecipeItemFormData,
    TaskRecipeRatingFormData,
    TaskRecipeView,
    TaskRecipeItem,
} from "./types";

/**
 * Get recipe for a task by current organization
 */
export async function getMyRecipe(taskId: string): Promise<TaskRecipeView | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("task_recipes_view")
        .select("*")
        .eq("task_id", taskId)
        .eq("organization_id", (await supabase.rpc("get_user_org_id")))
        .single();

    if (error) {
        if (error.code === "PGRST116") return null; // Not found
        console.error("Error fetching my recipe:", error);
        return null;
    }

    return data as TaskRecipeView;
}

/**
 * Get public recipes for a task
 */
export async function getPublicRecipes(taskId: string): Promise<TaskRecipeView[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("task_recipes_view")
        .select("*")
        .eq("task_id", taskId)
        .or("is_public.eq.true,is_system.eq.true")
        .order("rating_avg", { ascending: false, nullsFirst: false })
        .order("usage_count", { ascending: false });

    if (error) {
        console.error("Error fetching public recipes:", error);
        return [];
    }

    return data as TaskRecipeView[];
}

/**
 * Get recipe by ID
 */
export async function getRecipeById(recipeId: string): Promise<TaskRecipeView | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("task_recipes_view")
        .select("*")
        .eq("id", recipeId)
        .single();

    if (error) {
        console.error("Error fetching recipe:", error);
        return null;
    }

    return data as TaskRecipeView;
}

/**
 * Create a new recipe for a task
 */
export async function createRecipe(data: TaskRecipeFormData) {
    const supabase = await createClient();

    const orgId = await supabase.rpc("get_user_org_id");

    const { data: result, error } = await supabase
        .from("task_recipes")
        .insert({
            task_id: data.task_id,
            organization_id: orgId,
            is_public: data.is_public,
            is_anonymous: data.is_anonymous,
            region: data.region || null,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating recipe:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/admin/catalog");
    return { success: true, data: result };
}

/**
 * Update recipe visibility
 */
export async function updateRecipeVisibility(
    recipeId: string,
    isPublic: boolean,
    isAnonymous?: boolean
) {
    const supabase = await createClient();

    const updateData: { is_public: boolean; is_anonymous?: boolean } = {
        is_public: isPublic,
    };
    if (isAnonymous !== undefined) {
        updateData.is_anonymous = isAnonymous;
    }

    const { error } = await supabase
        .from("task_recipes")
        .update(updateData)
        .eq("id", recipeId);

    if (error) {
        console.error("Error updating recipe visibility:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/admin/catalog");
    return { success: true };
}

/**
 * Delete recipe (soft delete)
 */
export async function deleteRecipe(recipeId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("task_recipes")
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
        })
        .eq("id", recipeId);

    if (error) {
        console.error("Error deleting recipe:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/admin/catalog");
    return { success: true };
}

// ============================================
// RECIPE ITEMS CRUD
// ============================================

/**
 * Get items for a recipe
 */
export async function getRecipeItems(recipeId: string): Promise<TaskRecipeItem[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("task_recipe_items")
        .select("*")
        .eq("recipe_id", recipeId)
        .order("display_order", { ascending: true });

    if (error) {
        console.error("Error fetching recipe items:", error);
        return [];
    }

    return data as TaskRecipeItem[];
}

/**
 * Add item to recipe
 */
export async function addRecipeItem(data: TaskRecipeItemFormData) {
    const supabase = await createClient();

    const { data: result, error } = await supabase
        .from("task_recipe_items")
        .insert({
            recipe_id: data.recipe_id,
            material_id: data.material_id || null,
            material_name: data.material_name,
            material_category: data.material_category || null,
            quantity: data.quantity,
            unit_id: data.unit_id || null,
            unit_name: data.unit_name || null,
            display_order: data.display_order,
            notes: data.notes || null,
            is_optional: data.is_optional,
        })
        .select()
        .single();

    if (error) {
        console.error("Error adding recipe item:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/admin/catalog");
    return { success: true, data: result };
}

/**
 * Update recipe item
 */
export async function updateRecipeItem(
    itemId: string,
    data: Partial<TaskRecipeItemFormData>
) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("task_recipe_items")
        .update({
            material_id: data.material_id,
            material_name: data.material_name,
            material_category: data.material_category,
            quantity: data.quantity,
            unit_id: data.unit_id,
            unit_name: data.unit_name,
            display_order: data.display_order,
            notes: data.notes,
            is_optional: data.is_optional,
        })
        .eq("id", itemId);

    if (error) {
        console.error("Error updating recipe item:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/admin/catalog");
    return { success: true };
}

/**
 * Delete recipe item
 */
export async function deleteRecipeItem(itemId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("task_recipe_items")
        .delete()
        .eq("id", itemId);

    if (error) {
        console.error("Error deleting recipe item:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/admin/catalog");
    return { success: true };
}

// ============================================
// RATINGS
// ============================================

/**
 * Rate a recipe
 */
export async function rateRecipe(data: TaskRecipeRatingFormData) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: "No autenticado" };
    }

    // Get user's org
    const orgId = await supabase.rpc("get_user_org_id");

    // Get user's internal ID
    const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", user.id)
        .single();

    if (!userData) {
        return { success: false, error: "Usuario no encontrado" };
    }

    // Upsert rating (one per org per recipe)
    const { error } = await supabase
        .from("task_recipe_ratings")
        .upsert(
            {
                recipe_id: data.recipe_id,
                organization_id: orgId,
                user_id: userData.id,
                rating: data.rating,
                comment: data.comment || null,
            },
            {
                onConflict: "recipe_id,organization_id",
            }
        );

    if (error) {
        console.error("Error rating recipe:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/admin/catalog");
    return { success: true };
}

// ============================================
// ADOPTION
// ============================================

/**
 * Adopt a recipe as preferred for a task
 */
export async function adoptRecipe(taskId: string, recipeId: string) {
    const supabase = await createClient();

    const orgId = await supabase.rpc("get_user_org_id");

    // Upsert preference (one per org per task)
    const { error } = await supabase
        .from("organization_recipe_preferences")
        .upsert(
            {
                organization_id: orgId,
                task_id: taskId,
                recipe_id: recipeId,
                adopted_at: new Date().toISOString(),
            },
            {
                onConflict: "organization_id,task_id",
            }
        );

    if (error) {
        console.error("Error adopting recipe:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/admin/catalog");
    return { success: true };
}

/**
 * Get adopted recipe for a task
 */
export async function getAdoptedRecipe(taskId: string): Promise<string | null> {
    const supabase = await createClient();

    const orgId = await supabase.rpc("get_user_org_id");

    const { data, error } = await supabase
        .from("organization_recipe_preferences")
        .select("recipe_id")
        .eq("organization_id", orgId)
        .eq("task_id", taskId)
        .single();

    if (error) {
        if (error.code === "PGRST116") return null;
        console.error("Error fetching adopted recipe:", error);
        return null;
    }

    return data?.recipe_id || null;
}
