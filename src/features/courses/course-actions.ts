"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type UpdateCourseState = {
    success: boolean;
    message: string;
    errors?: Record<string, string[]>;
};

export async function updateCourseGeneral(
    courseId: string,
    formData: {
        title: string;
        slug: string;
        price: number;
        status: string;
        visibility: string;
        instructor_id: string; // from course_details
    }
): Promise<UpdateCourseState> {
    const supabase = await createClient();

    try {
        // 1. Update main course table
        const { error: courseError } = await supabase
            .from("courses")
            .update({
                title: formData.title,
                slug: formData.slug,
                price: formData.price,
                status: formData.status,
                visibility: formData.visibility,
            })
            .eq("id", courseId);

        if (courseError) throw courseError;

        // 2. Update instructor in course_details
        const { error: detailsError } = await supabase
            .from("course_details")
            .update({
                instructor_id: formData.instructor_id,
            })
            .eq("course_id", courseId);

        if (detailsError) throw detailsError;

        revalidatePath("/admin/courses");
        revalidatePath(`/admin/courses/${courseId}`);
        revalidatePath(`/courses/${formData.slug}`); // Public page

        return { success: true, message: "Curso actualizado correctamente" };
    } catch (error: any) {
        console.error("Error updating course:", error);
        return {
            success: false,
            message: "Error al actualizar el curso: " + error.message
        };
    }
}

export async function updateCourseMarketing(
    courseId: string,
    formData: {
        image_path: string | null;
        badge_text: string | null;
        preview_video_id: string | null;
        landing_sections: any; // JSONB structure
    }
): Promise<UpdateCourseState> {
    const supabase = await createClient();

    try {
        // 1. Update image in courses table
        const { error: courseError } = await supabase
            .from("courses")
            .update({
                image_path: formData.image_path,
            })
            .eq("id", courseId);

        if (courseError) throw courseError;

        // 2. Fetch existing details to merge landing_sections (safe update)
        const { data: currentDetails } = await supabase
            .from("course_details")
            .select("landing_sections")
            .eq("course_id", courseId)
            .single();

        const mergedSections = {
            ...(currentDetails?.landing_sections as object || {}),
            ...formData.landing_sections
        };

        // 3. Update course_details
        const { error: detailsError } = await supabase
            .from("course_details")
            .update({
                badge_text: formData.badge_text,
                preview_video_id: formData.preview_video_id,
                landing_sections: mergedSections
            })
            .eq("course_id", courseId);

        if (detailsError) throw detailsError;

        revalidatePath("/admin/courses");
        revalidatePath(`/admin/courses/${courseId}`);
        // We might need to revalidate public page too ideally, but slug is needed.
        // We can fetch slug or pass it. For now simple reval is ok.

        return { success: true, message: "Marketing actualizado correctamente" };
    } catch (error: any) {
        console.error("Error updating marketing:", error);
        return {
            success: false,
            message: "Error al actualizar marketing: " + error.message
        };
    }
}

// --- Content Actions ---

export async function createModule(courseId: string, title: string) {
    const supabase = await createClient();
    try {
        const { data: max } = await supabase
            .from("course_modules")
            .select("sort_index")
            .eq("course_id", courseId)
            .order("sort_index", { ascending: false })
            .limit(1)
            .single();

        const nextIndex = (max?.sort_index || 0) + 1;

        const { error } = await supabase.from("course_modules").insert({
            course_id: courseId,
            title,
            sort_index: nextIndex
        });

        if (error) throw error;
        revalidatePath(`/admin/courses/${courseId}`);
        return { success: true, message: "Módulo creado" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function updateModule(moduleId: string, title: string, courseId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("course_modules")
        .update({ title })
        .eq("id", moduleId);

    if (error) return { success: false, message: error.message };
    revalidatePath(`/admin/courses/${courseId}`);
    return { success: true, message: "Módulo actualizado" };
}

export async function deleteModule(moduleId: string, courseId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("course_modules")
        // Check if soft delete supported, otherwise hard delete
        .delete()
        .eq("id", moduleId);

    if (error) return { success: false, message: error.message };
    revalidatePath(`/admin/courses/${courseId}`);
    return { success: true, message: "Módulo eliminado" };
}

export async function createLesson(moduleId: string, title: string, courseId: string) {
    const supabase = await createClient();
    try {
        const { data: max } = await supabase
            .from("course_lessons")
            .select("sort_index")
            .eq("module_id", moduleId)
            .order("sort_index", { ascending: false })
            .limit(1)
            .single();

        const nextIndex = (max?.sort_index || 0) + 1;

        const { error } = await supabase.from("course_lessons").insert({
            module_id: moduleId,
            title,
            sort_index: nextIndex,
            duration_sec: 0,
            free_preview: false
        });

        if (error) throw error;
        revalidatePath(`/admin/courses/${courseId}`);
        return { success: true, message: "Lección creada" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function updateLesson(lessonId: string, data: { title?: string; duration?: number; free_preview?: boolean }, courseId: string) {
    const supabase = await createClient();

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.duration !== undefined) updateData.duration_sec = data.duration * 60; // Convert min to sec if input is min
    if (data.free_preview !== undefined) updateData.free_preview = data.free_preview;

    const { error } = await supabase
        .from("course_lessons")
        .update(updateData)
        .eq("id", lessonId);

    if (error) return { success: false, message: error.message };
    revalidatePath(`/admin/courses/${courseId}`);
    return { success: true, message: "Lección actualizada" };
}

export async function deleteLesson(lessonId: string, courseId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("course_lessons")
        .delete()
        .eq("id", lessonId);

    if (error) return { success: false, message: error.message };
    revalidatePath(`/admin/courses/${courseId}`);
    return { success: true, message: "Lección eliminada" };
}
