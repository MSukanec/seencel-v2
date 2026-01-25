'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Query to get user's saved timezone
export async function getUserTimezone(): Promise<string | null> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: publicUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!publicUser) return null;

    const { data: prefs } = await supabase
        .from('user_preferences')
        .select('timezone')
        .eq('user_id', publicUser.id)
        .single();

    return prefs?.timezone || null;
}

export type UserPreferencesUpdate = {
    language?: 'en' | 'es';
    theme?: 'light' | 'dark' | 'system';
    layout?: 'default' | 'sidebar';
    timezone?: string;
    sidebar_project_avatars?: boolean;
};

export async function updateUserPreferences(preferences: UserPreferencesUpdate) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // We need to resolve the public user ID first
    const { data: publicUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!publicUser) throw new Error("Public user not found");

    const userId = publicUser.id;

    // Build update object dynamically
    const updateData: Record<string, any> = {};
    if (preferences.language) updateData.language = preferences.language;
    if (preferences.theme) updateData.theme = preferences.theme;
    if (preferences.timezone) updateData.timezone = preferences.timezone;
    if (preferences.sidebar_project_avatars !== undefined) updateData.sidebar_project_avatars = preferences.sidebar_project_avatars;
    if (preferences.layout) {
        updateData.layout = preferences.layout === 'default' ? 'lab' : 'experimental';
    }

    console.log("[updateUserPreferences] userId:", userId, "updateData:", updateData);

    // Update existing user_preferences row
    const { data, error } = await supabase
        .from('user_preferences')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) {
        console.error("[updateUserPreferences] Error:", error);
        throw new Error("Failed to update preferences");
    }

    console.log("[updateUserPreferences] Updated:", data);

    revalidatePath('/settings');
    revalidatePath('/', 'layout');

    return { success: true };
}

