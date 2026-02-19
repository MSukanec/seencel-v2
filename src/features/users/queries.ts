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

// ============================================================================
// Access Context Check (lightweight — for Phase 1 hydration in layout)
// ============================================================================

/**
 * Checks if the user is a member and/or external actor of the active org.
 * This runs in the server layout (Phase 1) so the access-context-store is
 * hydrated immediately on first render — eliminating the sidebar flash for
 * external users who would otherwise momentarily see the member sidebar.
 */
export async function checkUserAccessContext(
    authId: string,
    orgId: string | null
): Promise<{
    isMember: boolean;
    isExternal: boolean;
    externalActorType: string | null;
    isExternalActorActive: boolean;
}> {
    if (!orgId) {
        return { isMember: false, isExternal: false, externalActorType: null, isExternalActorActive: false };
    }

    const supabase = await createClient();

    // Resolve internal user id
    const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authId)
        .single();

    const internalUserId = userData?.id;
    if (!internalUserId) {
        return { isMember: true, isExternal: false, externalActorType: null, isExternalActorActive: false };
    }

    const [memberResult, actorResult] = await Promise.all([
        supabase
            .from('organization_members')
            .select('id')
            .eq('organization_id', orgId)
            .eq('user_id', internalUserId)
            .eq('is_active', true)
            .maybeSingle(),
        supabase
            .from('organization_external_actors')
            .select('id, actor_type, is_active')
            .eq('organization_id', orgId)
            .eq('user_id', internalUserId)
            .eq('is_deleted', false)
            .maybeSingle(),
    ]);

    const isMember = !!memberResult.data;
    const actor = actorResult.data as any;
    const isExternal = !!actor;
    const isExternalActorActive = actor?.is_active === true;
    const externalActorType = actor?.actor_type || null;

    return { isMember, isExternal, externalActorType, isExternalActorActive };
}

