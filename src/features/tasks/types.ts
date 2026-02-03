// Types for Technical Catalog / Tasks module

export interface Task {
    id: string;
    created_at: string;
    updated_at: string | null;

    // Identification
    code: string | null;
    name: string | null;
    custom_name: string | null;
    description: string | null;

    // Classification
    unit_id: string;
    task_division_id: string | null;

    // Ownership
    organization_id: string | null;
    is_system: boolean;

    // State
    is_published: boolean;

    // Soft delete
    is_deleted: boolean;
    deleted_at: string | null;
}

// Extended task with joined data for display
export interface TaskView extends Task {
    unit_name?: string;
    division_name?: string;
    division_color?: string;
}

export interface TaskDivision {
    id: string;
    name: string;
    code?: string | null;
    color?: string;
    description?: string;
    organization_id?: string | null;
    order?: number | null;
    parent_id?: string | null;
}

export interface Unit {
    id: string;
    name: string;
    symbol: string;
    applicable_to?: string[];
}

// Grouped structure for UI display
export interface TasksByDivision {
    division: TaskDivision | null;
    tasks: TaskView[];
}

export interface TaskMaterial {
    id: string;
    task_id: string;
    material_id: string;
    material_name: string;
    unit_name: string | null;
    amount: number | null;
    is_system: boolean;
}

// Parameter type for reusable task parameters
export type ParameterType = 'text' | 'number' | 'select' | 'material' | 'boolean';

export interface TaskParameter {
    id: string;
    created_at: string;
    updated_at: string | null;
    slug: string;
    label: string;
    description: string | null;
    type: ParameterType;
    default_value: string | null;
    validation_rules: Record<string, unknown> | null;
    expression_template: string | null;
    is_required: boolean;
    order: number | null;
    is_deleted: boolean;
    deleted_at: string | null;
    options?: TaskParameterOption[];
}

export interface TaskParameterOption {
    id: string;
    parameter_id: string;
    name: string | null;
    label: string;
    value: string | null;
    short_code: string | null; // For code generation (e.g., LH = ladrillo hueco)
    material_id: string | null; // Material for auto-hydration of recipes
    description: string | null;
    unit_id: string | null;
    order: number | null;
    is_deleted: boolean;
}

// Task Kind (Action type: Ejecución, Instalación, etc.)
export interface TaskKind {
    id: string;
    code: string;
    name: string;
    short_code: string | null;
    description: string | null;
    order: number | null;
    is_active: boolean;
}

// Task Element (Object: Contrapiso, Muro, etc.)
export interface TaskElement {
    id: string;
    name: string;
    slug: string;
    code: string | null; // Short code like MUR, CTR, VIG
    description: string | null;
    icon: string | null;
    order: number | null;
    is_deleted: boolean;
}

// Extended Task with parametric fields
export interface ParametricTask extends Task {
    task_kind_id: string | null;
    task_element_id: string | null;
    is_parametric: boolean;
    parameter_values: Record<string, string | number | boolean>;
    // Joined data
    kind?: TaskKind;
    element?: TaskElement;
}

// ============================================
// TASK RECIPES TYPES
// ============================================

import { z } from "zod";

export interface TaskRecipe {
    id: string;
    task_id: string;
    organization_id: string;
    is_public: boolean;
    is_system: boolean;
    is_anonymous: boolean;
    region: string | null;
    rating_avg: number | null;
    rating_count: number;
    usage_count: number;
    created_at: string;
    updated_at: string;
    created_by: string | null;
    updated_by: string | null;
    is_deleted: boolean;
}

export interface TaskRecipeView extends TaskRecipe {
    task_name: string | null;
    task_custom_name: string | null;
    task_display_name: string | null;
    division_name: string | null;
    unit_name: string | null;
    org_name: string | null;
    item_count: number;
}

export interface TaskRecipeItem {
    id: string;
    recipe_id: string;
    material_id: string | null;
    material_name: string;
    material_category: string | null;
    quantity: number;
    unit_id: string | null;
    unit_name: string | null;
    display_order: number;
    notes: string | null;
    is_optional: boolean;
    created_at: string;
    updated_at: string;
}

export interface TaskRecipeRating {
    id: string;
    recipe_id: string;
    organization_id: string;
    user_id: string;
    rating: number;
    comment: string | null;
    is_verified_usage: boolean;
    construction_task_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface OrganizationRecipePreference {
    id: string;
    organization_id: string;
    task_id: string;
    recipe_id: string;
    adopted_at: string;
}

// FORM SCHEMAS

export const taskRecipeSchema = z.object({
    task_id: z.string().uuid(),
    is_public: z.boolean().default(false),
    is_anonymous: z.boolean().default(false),
    region: z.string().nullable().optional(),
});

export type TaskRecipeFormData = z.infer<typeof taskRecipeSchema>;

export const taskRecipeItemSchema = z.object({
    recipe_id: z.string().uuid(),
    material_id: z.string().uuid().nullable().optional(),
    material_name: z.string().min(1, "Nombre del material requerido"),
    material_category: z.string().nullable().optional(),
    quantity: z.coerce.number().positive("La cantidad debe ser mayor a 0"),
    unit_id: z.string().uuid().nullable().optional(),
    unit_name: z.string().nullable().optional(),
    display_order: z.coerce.number().int().default(0),
    notes: z.string().nullable().optional(),
    is_optional: z.boolean().default(false),
});

export type TaskRecipeItemFormData = z.infer<typeof taskRecipeItemSchema>;

export const taskRecipeRatingSchema = z.object({
    recipe_id: z.string().uuid(),
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().nullable().optional(),
});

export type TaskRecipeRatingFormData = z.infer<typeof taskRecipeRatingSchema>;

// UI HELPERS

export const RATING_LABELS: Record<number, string> = {
    1: "Muy mala",
    2: "Mala",
    3: "Regular",
    4: "Buena",
    5: "Excelente",
};

export function getRatingLabel(rating: number): string {
    return RATING_LABELS[Math.round(rating)] || "Sin calificación";
}

export function formatRating(rating: number | null): string {
    if (rating === null) return "—";
    return rating.toFixed(1);
}

