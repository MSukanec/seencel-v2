// ============================================
// CONSTRUCTION TASKS TYPES
// ============================================

import { z } from "zod";

// Status enum
export type ConstructionTaskStatus = 'pending' | 'in_progress' | 'completed' | 'paused';

// Cost scope enum (matching DB)
export type CostScope = 'materials_and_labor' | 'labor_only' | 'materials_only';

// Schema for form validation
export const constructionTaskSchema = z.object({
    task_id: z.string().uuid().nullable().optional(),
    recipe_id: z.string().uuid().nullable().optional(),
    custom_name: z.string().min(1, "Nombre requerido").nullable().optional(),
    custom_unit: z.string().nullable().optional(),
    quantity: z.coerce.number().positive("La cantidad debe ser mayor a 0"),
    original_quantity: z.coerce.number().positive().nullable().optional(),
    planned_start_date: z.string().nullable().optional(),
    planned_end_date: z.string().nullable().optional(),
    actual_start_date: z.string().nullable().optional(),
    actual_end_date: z.string().nullable().optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'paused']).optional(),
    progress_percent: z.coerce.number().int().min(0).max(100).nullable().optional(),
    description: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    cost_scope: z.enum(['materials_and_labor', 'labor_only', 'materials_only']).default('materials_and_labor'),

    quote_item_id: z.string().uuid().nullable().optional(),
});

export type ConstructionTaskFormData = z.infer<typeof constructionTaskSchema>;

// Base construction task interface
export interface ConstructionTask {
    id: string;
    organization_id: string;
    project_id: string;
    task_id: string | null;
    recipe_id: string | null;
    quote_item_id: string | null;
    quantity: number | null;
    original_quantity: number | null;
    planned_start_date: string | null;
    planned_end_date: string | null;
    actual_start_date: string | null;
    actual_end_date: string | null;
    status: ConstructionTaskStatus;
    progress_percent: number | null;
    description: string | null;
    notes: string | null;
    cost_scope: CostScope;

    custom_name: string | null;
    custom_unit: string | null;
    is_deleted: boolean;
    deleted_at: string | null;
    created_at: string;
    updated_at: string | null;
    created_by: string | null;
    updated_by: string | null;
}

// View interface (from construction_tasks_view)
export interface ConstructionTaskView extends ConstructionTask {
    task_name: string | null;
    recipe_name: string | null;
    unit: string | null;
    division_name: string | null;
    cost_scope_label: string;
    quantity_variance: number | null;
    schedule_variance_days: number | null;
    quote_id: string | null;
    quote_name: string | null;
    phase_name: string | null;
}

// Status config for UI
export const STATUS_CONFIG: Record<ConstructionTaskStatus, { label: string; color: string; bgColor: string }> = {
    pending: { label: 'Pendiente', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
    in_progress: { label: 'En Progreso', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    completed: { label: 'Completada', color: 'text-green-500', bgColor: 'bg-green-500/10' },
    paused: { label: 'Pausada', color: 'text-gray-500', bgColor: 'bg-gray-500/10' },
};
