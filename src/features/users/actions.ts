'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { optimizeImage } from '@/lib/image-optimizer';
import { sanitizeError } from '@/lib/error-utils';

// ============================================================================
// Types
// ============================================================================

export type UserPreferencesUpdate = {
    language?: 'en' | 'es';
    theme?: 'light' | 'dark' | 'system';
    layout?: 'default' | 'sidebar';
    timezone?: string;
    sidebar_project_avatars?: boolean;
};

type ActionResponse = { success: boolean; error?: string; avatar_url?: string };

// ============================================================================
// Helpers
// ============================================================================

async function getPublicUserId(supabase: any, authId: string) {
    const { data: publicUser, error } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authId)
        .single();

    if (error || !publicUser) {
        console.error("Error finding public user:", error);
        throw new Error("Public user not found");
    }
    return publicUser.id;
}

// ============================================================================
// Profile Actions
// ============================================================================

export async function updateUserProfile(formData: FormData) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const firstName = formData.get('first_name') as string;
    const lastName = formData.get('last_name') as string;
    const phone = formData.get('phone') as string;
    const birthdate = formData.get('birthdate') as string || null;
    const country = formData.get('country') as string || null;

    const { data: publicUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!publicUser) throw new Error("Public user not found");

    const userId = publicUser.id;
    const fullName = `${firstName} ${lastName}`.trim();

    // 1. Update public.users
    const { error: userError } = await supabase
        .from('users')
        .update({ full_name: fullName })
        .eq('id', userId);

    if (userError) throw new Error("Failed to update user record");

    // 2. Update public.user_data
    const { error: userDataError } = await supabase
        .from('user_data')
        .update({
            first_name: firstName,
            last_name: lastName,
            phone_e164: phone,
            birthdate: birthdate || null,
            country: country || null,
        })
        .eq('user_id', userId);

    if (userDataError) {
        console.error("User Data Update Error:", userDataError);
        throw new Error("Failed to update extra profile details");
    }

    revalidatePath('/settings');
    revalidatePath('/profile');
    return { success: true };
}

// ============================================================================
// Preferences Actions
// ============================================================================

export async function updateUserPreferences(preferences: UserPreferencesUpdate) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

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
        updateData.layout = preferences.layout === 'sidebar' ? 'classic' : 'experimental';
    }

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

    revalidatePath('/settings');
    revalidatePath('/', 'layout');

    return { success: true };
}

// ============================================================================
// Avatar Actions
// ============================================================================

export async function uploadAvatar(formData: FormData): Promise<ActionResponse> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error("Unauthorized");

        const userId = await getPublicUserId(supabase, user.id);

        const file = formData.get('file') as File;
        if (!file) throw new Error("No file uploaded");

        if (file.size > 10 * 1024 * 1024) throw new Error("File too large (max 10MB input)");

        let fileExt = file.name.split('.').pop();
        let contentType = file.type;
        let finalBuffer: Buffer;

        try {
            const arrayBuffer = await file.arrayBuffer();
            const rawBuffer = Buffer.from(arrayBuffer);
            const { buffer, extension, mimeType } = await optimizeImage(rawBuffer);

            finalBuffer = buffer;
            fileExt = extension;
            contentType = mimeType;
        } catch (optError) {
            console.error("Optimize Image Error:", optError);
            throw new Error("Failed to optimize image");
        }

        const filePath = `${user.id}/${Date.now()}.${fileExt}`;

        // 1. Upload to Storage
        const { error: uploadError } = await supabase.storage
            .from('user-avatars')
            .upload(filePath, finalBuffer, {
                upsert: true,
                contentType: contentType
            });

        if (uploadError) {
            console.error("Storage Upload Error:", uploadError);
            throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('user-avatars')
            .getPublicUrl(filePath);

        // 3. Update User Profile
        const { error: updateError } = await supabase
            .from('users')
            .update({
                avatar_url: publicUrl,
                avatar_source: 'upload'
            })
            .eq('id', userId);

        if (updateError) {
            console.error("Database Update Error:", updateError);
            throw new Error(`Profile update failed: ${updateError.message}`);
        }

        revalidatePath('/settings');
        return { success: true, avatar_url: publicUrl };
    } catch (error) {
        console.error("Critical Upload Error:", error);
        return { success: false, error: sanitizeError(error) };
    }
}

export async function removeAvatar() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const userId = await getPublicUserId(supabase, user.id);

    const { error } = await supabase
        .from('users')
        .update({
            avatar_url: null,
            avatar_source: 'email'
        })
        .eq('id', userId);

    if (error) throw new Error(`Failed to remove avatar: ${sanitizeError(error)}`);
    revalidatePath('/settings');
    return { success: true };
}

export async function restoreProviderAvatar() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const userId = await getPublicUserId(supabase, user.id);

    const providerAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;

    if (!providerAvatar) throw new Error("No provider avatar found");

    const { error } = await supabase
        .from('users')
        .update({
            avatar_url: providerAvatar,
            avatar_source: 'google'
        })
        .eq('id', userId);

    if (error) throw new Error(`Failed to restore avatar: ${sanitizeError(error)}`);
    revalidatePath('/settings');
    return { success: true, avatar_url: providerAvatar };
}
