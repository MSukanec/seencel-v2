"use server";


import { sanitizeError } from "@/lib/error-utils";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { completeOnboardingStep } from "@/features/onboarding/actions";

export async function saveLastActiveProject(projectId: string) {
    const supabase = await createClient();

    // Get current auth user
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    // Get PUBLIC user ID from users table
    const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();

    if (!userData) return;
    const publicUserId = userData.id;

    // Get project's organization
    const { data: project } = await supabase
        .from('projects')
        .select('organization_id')
        .eq('id', projectId)
        .single();

    if (!project) return;

    // Update project's last_active_at timestamp
    await supabase
        .from('projects')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', projectId);

    // Check if preference exists
    const { data: existingPref } = await supabase
        .from('user_organization_preferences')
        .select('id, user_id, organization_id')
        .eq('user_id', publicUserId)
        .eq('organization_id', project.organization_id)
        .single();

    if (existingPref) {
        // Update only last_project_id
        const { error } = await supabase
            .from('user_organization_preferences')
            .update({
                last_project_id: projectId,
                updated_at: new Date().toISOString()
            })
            .eq('id', existingPref.id);

        if (error) console.error("Error updating last active project:", JSON.stringify(error, null, 2));
    } else {
        // Insert new preference
        const { error } = await supabase
            .from('user_organization_preferences')
            .insert({
                user_id: publicUserId,
                organization_id: project.organization_id,
                last_project_id: projectId,
                updated_at: new Date().toISOString()
            });

        if (error) console.error("Error inserting last active project:", JSON.stringify(error, null, 2));
    }
}

