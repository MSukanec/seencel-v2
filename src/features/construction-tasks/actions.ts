"use server";


import { sanitizeError } from "@/lib/error-utils";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { ConstructionTaskFormData, ConstructionTaskStatus } from "./types";
import type { TaskRecipeView } from "@/features/tasks/types";

/**
 * Create a new construction task
 */
export async function createConstructionTask(
    projectId: string,
    organizationId: string,
    data: ConstructionTaskFormData
) {
    const supabase = await createClient();

    const { data: result, error } = await supabase
        .from("construction_tasks")
        .insert({
            project_id: projectId,
            organization_id: organizationId,
            task_id: data.task_id || null,
            recipe_id: data.recipe_id || null,
            custom_name: data.custom_name || null,
            custom_unit: data.custom_unit || null,
            quantity: data.quantity,
            original_quantity: data.original_quantity || data.quantity,
            planned_start_date: data.planned_start_date || null,
            planned_end_date: data.planned_end_date || null,
            actual_start_date: data.actual_start_date || null,
            actual_end_date: data.actual_end_date || null,
            status: data.status || 'pending',
            progress_percent: data.progress_percent || 0,
            description: data.description || null,
            notes: data.notes || null,
            cost_scope: data.cost_scope || 'materials_and_labor',
            quote_item_id: data.quote_item_id || null,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating construction task:", error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath(`/organization/construction-tasks`);
    return { success: true, data: result };
}

/**
 * Update an existing construction task
 */
export async function updateConstructionTask(
    taskId: string,
    projectId: string,
    data: Partial<ConstructionTaskFormData>
) {
    const supabase = await createClient();

    const { data: result, error } = await supabase
        .from("construction_tasks")
        .update({
            task_id: data.task_id,
            recipe_id: data.recipe_id,
            custom_name: data.custom_name,
            custom_unit: data.custom_unit,
            quantity: data.quantity,
            planned_start_date: data.planned_start_date,
            planned_end_date: data.planned_end_date,
            actual_start_date: data.actual_start_date,
            actual_end_date: data.actual_end_date,
            status: data.status,
            progress_percent: data.progress_percent,
            description: data.description,
            notes: data.notes,
            cost_scope: data.cost_scope,
        })
        .eq("id", taskId)
        .select()
        .single();

    if (error) {
        console.error("Error updating construction task:", error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath(`/organization/construction-tasks`);
    return { success: true, data: result };
}

/**
 * Quick status update for a construction task
 */
export async function updateConstructionTaskStatus(
    taskId: string,
    projectId: string,
    status: ConstructionTaskStatus,
    progressPercent?: number
) {
    const supabase = await createClient();

    const updateData: { status: ConstructionTaskStatus; progress_percent?: number } = { status };

    // Auto-set progress based on status
    if (status === 'completed') {
        updateData.progress_percent = 100;
    } else if (progressPercent !== undefined) {
        updateData.progress_percent = progressPercent;
    }

    const { error } = await supabase
        .from("construction_tasks")
        .update(updateData)
        .eq("id", taskId);

    if (error) {
        console.error("Error updating construction task status:", error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath(`/organization/construction-tasks`);
    return { success: true };
}

/**
 * Soft delete a construction task
 */
export async function deleteConstructionTask(taskId: string, projectId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("construction_tasks")
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString()
        })
        .eq("id", taskId);

    if (error) {
        console.error("Error deleting construction task:", error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath(`/organization/construction-tasks`);
    return { success: true };
}

// ============================================================================
// Construction Dependencies
// ============================================================================

/**
 * Create a dependency between two construction tasks
 */
export async function createConstructionDependency(
    organizationId: string,
    predecessorTaskId: string,
    successorTaskId: string,
    type: "FS" | "FF" | "SS" | "SF" = "FS"
) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("construction_dependencies")
        .insert({
            organization_id: organizationId,
            predecessor_task_id: predecessorTaskId,
            successor_task_id: successorTaskId,
            type,
        })
        .select("id")
        .single();

    if (error) {
        console.error("Error creating construction dependency:", error);
        return { success: false, error: sanitizeError(error) };
    }

    return { success: true, id: data.id };
}

/**
 * Delete a construction dependency
 */
export async function deleteConstructionDependency(dependencyId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("construction_dependencies")
        .delete()
        .eq("id", dependencyId);

    if (error) {
        console.error("Error deleting construction dependency:", error);
        return { success: false, error: sanitizeError(error) };
    }

    return { success: true };
}

// ============================================================================
// Project Settings
// ============================================================================

/**
 * Upsert project settings (work days, etc.)
 */
export async function upsertProjectSettings(
    projectId: string,
    organizationId: string,
    workDays: number[],
) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("project_settings")
        .upsert(
            {
                project_id: projectId,
                organization_id: organizationId,
                work_days: workDays,
            },
            { onConflict: "project_id" }
        );

    if (error) {
        console.error("Error upserting project settings:", error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath(`/organization/construction-tasks`);
    return { success: true };
}

/**
 * Fetch project settings from client components (server action wrapper)
 */
export async function fetchProjectSettingsAction(
    projectId: string
): Promise<{ work_days: number[] }> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("project_settings")
        .select("work_days")
        .eq("project_id", projectId)
        .maybeSingle();

    if (error) {
        console.error("Error fetching project settings:", error);
        return { work_days: [1, 2, 3, 4, 5] };
    }

    return { work_days: data?.work_days ?? [1, 2, 3, 4, 5] };
}

// ============================================================================
// Task Recipes
// ============================================================================

/**
 * Get available recipes for a catalog task.
 * Returns recipes owned by the organization + public recipes.
 */
export async function getRecipesForTask(
    taskId: string,
    organizationId: string,
): Promise<TaskRecipeView[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("task_recipes_view")
        .select("*")
        .eq("task_id", taskId)
        .eq("is_deleted", false)
        .or(`organization_id.eq.${organizationId},is_public.eq.true`)
        .order("name", { ascending: true });

    if (error) {
        console.error("Error fetching recipes for task:", error);
        return [];
    }

    return data as TaskRecipeView[];
}
