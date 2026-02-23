import { createClient } from "@/lib/supabase/server";
import { TaskView, TasksByDivision, TaskDivision, Unit, TaskParameter, TaskAction, TaskElement, TaskTemplate, TaskTemplateParameter, TaskTemplateWithParameters } from "./types";

// ============================================================================
// Types for task costs
// ============================================================================

export interface TaskCostSummary {
    task_id: string;
    organization_id: string;
    unit_cost: number | null;
    mat_unit_cost: number | null;
    lab_unit_cost: number | null;
    recipe_count: number;
    min_cost: number | null;
    max_cost: number | null;
    oldest_price_date: string | null;
}

/**
 * Get all tasks for an organization (includes system tasks + org custom tasks)
 * Reads from tasks_view which has pre-joined unit and division names
 * @param organizationId - The org ID, or "__SYSTEM__" for admin mode (only system tasks)
 */
export async function getOrganizationTasks(organizationId: string) {
    const supabase = await createClient();

    let query = supabase
        .schema('catalog').from('tasks_view')
        .select('*')
        .eq('is_deleted', false)
        .order('name', { ascending: true });

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
        status: t.status ?? null,
        // From view joins
        unit_name: t.unit_name,
        unit_symbol: t.unit_symbol,
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
 * Get task divisions (system + org-specific)
 * @param organizationId - If provided, returns system divisions + org divisions.
 *                         If "__SYSTEM__" or omitted, returns all (admin mode).
 */
export async function getTaskDivisions(organizationId?: string) {
    const supabase = await createClient();

    let query = supabase
        .schema('catalog').from('task_divisions')
        .select('*')
        .eq('is_deleted', false)
        .order('order', { ascending: true, nullsFirst: false })
        .order('name', { ascending: true });

    // Filter by org: show system + org-specific
    if (organizationId && organizationId !== "__SYSTEM__") {
        query = query.or(`is_system.eq.true,organization_id.eq.${organizationId}`);
    } else if (organizationId === "__SYSTEM__") {
        query = query.eq('is_system', true);
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
        .schema('catalog').from('units')
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



/**
 * Get a single task by ID with full details
 */
export async function getTaskById(taskId: string): Promise<TaskView | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('catalog').from('tasks_view')
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
        status: data.status ?? null,
        unit_name: data.unit_name,
        unit_symbol: data.unit_symbol,
        division_name: data.division_name,
        division_color: undefined,
    };
}


/**
 * Get all task parameters with their options (system table - visible to all)
 */
export async function getTaskParameters() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('catalog').from('task_parameters')
        .select(`
            *,
            options:task_parameter_options!parameter_id(*)
        `)
        .eq('is_deleted', false)
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
 * @deprecated Table task_element_parameters was removed from the DB.
 */
export async function getElementParameterLinks() {
    return { data: [], error: null };
}

/**
 * @deprecated Table task_element_parameters was removed from the DB.
 */
export async function getLinkedParametersForElement(elementId: string) {
    return { data: [], error: null };
}

/**
 * Get all task actions (action types: Ejecución, Demolición, Limpieza, etc.)
 */
export async function getTaskActions() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('catalog').from('task_actions')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching task actions:", error);
        return { data: [], error };
    }

    return { data: data as TaskAction[], error: null };
}

/**
 * Get all task elements (objects: Contrapiso, Muro, etc.)
 */
export async function getTaskElements() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('catalog').from('task_elements')
        .select('*')
        .eq('is_deleted', false)
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching task elements:", error);
        return { data: [], error };
    }

    return { data: data as TaskElement[], error: null };
}

/**
 * Get elements compatible with a specific action
 * @param actionId - The task_actions ID to filter by
 */
export async function getCompatibleElements(actionId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('catalog').from('task_element_actions')
        .select(`
            element_id,
            task_elements!inner (
                id,
                name,
                slug,
                description,
                code,
                element_type
            )
        `)
        .eq('action_id', actionId);

    if (error) {
        console.error("Error fetching compatible elements:", error);
        return { data: [], error };
    }

    // Flatten the nested structure, sort alphabetically
    const elements = (data || []).map((row: any) => ({
        id: row.task_elements.id,
        name: row.task_elements.name,
        slug: row.task_elements.slug,
        description: row.task_elements.description,
        code: row.task_elements.code,
        element_type: row.task_elements.element_type,
        is_system: true,
        is_deleted: false,
        expression_template: row.task_elements.expression_template ?? null,
    })) as TaskElement[];

    elements.sort((a, b) => a.name.localeCompare(b.name));

    return { data: elements, error: null };
}

