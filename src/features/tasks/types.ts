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

// Extended task with joined data for display (matches tasks_view)
export interface TaskView extends Task {
    unit_name?: string;
    unit_symbol?: string;
    division_name?: string;
    division_color?: string;
    // Parametric fields
    task_action_id?: string | null;
    task_element_id?: string | null;
    is_parametric?: boolean;
    parameter_values?: Record<string, string | number | boolean>;
    import_batch_id?: string | null;
    // Joined names from tasks_view
    action_name?: string | null;
    action_short_code?: string | null;
    element_name?: string | null;
    // Cost info (from task_costs_view, enriched by page)
    total_price?: number | null;
    price_valid_from?: string | null;
    recipe_count?: number;
}

export interface TaskDivision {
    id: string;
    name: string;
    code?: string | null;
    color?: string;
    description?: string;
    organization_id?: string | null;
    is_system?: boolean;
    order?: number | null;
    parent_id?: string | null;
    created_by?: string | null;
    updated_by?: string | null;
    import_batch_id?: string | null;
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

// Task Action (Action type: Ejecución, Demolición, Limpieza, etc.)
export interface TaskAction {
    id: string;
    name: string;
    short_code: string | null;
    description: string | null;
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
    task_action_id: string | null;
    task_element_id: string | null;
    is_parametric: boolean;
    parameter_values: Record<string, string | number | boolean>;
    // Joined data
    action?: TaskAction;
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
    name: string | null;
    is_public: boolean;
    region: string | null;
    rating_avg: number | null;
    rating_count: number;
    usage_count: number;
    created_at: string;
    updated_at: string;
    created_by: string | null;
    updated_by: string | null;
    is_deleted: boolean;
    import_batch_id: string | null;
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

// --- Recipe Resources (Multi-tipo) ---

export interface TaskRecipeMaterial {
    id: string;
    recipe_id: string;
    material_id: string;
    quantity: number;
    waste_percentage: number;
    /** Calculated by DB: quantity * (1 + waste_percentage / 100) */
    total_quantity: number;
    unit_id: string | null;
    notes: string | null;
    is_optional: boolean;
    organization_id: string;
    created_at: string;
    updated_at: string;
    // Joined fields (from query)
    material_name?: string;
    material_code?: string | null;
    unit_name?: string | null;
    unit_symbol?: string | null;
}

export interface TaskRecipeLabor {
    id: string;
    recipe_id: string;
    labor_type_id: string;
    quantity: number;
    unit_id: string | null;
    notes: string | null;
    is_optional: boolean;
    organization_id: string;
    created_at: string;
    updated_at: string;
    // Joined fields (from query)
    labor_name?: string;
    unit_name?: string | null;
    unit_symbol?: string | null;
}

// --- External Services (Servicios Externos) ---

export type ExternalServiceModality = 'execution_only' | 'turnkey';

export interface ExternalService {
    id: string;
    organization_id: string;
    name: string;
    modality: ExternalServiceModality;
    description: string | null;
    default_contact_id: string | null;
    is_deleted: boolean;
    created_at: string;
    updated_at: string;
    // Joined fields (from query)
    contact_name?: string | null;
}

export interface ExternalServicePrice {
    id: string;
    external_service_id: string;
    organization_id: string;
    currency_id: string;
    unit_price: number;
    valid_from: string;
    valid_to: string | null;
    created_at: string;
}

export interface TaskRecipeExternalService {
    id: string;
    recipe_id: string;
    external_service_id: string;
    organization_id: string;
    quantity: number;
    notes: string | null;
    contact_id: string | null;
    is_optional: boolean;
    created_at: string;
    updated_at: string;
    // Joined fields (from query)
    service_name?: string;
    service_modality?: ExternalServiceModality;
    service_description?: string | null;
    contact_name?: string | null;
    unit_name?: string | null;
    unit_symbol?: string | null;
}

/** Combined resources for a single recipe */
export interface RecipeResources {
    materials: TaskRecipeMaterial[];
    labor: TaskRecipeLabor[];
    externalServices: TaskRecipeExternalService[];
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
    name: z.string().min(1, "El nombre de la receta es obligatorio"),
    is_public: z.boolean().default(false),
    region: z.string().nullable().optional(),
});

export type TaskRecipeFormData = z.infer<typeof taskRecipeSchema>;

export const taskRecipeMaterialSchema = z.object({
    recipe_id: z.string().uuid(),
    material_id: z.string().uuid("Seleccioná un material"),
    quantity: z.coerce.number().positive("La cantidad debe ser mayor a 0"),
    waste_percentage: z.coerce.number().min(0, "La merma no puede ser negativa").default(0),
    unit_id: z.string().uuid().nullable().optional(),
    notes: z.string().nullable().optional(),
    is_optional: z.boolean().default(false),
});

export type TaskRecipeMaterialFormData = z.infer<typeof taskRecipeMaterialSchema>;

export const taskRecipeLaborSchema = z.object({
    recipe_id: z.string().uuid(),
    labor_type_id: z.string().uuid("Seleccioná un tipo de mano de obra"),
    quantity: z.coerce.number().positive("La cantidad debe ser mayor a 0"),
    unit_id: z.string().uuid().nullable().optional(),
    notes: z.string().nullable().optional(),
    is_optional: z.boolean().default(false),
});

export type TaskRecipeLaborFormData = z.infer<typeof taskRecipeLaborSchema>;

export const externalServiceSchema = z.object({
    name: z.string().min(1, "El nombre del servicio es obligatorio"),
    modality: z.enum(['execution_only', 'turnkey']).default('execution_only'),
    description: z.string().nullable().optional(),
    default_contact_id: z.string().uuid().nullable().optional(),
});

export type ExternalServiceFormData = z.infer<typeof externalServiceSchema>;

export const taskRecipeExternalServiceSchema = z.object({
    recipe_id: z.string().uuid(),
    external_service_id: z.string().uuid("Seleccioná un servicio externo"),
    quantity: z.coerce.number().positive("La cantidad debe ser mayor a 0").default(1),
    notes: z.string().nullable().optional(),
    contact_id: z.string().uuid().nullable().optional(),
    is_optional: z.boolean().default(false),
});

export type TaskRecipeExternalServiceFormData = z.infer<typeof taskRecipeExternalServiceSchema>;

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

