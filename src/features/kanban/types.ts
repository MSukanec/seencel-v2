/**
 * Kanban Feature Types
 * Enterprise-grade Kanban system for SEENCEL
 */

// ============================================
// CORE TYPES
// ============================================

export type KanbanPriority = 'urgent' | 'high' | 'medium' | 'low' | 'none';

export interface KanbanBoard {
    id: string;
    name: string;
    description: string | null;
    organization_id: string;
    project_id: string | null;
    color: string | null;
    icon: string | null;
    is_template: boolean;
    is_archived: boolean;
    created_at: string;
    updated_at: string;
    created_by: string | null;
    // Computed
    list_count?: number;
    card_count?: number;
    project_name?: string | null;
}

export interface KanbanList {
    id: string;
    board_id: string;
    name: string;
    position: number;
    color: string | null;
    limit_wip: number | null;
    auto_complete: boolean;
    is_collapsed: boolean;
    created_at: string;
    // Computed
    cards?: KanbanCard[];
}

export interface KanbanCard {
    id: string;
    list_id: string;
    board_id: string;
    title: string;
    description: string | null;
    position: number;
    priority: KanbanPriority;
    due_date: string | null;
    start_date: string | null;
    is_completed: boolean;
    completed_at: string | null;
    is_archived: boolean;
    cover_color: string | null;
    cover_image_url: string | null;
    estimated_hours: number | null;
    actual_hours: number | null;
    assigned_to: string | null;
    created_at: string;
    updated_at: string | null;
    created_by: string | null;
    // Computed / Joined
    labels?: KanbanLabel[];
    assignees?: KanbanCardAssignee[];
    comment_count?: number;
    attachment_count?: number;
    checklist_progress?: {
        total: number;
        completed: number;
    };
}

export interface KanbanLabel {
    id: string;
    organization_id: string;
    name: string;
    color: string;
    description: string | null;
    position: number;
    is_default: boolean;
}

export interface KanbanCardAssignee {
    member_id: string;
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
}

export interface KanbanMember {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
}

export interface KanbanChecklist {
    id: string;
    card_id: string;
    title: string;
    position: number;
    items?: KanbanChecklistItem[];
}

export interface KanbanChecklistItem {
    id: string;
    checklist_id: string;
    content: string;
    is_completed: boolean;
    completed_at: string | null;
    position: number;
    due_date: string | null;
    assigned_to: string | null;
}

export interface KanbanComment {
    id: string;
    card_id: string;
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

export interface CreateCardInput {
    list_id: string;
    board_id: string;
    title: string;
    description?: string | null;
    priority?: KanbanPriority;
    due_date?: string | null;
    start_date?: string | null;
    estimated_hours?: number | null;
    assigned_to?: string | null;
    cover_image_url?: string | null;
}

export interface UpdateCardInput {
    title?: string;
    description?: string | null;
    priority?: KanbanPriority;
    position?: number;
    list_id?: string;
    due_date?: string | null;
    start_date?: string | null;
    estimated_hours?: number | null;
    is_deleted?: boolean;
    deleted_at?: string | null;
    cover_image_url?: string | null;
    cover_color?: string | null;
    is_archived?: boolean;
    assigned_to?: string | null;
}

// ============================================
// UI HELPERS
// ============================================

export const PRIORITY_CONFIG: Record<KanbanPriority, { label: string; color: string; bgColor: string }> = {
    urgent: { label: 'Urgente', color: 'text-red-600', bgColor: 'bg-red-500' },
    high: { label: 'Alta', color: 'text-orange-600', bgColor: 'bg-orange-500' },
    medium: { label: 'Media', color: 'text-yellow-600', bgColor: 'bg-yellow-500' },
    low: { label: 'Baja', color: 'text-green-600', bgColor: 'bg-green-500' },
    none: { label: 'Sin prioridad', color: 'text-muted-foreground', bgColor: 'bg-muted' },
};

export const DEFAULT_LIST_COLORS = [
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#d946ef', // Fuchsia
    '#f43f5e', // Rose
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
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
