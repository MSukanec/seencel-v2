// ============================================================================
// FILE TYPES
// ============================================================================

export interface MediaFile {
    id: string;
    file_name: string;
    file_type: string;
    file_size: number;
    bucket: string;
    file_path: string;
    created_at: string;
    signed_url?: string;
}

export interface Folder {
    id: string;
    organization_id: string;
    project_id: string | null;
    name: string;
    parent_id: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
    /** Virtual: count of files in this folder (computed in query) */
    file_count?: number;
}

export interface FileItem {
    id: string;
    category: string;
    project_id?: string | null;
    organization_id: string;
    folder_id?: string | null;
    media_files: MediaFile;
    // FK fields that determine source module
    site_log_id?: string | null;
    client_payment_id?: string | null;
    material_payment_id?: string | null;
    material_purchase_id?: string | null;
    subcontract_payment_id?: string | null;
    general_cost_payment_id?: string | null;
    labor_payment_id?: string | null;
    partner_contribution_id?: string | null;
    partner_withdrawal_id?: string | null;
    pin_id?: string | null;
    forum_thread_id?: string | null;
    course_id?: string | null;
    testimonial_id?: string | null;
}
