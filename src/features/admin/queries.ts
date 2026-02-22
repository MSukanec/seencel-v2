import { createClient } from "@/lib/supabase/server";
import { getViewName } from "@/lib/view-name-map";

export interface AdminUser {
    id: string;
    auth_id: string;
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
        .schema('iam').from('users')
        .select(`
            id,
            auth_id,
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
    logo_url: string | null;
    created_at: string | null;
    updated_at: string | null;
    is_active: boolean;
    is_deleted: boolean;
    is_demo: boolean;
    settings: { is_founder?: boolean; founder_since?: string } | null;
    purchased_seats: number;
    owner_name: string | null;
    owner_email: string | null;
    plan_name: string | null;
    plan_slug: string | null;
    member_count: number;
    project_count: number;
    last_activity_at: string | null;
}

export async function getAdminOrganizations(): Promise<AdminOrganization[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('iam').from('admin_organizations_view')
        .select('*')
        .order('last_activity_at', { ascending: false, nullsFirst: false });

    if (error) {
        console.error("Error fetching admin organizations. Code:", error.code, "Message:", error.message, "Details:", error.details);
        return [];
    }

    return (data || []) as unknown as AdminOrganization[];
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
        countryDistribution: { name: string; value: number; fill: string }[];
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
        atRiskRes,
        countriesRes
    ] = await Promise.all([
        supabase.schema('ops').from('analytics_general_kpis_view').select('*').single(),
        supabase.schema('ops').from('analytics_realtime_overview_view').select('*').single(),
        supabase.schema('ops').from('analytics_user_growth_view').select('*'), // All historical months
        supabase.schema('ops').from('analytics_page_engagement_view').select('*').order('visits', { ascending: false }).limit(5),
        supabase.schema('ops').from('analytics_hourly_activity_view').select('*').order('hour_of_day', { ascending: true }),
        supabase.schema('ops').from('analytics_top_users_view').select('*').limit(5),
        // Helper queries for lists (Standard tables)
        supabase.schema('iam').from('user_presence').select(`
            last_seen_at, current_view, status,
            users (id, full_name, avatar_url, email, created_at, is_active)
        `).order('last_seen_at', { ascending: false }).limit(5),
        supabase.schema('iam').from('users').select('id, full_name, avatar_url, created_at').order('created_at', { ascending: false }).limit(5),
        // Enterprise Analytics
        supabase.schema('ops').from('analytics_bounce_rate_view').select('*').single(),
        supabase.schema('ops').from('analytics_session_duration_view').select('*').single(),
        supabase.schema('ops').from('analytics_user_journeys_view').select('*').limit(50), // Last 50 steps
        supabase.schema('ops').from('analytics_at_risk_users_view').select('*').limit(5),
        // Country distribution from user_data
        supabase.schema('ops').from('analytics_users_by_country_view').select('*').limit(10)
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

    // Charts: Country Distribution
    const chartColors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];
    const countryDistribution = (countriesRes.data || []).map((c: any, index: number) => ({
        name: c.country_name || 'Sin definir',
        value: Number(c.user_count) || 0,
        fill: chartColors[index % chartColors.length]
    }));

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
        auth_id: u.auth_id || '',
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
            countryDistribution
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

// ============================================================================
// CATALOG: System Materials Queries
// ============================================================================

export interface SystemMaterial {
    id: string;
    name: string;
    unit_id: string | null;
    unit_name: string | null;
    category_id: string | null;
    category_name: string | null;
    material_type: 'material' | 'consumable';
    is_system: boolean;
    is_deleted: boolean;
    created_at: string | null;
    // Organization info (for admin "Todos" scope)
    organization_id: string | null;
    organization_name: string | null;
    organization_logo_url: string | null;
}

export interface MaterialCategory {
    id: string;
    name: string | null;
}

export interface Unit {
    id: string;
    name: string;
    symbol?: string | null;
    applicable_to?: string[];
}

/**
 * Get all system materials for admin catalog
 */
export async function getSystemMaterials(): Promise<SystemMaterial[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('catalog').from('materials')
        .select(`
            id,
            name,
            unit_id,
            category_id,
            material_type,
            is_system,
            is_deleted,
            created_at,
            units!materials_unit_id_fkey (name),
            material_categories (name)
        `)
        .eq('is_system', true)
        .eq('is_deleted', false)
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching system materials:", error);
        return [];
    }

    return (data || []).map((m: any) => ({
        id: m.id,
        name: m.name,
        unit_id: m.unit_id,
        unit_name: m.units?.name || null,
        category_id: m.category_id,
        category_name: m.material_categories?.name || null,
        material_type: m.material_type || 'material',
        is_system: m.is_system,
        is_deleted: m.is_deleted,
        created_at: m.created_at,
        organization_id: null,
        organization_name: null,
        organization_logo_url: null,
    }));
}

/**
 * Get ALL materials (system + org) for admin catalog - allows admins to see everything
 */
export async function getAllMaterialsAdmin(): Promise<SystemMaterial[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('catalog').from('materials')
        .select(`
            id,
            name,
            unit_id,
            category_id,
            material_type,
            is_system,
            is_deleted,
            created_at,
            organization_id,
            units!materials_unit_id_fkey (name),
            material_categories (name)
        `)
        .eq('is_deleted', false)
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching all materials for admin:", error);
        return [];
    }

    return (data || []).map((m: any) => ({
        id: m.id,
        name: m.name,
        unit_id: m.unit_id,
        unit_name: m.units?.name || null,
        category_id: m.category_id,
        category_name: m.material_categories?.name || null,
        material_type: m.material_type || 'material',
        is_system: m.is_system,
        is_deleted: m.is_deleted,
        created_at: m.created_at,
        organization_id: m.organization_id || null,
        organization_name: null,
        organization_logo_url: null,
    }));
}

/**
 * Get all material categories
 */
export async function getMaterialCategories(): Promise<MaterialCategory[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('catalog').from('material_categories')
        .select('id, name')
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching material categories:", error);
        return [];
    }

    return data || [];
}

/**
 * Get all units (for material form)
 */
export async function getUnitsForMaterials(): Promise<Unit[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('catalog').from('units')
        .select('id, name, symbol, applicable_to')
        .contains('applicable_to', ['material'])
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching units for materials:", error);
        return [];
    }

    return (data || []).map((u: any) => ({
        id: u.id,
        name: u.name,
        symbol: u.symbol || null,
        applicable_to: u.applicable_to || [],
    }));
}

/**
 * Get all material categories with hierarchy info for tree display
 */
export interface MaterialCategoryNode {
    id: string;
    name: string | null;
    parent_id: string | null;
    created_at: string;
}

export async function getMaterialCategoriesHierarchy(): Promise<MaterialCategoryNode[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('catalog').from('material_categories')
        .select('id, name, parent_id, created_at')
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching material categories hierarchy:", error);
        return [];
    }

    return data || [];
}

// ============================================================================
// CATALOG: System Labor - Oficios (labor_categories)
// ============================================================================

export interface SystemLaborCategory {
    id: string;
    name: string;
    description: string | null;
    is_system: boolean;
    is_deleted: boolean;
    created_at: string | null;
}

/**
 * Get all system labor categories (oficios) for admin catalog
 */
export async function getSystemLaborCategories(): Promise<SystemLaborCategory[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('catalog').from('labor_categories')
        .select(`
            id,
            name,
            description,
            is_system,
            is_deleted,
            created_at
        `)
        .eq('is_system', true)
        .eq('is_deleted', false)
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching system labor categories:", error);
        return [];
    }

    return (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        is_system: c.is_system,
        is_deleted: c.is_deleted,
        created_at: c.created_at,
    }));
}

// ============================================================================
// CATALOG: System Labor - Niveles (labor_levels)
// ============================================================================

export interface SystemLaborLevel {
    id: string;
    name: string;
    description: string | null;
    sort_order: number;
    created_at: string | null;
}

/**
 * Get all system labor levels (niveles) for admin catalog
 * Note: labor_levels is a global system table (no is_system/is_deleted columns)
 */
export async function getSystemLaborLevels(): Promise<SystemLaborLevel[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('catalog').from('labor_levels')
        .select(`
            id,
            name,
            description,
            sort_order,
            created_at
        `)
        .order('sort_order', { ascending: true });

    if (error) {
        console.error("Error fetching system labor levels:", error);
        return [];
    }

    return (data || []).map((l: any) => ({
        id: l.id,
        name: l.name,
        description: l.description,
        sort_order: l.sort_order || 0,
        created_at: l.created_at,
    }));
}

// ============================================================================
// CATALOG: System Labor - Roles (labor_roles)
// ============================================================================

export interface SystemLaborRole {
    id: string;
    name: string;
    description: string | null;
    is_system: boolean;
    is_deleted: boolean;
    created_at: string | null;
}

/**
 * Get all system labor roles for admin catalog
 */
export async function getSystemLaborRoles(): Promise<SystemLaborRole[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('catalog').from('labor_roles')
        .select(`
            id,
            name,
            description,
            is_system,
            is_deleted,
            created_at
        `)
        .eq('is_system', true)
        .eq('is_deleted', false)
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching system labor roles:", error);
        return [];
    }

    return (data || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        is_system: r.is_system,
        is_deleted: r.is_deleted,
        created_at: r.created_at,
    }));
}

// ============================================================================
// CATALOG: System Labor - Tipos Usables (labor_types)
// ============================================================================

export interface SystemLaborType {
    id: string;
    name: string;
    description: string | null;
    labor_category_id: string;
    labor_level_id: string;
    labor_role_id: string | null;
    unit_id: string;
    created_at: string | null;
    // Joined fields
    category_name: string | null;
    level_name: string | null;
    role_name: string | null;
    unit_name: string | null;
}

/**
 * Get all system labor types for admin catalog
 * Note: labor_types is a global system table (no is_system/is_deleted columns)
 */
export async function getSystemLaborTypes(): Promise<SystemLaborType[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('catalog').from('labor_types')
        .select(`
            id,
            name,
            description,
            labor_category_id,
            labor_level_id,
            labor_role_id,
            unit_id,
            created_at,
            labor_categories (name),
            labor_levels (name),
            labor_roles (name),
            units (name)
        `)
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching system labor types:", error);
        return [];
    }

    return (data || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        labor_category_id: t.labor_category_id,
        labor_level_id: t.labor_level_id,
        labor_role_id: t.labor_role_id,
        unit_id: t.unit_id,
        created_at: t.created_at,
        category_name: t.labor_categories?.name || null,
        level_name: t.labor_levels?.name || null,
        role_name: t.labor_roles?.name || null,
        unit_name: t.units?.name || null,
    }));
}

/**
 * Get units applicable for labor
 */
export async function getUnitsForLabor(): Promise<Unit[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('catalog').from('units')
        .select('id, name, applicable_to')
        .contains('applicable_to', ['labor'])
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching units for labor:", error);
        return [];
    }

    return (data || []).map((u: any) => ({
        id: u.id,
        name: u.name
    }));
}

// ============================================================================
// CATALOG: System Units (for Admin Units Tab)
// ============================================================================

export interface SystemUnit {
    id: string;
    name: string;
    symbol: string | null;
    applicable_to: string[];
    unit_category_id: string | null;
    organization_id: string | null;
    is_system: boolean;
}

export interface SystemUnitCategory {
    id: string;
    code: string;
    name: string;
    description: string | null;
}

/**
 * Get all system units for admin catalog (where organization_id IS NULL)
 */
export async function getSystemUnits(): Promise<SystemUnit[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('catalog').from('units')
        .select('id, name, symbol, applicable_to, unit_category_id, organization_id')
        .is('organization_id', null)
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching system units:", error);
        return [];
    }

    return (data || []).map((u: any) => ({
        id: u.id,
        name: u.name,
        symbol: u.symbol || null,
        applicable_to: u.applicable_to || [],
        unit_category_id: u.unit_category_id || null,
        organization_id: null,
        is_system: true,
    }));
}

/**
 * Get all unit categories for admin catalog
 */
export async function getSystemUnitCategories(): Promise<SystemUnitCategory[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('catalog').from('unit_categories')
        .select('id, code, name, description')
        .order('name', { ascending: true });

    if (error) {
        // Table may not exist yet
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
            console.warn("unit_categories table does not exist yet");
            return [];
        }
        console.error("Error fetching unit categories:", error);
        return [];
    }

    return (data || []).map((c: any) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        description: c.description || null,
    }));
}

// ============================================================================
// User Journeys (for Activity View)
// ============================================================================

export interface UserJourney {
    session_id: string;
    user_name: string;
    avatar_url: string | null;
    started_at: string | null;
    steps: { view: string; duration: number }[];
}

/**
 * Get user journeys ordered by most recent session first
 */
export async function getUserJourneys(limit: number = 50): Promise<UserJourney[]> {
    const supabase = await createClient();

    const { data: journeysRaw, error } = await supabase
        .schema('ops').from('analytics_user_journeys_view')
        .select('*')
        .order('entered_at', { ascending: false })
        .limit(limit * 10); // Get more steps to group into sessions

    if (error) {
        console.error("Error fetching user journeys:", error);
        return [];
    }

    if (!journeysRaw || journeysRaw.length === 0) return [];

    // Group by session_id and track earliest timestamp
    const journeyMap = new Map<string, {
        user_name: string;
        avatar_url: string | null;
        started_at: string | null;
        steps: { view: string; duration: number; entered_at: string }[];
    }>();

    journeysRaw.forEach((step: any) => {
        if (!journeyMap.has(step.session_id)) {
            journeyMap.set(step.session_id, {
                user_name: step.full_name || 'Anónimo',
                avatar_url: step.avatar_url,
                started_at: step.entered_at,
                steps: []
            });
        }
        const journey = journeyMap.get(step.session_id)!;
        journey.steps.push({
            view: getViewName(step.view_name),
            duration: step.duration_seconds || 0,
            entered_at: step.entered_at
        });
        // Track the earliest timestamp as session start
        if (step.entered_at && (!journey.started_at || step.entered_at < journey.started_at)) {
            journey.started_at = step.entered_at;
        }
    });

    // Convert to array and sort by most recent session
    const sortedJourneys = Array.from(journeyMap.entries())
        .map(([session_id, data]) => ({
            session_id,
            user_name: data.user_name,
            avatar_url: data.avatar_url,
            started_at: data.started_at,
            // Sort steps within session by time (oldest first)
            steps: data.steps
                .sort((a, b) => new Date(a.entered_at).getTime() - new Date(b.entered_at).getTime())
                .map(s => ({ view: s.view, duration: s.duration }))
        }))
        .sort((a, b) => {
            if (!a.started_at) return 1;
            if (!b.started_at) return -1;
            return new Date(b.started_at).getTime() - new Date(a.started_at).getTime();
        })
        .slice(0, limit);

    return sortedJourneys;
}

// ============================================================================
// User Detail (Admin User Profile Page)
// ============================================================================

export interface AdminUserDetail {
    // Core user
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    avatar_source: string | null;
    is_active: boolean;
    signup_completed: boolean;
    created_at: string;
    role_id: string;
    // Extended data
    first_name: string | null;
    last_name: string | null;
    phone_e164: string | null;
    birthdate: string | null;
    country_name: string | null;
    // Preferences
    theme: string | null;
    language: string | null;
    layout: string | null;
    sidebar_mode: string | null;
    timezone: string | null;
    // Presence
    last_seen_at: string | null;
    current_view: string | null;
    status: string | null;
    user_agent: string | null;
    // Organizations
    organizations: {
        id: string;
        name: string;
        logo_url: string | null;
        role_name: string | null;
        plan_name: string | null;
        joined_at: string | null;
        is_active: boolean;
    }[];
    // Session stats
    total_sessions: number;
    total_pageviews: number;
    total_time_seconds: number;
    // View history (raw for the activity timeline)
    view_history: {
        id: string;
        view_name: string;
        entered_at: string;
        exited_at: string | null;
        duration_seconds: number | null;
        session_id: string | null;
    }[];
}

export async function getAdminUserDetail(userId: string): Promise<AdminUserDetail | null> {
    const supabase = await createClient();

    // Parallel fetch all user data
    const [
        userRes,
        userDataRes,
        prefsRes,
        presenceRes,
        membersRes,
        statsRes,
        historyRes,
    ] = await Promise.all([
        // Core user
        supabase.schema('iam').from('users').select('*').eq('id', userId).single(),
        // Extended data
        supabase.schema('iam').from('user_data').select('first_name, last_name, phone_e164, birthdate, country').eq('user_id', userId).maybeSingle(),
        // Preferences
        supabase.schema('iam').from('user_preferences').select('theme, language, layout, sidebar_mode, timezone').eq('user_id', userId).maybeSingle(),
        // Presence
        supabase.schema('iam').from('user_presence').select('last_seen_at, current_view, status, user_agent').eq('user_id', userId).maybeSingle(),
        // Organizations with plan
        supabase.schema('iam').from('organization_members')
            .select(`
                organization_id,
                joined_at,
                is_active,
                roles (name),
                organizations (
                    id,
                    name,
                    logo_url
                )
            `)
            .eq('user_id', userId),
        // Session stats from analytics view
        supabase.schema('ops').from('analytics_top_users_view').select('total_sessions, total_pageviews, total_time_seconds').eq('id', userId).maybeSingle(),
        // Recent view history (last 200 entries)
        supabase.schema('iam').from('user_view_history').select('id, view_name, entered_at, exited_at, duration_seconds, session_id').eq('user_id', userId).order('entered_at', { ascending: false }).limit(200),
    ]);

    if (userRes.error || !userRes.data) {
        console.error("Error fetching user detail:", userRes.error);
        return null;
    }

    const user = userRes.data;
    const userData = userDataRes.data;
    const prefs = prefsRes.data;
    const presence = presenceRes.data;
    const stats = statsRes.data;

    // Parse organizations — plan_name requires cross-schema query (billing)
    const orgIds = (membersRes.data || []).map((m: any) => m.organization_id).filter(Boolean);
    let subsMap: Record<string, string> = {};
    if (orgIds.length > 0) {
        const { data: subs } = await supabase.schema('billing').from('organization_subscriptions')
            .select('organization_id, plans (name)')
            .in('organization_id', orgIds)
            .eq('status', 'active');
        for (const s of (subs || []) as any[]) {
            subsMap[s.organization_id] = s.plans?.name || null;
        }
    }
    const organizations = (membersRes.data || []).map((m: any) => ({
        id: m.organizations?.id || m.organization_id,
        name: m.organizations?.name || 'Desconocida',
        logo_url: m.organizations?.logo_url || null,
        role_name: m.roles?.name || null,
        plan_name: subsMap[m.organization_id] || null,
        joined_at: m.joined_at,
        is_active: m.is_active,
    }));

    return {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        avatar_source: user.avatar_source,
        is_active: user.is_active,
        signup_completed: user.signup_completed,
        created_at: user.created_at,
        role_id: user.role_id,
        first_name: userData?.first_name || null,
        last_name: userData?.last_name || null,
        phone_e164: userData?.phone_e164 || null,
        birthdate: userData?.birthdate || null,
        country_name: (userData?.country as any)?.name || null,
        theme: prefs?.theme || null,
        language: prefs?.language || null,
        layout: prefs?.layout || null,
        sidebar_mode: prefs?.sidebar_mode || null,
        timezone: prefs?.timezone || null,
        last_seen_at: presence?.last_seen_at || null,
        current_view: presence?.current_view || null,
        status: presence?.status || null,
        user_agent: presence?.user_agent || null,
        organizations,
        total_sessions: stats?.total_sessions || 0,
        total_pageviews: stats?.total_pageviews || 0,
        total_time_seconds: stats?.total_time_seconds || 0,
        view_history: (historyRes.data || []).map((h: any) => ({
            id: h.id,
            view_name: h.view_name,
            entered_at: h.entered_at,
            exited_at: h.exited_at,
            duration_seconds: h.duration_seconds,
            session_id: h.session_id,
        })),
    };
}

// ============================================================================
// Organization Detail (Admin Organization Profile Page)
// ============================================================================

export interface AdminOrganizationDetail {
    // Core org
    id: string;
    name: string;
    logo_url: string | null;
    created_at: string | null;
    updated_at: string | null;
    is_active: boolean;
    is_deleted: boolean;
    is_demo: boolean;
    settings: { is_founder?: boolean; founder_since?: string; business_mode?: string } | null;
    purchased_seats: number;
    // Owner
    owner_id: string | null;
    owner_name: string | null;
    owner_email: string | null;
    owner_avatar_url: string | null;
    // Plan
    plan_id: string | null;
    plan_name: string | null;
    plan_slug: string | null;
    // Counts
    member_count: number;
    project_count: number;
    last_activity_at: string | null;
    // Members list
    members: {
        id: string;
        user_id: string;
        full_name: string | null;
        email: string;
        avatar_url: string | null;
        role_name: string | null;
        is_active: boolean;
        joined_at: string | null;
    }[];
    // Projects list
    projects: {
        id: string;
        name: string;
        status: string;
        code: string | null;
        color: string | null;
        created_at: string;
    }[];
}

export async function getAdminOrganizationDetail(orgId: string): Promise<AdminOrganizationDetail | null> {
    const supabase = await createClient();

    const [orgRes, membersRes, projectsRes] = await Promise.all([
        // Get org from the admin view (includes owner, plan, counts)
        supabase
            .schema('iam').from('admin_organizations_view')
            .select('*')
            .eq('id', orgId)
            .single(),
        // Get members with user info
        supabase
            .schema('iam').from('organization_members')
            .select(`
                id,
                user_id,
                is_active,
                joined_at,
                roles (name),
                users (
                    full_name,
                    email,
                    avatar_url
                )
            `)
            .eq('organization_id', orgId)
            .eq('is_active', true)
            .order('joined_at', { ascending: true }),
        // Get projects
        supabase
            .schema('projects').from('projects')
            .select('id, name, status, code, color, created_at')
            .eq('organization_id', orgId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })
            .limit(50),
    ]);

    if (orgRes.error || !orgRes.data) {
        console.error("Error fetching org detail:", orgRes.error);
        return null;
    }

    const org = orgRes.data as any;

    // Get owner details separately (admin_organizations_view might not have avatar)
    let ownerAvatarUrl: string | null = null;
    if (org.owner_name || org.owner_email) {
        const { data: ownerData } = await supabase
            .schema('iam').from('users')
            .select('avatar_url')
            .eq('email', org.owner_email)
            .maybeSingle();
        ownerAvatarUrl = ownerData?.avatar_url || null;
    }

    const members = (membersRes.data || []).map((m: any) => ({
        id: m.id,
        user_id: m.user_id,
        full_name: m.users?.full_name || null,
        email: m.users?.email || '',
        avatar_url: m.users?.avatar_url || null,
        role_name: m.roles?.name || null,
        is_active: m.is_active,
        joined_at: m.joined_at,
    }));

    const projects = (projectsRes.data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        code: p.code,
        color: p.color,
        created_at: p.created_at,
    }));

    return {
        id: org.id,
        name: org.name,
        logo_url: org.logo_url,
        created_at: org.created_at,
        updated_at: org.updated_at,
        is_active: org.is_active,
        is_deleted: org.is_deleted,
        is_demo: org.is_demo,
        settings: org.settings,
        purchased_seats: org.purchased_seats || 0,
        owner_id: null, // Not available in view
        owner_name: org.owner_name,
        owner_email: org.owner_email,
        owner_avatar_url: ownerAvatarUrl,
        plan_id: null, // We use plan_slug for updates
        plan_name: org.plan_name,
        plan_slug: org.plan_slug,
        member_count: org.member_count || 0,
        project_count: org.project_count || 0,
        last_activity_at: org.last_activity_at,
        members,
        projects,
    };
}

// ============================================================================
// Plans List (for Admin Quick Edit)
// ============================================================================

export interface AdminPlan {
    id: string;
    name: string;
    slug: string | null;
    is_active: boolean;
    status: string;
}

export async function getPlansForAdmin(): Promise<AdminPlan[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('billing').from('plans')
        .select('id, name, slug, is_active, status')
        .eq('is_active', true)
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching plans:", error);
        return [];
    }

    return (data || []) as AdminPlan[];
}
