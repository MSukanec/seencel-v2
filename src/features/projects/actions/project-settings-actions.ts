"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============================================================================
// PROJECT TYPES
// ============================================================================

export async function getProjectTypes(organizationId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('project_types')
        .select('*')
        .or(`organization_id.eq.${organizationId},organization_id.is.null`)
        .eq('is_deleted', false)
        .order('is_system', { ascending: false })
        .order('name');

    if (error) {
        console.error("Error fetching project types:", error);
        return [];
    }

    return data || [];
}

export async function createProjectType(
    organizationId: string,
    name: string
) {
    const supabase = await createClient();

    // Get user ID for created_by
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { error: "Not authenticated" };

    // Get public user -> organization member ID
    const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();

    if (!userData) return { error: "User not found" };

    const { data: memberData } = await supabase
        .from('organization_members')
        .select('id')
        .eq('user_id', userData.id)
        .eq('organization_id', organizationId)
        .single();


    const { data, error } = await supabase
        .from('project_types')
        .insert({
            name,
            organization_id: organizationId,
            created_by: memberData?.id || null
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating project type:", error);
        return { error: error.message };
    }

    revalidatePath('/organization/projects');
    return { data };
}

export async function updateProjectType(
    id: string,
    organizationId: string,
    name: string
) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('project_types')
        .update({ name })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error("Error updating project type:", error);
        return { error: error.message };
    }

    revalidatePath('/organization/projects');
    return { data };
}

export async function deleteProjectType(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('project_types')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', id);

    if (error) {
        console.error("Error deleting project type:", error);
        return { error: error.message };
    }

    revalidatePath('/organization/projects');
    return { success: true };
}

// ============================================================================
// PROJECT MODALITIES
// ============================================================================

export async function getProjectModalities(organizationId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('project_modalities')
        .select('*')
        .or(`organization_id.eq.${organizationId},organization_id.is.null`)
        .eq('is_deleted', false)
        .order('is_system', { ascending: false })
        .order('name');

    if (error) {
        console.error("Error fetching project modalities:", error);
        return [];
    }

    return data || [];
}

export async function createProjectModality(
    organizationId: string,
    name: string
) {
    const supabase = await createClient();

    // Get user ID for created_by
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { error: "Not authenticated" };

    // Get public user -> organization member ID
    const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();

    if (!userData) return { error: "User not found" };

    const { data: memberData } = await supabase
        .from('organization_members')
        .select('id')
        .eq('user_id', userData.id)
        .eq('organization_id', organizationId)
        .single();


    const { data, error } = await supabase
        .from('project_modalities')
        .insert({
            name,
            organization_id: organizationId,
            created_by: memberData?.id || null
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating project modality:", error);
        return { error: error.message };
    }

    revalidatePath('/organization/projects');
    return { data };
}

export async function updateProjectModality(
    id: string,
    organizationId: string,
    name: string
) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('project_modalities')
        .update({ name })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error("Error updating project modality:", error);
        return { error: error.message };
    }

    revalidatePath('/organization/projects');
    return { data };
}

export async function deleteProjectModality(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('project_modalities')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', id);

    if (error) {
        console.error("Error deleting project modality:", error);
        return { error: error.message };
    }

    revalidatePath('/organization/projects');
    return { success: true };
}
