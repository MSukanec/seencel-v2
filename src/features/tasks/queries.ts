import { createClient } from "@/lib/supabase/server";
import { TaskView, TasksByDivision, TaskDivision, Unit } from "./types";

/**
 * Get all tasks for an organization (includes system tasks + org custom tasks)
 * Reads from tasks_view which has pre-joined unit and division names
 */
export async function getOrganizationTasks(organizationId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('tasks_view')
        .select('*')
        .or(`organization_id.eq.${organizationId},is_system.eq.true`)
        .eq('is_deleted', false)
        .order('code', { ascending: true, nullsFirst: false });

    if (error) {
        console.error("Error fetching tasks:", error);
        return { data: [], error };
    }

    // Transform to TaskView (view already has flattened fields)
    const tasks: TaskView[] = (data || []).map(t => ({
        id: t.id,
        created_at: t.created_at,
        updated_at: t.updated_at,
        code: t.code,
        name: t.name,
        custom_name: t.custom_name,
        description: t.description,
        unit_id: t.unit_id,
        task_division_id: t.task_division_id,
        organization_id: t.organization_id,
        is_system: t.is_system,
        is_published: t.is_published ?? true,
        is_deleted: t.is_deleted ?? false,
        deleted_at: null,
        // From view joins
        unit_name: t.unit_name,
        division_name: t.division_name,
        division_color: undefined, // Not in DB yet
    }));

    return { data: tasks, error: null };
}

/**
 * Get tasks grouped by division for UI display
 */
export async function getTasksGroupedByDivision(organizationId: string): Promise<TasksByDivision[]> {
    const { data: tasks } = await getOrganizationTasks(organizationId);

    // Group by division
    const grouped = new Map<string | null, TasksByDivision>();

    for (const task of tasks) {
        const divisionId = task.task_division_id;

        if (!grouped.has(divisionId)) {
            grouped.set(divisionId, {
                division: divisionId ? {
                    id: divisionId,
                    name: task.division_name || "Sin división",
                    color: task.division_color,
                } : null,
                tasks: []
            });
        }

        grouped.get(divisionId)!.tasks.push(task);
    }

    // Sort: divisions with tasks first, then by name
    return Array.from(grouped.values())
        .sort((a, b) => {
            if (!a.division) return 1;
            if (!b.division) return -1;
            return (a.division.name || "").localeCompare(b.division.name || "");
        });
}

/**
 * Get all task divisions
 */
export async function getTaskDivisions(organizationId?: string) {
    const supabase = await createClient();

    let query = supabase
        .from('task_divisions')
        .select('*')
        .order('name', { ascending: true });

    // If org provided, get both system and org divisions
    if (organizationId) {
        query = query.or(`organization_id.eq.${organizationId},organization_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching divisions:", error);
        return { data: [], error };
    }

    return { data: data as TaskDivision[], error: null };
}

/**
 * Get all units for the unit selector
 */
export async function getUnits() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('units')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching units:", error);
        return { data: [], error };
    }

    return { data: data as Unit[], error: null };
}
