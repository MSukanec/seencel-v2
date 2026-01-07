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
        .single();

    if (error) {
        console.error('Error fetching course by slug:', error);
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
