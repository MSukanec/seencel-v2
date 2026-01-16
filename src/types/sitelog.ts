export interface SiteLogType {
    id: string;
    organization_id: string | null;
    name: string;
    description: string | null;
    is_system: boolean;
    is_deleted: boolean;
}

export interface SiteLog {
    id: string;
    organization_id: string;
    project_id: string;

    // Core Content
    comments: string | null; // Was 'content'
    log_date: string;

    // Metadata
    weather: string | null; // Was 'weather_info' (object) -> now string ("sunny", "none", etc.)
    severity: string | null; // "low", "medium", "high"
    status: string | null; // "approved"
    is_public: boolean;
    is_favorite: boolean;

    // Media from media_links -> media_files
    media: {
        id: string;
        url: string;
        type: string; // 'image', 'video', 'pdf', etc.
        name: string | null;
    }[] | null;

    tags: string[] | null;

    // AI
    ai_summary: string | null;
    ai_tags: string[] | null;
    ai_analyzed: boolean;

    // Relations
    entry_type_id: string | null;
    entry_type?: SiteLogType | null;

    // Tracking
    created_by: string | null;
    updated_by: string | null;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
    deleted_at: string | null;

    // Expanded Author (joined)
    author?: {
        id: string;
        user?: {
            full_name: string | null;
            email: string | null;
            avatar_url: string | null;
        } | null;
    } | null;
}
