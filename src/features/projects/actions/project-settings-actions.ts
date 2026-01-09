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

        .order('name');

    if (error) {
        console.error("Error fetching project types:", error);
        return [];
    }

    if (data) {
        data.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
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


    if (!organizationId) return { error: "Organization ID is required" };

    const { data, error } = await supabase
        .from('project_types')
        .insert({
            name,
            organization_id: organizationId,
            created_by: memberData?.id || null,
            is_system: false // Force user types to be non-system
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

export async function deleteProjectType(id: string, replacementId?: string) {
    const supabase = await createClient();

    try {
        // 1. If replacement selected, migrate projects first
        if (replacementId) {
            const { error: updateError } = await supabase
                .from('projects')
                .update({ project_type_id: replacementId })
                .eq('project_type_id', id);

            if (updateError) throw updateError;
        }

        // 2. Soft delete the type
        const { error } = await supabase
            .from('project_types')
            .update({ is_deleted: true, deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/organization/projects');
        return { success: true };
    } catch (e: any) {
        console.error("Error deleting project type:", e);
        return { error: e.message };
    }
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
        .order('name');

    if (error) {
        console.error("Error fetching project modalities:", error);
        return [];
    }

    if (data) {
        data.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
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


    if (!organizationId) return { error: "Organization ID is required" };

    const { data, error } = await supabase
        .from('project_modalities')
        .insert({
            name,
            organization_id: organizationId,
            created_by: memberData?.id || null,
            is_system: false // Force user modalities to be non-system
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

export async function deleteProjectModality(id: string, replacementId?: string) {
    const supabase = await createClient();

    try {
        // 1. If replacement selected, migrate projects first
        if (replacementId) {
            const { error: updateError } = await supabase
                .from('projects')
                .update({ project_modality_id: replacementId })
                .eq('project_modality_id', id);

            if (updateError) throw updateError;
        }

        // 2. Soft delete the modality
        const { error } = await supabase
            .from('project_modalities')
            .update({ is_deleted: true, deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/organization/projects');
        return { success: true };
    } catch (e: any) {
        console.error("Error deleting project modality:", e);
        return { error: e.message };
    }
}
