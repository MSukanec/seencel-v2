"use server";

import { createClient } from "@/lib/supabase/server";

// ============================================================================
// WIDGET SERVER ACTIONS
// ============================================================================
// Acciones livianas para que los widgets fetcheen sus propios datos.
// Cada widget es autónomo y no depende de providers.
// ============================================================================

async function getActiveOrganizationId(): Promise<string | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: userData } = await supabase
        .from('users')
        .select(`id, user_preferences!inner(last_organization_id)`)
        .eq('auth_id', user.id)
        .single();

    if (!userData?.user_preferences) return null;
    const pref = Array.isArray(userData.user_preferences)
        ? (userData.user_preferences as any)[0]
        : (userData.user_preferences as any);
    return pref?.last_organization_id || null;
}

// ============================================================================
// Activity Feed Item (returned to client)
// ============================================================================
export interface ActivityFeedItem {
    id: string;
    action: string;          // e.g. "create", "update", "delete"
    target_table: string;    // e.g. "materials", "tasks"
    full_name: string | null;
    avatar_url: string | null;
    metadata: Record<string, any> | null;
    created_at: string;
}

/**
 * Fetches recent activity items for the ActivityWidget.
 * Returns the last `limit` items based on scope.
 */
export async function getActivityFeedItems(
    scope: string,
    limit: number = 5,
    projectId?: string | null
): Promise<ActivityFeedItem[]> {
    try {
        const orgId = await getActiveOrganizationId();
        if (!orgId) return [];

        const supabase = await createClient();

        // All scopes query organization_activity_logs_view,
        // but filter by target_table for domain-specific scopes.
        let query = supabase
            .from("organization_activity_logs_view")
            .select("id, action, target_table, full_name, avatar_url, metadata, created_at")
            .eq("organization_id", orgId)
            .order("created_at", { ascending: false })
            .limit(limit);

        // Filter by project if active (requires metadata->>'project_id' in audit triggers)
        if (projectId) {
            query = query.eq('metadata->>project_id', projectId);
        }

        // Filter by relevant tables depending on scope
        switch (scope) {
            case "finance":
                query = query.in("target_table", [
                    "financial_movements",
                    "general_costs",
                    "general_costs_payments",
                    "general_cost_categories",
                    "client_payments",
                    "subcontract_payments",
                ]);
                break;
            case "project":
                query = query.in("target_table", [
                    "projects",
                    "project_data",
                    "tasks",
                    "design_documents",
                    "quotes",
                    "quote_items",
                ]);
                break;
            // 'organization' → no filter, show everything
        }

        const { data, error } = await query;

        if (error) {
            console.error("Activity feed error:", error);
            return [];
        }

        return (data || []) as ActivityFeedItem[];
    } catch (error) {
        console.error("Activity feed error:", error);
        return [];
    }
}

// ============================================================================
// Recent Projects (returned to client)
// ============================================================================
export interface RecentProject {
    id: string;
    name: string;
    city: string | null;
    country: string | null;
    image_url: string | null;
    image_bucket: string | null;
    image_path: string | null;
    image_palette: {
        primary: string;
        secondary: string;
        background: string;
        accent: string;
    } | null;
    color: string | null;
    custom_color_hex: string | null;
    use_custom_color: boolean;
}

/**
 * Fetches the most recently active projects for the RecentProjectsWidget.
 */
export async function getRecentProjects(
    limit: number = 6
): Promise<RecentProject[]> {
    try {
        const orgId = await getActiveOrganizationId();
        if (!orgId) return [];

        const supabase = await createClient();

        const { data, error } = await supabase
            .from("projects_view")
            .select("*")
            .eq("organization_id", orgId)
            .eq("is_deleted", false)
            .eq("status", "active")
            .order("last_active_at", { ascending: false, nullsFirst: false })
            .limit(limit);

        if (error) {
            console.error("Recent projects error:", error);
            return [];
        }

        return (data || []) as RecentProject[];
    } catch (error) {
        console.error("Recent projects error:", error);
        return [];
    }
}

// ============================================================================
// Upcoming Events (returned to client)
// ============================================================================

