import { createClient } from '@/lib/supabase/server';
import { UserProfile } from '@/types/user';

export async function getUserProfile(): Promise<{ profile: UserProfile | null; error: string | null }> {
    const supabase = await createClient();

    // 1. Get Auth User
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
        return { profile: null, error: "Not authenticated" };
    }

    // 2. Fetch User + User Data
    // we query 'users' and left join 'user_data' on user_id
    const { data: userRecord, error: dbError } = await supabase
        .from('users')
        .select(`
            *,
            user_data (
                id,
                first_name,
                last_name,
                birthdate,
                country,
                phone_e164,
                countries:country (
                    id,
                    name,
                    alpha_2
                )
            )
        `)
        .eq('auth_id', authUser.id)
        .single();

    if (dbError) {
        console.error("Error fetching user profile:", dbError);
        return { profile: null, error: "Failed to load user profile." };
    }

    if (!userRecord) {
        return { profile: null, error: "User not found." };
    }

    // 3. Transform to flat structure
    // user_data is an array (relation) or object (single) depending on definitions. 
    // Since constraint is unique(user_id), it returns an array of 0 or 1 usually, unless 'single()' is not applied to the join?
    // Supabase standard join returns an array unless mapped or using !inner if strict 1:1. 
    // Let's assume array and take first.

    // Actually, let's fix the type assertion safely
    const userData = Array.isArray(userRecord.user_data)
        ? userRecord.user_data[0]
        : userRecord.user_data;

    const profile: UserProfile = {
        // User fields
        id: userRecord.id,
        auth_id: userRecord.auth_id,
        email: userRecord.email,
        avatar_url: userRecord.avatar_url,
        avatar_source: userRecord.avatar_source,
        full_name: userRecord.full_name,
        role_id: userRecord.role_id,
        is_active: userRecord.is_active,
        signup_completed: userRecord.signup_completed,
        created_at: userRecord.created_at,
        updated_at: userRecord.updated_at,

        // User Data fields (flattened)
        user_data_id: userData?.id || null,
        first_name: userData?.first_name || null,
        last_name: userData?.last_name || null,
        birthdate: userData?.birthdate || null,
        country: userData?.country || null,
        phone_e164: userData?.phone_e164 || null,
    };

    return { profile, error: null };
}

/**
 * Check if the current user has admin role
 */
export async function checkIsAdmin(): Promise<boolean> {
    const supabase = await createClient();

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) return false;

    // Get user with role info
    const { data: userWithRole, error } = await supabase
        .from('users')
        .select(`
            role_id,
            roles:role_id (
                name
            )
        `)
        .eq('auth_id', authUser.id)
        .single();

    if (error || !userWithRole) return false;

    // Check if role name is 'admin'
    const roleName = (userWithRole.roles as any)?.name?.toLowerCase();
    return roleName === 'admin';
}

