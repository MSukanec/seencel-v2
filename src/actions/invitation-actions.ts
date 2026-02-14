"use server";

import { createClient } from "@/lib/supabase/server";

export interface PendingInvitationData {
    id: string;
    token: string;
    organization_name: string;
    organization_logo: string | null;
    role_name: string;
    inviter_name: string | null;
}

/**
 * Check if the current user has a pending invitation.
 * Called lazily from client after mount — does NOT block layout render.
 *
 * Total: 1-4 queries (1 base + 3 conditional if invitation found)
 * Previously executed synchronously in the dashboard layout on every navigation.
 */
export async function checkPendingInvitation(email: string): Promise<PendingInvitationData | null> {
    const supabase = await createClient();

    // 1. Check for pending invitations
    const { data: invitations } = await supabase
        .from('organization_invitations')
        .select('id, token, role_id, organization_id, invited_by')
        .eq('email', email.toLowerCase())
        .eq('status', 'pending')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

    if (!invitations || invitations.length === 0) {
        return null;
    }

    const inv = invitations[0];

    // 2. Fetch org name, role name and inviter in parallel
    const [orgDataResult, roleDataResult, inviterResult] = await Promise.all([
        inv.organization_id
            ? supabase.from('organizations').select('name, logo_url').eq('id', inv.organization_id).single()
            : Promise.resolve({ data: null }),
        inv.role_id
            ? supabase.from('roles').select('name').eq('id', inv.role_id).single()
            : Promise.resolve({ data: null }),
        inv.invited_by
            ? supabase.from('organization_members').select('user_id').eq('id', inv.invited_by).single()
                .then(async ({ data: memberData }) => {
                    if (memberData?.user_id) {
                        const { data: inviterUser } = await supabase.from('users').select('full_name').eq('id', memberData.user_id).single();
                        return inviterUser?.full_name || null;
                    }
                    return null;
                })
            : Promise.resolve(null),
    ]);

    return {
        id: inv.id,
        token: inv.token,
        organization_name: orgDataResult?.data?.name || 'Organización',
        organization_logo: orgDataResult?.data?.logo_url || null,
        role_name: roleDataResult?.data?.name || 'Miembro',
        inviter_name: inviterResult as string | null,
    };
}