export interface UpcomingEventItem {
    id: string;
    title: string;
    date: string;            // ISO date/datetime
    type: 'calendar' | 'kanban';
    color: string | null;
    isAllDay: boolean;
    priority: string | null; // kanban priority
    projectName: string | null;
}

/**
 * Fetches upcoming events from calendar_events and/or kanban_cards.
 * @param scope 'all' | 'calendar' | 'kanban'
 * @param limit Max items to return
 */
export async function getUpcomingEvents(
    scope: string = 'all',
    limit: number = 8,
    projectId?: string | null
): Promise<UpcomingEventItem[]> {
    try {
        const orgId = await getActiveOrganizationId();
        if (!orgId) return [];

        const supabase = await createClient();
        const now = new Date().toISOString();
        const today = now.split('T')[0]; // YYYY-MM-DD

        const items: UpcomingEventItem[] = [];

        // Calendar events
        if (scope === 'all' || scope === 'calendar') {
            let calQuery = supabase
                .from('calendar_events')
                .select('id, title, start_at, color, is_all_day, status, projects(name)')
                .eq('organization_id', orgId)
                .eq('status', 'scheduled')
                .is('deleted_at', null)
                .gte('start_at', now)
                .order('start_at', { ascending: true })
                .limit(limit);

            if (projectId) {
                calQuery = calQuery.eq('project_id', projectId);
            }

            const { data: events } = await calQuery;

            if (events) {
                for (const e of events) {
                    items.push({
                        id: e.id,
                        title: e.title,
                        date: e.start_at,
                        type: 'calendar',
                        color: e.color,
                        isAllDay: e.is_all_day,
                        priority: null,
                        projectName: (e as any).projects?.name || null,
                    });
                }
            }
        }

        // Kanban cards with due_date
        if (scope === 'all' || scope === 'kanban') {
            let kanbanQuery = supabase
                .from('kanban_cards')
                .select('id, title, due_date, priority, is_completed, kanban_boards!inner(organization_id, name, project_id)')
                .eq('kanban_boards.organization_id', orgId)
                .eq('is_completed', false)
                .eq('is_archived', false)
                .eq('is_deleted', false)
                .not('due_date', 'is', null)
                .gte('due_date', today)
                .order('due_date', { ascending: true })
                .limit(limit);

            if (projectId) {
                kanbanQuery = kanbanQuery.eq('kanban_boards.project_id', projectId);
            }

            const { data: cards } = await kanbanQuery;

            if (cards) {
                for (const c of cards) {
                    items.push({
                        id: c.id,
                        title: c.title,
                        date: c.due_date!,
                        type: 'kanban',
                        color: null,
                        isAllDay: true,
                        priority: c.priority,
                        projectName: null,
                    });
                }
            }
        }

        // Sort by date, take first `limit`
        items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return items.slice(0, limit);
    } catch (error) {
        console.error('[getUpcomingEvents] Error:', error);
        return [];
    }
}

// ============================================================================
// Financial Summary (Ingresos / Egresos / Balance)
// ============================================================================

export type FinancialSummaryData = {
    income: number;
    expenses: number;
    balance: number;
    currencySymbol: string;
    currencyCode: string;
};

/** Raw movement data for client-side KPI calculation via useMoney */
export type FinancialMovementRaw = {
    amount: number;
    currency_code: string;
    exchange_rate: number | null;
    amount_sign: number;
    payment_date: string | null;
};

/**
 * Fetches financial summary (income, expenses, balance) in functional currency.
 * Uses unified_financial_movements_view with amount_sign:
 *   1 = income (client_payment)
 *  -1 = expense (material, labor, subcontract, general_cost)
 *   0 = neutral (transfers, exchanges) - excluded from totals
 */
