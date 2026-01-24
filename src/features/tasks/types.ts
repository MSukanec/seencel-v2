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
    description?: string;
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
