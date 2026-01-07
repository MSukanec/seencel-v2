'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { optimizeImage } from '@/lib/image-optimizer';

export async function updateUserProfile(formData: FormData) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Extract form data
    const firstName = formData.get('first_name') as string;
    const lastName = formData.get('last_name') as string;
    const email = formData.get('email') as string; // Read-only usually, but checked
    const phone = formData.get('phone') as string;
    const birthdate = formData.get('birthdate') as string || null;
    const country = formData.get('country') as string || null;
    // Schema verification:
    // users: full_name
    // user_data: first_name, last_name, phone_e164, birthdate, country

    // We need to resolve the public user ID first
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

    // 2. Upsert public.user_data
    // We use upsert based on user_id unique constraint
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

// --- Avatar Management Actions ---



// Helper to separate ID resolution logic
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

// Return type for UI handling
type ActionResponse = { success: boolean; error?: string; avatar_url?: string };

export async function uploadAvatar(formData: FormData): Promise<ActionResponse> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error("Unauthorized");

        const userId = await getPublicUserId(supabase, user.id);

        const file = formData.get('file') as File;
        if (!file) throw new Error("No file uploaded");

        // Validate file size/type if needed
        if (file.size > 10 * 1024 * 1024) throw new Error("File too large (max 10MB input)");

        let fileExt = file.name.split('.').pop();
        let contentType = file.type;
        let finalBuffer: Buffer;

        try {
            // Optimize!
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
                avatar_source: 'storage'
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
        return { success: false, error: error instanceof Error ? error.message : "Unknown server error" };
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

    if (error) throw new Error(`Failed to remove avatar: ${error.message}`);
    revalidatePath('/settings');
    return { success: true };
}

export async function restoreProviderAvatar() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const userId = await getPublicUserId(supabase, user.id);

    // 1. Get Provider Avatar from Auth Metadata
    const providerAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;

    if (!providerAvatar) throw new Error("No provider avatar found");

    // 2. Update Public Profile
    const { error } = await supabase
        .from('users')
        .update({
            avatar_url: providerAvatar,
            avatar_source: 'google'
        })
        .eq('id', userId);

    if (error) throw new Error(`Failed to restore avatar: ${error.message}`);
    revalidatePath('/settings');
    return { success: true, avatar_url: providerAvatar };
}
