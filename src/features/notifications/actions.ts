"use server";


import { sanitizeError } from "@/lib/error-utils";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getUserNotifications } from "./queries";

export async function fetchUserNotifications() {
    return await getUserNotifications();
}

export async function markNotificationAsRead(notificationId: string) {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    // Get public user ID
    const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!userData) {
        return { success: false, error: "User not found" };
    }

    const { error } = await supabase
        .from('user_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', userData.id);

    if (error) {
        console.error("Error marking notification as read:", error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath('/[locale]/settings', 'page');
    return { success: true };
}

export async function markAllNotificationsAsRead() {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    // Get public user ID
    const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!userData) {
        return { success: false, error: "User not found" };
    }

    const { error } = await supabase
        .from('user_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userData.id)
        .is('read_at', null);

    if (error) {
        console.error("Error marking all notifications as read:", error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath('/[locale]/settings', 'page');
    return { success: true };
}

