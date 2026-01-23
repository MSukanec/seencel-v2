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

// Material linked to a task (the "recipe")
export interface TaskMaterial {
    id: string;
    task_id: string;
    material_id: string;
    material_name: string;
    unit_name: string | null;
    amount: number | null;
    is_system: boolean;
}

