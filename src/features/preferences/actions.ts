'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type UserPreferencesUpdate = {
    language?: 'en' | 'es';
    theme?: 'light' | 'dark' | 'system';
    layout?: 'default' | 'sidebar';
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
    const updateData: any = {};
    if (preferences.language) updateData.language = preferences.language;
    if (preferences.theme) updateData.theme = preferences.theme; // Note: Theme might be client-only usually, but storing it is good
    if (preferences.layout) {
        // Map to DB values for compatibility
        // default -> lab
        // sidebar -> experimental
        updateData.layout = preferences.layout === 'default' ? 'lab' : 'experimental';
    }

    // Upsert public.user_preferences
    const { error } = await supabase
        .from('user_preferences')
        .upsert({
            user_id: userId,
            ...updateData,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

    if (error) {
        console.error("User Preferences Update Error:", error);
        throw new Error("Failed to update preferences");
    }

    revalidatePath('/settings');
    revalidatePath('/', 'layout'); // Reset layout cache 

    return { success: true };
}
