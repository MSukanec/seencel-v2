"use server";

import { createClient } from "@/lib/supabase/server";
import { OrganizationExternalActor } from "./types";

/**
 * Obtiene todos los actores externos de una organización.
 */
export async function getExternalActorsByOrganization(organizationId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("organization_external_actors")
        .select(`
            *,
            user:users(id, full_name, email, avatar_url)
        `)
        .eq("organization_id", organizationId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching external actors:", error);
        return { data: [], error };
    }

    return { data: data || [], error: null };
}

/**
 * Obtiene el acceso de actor externo del usuario autenticado.
 * Retorna las organizaciones y tipos a los que tiene acceso.
 * Reemplaza la antigua getMyClientPortals().
 */
export async function getMyExternalActorAccess() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { data: [], error: "No authenticated user" };
    }

    // Resolver users.id desde auth_id
    const { data: userData } = await supabase
        .schema('iam').from("users")
        .select("id")
        .eq("auth_id", user.id)
        .single();

    if (!userData) {
        return { data: [], error: "User not found" };
    }

    const { data, error } = await supabase
        .from("organization_external_actors")
        .select(`
            id,
            organization_id,
            actor_type,
            is_active,
            organization:organizations(id, name, logo_url)
        `)
        .eq("user_id", userData.id)
        .eq("is_deleted", false)
        .eq("is_active", true);

    if (error) {
        console.error("Error fetching external actor access:", error);
        return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
}

/**
 * Obtiene un actor externo específico por ID.
 */
export async function getExternalActorById(actorId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("organization_external_actors")
        .select(`
            *,
            user:users(id, full_name, email, avatar_url)
        `)
        .eq("id", actorId)
        .eq("is_deleted", false)
        .single();

    if (error) {
        console.error("Error fetching external actor:", error);
        return { data: null, error };
    }

    return { data, error: null };
}
