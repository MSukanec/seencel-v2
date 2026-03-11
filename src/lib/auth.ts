import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

// =============================================================================
// Auth Context — React.cache() per-request deduplication
//
// These functions resolve auth identity ONCE per HTTP request.
// Call them from ANY layout or page — React.cache guarantees single execution.
//
// Standard: Every Server Component uses these instead of raw auth.getUser().
// =============================================================================

export interface AuthContext {
    authId: string;
    userId: string;
    orgId: string;
}

/**
 * Cached per-request: resolves the Supabase Auth user.
 * Calling this N times in the same request = executes 1 time.
 */
export const getAuthUser = cache(async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
});

/**
 * Cached per-request: resolves auth + internal userId + active orgId.
 * This is the main entry point for layouts and pages.
 *
 * Returns null if user is not authenticated.
 * Returns { authId, userId, orgId } where orgId may be null if no org selected.
 */
export const getAuthContext = cache(async (): Promise<{
    authId: string;
    userId: string | null;
    orgId: string | null;
} | null> => {
    const authUser = await getAuthUser();
    if (!authUser) return null;

    const supabase = await createClient();

    // Resolve internal user ID
    const { data: userData } = await supabase
        .schema('iam').from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();

    if (!userData) {
        return { authId: authUser.id, userId: null, orgId: null };
    }

    // Resolve active organization from preferences
    const { data: prefData } = await supabase
        .schema('iam').from('user_preferences')
        .select('last_organization_id')
        .eq('user_id', userData.id)
        .single();

    return {
        authId: authUser.id,
        userId: userData.id,
        orgId: prefData?.last_organization_id ?? null,
    };
});

/**
 * Shortcut: same as getAuthContext but throws/redirects if not authenticated
 * or no active organization. Use in pages that ALWAYS require auth + org.
 */
export async function requireAuthContext(): Promise<AuthContext> {
    const ctx = await getAuthContext();

    if (!ctx || !ctx.userId) {
        const { redirect } = await import('next/navigation');
        return redirect('/login');
    }

    if (!ctx.orgId) {
        const { redirect } = await import('next/navigation');
        return redirect('/');
    }

    return { authId: ctx.authId, userId: ctx.userId, orgId: ctx.orgId };
}
