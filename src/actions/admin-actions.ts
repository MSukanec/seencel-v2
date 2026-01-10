"use server";

import { createClient } from "@/lib/supabase/server";
import { OrganizationActivityLog } from "@/types/organization";
import { getStorageUrl } from "@/lib/storage-utils";

// Extended type for admin view (includes organization name and logo)
export interface AdminActivityLog extends OrganizationActivityLog {
    organization_name: string | null;
    organization_logo_url: string | null;
}

/**
 * Get ALL activity logs across ALL organizations (admin only)
 * RLS will enforce that only admins can access this
 */
export async function getAllActivityLogs(limit: number = 200): Promise<AdminActivityLog[]> {
    const supabase = await createClient();

    // First, get all logs from the view
    const { data: logs, error: logsError } = await supabase
        .from('organization_activity_logs_view')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (logsError) {
        console.error("Error fetching all activity logs:", logsError);
        return [];
    }

    if (!logs || logs.length === 0) return [];

    // Get unique org IDs and fetch org info
    const orgIds = [...new Set(logs.map(l => l.organization_id))];
    const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name, logo_path')
        .in('id', orgIds);

    // Create a map for quick lookup
    const orgMap = new Map((orgs || []).map(o => [o.id, o]));

    // Helper to build logo URL from path (same pattern as organizations-table.tsx)
    const buildLogoUrl = (logoPath: string | null): string | null => {
        if (!logoPath) return null;
        const path = logoPath.startsWith('organizations/') ? logoPath : `organizations/${logoPath}`;
        return getStorageUrl(path, 'public-assets');
    };

    // Transform the data
    return logs.map(log => ({
        ...log,
        organization_name: orgMap.get(log.organization_id)?.name || null,
        organization_logo_url: buildLogoUrl(orgMap.get(log.organization_id)?.logo_path || null)
    })) as AdminActivityLog[];
}