/**
 * Get actions compatible with a specific element (inverse of getCompatibleElements)
 * @param elementId - The task_element ID to filter by
 */
export async function getCompatibleActionsForElement(elementId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('catalog').from('task_element_actions')
        .select(`
            action_id,
            task_actions!inner (
                id,
                name,
                short_code,
                description
            )
        `)
        .eq('element_id', elementId);

    if (error) {
        console.error("Error fetching compatible actions for element:", error);
        return { data: [], error };
    }

    // Flatten the nested structure
    const actions = (data || []).map((row: any) => ({
        id: row.task_actions.id,
        name: row.task_actions.name,
        short_code: row.task_actions.short_code,
        description: row.task_actions.description,
    })) as TaskAction[];

    // Sort by name
    actions.sort((a, b) => a.name.localeCompare(b.name));

    return { data: actions, error: null };
}

/**
 * Get parameters for a specific element with their options
 * Used in parametric task wizard to show parameter inputs
 */
export async function getElementParameters(elementId: string) {
    // task_element_parameters was removed from the DB.
    // Parameters now belong to construction systems, not elements.
    // Use getSystemParameters(systemId) instead.
    return { data: [], error: null };
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
        .schema('catalog').from('task_elements')
        .select('*')
        .eq('is_deleted', false)
        .order('name', { ascending: true });

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
        .schema('catalog').from('task_elements')
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
 * @deprecated Table task_division_elements was removed from the DB.
 */
export async function getDivisionElementIds(divisionId: string) {
    return { data: [], error: null };
}

/**
 * @deprecated Table task_division_actions was removed from the DB.
 */
export async function getDivisionActionIds(divisionId: string) {
    return { data: [], error: null };
}

/**
 * Get a single division by ID
 */
export async function getDivisionById(divisionId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('catalog').from('task_divisions')
        .select('*')
        .eq('id', divisionId)
        .single();

    if (error) {
        console.error('Error fetching division:', error);
        return { data: null, error };
    }

    return { data, error: null };
}

/**
 * Get cost summaries for all tasks in an organization from task_costs_view.
 * Returns a Map keyed by task_id for O(1) lookup.
 */
export async function getTaskCosts(organizationId: string): Promise<Map<string, TaskCostSummary>> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('catalog').from('task_costs_view')
        .select('*')
        .eq('organization_id', organizationId);

    if (error) {
        console.error("Error fetching task costs:", error);
        return new Map();
    }

    const map = new Map<string, TaskCostSummary>();
    for (const row of data || []) {
        map.set(row.task_id, {
            task_id: row.task_id,
            organization_id: row.organization_id,
            unit_cost: row.unit_cost,
            mat_unit_cost: row.mat_unit_cost,
            lab_unit_cost: row.lab_unit_cost,
            recipe_count: row.recipe_count ?? 0,
            min_cost: row.min_cost,
            max_cost: row.max_cost,
            oldest_price_date: row.oldest_price_date ?? null,
        });
    }

    return map;
}

// ============================================================================
// TASK USAGE COUNTS
// ============================================================================

export interface TaskUsageCount {
    task_id: string;
    quote_count: number;
    construction_count: number;
    total: number;
}

/**
 * Get usage counts for all tasks in an organization.
 * Counts how many quote_items and construction_tasks reference each catalog task.
 * Returns a Map keyed by task_id for O(1) lookup.
 */
export async function getTaskUsageCounts(organizationId: string): Promise<Map<string, TaskUsageCount>> {
    const supabase = await createClient();

    // Count quote_items per task_id (scoped by organization via quotes)
    const [quoteResult, constructionResult] = await Promise.all([
        supabase
            .schema('finance').from('quote_items')
            .select('task_id, quotes!inner(organization_id)', { count: 'exact' })
            .eq('quotes.organization_id', organizationId)
            .eq('is_deleted', false)
            .not('task_id', 'is', null),
        supabase
            .schema('construction').from('construction_tasks')
            .select('task_id', { count: 'exact' })
            .eq('organization_id', organizationId)
            .eq('is_deleted', false)
            .not('task_id', 'is', null),
    ]);

    const map = new Map<string, TaskUsageCount>();

    // Aggregate quote_items counts
    for (const row of quoteResult.data || []) {
        const taskId = row.task_id as string;
        if (!taskId) continue;
        const existing = map.get(taskId) || { task_id: taskId, quote_count: 0, construction_count: 0, total: 0 };
        existing.quote_count++;
        existing.total = existing.quote_count + existing.construction_count;
        map.set(taskId, existing);
    }

    // Aggregate construction_tasks counts
    for (const row of constructionResult.data || []) {
        const taskId = row.task_id as string;
        if (!taskId) continue;
        const existing = map.get(taskId) || { task_id: taskId, quote_count: 0, construction_count: 0, total: 0 };
        existing.construction_count++;
        existing.total = existing.quote_count + existing.construction_count;
        map.set(taskId, existing);
    }

    return map;
}

