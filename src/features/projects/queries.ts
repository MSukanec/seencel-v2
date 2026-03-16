import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { parseDateFromDB } from "@/lib/timezone-data";
import { Project } from "@/types/project";

export async function getLastActiveProject(organizationId: string) {
    const authUser = await getAuthUser();

    if (!authUser) return null;

    const supabase = await createClient();

    // Get PUBLIC user ID from users table
    const { data: userData } = await supabase
        .schema('iam').from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();

    if (!userData) return null;

    const { data } = await supabase
        .schema('iam').from('user_organization_preferences')
        .select('last_project_id')
        .eq('user_id', userData.id)
        .eq('organization_id', organizationId)
        .single();

    return data?.last_project_id || null;
}

export async function getOrganizationProjects(organizationId: string) {
    const supabase = await createClient();

    // Select from the view provided by user
    const { data, error } = await supabase
        .schema('projects').from('projects_view')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .order('last_active_at', { ascending: false, nullsFirst: false }); // Most recently active first, NULLs last

    if (error) {
        console.error('Error fetching projects:', error);
        return [];
    }

    return data as Project[];
}

/**
 * Returns only ACTIVE projects for use in form selectors.
 * Used by ActiveProjectField and any form that needs to assign a project.
 */
export async function getActiveOrganizationProjects(organizationId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('projects').from('projects_view')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .eq('status', 'active')
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching active projects:', error);
        return [];
    }

    return data as Project[];
}

export async function getSidebarProjects(organizationId: string) {
    const supabase = await createClient();

    // Use projects_view which joins project_settings for color fields
    const { data, error } = await supabase
        .schema('projects').from('projects_view')
        .select('id, name, status, organization_id, color, custom_color_hex, use_custom_color, image_url, image_palette, use_palette_theme')
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .neq('status', 'completed')
        .order('last_active_at', { ascending: false, nullsFirst: false });

    if (error) {
        console.error('Error fetching sidebar projects:', error);
        return [];
    }

    return data;
}

/**
 * Cached per-request: getProjectById is called from both generateMetadata
 * and the page component. React.cache ensures a single DB call per request.
 */
export const getProjectById = cache(async (projectId: string) => {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('projects').from('projects')
        .select(`
            *,
            project_data (*),
            project_settings (*),
            project_types (id, name),
            project_modalities (id, name)
        `)
        .eq('id', projectId)
        .eq('is_deleted', false)
        .single();

    if (error) {
        console.error('Error fetching project:', error);
        return null;
    }

    return data;
});

export async function getProjectFinancialMovements(projectId: string) {
    const supabase = await createClient();

    // First get the project to know its organization
    const { data: project } = await supabase
        .schema('projects').from('projects')
        .select('organization_id')
        .eq('id', projectId)
        .single();

    const { data, error } = await supabase
        .schema('finance').from('unified_financial_movements_view')
        .select('*')
        .eq('project_id', projectId)
        .order('payment_date', { ascending: false });

    // Fetch Wallets for mapping using the view (has proper RLS)
    const { data: wallets } = await supabase
        .from('organization_wallets_view')
        .select('id, wallet_name')
        .eq('organization_id', project?.organization_id || '');

    if (error) {
        console.error("Error fetching project financial movements:", error);
        return { error: "Failed to fetch financial data." };
    }

    return {
        movements: data || [],
        wallets: (wallets || []).map(w => ({ id: w.id, name: w.wallet_name }))
    };
}

// ============================================================================
// LOCATION QUERIES
// ============================================================================

export interface ProjectLocation {
    id: string;
    name: string;
    status: string;
    lat: number;
    lng: number;
    city: string | null;
    country: string | null;
    state: string | null;
    address: string | null;
    zipCode: string | null;
    placeId: string | null;
    imageUrl: string | null;
    code: string | null;
    year: number | null;
}

/**
 * Fetches all projects with location data (lat/lng) for the map view.
 * Excludes soft-deleted projects.
 */
export async function getProjectLocations(organizationId: string): Promise<ProjectLocation[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('projects')
        .from("project_data")
        .select("lat, lng, city, country, address, state, zip_code, place_id, projects!inner(id, name, status, is_deleted, image_url, code, created_at)")
        .eq("organization_id", organizationId)
        .not("lat", "is", null)
        .not("lng", "is", null);

    if (error) throw error;

    return (data || [])
        .filter((pd: any) => pd.projects && !pd.projects.is_deleted)
        .map((pd: any) => {
            const p = pd.projects;
            return {
                id: p.id,
                name: p.name,
                status: p.status,
                lat: Number(pd.lat),
                lng: Number(pd.lng),
                city: pd.city || null,
                country: pd.country || null,
                state: pd.state || null,
                address: pd.address || null,
                zipCode: pd.zip_code || null,
                placeId: pd.place_id || null,
                imageUrl: p.image_url || null,
                code: p.code || null,
                year: p.created_at ? parseDateFromDB(p.created_at)?.getFullYear() ?? null : null,
            };
        });
}