export async function fetchLastActiveProject(organizationId: string) {
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

// Invalidate Cache attempt 4 (Full Rewrite)
export async function createProject(formData: FormData) {
    const supabase = await createClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { error: "Not authenticated" };

    const organizationId = formData.get("organization_id")?.toString();
    if (!organizationId) return { error: "Organization ID is required" };

    // Get public user ID
    const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();

    if (!userData) return { error: "User profile not found" };

    // Get Organization Member ID (Required for created_by FK)
    const { data: memberData } = await supabase
        .from('organization_members')
        .select('id')
        .eq('user_id', userData.id)
        .eq('organization_id', organizationId)
        .single();

    if (!memberData) return { error: "User is not a member of this organization" };

    // Image URL (Handled by Client Upload)
    const imageUrl = formData.get("image_url")?.toString() || null;

    // Image Palette (Extracted by Client)
    const imagePaletteRaw = formData.get("image_palette")?.toString();
    const imagePalette = imagePaletteRaw ? JSON.parse(imagePaletteRaw) : null;

    // Color (identity — stays in projects)
    const color = formData.get("color")?.toString() || null;

    // Color customization (goes to project_settings)
    const useCustomColor = formData.get("use_custom_color") === 'true';
    const customColorH = formData.get("custom_color_h") ? parseInt(formData.get("custom_color_h")!.toString()) : null;
    const customColorHex = formData.get("custom_color_hex")?.toString() || color;
    const usePaletteTheme = formData.get("use_palette_theme") === 'true';

    // Type and Modality
    const typeId = formData.get("project_type_id")?.toString() || null;
    const modalityId = formData.get("project_modality_id")?.toString() || null;

    // Validate name
    const projectName = formData.get("name")?.toString()?.trim();
    if (!projectName) return { error: "El nombre del proyecto es obligatorio." };

    // Prepare Insert Data (Projects Table — identity only)
    const projectData = {
        name: projectName,
        status: formData.get("status")?.toString() || "active",
        organization_id: organizationId,
        project_type_id: typeId,
        project_modality_id: modalityId,
        color: color,
        image_url: imageUrl,
        image_palette: imagePalette,
        created_by: memberData.id,
        last_active_at: new Date().toISOString()
    };

    const { data: newProject, error: insertError } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single();

    if (insertError) {
        console.error("Create Project Error:", insertError);
        return { error: sanitizeError(insertError) };
    }

    // Insert project_data
    const { error: dataError } = await supabase
        .from('project_data')
        .insert({
            project_id: newProject.id,
            organization_id: organizationId,
            updated_at: new Date().toISOString()
        });

    if (dataError) {
        console.error("Create Project Data Error:", dataError);
        // Non-critical
    }

    // Insert project_settings (color customization lives here)
    const { error: settingsError } = await supabase
        .from('project_settings')
        .insert({
            project_id: newProject.id,
            organization_id: organizationId,
            use_custom_color: useCustomColor,
            custom_color_h: customColorH,
            custom_color_hex: customColorHex,
            use_palette_theme: usePaletteTheme,
        });

    if (settingsError) {
        console.error("Create Project Settings Error:", settingsError);
        // Non-critical — defaults will apply
    }

    // Auto-activate the new project
    await saveLastActiveProject(newProject.id);

    // Mark onboarding step as completed (fire and forget)
    completeOnboardingStep('create_project').catch(() => { });

    revalidatePath(`/organization/projects`);
    return { success: true, data: newProject };
}

export async function updateProject(formData: FormData) {
    const supabase = await createClient();

    const projectId = formData.get("id")?.toString();
    if (!projectId) throw new Error("Project ID is required.");

    const organizationId = formData.get("organization_id")?.toString();

    // Fields for 'projects' table
    const projectFields: Record<string, any> = {};
    const name = formData.get("name");
    if (name) projectFields.name = name;

    const status = formData.get("status");
    if (status) projectFields.status = status;

    // 🚨 Validate active project limit when changing status to 'active'
    if (status === 'active' && organizationId) {
        const limitCheck = await checkActiveProjectLimit(organizationId, projectId);
        if (limitCheck && !limitCheck.allowed) {
            return {
                error: "ACTIVE_LIMIT_REACHED",
                limitInfo: {
                    currentCount: limitCheck.current_active_count,
                    maxAllowed: limitCheck.max_allowed,
                }
            };
        }
    }

    const typeId = formData.get("project_type_id");
    if (typeId) projectFields.project_type_id = typeId;

    const modalityId = formData.get("project_modality_id");
    if (modalityId) projectFields.project_modality_id = modalityId;

    const color = formData.get("color");
    if (color) {
        projectFields.color = color;
    }

    // Image URL (Client Upload)
    const imageUrl = formData.get("image_url")?.toString();
    if (imageUrl) {
        projectFields.image_url = imageUrl;
    }

    // Image Palette (Extracted by Client)
    const imagePaletteRaw = formData.get("image_palette")?.toString();
    if (imagePaletteRaw) {
        projectFields.image_palette = JSON.parse(imagePaletteRaw);
    }

    // Fields for 'project_settings' table (color customization)
    const settingsFields: Record<string, any> = {};

    const useCustomColor = formData.get("use_custom_color");
    if (useCustomColor !== null) settingsFields.use_custom_color = useCustomColor === 'true';

    const customColorH = formData.get("custom_color_h");
    if (customColorH) settingsFields.custom_color_h = parseInt(customColorH.toString());

    const customColorHex = formData.get("custom_color_hex");
    if (customColorHex) settingsFields.custom_color_hex = customColorHex.toString();
    else if (color) settingsFields.custom_color_hex = color.toString();

    const usePaletteTheme = formData.get("use_palette_theme");
    if (usePaletteTheme !== null) settingsFields.use_palette_theme = usePaletteTheme === 'true';


    // Fields for 'project_data' table
    const dataFields: Record<string, any> = {};

    // Helper to safely get string
    const getString = (key: string) => {
        const val = formData.get(key);
        return val ? val.toString() : null;
    };

    // Helper to safely get number
    const getNumber = (key: string) => {
        const val = formData.get(key);
        return val ? parseFloat(val.toString()) : null;
    };

    // Helper to safely get date
    const getDate = (key: string) => {
        const val = formData.get(key);
        return val ? val.toString() : null;
    };

    // Type/Modality moved to 'projects' table (projectFields), so NOT here.

    // Map other form fields
    const description = getString("description");
    if (description !== null) dataFields.description = description;

    // Surfaces
    const surface_total = getNumber("surface_total");
    if (surface_total !== null) dataFields.surface_total = surface_total;

    const surface_covered = getNumber("surface_covered");
    if (surface_covered !== null) dataFields.surface_covered = surface_covered;

    const surface_semi = getNumber("surface_semi");
    if (surface_semi !== null) dataFields.surface_semi = surface_semi;

    // Location
    const lat = getNumber("lat");
    if (lat !== null) dataFields.lat = lat;

    const lng = getNumber("lng");
    if (lng !== null) dataFields.lng = lng;

    const address = getString("address");
    if (address !== null) dataFields.address = address;

    const city = getString("city");
    if (city !== null) dataFields.city = city;

    const state = getString("state");
    if (state !== null) dataFields.state = state;

    const country = getString("country");
    if (country !== null) dataFields.country = country;

    const zip_code = getString("zip_code");
    if (zip_code !== null) dataFields.zip_code = zip_code;

    const place_id = getString("place_id");
    if (place_id !== null) dataFields.place_id = place_id;

    const address_full = getString("address_full");
    if (address_full !== null) dataFields.address_full = address_full;


    try {
        // 1. Update basic project info if changed
        if (Object.keys(projectFields).length > 0) {
            const { error: projectError } = await supabase
                .from("projects")
                .update(projectFields)
                .eq("id", projectId);

            if (projectError) throw projectError;
        }

        // 2. Upsert project_data
        if (Object.keys(dataFields).length > 0) {
            const { data: currentProject } = await supabase.from('projects').select('organization_id').eq('id', projectId).single();
            if (!currentProject) throw new Error("Project not found");

            const { error: dataError } = await supabase
                .from("project_data")
                .upsert({
                    project_id: projectId,
                    organization_id: currentProject.organization_id,
                    ...dataFields,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'project_id' });

            if (dataError) throw dataError;
        }

        // 3. Upsert project_settings (color customization)
        if (Object.keys(settingsFields).length > 0) {
            const { data: currentProject } = await supabase.from('projects').select('organization_id').eq('id', projectId).single();
            if (!currentProject) throw new Error("Project not found");

            const { error: settingsError } = await supabase
                .from("project_settings")
                .upsert({
                    project_id: projectId,
                    organization_id: currentProject.organization_id,
                    ...settingsFields,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'project_id' });

            if (settingsError) throw settingsError;
        }

        revalidatePath(`/project/${projectId}`);
        revalidatePath(`/project/${projectId}/details`);
        revalidatePath(`/organization/projects`);
        revalidatePath(`/organization/projects/${projectId}`);
        return { success: true };
    } catch (e: any) {
        console.error("Update Project Error:", e);
        return { error: sanitizeError(e) };
    }
}

// ============================================================================
// ACTIVE PROJECT LIMIT CHECK
// ============================================================================

/**
 * Calls the SQL function check_active_project_limit to verify if
 * the organization can activate another project.
 */
export async function checkActiveProjectLimit(
    organizationId: string,
    excludedProjectId?: string
): Promise<{ allowed: boolean; current_active_count: number; max_allowed: number } | null> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('check_active_project_limit', {
        p_organization_id: organizationId,
        p_excluded_project_id: excludedProjectId || null,
    });

    if (error) {
        console.error('Error checking active project limit:', error);
        return null; // Fail open — don't block the user if the check fails
    }

    return data as { allowed: boolean; current_active_count: number; max_allowed: number };
}

