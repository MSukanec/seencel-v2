import { createClient } from "@/lib/supabase/server";
import { getUserOrganizations } from "@/features/organization/queries";
import { ConstructionTaskView } from "./types";

/**
 * Get ALL construction tasks for an organization (from construction_tasks_view)
 * No project filter — the view handles client-side filtering.
 */
export async function getOrganizationConstructionTasks(): Promise<ConstructionTaskView[]> {
    const supabase = await createClient();
    const { activeOrgId } = await getUserOrganizations();

    if (!activeOrgId) return [];

    const { data, error } = await supabase
        .from("construction_tasks_view")
        .select("*")
        .eq("organization_id", activeOrgId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching org construction tasks:", error);
        return [];
    }

    return data as ConstructionTaskView[];
}

/**
 * Get ALL construction dependencies for an organization
 * Scoped by joining through construction_tasks → organization_id
 */
export async function getOrganizationConstructionDependencies(): Promise<ConstructionDependencyRow[]> {
    const supabase = await createClient();
    const { activeOrgId } = await getUserOrganizations();

    if (!activeOrgId) return [];

    const { data, error } = await supabase
        .from("construction_dependencies")
        .select(`
            id,
            predecessor_task_id,
            successor_task_id,
            type,
            lag_days,
            predecessor:construction_tasks!construction_dependencies_predecessor_task_id_fkey(organization_id)
        `)
        .eq("predecessor.organization_id", activeOrgId);

    if (error) {
        console.error("Error fetching org construction dependencies:", error);
        return [];
    }

    return (data || []).map((d: any) => ({
        id: d.id,
        predecessor_task_id: d.predecessor_task_id,
        successor_task_id: d.successor_task_id,
        type: d.type,
        lag_days: d.lag_days,
    }));
}


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

// ============================================================================
// Construction Dependencies
// ============================================================================

export interface ConstructionDependencyRow {
    id: string;
    predecessor_task_id: string;
    successor_task_id: string;
    type: "FS" | "FF" | "SS" | "SF";
    lag_days: number;
}

/**
 * Get all construction dependencies for a project
 */
export async function getProjectConstructionDependencies(
    projectId: string
): Promise<ConstructionDependencyRow[]> {
    const supabase = await createClient();

    // Join through construction_tasks to scope by project
    const { data, error } = await supabase
        .from("construction_dependencies")
        .select(`
            id,
            predecessor_task_id,
            successor_task_id,
            type,
            lag_days,
            predecessor:construction_tasks!construction_dependencies_predecessor_task_id_fkey(project_id)
        `)
        .eq("predecessor.project_id", projectId);

    if (error) {
        console.error("Error fetching construction dependencies:", error);
        return [];
    }

    return (data || []).map((d: any) => ({
        id: d.id,
        predecessor_task_id: d.predecessor_task_id,
        successor_task_id: d.successor_task_id,
        type: d.type,
        lag_days: d.lag_days,
    }));
}

// ============================================================================
// Project Settings
// ============================================================================

export interface ProjectSettings {
    id?: string;
    project_id: string;
    work_days: number[]; // 0=dom, 1=lun ... 6=sab
}

const DEFAULT_WORK_DAYS = [1, 2, 3, 4, 5]; // Mon-Fri

/**
 * Get project settings (work days, etc.)
 * Returns defaults if no settings row exists yet.
 */
export async function getProjectSettings(
    projectId: string
): Promise<ProjectSettings> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("project_settings")
        .select("id, project_id, work_days")
        .eq("project_id", projectId)
        .maybeSingle();

    if (error) {
        console.error("Error fetching project settings:", error);
        return { project_id: projectId, work_days: DEFAULT_WORK_DAYS };
    }

    if (!data) {
        return { project_id: projectId, work_days: DEFAULT_WORK_DAYS };
    }

    return {
        id: data.id,
        project_id: data.project_id,
        work_days: data.work_days ?? DEFAULT_WORK_DAYS,
    };
}