export async function getFinancialSummary(
    scope: string = 'organization',
    projectId?: string | null
): Promise<FinancialSummaryData> {
    const supabase = await createClient();
    const orgId = await getActiveOrganizationId();
    if (!orgId) {
        return { income: 0, expenses: 0, balance: 0, currencySymbol: '$', currencyCode: 'ARS' };
    }

    // Use SQL function for aggregation (1 row instead of N rows)
    const { data, error } = await supabase.rpc('fn_financial_kpi_summary', {
        p_org_id: orgId,
        ...(scope === 'project' && projectId ? { p_project_id: projectId } : {}),
    });

    if (error || !data || data.length === 0) {
        console.error('[getFinancialSummary] RPC error:', error);
        return { income: 0, expenses: 0, balance: 0, currencySymbol: '$', currencyCode: 'ARS' };
    }

    const row = data[0];
    return {
        income: Number(row.income) || 0,
        expenses: Number(row.expenses) || 0,
        balance: Number(row.balance) || 0,
        currencySymbol: row.currency_symbol || '$',
        currencyCode: row.currency_code || 'ARS',
    };
}

// ============================================================================
// STORAGE OVERVIEW (returned to client)
// ============================================================================

export interface StorageOverviewData {
    totalBytes: number;
    fileCount: number;
    folderCount: number;
    maxStorageMb: number;
    byType: { type: string; count: number; bytes: number }[];
}

/**
 * Fetches storage stats for the StorageOverviewWidget.
 * Autonomous: resolves orgId from user preferences.
 */
export async function getStorageOverviewData(): Promise<StorageOverviewData> {
    try {
        const orgId = await getActiveOrganizationId();
        if (!orgId) return { totalBytes: 0, fileCount: 0, folderCount: 0, maxStorageMb: 500, byType: [] };

        const supabase = await createClient();

        // Use SQL function for aggregation (1 row instead of N rows)
        const { data, error } = await supabase.rpc('fn_storage_overview', {
            p_org_id: orgId,
        });

        if (error || !data || data.length === 0) {
            console.error('[getStorageOverviewData] RPC error:', error);
            return { totalBytes: 0, fileCount: 0, folderCount: 0, maxStorageMb: 500, byType: [] };
        }

        const row = data[0];
        const byType = Array.isArray(row.by_type) ? row.by_type : [];

        return {
            totalBytes: Number(row.total_bytes) || 0,
            fileCount: Number(row.file_count) || 0,
            folderCount: Number(row.folder_count) || 0,
            maxStorageMb: Number(row.max_storage_mb) || 500,
            byType: byType.map((t: any) => ({
                type: t.type || 'other',
                count: Number(t.count) || 0,
                bytes: Number(t.bytes) || 0,
            })),
        };
    } catch (error) {
        console.error('[getStorageOverviewData] Error:', error);
        return { totalBytes: 0, fileCount: 0, folderCount: 0, maxStorageMb: 500, byType: [] };
    }
}

// ============================================================================
// RECENT FILES (for RecentFilesWidget / Mini Gallery)
// ============================================================================

export interface RecentFileItem {
    id: string;
    file_name: string;
    file_type: string;
    file_size: number;
    url: string;
    signed_url?: string;
    /** Optimized thumbnail URL (256px) for image files */
    thumbnail_url?: string;
    created_at: string;
    project_id?: string | null;
}

/**
 * Fetches recent files for the RecentFilesWidget.
 * Supports filtering by file type category and scope (organization or project).
 * @param fileType 'all' | 'media' | 'image' | 'video' | 'pdf' | 'document'
 * @param scope 'organization' | projectId (UUID)
 * @param limit Max files to return
 */