// ============================================================================
// SWAP PROJECT STATUS (Interchange)
// ============================================================================

/**
 * Swaps the status of two projects: deactivates one and activates another.
 * Used when the user is at the active project limit and wants to activate
 * a different project.
 */
export async function swapProjectStatus(
    projectToActivateId: string,
    projectToDeactivateId: string,
    deactivateToStatus: string = 'completed'
) {
    const supabase = await createClient();

    try {
        // 1. Deactivate the chosen project
        const { error: deactivateError } = await supabase
            .from('projects')
            .update({ status: deactivateToStatus })
            .eq('id', projectToDeactivateId);

        if (deactivateError) throw deactivateError;

        // 2. Activate the desired project
        const { error: activateError } = await supabase
            .from('projects')
            .update({ status: 'active' })
            .eq('id', projectToActivateId);

        if (activateError) throw activateError;

        revalidatePath('/organization/projects');
        return { success: true };
    } catch (e: any) {
        console.error('Error swapping project status:', e);
        return { error: sanitizeError(e) };
    }
}

export async function deleteProject(projectId: string) {
    const supabase = await createClient();

    try {
        const { error } = await supabase
            .from("projects")
            .update({
                is_deleted: true,
                deleted_at: new Date().toISOString()
            })
            .eq("id", projectId);

        if (error) throw error;

        revalidatePath("/organization/projects");
        return { success: true };
    } catch (e: any) {
        console.error("Delete Project Error:", e);
        return { error: sanitizeError(e) };
    }
}

// ============================================================================
// SIDEBAR PROJECTS (previously fetch-projects.ts)
// ============================================================================

import { getSidebarProjects } from "@/features/projects/queries";

export async function fetchProjectsAction(organizationId: string) {
    if (!organizationId) return [];
    try {
        const projects = await getSidebarProjects(organizationId);
        return projects;
    } catch (error) {
        console.error("Error fetching projects for selector:", error);
        return [];
    }
}

// ============================================================================
// PROJECT TYPES (previously project-settings-actions.ts)
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
        return { error: sanitizeError(error) };
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
        return { error: sanitizeError(error) };
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
        return { error: sanitizeError(e) };
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
        return { error: sanitizeError(error) };
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
        return { error: sanitizeError(error) };
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
        return { error: sanitizeError(e) };
    }
}

