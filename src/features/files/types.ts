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

export interface FileItem {
    id: string;
    category: string;
    project_id?: string | null;
    organization_id: string;
    media_files: MediaFile;
}