export async function getRecentFiles(
    fileType: string = 'all',
    scope: string = 'organization',
    limit: number = 12
): Promise<RecentFileItem[]> {
    try {
        const orgId = await getActiveOrganizationId();
        if (!orgId) return [];

        const supabase = await createClient();

        let query = supabase
            .from('media_links')
            .select(`
                id,
                project_id,
                media_files!inner (
                    id,
                    file_name,
                    file_type,
                    file_size,
                    bucket,
                    file_path,
                    created_at
                )
            `)
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })
            .limit(limit);

        // Filter by project scope
        if (scope !== 'organization' && scope !== 'all') {
            query = query.eq('project_id', scope);
        }

        // Filter by file type category
        if (fileType !== 'all') {
            switch (fileType) {
                case 'media':
                    query = query.in('media_files.file_type', ['image', 'video']);
                    break;
                case 'image':
                    query = query.eq('media_files.file_type', 'image');
                    break;
                case 'video':
                    query = query.eq('media_files.file_type', 'video');
                    break;
                case 'pdf':
                    query = query.eq('media_files.file_type', 'pdf');
                    break;
                case 'document':
                    query = query.not('media_files.file_type', 'eq', 'image')
                        .not('media_files.file_type', 'eq', 'video')
                        .not('media_files.file_type', 'eq', 'pdf');
                    break;
            }
        }

        const { data, error } = await query;
        if (error) {
            console.error('[getRecentFiles] Error:', error);
            return [];
        }
        if (!data || data.length === 0) return [];

        // Separate files by bucket type for URL generation
        const publicBuckets = ['public-assets', 'social-assets'];
        const privateFiles = data.filter((row: any) => !publicBuckets.includes(row.media_files.bucket));
        const publicFiles = data.filter((row: any) => publicBuckets.includes(row.media_files.bucket));

        // Generate signed URLs for private bucket files (batch)
        const signedUrlMap = new Map<string, string>();
        if (privateFiles.length > 0) {
            // Group by bucket for batch signing
            const byBucket = new Map<string, { path: string; id: string }[]>();
            privateFiles.forEach((row: any) => {
                const mf = row.media_files;
                if (!byBucket.has(mf.bucket)) byBucket.set(mf.bucket, []);
                byBucket.get(mf.bucket)!.push({ path: mf.file_path, id: mf.id });
            });

            for (const [bucket, files] of byBucket) {
                const { data: signedData } = await supabase.storage
                    .from(bucket)
                    .createSignedUrls(files.map(f => f.path), 3600); // 1 hour

                if (signedData) {
                    signedData.forEach((signed, i) => {
                        if (signed.signedUrl) {
                            signedUrlMap.set(files[i].id, signed.signedUrl);
                        }
                    });
                }
            }
        }

        // Build items
        const items: RecentFileItem[] = data.map((row: any) => {
            const mf = row.media_files;
            const isPublicBucket = publicBuckets.includes(mf.bucket);
            const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${mf.bucket}/${mf.file_path}`;
            const fileUrl = isPublicBucket ? publicUrl : (signedUrlMap.get(mf.id) || publicUrl);

            // Generate thumbnail URL for images (256px, cover crop)
            let thumbnailUrl: string | undefined;
            if (mf.file_type === 'image') {
                if (isPublicBucket) {
                    // Public: use Supabase Image Transformation endpoint
                    thumbnailUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/render/image/public/${mf.bucket}/${mf.file_path}?width=256&height=256&resize=cover&quality=60`;
                } else {
                    // Private: append transform params to signed URL
                    const signedUrl = signedUrlMap.get(mf.id);
                    if (signedUrl) {
                        thumbnailUrl = `${signedUrl}&width=256&height=256&resize=cover&quality=60`;
                    }
                }
            }

            return {
                id: mf.id,
                file_name: mf.file_name,
                file_type: mf.file_type,
                file_size: mf.file_size,
                url: fileUrl,
                signed_url: fileUrl,
                thumbnail_url: thumbnailUrl,
                created_at: mf.created_at,
                project_id: row.project_id,
            };
        });

        return items;
    } catch (error) {
        console.error('[getRecentFiles] Error:', error);
        return [];
    }
}

// ============================================================================
// PREFETCH ALL ORG WIDGET DATA (Server-side, single auth)
// ============================================================================
// Called from page.tsx to fetch all widget data in parallel on the server.
// Receives orgId as param so we avoid repeated auth lookups.
// ============================================================================

