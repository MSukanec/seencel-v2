'use server';

import { createClient } from "@/lib/supabase/server";
import { CourseWithDetails } from "@/types/courses";

export async function getCourses(): Promise<CourseWithDetails[]> {
    const supabase = await createClient();

    // Fetch courses with their details
    // We're doing a left join on course_details
    const { data, error } = await supabase
        .from('courses')
        .select(`
      *,
      details:course_details(*)
    `)
        .eq('is_deleted', false)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching courses:', error);
        return [];
    }

    return data as CourseWithDetails[];
}

export async function getLatestCourses(limit: number = 3): Promise<CourseWithDetails[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('courses')
        .select(`
        *,
        details:course_details(*)
      `)
        .eq('is_deleted', false)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching latest courses:', error);
        return [];
    }

    return data as CourseWithDetails[];
}

export async function getCourseBySlug(slug: string): Promise<CourseWithDetails | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('courses')
        .select(`
      *,
      details:course_details(*)
    `)
        .eq('slug', slug)
        .eq('is_deleted', false)
        .eq('is_active', true)
        .maybeSingle();

    if (error) {
        console.error('Error fetching course by slug:', JSON.stringify(error, null, 2));
        return null;
    }

    return data as CourseWithDetails;
}

export async function getCourseContent(courseId: string) {
    const supabase = await createClient();

    // Fetch modules and lessons
    const { data: modules, error: modulesError } = await supabase
        .from('course_modules')
        .select(`
      *,
      lessons:course_lessons(*)
    `)
        .eq('course_id', courseId)
        .eq('is_deleted', false)
        .order('sort_index', { ascending: true });

    if (modulesError) {
        console.error('Error fetching course content:', modulesError);
        return [];
    }

    // Sort lessons within modules (Supabase order() on nested resource is tricky, so sorting in JS might be safer, 
    // but let's try to assume they come somewhat ordered or correct it in UI. 
    // Actually, we can't easily order nested relations in one query with exact control in all Supabase versions without separate queries or specific syntax.
    // For now, let's sort in code to be safe.)

    const sortedModules = modules.map(module => ({
        ...module,
        lessons: (module.lessons || []).sort((a: any, b: any) => a.sort_index - b.sort_index)
    }));

    return sortedModules;
}

/**
 * Get the current user's course enrollments
 * Returns a Set of course IDs that the user is enrolled in (active or completed)
 */
export async function getUserEnrollments(): Promise<Set<string>> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return new Set();
    }

    // Get internal user ID
    const { data: internalUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!internalUser) {
        return new Set();
    }

    const { data: enrollments, error } = await supabase
        .from('course_enrollments')
        .select('course_id')
        .eq('user_id', internalUser.id)
        .in('status', ['active', 'completed']);

    if (error) {
        console.error('Error fetching enrollments:', error);
        return new Set();
    }

    return new Set(enrollments.map(e => e.course_id));
}

/**
 * Get the current user's markers for all lessons in a course
 * Returns markers ordered by time within each lesson
 */
export async function getUserLessonMarkers(courseId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return [];
    }

    // Get internal user ID
    const { data: internalUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!internalUser) {
        return [];
    }

    // Get all lesson IDs for this course
    const { data: lessons } = await supabase
        .from('course_lessons')
        .select('id, module_id!inner(course_id)')
        .eq('module_id.course_id', courseId);

    if (!lessons || lessons.length === 0) {
        return [];
    }

    const lessonIds = lessons.map(l => l.id);

    // Fetch markers for all lessons in the course
    const { data: markers, error } = await supabase
        .from('course_lesson_notes')
        .select('*')
        .eq('user_id', internalUser.id)
        .eq('note_type', 'marker')
        .in('lesson_id', lessonIds)
        .not('time_sec', 'is', null)
        .order('time_sec', { ascending: true });

    if (error) {
        console.error('Error fetching lesson markers:', error);
        return [];
    }

    return markers;
}

/**
 * Get lesson progress for all lessons in a course
 */
export async function getUserLessonProgress(courseId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return [];
    }

    // Get internal user ID
    const { data: internalUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!internalUser) {
        return [];
    }

    // Get all lesson IDs for this course via modules
    const { data: lessons } = await supabase
        .from('course_lessons')
        .select('id, module_id!inner(course_id)')
        .eq('module_id.course_id', courseId);

    if (!lessons || lessons.length === 0) {
        return [];
    }

    const lessonIds = lessons.map(l => l.id);

    // Fetch progress for all lessons
    const { data: progress, error } = await supabase
        .from('course_lesson_progress')
        .select('*')
        .eq('user_id', internalUser.id)
        .in('lesson_id', lessonIds);

    if (error) {
        console.error('Error fetching lesson progress:', error);
        return [];
    }

    return progress;
}

