"use server";


import { sanitizeError } from "@/lib/error-utils";
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
    const status = (formData.get("status") as string | null) || "draft";

    // Parametric task fields
    const is_parametric = formData.get("is_parametric") === "true";
    const task_action_id = formData.get("task_action_id") as string | null;
    const task_element_id = formData.get("task_element_id") as string | null;
    const task_construction_system_id = formData.get("task_construction_system_id") as string | null;
    const template_id = formData.get("template_id") as string | null;
    const parameter_values_raw = formData.get("parameter_values") as string | null;
    const parameter_values = parameter_values_raw ? JSON.parse(parameter_values_raw) : {};

    if (!name?.trim()) {
        return { error: "El nombre es requerido" };
    }

    if (!unit_id) {
        return { error: "La unidad es requerida" };
    }

    const { data, error } = await supabase
        .schema('catalog').from("tasks")
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
            status,
            is_deleted: false,
            // Parametric fields
            is_parametric,
            task_action_id: task_action_id || null,
            task_element_id: task_element_id || null,
            task_construction_system_id: task_construction_system_id || null,
            template_id: template_id || null,
            parameter_values: is_parametric ? parameter_values : {},
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating task:", error);
        return { error: sanitizeError(error) };
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
    const status = (formData.get("status") as string | null) || null;

    if (!id) {
        return { error: "ID de tarea no proporcionado" };
    }

    if (!name?.trim()) {
        return { error: "El nombre es requerido" };
    }

    let query = supabase
        .schema('catalog').from("tasks")
        .update({
            name: name.trim(),
            custom_name: name.trim(),
            code: code?.trim() || null,
            description: description?.trim() || null,
            unit_id,
            task_division_id: task_division_id || null,
            is_published,
            ...(status ? { status } : {}),
        })
        .eq("id", id);

    // In admin mode, we can edit system tasks and org tasks
    // In normal mode, we can only edit our org's non-system tasks
    if (!isAdminMode) {
        const { activeOrgId } = await getUserOrganizations();
        if (!activeOrgId) {
            return { error: "No hay organización activa" };
        }
        query = query.eq("organization_id", activeOrgId).eq("is_system", false);
    }

    const { data, error } = await query.select().single();

    if (error) {
        console.error("Error updating task:", error);
        return { error: sanitizeError(error) };
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
        .schema('catalog').from("tasks")
        .update(updateData)
        .eq("id", taskId)
        .select()
        .single();

    if (error) {
        console.error("Error updating task organization:", error);
        return { error: sanitizeError(error) };
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
        .schema('catalog').from("tasks")
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
        return { error: sanitizeError(error) };
    }

    revalidatePath("/organization/catalog");
    revalidatePath("/admin/catalog");
    return { success: true, error: null };
}

// ============================================
// UPDATE TASK STATUS (quick change from list)
// ============================================
export async function updateTaskStatus(
    taskId: string,
    status: "draft" | "active" | "archived",
    isAdminMode: boolean = false
) {
    const supabase = isAdminMode ? createServiceClient() : await createClient();

    let query = supabase
        .schema('catalog').from("tasks")
        .update({ status })
        .eq("id", taskId);

    if (!isAdminMode) {
        const { activeOrgId } = await getUserOrganizations();
        if (!activeOrgId) return { error: "No hay organización activa" };
        query = query.eq("organization_id", activeOrgId).eq("is_system", false);
    }

    const { error } = await query;
    if (error) {
        console.error("Error updating task status:", error);
        return { error: sanitizeError(error) };
    }

    revalidatePath("/organization/catalog");
    revalidatePath("/admin/catalog");
    return { success: true, error: null };
}

// ============================================
// DELETE TASKS BULK (soft delete multiple)
// ============================================
export async function deleteTasksBulk(ids: string[], isAdminMode: boolean = false) {
    if (ids.length === 0) return { success: true, deletedCount: 0, error: null };

    const supabase = isAdminMode ? createServiceClient() : await createClient();

    let query = supabase
        .schema('catalog').from("tasks")
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
        })
        .in("id", ids);

    // In admin mode, can delete any task type (system or org-owned)
    // In normal mode, only delete our org's non-system tasks
    if (!isAdminMode) {
        const { activeOrgId } = await getUserOrganizations();
        if (!activeOrgId) {
            return { error: "No hay organización activa" };
        }
        query = query.eq("organization_id", activeOrgId).eq("is_system", false);
    }

    const { error } = await query;

    if (error) {
        console.error("Error bulk deleting tasks:", error);
        return { error: sanitizeError(error) };
    }

    revalidatePath("/organization/catalog");
    revalidatePath("/admin/catalog");
    return { success: true, deletedCount: ids.length, error: null };
}

// ============================================
// UPDATE TASKS BULK (edit common fields)
// ============================================
export async function updateTasksBulk(
    ids: string[],
    updates: { task_division_id?: string | null; unit_id?: string | null },
    isAdminMode: boolean = false
) {
    if (ids.length === 0) return { success: true, updatedCount: 0, error: null };

    // Only include fields that were explicitly provided
    const payload: Record<string, unknown> = {};
    if ("task_division_id" in updates) payload.task_division_id = updates.task_division_id;
    if ("unit_id" in updates) payload.unit_id = updates.unit_id;

    if (Object.keys(payload).length === 0) {
        return { error: "No se seleccionaron campos para actualizar" };
    }

    const supabase = isAdminMode ? createServiceClient() : await createClient();

    let query = supabase
        .schema('catalog').from("tasks")
        .update(payload)
        .in("id", ids);

    // In admin mode, can update any task type (system or org-owned)
    // In normal mode, only update our org's non-system tasks
    if (!isAdminMode) {
        const { activeOrgId } = await getUserOrganizations();
        if (!activeOrgId) {
            return { error: "No hay organización activa" };
        }
        query = query.eq("organization_id", activeOrgId).eq("is_system", false);
    }

    const { error } = await query;

    if (error) {
        console.error("Error bulk updating tasks:", error);
        return { error: sanitizeError(error) };
    }

    revalidatePath("/organization/catalog");
    revalidatePath("/admin/catalog");
    return { success: true, updatedCount: ids.length, error: null };
}



