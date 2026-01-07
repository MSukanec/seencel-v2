import { createClient } from '@/lib/supabase/server';
import { subDays } from 'date-fns';

export async function getDashboardData() {
    const supabase = await createClient();

    // 1. Get Current User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "User not authenticated." };

    // 1b. Get Public User ID from 'users' table
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
            id,
            user_preferences!inner (
                last_organization_id
            )
        `)
        .eq('auth_id', user.id)
        .single();

    if (userError || !userData) {
        console.error("Public user/preferences record not found:", JSON.stringify(userError, null, 2));
        return { error: `Setup Required: No public 'users' record or preferences found for Auth ID ${user.id}.` };
    }

    const publicUserId = userData.id;

    // We already have 'userData.user_preferences'. cast to any to avoid TS strictness if types aren't perfect
    const pref = Array.isArray((userData as any).user_preferences)
        ? (userData as any).user_preferences[0]
        : (userData as any).user_preferences;

    const activeOrgId = pref?.last_organization_id;

    let orgId = activeOrgId;

    // 2. If we have a preference, verify membership. If not, find a default.
    let organization = null;

    if (orgId) {
        const { data: directMember } = await supabase
            .from('organization_members')
            .select(`
                organizations(
                    id, 
                    name, 
                    logo_path,
                    settings,
                    organization_data (
                        description,
                        phone,
                        email,
                        website,
                        tax_id,
                        address,
                        city,
                        state,
                        country,
                        postal_code,
                        lat,
                        lng
                    )
                )
            `)
            .eq('user_id', publicUserId)
            .eq('organization_id', orgId)
            .single();

        if (directMember?.organizations) {
            organization = directMember.organizations;
        }
    }

    // Fallback if no preference or preference invalid/user removed
    if (!organization) {
        const { data: fallbackMember } = await supabase
            .from('organization_members')
            .select(`
                organizations(
                    id, 
                    name, 
                    logo_path,
                    settings,
                    organization_data (
                        description,
                        phone,
                        email,
                        website,
                        tax_id,
                        address,
                        city,
                        state,
                        country,
                        postal_code,
                        lat,
                        lng
                    )
                )
            `)
            .eq('user_id', publicUserId)
            .limit(1)
            .single();

        if (fallbackMember?.organizations) {
            const orgData = Array.isArray(fallbackMember.organizations)
                ? fallbackMember.organizations[0]
                : fallbackMember.organizations;
            organization = orgData;
            orgId = orgData.id;
        }
    }

    if (!orgId || !organization) {
        return { error: `Setup Required: The user ${publicUserId} is not linked to any organization.` };
    }

    // 3. Parallel Fetching for Dashboard Widgets
    const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

    const [
        projectsRes,
        statsRes,
        movementsRes,
        activityRes
    ] = await Promise.all([
        // Projects
        supabase.from('projects')
            .select('*')
            .eq('organization_id', orgId)
            .eq('is_active', true)
            .order('updated_at', { ascending: false }),

        // Stats (Docs & Tasks count)
        supabase.rpc('get_org_dashboard_stats', { org_id: orgId }),

        // Financial Movements (Unified View)
        supabase.from('unified_financial_movements_view')
            .select('*')
            .eq('organization_id', orgId)
            .limit(500),

        // Activity Feed
        supabase.from('organization_activity_log_view')
            .select('*')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })
            .limit(20)
    ]);

    // Manual Counts (Safe fallback)
    const [docsCount, tasksCount, teamCount] = await Promise.all([
        supabase.from('design_documents').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).gte('created_at', thirtyDaysAgo),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
        supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('organization_id', orgId)
    ]);

    return {
        user,
        organization,
        projects: projectsRes.data || [],
        stats: {
            activeProjects: projectsRes.data?.length || 0,
            documentsLast30Days: docsCount.count || 0,
            totalTasks: tasksCount.count || 0,
            teamSize: teamCount.count || 0
        },
        movements: movementsRes.data || [],
        activity: activityRes.data || []
    };
}

// ----------------------------------------------------------------------------
// SETTINGS QUERIES
// ----------------------------------------------------------------------------

export async function getUserOrganizations() {
    const supabase = await createClient();

    // 1. Get Current User Auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { organizations: [], activeOrgId: null };

    // 2. Get Public User ID & Preferences
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
            id,
            user_preferences (
                last_organization_id
            )
        `)
        .eq('auth_id', user.id)
        .single();

    if (userError || !userData) {
        console.error("Error fetching user profile:", userError);
        return { organizations: [], activeOrgId: null };
    }

    const publicUserId = userData.id;
    const pref = Array.isArray((userData as any).user_preferences)
        ? (userData as any).user_preferences[0]
        : (userData as any).user_preferences;

    const activeOrgId = pref?.last_organization_id || null;

    // 3. Fetch User's Organizations (Just the organizations first)
    const { data: myMemberships, error: orgsError } = await supabase
        .from('organization_members')
        .select(`
            organizations (
                id,
                name,
                logo_path,
                plans:plan_id (
                    id,
                    name,
                    slug
                )
            )
        `)
        .eq('user_id', publicUserId);

    if (orgsError) {
        console.error("Error fetching organizations FULL:", JSON.stringify(orgsError, null, 2));
        return { organizations: [], activeOrgId };
    }

    // 3b. Fetch Usage Stats (Last Access)
    const { data: usagePrefs } = await supabase
        .from('user_organization_preferences')
        .select('organization_id, updated_at')
        .eq('user_id', publicUserId);

    const lastAccessMap = new Map<string, number>();
    usagePrefs?.forEach((p: any) => {
        if (p.organization_id && p.updated_at) {
            lastAccessMap.set(p.organization_id, new Date(p.updated_at).getTime());
        }
    });

    // Extract bare organizations
    const rawOrgs = (myMemberships || [])
        .map((m: any) => m.organizations)
        .filter((org: any) => !!org);

    // 4. Fetch Members for these organizations (Separate query for safety/performance)
    const orgIds = rawOrgs.map((o: any) => o.id);
    let orgMembers: any[] = [];

    if (orgIds.length > 0) {
        const { data: membersData, error: membersError } = await supabase
            .from('organization_members')
            .select(`
                organization_id,
                user: users (
                    full_name,
                    avatar_url,
                    email
                )
            `)
            .in('organization_id', orgIds);

        if (membersError) {
            // Log warning but allow the page to render without avatars
            console.error("Warning: Failed to fetch organization members details", membersError);
        } else {
            orgMembers = membersData || [];
        }
    }

    // Map and Merge results
    const organizations = rawOrgs.map((org: any) => {
        // Filter members for this specific org
        const theseMembers = orgMembers.filter((m: any) => m.organization_id === org.id);

        return {
            id: org.id,
            name: org.name,
            logo_path: org.logo_path || null,
            image_path: org.image_path || null, // Keep for legacy compat if types demand it, though we removed it from select
            image_bucket: null,
            slug: org.name.toLowerCase().replace(/\s+/g, '-'),
            role: 'member',
            updated_at: lastAccessMap.get(org.id) || 0,
            plans: org.plans || null, // Include plan data
            members: theseMembers.map((mem: any) => ({
                name: mem.user?.full_name || mem.user?.email || 'User',
                image: mem.user?.avatar_url || null,
                email: mem.user?.email
            }))
        };
    });

    // Sort: Active Org First -> Then Most Recently Used -> Then Alphabetical
    organizations.sort((a: any, b: any) => {
        // 1. Active Org is ALWAYS first
        if (a.id === activeOrgId) return -1;
        if (b.id === activeOrgId) return 1;

        // 2. Sort by Last Access (updated_at DESC)
        const accessA = a.updated_at || 0;
        const accessB = b.updated_at || 0;
        if (accessA !== accessB) {
            return accessB - accessA; // Descending
        }

        // 3. Fallback to Name ASC
        return a.name.localeCompare(b.name);
    });

    return {
        organizations,
        activeOrgId
    };
}

export async function getFinancialMovements() {
    const supabase = await createClient();

    // 1. Get Current User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "User not authenticated." };

    // 2. Fetcy Org ID (Simplified for now, assuming robust context later)
    const { data: userData } = await supabase
        .from('users')
        .select(`id, user_preferences!inner(last_organization_id)`)
        .eq('auth_id', user.id)
        .single();

    if (!userData) return { error: "User profile not found." };

    const pref = Array.isArray((userData as any).user_preferences)
        ? (userData as any).user_preferences[0]
        : (userData as any).user_preferences;

    const orgId = pref?.last_organization_id;

    if (!orgId) return { error: "No active organization found." };

    const { data, error } = await supabase
        .from('unified_financial_movements_view')
        .select('*')
        .eq('organization_id', orgId)
        .order('payment_date', { ascending: false });

    if (error) {
        console.error("Error fetching financial movements:", error);
        return { error: "Failed to fetch financial data." };
    }

    return { movements: data || [] };
}