export async function prefetchOrgWidgetData(orgId: string): Promise<Record<string, any>> {
    const supabase = await createClient();
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    const [activityResult, projectsResult, orgResult, membersResult, projectCountResult, projectLocationsResult, membersAvatarResult, calendarResult, kanbanResult, financialResult, prefsResult, teamMembersResult, storageFilesResult, storageFoldersResult] = await Promise.all([
        // Activity feed (scope: organization, no filter)
        supabase
            .from("organization_activity_logs_view")
            .select("id, action, target_table, full_name, avatar_url, metadata, created_at")
            .eq("organization_id", orgId)
            .order("created_at", { ascending: false })
            .limit(5),

        // Recent projects
        supabase
            .from("projects_view")
            .select("*")
            .eq("organization_id", orgId)
            .eq("is_deleted", false)
            .eq("status", "active")
            .order("last_active_at", { ascending: false, nullsFirst: false })
            .limit(2),

        // Org info (name, logo, plan, settings) for pulse widget
        supabase
            .from("organizations")
            .select("name, logo_url, settings, plan_id")
            .eq("id", orgId)
            .single(),

        // Member count
        supabase
            .from("organization_members")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", orgId)
            .eq("is_active", true),

        // Active project count
        supabase
            .from("projects")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", orgId)
            .eq("is_deleted", false),

        // Project locations for map (only projects with coordinates)
        supabase
            .from("project_data")
            .select("lat, lng, city, country, address, projects!inner(id, name, status, is_deleted, image_url)")
            .eq("organization_id", orgId)
            .not("lat", "is", null)
            .not("lng", "is", null),

        // Member avatars for pulse widget
        supabase
            .from("organization_members")
            .select("users(full_name, avatar_url, email)")
            .eq("organization_id", orgId)
            .eq("is_active", true)
            .limit(8),

        // Upcoming calendar events (next 14 days)
        supabase
            .from('calendar_events')
            .select('id, title, start_at, color, is_all_day, status, projects(name)')
            .eq('organization_id', orgId)
            .eq('status', 'scheduled')
            .is('deleted_at', null)
            .gte('start_at', now)
            .order('start_at', { ascending: true })
            .limit(8),

        // Upcoming kanban cards with due_date
        supabase
            .from('kanban_cards')
            .select('id, title, due_date, priority, is_completed, kanban_boards!inner(organization_id, name)')
            .eq('kanban_boards.organization_id', orgId)
            .eq('is_completed', false)
            .eq('is_archived', false)
            .eq('is_deleted', false)
            .not('due_date', 'is', null)
            .gte('due_date', today)
            .order('due_date', { ascending: true })
            .limit(8),

        // Financial movements (raw fields for client-side calculation via useMoney)
        supabase
            .from('unified_financial_movements_view')
            .select('amount, currency_code, exchange_rate, amount_sign, payment_date')
            .eq('organization_id', orgId)
            .neq('amount_sign', 0),

        // Org preferences for currency
        supabase
            .from('organization_preferences')
            .select('functional_currency_id')
            .eq('organization_id', orgId)
            .single(),

        // Team members with real presence via user_presence
        supabase
            .from('organization_members')
            .select('id, users(full_name, avatar_url, email, user_presence(last_seen_at)), roles(name)')
            .eq('organization_id', orgId)
            .eq('is_active', true)
            .limit(10),

        // Storage: file sizes and types for storage overview widget
        supabase
            .from('media_files')
            .select('file_type, file_size')
            .eq('organization_id', orgId)
            .eq('is_deleted', false),

        // Storage: folder count
        supabase
            .from('media_file_folders')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId),
    ]);

    // Build project locations (filter out deleted projects)
    const projectLocations = (projectLocationsResult.data || [])
        .filter((pd: any) => pd.projects && !pd.projects.is_deleted)
        .map((pd: any) => {
            const p = pd.projects;
            return {
                id: p.id,
                name: p.name,
                status: p.status,
                lat: Number(pd.lat),
                lng: Number(pd.lng),
                city: pd.city,
                country: pd.country,
                address: pd.address || null,
                imageUrl: p.image_url || null,
            };
        });

    // Build members list for AvatarStack
    const membersForStack = (membersAvatarResult?.data || [])
        .filter((m: any) => m.users)
        .map((m: any) => ({
            name: m.users.full_name || "Member",
            image: m.users.avatar_url || null,
            email: m.users.email || undefined,
        }));

    // Fetch plan from billing schema separately (cross-schema FK can't be embedded)
    const orgData = orgResult.data as any;
    let orgPlan: { name: string; slug: string; plan_features: any } | null = null;
    if (orgData?.plan_id) {
        const { data: planData } = await supabase
            .schema('billing').from('plans')
            .select('name, slug, plan_features(max_storage_mb)')
            .eq('id', orgData.plan_id)
            .single();
        orgPlan = planData;
    }

    // Build pulse data (must match HeroData interface in overview-widget.tsx)
    const pulseData = {
        name: orgData?.name || "Organización",
        avatarUrl: orgData?.logo_url || null,
        planName: orgPlan?.name || null,
        planSlug: orgPlan?.slug || null,
        isFounder: (orgData?.settings as any)?.is_founder === true,
        memberCount: membersResult.count || 0,
        projectCount: projectCountResult.count || 0,
        recentActivityCount: activityResult.data?.length || 0,
        projectLocations,
        members: membersForStack,
        isProjectMode: false,
        projectStatus: null,
        projectTypeName: null,
        projectModalityName: null,
    };

    // Build upcoming events (unified calendar + kanban)
    const upcomingItems: UpcomingEventItem[] = [];
    if (calendarResult.data) {
        for (const e of calendarResult.data) {
            upcomingItems.push({
                id: e.id,
                title: e.title,
                date: e.start_at,
                type: 'calendar',
                color: e.color,
                isAllDay: e.is_all_day,
                priority: null,
                projectName: (e as any).projects?.name || null,
            });
        }
    }
    if (kanbanResult.data) {
        for (const c of kanbanResult.data) {
            upcomingItems.push({
                id: c.id,
                title: c.title,
                date: c.due_date!,
                type: 'kanban',
                color: null,
                isAllDay: true,
                priority: c.priority,
                projectName: null,
            });
        }
    }
    upcomingItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Pass raw movements for client-side KPI calculation via useMoney
    const rawMovements: FinancialMovementRaw[] = (financialResult.data || []).map((m: any) => ({
        amount: Number(m.amount) || 0,
        currency_code: m.currency_code || '',
        exchange_rate: m.exchange_rate != null ? Number(m.exchange_rate) : null,
        amount_sign: Number(m.amount_sign) || 0,
        payment_date: m.payment_date || null,
    }));

    // Build storage overview data
    const storageFiles = storageFilesResult.data || [];
    let storageTotalBytes = 0;
    const storageTypeAgg: Record<string, { count: number; bytes: number }> = {};
    for (const row of storageFiles) {
        const size = Number(row.file_size) || 0;
        storageTotalBytes += size;
        const type = row.file_type || 'other';
        if (!storageTypeAgg[type]) storageTypeAgg[type] = { count: 0, bytes: 0 };
        storageTypeAgg[type].count++;
        storageTypeAgg[type].bytes += size;
    }

    const maxStorageMb = (() => {
        const pf = orgPlan?.plan_features;
        if (!pf) return 500;
        const pfObj = Array.isArray(pf) ? pf[0] : pf;
        return pfObj?.max_storage_mb ?? 500;
    })();

    return {
        activity_kpi: (activityResult.data || []) as ActivityFeedItem[],
        org_recent_projects: (projectsResult.data || []) as RecentProject[],
        org_pulse: pulseData,
        upcoming_events: upcomingItems.slice(0, 8),
        financial_summary: rawMovements,
        team_members: (teamMembersResult.data || []).map((m: any) => ({
            id: m.id,
            user_full_name: m.users?.full_name || null,
            user_avatar_url: m.users?.avatar_url || null,
            user_email: m.users?.email || null,
            role_name: m.roles?.name || null,
            last_active_at: m.users?.user_presence?.last_seen_at || null,
        })).sort((a: any, b: any) => {
            // Sort: most recently active first, nulls last
            if (!a.last_active_at && !b.last_active_at) return 0;
            if (!a.last_active_at) return 1;
            if (!b.last_active_at) return -1;
            return new Date(b.last_active_at).getTime() - new Date(a.last_active_at).getTime();
        }),
        org_storage_overview: {
            totalBytes: storageTotalBytes,
            fileCount: storageFiles.length,
            folderCount: storageFoldersResult.count || 0,
            maxStorageMb,
            byType: Object.entries(storageTypeAgg)
                .map(([type, agg]) => ({ type, ...agg }))
                .sort((a, b) => b.bytes - a.bytes),
        } as StorageOverviewData,
    };
}

