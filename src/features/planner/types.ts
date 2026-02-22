/**
 * Planner V2 Types
 * Unified Planner system — Tasks and Events are the same entity (PlannerItem)
 * Kanban and Calendar are VIEWS of the same data.
 */

// ============================================
// CORE TYPES
// ============================================

export type PlannerItemType = 'task' | 'event';
export type PlannerItemStatus = 'todo' | 'doing' | 'done' | 'blocked' | 'cancelled';
export type PlannerPriority = 'urgent' | 'high' | 'medium' | 'low' | 'none';
export type AttendeeStatus = 'pending' | 'accepted' | 'declined' | 'tentative';

/**
 * Unified Planner Item — the core entity.
 * Tasks and Events share this shape; item_type differentiates them.
 */
export interface PlannerItem {
    id: string;
    organization_id: string;
    project_id: string | null;
    item_type: PlannerItemType;

    // Content
    title: string;
    description: string | null;
    color: string | null;

    // Time
    start_at: string | null;        // ISO timestamp
    due_at: string | null;          // Deadline (tasks)
    end_at: string | null;          // End of event (events)
    is_all_day: boolean;
    timezone: string;

    // Status (tasks)
    status: PlannerItemStatus;
    priority: PlannerPriority;
    is_completed: boolean;
    completed_at: string | null;

    // Effort (tasks)
    estimated_hours: number | null;
    actual_hours: number | null;

    // Assignment
    assigned_to: string | null;     // member_id

    // Event-specific
    location: string | null;
    recurrence_rule: string | null;
    recurrence_end_at: string | null;
    parent_item_id: string | null;

    // Source linking
    source_type: string | null;
    source_id: string | null;

    // Visual (kanban)
    cover_image_url: string | null;
    cover_color: string | null;

    // Kanban positioning
    board_id: string | null;
    list_id: string | null;
    position: number;

    // Soft delete + archive
    is_archived: boolean;
    archived_at: string | null;
    is_deleted: boolean;
    deleted_at: string | null;

    // Audit
    created_by: string | null;
    updated_by: string | null;
    created_at: string;
    updated_at: string;

    // Computed / Joined (from views or manual joins)
    list_name?: string | null;
    list_position?: number;
    board_name?: string | null;
    project_name?: string | null;
    assigned_to_user_id?: string | null;
    labels?: PlannerLabel[];
    comment_count?: number;
    attachment_count?: number;
    checklist_progress?: {
        total: number;
        completed: number;
    };
    attendees?: PlannerAttendee[];
}

export interface PlannerBoard {
    id: string;
    organization_id: string;
    project_id: string | null;
    name: string;
    description: string | null;
    color: string | null;
    icon: string | null;
    default_list_id: string | null;
    is_template: boolean;
    template_id: string | null;
    settings: Record<string, unknown>;
    is_archived: boolean;
    is_deleted: boolean;
    created_by: string | null;
    updated_by: string | null;
    created_at: string;
    updated_at: string;
    // Computed
    list_count?: number;
    item_count?: number;
    completed_item_count?: number;
    project_name?: string | null;
}

export interface PlannerList {
    id: string;
    board_id: string;
    organization_id: string;
    name: string;
    position: number;
    color: string | null;
    limit_wip: number | null;
    auto_complete: boolean;
    is_collapsed: boolean;
    created_at: string;
    // Computed
    items?: PlannerItem[];
    /** @deprecated Use items — backward compat for kanban components */
    cards?: PlannerItem[];
}

export interface PlannerLabel {
    id: string;
    organization_id: string;
    name: string;
    color: string;
    description: string | null;
    position: number;
    is_default: boolean;
}

export interface PlannerMember {
    id: string;         // organization_members.id — FK target for assigned_to
    full_name: string | null;
    avatar_url: string | null;
}

export interface PlannerChecklist {
    id: string;
    item_id: string;
    title: string;
    position: number;
    items?: PlannerChecklistItem[];
}

export interface PlannerChecklistItem {
    id: string;
    checklist_id: string;
    content: string;
    is_completed: boolean;
    completed_at: string | null;
    position: number;
    due_date: string | null;
    assigned_to: string | null;
}

export interface PlannerComment {
    id: string;
    item_id: string;
    author_id: string | null;
    content: string;
    created_at: string;
    updated_at: string | null;
    // Joined
    author?: {
        full_name: string | null;
        avatar_url: string | null;
    };
}

export interface PlannerAttendee {
    id: string;
    item_id: string;
    member_id: string;
    status: AttendeeStatus;
    created_at: string;
    // Joined
    member?: {
        full_name: string | null;
        avatar_url: string | null;
    };
}

// ============================================
// FORM TYPES
// ============================================

export interface CreateBoardInput {
    name: string;
    description?: string;
    organization_id: string;
    project_id?: string | null;
    color?: string;
    icon?: string;
}

export interface UpdateBoardInput {
    name?: string;
    description?: string;
    color?: string;
    icon?: string;
    is_archived?: boolean;
}

export interface CreateListInput {
    board_id: string;
    name: string;
    position?: number;
    color?: string;
}

