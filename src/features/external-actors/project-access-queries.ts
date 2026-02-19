"use server";

import { createClient } from "@/lib/supabase/server";

// ==========================================
// Types
// ==========================================

export interface ProjectAccessView {
    id: string;
    project_id: string;
    organization_id: string;
    user_id: string;
    access_type: string;
    access_level: string;
    granted_by: string | null;
    client_id: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
    // User info
    user_full_name: string | null;
    user_email: string | null;
    user_avatar_url: string | null;
    // Contact info
    contact_id: string | null;
    contact_full_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    contact_company_name: string | null;
    contact_image_url: string | null;
    // Resolved
    resolved_avatar_url: string | null;
    granted_by_name: string | null;
    client_name: string | null;
}

// ==========================================
// Queries
// ==========================================

/**
 * Obtiene los colaboradores vinculados a un proyecto.
 * Lee de project_access_view (external actors con acceso explícito).
 */
export async function getProjectCollaborators(projectId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("project_access_view")
        .select("*")
        .eq("project_id", projectId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching project collaborators:", error);
        return { data: [] as ProjectAccessView[], error };
    }

    return { data: (data || []) as ProjectAccessView[], error: null };
}

/**
 * Obtiene los external actors de la org que NO están vinculados a este proyecto.
 * Útil para el selector "Vincular Colaborador".
 */
export async function getAvailableCollaborators(organizationId: string, projectId: string) {
    const supabase = await createClient();

    // 1. Get external actors of the org
    const { data: externalActors, error: eaError } = await supabase
        .from("organization_external_actors")
        .select(`
            id,
            user_id,
            actor_type,
            user:users(id, full_name, email, avatar_url)
        `)
        .eq("organization_id", organizationId)
        .eq("is_deleted", false)
        .eq("is_active", true);

    if (eaError || !externalActors) {
        console.error("Error fetching external actors:", eaError);
        return { data: [], error: eaError };
    }

    // 2. Get user_ids already linked to this project
    const { data: existingAccess } = await supabase
        .from("project_access")
        .select("user_id")
        .eq("project_id", projectId)
        .eq("is_deleted", false);

    const linkedUserIds = new Set((existingAccess || []).map((a) => a.user_id));

    // 3. Filter: only actors NOT already linked
    const available = externalActors.filter(
        (actor) => !linkedUserIds.has(actor.user_id)
    );

    return { data: available, error: null };
}
