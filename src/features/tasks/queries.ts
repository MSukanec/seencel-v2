import { createClient } from "@/lib/supabase/server";
import { TaskView, TasksByDivision, TaskDivision, Unit, TaskParameter, TaskKind, TaskElement } from "./types";

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
 * Get all task divisions (system table - visible to all)
 */
export async function getTaskDivisions() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('task_divisions')
        .select('*')
        .eq('is_deleted', false)
        .order('order', { ascending: true, nullsFirst: false })
        .order('name', { ascending: true });

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

// ============================================================================
// TASK LABOR QUERIES
// ============================================================================

export interface TaskLabor {
    id: string;
    task_id: string;
    labor_type_id: string;
    labor_type_name: string;
    unit_name: string | null;
    quantity: number;
    is_system: boolean;
}

/**
 * Get all labor types linked to a task
 */
export async function getTaskLabor(taskId: string): Promise<TaskLabor[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('task_labor')
        .select(`
            id,
            task_id,
            labor_type_id,
            quantity,
            is_system,
            labor_categories (
                name,
                units (name)
            )
        `)
        .eq('task_id', taskId);

    if (error) {
        console.error("Error fetching task labor:", error);
        return [];
    }

    return (data || []).map((tl: any) => ({
        id: tl.id,
        task_id: tl.task_id,
        labor_type_id: tl.labor_type_id,
        labor_type_name: tl.labor_categories?.name || 'Tipo desconocido',
        unit_name: tl.labor_categories?.units?.name || null,
        quantity: tl.quantity || 1,
        is_system: tl.is_system || false,
    }));
}

/**
 * Get all available labor types for adding to a task
 * For system tasks: only system labor types
 * For org tasks: system + org labor types
 */
export async function getAvailableLaborTypes(isSystemTask: boolean, organizationId?: string | null) {
    const supabase = await createClient();

    let query = supabase
        .from('labor_categories')
        .select(`
            id,
            name,
            units (name)
        `)
        .eq('is_deleted', false)
        .order('name', { ascending: true });

    if (isSystemTask) {
        // System tasks can only use system labor types
        query = query.eq('is_system', true);
    } else if (organizationId) {
        // Org tasks can use system + org labor types
        query = query.or(`is_system.eq.true,organization_id.eq.${organizationId}`);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching available labor types:", error);
        return [];
    }

    return (data || []).map((l: any) => ({
        id: l.id,
        name: l.name,
        unit_name: l.units?.name || null,
    }));
}

/**
 * Get all task parameters with their options (system table - visible to all)
 */
export async function getTaskParameters() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('task_parameters')
        .select(`
            *,
            options:task_parameter_options(*)
        `)
        .eq('is_deleted', false)
        .order('order', { ascending: true, nullsFirst: false })
        .order('label', { ascending: true });

    if (error) {
        console.error("Error fetching task parameters:", error);
        return { data: [], error };
    }

    // Sort options within each parameter alphabetically
    const dataWithSortedOptions = (data || []).map(param => ({
        ...param,
        options: (param.options || []).sort((a: any, b: any) =>
            (a.label || '').localeCompare(b.label || '')
        )
    }));

    return { data: dataWithSortedOptions as TaskParameter[], error: null };
}

/**
 * Get all element-parameter links for the sidebar filter
 */
export async function getElementParameterLinks() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('task_element_parameters')
        .select('element_id, parameter_id');

    if (error) {
        console.error("Error fetching element-parameter links:", error);
        return { data: [], error };
    }

    return { data: data || [], error: null };
}

/**
 * Get linked parameter IDs for a specific element
 */
export async function getLinkedParametersForElement(elementId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('task_element_parameters')
        .select('parameter_id')
        .eq('element_id', elementId);

    if (error) {
        console.error("Error fetching linked parameters for element:", error);
        return { data: [], error };
    }

    return {
        data: data?.map(d => d.parameter_id) || [],
        error: null
    };
}

/**
 * Get all task kinds (action types: Ejecución, Instalación, etc.)
 */
export async function getTaskKinds() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('task_kind')
        .select('*')
        .eq('is_active', true)
        .eq('is_deleted', false)
        .order('order', { ascending: true, nullsFirst: false })
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching task kinds:", error);
        return { data: [], error };
    }

    return { data: data as TaskKind[], error: null };
}

/**
 * Get all task elements (objects: Contrapiso, Muro, etc.)
 */