// ============================================================================
// CONSTRUCTION SYSTEMS QUERIES
// ============================================================================

/**
 * Get all construction systems (admin catalog)
 */
export async function getAllConstructionSystems() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('catalog').from('task_construction_systems')
        .select('*')
        .eq('is_deleted', false)
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching construction systems:', error);
        return { data: [], error };
    }

    return { data: data || [], error: null };
}

/**
 * Get all system-parameter links for the admin view
 */
export async function getSystemParameterLinks() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('catalog').from('task_system_parameters')
        .select('system_id, parameter_id')
        .eq('is_deleted', false);

    if (error) {
        console.error('Error fetching system-parameter links:', error);
        return { data: [], error };
    }

    return { data: data || [], error: null };
}

/**
 * Get all system-parameter-option links for the admin view
 * Used to configure which options of a parameter are visible per system
 */
export async function getSystemParameterOptionLinks() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('catalog').from('task_system_parameter_options')
        .select('system_id, parameter_id, option_id');

    if (error) {
        console.error('Error fetching system-parameter-option links:', JSON.stringify(error, null, 2));
        return { data: [], error };
    }

    return { data: data || [], error: null };
}

/**
 * Get all element-system links for the admin view
 */
export async function getElementSystemLinks() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('catalog').from('task_element_systems')
        .select('element_id, system_id');

    if (error) {
        console.error('Error fetching element-system links:', error);
        return { data: [], error };
    }

    return { data: data || [], error: null };
}

/**
 * Get all element-action links for the admin catalog view
 * Used by actions tab to show which elements each action is compatible with
 */
export async function getElementActionLinks() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('catalog').from('task_element_actions')
        .select('action_id, element_id');

    if (error) {
        console.error('Error fetching element-action links:', error);
        return { data: [], error };
    }

    return { data: data || [], error: null };
}

// ============================================================================
// TASK TEMPLATES QUERIES
// ============================================================================

/**
 * Get all task templates with resolved names (action, element, system, unit).
 * All related tables live in the catalog schema.
 */
export async function getTaskTemplates() {
    const supabase = await createClient();

    const { data: rawTemplates, error } = await supabase
        .schema('catalog').from('task_templates')
        .select(`
            id, name, description,
            task_action_id, task_element_id,
            task_construction_system_id, task_division_id,
            unit_id, is_system, status, is_deleted, deleted_at,
            created_at, updated_at, created_by, updated_by,
            system:task_construction_systems!task_construction_system_id ( name, code ),
            unit:units!unit_id ( name, symbol )
        `)
        .eq('is_deleted', false)
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching task templates:', error);
        return { data: [] as TaskTemplate[], error };
    }
    if (!rawTemplates || rawTemplates.length === 0) {
        return { data: [] as TaskTemplate[], error: null };
    }

    // Collect IDs to enrich (also in catalog schema)
    const actionIds = [...new Set(rawTemplates.map((t: any) => t.task_action_id).filter(Boolean))];
    const elementIds = [...new Set(rawTemplates.map((t: any) => t.task_element_id).filter(Boolean))];
    const divisionIds = [...new Set(rawTemplates.map((t: any) => t.task_division_id).filter(Boolean))];

    const [actionsRes, elementsRes, divisionsRes] = await Promise.all([
        actionIds.length > 0
            ? supabase.schema('catalog').from('task_actions').select('id, name, short_code').in('id', actionIds)
            : Promise.resolve({ data: [] }),
        elementIds.length > 0
            ? supabase.schema('catalog').from('task_elements').select('id, name, code').in('id', elementIds)
            : Promise.resolve({ data: [] }),
        divisionIds.length > 0
            ? supabase.schema('catalog').from('task_divisions').select('id, name').in('id', divisionIds)
            : Promise.resolve({ data: [] }),
    ]);

    const actionsMap = Object.fromEntries((actionsRes.data || []).map((a: any) => [a.id, a]));
    const elementsMap = Object.fromEntries((elementsRes.data || []).map((e: any) => [e.id, e]));
    const divisionsMap = Object.fromEntries((divisionsRes.data || []).map((d: any) => [d.id, d]));

    const templates: TaskTemplate[] = rawTemplates.map((row: any) => ({
        id: row.id,
        name: row.name,
        code: row.code ?? null,
        description: row.description,
        task_action_id: row.task_action_id,
        task_element_id: row.task_element_id,
        task_construction_system_id: row.task_construction_system_id,
        task_division_id: row.task_division_id,
        unit_id: row.unit_id,
        is_system: row.is_system,
        status: row.status,
        is_deleted: row.is_deleted,
        deleted_at: row.deleted_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        created_by: row.created_by,
        updated_by: row.updated_by,
        action_name: actionsMap[row.task_action_id]?.name ?? null,
        action_short_code: actionsMap[row.task_action_id]?.short_code ?? null,
        element_name: elementsMap[row.task_element_id]?.name ?? null,
        element_code: elementsMap[row.task_element_id]?.code ?? null,
        system_name: (row.system as any)?.name ?? null,
        system_code: (row.system as any)?.code ?? null,
        division_name: divisionsMap[row.task_division_id]?.name ?? null,
        unit_name: (row.unit as any)?.name ?? null,
        unit_symbol: (row.unit as any)?.symbol ?? null,
    }));

    return { data: templates, error: null };
}

