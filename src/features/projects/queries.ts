import { createClient } from "@/lib/supabase/server";
import { Project } from "@/types/project";

export async function getLastActiveProject(organizationId: string) {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) return null;

    // Get PUBLIC user ID from users table
    const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();

    if (!userData) return null;

    const { data } = await supabase
        .from('user_organization_preferences')
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
        .from('projects_view')
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
        .from('projects_view')
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
        .from('projects_view')
        .select('id, name, status, organization_id, color, custom_color_hex, use_custom_color, image_url')
        .eq('organization_id', organizationId)
        .neq('status', 'completed')
        .order('last_active_at', { ascending: false, nullsFirst: false });

    if (error) {
        console.error('Error fetching sidebar projects:', error);
        return [];
    }

    return data;
}

export async function getProjectById(projectId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('projects')
        .select(`
            *,
            project_data (*)
        `)
        .eq('id', projectId)
        .single();

    if (error) {
        console.error('Error fetching project:', error);
        return null;
    }

    return data;
}

export async function getProjectFinancialMovements(projectId: string) {
    const supabase = await createClient();

    // First get the project to know its organization
    const { data: project } = await supabase
        .from('projects')
        .select('organization_id')
        .eq('id', projectId)
        .single();

    const { data, error } = await supabase
        .from('unified_financial_movements_view')
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



