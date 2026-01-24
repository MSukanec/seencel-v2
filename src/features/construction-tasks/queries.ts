"use server";

import { createClient } from "@/lib/supabase/server";
import { ConstructionTaskView } from "./types";

/**
 * Get all construction tasks for a project (from construction_tasks_view)
 */
export async function getProjectConstructionTasks(projectId: string): Promise<ConstructionTaskView[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("construction_tasks_view")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching construction tasks:", error);
        return [];
    }

    return data as ConstructionTaskView[];
}

/**
 * Get a single construction task by ID
 */
export async function getConstructionTask(taskId: string): Promise<ConstructionTaskView | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("construction_tasks_view")
        .select("*")
        .eq("id", taskId)
        .single();

    if (error) {
        console.error("Error fetching construction task:", error);
        return null;
    }

    return data as ConstructionTaskView;
}
