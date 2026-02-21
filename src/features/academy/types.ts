// ============================================
// Academy Feature Types (DB types)
// Consolidated from src/types/courses.ts
// Marketing/Landing types → see course-marketing-data.ts
// ============================================

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
    image_path: string | null;
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
    video_id: string | null;
    video_provider: 'youtube' | 'vimeo';
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
    landing_sections: any | null;
    created_at: string;
    updated_at: string;
    image_bucket: string | null;
    image_path: string | null;
}

// Composite type for Course with details (useful for cards/lists)
export interface CourseWithDetails extends Course {
    details?: CourseDetail | null;
}

export type LessonNoteType = 'summary' | 'marker' | 'todo' | 'question';

export interface LessonNote {
    id: string;
    user_id: string;
    lesson_id: string;
    body: string;
    time_sec: number | null;
    is_pinned: boolean;
    created_at: string;
    updated_at: string;
    note_type: LessonNoteType;
}

// Marker is a LessonNote with note_type = 'marker' and time_sec required
export interface LessonMarker extends Omit<LessonNote, 'time_sec' | 'note_type'> {
    time_sec: number;
    note_type: 'marker';
}

export interface LessonProgress {
    id: string;
    user_id: string;
    lesson_id: string;
    progress_pct: number;
    last_position_sec: number;
    completed_at: string | null;
    updated_at: string;
    is_completed: boolean;
    is_favorite: boolean;
    created_at: string;
}

// Summary is a LessonNote with note_type = 'summary' and no time_sec
export interface LessonSummary extends Omit<LessonNote, 'time_sec' | 'note_type'> {
    time_sec: null;
    note_type: 'summary';
}
