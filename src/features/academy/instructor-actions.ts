"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type InstructorState = {
    success: boolean;
    message: string;
    errors?: Record<string, string[]>;
};

export async function getInstructors() {
    const supabase = await createClient();
    const { data } = await supabase
        .from("course_instructors")
        .select("*")
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

    return data || [];
}

export async function createInstructor(formData: {
    name: string;
    title: string;
    bio: string;
    avatar_path: string | null;
    credentials: string[];
    linkedin_url?: string;
    youtube_url?: string;
    instagram_url?: string;
}): Promise<InstructorState> {
    const supabase = await createClient();

    try {
        const { error } = await supabase.from("course_instructors").insert({
            name: formData.name,
            title: formData.title,
            bio: formData.bio,
            avatar_path: formData.avatar_path,
            credentials: formData.credentials,
            linkedin_url: formData.linkedin_url,
            youtube_url: formData.youtube_url,
            instagram_url: formData.instagram_url,
        });

        if (error) throw error;

        revalidatePath("/admin/academy");
        return { success: true, message: "Instructor creado correctamente" };
    } catch (error: any) {
        console.error("Error creating instructor:", error);
        return { success: false, message: error.message };
    }
}

export async function updateInstructor(
    id: string,
    formData: {
        name: string;
        title: string;
        bio: string;
        avatar_path: string | null;
        credentials: string[];
        linkedin_url?: string;
        youtube_url?: string;
        instagram_url?: string;
    }
): Promise<InstructorState> {
    const supabase = await createClient();

    try {
        const { error } = await supabase
            .from("course_instructors")
            .update({
                name: formData.name,
                title: formData.title,
                bio: formData.bio,
                avatar_path: formData.avatar_path,
                credentials: formData.credentials,
                linkedin_url: formData.linkedin_url,
                youtube_url: formData.youtube_url,
                instagram_url: formData.instagram_url,
            })
            .eq("id", id);

        if (error) throw error;

        revalidatePath("/admin/courses");
        return { success: true, message: "Instructor actualizado correctamente" };
    } catch (error: any) {
        console.error("Error updating instructor:", error);
        return { success: false, message: error.message };
    }
}

export async function deleteInstructor(id: string): Promise<InstructorState> {
    const supabase = await createClient();

    try {
        // Soft delete
        const { error } = await supabase
            .from("course_instructors")
            .update({
                is_deleted: true,
                deleted_at: new Date().toISOString(),
            })
            .eq("id", id);

        if (error) throw error;

        revalidatePath("/admin/courses");
        return { success: true, message: "Instructor eliminado correctamente" };
    } catch (error: any) {
        console.error("Error deleting instructor:", error);
        return { success: false, message: error.message };
    }
}
