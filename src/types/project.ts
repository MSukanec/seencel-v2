export interface Project {
    id: string;
    organization_id: string;
    name: string;
    code: string | null;
    status: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    last_active_at: string | null;
    color: string | null;
    custom_color_hex: string | null;
    image_path: string | null;
    image_bucket: string | null;

    // Joined fields from View
    city: string | null;
    country: string | null;
    start_date: string | null;
    estimated_end: string | null;
    project_type_name: string | null;
    project_modality_name: string | null;
    currency_code: string | null;
    currency_symbol: string | null;
}

export interface ProjectType {
    id: string;
    name: string;
    is_default: boolean;
}

export interface ProjectModality {
    id: string;
    name: string;
    is_default: boolean;
}
