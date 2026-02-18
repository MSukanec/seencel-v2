"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ===============================================
// Link Collaborator to Project
// (auto-creates external actor if needed)
// ===============================================

export async function linkCollaboratorToProjectAction(input: {
    project_id: string;
    organization_id: string;
    user_id: string;
    access_type?: string;
    access_level?: string;
    client_id?: string | null;
}) {
    const supabase = await createClient();

    // Auto-create external actor if not exists
    const { data: existingActor } = await supabase
        .from("organization_external_actors")
        .select("id, is_active, is_deleted")
        .eq("organization_id", input.organization_id)
        .eq("user_id", input.user_id)
        .maybeSingle();

    if (!existingActor) {
        // Create new external actor
        const { error: actorError } = await supabase
            .from("organization_external_actors")
            .insert({
                organization_id: input.organization_id,
                user_id: input.user_id,
                actor_type: input.access_type === "client" ? "client" : "field_worker",
                is_active: true,
            });

        if (actorError) {
            console.error("Error auto-creating external actor:", actorError);
            // Non-blocking: continue with project_access creation
        }
    } else if (!existingActor.is_active || existingActor.is_deleted) {
        // Reactivate existing actor
        const { error: reactivateError } = await supabase
            .from("organization_external_actors")
            .update({
                is_active: true,
                is_deleted: false,
                deleted_at: null,
                actor_type: input.access_type === "client" ? "client" : "field_worker",
                updated_at: new Date().toISOString(),
            })
            .eq("id", existingActor.id);

        if (reactivateError) {
            console.error("Error reactivating external actor:", reactivateError);
        }
    }

    // Create project access
    const { data, error } = await supabase
        .from("project_access")
        .insert({
            project_id: input.project_id,
            organization_id: input.organization_id,
            user_id: input.user_id,
            access_type: input.access_type || "external",
            access_level: input.access_level || "viewer",
            client_id: input.client_id || null,
        })
        .select()
        .single();

    if (error) {
        console.error("Error linking collaborator:", error);
        if (error.code === "23505") {
            throw new Error("Este colaborador ya está vinculado a este proyecto.");
        }
        throw new Error("Error al vincular el colaborador.");
    }

    revalidatePath("/organization/projects");
    return data;
}

// ===============================================
// Invite Contact to Project (no Seencel account)
// Uses the existing invitation system
// ===============================================

export async function inviteContactToProjectAction(input: {
    project_id: string;
    organization_id: string;
    contact_id: string;
    email: string;
    contact_name: string;
    access_type?: string;
    client_id?: string | null;
}) {
    // Delegate to addExternalCollaboratorAction with project context
    // This is imported dynamically to avoid circular dependencies
    const { addExternalCollaboratorWithProjectAction } = await import("@/features/team/actions");

    return addExternalCollaboratorWithProjectAction({
        organizationId: input.organization_id,
        email: input.email,
        actorType: input.access_type === "client" ? "client" : "field_worker",
        projectId: input.project_id,
        clientId: input.client_id || null,
    });
}

// ===============================================
// Unlink Collaborator from Project (soft delete)
// ===============================================

export async function unlinkCollaboratorFromProjectAction(accessId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("project_access")
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            is_active: false,
        })
        .eq("id", accessId);

    if (error) {
        console.error("Error unlinking collaborator:", error);
        throw new Error("Error al desvincular el colaborador.");
    }

    revalidatePath("/organization/projects");
}

