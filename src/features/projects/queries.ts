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



