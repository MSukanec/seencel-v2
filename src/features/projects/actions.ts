"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

export async function updateProject(formData: FormData) {
    const supabase = await createClient();

    const projectId = formData.get("id")?.toString();
    if (!projectId) throw new Error("Project ID is required.");

    // Fields for 'projects' table
    const projectFields: Record<string, any> = {};
    const name = formData.get("name");
    if (name) projectFields.name = name;

    // Status often lives on 'projects' directly in some schemas, or maybe strict
    const status = formData.get("status");
    if (status) projectFields.status = status;

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

    // Map form fields to DB columns
    const description = getString("description");
    if (description !== null) dataFields.description = description;

    const start_date = getDate("start_date");
    if (start_date) dataFields.start_date = start_date; // Depending on schema, might be on project or project_data. User said project_data.

    const end_date = getDate("end_date");
    if (end_date) dataFields.estimated_end = end_date;

    const internal_notes = getString("internal_notes");
    if (internal_notes !== null) dataFields.internal_notes = internal_notes;

    // Surfaces
    const surface_total = getNumber("surface_total");
    if (surface_total !== null) dataFields.surface_total = surface_total;

    const surface_covered = getNumber("surface_covered");
    if (surface_covered !== null) dataFields.surface_covered = surface_covered;

    const surface_semi = getNumber("surface_semi");
    if (surface_semi !== null) dataFields.surface_semi = surface_semi;

    // Client
    const client_name = getString("client_name");
    if (client_name !== null) dataFields.client_name = client_name;

    const contact_phone = getString("contact_phone");
    if (contact_phone !== null) dataFields.contact_phone = contact_phone;

    const email = getString("email");
    if (email !== null) dataFields.email = email;

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
        // We need organization_id. Usually passed or fetched. 
        // For upsert, we need key. 
        // If dataFields is empty, we skip, unless we want to ensure row exists.

        if (Object.keys(dataFields).length > 0) {
            // First we need to know the organization_id if we are inserting for the first time
            // Or we assume the row exists? 
            // Better to upsert. But we need org_id.
            // Let's fetch current project to get org_id if we rely on upsert without it? 
            // Actually, project_data PK is project_id.

            // Fetch org_id first to be safe for insert
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

        revalidatePath(`/project/${projectId}`);
        revalidatePath(`/project/${projectId}/details`);
        return { success: true };
    } catch (e: any) {
        console.error("Update Project Error:", e);
        return { error: e.message || "Failed to update project" };
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
        return { error: e.message || "Failed to delete project" };
    }
}
