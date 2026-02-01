"use server";

import { createClient } from "@/lib/supabase/server";
import { KanbanBoard, KanbanCard, KanbanLabel, KanbanList, KanbanMember } from "./types";

// ============================================
// BOARDS
// ============================================

export async function getBoards(organizationId: string, projectId?: string | null): Promise<KanbanBoard[]> {
    const supabase = await createClient();

    let query = supabase
        .from('kanban_boards')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (projectId === null) {
        // Only org-level boards
        query = query.is('project_id', null);
    } else if (projectId) {
        // Only project-specific boards
        query = query.eq('project_id', projectId);
    }
    // If projectId is undefined, get all boards

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching boards:', error);
        return [];
    }

    return data as KanbanBoard[];
}

export async function getBoard(boardId: string): Promise<KanbanBoard | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('kanban_boards')
        .select('*')
        .eq('id', boardId)
        .single();

    if (error) {
        console.error('Error fetching board:', error);
        return null;
    }

    return data as KanbanBoard;
}

// ============================================
// LISTS & CARDS (Full board data)
// ============================================

export async function getBoardWithData(boardId: string, filterByProjectId?: string | null): Promise<{
    board: KanbanBoard;
    lists: KanbanList[];
    labels: KanbanLabel[];
    members: KanbanMember[];
} | null> {
    const supabase = await createClient();

    // Get board
    const { data: board, error: boardError } = await supabase
        .from('kanban_boards')
        .select(`
            *,
            projects (name)
        `)
        .eq('id', boardId)
        .single();

    if (boardError || !board) {
        console.error('Error fetching board:', boardError);
        return null;
    }

    // Get lists with cards
    const { data: lists, error: listsError } = await supabase
        .from('kanban_lists')
        .select(`
            *,
            kanban_cards (*)
        `)
        .eq('board_id', boardId)
        .eq('is_deleted', false)
        .order('position', { ascending: true });

    if (listsError) {
        console.error('Error fetching lists:', listsError);
        return null;
    }

    // Get labels for this organization
    const { data: labels, error: labelsError } = await supabase
        .from('kanban_labels')
        .select('*')
        .eq('organization_id', board.organization_id)
        .order('position', { ascending: true });

    if (labelsError) {
        console.error('Error fetching labels:', labelsError);
    }

    // Get organization members
    const { data: membersData, error: membersError } = await supabase
        .from('organization_members')
        .select(`
            user_id,
            user: users (
                id,
                full_name,
                avatar_url
            )
        `)
        .eq('organization_id', board.organization_id);

    if (membersError) {
        console.error('Error fetching members:', membersError);
    }

    const members: KanbanMember[] = (membersData || []).map((m: any) => ({
        id: m.user?.id || m.user_id,
        full_name: m.user?.full_name || null,
        avatar_url: m.user?.avatar_url || null,
    }));

    // Process lists - sort cards by position and optionally filter by project
    const processedLists: KanbanList[] = (lists || []).map(list => ({
        ...list,
        cards: (list.kanban_cards || [])
            .filter((c: any) => !c.is_deleted)
            // Filter by project_id if specified (undefined = show all, null = only org-level, string = specific project)
            .filter((c: any) => {
                if (filterByProjectId === undefined) return true; // Show all cards
                if (filterByProjectId === null) return c.project_id === null; // Only org-level
                return c.project_id === filterByProjectId || c.project_id === null; // Project + org-level
            })
            .sort((a: any, b: any) => a.position - b.position)
    }));

    return {
        board: {
            ...board,
            project_name: board.projects?.name || null
        } as KanbanBoard,
        lists: processedLists,
        labels: (labels || []) as KanbanLabel[],
        members
    };
}

// ============================================
// CARD DETAILS
// ============================================

export async function getCardDetails(cardId: string): Promise<KanbanCard | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('kanban_cards')
        .select('*')
        .eq('id', cardId)
        .single();

    if (error) {
        console.error('Error fetching card:', error);
        return null;
    }

    return data as KanbanCard;
}

// ============================================
// LABELS
// ============================================

export async function getLabels(organizationId: string): Promise<KanbanLabel[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('kanban_labels')
        .select('*')
        .eq('organization_id', organizationId)
        .order('position', { ascending: true });

    if (error) {
        console.error('Error fetching labels:', error);
        return [];
    }

    return data as KanbanLabel[];
}

// ============================================
// CALENDAR EVENTS
// ============================================

import { CalendarEvent } from "./types";

export async function getCalendarEvents(
    organizationId: string,
    options?: {
        projectId?: string | null;
        startDate?: Date;
        endDate?: Date;
    }
): Promise<CalendarEvent[]> {
    const supabase = await createClient();

    let query = supabase
        .from('calendar_events')
        .select(`
            *,
            projects (name)
        `)
        .eq('organization_id', organizationId)
        .is('deleted_at', null)
        .order('start_at', { ascending: true });

    // Filter by project if provided
    if (options?.projectId === null) {
        query = query.is('project_id', null);
    } else if (options?.projectId) {
        query = query.eq('project_id', options.projectId);
    }

    // Filter by date range if provided
    if (options?.startDate) {
        query = query.gte('start_at', options.startDate.toISOString());
    }
    if (options?.endDate) {
        query = query.lte('start_at', options.endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching calendar events:', error);
        return [];
    }

    return (data || []).map((event: any) => ({
        ...event,
        project_name: event.projects?.name || null
    })) as CalendarEvent[];
}

export async function getCalendarEvent(eventId: string): Promise<CalendarEvent | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('calendar_events')
        .select(`
            *,
            projects (name),
            calendar_event_attendees (
                id,
                member_id,
                status,
                created_at
            )
        `)
        .eq('id', eventId)
        .single();

    if (error) {
        console.error('Error fetching calendar event:', error);
        return null;
    }

    return {
        ...data,
        project_name: data.projects?.name || null,
        attendees: data.calendar_event_attendees || []
    } as CalendarEvent;
}


