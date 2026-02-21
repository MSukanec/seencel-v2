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

    // Auto-create actor record based on type:
    // - Clients → iam.organization_clients (separated domain)
    // - Collaborators → organization_external_actors (legacy)
    const isClient = input.access_type === "client";

    if (isClient) {
        // Use iam.organization_clients for client actors
        // TODO: Remove 'as any' after running npm run db:schema to regenerate types
        const { data: existingClient } = await supabase
            .from("organization_clients" as any)
            .select("id, is_active, is_deleted")
            .eq("organization_id", input.organization_id)
            .eq("user_id", input.user_id)
            .maybeSingle();

        if (!existingClient) {
            const { error: clientError } = await supabase
                .from("organization_clients" as any)
                .insert({
                    organization_id: input.organization_id,
                    user_id: input.user_id,
                    is_active: true,
                });

            if (clientError) {
                console.error("Error auto-creating organization client:", clientError);
            }
        } else if (!existingClient.is_active || existingClient.is_deleted) {
            const { error: reactivateError } = await supabase
                .from("organization_clients" as any)
                .update({
                    is_active: true,
                    is_deleted: false,
                    deleted_at: null,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", existingClient.id);

            if (reactivateError) {
                console.error("Error reactivating organization client:", reactivateError);
            }
        }
    } else {
        // Use organization_external_actors for collaborators
        const { data: existingActor } = await supabase
            .from("organization_external_actors")
            .select("id, is_active, is_deleted")
            .eq("organization_id", input.organization_id)
            .eq("user_id", input.user_id)
            .maybeSingle();

        if (!existingActor) {
            const { error: actorError } = await supabase
                .from("organization_external_actors")
                .insert({
                    organization_id: input.organization_id,
                    user_id: input.user_id,
                    actor_type: "field_worker",
                    is_active: true,
                });

            if (actorError) {
                console.error("Error auto-creating external actor:", actorError);
            }
        } else if (!existingActor.is_active || existingActor.is_deleted) {
            const { error: reactivateError } = await supabase
                .from("organization_external_actors")
                .update({
                    is_active: true,
                    is_deleted: false,
                    deleted_at: null,
                    actor_type: "field_worker",
                    updated_at: new Date().toISOString(),
                })
                .eq("id", existingActor.id);

            if (reactivateError) {
                console.error("Error reactivating external actor:", reactivateError);
            }
        }
    }

    // Create project access
    const { data, error } = await supabase
        .schema('iam').from("project_access")
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
// Delete Collaborator Access (soft delete - disappears from list)
// ===============================================

export async function unlinkCollaboratorFromProjectAction(accessId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .schema('iam').from("project_access")
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            is_active: false,
        })
        .eq("id", accessId);

    if (error) {
        console.error("Error deleting collaborator access:", error);
        throw new Error("Error al eliminar el colaborador.");
    }

    revalidatePath("/organization/projects");
}

// ===============================================
// Deactivate Collaborator Access (revoke but keep as historical)
// ===============================================

export async function deactivateCollaboratorAccessAction(accessId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .schema('iam').from("project_access")
        .update({ is_active: false })
        .eq("id", accessId);

    if (error) {
        console.error("Error deactivating collaborator access:", error);
        throw new Error("Error al desvincular el colaborador.");
    }

    revalidatePath("/organization/projects");
}

// ===============================================
// Reactivate Collaborator Access
// ===============================================

export async function reactivateCollaboratorAccessAction(accessId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .schema('iam').from("project_access")
        .update({ is_active: true })
        .eq("id", accessId);

    if (error) {
        console.error("Error reactivating collaborator access:", error);
        throw new Error("Error al reactivar el colaborador.");
    }

    revalidatePath("/organization/projects");
}