export interface CreateItemInput {
    organization_id: string;
    item_type: PlannerItemType;
    title: string;
    description?: string | null;
    color?: string | null;
    // Time
    start_at?: string | null;
    due_at?: string | null;
    end_at?: string | null;
    is_all_day?: boolean;
    timezone?: string;
    // Task
    priority?: PlannerPriority;
    estimated_hours?: number | null;
    assigned_to?: string | null;
    // Event
    location?: string | null;
    // Kanban
    board_id?: string | null;
    list_id?: string | null;
    // Context
    project_id?: string | null;
    cover_image_url?: string | null;
    // Source
    source_type?: string | null;
    source_id?: string | null;
}

export interface UpdateItemInput {
    title?: string;
    description?: string | null;
    color?: string | null;
    // Time
    start_at?: string | null;
    due_at?: string | null;
    end_at?: string | null;
    is_all_day?: boolean;
    // Task
    status?: PlannerItemStatus;
    priority?: PlannerPriority;
    is_completed?: boolean;
    estimated_hours?: number | null;
    actual_hours?: number | null;
    assigned_to?: string | null;
    // Event
    location?: string | null;
    // Kanban
    position?: number;
    list_id?: string | null;
    // Visual
    cover_image_url?: string | null;
    cover_color?: string | null;
    // Soft delete / archive
    is_archived?: boolean;
    is_deleted?: boolean;
    deleted_at?: string | null;
    // Context
    project_id?: string | null;
}

// ============================================
// UI HELPERS
// ============================================

export const PRIORITY_CONFIG: Record<PlannerPriority, { label: string; color: string; bgColor: string }> = {
    urgent: { label: 'Urgente', color: 'text-red-600', bgColor: 'bg-red-500' },
    high: { label: 'Alta', color: 'text-orange-600', bgColor: 'bg-orange-500' },
    medium: { label: 'Media', color: 'text-yellow-600', bgColor: 'bg-yellow-500' },
    low: { label: 'Baja', color: 'text-green-600', bgColor: 'bg-green-500' },
    none: { label: 'Sin prioridad', color: 'text-muted-foreground', bgColor: 'bg-muted' },
};

export const STATUS_CONFIG: Record<PlannerItemStatus, { label: string; color: string }> = {
    todo: { label: 'Por hacer', color: 'text-muted-foreground' },
    doing: { label: 'En progreso', color: 'text-blue-500' },
    done: { label: 'Hecho', color: 'text-green-500' },
    blocked: { label: 'Bloqueado', color: 'text-red-500' },
    cancelled: { label: 'Cancelado', color: 'text-muted-foreground' },
};

export const DEFAULT_LIST_COLORS = [
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#d946ef', // Fuchsia
    '#f43f5e', // Rose
    '#f97316', // Orange
    '#eab308', // Yellow
    '#14b8a6', // Teal
    '#0ea5e9', // Sky
    '#84cc16', // Lime
];

export const DEFAULT_LABEL_COLORS = [
    '#ef4444', // Red
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
    '#8b5cf6', // Violet
    '#d946ef', // Fuchsia
    '#f43f5e', // Rose
    '#6b7280', // Gray
];

export const EVENT_COLORS = [
    { name: 'Azul', value: '#3b82f6' },
    { name: 'Verde', value: '#22c55e' },
    { name: 'Rojo', value: '#ef4444' },
    { name: 'Naranja', value: '#f97316' },
    { name: 'Violeta', value: '#8b5cf6' },
    { name: 'Rosa', value: '#ec4899' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Amarillo', value: '#eab308' },
];

// ============================================
// BACKWARD COMPAT ALIASES  (temporary — remove after component migration)
// ============================================

/** @deprecated Use PlannerItem */
export type KanbanCard = PlannerItem;
/** @deprecated Use PlannerBoard */
export type KanbanBoard = PlannerBoard;
/** @deprecated Use PlannerList */
export type KanbanList = PlannerList;
/** @deprecated Use PlannerLabel */
export type KanbanLabel = PlannerLabel;
/** @deprecated Use PlannerMember */
export type KanbanMember = PlannerMember;
/** @deprecated Use PlannerPriority */
export type KanbanPriority = PlannerPriority;
/** @deprecated Use PlannerChecklist */
export type KanbanChecklist = PlannerChecklist;
/** @deprecated Use PlannerChecklistItem */
export type KanbanChecklistItem = PlannerChecklistItem;
/** @deprecated Use PlannerComment */
export type KanbanComment = PlannerComment;
/** @deprecated Use PlannerItem */
export type CalendarEvent = PlannerItem;
/** @deprecated Use PlannerAttendee */
export type CalendarEventAttendee = PlannerAttendee;
/** @deprecated Use AttendeeStatus */
export type CalendarEventStatus = PlannerItemStatus;
/** @deprecated Use CreateItemInput */
export type CreateCardInput = CreateItemInput;
/** @deprecated Use UpdateItemInput */
export type UpdateCardInput = UpdateItemInput;
/** @deprecated Use CreateItemInput */
export type CreateCalendarEventInput = CreateItemInput;
/** @deprecated Use UpdateItemInput */
export type UpdateCalendarEventInput = UpdateItemInput;
/** @deprecated Use string */
export type CalendarEventSourceType = string | null;

export const EVENT_STATUS_CONFIG = STATUS_CONFIG;
