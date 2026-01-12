import { createClient } from "@/lib/supabase/server";
import { getViewName } from "@/lib/view-name-map";

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
        console.error("Error fetching admin users. Code:", error.code, "Message:", error.message, "Details:", error.details);
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
    last_activity_at?: string | Date;
    created_at: string | null;
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
            created_at,
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
        console.error("Error fetching admin organizations. Code:", error.code, "Message:", error.message, "Details:", error.details);
        return [];
    }

    const typedData = data as unknown as AdminOrganization[];

    // Sort by created_at descending (Newest first)
    return typedData.sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
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
        // Enterprise KPIs
        bounceRate: number;
        avgSessionDuration: number; // in seconds
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
        dropOff: { id: string; full_name: string; avatar_url: string | null; session_count: number }[];
        userJourneys: { session_id: string; user_name: string; avatar_url: string | null; steps: { view: string; duration: number }[] }[];
    };
}

export async function getAdminDashboardData(): Promise<DashboardData> {
    const supabase = await createClient();

    // 1. Fetch from New Analytics Views (Parallel)
    const [
        kpisRes,
        realtimeRes,
        growthRes,
        engagementRes,
        hourlyRes,
        topUsersRes,
        recentActivityRes,
        newUsersRes,
        // Enterprise Views
        bounceRes,
        durationRes,
        journeysRes,
        atRiskRes
    ] = await Promise.all([
        supabase.from('analytics_general_kpis_view').select('*').single(),
        supabase.from('analytics_realtime_overview_view').select('*').single(),
        supabase.from('analytics_user_growth_view').select('*'), // All historical months
        supabase.from('analytics_page_engagement_view').select('*').order('visits', { ascending: false }).limit(5),
        supabase.from('analytics_hourly_activity_view').select('*').order('hour_of_day', { ascending: true }),
        supabase.from('analytics_top_users_view').select('*').limit(5),
        // Helper queries for lists (Standard tables)
        supabase.from('user_presence').select(`
            last_seen_at, current_view, status,
            users (id, full_name, avatar_url, email, created_at, is_active)
        `).order('last_seen_at', { ascending: false }).limit(5),
        supabase.from('users').select('id, full_name, avatar_url, created_at').order('created_at', { ascending: false }).limit(5),
        // Enterprise Analytics
        supabase.from('analytics_bounce_rate_view').select('*').single(),
        supabase.from('analytics_session_duration_view').select('*').single(),
        supabase.from('analytics_user_journeys_view').select('*').limit(50), // Last 50 steps
        supabase.from('analytics_at_risk_users_view').select('*').limit(5)
    ]);

    // 2. Parse Data
    const kpisData = kpisRes.data || { total_users: 0, total_organizations: 0, total_projects: 0 };
    const realtimeData = realtimeRes.data || { active_users: 0 };
    const bounceData = bounceRes.data || { bounce_rate_percent: 0 };
    const durationData = durationRes.data || { avg_duration_seconds: 0 };

    // Kpis
    const kpis = {
        totalUsers: kpisData.total_users,
        newUsers: growthRes.data?.[0]?.new_users || 0, // Latest month
        activeNow: realtimeData.active_users,
        totalOrgs: kpisData.total_organizations,
        totalProjects: kpisData.total_projects,
        bounceRate: bounceData.bounce_rate_percent || 0,
        avgSessionDuration: durationData.avg_duration_seconds || 0
    };

    // Charts: User Growth (Monthly) - Show "mes 'YY" format
    const userGrowth = (growthRes.data || []).map((d: any) => {
        const date = new Date(d.date);
        const month = date.toLocaleDateString('es-ES', { month: 'short' });
        const year = date.getFullYear().toString().slice(-2);
        return {
            name: `${month} '${year}`,
            users: d.new_users
        };
    }).reverse();

    // Charts: Engagement (Using centralized view name map)
    const engagement = (engagementRes.data || []).map((d: any) => ({
        name: getViewName(d.view_name),
        value: d.visits
    }));

    // Charts: Hourly
    const hourlyMap = new Map((hourlyRes.data || []).map((d: any) => [d.hour_of_day, d.activity_count]));
    const activityByHour = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}:00`,
        value: hourlyMap.get(i) || 0
    }));

    // Charts: Sources (Placeholder - requires attribution tracking)
    const sources = [
        { name: "Direct", value: 65, fill: "hsl(var(--chart-1))" },
        { name: "Google", value: 25, fill: "hsl(var(--chart-2))" },
        { name: "Referral", value: 10, fill: "hsl(var(--chart-3))" },
    ];

    // Lists transformation
    const recentActivity = (recentActivityRes.data || []).map((record: any) => ({
        id: record.users?.id,
        email: record.users?.email,
        full_name: record.users?.full_name,
        avatar_url: record.users?.avatar_url,
        created_at: record.users?.created_at,
        is_active: record.users?.is_active,
        organization_members: [], // Not needed for this view
        user_presence: {
            last_seen_at: record.last_seen_at,
            current_view: record.current_view,
            status: record.status
        }
    })) as unknown as AdminUser[];

    const newRegistrations = (newUsersRes.data || []) as unknown as AdminUser[];

    const topUsers = (topUsersRes.data || []).map((u: any) => ({
        id: u.id,
        full_name: u.full_name,
        avatar_url: u.avatar_url,
        email: '',
        created_at: '',
        is_active: true,
        organization_members: [],
        user_presence: null,
        sessions: (u.total_sessions > 0 ? u.total_sessions : u.total_pageviews) || 0
    }));

    // Drop Off (From at_risk view)
    const dropOff = (atRiskRes.data || []).map((u: any) => ({
        id: u.id,
        full_name: u.full_name,
        avatar_url: u.avatar_url,
        session_count: u.session_count || 0
    }));

    // User Journeys (Group by session_id)
    const journeysRaw = journeysRes.data || [];
    const journeyMap = new Map<string, { user_name: string; avatar_url: string | null; steps: { view: string; duration: number }[] }>();
    journeysRaw.forEach((step: any) => {
        if (!journeyMap.has(step.session_id)) {
            journeyMap.set(step.session_id, {
                user_name: step.full_name || 'Anónimo',
                avatar_url: step.avatar_url,
                steps: []
            });
        }
        journeyMap.get(step.session_id)!.steps.push({
            view: getViewName(step.view_name),
            duration: step.duration_seconds || 0
        });
    });
    const userJourneys = Array.from(journeyMap.entries()).slice(0, 5).map(([session_id, data]) => ({
        session_id,
        ...data
    }));

    return {
        kpis,
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
            dropOff,
            userJourneys
        }
    };
}