export async function getTaskElements() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('task_elements')
        .select('*')
        .eq('is_deleted', false)
        .order('order', { ascending: true, nullsFirst: false })
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching task elements:", error);
        return { data: [], error };
    }

    return { data: data as TaskElement[], error: null };
}

/**
 * Get elements compatible with a specific kind
 * @param kindId - The task_kind ID to filter by
 */
export async function getCompatibleElements(kindId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('task_kind_elements')
        .select(`
            element_id,
            task_elements!inner (
                id,
                name,
                slug,
                description,
                icon,
                "order"
            )
        `)
        .eq('kind_id', kindId);

    if (error) {
        console.error("Error fetching compatible elements:", error);
        return { data: [], error };
    }

    // Flatten the nested structure
    const elements = (data || []).map((row: any) => ({
        id: row.task_elements.id,
        name: row.task_elements.name,
        slug: row.task_elements.slug,
        description: row.task_elements.description,
        icon: row.task_elements.icon,
        order: row.task_elements.order,
        is_deleted: false,
    })) as TaskElement[];

    // Sort by order then name
    elements.sort((a, b) => {
        const orderA = a.order ?? 999999;
        const orderB = b.order ?? 999999;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
    });

    return { data: elements, error: null };
}

/**
 * Get parameters for a specific element with their options
 * Used in parametric task wizard to show parameter inputs
 */
export async function getElementParameters(elementId: string) {
    const supabase = await createClient();

    // First get the parameter IDs linked to this element
    const { data: links, error: linksError } = await supabase
        .from('task_element_parameters')
        .select('parameter_id, order, is_required')
        .eq('element_id', elementId)
        .order('order', { ascending: true });

    if (linksError || !links || links.length === 0) {
        return { data: [], error: linksError };
    }

    // Get the actual parameters
    const parameterIds = links.map(l => l.parameter_id);
    const { data: parameters, error: paramsError } = await supabase
        .from('task_parameters')
        .select('*')
        .in('id', parameterIds)
        .eq('is_deleted', false);

    if (paramsError || !parameters) {
        return { data: [], error: paramsError };
    }

    // Get options for all parameters
    const { data: allOptions, error: optionsError } = await supabase
        .from('task_parameter_options')
        .select('*')
        .in('parameter_id', parameterIds)
        .eq('is_deleted', false)
        .order('order', { ascending: true });

    if (optionsError) {
        console.error('Error fetching parameter options:', optionsError);
    }

    // Build the result with options nested
    const result = parameters.map(param => {
        const link = links.find(l => l.parameter_id === param.id);
        const options = (allOptions || []).filter(o => o.parameter_id === param.id);
        return {
            ...param,
            order: link?.order ?? param.order,
            is_required: link?.is_required ?? param.is_required,
            options
        };
    }).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

    return { data: result, error: null };
}

// ============================================================================
// DIVISION COMPATIBILITY QUERIES
// ============================================================================

/**
 * Get all elements (for compatibility management)
 */
export async function getAllElements() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('task_elements')
        .select('*')
        .eq('is_deleted', false)
        .order('order', { ascending: true });

    if (error) {
        console.error('Error fetching elements:', error);
        return { data: [], error };
    }

    return { data: data || [], error: null };
}

/**
 * Get a single element by ID
 */
export async function getElementById(elementId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('task_elements')
        .select('*')
        .eq('id', elementId)
        .eq('is_deleted', false)
        .single();

    if (error) {
        console.error('Error fetching element:', error);
        return { data: null, error };
    }

    return { data, error: null };
}

/**
 * Get element IDs linked to a division
 */
export async function getDivisionElementIds(divisionId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('task_division_elements')
        .select('element_id')
        .eq('division_id', divisionId);

    if (error) {
        console.error('Error fetching division elements:', error);
        return { data: [], error };
    }

    return {
        data: (data || []).map(d => d.element_id),
        error: null
    };
}

/**
 * Get kind IDs linked to a division
 */
export async function getDivisionKindIds(divisionId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('task_division_kinds')
        .select('kind_id')
        .eq('division_id', divisionId);

    if (error) {
        console.error('Error fetching division kinds:', error);
        return { data: [], error };
    }

    return {
        data: (data || []).map(d => d.kind_id),
        error: null
    };
}

/**
 * Get a single division by ID
 */
export async function getDivisionById(divisionId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('task_divisions')
        .select('*')
        .eq('id', divisionId)
        .single();

    if (error) {
        console.error('Error fetching division:', error);
        return { data: null, error };
    }

    return { data, error: null };
}
