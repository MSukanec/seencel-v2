"use server";

import { createClient } from "@/lib/supabase/server";
import {
    PlannerBoard,
    PlannerItem,
    PlannerLabel,
    PlannerList,
    PlannerMember
} from "./types";

// ============================================
// BOARDS
// ============================================

export async function getBoards(organizationId: string, projectId?: string | null): Promise<PlannerBoard[]> {
    const supabase = await createClient();

    let query = supabase
        .schema('planner').from('boards')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (projectId === null) {
        query = query.is('project_id', null);
    } else if (projectId) {
        query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching boards:', error);
        return [];
    }

    return data as PlannerBoard[];
}

export async function getBoard(boardId: string): Promise<PlannerBoard | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('planner').from('boards')
        .select('*')
        .eq('id', boardId)
        .single();

    if (error) {
        console.error('Error fetching board:', error);
        return null;
    }

    return data as PlannerBoard;
}

// ============================================
// BOARD WITH FULL DATA (lists + items)
// ============================================

export async function getBoardWithData(boardId: string, filterByProjectId?: string | null): Promise<{
    board: PlannerBoard;
    lists: PlannerList[];
    labels: PlannerLabel[];
    members: PlannerMember[];
} | null> {
    const supabase = await createClient();

    // Get board
    const { data: board, error: boardError } = await supabase
        .schema('planner').from('boards')
        .select('*')
        .eq('id', boardId)
        .single();

    if (boardError || !board) {
        console.error('Error fetching board:', boardError);
        return null;
    }

    // Get project name (cross-schema)
    let boardProjectName: string | null = null;
    if (board.project_id) {
        const { data: projectData } = await supabase
            .schema('projects').from('projects')
            .select('name')
            .eq('id', board.project_id)
            .single();
        boardProjectName = projectData?.name || null;
    }

    // Get lists with items
    const { data: lists, error: listsError } = await supabase
        .schema('planner').from('lists')
        .select(`
            *,
            items (*)
        `)
        .eq('board_id', boardId)
        .eq('is_deleted', false)
        .order('position', { ascending: true });

    if (listsError) {
        console.error('Error fetching lists:', listsError);
        return null;
    }

    // Get labels
    const { data: labels, error: labelsError } = await supabase
        .schema('planner').from('labels')
        .select('*')
        .eq('organization_id', board.organization_id)
        .order('position', { ascending: true });

    if (labelsError) {
        console.error('Error fetching labels:', labelsError);
    }

    // Get organization members (cross-schema)
    const { data: membersData, error: membersError } = await supabase
        .schema('iam').from('organization_members')
        .select(`
            id,
            user_id,
            user: users (
                full_name,
                avatar_url
            )
        `)
        .eq('organization_id', board.organization_id);

    if (membersError) {
        console.error('Error fetching members:', membersError);
    }

    const members: PlannerMember[] = (membersData || []).map((m: any) => ({
        id: m.id,
        full_name: m.user?.full_name || null,
        avatar_url: m.user?.avatar_url || null,
    }));

    // Process lists - sort items and optionally filter by project
    const processedLists: PlannerList[] = (lists || []).map(list => {
        const filteredItems = ((list as any).items || [])
            .filter((i: any) => !i.is_deleted && !i.is_archived)
            .filter((i: any) => {
                if (filterByProjectId === undefined) return true;
                if (filterByProjectId === null) return i.project_id === null;
                return i.project_id === filterByProjectId || i.project_id === null;
            })
            .sort((a: any, b: any) => a.position - b.position);

        return {
            ...list,
            items: filteredItems,
            cards: filteredItems, // backward compat
        };
    });

    return {
        board: {
            ...board,
            project_name: boardProjectName
        } as PlannerBoard,
        lists: processedLists,
        labels: (labels || []) as PlannerLabel[],
        members
    };
}

// ============================================
// ITEM DETAILS
// ============================================

export async function getItemDetails(itemId: string): Promise<PlannerItem | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('planner').from('items')
        .select('*')
        .eq('id', itemId)
        .single();

    if (error) {
        console.error('Error fetching item:', error);
        return null;
    }

    return data as PlannerItem;
}

// ============================================
// LABELS
// ============================================

export async function getLabels(organizationId: string): Promise<PlannerLabel[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('planner').from('labels')
        .select('*')
        .eq('organization_id', organizationId)
        .order('position', { ascending: true });

    if (error) {
        console.error('Error fetching labels:', error);
        return [];
    }

    return data as PlannerLabel[];
}

// ============================================
// CALENDAR ITEMS (items with dates — tasks + events)
// ============================================

/**
 * Get all items that should appear in the calendar:
 * - All events (item_type = 'event')
 * - All tasks with start_at or due_at set
 */
export async function getCalendarItems(
    organizationId: string,
    options?: {
        projectId?: string | null;
        startDate?: Date;
        endDate?: Date;
    }
): Promise<PlannerItem[]> {
    const supabase = await createClient();

    let query = supabase
        .schema('planner').from('items')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .order('start_at', { ascending: true });

    // Filter by project
    if (options?.projectId === null) {
        query = query.is('project_id', null);
    } else if (options?.projectId) {
        query = query.eq('project_id', options.projectId);
    }

    // Filter by date range (events have start_at, tasks have start_at or due_at)
    if (options?.startDate) {
        // Items that end or are due after the range start
        query = query.or(
            `start_at.gte.${options.startDate.toISOString()},due_at.gte.${options.startDate.toISOString()}`
        );
    }
    if (options?.endDate) {
        query = query.or(
            `start_at.lte.${options.endDate.toISOString()},due_at.lte.${options.endDate.toISOString()}`
        );
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching calendar items:', error);
        return [];
    }

    // Filter: only events and tasks with dates
    const calendarItems = (data || []).filter((item: any) =>
        item.item_type === 'event' || item.start_at || item.due_at
    );

    // Fetch project names (cross-schema)
    const projectIds = [...new Set(calendarItems.map((e: any) => e.project_id).filter(Boolean))] as string[];
    let projectMap: Record<string, string> = {};
    if (projectIds.length > 0) {
        const { data: projects } = await supabase
            .schema('projects').from('projects')
            .select('id, name')
            .in('id', projectIds);
        projectMap = Object.fromEntries((projects || []).map((p: any) => [p.id, p.name]));
    }

    return calendarItems.map((item: any) => ({
        ...item,
        project_name: item.project_id ? projectMap[item.project_id] || null : null
    })) as PlannerItem[];
}

/**
 * Get a single item with attendees (for event detail)
 */
export async function getItemWithAttendees(itemId: string): Promise<PlannerItem | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('planner').from('items')
        .select(`
            *,
            attendees (
                id,
                member_id,
                status,
                created_at
            )
        `)
        .eq('id', itemId)
        .single();

    if (error) {
        console.error('Error fetching item with attendees:', error);
        return null;
    }

    // Fetch project name (cross-schema)
    let itemProjectName: string | null = null;
    if (data.project_id) {
        const { data: projectData } = await supabase
            .schema('projects').from('projects')
            .select('name')
            .eq('id', data.project_id)
            .single();
        itemProjectName = projectData?.name || null;
    }

    return {
        ...data,
        project_name: itemProjectName,
        attendees: data.attendees || []
    } as PlannerItem;
}

// ============================================
// BACKWARD COMPAT ALIASES (remove after migration)
// ============================================

/** @deprecated Use getItemDetails */
export const getCardDetails = getItemDetails;
/** @deprecated Use getCalendarItems */
export const getCalendarEvents = getCalendarItems;
/** @deprecated Use getItemWithAttendees */
export const getCalendarEvent = getItemWithAttendees;