/**
 * Get the last viewed lesson for a course (to resume watching)
 */
export async function getLastViewedLesson(courseId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return null;
    }

    // Get internal user ID
    const { data: internalUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!internalUser) {
        return null;
    }

    // Get the most recently updated progress entry for this course
    const { data: progress, error } = await supabase
        .from('course_lesson_progress')
        .select(`
            *,
            lesson:course_lessons!inner(
                id,
                module_id,
                title,
                module:course_modules!inner(course_id)
            )
        `)
        .eq('user_id', internalUser.id)
        .eq('lesson.module.course_id', courseId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error('Error fetching last viewed lesson:', error);
        return null;
    }

    return progress;
}

/**
 * Mark a lesson as completed
 */
export async function markLessonCompleted(lessonId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    // Get internal user ID
    const { data: internalUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!internalUser) {
        return { success: false, error: 'User not found' };
    }

    // Upsert progress record
    const { error } = await supabase
        .from('course_lesson_progress')
        .upsert({
            user_id: internalUser.id,
            lesson_id: lessonId,
            is_completed: true,
            completed_at: new Date().toISOString(),
            progress_pct: 100
        }, {
            onConflict: 'user_id,lesson_id'
        });

    if (error) {
        console.error('Error marking lesson completed:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Toggle lesson completion status
 */
export async function toggleLessonCompleted(lessonId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    // Get internal user ID
    const { data: internalUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!internalUser) {
        return { success: false, error: 'User not found' };
    }

    // Check current status
    const { data: current } = await supabase
        .from('course_lesson_progress')
        .select('is_completed')
        .eq('user_id', internalUser.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();

    const newCompleted = !(current?.is_completed ?? false);

    // Upsert progress record
    const { error } = await supabase
        .from('course_lesson_progress')
        .upsert({
            user_id: internalUser.id,
            lesson_id: lessonId,
            is_completed: newCompleted,
            completed_at: newCompleted ? new Date().toISOString() : null,
            progress_pct: newCompleted ? 100 : (current ? undefined : 0)
        }, {
            onConflict: 'user_id,lesson_id'
        });

    if (error) {
        console.error('Error toggling lesson completion:', error);
        return { success: false, error: error.message };
    }

    return { success: true, isCompleted: newCompleted };
}

/**
 * Update the last position (for resume functionality)
 */
export async function updateLessonPosition(lessonId: string, positionSec: number) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    // Get internal user ID 
    const { data: internalUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!internalUser) {
        return { success: false, error: 'User not found' };
    }

    // Upsert progress record with position
    const { error } = await supabase
        .from('course_lesson_progress')
        .upsert({
            user_id: internalUser.id,
            lesson_id: lessonId,
            last_position_sec: positionSec
        }, {
            onConflict: 'user_id,lesson_id'
        });

    if (error) {
        console.error('Error updating lesson position:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Get lesson summaries for all lessons in a course
 */
export async function getUserLessonSummaries(courseId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return [];
    }

    // Get internal user ID
    const { data: internalUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!internalUser) {
        return [];
    }

    // Get all lesson IDs for this course via modules
    const { data: lessons } = await supabase
        .from('course_lessons')
        .select('id, module_id!inner(course_id)')
        .eq('module_id.course_id', courseId);

    if (!lessons || lessons.length === 0) {
        return [];
    }

    const lessonIds = lessons.map(l => l.id);

    // Fetch summaries for all lessons
    const { data: summaries, error } = await supabase
        .from('course_lesson_notes')
        .select('*')
        .eq('user_id', internalUser.id)
        .eq('note_type', 'summary')
        .in('lesson_id', lessonIds);

    if (error) {
        console.error('Error fetching lesson summaries:', error);
        return [];
    }

    return summaries;
}

export interface LessonSummaryWithDetails {
    id: string;
    lesson_id: string;
    body: string;
    is_pinned: boolean;
    created_at: string;
    updated_at: string;
    lesson: {
        id: string;
        title: string;
        video_id: string | null;
        duration_sec: number | null;
        module: {
            id: string;
            title: string;
        };
    };
}

/**
 * Get lesson summaries with lesson and module details for course notes view
 */
export async function getUserLessonSummariesWithDetails(courseId: string): Promise<LessonSummaryWithDetails[]> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return [];
    }

    // Get internal user ID
    const { data: internalUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!internalUser) {
        return [];
    }

    // Fetch summaries with lesson and module info
    const { data: summaries, error } = await supabase
        .from('course_lesson_notes')
        .select(`
            id,
            lesson_id,
            body,
            is_pinned,
            created_at,
            updated_at,
            lesson:course_lessons!inner(
                id,
                title,
                video_id,
                duration_sec,
                module:course_modules!inner(
                    id,
                    title,
                    course_id
                )
            )
        `)
        .eq('user_id', internalUser.id)
        .eq('note_type', 'summary')
        .eq('lesson.module.course_id', courseId)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error fetching lesson summaries with details:', error);
        return [];
    }

    return (summaries || []) as unknown as LessonSummaryWithDetails[];
}

/**
 * Save or update a lesson summary (apuntes)
 */
export async function saveLessonSummary(lessonId: string, body: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    // Get internal user ID
    const { data: internalUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!internalUser) {
        return { success: false, error: 'User not found' };
    }

    // Check if summary already exists
    const { data: existing } = await supabase
        .from('course_lesson_notes')
        .select('id')
        .eq('user_id', internalUser.id)
        .eq('lesson_id', lessonId)
        .eq('note_type', 'summary')
        .maybeSingle();

    if (existing) {
        // Update existing summary
        const { error } = await supabase
            .from('course_lesson_notes')
            .update({ body })
            .eq('id', existing.id);

        if (error) {
            console.error('Error updating lesson summary:', error);
            return { success: false, error: error.message };
        }
    } else {
        // Insert new summary
        const { error } = await supabase
            .from('course_lesson_notes')
            .insert({
                user_id: internalUser.id,
                lesson_id: lessonId,
                body,
                note_type: 'summary',
                time_sec: null
            });

        if (error) {
            console.error('Error creating lesson summary:', error);
            return { success: false, error: error.message };
        }
    }

    return { success: true };
}

/**
 * Create a new lesson marker
 */
export async function createLessonMarker(lessonId: string, body: string, timeSec: number) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    // Get internal user ID
    const { data: internalUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!internalUser) {
        return { success: false, error: 'User not found' };
    }

    const { data, error } = await supabase
        .from('course_lesson_notes')
        .insert({
            user_id: internalUser.id,
            lesson_id: lessonId,
            body,
            time_sec: timeSec,
            note_type: 'marker'
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating lesson marker:', error);
        return { success: false, error: error.message };
    }

    return { success: true, marker: data };
}

/**
 * Update a lesson marker
 */
export async function updateLessonMarker(markerId: string, body: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
        .from('course_lesson_notes')
        .update({ body })
        .eq('id', markerId);

    if (error) {
        console.error('Error updating lesson marker:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Delete a lesson marker
 */
export async function deleteLessonMarker(markerId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
        .from('course_lesson_notes')
        .delete()
        .eq('id', markerId);

    if (error) {
        console.error('Error deleting lesson marker:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

export interface CourseOverviewData {
    progressPct: number;
    doneLessons: number;
    totalLessons: number;
    secondsLifetime: number;
    secondsThisMonth: number;
}

/**
 * Get course overview data (progress, study time) for a specific course
 */
export async function getCourseOverviewData(courseId: string): Promise<CourseOverviewData | null> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return null;
    }

    // Get internal user ID
    const { data: internalUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!internalUser) {
        return null;
    }

    // 1. Get progress from view
    const { data: progressData } = await supabase
        .from('course_progress_view')
        .select('progress_pct, done_lessons, total_lessons')
        .eq('course_id', courseId)
        .eq('user_id', internalUser.id)
        .maybeSingle();

    // 2. Get study time from view (global for user - we filter by course lessons)
    const { data: studyTimeData } = await supabase
        .from('course_user_study_time_view')
        .select('seconds_lifetime, seconds_this_month')
        .eq('user_id', internalUser.id)
        .maybeSingle();

    return {
        progressPct: Number(progressData?.progress_pct) || 0,
        doneLessons: progressData?.done_lessons || 0,
        totalLessons: progressData?.total_lessons || 0,
        secondsLifetime: Number(studyTimeData?.seconds_lifetime) || 0,
        secondsThisMonth: Number(studyTimeData?.seconds_this_month) || 0,
    };
}

export interface MarkerWithDetails {
    id: string;
    body: string;
    time_sec: number;
    created_at: string;
    lesson: {
        id: string;
        title: string;
    };
}

/**
 * Get latest markers with lesson details for overview
 */
export async function getLatestUserMarkersWithDetails(courseId: string, limit: number = 3): Promise<MarkerWithDetails[]> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return [];
    }

    const { data: internalUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!internalUser) {
        return [];
    }

    const { data: markers, error } = await supabase
        .from('course_lesson_notes')
        .select(`
            id,
            body,
            time_sec,
            created_at,
            lesson:course_lessons!inner(
                id,
                title,
                module:course_modules!inner(course_id)
            )
        `)
        .eq('user_id', internalUser.id)
        .eq('note_type', 'marker')
        .eq('lesson.module.course_id', courseId)
        .not('time_sec', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching markers with details:', error);
        return [];
    }

    return (markers || []) as unknown as MarkerWithDetails[];
}

