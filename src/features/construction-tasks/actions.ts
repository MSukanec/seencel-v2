"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { ConstructionTaskFormData, ConstructionTaskStatus } from "./types";

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
            custom_name: data.custom_name || null,
            custom_unit: data.custom_unit || null,
            quantity: data.quantity,
            original_quantity: data.original_quantity || null,
            start_date: data.start_date || null,
            end_date: data.end_date || null,
            duration_in_days: data.duration_in_days || null,
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
        return { success: false, error: error.message };
    }

    revalidatePath(`/project/${projectId}/construction-tasks`);
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
            custom_name: data.custom_name,
            custom_unit: data.custom_unit,
            quantity: data.quantity,
            start_date: data.start_date,
            end_date: data.end_date,
            duration_in_days: data.duration_in_days,
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
        return { success: false, error: error.message };
    }

    revalidatePath(`/project/${projectId}/construction-tasks`);
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
        return { success: false, error: error.message };
    }

    revalidatePath(`/project/${projectId}/construction-tasks`);
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
        return { success: false, error: error.message };
    }

    revalidatePath(`/project/${projectId}/construction-tasks`);
    return { success: true };
}