// ============================================================================
// TASK DIVISIONS CRUD (Admin + Org Users)
// ============================================================================

/**
 * Create a new task division
 * - Admin mode: creates system division (is_system=true, organization_id=null)
 * - User mode: creates org division (is_system=false, organization_id=orgId)
 */
export async function createTaskDivision(formData: FormData) {
    const supabase = await createClient();
    const isAdminMode = formData.get("is_admin_mode") === "true";

    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const code = formData.get("code") as string | null;
    const parent_id = formData.get("parent_id") as string | null;

    if (!name?.trim()) {
        return { error: "El nombre es requerido" };
    }

    // Determine ownership
    let organization_id: string | null = null;
    let is_system = true;

    if (!isAdminMode) {
        const { activeOrgId } = await getUserOrganizations();
        if (!activeOrgId) {
            return { error: "No hay organización activa" };
        }
        organization_id = activeOrgId;
        is_system = false;
    }

    // Calculate next order position among siblings at the same level
    let nextOrder = 1;
    let siblingsQuery = supabase
        .schema('catalog').from("task_divisions")
        .select("order")
        .is("parent_id", parent_id || null)
        .order("order", { ascending: false, nullsFirst: false })
        .limit(1);

    // Handle null organization_id (system/admin mode)
    if (organization_id) {
        siblingsQuery = siblingsQuery.eq("organization_id", organization_id);
    } else {
        siblingsQuery = siblingsQuery.is("organization_id", null);
    }

    const { data: siblings } = await siblingsQuery;

    if (siblings && siblings.length > 0 && siblings[0].order != null) {
        nextOrder = siblings[0].order + 1;
    } else {
        // Count existing siblings to determine position
        let countQuery = supabase
            .schema('catalog').from("task_divisions")
            .select("id", { count: "exact", head: true })
            .is("parent_id", parent_id || null);

        if (organization_id) {
            countQuery = countQuery.eq("organization_id", organization_id);
        } else {
            countQuery = countQuery.is("organization_id", null);
        }

        const { count } = await countQuery;
        nextOrder = (count ?? 0) + 1;
    }

    const { data, error } = await supabase
        .schema('catalog').from("task_divisions")
        .insert({
            name: name.trim(),
            description: description?.trim() || null,
            code: code?.trim() || null,
            order: nextOrder,
            parent_id: parent_id || null,
            organization_id,
            is_system,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating task division:", error);
        return { error: sanitizeError(error) };
    }

    revalidatePath("/admin/catalog");
    revalidatePath("/organization/catalog");
    return { data, error: null };
}

/**
 * Update a task division
 * RLS handles permission checks (admin for system, org member for org divisions)
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
        .schema('catalog').from("task_divisions")
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
        return { error: sanitizeError(error) };
    }

    revalidatePath("/admin/catalog");
    revalidatePath("/organization/catalog");
    return { data, error: null };
}

/**
 * Delete a task division with optional replacement or cascade delete children
 * If replacementId is provided, all tasks are reassigned before deletion
 * If deleteChildren is true, all descendant divisions are also soft-deleted
 */
export async function deleteTaskDivision(
    divisionId: string,
    replacementId: string | null = null,
    deleteChildren: boolean = false
) {
    const supabase = await createClient();

    // Collect all division IDs to delete (self + descendants if deleteChildren)
    let idsToDelete = [divisionId];

    if (deleteChildren) {
        // Recursively find all descendant divisions
        const collectDescendants = async (parentIds: string[]): Promise<string[]> => {
            const { data: children } = await supabase
                .schema('catalog').from("task_divisions")
                .select("id")
                .in("parent_id", parentIds)
                .eq("is_deleted", false);

            if (!children || children.length === 0) return [];

            const childIds = children.map(c => c.id);
            const deeperIds = await collectDescendants(childIds);
            return [...childIds, ...deeperIds];
        };

        const descendantIds = await collectDescendants([divisionId]);
        idsToDelete = [divisionId, ...descendantIds];
    }

    // Handle task reassignment for all divisions being deleted
    for (const id of idsToDelete) {
        if (replacementId && !deleteChildren) {
            // Only reassign for the main division when replacing
            const { error: reassignError } = await supabase
                .schema('catalog').from("tasks")
                .update({ task_division_id: replacementId })
                .eq("task_division_id", id);

            if (reassignError) {
                console.error("Error reassigning tasks:", reassignError);
                return { error: sanitizeError(reassignError) };
            }
        } else {
            // Set tasks to null division
            const { error: nullifyError } = await supabase
                .schema('catalog').from("tasks")
                .update({ task_division_id: null })
                .eq("task_division_id", id);

            if (nullifyError) {
                console.error("Error nullifying task divisions:", nullifyError);
                return { error: sanitizeError(nullifyError) };
            }
        }
    }

    // Also orphan any child divisions that aren't being deleted
    if (!deleteChildren) {
        const { error: orphanError } = await supabase
            .schema('catalog').from("task_divisions")
            .update({ parent_id: null })
            .eq("parent_id", divisionId)
            .eq("is_deleted", false);

        if (orphanError) {
            console.error("Error orphaning child divisions:", orphanError);
            return { error: sanitizeError(orphanError) };
        }
    }

    // Soft delete all targeted divisions
    const { error } = await supabase
        .schema('catalog').from("task_divisions")
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
        })
        .in("id", idsToDelete);

    if (error) {
        console.error("Error deleting task division:", error);
        return { error: sanitizeError(error) };
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
            .schema('catalog').from("task_divisions")
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
    const is_required = formData.get("is_required") === "true";
    const expression_template = formData.get("expression_template") as string | null;

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
        .schema('catalog').from("task_parameters")
        .insert({
            slug: slug.trim().toLowerCase().replace(/\s+/g, '_'),
            label: label.trim(),
            type,
            description: description?.trim() || null,
            is_required,
            expression_template: expression_template?.trim() || null,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating task parameter:", error);
        if (error.code === "23505") {
            return { error: "Ya existe un parámetro con este slug" };
        }
        return { error: sanitizeError(error) };
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
    const is_required = formData.get("is_required") === "true";
    const expression_template = formData.get("expression_template") as string | null;

    if (!slug?.trim()) {
        return { error: "El slug es requerido" };
    }

    if (!label?.trim()) {
        return { error: "El nombre es requerido" };
    }

    const { data, error } = await supabase
        .schema('catalog').from("task_parameters")
        .update({
            slug: slug.trim().toLowerCase().replace(/\s+/g, '_'),
            label: label.trim(),
            type,
            description: description?.trim() || null,
            is_required,
            expression_template: expression_template?.trim() || null,
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating task parameter:", error);
        if (error.code === "23505") {
            return { error: "Ya existe un parámetro con este slug" };
        }
        return { error: sanitizeError(error) };
    }

    revalidatePath("/admin/catalog");
    return { success: true, data, error: null };
}

export async function deleteTaskParameter(id: string) {
    const supabase = await createClient();

    // Soft delete the parameter
    const { error } = await supabase
        .schema('catalog').from("task_parameters")
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
        })
        .eq("id", id);

    if (error) {
        console.error("Error deleting task parameter:", error);
        return { error: sanitizeError(error) };
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
        .schema('catalog').from("task_parameter_options")
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
        return { error: sanitizeError(error) };
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
        .schema('catalog').from("task_parameter_options")
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
        return { error: sanitizeError(error) };
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
        .schema('catalog').from("task_parameter_options")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting parameter option:", error);
        return { error: sanitizeError(error) };
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
    const expression_template = formData.get("expression_template") as string | null;

    if (!name?.trim()) {
        return { error: "El nombre es requerido" };
    }

    const { data, error } = await supabase
        .schema('catalog').from("task_elements")
        .insert({
            name: name.trim(),
            code: code?.trim().toUpperCase() || null,
            description: description?.trim() || null,
            default_unit_id: default_unit_id || null,
            expression_template: expression_template?.trim() || null,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating task element:", error);
        if (error.code === "23505") {
            return { error: "Ya existe un elemento con este código" };
        }
        return { error: sanitizeError(error) };
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
    const expression_template = formData.get("expression_template") as string | null;

    if (!id) {
        return { error: "ID de elemento no proporcionado" };
    }

    if (!name?.trim()) {
        return { error: "El nombre es requerido" };
    }

    const { data, error } = await supabase
        .schema('catalog').from("task_elements")
        .update({
            name: name.trim(),
            code: code?.trim().toUpperCase() || null,
            description: description?.trim() || null,
            default_unit_id: default_unit_id || null,
            expression_template: expression_template?.trim() || null,
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating task element:", error);
        if (error.code === "23505") {
            return { error: "Ya existe un elemento con este código" };
        }
        return { error: sanitizeError(error) };
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
        .schema('catalog').from("task_elements")
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
        })
        .eq("id", id);

    if (error) {
        console.error("Error deleting task element:", error);
        return { error: sanitizeError(error) };
    }

    revalidatePath("/admin/catalog");
    return { success: true, error: null };
}

// ============================================
// DIVISION COMPATIBILITY - ELEMENTS
// ============================================
/**
 * @deprecated Table task_division_elements was removed from the DB.
 */
export async function toggleDivisionElement(
    divisionId: string,
    elementId: string,
    shouldLink: boolean
) {
    return { success: false, error: 'task_division_elements table no longer exists' };
}

// ============================================
// DIVISION COMPATIBILITY - ACTIONS
// ============================================
/**
 * @deprecated Table task_division_actions was removed from the DB.
 */
export async function toggleDivisionAction(
    divisionId: string,
    actionId: string,
    shouldLink: boolean
) {
    return { success: false, error: 'task_division_actions table no longer exists' };
}

// ============================================
// ACTION COMPATIBILITY - ELEMENTS
// ============================================
export async function toggleActionElement(
    actionId: string,
    elementId: string,
    shouldLink: boolean
) {
    const supabase = await createClient();

    if (shouldLink) {
        const { error } = await supabase
            .schema('catalog').from("task_element_actions")
            .insert({ action_id: actionId, element_id: elementId });

        if (error) {
            if (!sanitizeError(error).includes("duplicate")) {
                console.error("Error linking element to action:", error);
                return { error: sanitizeError(error) };
            }
        }
    } else {
        const { error } = await supabase
            .schema('catalog').from("task_element_actions")
            .delete()
            .eq("action_id", actionId)
            .eq("element_id", elementId);

        if (error) {
            console.error("Error unlinking element from action:", error);
            return { error: sanitizeError(error) };
        }
    }

    revalidatePath("/admin/catalog");
    return { success: true, error: null };
}

// ============================================
// ELEMENT COMPATIBILITY - PARAMETERS
// ============================================
/**
 * @deprecated Table task_element_parameters was removed from the DB.
 */
export async function toggleElementParameter(
    elementId: string,
    parameterId: string,
    shouldLink: boolean,
    order?: number
) {
    return { success: false, error: 'task_element_parameters table no longer exists' };
}

// ============================================
// RECIPE CRUD
// ============================================

import {
    TaskRecipeFormData,
    TaskRecipeMaterialFormData,
    TaskRecipeLaborFormData,
    TaskRecipeRatingFormData,
    TaskRecipeView,
    TaskRecipeMaterial,
    TaskRecipeLabor,
    RecipeResources,
    TaskRecipeExternalService,
    TaskRecipeExternalServiceFormData,
} from "./types";

/**
 * Get ALL recipes for a task by current organization
 */
export async function getMyRecipes(taskId: string): Promise<TaskRecipeView[]> {
    const supabase = await createClient();
    const { activeOrgId } = await getUserOrganizations();

    const { data, error } = await supabase
        .schema('catalog').from("task_recipes_view")
        .select("*")
        .eq("task_id", taskId)
        .eq("organization_id", activeOrgId)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Error fetching my recipes:", error);
        return [];
    }

    return data as TaskRecipeView[];
}

/**
 * Get public recipes for a task
 */
export async function getPublicRecipes(taskId: string): Promise<TaskRecipeView[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('catalog').from("task_recipes_view")
        .select("*")
        .eq("task_id", taskId)
        .eq("is_public", true)
        .order("rating_avg", { ascending: false, nullsFirst: false })
        .order("usage_count", { ascending: false });

    if (error) {
        console.error("Error fetching public recipes:", error);
        return [];
    }

    return data as TaskRecipeView[];
}

/**
 * Get ALL recipes visible for a task:
 * - My org's recipes
 * - Public recipes from other orgs
 * Returns deduped array with own recipes first
 */
export async function getTaskRecipes(taskId: string): Promise<TaskRecipeView[]> {
    const [myRecipes, publicRecipes] = await Promise.all([
        getMyRecipes(taskId),
        getPublicRecipes(taskId),
    ]);

    // Dedupe: my recipes might also be public
    const myRecipeIds = new Set(myRecipes.map(r => r.id));
    const otherPublic = publicRecipes.filter(r => !myRecipeIds.has(r.id));

    return [...myRecipes, ...otherPublic];
}

/**
 * Get recipe by ID
 */
export async function getRecipeById(recipeId: string): Promise<TaskRecipeView | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('catalog').from("task_recipes_view")
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
    const { activeOrgId } = await getUserOrganizations();

    const { data: result, error } = await supabase
        .schema('catalog').from("task_recipes")
        .insert({
            task_id: data.task_id,
            organization_id: activeOrgId,
            name: data.name,
            is_public: data.is_public,
            region: data.region || null,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating recipe:", error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath("/admin/catalog");
    return { success: true, data: result };
}

/**
 * Update recipe (name, region, is_public)
 */
export async function updateRecipe(
    recipeId: string,
    data: Partial<Pick<TaskRecipeFormData, "name" | "is_public" | "region">>
) {
    const supabase = await createClient();

    const { error } = await supabase
        .schema('catalog').from("task_recipes")
        .update({
            ...(data.name !== undefined && { name: data.name }),
            ...(data.is_public !== undefined && { is_public: data.is_public }),
            ...(data.region !== undefined && { region: data.region }),
        })
        .eq("id", recipeId);

    if (error) {
        console.error("Error updating recipe:", error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath("/admin/catalog");
    return { success: true };
}

/**
 * Update recipe visibility
 */
export async function updateRecipeVisibility(
    recipeId: string,
    isPublic: boolean
) {
    const supabase = await createClient();

    const { error } = await supabase
        .schema('catalog').from("task_recipes")
        .update({ is_public: isPublic })
        .eq("id", recipeId);

    if (error) {
        console.error("Error updating recipe visibility:", error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath("/admin/catalog");
    return { success: true };
}

/**
 * Update recipe status (draft | active | archived) — quick change from list
 */
export async function updateRecipeStatus(
    recipeId: string,
    status: "draft" | "active" | "archived"
) {
    const supabase = await createClient();

    const { error } = await supabase
        .schema('catalog').from("task_recipes")
        .update({ status })
        .eq("id", recipeId);

    if (error) {
        console.error("Error updating recipe status:", error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath("/admin/catalog");
    revalidatePath("/organization/catalog");
    return { success: true };
}

/**
 * Delete recipe (soft delete)
 */
export async function deleteRecipe(recipeId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .schema('catalog').from("task_recipes")
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
        })
        .eq("id", recipeId);

    if (error) {
        console.error("Error deleting recipe:", error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath("/admin/catalog");
    return { success: true };
}

// ============================================
// RECIPE MATERIALS CRUD
// ============================================

/**
 * Get materials for a recipe (with joined names)
 */
export async function getRecipeMaterials(recipeId: string): Promise<TaskRecipeMaterial[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('catalog').from("task_recipe_materials")
        .select(`
            *,
            materials!inner(name, code),
            units(name, symbol)
        `)
        .eq("recipe_id", recipeId)
        .eq("is_deleted", false);

    if (error) {
        console.error("Error fetching recipe materials:", error);
        return [];
    }

    return (data || []).map((row: any) => ({
        ...row,
        material_name: row.materials?.name,
        material_code: row.materials?.code,
        unit_name: row.units?.name,
        unit_symbol: row.units?.symbol,
        materials: undefined,
        units: undefined,
    })).sort((a: any, b: any) => (a.material_name || "").localeCompare(b.material_name || "")) as TaskRecipeMaterial[];
}

/**
 * Add material to recipe
 */
export async function addRecipeMaterial(data: TaskRecipeMaterialFormData) {
    const supabase = await createClient();
    const { activeOrgId } = await getUserOrganizations();

    const { data: result, error } = await supabase
        .schema('catalog').from("task_recipe_materials")
        .insert({
            recipe_id: data.recipe_id,
            material_id: data.material_id,
            quantity: data.quantity,
            waste_percentage: data.waste_percentage ?? 0,
            unit_id: data.unit_id || null,
            notes: data.notes || null,

            organization_id: activeOrgId,
        })
        .select()
        .single();

    if (error) {
        console.error("Error adding recipe material:", error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath("/admin/catalog");
    return { success: true, data: result };
}

/**
 * Update recipe material
 */
export async function updateRecipeMaterial(
    itemId: string,
    data: Partial<TaskRecipeMaterialFormData>
) {
    const supabase = await createClient();

    const { error } = await supabase
        .schema('catalog').from("task_recipe_materials")
        .update({
            material_id: data.material_id,
            quantity: data.quantity,
            waste_percentage: data.waste_percentage,
            unit_id: data.unit_id,
            notes: data.notes,

        })
        .eq("id", itemId);

    if (error) {
        console.error("Error updating recipe material:", error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath("/admin/catalog");
    return { success: true };
}

/**
 * Delete recipe material
 */
export async function deleteRecipeMaterial(itemId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .schema('catalog').from("task_recipe_materials")
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
        })
        .eq("id", itemId);

    if (error) {
        console.error("Error deleting recipe material:", error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath("/admin/catalog");
    return { success: true };
}

// ============================================
// RECIPE LABOR CRUD
// ============================================

/**
 * Get labor items for a recipe (with joined names)
 */
export async function getRecipeLabor(recipeId: string): Promise<TaskRecipeLabor[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('catalog').from("task_recipe_labor")
        .select(`
            *,
            labor_types!inner(name),
            units(name, symbol)
        `)
        .eq("recipe_id", recipeId)
        .eq("is_deleted", false);

    if (error) {
        console.error("Error fetching recipe labor:", error);
        return [];
    }

    return (data || []).map((row: any) => ({
        ...row,
        labor_name: row.labor_types?.name,
        unit_name: row.units?.name,
        unit_symbol: row.units?.symbol,
        labor_types: undefined,
        units: undefined,
    })).sort((a: any, b: any) => (a.labor_name || "").localeCompare(b.labor_name || "")) as TaskRecipeLabor[];
}

/**
 * Add labor to recipe
 */
export async function addRecipeLabor(data: TaskRecipeLaborFormData) {
    const supabase = await createClient();
    const { activeOrgId } = await getUserOrganizations();

    const { data: result, error } = await supabase
        .schema('catalog').from("task_recipe_labor")
        .insert({
            recipe_id: data.recipe_id,
            labor_type_id: data.labor_type_id,
            quantity: data.quantity,
            unit_id: data.unit_id || null,
            notes: data.notes || null,

            organization_id: activeOrgId,
        })
        .select()
        .single();

    if (error) {
        console.error("Error adding recipe labor:", error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath("/admin/catalog");
    return { success: true, data: result };
}

/**
 * Update recipe labor
 */
export async function updateRecipeLabor(
    itemId: string,
    data: Partial<TaskRecipeLaborFormData>
) {
    const supabase = await createClient();

    const { error } = await supabase
        .schema('catalog').from("task_recipe_labor")
        .update({
            labor_type_id: data.labor_type_id,
            quantity: data.quantity,
            unit_id: data.unit_id,
            notes: data.notes,

        })
        .eq("id", itemId);

    if (error) {
        console.error("Error updating recipe labor:", error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath("/admin/catalog");
    return { success: true };
}

/**
 * Delete recipe labor
 */
export async function deleteRecipeLabor(itemId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .schema('catalog').from("task_recipe_labor")
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
        })
        .eq("id", itemId);

    if (error) {
        console.error("Error deleting recipe labor:", error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath("/admin/catalog");
    return { success: true };
}

// ============================================
// RECIPE EXTERNAL SERVICES CRUD
// ============================================

/**
 * Get external services for a recipe.
 *
 * NOTA: contacts, currencies y external_service_prices están en el schema `public`.
 * PostgREST no resuelve cross-schema FK joins cuando se usa .schema('catalog'),
 * por lo que se fetchean con queries separadas y se joinean en JS.
 */
export async function getRecipeExternalServices(
    recipeId: string
): Promise<TaskRecipeExternalService[]> {
    const supabase = await createClient();

    // 1. Fetch the external services (catalog schema — solo units tiene FK dentro de catalog)
    const { data, error } = await supabase
        .schema('catalog').from("task_recipe_external_services")
        .select(`*, units(name, symbol)`)
        .eq("recipe_id", recipeId)
        .eq("is_deleted", false);

    if (error) {
        console.error("Error fetching recipe external services:", JSON.stringify(error, null, 2));
        return [];
    }

    const rows = data || [];
    if (rows.length === 0) return [];

    // 2. Coleccionar IDs únicos para las queries separadas
    const serviceIds = rows.map((r: any) => r.id);
    const currencyIds = [...new Set(rows.map((r: any) => r.currency_id).filter(Boolean))];
    const contactIds = [...new Set(rows.map((r: any) => r.contact_id).filter(Boolean))];

    // 3. Fetch desde public schema en paralelo
    const [pricesRes, currenciesRes, contactsRes] = await Promise.all([
        supabase
            .schema('catalog').from("external_service_prices")
            .select("recipe_external_service_id, valid_from")
            .in("recipe_external_service_id", serviceIds),
        currencyIds.length > 0
            ? supabase.schema("finance").from("currencies").select("id, symbol").in("id", currencyIds)
            : Promise.resolve({ data: [] }),
        contactIds.length > 0
            ? supabase.schema("contacts").from("contacts").select("id, full_name").in("id", contactIds)
            : Promise.resolve({ data: [] }),
    ]);

    // 4. Construir mapas para Join en JS
    const pricesByService: Record<string, string[]> = {};
    for (const p of (pricesRes.data || []) as any[]) {
        if (!pricesByService[p.recipe_external_service_id]) {
            pricesByService[p.recipe_external_service_id] = [];
        }
        pricesByService[p.recipe_external_service_id].push(p.valid_from);
    }

    const currencyMap: Record<string, string> = Object.fromEntries(
        (currenciesRes.data || []).map((c: any) => [c.id, c.symbol])
    );
    const contactMap: Record<string, string> = Object.fromEntries(
        (contactsRes.data || []).map((c: any) => [c.id, c.full_name])
    );

    // 5. Mapear y enriquecer cada row
    return rows.map((row: any) => {
        const prices = (pricesByService[row.id] || []).sort((a, b) => b.localeCompare(a));
        return {
            ...row,
            contact_name: contactMap[row.contact_id] || null,
            unit_name: row.units?.name || null,
            unit_symbol: row.units?.symbol || null,
            currency_symbol: currencyMap[row.currency_id] || null,
            price_valid_from: prices[0] || null,
            units: undefined,
        };
    }).sort((a: any, b: any) => (a.name || "").localeCompare(b.name || "")) as TaskRecipeExternalService[];
}


/**
 * Add external service to recipe
 */
export async function addRecipeExternalService(
    data: TaskRecipeExternalServiceFormData
) {
    const supabase = await createClient();
    const { activeOrgId } = await getUserOrganizations();

    const { data: result, error } = await supabase
        .schema('catalog').from("task_recipe_external_services")
        .insert({
            recipe_id: data.recipe_id,
            name: data.name,
            unit_id: data.unit_id || null,
            unit_price: data.unit_price,
            currency_id: data.currency_id,
            contact_id: data.contact_id || null,
            includes_materials: data.includes_materials ?? false,
            notes: data.notes || null,
            organization_id: activeOrgId,
        })
        .select()
        .single();

    if (error) {
        console.error("Error adding recipe external service:", error);
        return { success: false, error: sanitizeError(error) };
    }

    // Insert initial price in external_service_prices (aligned with material_prices/labor_type_prices pattern)
    if (result && data.unit_price != null && data.unit_price > 0) {
        const { error: priceError } = await supabase
            .schema('catalog').from("external_service_prices")
            .insert({
                recipe_external_service_id: result.id,
                organization_id: activeOrgId,
                currency_id: data.currency_id,
                unit_price: data.unit_price,
                // valid_from defaults to CURRENT_DATE in DB
            });

        if (priceError) {
            console.error("Error inserting external service price:", priceError);
            // Non-blocking: the service was created, price record failed
        }
    }

    revalidatePath("/admin/catalog");
    return { success: true, data: result };
}

/**
 * Update recipe external service
 */
export async function updateRecipeExternalService(
    itemId: string,
    data: Partial<TaskRecipeExternalServiceFormData>
) {
    const supabase = await createClient();

    const { error } = await supabase
        .schema('catalog').from("task_recipe_external_services")
        .update({
            name: data.name,
            unit_id: data.unit_id,
            unit_price: data.unit_price,
            currency_id: data.currency_id,
            contact_id: data.contact_id,
            includes_materials: data.includes_materials,
            notes: data.notes,
        })
        .eq("id", itemId);

    if (error) {
        console.error("Error updating recipe external service:", error);
        return { success: false, error: sanitizeError(error) };
    }

    // If price changed, insert new price record in external_service_prices
    if (data.unit_price != null && data.unit_price > 0) {
        const { activeOrgId } = await getUserOrganizations();

        // Get current currency_id from the service record if not provided
        let currencyId = data.currency_id;
        if (!currencyId) {
            const { data: current } = await supabase
                .schema('catalog').from("task_recipe_external_services")
                .select("currency_id")
                .eq("id", itemId)
                .single();
            currencyId = current?.currency_id;
        }

        if (currencyId) {
            // Close any existing open price record
            await supabase
                .schema('catalog').from("external_service_prices")
                .update({ valid_to: new Date().toISOString().split("T")[0] })
                .eq("recipe_external_service_id", itemId)
                .is("valid_to", null);

            // Insert new price record with current date
            const { error: priceError } = await supabase
                .schema('catalog').from("external_service_prices")
                .insert({
                    recipe_external_service_id: itemId,
                    organization_id: activeOrgId,
                    currency_id: currencyId,
                    unit_price: data.unit_price,
                    // valid_from defaults to CURRENT_DATE in DB
                });

            if (priceError) {
                console.error("Error inserting updated external service price:", priceError);
            }
        }
    }

    revalidatePath("/admin/catalog");
    return { success: true };
}

/**
 * Delete recipe external service (soft delete)
 */
export async function deleteRecipeExternalService(itemId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .schema('catalog').from("task_recipe_external_services")
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
        })
        .eq("id", itemId);

    if (error) {
        console.error("Error deleting recipe external service:", error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath("/admin/catalog");
    return { success: true };
}

/**
 * Soft-delete ALL materials from a recipe (batch)
 * Used when adding an external service with includes_materials=true
 */
export async function removeAllRecipeMaterials(recipeId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .schema('catalog').from("task_recipe_materials")
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
        })
        .eq("recipe_id", recipeId)
        .eq("is_deleted", false);

    if (error) {
        console.error("Error removing all recipe materials:", error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath("/admin/catalog");
    return { success: true };
}

/**
 * Soft-delete ALL labor from a recipe (batch)
 * Used when adding an external service that replaces internal labor
 */
export async function removeAllRecipeLabor(recipeId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .schema('catalog').from("task_recipe_labor")
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
        })
        .eq("recipe_id", recipeId)
        .eq("is_deleted", false);

    if (error) {
        console.error("Error removing all recipe labor:", error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath("/admin/catalog");
    return { success: true };
}

// ============================================
// RECIPE RESOURCES (Combined query)
// ============================================

/**
 * Get all resources (materials + labor + external services) for a recipe
 */
export async function getRecipeResources(recipeId: string): Promise<RecipeResources> {
    const [materials, labor, externalServices] = await Promise.all([
        getRecipeMaterials(recipeId),
        getRecipeLabor(recipeId),
        getRecipeExternalServices(recipeId),
    ]);
    return { materials, labor, externalServices };
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
    const { activeOrgId } = await getUserOrganizations();

    // Get user's internal ID
    const { data: userData } = await supabase
        .schema('iam').from("users")
        .select("id")
        .eq("auth_id", user.id)
        .single();

    if (!userData) {
        return { success: false, error: "Usuario no encontrado" };
    }

    // Upsert rating (one per org per recipe)
    const { error } = await supabase
        .schema('catalog').from("task_recipe_ratings")
        .upsert(
            {
                recipe_id: data.recipe_id,
                organization_id: activeOrgId,
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
        return { success: false, error: sanitizeError(error) };
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
    const { activeOrgId } = await getUserOrganizations();

    // Upsert preference (one per org per task)
    const { error } = await supabase
        .schema('iam').from("organization_recipe_preferences")
        .upsert(
            {
                organization_id: activeOrgId,
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
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath("/admin/catalog");
    return { success: true };
}

/**
 * Get adopted recipe for a task
 */
export async function getAdoptedRecipe(taskId: string): Promise<string | null> {
    const supabase = await createClient();
    const { activeOrgId } = await getUserOrganizations();

    const { data, error } = await supabase
        .schema('iam').from("organization_recipe_preferences")
        .select("recipe_id")
        .eq("organization_id", activeOrgId)
        .eq("task_id", taskId)
        .single();

    if (error) {
        if (error.code === "PGRST116") return null;
        console.error("Error fetching adopted recipe:", error);
        return null;
    }

    return data?.recipe_id || null;
}

// ============================================
// PARAMETRIC WIZARD — Server-side data loading
// ============================================

/**
 * Get actions compatible with a specific element (server action)
 * Replaces client-side createClient() in the parametric form
 */
export async function getCompatibleActionsForElementAction(elementId: string) {
    try {
        const supabase = await createClient();

        const { data: actionLinks } = await supabase
            .schema('catalog').from('task_element_actions')
            .select('action_id')
            .eq('element_id', elementId);

        if (actionLinks && actionLinks.length > 0) {
            const actionIds = actionLinks.map(l => l.action_id);
            const { data: actionsData } = await supabase
                .schema('catalog').from('task_actions')
                .select('*')
                .in('id', actionIds)
                .order('name', { ascending: true });

            return { data: actionsData || [], error: null };
        } else {
            // If no links, show all actions
            const { data: allActions } = await supabase
                .schema('catalog').from('task_actions')
                .select('*')
                .order('name', { ascending: true });

            return { data: allActions || [], error: null };
        }
    } catch (error) {
        return { data: [], error: sanitizeError(error) };
    }
}

/**
 * @deprecated Table task_element_parameters was removed from the DB.
 * Parameters now belong to construction systems, not elements.
 */
export async function getElementParametersAction(elementId: string) {
    return { data: [], error: null };
}

/**
 * Check if a task with the given code already exists (server action)
 * Replaces client-side createClient() in the parametric form
 */
export async function checkDuplicateTaskAction(code: string) {
    try {
        const supabase = await createClient();

        const { data } = await supabase
            .schema('catalog').from('tasks')
            .select('id, name, code')
            .eq('code', code)
            .eq('is_deleted', false)
            .limit(1);

        return { duplicate: data && data.length > 0 ? data[0] : null, error: null };
    } catch (error) {
        return { duplicate: null, error: sanitizeError(error) };
    }
}

// ============================================
// TASK CONSTRUCTION SYSTEMS CRUD (Admin Only)
// ============================================

/**
 * Create a new construction system (admin only)
 */
export async function createConstructionSystem(formData: FormData) {
    const supabase = await createClient();

    const name = formData.get("name") as string;
    const code = formData.get("code") as string | null;
    const description = formData.get("description") as string | null;
    const category = formData.get("category") as string | null;
    const expression_template = formData.get("expression_template") as string | null;

    if (!name?.trim()) {
        return { error: "El nombre es requerido" };
    }

    // Generate slug from name
    const slug = name.trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");

    const { data, error } = await supabase
        .schema('catalog').from('task_construction_systems')
        .insert({
            name: name.trim(),
            slug,
            code: code?.trim().toUpperCase() || null,
            description: description?.trim() || null,
            category: category?.trim() || null,
            expression_template: expression_template?.trim() || null,
            is_deleted: false,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating construction system:", error);
        if (error.code === "23505") {
            return { error: "Ya existe un sistema con ese nombre o código" };
        }
        return { error: sanitizeError(error) };
    }

    revalidatePath("/admin/catalog");
    return { data, error: null };
}

/**
 * Update a construction system (admin only)
 */
export async function updateConstructionSystem(formData: FormData) {
    const supabase = await createClient();

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const code = formData.get("code") as string | null;
    const description = formData.get("description") as string | null;
    const category = formData.get("category") as string | null;
    const expression_template = formData.get("expression_template") as string | null;

    if (!id) {
        return { error: "ID no proporcionado" };
    }

    if (!name?.trim()) {
        return { error: "El nombre es requerido" };
    }

    const { data, error } = await supabase
        .schema('catalog').from('task_construction_systems')
        .update({
            name: name.trim(),
            code: code?.trim().toUpperCase() || null,
            description: description?.trim() || null,
            category: category?.trim() || null,
            expression_template: expression_template?.trim() || null,
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating construction system:", error);
        if (error.code === "23505") {
            return { error: "Ya existe un sistema con ese nombre o código" };
        }
        return { error: sanitizeError(error) };
    }

    revalidatePath("/admin/catalog");
    return { data, error: null };
}

/**
 * Soft delete a construction system (admin only)
 */
export async function deleteConstructionSystem(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .schema('catalog').from('task_construction_systems')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
        })
        .eq("id", id);

    if (error) {
        console.error("Error deleting construction system:", error);
        return { error: sanitizeError(error) };
    }

    revalidatePath("/admin/catalog");
    return { success: true, error: null };
}

/**
 * Toggle a parameter link for a construction system
 * Uses catalog.task_system_parameters
 */
export async function toggleSystemParameter(
    systemId: string,
    parameterId: string,
    shouldLink: boolean
) {
    const supabase = await createClient();

    if (shouldLink) {
        const { error } = await supabase
            .schema('catalog').from('task_system_parameters')
            .insert({ system_id: systemId, parameter_id: parameterId });

        if (error) {
            if (!sanitizeError(error).includes("duplicate")) {
                console.error("Error linking parameter to system:", error);
                return { error: sanitizeError(error) };
            }
        }
    } else {
        const { error } = await supabase
            .schema('catalog').from('task_system_parameters')
            .delete()
            .eq("system_id", systemId)
            .eq("parameter_id", parameterId);

        if (error) {
            console.error("Error unlinking parameter from system:", error);
            return { error: sanitizeError(error) };
        }
    }

    revalidatePath("/admin/catalog");
    return { success: true, error: null };
}

/**
 * Toggle a system link for an element
 * Uses catalog.task_element_systems
 */
export async function toggleElementSystem(
    elementId: string,
    systemId: string,
    shouldLink: boolean
) {
    const supabase = await createClient();

    if (shouldLink) {
        const { error } = await supabase
            .schema('catalog').from('task_element_systems')
            .insert({ element_id: elementId, system_id: systemId });

        if (error) {
            if (!sanitizeError(error).includes("duplicate")) {
                console.error("Error linking system to element:", error);
                return { error: sanitizeError(error) };
            }
        }
    } else {
        const { error } = await supabase
            .schema('catalog').from('task_element_systems')
            .delete()
            .eq("element_id", elementId)
            .eq("system_id", systemId);

        if (error) {
            console.error("Error unlinking system from element:", error);
            return { error: sanitizeError(error) };
        }
    }

    revalidatePath("/admin/catalog");
    return { success: true, error: null };
}

/**
 * Toggle an element link for an action
 * Uses catalog.task_element_actions
 */
export async function toggleElementAction(
    actionId: string,
    elementId: string,
    shouldLink: boolean
) {
    const supabase = await createClient();

    if (shouldLink) {
        const { error } = await supabase
            .schema('catalog').from('task_element_actions')
            .insert({ action_id: actionId, element_id: elementId });

        if (error) {
            if (!sanitizeError(error).includes("duplicate")) {
                console.error("Error linking element to action:", error);
                return { error: sanitizeError(error) };
            }
        }
    } else {
        const { error } = await supabase
            .schema('catalog').from('task_element_actions')
            .delete()
            .eq("action_id", actionId)
            .eq("element_id", elementId);

        if (error) {
            console.error("Error unlinking element from action:", error);
            return { error: sanitizeError(error) };
        }
    }

    revalidatePath("/admin/catalog");
    return { success: true, error: null };
}

// ============================================================================
// TASK TEMPLATES CRUD (Admin Only)
// ============================================================================

/**
 * Create a new task template
 */
export async function createTaskTemplate(formData: FormData) {
    const supabase = await createClient();

    const name = formData.get("name") as string;
    const code = (formData.get("code") as string | null)?.trim().toUpperCase() || null;
    const description = formData.get("description") as string | null;
    const task_action_id = formData.get("task_action_id") as string;
    const task_element_id = formData.get("task_element_id") as string;
    const task_construction_system_id = formData.get("task_construction_system_id") as string;
    const task_division_id = formData.get("task_division_id") as string | null;
    const unit_id = formData.get("unit_id") as string;
    const status = (formData.get("status") as string) || "draft";

    if (!name?.trim()) return { error: "El nombre es requerido" };
    if (!task_action_id) return { error: "La acción es requerida" };
    if (!task_element_id) return { error: "El elemento es requerido" };
    if (!task_construction_system_id) return { error: "El sistema constructivo es requerido" };
    if (!unit_id) return { error: "La unidad es requerida" };

    const { data, error } = await supabase
        .schema('catalog').from('task_templates')
        .insert({
            name: name.trim(),
            code: code || null,
            description: description?.trim() || null,
            task_action_id,
            task_element_id,
            task_construction_system_id,
            task_division_id: task_division_id || null,
            unit_id,
            status,
            is_system: true,
            is_deleted: false,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating task template:", error);
        if (error.code === "23505") return { error: "Ya existe una plantilla con ese nombre o código" };
        return { error: sanitizeError(error) };
    }

    revalidatePath("/admin/catalog");
    return { data, error: null };
}

/**
 * Update a task template
 */
export async function updateTaskTemplate(id: string, formData: FormData) {
    const supabase = await createClient();

    const name = formData.get("name") as string;
    const code = (formData.get("code") as string | null)?.trim().toUpperCase() || null;
    const description = formData.get("description") as string | null;
    const task_action_id = formData.get("task_action_id") as string;
    const task_element_id = formData.get("task_element_id") as string;
    const task_construction_system_id = formData.get("task_construction_system_id") as string;
    const task_division_id = formData.get("task_division_id") as string | null;
    const unit_id = formData.get("unit_id") as string;
    const status = formData.get("status") as string;

    if (!id) return { error: "ID de plantilla no proporcionado" };
    if (!name?.trim()) return { error: "El nombre es requerido" };

    const { data, error } = await supabase
        .schema('catalog').from('task_templates')
        .update({
            name: name.trim(),
            code: code || null,
            description: description?.trim() || null,
            task_action_id,
            task_element_id,
            task_construction_system_id,
            task_division_id: task_division_id || null,
            unit_id,
            status,
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating task template:", error);
        return { error: sanitizeError(error) };
    }

    revalidatePath("/admin/catalog");
    return { data, error: null };
}

/**
 * Soft delete a task template
 */
export async function deleteTaskTemplate(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .schema('catalog').from('task_templates')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq("id", id);

    if (error) {
        console.error("Error deleting task template:", error);
        return { error: sanitizeError(error) };
    }

    revalidatePath("/admin/catalog");
    return { success: true, error: null };
}

/**
 * Toggle a parameter link for a template (task_template_parameters)
 * shouldLink = true → INSERT, false → DELETE
 */
export async function toggleTemplateParameter(
    templateId: string,
    parameterId: string,
    shouldLink: boolean,
    order?: number
) {
    const supabase = await createClient();

    if (shouldLink) {
        const { error } = await supabase
            .schema('catalog').from('task_template_parameters')
            .insert({ template_id: templateId, parameter_id: parameterId, order: order ?? 0, is_required: true });

        if (error && !sanitizeError(error).includes("duplicate")) {
            console.error("Error linking parameter to template:", error);
            return { error: sanitizeError(error) };
        }
    } else {
        const { error } = await supabase
            .schema('catalog').from('task_template_parameters')
            .delete()
            .eq("template_id", templateId)
            .eq("parameter_id", parameterId);

        if (error) {
            console.error("Error unlinking parameter from template:", error);
            return { error: sanitizeError(error) };
        }
    }

    revalidatePath("/admin/catalog");
    return { success: true, error: null };
}

/**
 * Reorder parameters for a template — saves the full ordered list in one call.
 * Receives an ordered array of { parameterId, isRequired } and upserts the order field.
 */
export async function reorderTemplateParameters(
    templateId: string,
    orderedParams: { parameterId: string; isRequired: boolean }[]
) {
    const supabase = await createClient();

    const rows = orderedParams.map((p, index) => ({
        template_id: templateId,
        parameter_id: p.parameterId,
        order: index,
        is_required: p.isRequired,
    }));

    const { error } = await supabase
        .schema('catalog').from('task_template_parameters')
        .upsert(rows, { onConflict: 'template_id,parameter_id' });

    if (error) {
        console.error("Error reordering template parameters:", error);
        return { error: sanitizeError(error) };
    }

    revalidatePath("/admin/catalog");
    return { success: true, error: null };
}