// ============================================================================
// DASHBOARD LAYOUT PERSISTENCE
// ============================================================================
// Persists widget grid configuration (positions, sizes, configs) per user
// per organization in the dashboard_layouts table.
// ============================================================================

/**
 * Get the saved dashboard layout for the current user + active org.
 * Returns null if no custom layout exists (caller should use DEFAULT_ORG_LAYOUT).
 */
export async function getDashboardLayout(
    layoutKey: string = 'org_dashboard'
): Promise<any[] | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Get public user ID + active org in one query
    const { data: userData } = await supabase
        .from('users')
        .select(`id, user_preferences!inner(last_organization_id)`)
        .eq('auth_id', user.id)
        .single();

    if (!userData) return null;

    const pref = Array.isArray(userData.user_preferences)
        ? (userData.user_preferences as any)[0]
        : (userData.user_preferences as any);
    const orgId = pref?.last_organization_id;
    if (!orgId) return null;

    const { data } = await supabase
        .from('dashboard_layouts')
        .select('layout_data')
        .eq('user_id', userData.id)
        .eq('organization_id', orgId)
        .eq('layout_key', layoutKey)
        .single();

    return data?.layout_data || null;
}

/**
 * Save the dashboard layout for the current user + active org.
 * Uses upsert on the unique constraint (user_id, organization_id, layout_key).
 */
