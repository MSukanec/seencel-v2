import { createClient } from '@/lib/supabase/server';
import { UserProfile } from '@/types/user';

// ============================================================================
// User Profile Query
// ============================================================================

export async function getUserProfile(authId?: string): Promise<{ profile: UserProfile | null; error: string | null }> {
    const supabase = await createClient();

    // 1. Resolve Auth ID (skip auth.getUser() if provided by caller)
    let resolvedAuthId = authId;
    if (!resolvedAuthId) {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) return { profile: null, error: "Not authenticated" };
        resolvedAuthId = authUser.id;
    }

    // 2. Fetch User + User Data
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
        .eq('auth_id', resolvedAuthId)
        .single();

    if (dbError) {
        console.error("Error fetching user profile:", dbError);
        return { profile: null, error: "Failed to load user profile." };
    }

    if (!userRecord) {
        return { profile: null, error: "User not found." };
    }

    // 3. Transform to flat structure
    const userData = Array.isArray(userRecord.user_data)
        ? userRecord.user_data[0]
        : userRecord.user_data;

    const profile: UserProfile = {
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

// ============================================================================
// Admin Check
// ============================================================================

export async function checkIsAdmin(): Promise<boolean> {
    const supabase = await createClient();

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) return false;

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

    const roleName = (userWithRole.roles as any)?.name?.toLowerCase();
    return roleName === 'admin';
}

// ============================================================================
// Beta Tester Check
// ============================================================================

export async function checkIsBetaTester(): Promise<boolean> {
    const supabase = await createClient();

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) return false;

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

    const roleName = (userWithRole.roles as any)?.name?.toLowerCase();
    // Check for "beta tester", "beta_tester", or "betatester" variations
    return roleName === 'beta tester' || roleName === 'beta_tester' || roleName === 'betatester';
}

// ============================================================================
// Combined Role Check (optimized - single query)
// ============================================================================

export async function checkUserRoles(authId?: string): Promise<{ isAdmin: boolean; isBetaTester: boolean }> {
    const supabase = await createClient();

    // Resolve Auth ID (skip auth.getUser() if provided by caller)
    let resolvedAuthId = authId;
    if (!resolvedAuthId) {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) return { isAdmin: false, isBetaTester: false };
        resolvedAuthId = authUser.id;
    }

    const { data: userWithRole, error } = await supabase
        .from('users')
        .select(`
            role_id,
            roles:role_id (
                name
            )
        `)
        .eq('auth_id', resolvedAuthId)
        .single();

    if (error || !userWithRole) return { isAdmin: false, isBetaTester: false };

    const roleName = (userWithRole.roles as any)?.name?.toLowerCase();

    return {
        isAdmin: roleName === 'admin',
        isBetaTester: roleName === 'beta tester' || roleName === 'beta_tester' || roleName === 'betatester'
    };
}

// ============================================================================
// User Timezone Query
// ============================================================================

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
