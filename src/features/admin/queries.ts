import { createClient } from "@/lib/supabase/server";

export interface AdminUser {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    created_at: string;
    is_active: boolean;
    organization_members: { count: number }[];
    user_presence: {
        last_seen_at: string | null;
        current_view: string | null;
        status: string | null;
    } | null;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('users')
        .select(`
            id,
            email,
            full_name,
            avatar_url,
            created_at,
            is_active,
            organization_members(count),
            user_presence (
                last_seen_at,
                current_view,
                status
            )
        `);
    // Note: Client-side sorting is more reliable for foreign table nulls/mixed data in this specific setup
    // unless we switch to a View.

    if (error) {
        console.error("Error fetching admin users:", error);
        return [];
    }

    const typedData = data as unknown as AdminUser[];

    return typedData.sort((a, b) => {
        const timeA = a.user_presence?.last_seen_at ? new Date(a.user_presence.last_seen_at).getTime() : 0;
        const timeB = b.user_presence?.last_seen_at ? new Date(b.user_presence.last_seen_at).getTime() : 0;
        return timeB - timeA;
    });
}

export interface AdminOrganization {
    id: string;
    name: string;
    logo_path: string | null;
    last_activity_at: string | null;
    settings: { is_founder?: boolean; founder_since?: string } | null;
    owner: {
        full_name: string | null;
        email: string;
    } | null;
    plan: {
        name: string;
    } | null;
    members: { count: number }[];
}

export async function getAdminOrganizations(): Promise<AdminOrganization[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('organizations')
        .select(`
            id,
            name,
            logo_path,
            last_activity_at,
            settings,
            owner:users!owner_id (
                full_name,
                email
            ),
            plan:plans (
                name
            ),
            members:organization_members(count)
        `);

    if (error) {
        console.error("Error fetching admin organizations:", error);
        return [];
    }

    const typedData = data as unknown as AdminOrganization[];

    // Sort by last_activity_at descending (Active Now first)
    return typedData.sort((a, b) => {
        const timeA = a.last_activity_at ? new Date(a.last_activity_at).getTime() : 0;
        const timeB = b.last_activity_at ? new Date(b.last_activity_at).getTime() : 0;
        return timeB - timeA;
    });
}

export interface DashboardData {
    kpis: {
        totalUsers: number;
        newUsers: number;
        activeNow: number;
        totalOrgs: number;
        totalProjects: number;
    };
    charts: {
        engagement: { name: string; value: number }[];
        activityByHour: { hour: string; value: number }[];
        userGrowth: { name: string; users: number }[];
        sources: { name: string; value: number; fill: string }[];
    };
    lists: {
        recentActivity: AdminUser[];
        newRegistrations: AdminUser[];
        topUsers: (AdminUser & { sessions: number })[];
        dropOff: (AdminUser & { last_session: string })[];
    };
}

export async function getAdminDashboardData(): Promise<DashboardData> {
    const supabase = await createClient();

    // Parallel fetch for main entities
    const [usersRes, orgsRes, projectsRes] = await Promise.all([
        supabase.from('users').select(`
            id, email, full_name, avatar_url, created_at, is_active,
            organization_members(count),
            user_presence ( last_seen_at, current_view, status )
        `),
        supabase.from('organizations').select('id, created_at, last_activity_at', { count: 'exact' }),
        supabase.from('projects').select('id', { count: 'exact', head: true })
    ]);

    const users = (usersRes.data || []) as unknown as AdminUser[];
    const orgs = orgsRes.data || [];
    const totalProjects = projectsRes.count || 0;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // KPI Calculations
    const totalUsers = users.length;
    const newUsers = users.filter(u => new Date(u.created_at) >= startOfMonth).length;
    const totalOrgs = orgs.length;
    // Active Now: last_seen < 5 mins ago
    const activeNow = users.filter(u => {
        const lastSeen = u.user_presence?.last_seen_at ? new Date(u.user_presence.last_seen_at) : null;
        return lastSeen && (now.getTime() - lastSeen.getTime() < 5 * 60 * 1000); // 5 mins
    }).length;

    // Chart: Engagement (Views)
    const viewCounts: Record<string, number> = {};
    users.forEach(u => {
        const view = u.user_presence?.current_view || 'Unknown';
        const normalizedView = view.replace(/_/g, ' ').replace('/', '').split('?')[0] || 'Home';
        viewCounts[normalizedView] = (viewCounts[normalizedView] || 0) + 1;
    });
    const engagement = Object.entries(viewCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    // Chart: Activity by Hour
    const hourCounts: Record<number, number> = {};
    users.forEach(u => {
        if (u.user_presence?.last_seen_at) {
            const hour = new Date(u.user_presence.last_seen_at).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        }
    });
    // Create full 24h array
    const activityByHour = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}:00`,
        value: hourCounts[i] || 0
    }));

    // Chart: User Growth (Last 6 months)
    const growthMap: Record<string, number> = {};
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 5);

    users.forEach(u => {
        const date = new Date(u.created_at);
        if (date >= sixMonthsAgo) {
            const key = date.toLocaleString('default', { month: 'short' });
            growthMap[key] = (growthMap[key] || 0) + 1;
        }
    });
    // Ensure all months are present (simple version, just mapped)
    const userGrowth = Object.entries(growthMap).map(([name, users]) => ({ name, users }));

    // Chart: Sources (Mocked as we don't track attribution yet)
    const sources = [
        { name: "Direct", value: 65, fill: "hsl(var(--chart-1))" },
        { name: "Google", value: 25, fill: "hsl(var(--chart-2))" },
        { name: "Referral", value: 10, fill: "hsl(var(--chart-3))" },
    ];

    // Lists
    const recentActivity = [...users]
        .filter(u => u.user_presence?.last_seen_at)
        .sort((a, b) => new Date(b.user_presence!.last_seen_at!).getTime() - new Date(a.user_presence!.last_seen_at!).getTime())
        .slice(0, 5);

    const newRegistrations = [...users]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

    // Top Users (Simulate sessions with org count + random factor or just organization count)
    // Using org_members count * 10 + random as "sessions" for demo realism, using REAL user data
    const topUsers = [...users]
        .map(u => ({
            ...u,
            sessions: (u.organization_members[0]?.count || 0) * 12 + Math.floor(Math.random() * 50) + 1
        }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 4);

    // Drop Off (Created > 7 days ago AND No Activity or Last Active > 7 days ago)
    const dropOff = users.filter(u => {
        const created = new Date(u.created_at);
        const lastSeen = u.user_presence?.last_seen_at ? new Date(u.user_presence.last_seen_at) : null;
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        return created < sevenDaysAgo && (!lastSeen || lastSeen < sevenDaysAgo);
    })
        .map(u => ({ ...u, last_session: u.user_presence?.last_seen_at || u.created_at }))
        .slice(0, 3);


    return {
        kpis: {
            totalUsers,
            newUsers,
            activeNow,
            totalOrgs,
            totalProjects
        },
        charts: {
            engagement,
            activityByHour,
            userGrowth,
            sources
        },
        lists: {
            recentActivity,
            newRegistrations,
            topUsers,
            dropOff
        }
    };
}