export async function saveDashboardLayout(
    layoutKey: string,
    layoutData: any[]
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // Get public user ID + active org
    const { data: userData } = await supabase
        .from('users')
        .select(`id, user_preferences!inner(last_organization_id)`)
        .eq('auth_id', user.id)
        .single();

    if (!userData) return { success: false, error: 'User not found' };

    const pref = Array.isArray(userData.user_preferences)
        ? (userData.user_preferences as any)[0]
        : (userData.user_preferences as any);
    const orgId = pref?.last_organization_id;
    if (!orgId) return { success: false, error: 'No active organization' };

    const { error } = await supabase
        .from('dashboard_layouts')
        .upsert({
            user_id: userData.id,
            organization_id: orgId,
            layout_key: layoutKey,
            layout_data: layoutData,
            updated_at: new Date().toISOString(),
        }, {
            onConflict: 'user_id, organization_id, layout_key',
        });

    if (error) {
        console.error('[saveDashboardLayout] Error:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// ============================================================================
// OVERVIEW HERO DATA (for OverviewHeroWidget)
// ============================================================================
// Replaces the client-side fetchHeroData() with duplicated queries.
// Single server action for both org mode and project mode.
// ============================================================================

export interface OverviewHeroData {
    name: string;
    avatarUrl: string | null;
    planName: string | null;
    planSlug: string | null;
    isFounder: boolean;
    memberCount: number;
    projectCount: number;
    projectLocations: {
        id: string;
        name: string;
        status: string;
        lat: number;
        lng: number;
        city: string | null;
        country: string | null;
        address: string | null;
        imageUrl: string | null;
    }[];
    members: { name: string; image: string | null; email?: string }[];
    isProjectMode: boolean;
    projectStatus: string | null;
    projectTypeName: string | null;
    projectModalityName: string | null;
}

/**
 * Fetches hero data for the OverviewHeroWidget.
 * Supports org mode (overview of all projects) and project mode (single project focus).
 */
export async function getOverviewHeroData(
    projectId?: string | null
): Promise<OverviewHeroData | null> {
    try {
        const orgId = await getActiveOrganizationId();
        if (!orgId) return null;

        const supabase = await createClient();

        if (projectId) {
            // ── PROJECT MODE ──
            const [projectResult, locationResult, membersAvatarResult] = await Promise.all([
                supabase.from("projects")
                    .select("id, name, image_url, status, project_types(name), project_modalities(name)")
                    .eq("id", projectId)
                    .single(),
                supabase.from("project_data")
                    .select("lat, lng, city, country, address")
                    .eq("project_id", projectId)
                    .single(),
                supabase.from("organization_members")
                    .select("users(full_name, avatar_url, email)")
                    .eq("organization_id", orgId)
                    .eq("is_active", true)
                    .limit(8),
            ]);

            const project = projectResult.data as any;
            const locData = locationResult.data as any;
            const projectLocations: OverviewHeroData['projectLocations'] = [];
            if (locData?.lat && locData?.lng) {
                projectLocations.push({
                    id: project?.id || projectId,
                    name: project?.name || "Proyecto",
                    status: project?.status || "active",
                    lat: Number(locData.lat),
                    lng: Number(locData.lng),
                    city: locData.city,
                    country: locData.country,
                    address: locData.address || null,
                    imageUrl: project?.image_url || null,
                });
            }

            const membersForStack = (membersAvatarResult?.data || [])
                .filter((m: any) => m.users)
                .map((m: any) => ({ name: m.users.full_name || "Member", image: m.users.avatar_url || null, email: m.users.email || undefined }));

            const statusMap: Record<string, string> = { active: 'Activo', planning: 'Planificación', paused: 'Pausado', completed: 'Completado', cancelled: 'Cancelado' };

            return {
                name: project?.name || "Proyecto",
                avatarUrl: project?.image_url || null,
                planName: null, planSlug: null, isFounder: false, memberCount: 0, projectCount: 0,
                projectLocations,
                members: membersForStack,
                isProjectMode: true,
                projectStatus: statusMap[(project?.status || 'active').toLowerCase()] || project?.status || null,
                projectTypeName: project?.project_types?.name || null,
                projectModalityName: project?.project_modalities?.name || null,
            };
        }

        // ── ORGANIZATION MODE ──
        const [orgResult, membersResult, projectCountResult, locationsResult, membersAvatarResult] = await Promise.all([
            supabase.from("organizations")
                .select("name, logo_url, settings, plan_id")
                .eq("id", orgId)
                .single(),
            supabase.from("organization_members")
                .select("id", { count: "exact", head: true })
                .eq("organization_id", orgId)
                .eq("is_active", true),
            supabase.from("projects")
                .select("id", { count: "exact", head: true })
                .eq("organization_id", orgId)
                .eq("is_deleted", false),
            supabase.from("project_data")
                .select("lat, lng, city, country, address, projects!inner(id, name, status, is_deleted, image_url)")
                .eq("organization_id", orgId)
                .not("lat", "is", null)
                .not("lng", "is", null),
            supabase.from("organization_members")
                .select("users(full_name, avatar_url, email)")
                .eq("organization_id", orgId)
                .eq("is_active", true)
                .limit(8),
        ]);

        const orgData = orgResult.data as any;

        // Fetch plan from billing schema separately (cross-schema FK can't be embedded)
        let orgPlan: { name: string; slug: string } | null = null;
        if (orgData?.plan_id) {
            const { data: planData } = await supabase
                .schema('billing').from('plans')
                .select('name, slug')
                .eq('id', orgData.plan_id)
                .single();
            orgPlan = planData;
        }

        const projectLocations = (locationsResult.data || [])
            .filter((pd: any) => pd.projects && !pd.projects.is_deleted)
            .map((pd: any) => {
                const p = pd.projects;
                return {
                    id: p.id, name: p.name, status: p.status,
                    lat: Number(pd.lat), lng: Number(pd.lng),
                    city: pd.city, country: pd.country,
                    address: pd.address || null,
                    imageUrl: p.image_url || null,
                };
            });

        const membersForStack = (membersAvatarResult?.data || [])
            .filter((m: any) => m.users)
            .map((m: any) => ({ name: m.users.full_name || "Member", image: m.users.avatar_url || null, email: m.users.email || undefined }));

        return {
            name: orgData?.name || "Organización",
            avatarUrl: orgData?.logo_url || null,
            planName: orgPlan?.name || null,
            planSlug: orgPlan?.slug || null,
            isFounder: (orgData?.settings as any)?.is_founder === true,
            memberCount: membersResult.count || 0,
            projectStatus: null,
            projectTypeName: null,
            projectModalityName: null,
            projectCount: projectCountResult.count || 0,
            projectLocations,
            members: membersForStack,
            isProjectMode: false,
        };
    } catch (error) {
        console.error('[getOverviewHeroData] Error:', error);
        return null;
    }
}
