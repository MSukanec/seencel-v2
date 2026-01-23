'use server'

import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/features/profile/queries";

export async function submitFeedback(formData: FormData) {
    const supabase = await createClient();
    const message = formData.get("message") as string;

    if (!message || message.trim().length === 0) {
        return { error: "Message is required" };
    }

    // Get the user profile to find the correct user_id (not auth_id)
    const { profile, error: profileError } = await getUserProfile();

    if (profileError || !profile) {
        console.error("Error getting user profile for feedback:", profileError);
        return { error: "Unauthorized" };
    }

    try {
        const { error } = await supabase
            .from("feedback")
            .insert({
                user_id: profile.id, // Explicitly set user_id from the users table
                message: message,
            });

        if (error) {
            console.error("Error submitting feedback:", error);
            // Return the actual error message for debugging purposes
            return { error: `Database Error: ${error.message}` };
        }

        return { success: true };
    } catch (e: any) {
        console.error("Unexpected error:", e);
        return { error: `Unexpected Error: ${e.message || e}` };
    }
}

