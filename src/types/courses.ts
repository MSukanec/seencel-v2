export type CourseStatus = 'available' | 'coming_soon' | 'maintenance';
export type CourseVisibility = 'public' | 'private';

export interface Course {
    id: string;
    slug: string;
    title: string;
    short_description: string | null;
    is_active: boolean;
    visibility: CourseVisibility;
    created_by: string | null;
    created_at: string;
    updated_at: string;
    price: number | null;
    is_deleted: boolean;
    deleted_at: string | null;
    status: CourseStatus;
}

export interface CourseModule {
    id: string;
    course_id: string;
    title: string;
    sort_index: number;
    created_at: string;
    updated_at: string;
    description: string | null;
    is_deleted: boolean;
    deleted_at: string | null;
    created_by: string | null;
}

export interface CourseLesson {
    id: string;
    module_id: string | null;
    title: string;
    vimeo_video_id: string | null;
    duration_sec: number | null;
    free_preview: boolean;
    sort_index: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CourseDetail {
    id: string;
    course_id: string;
    instructor_name: string | null;
    instructor_title: string | null;
    instructor_bio: string | null;
    badge_text: string | null;
    highlights: string[] | null;
    preview_video_id: string | null;
    seo_keywords: string[] | null;
    landing_sections: any | null; // Using any for jsonb for now, can be typed strictly later
    created_at: string;
    updated_at: string;
    image_bucket: string | null;
    image_path: string | null;
}

// Composite type for Course with details (useful for cards/lists)
export interface CourseWithDetails extends Course {
    details?: CourseDetail | null;
}