/**
 * Get all template-parameter links for the admin toggle view.
 */
export async function getTemplateParameterLinks() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('catalog').from('task_template_parameters')
        .select('template_id, parameter_id, "order", is_required, created_at')
        .eq('is_deleted', false);

    if (error) {
        console.error('Error fetching template-parameter links:', error);
        return { data: [] as TaskTemplateParameter[], error };
    }

    return { data: (data || []) as TaskTemplateParameter[], error: null };
}

/**
 * Get a single template with its fully-resolved parameters (including options).
 * Used in the user-facing parametric form when a template is selected.
 */
export async function getTemplateWithParameters(templateId: string): Promise<TaskTemplateWithParameters | null> {
    const supabase = await createClient();

    const { data: templateData, error: templateError } = await supabase
        .schema('catalog').from('task_templates')
        .select(`
            *,
            action:task_actions ( name, short_code ),
            element:task_elements ( name, code ),
            system:task_construction_systems ( name, code ),
            unit:units ( name, symbol ),
            division:task_divisions ( name )
        `)
        .eq('id', templateId)
        .eq('is_deleted', false)
        .single();

    if (templateError || !templateData) return null;

    const { data: paramLinks } = await supabase
        .schema('catalog').from('task_template_parameters')
        .select('parameter_id, order, is_required')
        .eq('template_id', templateId)
        .order('order', { ascending: true });

    if (!paramLinks || paramLinks.length === 0) return buildTemplate(templateData, []);

    const paramIds = paramLinks.map((l: any) => l.parameter_id);

    const { data: paramsData } = await supabase
        .schema('catalog').from('task_parameters')
        .select(`*, options:task_parameter_options!parameter_id(*)`)
        .in('id', paramIds)
        .eq('is_deleted', false);

    const orderMap = new Map(paramLinks.map((l: any) => [l.parameter_id, l.order]));
    const params: TaskParameter[] = (paramsData || [])
        .map((p: any) => ({
            ...p,
            is_required: paramLinks.find((l: any) => l.parameter_id === p.id)?.is_required ?? true,
            options: (p.options || []).sort((a: any, b: any) => (a.label || '').localeCompare(b.label || '')),
        }))
        .sort((a: any, b: any) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));

    return buildTemplate(templateData, params);
}

function buildTemplate(row: any, parameters: TaskParameter[]): TaskTemplateWithParameters {
    return {
        id: row.id, name: row.name, code: row.code ?? null, description: row.description,
        task_action_id: row.task_action_id, task_element_id: row.task_element_id,
        task_construction_system_id: row.task_construction_system_id,
        task_division_id: row.task_division_id, unit_id: row.unit_id,
        is_system: row.is_system, status: row.status, is_deleted: row.is_deleted,
        deleted_at: row.deleted_at, created_at: row.created_at, updated_at: row.updated_at,
        created_by: row.created_by, updated_by: row.updated_by,
        action_name: row.action?.name ?? null, action_short_code: row.action?.short_code ?? null,
        element_name: row.element?.name ?? null, element_code: row.element?.code ?? null,
        system_name: row.system?.name ?? null, system_code: row.system?.code ?? null,
        division_name: row.division?.name ?? null,
        unit_name: row.unit?.name ?? null, unit_symbol: row.unit?.symbol ?? null,
        parameters,
    };
}
