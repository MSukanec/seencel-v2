import { createClient } from "@/lib/supabase/server";
import { TaskView, TasksByDivision, TaskDivision, Unit } from "./types";

/**
 * Get all tasks for an organization (includes system tasks + org custom tasks)
 * Reads from tasks_view which has pre-joined unit and division names
 * @param organizationId - The org ID, or "__SYSTEM__" for admin mode (only system tasks)
 */
export async function getOrganizationTasks(organizationId: string) {
    const supabase = await createClient();

    let query = supabase
        .from('tasks_view')
        .select('*')
        .eq('is_deleted', false)
        .order('code', { ascending: true, nullsFirst: false });

    // Special flag for admin mode - only system tasks
    if (organizationId === "__SYSTEM__") {
        query = query.eq('is_system', true);
    } else {
        query = query.or(`organization_id.eq.${organizationId},is_system.eq.true`);
    }

    const { data, error } = await query;

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
                    order: (task as any).division_order,
                } : null,
                tasks: []
            });
        }

        grouped.get(divisionId)!.tasks.push(task);
    }

    // Sort by division order, then by name as fallback
    return Array.from(grouped.values())
        .sort((a, b) => {
            if (!a.division) return 1;
            if (!b.division) return -1;
            // Sort by order first (nulls last)
            const orderA = a.division.order ?? 999999;
            const orderB = b.division.order ?? 999999;
            if (orderA !== orderB) return orderA - orderB;
            // Fallback to name
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
        .order('order', { ascending: true, nullsFirst: false })
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

// ============================================================================
// TASK DETAIL PAGE QUERIES
// ============================================================================

export interface TaskMaterial {
    id: string;
    task_id: string;
    material_id: string;
    material_name: string;
    unit_name: string | null;
    amount: number | null;
    is_system: boolean;
}

/**
 * Get a single task by ID with full details
 */
export async function getTaskById(taskId: string): Promise<TaskView | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('tasks_view')
        .select('*')
        .eq('id', taskId)
        .single();

    if (error) {
        console.error("Error fetching task:", error);
        return null;
    }

    if (!data) return null;

    return {
        id: data.id,
        created_at: data.created_at,
        updated_at: data.updated_at,
        code: data.code,
        name: data.name,
        custom_name: data.custom_name,
        description: data.description,
        unit_id: data.unit_id,
        task_division_id: data.task_division_id,
        organization_id: data.organization_id,
        is_system: data.is_system,
        is_published: data.is_published ?? true,
        is_deleted: data.is_deleted ?? false,
        deleted_at: null,
        unit_name: data.unit_name,
        division_name: data.division_name,
        division_color: undefined,
    };
}

/**
 * Get all materials linked to a task (the "recipe")
 */
export async function getTaskMaterials(taskId: string): Promise<TaskMaterial[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('task_materials')
        .select(`
            id,
            task_id,
            material_id,
            amount,
            is_system,
            materials (
                name,
                units (name)
            )
        `)
        .eq('task_id', taskId);

    if (error) {
        console.error("Error fetching task materials:", error);
        return [];
    }

    return (data || []).map((tm: any) => ({
        id: tm.id,
        task_id: tm.task_id,
        material_id: tm.material_id,
        material_name: tm.materials?.name || 'Material desconocido',
        unit_name: tm.materials?.units?.name || null,
        amount: tm.amount,
        is_system: tm.is_system || false,
    }));
}

/**
 * Get all available materials for adding to a task
 * For system tasks: only system materials
 * For org tasks: system + org materials
 */
export async function getAvailableMaterials(isSystemTask: boolean, organizationId?: string | null) {
    const supabase = await createClient();

    let query = supabase
        .from('materials')
        .select(`
            id,
            name,
            units (name)
        `)
        .eq('is_deleted', false)
        .order('name', { ascending: true });

    if (isSystemTask) {
        // System tasks can only use system materials
        query = query.eq('is_system', true);
    } else if (organizationId) {
        // Org tasks can use system + org materials
        query = query.or(`is_system.eq.true,organization_id.eq.${organizationId}`);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching available materials:", error);
        return [];
    }

    return (data || []).map((m: any) => ({
        id: m.id,
        name: m.name,
        unit_name: m.units?.name || null,
    }));
}


