"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface CreateEnrollmentData {
    user_id: string;
    course_id: string;
    status?: string;
    expires_at?: string | null;
}

export interface UpdateEnrollmentData {
    status?: string;
    expires_at?: string | null;
}

// Get all users for enrollment dropdown
export async function getEnrollableUsers() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("users")
        .select("id, full_name, email, avatar_url")
        .eq("is_active", true)
        .order("full_name");

    if (error) {
        console.error("Error fetching users:", error);
        return [];
    }

    return data || [];
}

// Get all courses for enrollment dropdown
export async function getEnrollableCourses() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("courses")
        .select("id, title, slug")
        .eq("is_deleted", false)
        .eq("is_active", true)
        .order("title");

    if (error) {
        console.error("Error fetching courses:", error);
        return [];
    }

    return data || [];
}

// Get existing enrollments to filter out already enrolled users
export async function getExistingEnrollments() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("course_enrollments")
        .select("user_id, course_id");

    if (error) {
        console.error("Error fetching existing enrollments:", error);
        return [];
    }

    return data || [];
}

// Create a new enrollment
export async function createEnrollment(data: CreateEnrollmentData) {
    const supabase = await createClient();

    const { data: enrollment, error } = await supabase
        .from("course_enrollments")
        .insert({
            user_id: data.user_id,
            course_id: data.course_id,
            status: data.status || "active",
            expires_at: data.expires_at || null,
            started_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating enrollment:", error);
        throw new Error(error.message);
    }

    revalidatePath("/admin/courses");
    return enrollment;
}

// Update an existing enrollment
export async function updateEnrollment(id: string, data: UpdateEnrollmentData) {
    const supabase = await createClient();

    const { data: enrollment, error } = await supabase
        .from("course_enrollments")
        .update({
            status: data.status,
            expires_at: data.expires_at,
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating enrollment:", error);
        throw new Error(error.message);
    }

    revalidatePath("/admin/courses");
    return enrollment;
}

// Delete an enrollment
export async function deleteEnrollment(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("course_enrollments")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting enrollment:", error);
        throw new Error(error.message);
    }

    revalidatePath("/admin/courses");
    return { success: true };
}
